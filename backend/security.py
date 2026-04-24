"""
ELEVATE Security Middleware & Utilities
Covers: Security headers, rate limiting, request size limits,
        input sanitization, audit logging, error handling.
"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import time
import re
import logging
from collections import defaultdict

logger = logging.getLogger("security")


# ── SECURITY HEADERS MIDDLEWARE ──
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add OWASP-recommended security headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob: https:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        )
        # Remove server fingerprint
        if "server" in response.headers:
            del response.headers["server"]
        return response


# ── RATE LIMITING MIDDLEWARE ──
class RateLimitStore:
    """In-memory rate limit tracker."""
    def __init__(self):
        self.requests = defaultdict(list)

    def is_limited(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        cutoff = now - window_seconds
        self.requests[key] = [t for t in self.requests[key] if t > cutoff]
        if len(self.requests[key]) >= max_requests:
            return True
        self.requests[key].append(now)
        return False

    def cleanup(self):
        """Remove stale entries (call periodically)."""
        now = time.time()
        stale_keys = [k for k, v in self.requests.items() if not v or v[-1] < now - 300]
        for k in stale_keys:
            del self.requests[k]


rate_store = RateLimitStore()

# Rate limit configs: (max_requests, window_seconds)
RATE_LIMITS = {
    "/api/auth/login": (5, 60),         # 5 login attempts per minute
    "/api/registrations": (3, 60),       # 3 registrations per minute
    "/api/auth/avatar": (5, 60),         # 5 uploads per minute
}

# General API rate limit
GENERAL_RATE_LIMIT = (60, 60)  # 60 requests per minute per IP


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = get_client_ip(request)
        path = request.url.path

        # Check endpoint-specific rate limits
        for pattern, (max_req, window) in RATE_LIMITS.items():
            if path.startswith(pattern):
                key = f"{client_ip}:{pattern}"
                if rate_store.is_limited(key, max_req, window):
                    logger.warning(f"Rate limit exceeded: {client_ip} on {pattern}")
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Too many requests. Please try again later."},
                    )
                break
        else:
            # General rate limit
            gen_key = f"{client_ip}:general"
            max_req, window = GENERAL_RATE_LIMIT
            if rate_store.is_limited(gen_key, max_req, window):
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."},
                )

        return await call_next(request)


# ── REQUEST SIZE LIMIT MIDDLEWARE ──
MAX_BODY_SIZE = 10 * 1024 * 1024  # 10MB max body

class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_BODY_SIZE:
            return JSONResponse(
                status_code=413,
                content={"detail": "Request body too large"},
            )
        return await call_next(request)


# ── AUDIT LOGGING MIDDLEWARE ──
class AuditLogMiddleware(BaseHTTPMiddleware):
    """Log auth events and sensitive operations."""

    AUDIT_PATHS = {"/api/auth/login", "/api/registrations", "/api/auth/avatar", "/api/auth/profile"}

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method
        client_ip = get_client_ip(request)

        response = await call_next(request)

        # Log auth and sensitive operations
        should_audit = any(path.startswith(p) for p in self.AUDIT_PATHS)
        if should_audit or (method in ("PUT", "POST", "DELETE") and "/api/admin/" in path):
            status = response.status_code
            level = logging.WARNING if status >= 400 else logging.INFO
            logger.log(level, f"AUDIT | {method} {path} | IP={client_ip} | Status={status}")

        # Log all failed auth attempts specifically
        if path == "/api/auth/login" and response.status_code == 401:
            logger.warning(f"FAILED_LOGIN | IP={client_ip}")

        return response


from starlette.exceptions import HTTPException as StarletteHTTPException

# ── GLOBAL ERROR HANDLER ──
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions — never expose stack traces."""
    if isinstance(exc, (HTTPException, StarletteHTTPException)):
        raise exc
    logger.error(f"Unhandled error: {type(exc).__name__}: {exc}", exc_info=False)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )


async def validation_exception_handler(request: Request, exc):
    """Return clean validation errors without leaking internal schema details."""
    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid request data. Please check your input."},
    )


# ── INPUT SANITIZATION ──
# Patterns that indicate NoSQL injection attempts
NOSQL_PATTERNS = [
    re.compile(r'\$(?:gt|gte|lt|lte|ne|in|nin|or|and|not|nor|exists|type|regex|where|expr)', re.I),
    re.compile(r'\{.*\$.*\}'),
]


def sanitize_string(value: str, max_length: int = 500) -> str:
    """Sanitize a string input: trim, limit length, strip dangerous patterns."""
    if not isinstance(value, str):
        return value
    value = value.strip()[:max_length]
    # Strip HTML tags to prevent stored XSS
    value = re.sub(r'<script[^>]*>.*?</script>', '', value, flags=re.I | re.S)
    value = re.sub(r'on\w+\s*=', '', value, flags=re.I)
    return value


def check_nosql_injection(value) -> bool:
    """Check if a value contains NoSQL injection patterns."""
    if isinstance(value, str):
        for pattern in NOSQL_PATTERNS:
            if pattern.search(value):
                return True
    elif isinstance(value, dict):
        for k, v in value.items():
            if isinstance(k, str) and k.startswith("$"):
                return True
            if check_nosql_injection(v):
                return True
    elif isinstance(value, list):
        for item in value:
            if check_nosql_injection(item):
                return True
    return False


def sanitize_query_param(value: str) -> str:
    """Sanitize a query parameter to prevent injection."""
    if check_nosql_injection(value):
        raise HTTPException(status_code=400, detail="Invalid input")
    return sanitize_string(value)


# ── FILE UPLOAD SECURITY ──
ALLOWED_IMAGE_SIGNATURES = {
    b'\xff\xd8\xff': 'image/jpeg',
    b'\x89PNG\r\n\x1a\n': 'image/png',
    b'GIF87a': 'image/gif',
    b'GIF89a': 'image/gif',
    b'RIFF': 'image/webp',
}

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}


def validate_image_upload(contents: bytes, filename: str, content_type: str) -> str:
    """
    Validate uploaded image file:
    1. Check file extension
    2. Verify MIME type
    3. Check magic bytes
    4. Check file size
    Returns sanitized extension.
    """
    # Check extension
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type '.{ext}' not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    # Check MIME type
    if not content_type or not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Check magic bytes
    is_valid_image = False
    for sig in ALLOWED_IMAGE_SIGNATURES:
        if contents[:len(sig)] == sig:
            is_valid_image = True
            break
    if not is_valid_image:
        raise HTTPException(status_code=400, detail="File content does not match a valid image format")

    # Check size (5MB max)
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    return ext

# ============================================
# ELEVATE Platform — Production Environment
# ============================================
# DevOps: Copy this file and create the .env files on the server
#
# 1. Copy backend section → /opt/elevate/app/backend/.env
# 2. Copy frontend section → /opt/elevate/app/frontend/.env
# 3. Generate JWT_SECRET: python3 -c "import secrets; print(secrets.token_hex(32))"
# 4. Replace <GENERATED_SECRET> with the output
# 5. Replace elevate.in.gt.com with your actual domain if different
# ============================================

# ─── BACKEND (.env) ─── Place at: /opt/elevate/app/backend/.env
#
# MONGO_URL="mongodb://localhost:27017"
# DB_NAME="elevate_db"
# CORS_ORIGINS="https://elevate.in.gt.com"
# JWT_SECRET="<GENERATED_SECRET>"

# ─── FRONTEND (.env) ─── Place at: /opt/elevate/app/frontend/.env
#
# REACT_APP_BACKEND_URL=https://elevate.in.gt.com

const API_URL = process.env.REACT_APP_BACKEND_URL;

class ApiService {
  constructor() {
    this.token = localStorage.getItem('elevate_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('elevate_token', token);
    } else {
      localStorage.removeItem('elevate_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (response.status === 401) {
      this.setToken(null);
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  }

  // Auth
  login(email, password) {
    return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  }
  getMe() {
    return this.request('/api/auth/me');
  }

  // Coaches
  getCoaches() { return this.request('/api/coaches'); }
  getAvailability(coachId) { return this.request(`/api/coaches/${coachId}/availability`); }
  getRawAvailability(coachId) { return this.request(`/api/coaches/${coachId}/availability/raw`); }
  setAvailability(data) { return this.request('/api/coaches/availability', { method: 'POST', body: JSON.stringify(data) }); }
  removeAvailability(date) { return this.request(`/api/coaches/availability/${date}`, { method: 'DELETE' }); }

  // Requests
  createRequest(data) { return this.request('/api/requests', { method: 'POST', body: JSON.stringify(data) }); }
  getRequests() { return this.request('/api/requests'); }
  getActiveRequest() { return this.request('/api/requests/active'); }
  acceptRequest(id) { return this.request(`/api/requests/${id}/accept`, { method: 'PUT' }); }
  declineRequest(id) { return this.request(`/api/requests/${id}/decline`, { method: 'PUT' }); }
  completeJourney(id) { return this.request(`/api/requests/${id}/complete-journey`, { method: 'PUT' }); }
  pauseJourney(id) { return this.request(`/api/requests/${id}/pause`, { method: 'PUT' }); }
  restartJourney(id) { return this.request(`/api/requests/${id}/restart`, { method: 'PUT' }); }
  updateTotalSessions(id, total) { return this.request(`/api/requests/${id}/total-sessions`, { method: 'PUT', body: JSON.stringify({ total_sessions: total }) }); }
  submitFeedback(requestId, data) {
    return this.request(`/api/requests/${requestId}/feedback`, { method: 'POST', body: JSON.stringify(data) });
  }

  // Sessions
  getSessions() { return this.request('/api/sessions'); }
  createSession(data) { return this.request('/api/sessions', { method: 'POST', body: JSON.stringify(data) }); }
  rescheduleSession(id, data) { return this.request(`/api/sessions/${id}/reschedule`, { method: 'PUT', body: JSON.stringify(data) }); }
  completeSession(id) { return this.request(`/api/sessions/${id}/complete`, { method: 'PUT' }); }

  // Notifications
  getNotifications() { return this.request('/api/notifications'); }
  markRead(id) { return this.request(`/api/notifications/${id}/read`, { method: 'PUT' }); }
  markAllRead() { return this.request('/api/notifications/read-all', { method: 'PUT' }); }
}

export const api = new ApiService();

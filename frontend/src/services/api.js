const API_URL = process.env.REACT_APP_BACKEND_URL;

class ApiService {
  constructor() {
    this.token = this._sanitize(localStorage.getItem('elevate_token'));
  }

  _sanitize(value) {
    if (!value || typeof value !== 'string') return null;
    return value.replace(/[<>"']/g, '');
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
    const { noAuth, ...fetchOptions } = options;
    const headers = { 'Content-Type': 'application/json', ...fetchOptions.headers };
    if (this.token && !noAuth) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, { ...fetchOptions, headers });

    if (response.status === 401 && !noAuth) {
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

  // Admin
  getAdminStats() { return this.request('/api/admin/stats'); }
  getAdminCoaches() { return this.request('/api/admin/coaches'); }
  getAdminCoachees() { return this.request('/api/admin/coachees'); }
  getAdminUserHistory(userId) { return this.request(`/api/admin/users/${userId}/history`); }
  getAdminTrends() { return this.request('/api/admin/trends'); }
  getAdminMIS() { return this.request('/api/admin/mis'); }

  // Registrations
  submitRegistration(data) { return this.request('/api/registrations', { method: 'POST', body: JSON.stringify(data), noAuth: true }); }
  getRegistrations(status = 'pending') { return this.request(`/api/registrations?status=${status}`); }
  approveRegistration(id) { return this.request(`/api/registrations/${id}/approve`, { method: 'PUT' }); }
  rejectRegistration(id) { return this.request(`/api/registrations/${id}/reject`, { method: 'PUT' }); }

  // Session Notes
  addSessionNote(sessionId, content) { return this.request(`/api/sessions/${sessionId}/notes`, { method: 'POST', body: JSON.stringify({ content }) }); }
  getSessionNotes(sessionId) { return this.request(`/api/sessions/${sessionId}/notes`); }

  // Public
  getPublicStats() { return this.request('/api/public/stats', { noAuth: true }); }

  // Profile
  updateProfile(data) { return this.request('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }); }
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const response = await fetch(`${API_URL}/api/auth/avatar`, { method: 'POST', headers, body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }
    return response.json();
  }

  // Notifications
  getNotifications() { return this.request('/api/notifications'); }
  markRead(id) { return this.request(`/api/notifications/${id}/read`, { method: 'PUT' }); }
  markAllRead() { return this.request('/api/notifications/read-all', { method: 'PUT' }); }
}

export const api = new ApiService();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
};

export const signupUser = (payload) => request('/auth/signup', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const loginUser = (payload) => request('/auth/login', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const createComplaint = (payload) => request('/complaints', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const getComplaints = () => request('/complaints');
export const getComplaintsByDepartment = () => request('/complaints/by-department');

export const updateComplaintStatus = (id, status) => request(`/complaints/${id}/status`, {
  method: 'PUT',
  body: JSON.stringify({ status })
});

export const getDashboardStats = () => request('/dashboard-stats');
export const getTopIssues = () => request('/top-issues');
export const getUrgencyRanking = () => request('/urgency-ranking');
export const getClusters = (lng, lat, radius) => request(`/clusters?lng=${lng}&lat=${lat}&radius=${radius}`);
export const getComplaintCategories = () => request('/complaint-categories');
export const suggestComplaintCategory = (text) => request('/complaint-categories/suggest', {
  method: 'POST',
  body: JSON.stringify({ text })
});

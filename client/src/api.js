const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
    pushSubscribe: () => request('/auth/push-subscribe', { method: 'POST' }),
    forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token, password) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
    vpnCheck: () => request('/auth/vpn-check')
  },
  coins: {
    claimWelcome: () => request('/coins/claim/welcome', { method: 'POST' }),
    claimDaily: () => request('/coins/claim/daily', { method: 'POST' }),
    history: () => request('/coins/history')
  },
  withdraw: {
    submit: (body) => request('/withdraw', { method: 'POST', body: JSON.stringify(body) }),
    myWithdrawals: () => request('/withdraw/my')
  },
  tickets: {
    create: (body) => request('/tickets', { method: 'POST', body: JSON.stringify(body) }),
    my: () => request('/tickets/my'),
    get: (id) => request(`/tickets/${id}`)
  },
  offerwalls: {
    config: () => request('/offerwalls/config')
  },
  admin: {
    login: (body) => request('/admin/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request('/admin/logout', { method: 'POST' }),
    me: () => request('/admin/me'),
    stats: () => request('/admin/stats'),
    users: () => request('/admin/users'),
    withdrawals: () => request('/admin/withdrawals'),
    updateWithdrawal: (id, status) => request(`/admin/withdrawals/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    adjustCoins: (id, amount, reason) => request(`/admin/users/${id}/coins`, { method: 'PATCH', body: JSON.stringify({ amount, reason }) }),
    userTransactions: (id) => request(`/admin/users/${id}/transactions`),
    setUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    postbackLogs: () => request('/admin/postback-logs'),
    tickets: () => request('/admin/tickets'),
    ticketDetail: (id) => request(`/admin/tickets/${id}`),
    ticketReply: (id, message, status) => request(`/admin/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ message, status }) }),
    ticketStatus: (id, status) => request(`/admin/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    offerwallConfig: () => request('/admin/offerwall-config'),
    saveOfferwallConfig: (config) => request('/admin/offerwall-config', { method: 'PUT', body: JSON.stringify({ config }) })
  }
};

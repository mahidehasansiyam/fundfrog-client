async function request(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(endpoint, { ...options, headers, credentials: 'include' });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

const api = {
  get: (endpoint: string) => request(endpoint),
  post: (endpoint: string, body: unknown) =>
    request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: unknown) =>
    request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint: string, body: unknown) =>
    request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
};

export default api;

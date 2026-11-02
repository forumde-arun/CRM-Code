
const call = async (path, opts = {}) => {
  const token = localStorage.getItem('token');

  try {
    const response = await fetch('/api' + path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts.headers,
      },
      body: opts.body !== undefined
        ? JSON.stringify(opts.body)
        : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || data.message || `Request failed (${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error(`API error [${path}]:`, error);

    if (error instanceof TypeError) {
      throw new Error(
        'Cannot connect to the server. Check that the backend is running and the Vite proxy is configured correctly.'
      );
    }

    throw error;
  }
};

export const api = {
  get: (path) => call(path),

  post: (path, body) =>
    call(path, {
      method: 'POST',
      body,
    }),

  del: (path) =>
    call(path, {
      method: 'DELETE',
    }),
};

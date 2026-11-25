
const API_PREFIX = '/api';

const getToken = () => {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem('token');
  } catch {
    return null;
  }
};

const buildUrl = (path) => {
  if (typeof path !== 'string' || !path.trim()) {
    throw new Error('API path is required.');
  }

  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  if (
    normalizedPath.startsWith('//') ||
    normalizedPath.includes('://')
  ) {
    throw new Error('Invalid API path.');
  }

  // Avoid accidentally creating /api/api/...
  const cleanPath = normalizedPath.startsWith('/api/')
    ? normalizedPath.slice(4)
    : normalizedPath === '/api'
      ? ''
      : normalizedPath;

  return `${API_PREFIX}${cleanPath}`;
};

const parseResponse = async (response) => {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
};

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const call = async (path, opts = {}) => {
  const url = buildUrl(path);
  const token = getToken();

  const headers = new Headers(opts.headers || {});

  headers.set('Accept', 'application/json');

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let body;

  if (opts.body !== undefined && opts.body !== null) {
    const isFormData =
      typeof FormData !== 'undefined' &&
      opts.body instanceof FormData;

    const isBlob =
      typeof Blob !== 'undefined' &&
      opts.body instanceof Blob;

    const isSearchParams =
      typeof URLSearchParams !== 'undefined' &&
      opts.body instanceof URLSearchParams;

    const isString = typeof opts.body === 'string';

    if (
      isFormData ||
      isBlob ||
      isSearchParams ||
      isString
    ) {
      body = opts.body;
    } else {
      body = JSON.stringify(opts.body);

      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }
  }

  let response;

  try {
    response = await fetch(url, {
      ...opts,
      method: opts.method || 'GET',
      headers,
      body,
      credentials: opts.credentials || 'same-origin',
    });
  } catch (error) {
    console.error(`[API NETWORK ERROR] ${url}`, error);

    if (error.name === 'AbortError') {
      throw error;
    }

    throw new ApiError(
      'Unable to reach the CRM server. Check your internet connection and confirm that the backend and frontend proxy are running.',
      0,
      null
    );
  }

  let data;

  try {
    data = await parseResponse(response);
  } catch (error) {
    console.error(`[API RESPONSE ERROR] ${url}`, error);

    throw new ApiError(
      'The server returned an unreadable response.',
      response.status,
      null
    );
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Request failed with status ${response.status}.`;

    console.error('[API REQUEST ERROR]', {
  url,
  method: opts.method || 'GET',
  status: response.status,
  statusText: response.statusText,
  responseBody: JSON.stringify(data, null, 2),
});
  

    throw new ApiError(
      message,
      response.status,
      data
    );
  }

  return data;
};

export const api = {
  get: (path, options = {}) =>
    call(path, {
      ...options,
      method: 'GET',
    }),

  post: (path, body, options = {}) =>
    call(path, {
      ...options,
      method: 'POST',
      body,
    }),

  put: (path, body, options = {}) =>
    call(path, {
      ...options,
      method: 'PUT',
      body,
    }),

  patch: (path, body, options = {}) =>
    call(path, {
      ...options,
      method: 'PATCH',
      body,
    }),

  del: (path, options = {}) =>
    call(path, {
      ...options,
      method: 'DELETE',
    }),
};

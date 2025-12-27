const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.NEXT_PUBLIC_API_BASE_URL ||
  import.meta.env.BACKEND_API_BASE_URL ||
  "http://localhost:3001";

const SCRIBE_API_BASE_URL =
  import.meta.env.VITE_SCRIBE_API_BASE_URL ||
  import.meta.env.NEXT_PUBLIC_SCRIBE_API_BASE_URL ||
  API_BASE_URL;

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json();
}

export { API_BASE_URL };
export { SCRIBE_API_BASE_URL };

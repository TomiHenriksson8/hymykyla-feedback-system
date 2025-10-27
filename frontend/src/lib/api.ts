
const API = import.meta.env.VITE_API_URL ?? "/api";

/** Error shape returned from the backend */
export type ApiError = Error & { status?: number; data?: any };

/** Join base + path safely */
function join(path: string) {
  if (!path.startsWith("/")) path = "/" + path;
  return `${API}${path}`.replace(/(?<!:)\/{2,}/g, "/");
}

/** Low-level fetch (keeps same signature you had before) */
export async function api(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(join(path), {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  return res;
}

/** Parse + throw typed errors for TanStack Query */
export async function apiJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await api(path, init);

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const err: ApiError = new Error(body?.error || res.statusText);
    err.status = res.status;
    err.data = body;
    throw err;
  }

  return body as T;
}

/** helpers */
export const getJSON = <T>(path: string, init?: RequestInit) =>
  apiJSON<T>(path, { method: "GET", ...init });

export const postJSON = <T>(path: string, body?: any, init?: RequestInit) =>
  apiJSON<T>(path, { method: "POST", body: JSON.stringify(body ?? {}), ...init });

export const patchJSON = <T>(path: string, body?: any, init?: RequestInit) =>
  apiJSON<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}), ...init });

export const putJSON = <T>(path: string, body?: any, init?: RequestInit) =>
  apiJSON<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}), ...init });

export const deleteReq = (path: string, init?: RequestInit) =>
  api(path, { method: "DELETE", ...init }).then(async (res) => {
    if (!res.ok) {
      const isJson = res.headers.get("content-type")?.includes("application/json");
      const body = isJson ? await res.json().catch(() => null) : null;
      const err: ApiError = new Error(body?.error || res.statusText);
      err.status = res.status;
      err.data = body;
      throw err;
    }
    return;
  });


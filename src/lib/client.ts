export const CODE_KEY = "kron_access_code";

/** fetch que adjunta el código de acceso y reinicia si el servidor lo rechaza. */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const code = localStorage.getItem(CODE_KEY);
  if (code) headers.set("x-access-code", code);
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    localStorage.removeItem(CODE_KEY);
    window.location.reload();
  }
  return res;
}

export async function uploadImage(blob: Blob, kind: "documento" | "evidencia"): Promise<string> {
  const fd = new FormData();
  fd.append("file", new File([blob], `${kind}.jpg`, { type: "image/jpeg" }));
  fd.append("kind", kind);
  const res = await apiFetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "No se pudo subir la imagen");
  return data.url as string;
}

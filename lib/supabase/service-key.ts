/**
 * Ambil service-role key dari environment, dengan pembersihan nilai yang sering
 * salah disimpan di Vercel (kutip, spasi/baris baru, key dari project lain).
 *
 * Tidak ada fallback key yang ditulis di kode: service-role key wajib berasal
 * dari env. Kalau env tidak valid, kembalikan null supaya pemanggil memakai
 * jalur lain atau menampilkan error yang jelas.
 */
function decodePayload(key: string): { role?: string; ref?: string } | null {
  try {
    const parts = key.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function resolveServiceRoleKey(supabaseUrl?: string): string | null {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw) return null;

  const key = raw.trim().replace(/^["']|["']$/g, "");
  const payload = decodePayload(key);
  const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : "";
  const sameProject = !projectRef || !payload?.ref || payload.ref === projectRef;

  if (payload?.role === "service_role" && sameProject) return key;

  console.warn("SUPABASE_SERVICE_ROLE_KEY diabaikan: bukan JWT service_role untuk project ini.");
  return null;
}

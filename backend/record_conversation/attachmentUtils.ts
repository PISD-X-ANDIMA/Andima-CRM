/**
 * Parses `a2_record_conversations.attachment_url` (plain URL or JSON string array)
 * into a normalized list of non-empty URLs.
 */
export function parseAttachmentUrls(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((u) => String(u || '').trim()).filter(Boolean);
  }
  if (typeof raw !== 'string') return [];

  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((u) => String(u || '').trim()).filter(Boolean);
      }
    } catch {
      // Treat malformed JSON bracket strings as a plain single URL fallback.
    }
  }

  return [trimmed];
}

/**
 * Serializes 0, 1, or multiple attachment URLs into the `attachment_url` TEXT column
 * while preserving plain-URL backward compatibility for single-file rows.
 */
export function serializeAttachmentUrls(urls: string[]): string | null {
  const cleaned = Array.from(new Set(urls.map((u) => String(u || '').trim()).filter(Boolean)));
  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) return cleaned[0];
  return JSON.stringify(cleaned);
}

/**
 * Extracts a clean display filename from a Supabase Storage / external URL,
 * stripping legacy `<timestamp>_` prefixes and decoding URI encoding.
 */
export function fileNameFromUrl(url: string, fallback: string): string {
  const raw = url.split('/').pop()?.split('?')[0] || fallback;
  try {
    return decodeURIComponent(raw).replace(/^\d{10,}_/, '');
  } catch {
    return raw.replace(/^\d{10,}_/, '');
  }
}

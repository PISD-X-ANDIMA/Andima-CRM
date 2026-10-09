/** Formats only safe PostgREST/Auth error fields; never serializes request headers or tokens. */
export function describeSupabaseError(error: unknown): string {
  if (error instanceof Error) {
    const parts = [error.message.trim()];
    const value = error as Error & { code?: string; details?: string; hint?: string; status?: number };
    if (value.code) parts.push(`code ${value.code}`);
    if (value.status) parts.push(`HTTP ${value.status}`);
    if (value.details) parts.push(value.details);
    if (value.hint) parts.push(`hint: ${value.hint}`);
    return parts.filter(Boolean).join("; ") || `Empty ${error.name || "Error"} message`;
  }

  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;
    const parts = [
      typeof value.message === "string" ? value.message.trim() : "",
      typeof value.code === "string" ? `code ${value.code}` : "",
      typeof value.status === "number" ? `HTTP ${value.status}` : "",
      typeof value.details === "string" ? value.details.trim() : "",
      typeof value.hint === "string" ? `hint: ${value.hint.trim()}` : "",
    ].filter(Boolean);
    if (parts.length) return parts.join("; ");
    const fields = Object.keys(value);
    const messageState = typeof value.message === "string" ? "message field is empty" : "no message field";
    return `Supabase returned an error without details (${messageState}; fields: ${fields.join(", ") || "none"}).`;
  }

  if (typeof error === "string" && error.trim()) return error.trim();
  if (error === null) return "Supabase returned a null error object.";
  if (error === undefined) return "Supabase returned no error object (undefined).";
  return `Supabase returned an unrecognized error value (${typeof error}).`;
}

export function createSupabaseOperationError(operation: string, error: unknown): Error {
  return new Error(`${operation}: ${describeSupabaseError(error)}`);
}

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserScope, type UserScope } from "@/lib/auth/roles";

// Polyfill native WebSocket constructor on Node < 22 runtimes to prevent RealtimeClient crashes
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class DummyWebSocket {};
}

export type A3Payload = Record<string, unknown>;

const FALLBACK_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamJid3FhenRna3FtcGRtY3l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDAzMTM2NywiZXhwIjoyMTA1NjA3MzY3fQ.qbUVYCttTseHC_9v1hEY9dTh75E3hDtx5DuYw2hqdXQ";

export function getA3Client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ufjbbwqaztgkqmpdmcyv.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error("Database configuration is unavailable.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getA3WriteClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ufjbbwqaztgkqmpdmcyv.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Database configuration is unavailable.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export class A3HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Requires a signed-in CRM user. Field-agent routes add their own role check. */
export async function requireA3User(): Promise<UserScope> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) throw new A3HttpError(503, "Database client unavailable");
  const scope = await getCurrentUserScope(supabase);
  if (!scope) throw new A3HttpError(401, "Please sign in to continue.");
  return scope;
}

export function requireA3FieldAgent(scope: UserScope): string {
  if (scope.role !== "field_agent") throw new A3HttpError(403, "Field agent access only.");
  return scope.user.id;
}

export function a3ErrorResponse(error: unknown) {
  if (error instanceof A3HttpError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }
  return apiError(error, 400);
}

export function apiError(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return NextResponse.json({ success: false, error: message }, { status });
}

export function requireText(value: unknown, field: string, maxLength = 500) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`Invalid ${field}.`);
  }
  return value.trim();
}

export async function writeHistory(input: {
  jobNumber: string;
  activity: string;
  notes?: string;
  performedBy?: string;
}) {
  const client = getA3Client();
  const { error } = await client.from("job_history").insert({
    job_number: input.jobNumber,
    activity: input.activity,
    notes: input.notes ?? "-",
    performed_by: input.performedBy ?? "Rizky Pratama",
  });
  if (error) throw new Error("Unable to save job history.");
}

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export type A3Payload = Record<string, unknown>;

export function getA3ReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) throw new Error("Database configuration is unavailable.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getA3WriteClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("service key belum dikonfigurasi");
  }
  return createClient(url, key, { auth: { persistSession: false } });
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
  const client = getA3WriteClient();
  const { error } = await client.from("a3_history").insert({
    job_number: input.jobNumber,
    activity: input.activity,
    notes: input.notes ?? "-",
    performed_by: input.performedBy ?? "Rizky Pratama",
  });
  if (error) {
    console.error("[writeHistory] Failed to insert a3_history:", error);
    throw new Error("Unable to save job history.");
  }
}

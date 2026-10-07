import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export type A3Payload = Record<string, unknown>;

export function getA3Client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Database configuration is unavailable.");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export function apiError(error: unknown, status = 500) {
  const message =
    error instanceof Error
      ? error.message
      : "Unexpected server error.";

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

export function requireText(
  value: unknown,
  field: string,
  maxLength = 500
) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > maxLength
  ) {
    throw new Error(`Invalid ${field}.`);
  }

  return value.trim();
}

/**
 * Mengambil seluruh task Field Agent dari tabel a3_tasks.
 */
export async function getA3Tasks() {
  const client = getA3Client();

  const { data, error } = await client
    .from("a3_tasks")
    .select("*");

  if (error) {
    throw new Error(
      `Unable to fetch A3 tasks: ${error.message}`
    );
  }

  return data ?? [];
}

/**
 * Menyimpan aktivitas Field Agent ke job_history.
 */
export async function writeHistory(input: {
  jobNumber: string;
  activity: string;
  notes?: string;
  performedBy?: string;
}) {
  const client = getA3Client();

  const { error } = await client
    .from("job_history")
    .insert({
      job_number: input.jobNumber,
      activity: input.activity,
      notes: input.notes ?? "-",
      performed_by: input.performedBy ?? "Rizky Pratama",
    });

  if (error) {
    throw new Error("Unable to save job history.");
  }
}
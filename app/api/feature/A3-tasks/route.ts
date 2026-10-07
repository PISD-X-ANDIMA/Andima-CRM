import { NextResponse } from "next/server";
import { getA3Client, apiError } from "@/lib/a3";

export async function GET() {
  try {
    const client = getA3Client();

    const { data, error, count } = await client
      .from("a3_tasks")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("A3 TASK ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    console.log("A3 TASK COUNT:", count);
    console.log("A3 TASK DATA:", data);

    return NextResponse.json({
      success: true,
      count: count ?? 0,
      data: data ?? [],
    });
  } catch (error) {
    return apiError(error);
  }
}
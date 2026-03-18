import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.storage
      .from("documents")
      .list("", { limit: 1 });

    if (error) {
      return NextResponse.json(
        { status: "unreachable", message: error.message },
        { status: 503 }
      );
    }

    return NextResponse.json({ status: "healthy" });
  } catch {
    return NextResponse.json({ status: "unreachable" }, { status: 503 });
  }
}

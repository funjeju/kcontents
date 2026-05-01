export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { MR_SUNSHINE_SCENARIO } from "@/data/scenarios/mr-sunshine";

export async function GET() {
  return NextResponse.json({
    scenarios: [MR_SUNSHINE_SCENARIO],
    featured: MR_SUNSHINE_SCENARIO.id,
  });
}

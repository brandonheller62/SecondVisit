// GET /api/sample-patients: the bundled synthetic CSV for the "Use sample patients" button.

import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const csv = await readFile(path.join(process.cwd(), "data", "synthetic_patients.csv"), "utf8");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8" } });
}

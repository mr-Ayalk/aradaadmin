import { json, options } from "@/lib/http";

export function OPTIONS() {
  return options();
}

export function GET() {
  return json({
    ok: true,
    service: "arada-hq",
    url: process.env.NEXT_PUBLIC_HQ_URL || "http://localhost:3000"
  });
}

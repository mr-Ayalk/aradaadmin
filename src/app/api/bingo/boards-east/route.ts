import { json, options } from "@/lib/http";

export function OPTIONS() {
  return options();
}

export function GET() {
  return json([{ board_numbers: [] }]);
}

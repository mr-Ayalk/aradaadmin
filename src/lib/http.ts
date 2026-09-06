import { NextResponse } from "next/server";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS"
};

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export function options() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export function authToken(header: string | null) {
  if (!header) return "";
  return header.startsWith("Token ") ? header.slice(6).trim() : header.trim();
}

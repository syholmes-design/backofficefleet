import { NextResponse } from "next/server";

export function GET(request: Request) {
  const iconUrl = new URL("/assets/images/logo/boflogo-dark-background-transparent.png", request.url);
  return NextResponse.redirect(iconUrl, { status: 308 });
}

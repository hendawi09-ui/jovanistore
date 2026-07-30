import { NextResponse } from "next/server";

export async function GET(req) {
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/facebook`;

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "email,public_profile",
    response_type: "code",
  });

  return NextResponse.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`);
}

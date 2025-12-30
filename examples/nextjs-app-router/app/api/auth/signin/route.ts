import { NextRequest, NextResponse } from "next/server";
import { auth, sessionCookieConfig } from "@/lib/auth";
import { InvalidCredentialsError } from "fine-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Sign in
    const { user, session, token } = await auth.signIn({ email, password });

    // Create response with user data
    const response = NextResponse.json(
      {
        message: "Signed in successfully",
        user,
      },
      { status: 200 }
    );

    // Set session cookie
    response.cookies.set(sessionCookieConfig.name, token, {
      httpOnly: sessionCookieConfig.httpOnly,
      secure: sessionCookieConfig.secure,
      sameSite: sessionCookieConfig.sameSite,
      path: sessionCookieConfig.path,
      expires: session.expiresAt,
    });

    return response;
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("Signin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

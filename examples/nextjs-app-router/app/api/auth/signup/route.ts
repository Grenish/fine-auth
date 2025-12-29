import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth, sessionCookieConfig } from "@/lib/auth";
import { UserAlreadyExistsError } from "fine-auth";

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

    // Create user and session
    const { user, session } = await auth.signUp({ email, password });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(sessionCookieConfig.name, session.id, {
      httpOnly: sessionCookieConfig.httpOnly,
      secure: sessionCookieConfig.secure,
      sameSite: sessionCookieConfig.sameSite,
      path: sessionCookieConfig.path,
      expires: session.expiresAt,
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

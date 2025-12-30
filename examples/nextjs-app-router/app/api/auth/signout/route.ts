import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth, sessionCookieConfig } from "../../../../lib/auth";
import { getSession } from "../../../../lib/session";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookieConfig.name)?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Invalidate the session
    await auth.signOut(token);

    // Clear the session cookie
    cookieStore.delete(sessionCookieConfig.name);

    return NextResponse.json({ message: "Signed out successfully" });
  } catch (error) {
    console.error("Signout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

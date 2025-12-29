import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth, sessionCookieConfig } from "../../../../lib/auth";
import { getSession } from "../../../../lib/session";

export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Invalidate the session
    await auth.signOut(session.session.id);

    // Clear the session cookie
    const cookieStore = await cookies();
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

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const cookiesList = await cookies();
    const session = getSession(cookiesList);

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        username: session.username,
        email: session.email,
        role: session.role,
      },
    });
  } catch (error: any) {
    console.error("Session retrieval API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

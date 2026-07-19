import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// WARNING: This is a simplified credential check for demo/local dev purposes.
// BEFORE deploying to a production environment, this MUST be integrated with
// a production-grade identity provider (e.g., Firebase Auth, Okta, Auth0, etc.)
// and secure token verification.

const DEFAULT_USERNAME = 'staff';
const DEFAULT_PASSWORD = 'stadium2026';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    const expectedUsername = process.env.STAFF_USERNAME || DEFAULT_USERNAME;
    const expectedPassword = process.env.STAFF_PASSWORD || DEFAULT_PASSWORD;

    if (username === expectedUsername && password === expectedPassword) {
      const staffSession = {
        staff_id: `staff_${Math.floor(1000 + Math.random() * 9000)}`,
        role: 'staff',
        zone_assignment: 'metlife_gate' // default assignment
      };

      // Set cookie
      cookies().set('staff_session', JSON.stringify(staffSession), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/'
      });

      return NextResponse.json({ success: true, session: staffSession });
    } else {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }
  } catch (error) {
    console.error("Staff login error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logIncident, getIncidents } from '@/lib/stadium';

function getStaffSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('staff_session');
  if (!sessionCookie) return null;
  try {
    const session = JSON.parse(sessionCookie.value);
    if (session.role === 'staff') return session;
  } catch (e) {}
  return null;
}

export async function GET() {
  // Guard: Ensure staff session
  const session = getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized access: Staff session required." }, { status: 401 });
  }
  
  try {
    const incidents = getIncidents();
    return NextResponse.json({ success: true, incidents });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
  }
}

export async function POST(request) {
  // Guard: Ensure staff session
  const session = getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized access: Staff session required." }, { status: 401 });
  }

  try {
    const { zone, description } = await request.json();
    if (!zone || !description) {
      return NextResponse.json({ error: "Missing zone or description fields" }, { status: 400 });
    }

    const result = logIncident(session.staff_id, zone, description);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Incident logging API error:", error);
    return NextResponse.json({ error: "Failed to log incident" }, { status: 500 });
  }
}

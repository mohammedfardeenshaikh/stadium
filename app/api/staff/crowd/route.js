import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { analyzeCrowdStatus } from '@/lib/stadium';

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

export async function GET(request) {
  // Guard: Ensure staff session
  const session = getStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized access: Staff session required." }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const forceUnavailable = searchParams.get('unavailable') === 'true';

    const crowdAnalysis = analyzeCrowdStatus(forceUnavailable);
    if (!crowdAnalysis.success) {
      return NextResponse.json({ 
        success: false, 
        message: crowdAnalysis.message 
      }, { status: 503 }); // Service Unavailable for testing
    }

    return NextResponse.json(crowdAnalysis);
  } catch (error) {
    console.error("Crowd feed API error:", error);
    return NextResponse.json({ error: "Failed to query crowd status" }, { status: 500 });
  }
}

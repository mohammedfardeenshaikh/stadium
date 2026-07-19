import { NextResponse } from 'next/server';
import { findNavigationRoute } from '@/lib/stadium';

export async function POST(request) {
  try {
    const { origin, destination, accessibility_needs } = await request.json();
    if (!origin || !destination) {
      return NextResponse.json({ error: "Missing origin or destination parameters" }, { status: 400 });
    }
    const result = findNavigationRoute(origin, destination, accessibility_needs);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Navigation API error:", error);
    return NextResponse.json({ error: "Internal Navigation Error" }, { status: 500 });
  }
}

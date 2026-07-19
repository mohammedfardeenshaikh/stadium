import { NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/stadium';

export async function POST(request) {
  try {
    const { origin, fan_profile } = await request.json();
    const list = getRecommendations(origin || 'MetLife Gate', fan_profile || {});
    return NextResponse.json({ success: true, recommendations: list });
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
  }
}

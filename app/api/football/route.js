import { NextResponse } from 'next/server';
import { getFootballStatus } from '@/lib/stadium';

export async function GET() {
  try {
    const status = getFootballStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch game feed" }, { status: 500 });
  }
}

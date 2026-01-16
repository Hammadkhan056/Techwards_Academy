import { NextResponse } from 'next/server';
import api from '@/lib/api';

export async function GET() {
  try {
    const response = await api.get('/');
    return NextResponse.json(response.data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
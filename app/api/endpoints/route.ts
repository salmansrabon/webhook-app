import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const endpoints = await prisma.endpoint.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(endpoints)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch endpoints' }, { status: 500 })
  }
}
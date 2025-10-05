import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpointId = searchParams.get('endpointId')

  try {
    const requests = await prisma.request.findMany({
      where: endpointId ? { endpointId: parseInt(endpointId) } : {},
      include: {
        endpoint: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(requests)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await prisma.request.deleteMany({})
    return NextResponse.json({ message: 'All requests deleted' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete all requests' }, { status: 500 })
  }
}
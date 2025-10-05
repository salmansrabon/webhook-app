import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    await prisma.request.delete({
      where: { id: parseInt(id) }
    })
    return NextResponse.json({ message: 'Request deleted' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.request.delete({
      where: { id: parseInt(params.id) }
    })
    return NextResponse.json({ message: 'Request deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
  }
}
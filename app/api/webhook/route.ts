import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { broadcast } from '../events/route'

const WEBHOOK_SECRET = '123e4567-e89b-12d3-a456-426614174000'

export async function GET(request: NextRequest) {
  return handleWebhook(request, 'GET')
}

export async function POST(request: NextRequest) {
  return handleWebhook(request, 'POST')
}

async function handleWebhook(request: NextRequest, method: string) {
  const secret = request.headers.get('x-webhook-secret')

  if (!secret || secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const url = request.url
  const headers = Object.fromEntries(request.headers.entries())
  const body = method === 'POST' ? await request.text() : null

  // Find or create endpoint
  let endpoint = await prisma.endpoint.findUnique({
    where: { url }
  })

  if (!endpoint) {
    endpoint = await prisma.endpoint.create({
      data: { url }
    })
  }

  // Create request record
  const requestRecord = await prisma.request.create({
    data: {
      endpointId: endpoint.id,
      method,
      headers: JSON.stringify(headers),
      body,
      response: JSON.stringify({ message: 'Webhook received', timestamp: new Date().toISOString() }),
      statusCode: 200,
    }
  })

  // Broadcast new request to all connected clients
  broadcast(JSON.stringify({
    type: 'new_request',
    requestId: requestRecord.id,
    endpoint: endpoint.url,
    method: method,
    timestamp: requestRecord.createdAt
  }))

  return NextResponse.json({
    id: requestRecord.id,
    message: 'Webhook processed successfully',
    timestamp: requestRecord.createdAt
  })
}
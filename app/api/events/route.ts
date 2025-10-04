import { NextRequest } from 'next/server'

// Store connected clients
const clients = new Set<ReadableStreamDefaultController>()

// Broadcast function to send messages to all connected clients
function broadcast(message: string) {
  clients.forEach(client => {
    try {
      client.enqueue(`data: ${message}\n\n`)
    } catch (error) {
      // Client might be disconnected, remove it
      clients.delete(client)
    }
  })
}

// Export the broadcast function so it can be used from the webhook endpoint
export { broadcast }

export async function GET(request: NextRequest) {
  // Set up Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      // Add this client to the set
      clients.add(controller)

      // Send initial connection message
      controller.enqueue('data: {"type": "connected"}\n\n')

      // Clean up when client disconnects
      request.signal.addEventListener('abort', () => {
        clients.delete(controller)
      })
    },
    cancel() {
      // Client disconnected
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}
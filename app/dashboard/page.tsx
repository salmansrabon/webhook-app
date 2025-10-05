'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

interface Request {
  id: number
  method: string
  headers: string
  body: string | null
  response: string
  statusCode: number
  createdAt: string
  endpoint: {
    url: string
  }
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [headersExpanded, setHeadersExpanded] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchRequests()
    setupEventSource()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const setupEventSource = () => {
    const eventSource = new EventSource('/api/events')
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'new_request') {
        fetchRequests().then(() => {
          // Auto-select the latest request only if no request is selected or if currently viewing the latest
          setTimeout(() => {
            setRequests(currentRequests => {
              if (currentRequests.length > 0) {
                setSelectedRequest(currentSelected => {
                  // If no request is selected, or if the currently selected is the most recent, select the latest
                  if (!currentSelected || currentSelected.id === currentRequests[0].id) {
                    return currentRequests[0]
                  }
                  // Otherwise, keep the current selection
                  return currentSelected
                })
              }
              return currentRequests
            })
          }, 100)
        })
      }
    }

    eventSource.onerror = () => {
      console.error('EventSource error')
      // Fallback to polling if SSE fails
      const interval = setInterval(fetchRequests, 2000)
      eventSourceRef.current = null
      return () => clearInterval(interval)
    }
  }

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests')
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
        // Auto-select the latest request on initial load
        if (data.length > 0 && !selectedRequest) {
          setSelectedRequest(data[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    }
  }

  const deleteRequest = async (id: number) => {
    const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setRequests(requests.filter(r => r.id !== id))
      if (selectedRequest?.id === id) {
        setSelectedRequest(null)
      }
    }
  }

  const deleteAllRequests = async () => {
    if (!confirm('Are you sure you want to delete all requests? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch('/api/requests', { method: 'DELETE' })
      if (res.ok) {
        setRequests([])
        setSelectedRequest(null)
      }
    } catch (error) {
      console.error('Failed to delete all requests:', error)
    }
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex h-screen">
      {/* Left Panel */}
      <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Request Threads</h2>
          <button
            onClick={deleteAllRequests}
            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
            title="Delete all requests"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <ul>
          {requests.map(request => (
            <li
              key={request.id}
              className={`p-2 cursor-pointer mb-2 border rounded relative ${selectedRequest?.id === request.id ? 'bg-blue-200' : 'bg-white'}`}
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold">{request.method}</div>
                  <div className="text-sm text-gray-600">{new Date(request.createdAt).toLocaleString()}</div>
                  <div className="text-xs text-gray-500 truncate">{request.endpoint.url}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteRequest(request.id)
                  }}
                  className="text-red-500 hover:text-red-700 ml-2 p-1 cursor-pointer"
                  title="Delete request"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Area */}
      <div className="w-3/4 p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Webhook Dashboard</h1>
          <button
            onClick={() => signOut()}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Logout
          </button>
        </div>
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-lg text-gray-600">Waiting for incoming request...</p>
          </div>
        ) : selectedRequest ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl">{selectedRequest.method} - {new Date(selectedRequest.createdAt).toLocaleString()}</h2>
              <button
                onClick={() => deleteRequest(selectedRequest.id)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete Request
              </button>
            </div>
            <div className="mb-4">
              <strong>Endpoint:</strong> {selectedRequest.endpoint.url}
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setHeadersExpanded(!headersExpanded)}>
                <strong>Headers</strong>
                <svg
                  className={`w-5 h-5 transform transition-transform ${headersExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              {headersExpanded && (
                <pre className="bg-gray-100 p-4 rounded mt-2 overflow-x-auto">{JSON.stringify(JSON.parse(selectedRequest.headers), null, 2)}</pre>
              )}
            </div>
            {selectedRequest.body && (
              <div className="mb-4">
                <strong>Body:</strong>
                <pre className="bg-gray-100 p-4 rounded mt-2 overflow-x-auto">{selectedRequest.body}</pre>
              </div>
            )}
            <div className="mb-4">
              <strong>Response:</strong>
              <pre className="bg-gray-100 p-4 rounded mt-2 overflow-x-auto">
                {JSON.stringify({
                  data: (() => {
                    if (!selectedRequest.body) return null;
                    try {
                      return JSON.parse(selectedRequest.body);
                    } catch {
                      return selectedRequest.body; // Return as string if not JSON
                    }
                  })(),
                  id: selectedRequest.id,
                  timestamp: selectedRequest.createdAt,
                  status: 'processed',
                  statusCode: selectedRequest.statusCode
                }, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <p>Select a request thread to view details</p>
        )}
      </div>
    </div>
  )
}
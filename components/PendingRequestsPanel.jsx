'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PendingRequestsPanel({ requests: initial }) {
  const [requests, setRequests] = useState(initial)
  const [loading, setLoading] = useState(null)
  const router = useRouter()

  const handleAction = async (id, status) => {
    setLoading(id + status)

    await fetch(`/api/request-access/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })

    // Remove from the list either way (approved or rejected)
    setRequests(prev => prev.filter(r => r._id !== id))
    setLoading(null)

    // Refresh the server component so stat cards update
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        Pending Access Requests
        {requests.length > 0 && (
          <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
            {requests.length}
          </span>
        )}
      </h2>

      {requests.length === 0 ? (
        <p className="text-sm text-gray-400">No pending requests right now.</p>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div
              key={req._id}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{req.name}</p>
                <p className="text-xs text-gray-400">
                  {req.email} · {req.role}
                  {req.studentNumber ? ` · ${req.studentNumber}` : ''}
                </p>
                <p className="text-xs text-gray-300 mt-0.5">
                  {new Date(req.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(req._id, 'approved')}
                  disabled={!!loading}
                  className="text-xs px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 cursor-pointer"
                >
                  {loading === req._id + 'approved' ? '...' : '✓ Approve'}
                </button>
                <button
                  onClick={() => handleAction(req._id, 'rejected')}
                  disabled={!!loading}
                  className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                >
                  {loading === req._id + 'rejected' ? '...' : '✕ Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
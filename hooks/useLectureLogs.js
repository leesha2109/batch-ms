'use client'

import { useState, useEffect, useCallback } from 'react'

export function useLectureLogs(filters = {}) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.batchId)             params.set('batchId', filters.batchId)
      if (filters.semesterNumber)      params.set('semesterNumber', filters.semesterNumber)
      if (filters.subjectAssignmentId) params.set('subjectAssignmentId', filters.subjectAssignmentId)
      if (filters.taughtBy)            params.set('taughtBy', filters.taughtBy)

      const res  = await fetch(`/api/lecture-logs?${params.toString()}`)
      const data = await res.json()
      if (data.success) setLogs(data.logs)
      else setError(data.message)
    } catch {
      setError('Failed to load lecture logs')
    } finally {
      setLoading(false)
    }
  }, [filters.batchId, filters.semesterNumber, filters.subjectAssignmentId, filters.taughtBy])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return { logs, loading, error, refetch: fetchLogs }
}
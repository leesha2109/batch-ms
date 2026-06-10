'use client'
import { useState, useEffect } from 'react'

export function useAssignments(batchId, semesterNumber) {
  const [assignments, setAssignments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')

  async function fetchAssignments() {
    if (!batchId || !semesterNumber) { setLoading(false); return }
    setLoading(true)
    try {
      const url  = `/api/subject-assignments?batchId=${batchId}&semesterNumber=${semesterNumber}`
      const res  = await fetch(url)
      const data = await res.json()
      if (data.success) setAssignments(data.assignments)
      else setError(data.message)
    } catch {
      setError('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAssignments() }, [batchId, semesterNumber])
  return { assignments, loading, error, refetch: fetchAssignments }
}
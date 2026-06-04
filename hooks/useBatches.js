'use client'

import { useState, useEffect } from 'react'

export function useBatches() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  async function fetchBatches() {
    setLoading(true)
    try {
      const res  = await fetch('/api/batches')
      const data = await res.json()
      if (data.success) setBatches(data.batches)
      else setError(data.message)
    } catch {
      setError('Failed to load batches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBatches() }, [])

  return { batches, loading, error, refetch: fetchBatches }
}
'use client'
import { useState, useEffect } from 'react'

export function useSubjects(programme = '') {
  const [subjects, setSubjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  async function fetchSubjects(search = '') {
    setLoading(true)
    try {
      let url = '/api/subjects?'
      if (programme) url += `programme=${programme}&`
      if (search)    url += `search=${search}`
      const res  = await fetch(url)
      const data = await res.json()
      if (data.success) setSubjects(data.subjects)
      else setError(data.message)
    } catch {
      setError('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSubjects() }, [programme])
  return { subjects, loading, error, refetch: fetchSubjects }
}
'use client'

import { useState, useEffect } from 'react'

export function useUsers(roleFilter = '') {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  async function fetchUsers(search = '') {
    setLoading(true)
    try {
      let url = '/api/users?'
      if (roleFilter) url += `role=${roleFilter}&`
      if (search)     url += `search=${search}`

      const res  = await fetch(url)
      const data = await res.json()

      if (data.success) setUsers(data.users)
      else setError(data.message)
    } catch {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [roleFilter])

  return { users, loading, error, refetch: fetchUsers }
}
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RequestAccessPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    studentNumber: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSuccess(true)
        setFormData({ name: '', email: '', role: 'student', studentNumber: '' })
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to submit request')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #001D39 0%, #0A4174 50%, #7BBDE8 85%, #BDD8E9 100%)',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          padding: '50px 40px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#fff',
            margin: 0,
            letterSpacing: '0.5px'
          }}>
            Request <span style={{ color: '#FFE566' }}>Access</span>
          </h1>
        </div>

        {/* Subtitle */}
        <p style={{
          color: 'rgba(255, 255, 255, 0.75)',
          fontSize: '14px',
          marginBottom: '28px'
        }}>
          Fill out the form below to request access
        </p>

        {success && (
          <div style={{
            background: 'rgba(46, 213, 115, 0.2)',
            color: '#90EE90',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '20px',
            border: '1px solid rgba(46, 213, 115, 0.4)',
            textAlign: 'center'
          }}>
            ✓ Request submitted successfully! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500'
            }}>
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '11px 12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                boxSizing: 'border-box'
              }}
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500'
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '11px 12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                boxSizing: 'border-box'
              }}
              placeholder="you@example.com"
            />
          </div>

          {/* Phone */}
          {/* Removed */}

          {/* Role */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'block',
              marginBottom: '6px',
              fontWeight: '500'
            }}>
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '11px 12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="student" style={{ background: '#001D39' }}>Student</option>
              <option value="lecturer" style={{ background: '#001D39' }}>Lecturer</option>
              
            </select>
          </div>

          {/* Student Number - Conditional */}
          {formData.role === 'student' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                display: 'block',
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                Student Number
              </label>
              <input
                type="text"
                name="studentNumber"
                value={formData.studentNumber}
                onChange={handleChange}
                required={formData.role === 'student'}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  boxSizing: 'border-box'
                }}
                placeholder="SC/20XX/XXXXX"
              />
            </div>
          )}

          {/* Institution */}
          {/* Removed */}

          {/* Reason */}
          {/* Removed */}

          {error && (
            <div style={{
              background: 'rgba(192, 57, 43, 0.2)',
              color: '#FFB3B3',
              padding: '11px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '24px',
              border: '1px solid rgba(192, 57, 43, 0.4)'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? 'rgba(255, 229, 102, 0.4)' : '#FFE566',
              color: loading ? 'rgba(0, 29, 57, 0.5)' : '#001D39',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#FFD633')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#FFE566')}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>

          {/* Back to Login Link */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Already have access?{' '}
              <button
                onClick={() => router.push('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFE566',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  transition: 'color 0.3s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFD633')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#FFE566')}
              >
                Back to Login
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

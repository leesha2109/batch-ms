'use client'
import { useState, useEffect } from 'react'
import TopHeader from '@/components/TopHeader'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function StudentDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(
    DAYS[new Date().getDay() - 1] || 'Monday'
  )

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/student/dashboard', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="px-8 py-6 text-sm text-gray-400">Loading...</div>
  if (!data) return <div className="px-8 py-6 text-sm text-red-400">Failed to load dashboard.</div>

  const announcements = data.announcements || []
  const timetable = data.timetable || []


  const todayClasses = timetable.filter(t => t.day === activeDay)

  return (
    <div>
      <TopHeader
        title="My Dashboard"
        subtitle={`Welcome, ${data.user.name}`}
      />

      <div className="px-8 py-6 space-y-6">

        {/* Profile bar */}
        <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
            {data.user.name?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{data.user.name}</p>
            <p className="text-xs text-gray-400">{data.user.studentNumber || data.user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">

          {/* Timetable */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Timetable</h2>

            {/* Day tabs */}
            <div className="flex gap-1 mb-4 overflow-x-auto">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors
                    ${activeDay === day
                      ? 'bg-blue-900 text-white'
                      : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                    }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            {todayClasses.length === 0 ? (
              <p className="text-sm text-gray-400">No classes on {activeDay}.</p>
            ) : (
              <div className="space-y-2">
                {todayClasses.map(cls => (
                  <div key={cls._id} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="text-xs text-blue-600 font-medium whitespace-nowrap mt-0.5">
                      {cls.startTime} – {cls.endTime}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{cls.subject}</p>
                      <p className="text-xs text-gray-500">{cls.lecturer} {cls.room && `• ${cls.room}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Announcements */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Announcements</h2>
            {data.announcements.length === 0 ? (
              <p className="text-sm text-gray-400">No announcements yet.</p>
            ) : (
              <div className="space-y-3">
                {data.announcements.map(a => (
                  <div key={a._id} className="border-l-2 border-blue-400 pl-3">
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.content}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Deadlines
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Upcoming Deadlines</h2>
            {data.deadlines.length === 0 ? (
              <p className="text-sm text-gray-400">No upcoming deadlines.</p>
            ) : (
              <div className="space-y-2">
                {data.deadlines.map(d => (
                  <div key={d._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{d.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${d.type === 'exam' ? 'bg-red-100 text-red-600' :
                          d.type === 'assignment' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'}`}>
                        {d.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(d.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div> */}

          {/* Quick info */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">My Info</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Name</span>
                <span className="text-gray-800 font-medium">{data.user.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Email</span>
                <span className="text-gray-800">{data.user.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Student No.</span>
                <span className="text-gray-800">{data.user.studentNumber || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Batch</span>
                <span className="text-gray-800">{data.user.batchId || '—'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
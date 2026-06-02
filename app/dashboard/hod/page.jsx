import { getServerSession } from 'next-auth'
import TopHeader from '@/components/TopHeader'
import StatCard from '@/components/StatCard'
import connectDB from '@/lib/mongoose'
import User from '@/models/User'

export default async function HodDashboard() {
  const session = await getServerSession()

  await connectDB()
  const totalStudents  = await User.countDocuments({ role: 'student' })
  const totalLecturers = await User.countDocuments({ role: 'lecturer' })
  const totalVisiting  = await User.countDocuments({ role: 'visiting_lecturer' })

  return (
    <div>
      <TopHeader
        title="Dashboard"
        subtitle={`Welcome back, ${session?.user?.name}`}
      />

      <div className="px-8 py-6">

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Students"
            value={totalStudents}
            sub="Across all batches"
            color="blue"
          />
          <StatCard
            label="Lecturers"
            value={totalLecturers}
            sub={`+ ${totalVisiting} visiting`}
            color="purple"
          />
          <StatCard
            label="Pending Approvals"
            value="0"
            sub="Marks & payments"
            color="red"
          />
          <StatCard
            label="Active Batches"
            value="0"
            sub="BSc & BCS"
            color="green"
          />
        </div>

        {/* Placeholder panels */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Pending Approvals
            </h2>
            <p className="text-sm text-gray-400">
              No pending approvals right now.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Recent Activity
            </h2>
            <p className="text-sm text-gray-400">
              No recent activity yet.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
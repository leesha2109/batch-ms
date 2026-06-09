export default function StatCard({ label, value, sub, color = 'gray' }) {
  const colors = {
    gray:   'bg-gray-200',
    blue:   'bg-blue-200',
    green:  'bg-green-200',
    red:    'bg-red-200',
    purple: 'bg-purple-200',
  }

  return (
    <div className={`${colors[color]} rounded-xl p-4`}>
      <p className="text-md text-gray-800 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-md text-gray-700 mt-1">{sub}</p>}
    </div>
  )
}
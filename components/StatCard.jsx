export default function StatCard({ label, value, sub, color = 'gray' }) {
  const colors = {
    gray:   'bg-gray-50',
    blue:   'bg-blue-50',
    green:  'bg-green-50',
    red:    'bg-red-50',
    purple: 'bg-purple-50',
  }

  return (
    <div className={`${colors[color]} rounded-xl p-4`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
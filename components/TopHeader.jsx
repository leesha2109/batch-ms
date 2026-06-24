export default function TopHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between px-8 py-5 bg-blue-950 border-b border-gray-100">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-l text-blue-200 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
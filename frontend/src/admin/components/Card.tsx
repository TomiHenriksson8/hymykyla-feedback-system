
export default function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-panel rounded-2xl shadow-sm border border-line p-4 ${className}`}>{children}</div>
}

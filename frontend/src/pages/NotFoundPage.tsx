import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <p className="font-mono text-sm text-accent-400">404</p>
      <h1 className="mt-2 text-xl font-semibold">Page not found</h1>
      <Link to="/" className="mt-4 text-sm text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline">
        Back to dashboard
      </Link>
    </div>
  )
}

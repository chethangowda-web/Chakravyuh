import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error'

  return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 p-8 text-center">
      <div>
        <p className="font-mono text-sm text-red-400">Something went wrong</p>
        <h1 className="mt-2 text-xl font-semibold text-zinc-100">{message}</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}

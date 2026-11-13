import { RouterProvider } from 'react-router/dom'

import { ToastProvider } from './components/ui/ToastProvider'
import { router } from './routes'

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  )
}

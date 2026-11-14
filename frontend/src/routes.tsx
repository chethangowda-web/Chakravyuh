import { createBrowserRouter } from 'react-router'

import { AppLayout } from './layouts/AppLayout'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RouteErrorPage } from './pages/RouteErrorPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'dashboard', lazy: async () => ({ Component: (await import('./pages/DashboardPage')).DashboardPage }) },
      { path: 'challenge', lazy: async () => ({ Component: (await import('./pages/ChallengePage')).ChallengePage }) },
      { path: 'integrations', lazy: async () => ({ Component: (await import('./pages/IntegrationsPage')).IntegrationsPage }) },
      { path: 'targets', lazy: async () => ({ Component: (await import('./pages/TargetsPage')).TargetsPage }) },
      { path: 'targets/new', lazy: async () => ({ Component: (await import('./pages/TargetFormPage')).TargetFormPage }) },
      { path: 'targets/:targetId', lazy: async () => ({ Component: (await import('./pages/TargetFormPage')).TargetFormPage }) },
      { path: 'studio', lazy: async () => ({ Component: (await import('./pages/AttackStudioPage')).AttackStudioPage }) },
      { path: 'campaigns', lazy: async () => ({ Component: (await import('./pages/CampaignsPage')).CampaignsPage }) },
      { path: 'campaigns/new', lazy: async () => ({ Component: (await import('./pages/NewCampaignPage')).NewCampaignPage }) },
      { path: 'campaigns/:campaignId', lazy: async () => ({ Component: (await import('./pages/CampaignDetailPage')).CampaignDetailPage }) },
      { path: 'campaigns/:campaignId/report', lazy: async () => ({ Component: (await import('./pages/ReportPage')).ReportPage }) },
      { path: 'findings/:resultId', lazy: async () => ({ Component: (await import('./pages/FindingDetailPage')).FindingDetailPage }) },
      { path: 'voice', lazy: async () => ({ Component: (await import('./pages/VoiceLabPage')).VoiceLabPage }) },
      { path: 'shield', lazy: async () => ({ Component: (await import('./pages/ShieldPage')).ShieldPage }) },
      { path: 'regression/:regressionId', lazy: async () => ({ Component: (await import('./pages/RegressionPage')).RegressionPage }) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

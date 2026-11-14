import { createBrowserRouter } from 'react-router'

import { AppLayout } from './layouts/AppLayout'
import { AttackStudioPage } from './pages/AttackStudioPage'
import { CampaignDetailPage } from './pages/CampaignDetailPage'
import { ChallengePage } from './pages/ChallengePage'
import { CampaignsPage } from './pages/CampaignsPage'
import { DashboardPage } from './pages/DashboardPage'
import { FindingDetailPage } from './pages/FindingDetailPage'
import { HomePage } from './pages/HomePage'
import { IntegrationsPage } from './pages/IntegrationsPage'
import { NewCampaignPage } from './pages/NewCampaignPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegressionPage } from './pages/RegressionPage'
import { ReportPage } from './pages/ReportPage'
import { ShieldPage } from './pages/ShieldPage'
import { RouteErrorPage } from './pages/RouteErrorPage'
import { TargetFormPage } from './pages/TargetFormPage'
import { TargetsPage } from './pages/TargetsPage'
import { VoiceLabPage } from './pages/VoiceLabPage'

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'challenge', element: <ChallengePage /> },
      { path: 'integrations', element: <IntegrationsPage /> },
      { path: 'targets', element: <TargetsPage /> },
      { path: 'targets/new', element: <TargetFormPage /> },
      { path: 'targets/:targetId', element: <TargetFormPage /> },
      { path: 'studio', element: <AttackStudioPage /> },
      { path: 'campaigns', element: <CampaignsPage /> },
      { path: 'campaigns/new', element: <NewCampaignPage /> },
      { path: 'campaigns/:campaignId', element: <CampaignDetailPage /> },
      { path: 'campaigns/:campaignId/report', element: <ReportPage /> },
      { path: 'findings/:resultId', element: <FindingDetailPage /> },
      { path: 'voice', element: <VoiceLabPage /> },
      { path: 'shield', element: <ShieldPage /> },
      { path: 'regression/:regressionId', element: <RegressionPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

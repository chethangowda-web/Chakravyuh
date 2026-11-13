import { Crosshair, Radar, ShieldCheck, Wrench } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

/** Labels and icons for the guided Test → Fix → Protect steps (keys come from GET /dashboard/journey). */
export const STEP_META: Record<string, { label: string; title: string; icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  target: { label: 'Target', title: 'Add your chatbot', icon: Crosshair },
  attack: { label: 'Attack', title: 'Attack it in Indian languages', icon: Radar },
  fix: { label: 'Fix', title: 'Fix it and prove it', icon: Wrench },
  protect: { label: 'Protect', title: 'Protect it live', icon: ShieldCheck },
}


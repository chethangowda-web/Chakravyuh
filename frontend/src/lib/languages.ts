import type { LanguageCode, ScriptVariant } from '../types/domain'

interface LanguageMeta {
  short: string
  label: string
  native: string
  /** Chart colour */
  hex: string
}

export const LANGUAGES: Record<LanguageCode, LanguageMeta> = {
  'en-IN': { short: 'EN', label: 'English', native: 'English', hex: '#a1a1aa' },
  'hi-IN': { short: 'HI', label: 'Hindi', native: 'हिन्दी', hex: '#f472b6' },
  'kn-IN': { short: 'KN', label: 'Kannada', native: 'ಕನ್ನಡ', hex: '#facc15' },
  'te-IN': { short: 'TE', label: 'Telugu', native: 'తెలుగు', hex: '#2dd4bf' },
  'ta-IN': { short: 'TA', label: 'Tamil', native: 'தமிழ்', hex: '#818cf8' },
}

export const VARIANT_LABELS: Record<ScriptVariant, string> = {
  native: 'Native script',
  romanized: 'Romanized',
  code_mixed: 'Code-mixed',
}

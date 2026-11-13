import { endpoints } from '../endpoints'
import { useApiQuery } from './useApiQuery'

export function useHealth(intervalMs = 15_000) {
  return useApiQuery('health', endpoints.getHealth, { intervalMs })
}

export function useMetaEnums() {
  return useApiQuery('meta-enums', endpoints.getMetaEnums)
}

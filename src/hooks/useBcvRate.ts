import { useCallback, useEffect, useState } from 'react'

interface BcvRate {
  rate: number
  date: string
  fetchedAt: string
  source: string
}

interface DolarApiOfficialRate {
  fuente: string
  promedio: number
  fechaActualizacion: string
}

const OFFICIAL_RATE_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'
const RATE_SOURCE_URL = 'https://dolarapi.com/docs/venezuela/'

export function useBcvRate(autoFetch = true) {
  const [rateData, setRateData] = useState<BcvRate | null>(null)
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (): Promise<BcvRate | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(OFFICIAL_RATE_URL, { signal: AbortSignal.timeout(10000) })
      if (!response.ok) {
        throw new Error(`La API de cotización respondió HTTP ${response.status}.`)
      }

      const data: DolarApiOfficialRate = await response.json()
      const updatedAt = data.fechaActualizacion
      if (
        data.fuente !== 'oficial'
        || !Number.isFinite(data.promedio)
        || data.promedio <= 0
        || !updatedAt
        || !/^\d{4}-\d{2}-\d{2}/.test(updatedAt)
      ) {
        throw new Error('La API no entregó una tasa oficial válida.')
      }

      const currentRate: BcvRate = {
        rate: data.promedio,
        date: updatedAt.slice(0, 10),
        fetchedAt: new Date().toISOString(),
        source: RATE_SOURCE_URL,
      }
      setRateData(currentRate)
      setLoading(false)
      return currentRate
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Error desconocido consultando la tasa.'
      setError(`No se pudo consultar la tasa oficial: ${message}`)
      setLoading(false)
      return null
    }
  }, [])

  useEffect(() => {
    if (!autoFetch) return
    void refresh()
    const intervalId = window.setInterval(() => void refresh(), 30 * 60 * 1000)
    return () => window.clearInterval(intervalId)
  }, [autoFetch, refresh])

  return { ...rateData, loading, error, refresh }
}

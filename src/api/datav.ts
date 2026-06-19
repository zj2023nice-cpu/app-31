import { mockOverviewData, mockUserGrowthData, mockTokenTrendData, mockTop10Data } from './mock'

export interface OverviewData {
  totalUsers: number
  todayNewUsers: number
  todayActiveUsers: number
  tokenUsersTotal: number
  totalTokens: number
}

export interface TrendItem {
  date: string
  value: number
}

export interface Top10Item {
  nick_name: string
  token_sum: number
}

export type MetricKey = 'todayNewUsers' | 'todayActiveUsers' | 'totalTokens'

export interface AbnormalRecord {
  time: string
  metricKey: MetricKey
  metricName: string
  prevValue: number
  currentValue: number
  changeRate: number
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

const rareSpike = (): boolean => Math.random() < 0.06

const perturbValue = (base: number, minRate: number, maxRate: number, allowSpike = false): number => {
  let rate = rand(minRate, maxRate)
  if (allowSpike && rareSpike()) {
    rate = rand(0.55, 0.9) * (Math.random() < 0.5 ? -1 : 1)
  }
  return Math.max(0, Math.round(base * (1 + rate)))
}

const monotonicInc = (base: number, minInc: number, maxInc: number, allowSpike = false): number => {
  let inc = rand(minInc, maxInc)
  if (allowSpike && rareSpike()) {
    inc = rand(base * 0.55, base * 0.9)
  }
  return Math.round(base + inc)
}

let lastOverviewSnapshot: OverviewData | null = null
let lastUserGrowthSnapshot: Record<string, TrendItem[]> = {}
let lastTokenTrendSnapshot: Record<string, TrendItem[]> = {}
let lastTop10Snapshot: Top10Item[] | null = null

export const getOverview = (): Promise<OverviewData> => {
  const base = lastOverviewSnapshot ?? mockOverviewData
  const spikeForNew = rareSpike()
  const spikeForDAU = !spikeForNew && rareSpike()
  const spikeForTokens = !spikeForNew && !spikeForDAU && rareSpike()

  const data: OverviewData = {
    totalUsers: monotonicInc(base.totalUsers, 5, 40),
    todayNewUsers: perturbValue(base.todayNewUsers, -0.08, 0.12, false),
    todayActiveUsers: perturbValue(base.todayActiveUsers, -0.06, 0.08, false),
    tokenUsersTotal: monotonicInc(base.tokenUsersTotal, 1, 20),
    totalTokens: monotonicInc(base.totalTokens, 8000, 60000, false),
  }

  if (spikeForNew) {
    data.todayNewUsers = Math.max(1, Math.round(base.todayNewUsers * (Math.random() < 0.5 ? rand(1.6, 2.2) : rand(0.3, 0.45))))
  }
  if (spikeForDAU) {
    data.todayActiveUsers = Math.max(1, Math.round(base.todayActiveUsers * (Math.random() < 0.5 ? rand(1.6, 2.1) : rand(0.35, 0.48))))
  }
  if (spikeForTokens) {
    data.totalTokens = Math.round(base.totalTokens + base.totalTokens * rand(0.6, 1.0))
  }

  lastOverviewSnapshot = data
  return Promise.resolve(data)
}

const perturbTrendSeries = (
  cached: Partial<Record<'daily' | 'weekly' | 'monthly', TrendItem[]>>,
  mockSource: Record<'daily' | 'weekly' | 'monthly', TrendItem[]>,
  dim: 'daily' | 'weekly' | 'monthly'
): TrendItem[] => {
  const prev = cached[dim]
  const source = prev ?? mockSource[dim]
  const copy = source.map((item, idx) => {
    if (idx < source.length - 1) {
      return { date: item.date, value: item.value }
    }
    const spike = rareSpike()
    let value: number
    if (spike) {
      value = Math.round(item.value * (Math.random() < 0.5 ? rand(1.6, 2.0) : rand(0.4, 0.55)))
    } else {
      value = perturbValue(item.value, -0.08, 0.1)
    }
    return { date: item.date, value: Math.max(0, value) }
  })
  cached[dim] = copy
  return copy
}

export const getUserGrowth = (dimension: 'daily' | 'weekly' | 'monthly'): Promise<TrendItem[]> => {
  return Promise.resolve(perturbTrendSeries(lastUserGrowthSnapshot, mockUserGrowthData, dimension))
}

export const getTokenTrend = (dimension: 'daily' | 'weekly' | 'monthly'): Promise<TrendItem[]> => {
  return Promise.resolve(perturbTrendSeries(lastTokenTrendSnapshot, mockTokenTrendData, dimension))
}

export const getTokenTop10 = (): Promise<Top10Item[]> => {
  const source = lastTop10Snapshot ?? mockTop10Data
  const data: Top10Item[] = source.map(item => ({
    nick_name: item.nick_name,
    token_sum: perturbValue(item.token_sum, -0.05, 0.08),
  }))
  lastTop10Snapshot = data
  return Promise.resolve(data)
}

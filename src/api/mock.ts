import type { OverviewData, TrendItem, Top10Item } from './datav'

// Mock 概览数据
export const mockOverviewData: OverviewData = {
  totalUsers: 125680,
  todayNewUsers: 342,
  todayActiveUsers: 8567,
  tokenUsersTotal: 45230,
  totalTokens: 98765432
}

// Mock 用户增长趋势数据
export const mockUserGrowthData = {
  daily: [
    { date: '01-28', value: 280 },
    { date: '01-29', value: 310 },
    { date: '01-30', value: 295 },
    { date: '01-31', value: 320 },
    { date: '02-01', value: 298 },
    { date: '02-02', value: 335 },
    { date: '02-03', value: 342 }
  ] as TrendItem[],
  weekly: [
    { date: '2025-W01', value: 1850 },
    { date: '2025-W02', value: 2100 },
    { date: '2025-W03', value: 2280 },
    { date: '2025-W04', value: 2150 },
    { date: '2025-W05', value: 2380 }
  ] as TrendItem[],
  monthly: [
    { date: '2025-08', value: 8500 },
    { date: '2025-09', value: 9200 },
    { date: '2025-10', value: 9800 },
    { date: '2025-11', value: 10500 },
    { date: '2025-12', value: 11200 },
    { date: '2026-01', value: 12300 }
  ] as TrendItem[]
}

// Mock Token 消耗趋势数据
export const mockTokenTrendData = {
  daily: [
    { date: '01-28', value: 1250000 },
    { date: '01-29', value: 1380000 },
    { date: '01-30', value: 1420000 },
    { date: '01-31', value: 1560000 },
    { date: '02-01', value: 1490000 },
    { date: '02-02', value: 1650000 },
    { date: '02-03', value: 1720000 }
  ] as TrendItem[],
  weekly: [
    { date: '2025-W01', value: 8500000 },
    { date: '2025-W02', value: 9200000 },
    { date: '2025-W03', value: 9800000 },
    { date: '2025-W04', value: 10200000 },
    { date: '2025-W05', value: 10900000 }
  ] as TrendItem[],
  monthly: [
    { date: '2025-08', value: 35000000 },
    { date: '2025-09', value: 38500000 },
    { date: '2025-10', value: 42000000 },
    { date: '2025-11', value: 45800000 },
    { date: '2025-12', value: 48900000 },
    { date: '2026-01', value: 52300000 }
  ] as TrendItem[]
}

// Mock Top 10 用户数据
export const mockTop10Data: Top10Item[] = [
  { nick_name: '科技探索者', token_sum: 2580000 },
  { nick_name: 'AI研究员小王', token_sum: 2340000 },
  { nick_name: '代码诗人', token_sum: 2150000 },
  { nick_name: '数据分析师李', token_sum: 1980000 },
  { nick_name: '前端工程师张', token_sum: 1850000 },
  { nick_name: '产品经理陈', token_sum: 1720000 },
  { nick_name: '架构师刘', token_sum: 1650000 },
  { nick_name: 'UI设计师王', token_sum: 1580000 },
  { nick_name: '测试工程师赵', token_sum: 1450000 },
  { nick_name: '运维专家孙', token_sum: 1380000 }
]

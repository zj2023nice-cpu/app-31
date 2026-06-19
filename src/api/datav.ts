import { mockOverviewData, mockUserGrowthData, mockTokenTrendData, mockTop10Data } from './mock'

// 定义数据类型
export interface OverviewData {
  totalUsers: number           // 平台总注册用户量
  todayNewUsers: number        // 今日新增注册用户量
  todayActiveUsers: number     // 今日活跃用户量（DAU）
  tokenUsersTotal: number      // 有 Token 消耗的用户总数
  totalTokens: number          // 平台累计 Token 消耗总量
}

export interface TrendItem {
  date: string                 // 日期
  value: number                // 数值
}

export interface Top10Item {
  nick_name: string            // 用户昵称
  token_sum: number            // Token 总和
}

// 获取概览数据
export const getOverview = (): Promise<OverviewData> => {
  // 直接返回模拟数据
  return Promise.resolve(mockOverviewData)
}

// 获取用户增长趋势
export const getUserGrowth = (dimension: 'daily' | 'weekly' | 'monthly'): Promise<TrendItem[]> => {
  // 直接返回模拟数据
  return Promise.resolve(mockUserGrowthData[dimension])
}

// 获取 Token 消耗趋势
export const getTokenTrend = (dimension: 'daily' | 'weekly' | 'monthly'): Promise<TrendItem[]> => {
  // 直接返回模拟数据
  return Promise.resolve(mockTokenTrendData[dimension])
}

// 获取 Token Top 10 用户
export const getTokenTop10 = (): Promise<Top10Item[]> => {
  // 直接返回模拟数据
  return Promise.resolve(mockTop10Data)
}

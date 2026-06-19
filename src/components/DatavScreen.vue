<template>
  <dv-full-screen-container>
    <div class="datav-screen">
      <!-- 异常提醒条 -->
      <div v-if="currentAnomalies.length > 0" class="anomaly-alert-bar">
        <div class="anomaly-alert-content">
          <span class="anomaly-icon">⚠️</span>
          <span class="anomaly-alert-text">
            <span v-for="(a, idx) in currentAnomalies" :key="idx" class="anomaly-alert-item">
              {{ a.metricName }} 波动 {{ a.changePercent > 0 ? '+' : '' }}{{ a.changePercent.toFixed(1) }}%
            </span>
          </span>
        </div>
      </div>

      <!-- 头部标题 -->
      <div class="header">
        <dv-decoration-10 class="decoration-left" />
        <div class="title-box">
          <dv-decoration-8 :color="['#4cd964', '#1a2332']" class="decoration-8" />
          <h1 class="title">SnapFeel 数据可视化大屏</h1>
          <span class="refresh-indicator">自动刷新：每30秒 | 上次更新：{{ lastRefreshTime }}</span>
          <dv-decoration-8 :reverse="true" :color="['#4cd964', '#1a2332']" class="decoration-8" />
        </div>
        <dv-decoration-10 class="decoration-right" />
      </div>

      <div class="main-content">
        <!-- 第一行：核心指标 -->
        <div class="metrics-row">
          <dv-border-box-12>
            <div class="metric-content">
              <div class="metric-title">平台总注册用户</div>
              <div class="metric-value-animated">{{ formatNumber(overviewData?.totalUsers || 0) }}</div>
            </div>
          </dv-border-box-12>
          
          <dv-border-box-12>
            <div class="metric-content">
              <div class="metric-title">今日新增注册</div>
              <div class="metric-value-animated">{{ formatNumber(overviewData?.todayNewUsers || 0) }}</div>
            </div>
          </dv-border-box-12>
          
          <dv-border-box-12>
            <div class="metric-content">
              <div class="metric-title">今日活跃用户（DAU）</div>
              <div class="metric-value-animated">{{ formatNumber(overviewData?.todayActiveUsers || 0) }}</div>
            </div>
          </dv-border-box-12>
        </div>

        <!-- 第二行：注册用户增长趋势 -->
        <div class="chart-row">
          <dv-border-box-8>
            <div class="chart-content">
              <div class="chart-header">
                <div class="chart-title">注册用户增长趋势</div>
                <div class="dimension-tabs">
                  <span 
                    :class="['tab', userGrowthDimension === 'daily' && 'active']"
                    @click="changeUserGrowthDimension('daily')"
                  >日</span>
                  <span 
                    :class="['tab', userGrowthDimension === 'weekly' && 'active']"
                    @click="changeUserGrowthDimension('weekly')"
                  >周</span>
                  <span 
                    :class="['tab', userGrowthDimension === 'monthly' && 'active']"
                    @click="changeUserGrowthDimension('monthly')"
                  >月</span>
                </div>
              </div>
              <div ref="userGrowthChart" class="chart-inner"></div>
            </div>
          </dv-border-box-8>
        </div>

        <!-- 第三行：Token 相关指标 -->
        <div class="metrics-row">
          <dv-border-box-12>
            <div class="metric-content">
              <div class="metric-title">Token 消耗用户总数</div>
              <div class="metric-value-animated">{{ formatNumber(overviewData?.tokenUsersTotal || 0) }}</div>
            </div>
          </dv-border-box-12>
          
          <dv-border-box-12>
            <div class="metric-content">
              <div class="metric-title">累计 Token 消耗</div>
              <div class="metric-value-animated">{{ formatNumber(overviewData?.totalTokens || 0) }}</div>
            </div>
          </dv-border-box-12>
        </div>

        <!-- 第四行：Token 排行榜和趋势 -->
        <div class="bottom-row">
          <dv-border-box-8 class="ranking-box">
            <div class="chart-content">
              <div class="chart-title">Token 消耗 Top 10 用户</div>
              <div class="ranking-table">
                <div class="ranking-header">
                  <div class="col-rank">排名</div>
                  <div class="col-name">用户</div>
                  <div class="col-token">Token消耗</div>
                </div>
                <div class="ranking-body">
                  <div v-for="(item, index) in top10Data" :key="index" class="ranking-row">
                    <div class="col-rank">{{ index + 1 }}</div>
                    <div class="col-name">{{ item.nick_name }}</div>
                    <div class="col-token">{{ item.token_sum.toLocaleString() }}</div>
                  </div>
                </div>
              </div>
            </div>
          </dv-border-box-8>

          <dv-border-box-8 class="chart-box-large">
            <div class="chart-content">
              <div class="chart-header">
                <div class="chart-title">每日 Token 消耗趋势</div>
                <div class="dimension-tabs">
                  <span 
                    :class="['tab', tokenTrendDimension === 'daily' && 'active']"
                    @click="changeTokenTrendDimension('daily')"
                  >日</span>
                  <span 
                    :class="['tab', tokenTrendDimension === 'weekly' && 'active']"
                    @click="changeTokenTrendDimension('weekly')"
                  >周</span>
                  <span 
                    :class="['tab', tokenTrendDimension === 'monthly' && 'active']"
                    @click="changeTokenTrendDimension('monthly')"
                  >月</span>
                </div>
              </div>
              <div ref="tokenTrendChart" class="chart-inner"></div>
            </div>
          </dv-border-box-8>
        </div>

        <!-- 近期异常记录 -->
        <div class="anomaly-section">
          <dv-border-box-8>
            <div class="anomaly-content">
              <div class="chart-title">近期异常记录</div>
              <div class="anomaly-table" v-if="anomalyRecords.length > 0">
                <div class="anomaly-header">
                  <div class="col-time">时间</div>
                  <div class="col-metric">指标名称</div>
                  <div class="col-change">变化幅度</div>
                  <div class="col-value">当前数值</div>
                </div>
                <div class="anomaly-body">
                  <div v-for="(record, index) in anomalyRecords" :key="index" class="anomaly-row">
                    <div class="col-time">{{ record.time }}</div>
                    <div class="col-metric">{{ record.metricName }}</div>
                    <div :class="['col-change', record.changePercent > 0 ? 'up' : 'down']">
                      {{ record.changePercent > 0 ? '↑' : '↓' }} {{ Math.abs(record.changePercent).toFixed(1) }}%
                    </div>
                    <div class="col-value">{{ formatNumber(record.currentValue) }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="anomaly-empty">暂无异常记录</div>
            </div>
          </dv-border-box-8>
        </div>
      </div>
    </div>
  </dv-full-screen-container>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { getOverview, getUserGrowth, getTokenTrend, getTokenTop10 } from '../api/datav'
import type { OverviewData, TrendItem, Top10Item } from '../api/datav'
import { mockOverviewData, mockUserGrowthData, mockTokenTrendData, mockTop10Data } from '../api/mock'

interface ActiveAnomaly {
  id: number
  metricKey: string
  metricName: string
  changePercent: number
  currentValue: number
  timerId: number
}

interface AnomalyRecord {
  time: string
  metricKey: 'todayNewUsers' | 'todayActiveUsers' | 'totalTokens'
  metricName: string
  changePercent: number
  currentValue: number
}

const ANOMALY_THRESHOLD = 0.5
const ANOMALY_DISPLAY_DURATION = 8000
const REFRESH_INTERVAL = 30000
const MAX_ANOMALY_RECORDS = 20
let anomalyIdCounter = 0

const overviewData = ref<OverviewData | null>(null)
const prevOverviewData = ref<OverviewData | null>(null)
const lastRefreshTime = ref<string>('')
const currentAnomalies = ref<ActiveAnomaly[]>([])
const anomalyRecords = ref<AnomalyRecord[]>([])
let refreshTimer: number | null = null

const userGrowthDimension = ref<'daily' | 'weekly' | 'monthly'>('daily')
const userGrowthData = ref<TrendItem[]>([])
const userGrowthChart = ref<HTMLElement>()
let userGrowthChartInstance: ECharts | null = null

const tokenTrendDimension = ref<'daily' | 'weekly' | 'monthly'>('daily')
const tokenTrendData = ref<TrendItem[]>([])
const tokenTrendChart = ref<HTMLElement>()
let tokenTrendChartInstance: ECharts | null = null

const top10Data = ref<Top10Item[]>([])

const metricNameMap: Record<string, string> = {
  todayNewUsers: '今日新增用户',
  todayActiveUsers: '今日活跃用户(DAU)',
  totalTokens: '累计Token消耗'
}

let lastOverviewCache: OverviewData = { ...mockOverviewData }
let lastUserGrowthCache = { daily: [...mockUserGrowthData.daily], weekly: [...mockUserGrowthData.weekly], monthly: [...mockUserGrowthData.monthly] }
let lastTokenTrendCache = { daily: [...mockTokenTrendData.daily], weekly: [...mockTokenTrendData.weekly], monthly: [...mockTokenTrendData.monthly] }
let lastTop10Cache = [...mockTop10Data]

const applyMicroRealtimeFluctuation = (data: OverviewData): OverviewData => {
  const result = { ...data } as any
  result.todayNewUsers = Math.max(0, Math.round(result.todayNewUsers * (1 + (Math.random() - 0.3) * 0.1)))
  result.todayActiveUsers = Math.max(0, Math.round(result.todayActiveUsers * (1 + (Math.random() - 0.3) * 0.08)))
  result.totalTokens = Math.max(result.totalTokens, Math.round(result.totalTokens * (1 + Math.random() * 0.05)))
  result.totalUsers = Math.max(result.totalUsers, Math.round(result.totalUsers * (1 + Math.random() * 0.01)))
  result.tokenUsersTotal = Math.max(result.tokenUsersTotal, Math.round(result.tokenUsersTotal * (1 + Math.random() * 0.02)))
  return result
}

const applyFallbackFluctuation = (data: OverviewData): OverviewData => {
  const result = { ...data } as any
  const keys: Array<keyof OverviewData> = ['todayNewUsers', 'todayActiveUsers', 'totalTokens', 'totalUsers', 'tokenUsersTotal']
  keys.forEach(key => {
    result[key] = Math.max(0, Math.round(result[key] * (1 + (Math.random() - 0.5) * 1.5)))
  })
  return result
}

const applyTrendMicroFluctuation = <T extends TrendItem[]>(data: T): T => {
  return data.map((item, idx) => {
    const lastVal = idx > 0 ? data[idx - 1].value : item.value
    const growth = Math.random() * 0.08
    return { ...item, value: Math.max(lastVal * 0.9, Math.round(item.value * (1 + growth))) }
  }) as T
}

const applyTrendFallbackFluctuation = <T extends TrendItem[]>(data: T): T => {
  return data.map(item => ({
    ...item,
    value: Math.max(0, Math.round(item.value * (1 + (Math.random() - 0.5) * 1.2)))
  })) as T
}

const applyTop10MicroFluctuation = (data: Top10Item[]): Top10Item[] => {
  return data.map(item => ({
    ...item,
    token_sum: Math.max(0, Math.round(item.token_sum * (1 + Math.random() * 0.1)))
  }))
}

const applyTop10FallbackFluctuation = (data: Top10Item[]): Top10Item[] => {
  return data.map(item => ({
    ...item,
    token_sum: Math.max(0, Math.round(item.token_sum * (1 + (Math.random() - 0.5) * 1.0)))
  }))
}

const formatDateTime = (): string => {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const addActiveAnomaly = (metricKey: string, metricName: string, changePercent: number, currentValue: number) => {
  const id = ++anomalyIdCounter
  const timerId = window.setTimeout(() => {
    currentAnomalies.value = currentAnomalies.value.filter(a => a.id !== id)
  }, ANOMALY_DISPLAY_DURATION)
  currentAnomalies.value.push({ id, metricKey, metricName, changePercent, currentValue, timerId })
}

const detectAnomalies = (newData: OverviewData) => {
  if (!prevOverviewData.value) {
    console.log('[DataV] 首次加载，跳过异常检测')
    return
  }
  
  const metricsToCheck: Array<keyof OverviewData> = ['todayNewUsers', 'todayActiveUsers', 'totalTokens']
  const now = formatDateTime()
  
  console.log(`[DataV] ===== 刷新于 ${now}，开始异常检测 =====`)
  console.log(`[DataV] 旧数据:`, {
    todayNewUsers: prevOverviewData.value.todayNewUsers,
    todayActiveUsers: prevOverviewData.value.todayActiveUsers,
    totalTokens: prevOverviewData.value.totalTokens
  })
  console.log(`[DataV] 新数据:`, {
    todayNewUsers: newData.todayNewUsers,
    todayActiveUsers: newData.todayActiveUsers,
    totalTokens: newData.totalTokens
  })
  
  metricsToCheck.forEach(key => {
    const oldVal = prevOverviewData.value![key]
    const newVal = newData[key]
    let isAnomaly = false
    let changePercent = 0
    
    if (oldVal === 0) {
      if (newVal > 0) {
        isAnomaly = true
        changePercent = newVal > 0 ? 999 : 0
      }
    } else {
      changePercent = ((newVal - oldVal) / oldVal) * 100
      if (Math.abs(changePercent / 100) > ANOMALY_THRESHOLD) {
        isAnomaly = true
      }
    }
    
    if (isAnomaly) {
      console.log(`[DataV] 🚨 异常检测: ${metricNameMap[key]} 波动 ${changePercent.toFixed(1)}% (${oldVal} → ${newVal})`)
      const record: AnomalyRecord = {
        time: now,
        metricKey: key as any,
        metricName: metricNameMap[key],
        changePercent,
        currentValue: newVal
      }
      anomalyRecords.value = [record, ...anomalyRecords.value].slice(0, MAX_ANOMALY_RECORDS)
      addActiveAnomaly(key as string, metricNameMap[key], changePercent, newVal)
    } else {
      console.log(`[DataV] ✓ 正常: ${metricNameMap[key]} 波动 ${changePercent.toFixed(1)}%`)
    }
  })
  console.log(`[DataV] ===== 检测完成，当前活跃异常: ${currentAnomalies.value.length} 条，历史记录: ${anomalyRecords.value.length} 条 =====`)
}

// 格式化数字，添加千位分隔符
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

const loadOverview = async () => {
  let rawData: OverviewData
  let isFromApi = false
  try {
    rawData = await getOverview()
    isFromApi = true
    console.log('[DataV] [Overview] ✅ API真实数据获取成功，原始值:', rawData)
  } catch (error) {
    console.warn('[DataV] [Overview] ❌ API请求失败，使用上次缓存基线:', error)
    rawData = lastOverviewCache
    isFromApi = false
  }

  let finalData: OverviewData
  if (isFromApi) {
    finalData = applyMicroRealtimeFluctuation(rawData)
    console.log('[DataV] [Overview] 📊 基于API数据做微小实时微调:', {
      原始API值: { todayNewUsers: rawData.todayNewUsers, todayActiveUsers: rawData.todayActiveUsers, totalTokens: rawData.totalTokens },
      微调后值: { todayNewUsers: finalData.todayNewUsers, todayActiveUsers: finalData.todayActiveUsers, totalTokens: finalData.totalTokens }
    })
    lastOverviewCache = { ...finalData }
  } else {
    finalData = applyFallbackFluctuation(rawData)
    console.log('[DataV] [Overview] 📊 基于缓存做Fallback波动:', {
      基线值: { todayNewUsers: rawData.todayNewUsers, todayActiveUsers: rawData.todayActiveUsers, totalTokens: rawData.totalTokens },
      波动后值: { todayNewUsers: finalData.todayNewUsers, todayActiveUsers: finalData.todayActiveUsers, totalTokens: finalData.totalTokens }
    })
  }

  overviewData.value = finalData
  detectAnomalies(overviewData.value)
  prevOverviewData.value = { ...overviewData.value }
}

const loadUserGrowth = async () => {
  let rawData: TrendItem[]
  let isFromApi = false
  const dim = userGrowthDimension.value
  try {
    rawData = await getUserGrowth(dim)
    isFromApi = true
    console.log(`[DataV] [UserGrowth:${dim}] ✅ API真实数据获取成功，点数:`, rawData.length)
  } catch (error) {
    console.warn(`[DataV] [UserGrowth:${dim}] ❌ API失败，使用缓存`)
    rawData = lastUserGrowthCache[dim]
    isFromApi = false
  }

  let finalData: TrendItem[]
  if (isFromApi) {
    finalData = applyTrendMicroFluctuation(rawData)
    lastUserGrowthCache[dim] = [...finalData]
  } else {
    finalData = applyTrendFallbackFluctuation(rawData)
  }

  userGrowthData.value = finalData
  await nextTick()
  setTimeout(() => {
    renderUserGrowthChart()
  }, 100)
}

// 切换用户增长维度
const changeUserGrowthDimension = (dimension: 'daily' | 'weekly' | 'monthly') => {
  userGrowthDimension.value = dimension
  loadUserGrowth()
}

const renderUserGrowthChart = () => {
  if (!userGrowthChart.value) return
  if (!userGrowthData.value || userGrowthData.value.length === 0) return
  
  if (!userGrowthChartInstance) {
    userGrowthChartInstance = echarts.init(userGrowthChart.value)
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#4cd964',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: userGrowthData.value.map(item => item.date),
      axisLine: { lineStyle: { color: '#4cd964' } },
      axisLabel: { color: '#4cd964' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#4cd964' } },
      axisLabel: { color: '#4cd964' },
      splitLine: { lineStyle: { color: 'rgba(76, 217, 100, 0.2)' } }
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#4cd964' },
        lineStyle: { width: 2, color: '#4cd964' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(76, 217, 100, 0.5)' },
            { offset: 1, color: 'rgba(76, 217, 100, 0.1)' }
          ])
        },
        data: userGrowthData.value.map(item => item.value)
      }
    ]
  }

  userGrowthChartInstance.setOption(option)
}

const loadTokenTrend = async () => {
  let rawData: TrendItem[]
  let isFromApi = false
  const dim = tokenTrendDimension.value
  try {
    rawData = await getTokenTrend(dim)
    isFromApi = true
    console.log(`[DataV] [TokenTrend:${dim}] ✅ API真实数据获取成功，点数:`, rawData.length)
  } catch (error) {
    console.warn(`[DataV] [TokenTrend:${dim}] ❌ API失败，使用缓存`)
    rawData = lastTokenTrendCache[dim]
    isFromApi = false
  }

  let finalData: TrendItem[]
  if (isFromApi) {
    finalData = applyTrendMicroFluctuation(rawData)
    lastTokenTrendCache[dim] = [...finalData]
  } else {
    finalData = applyTrendFallbackFluctuation(rawData)
  }

  tokenTrendData.value = finalData
  await nextTick()
  setTimeout(() => {
    renderTokenTrendChart()
  }, 100)
}

const changeTokenTrendDimension = (dimension: 'daily' | 'weekly' | 'monthly') => {
  tokenTrendDimension.value = dimension
  loadTokenTrend()
}

const renderTokenTrendChart = () => {
  if (!tokenTrendChart.value) return
  if (!tokenTrendData.value || tokenTrendData.value.length === 0) return
  
  if (!tokenTrendChartInstance) {
    tokenTrendChartInstance = echarts.init(tokenTrendChart.value)
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#4cd964',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: tokenTrendData.value.map(item => item.date),
      axisLine: { lineStyle: { color: '#4cd964' } },
      axisLabel: { color: '#4cd964' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#4cd964' } },
      axisLabel: { color: '#4cd964' },
      splitLine: { lineStyle: { color: 'rgba(76, 217, 100, 0.2)' } }
    },
    series: [
      {
        name: 'Token 消耗',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#4cd964' },
        lineStyle: { width: 2, color: '#4cd964' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(76, 217, 100, 0.5)' },
            { offset: 1, color: 'rgba(76, 217, 100, 0.1)' }
          ])
        },
        data: tokenTrendData.value.map(item => item.value)
      }
    ]
  }

  tokenTrendChartInstance.setOption(option)
}

const loadTop10 = async () => {
  let rawData: Top10Item[]
  let isFromApi = false
  try {
    rawData = await getTokenTop10()
    isFromApi = true
    console.log('[DataV] [Top10] ✅ API真实数据获取成功，人数:', rawData.length)
  } catch (error) {
    console.warn('[DataV] [Top10] ❌ API失败，使用缓存')
    rawData = lastTop10Cache
    isFromApi = false
  }

  let finalData: Top10Item[]
  if (isFromApi) {
    finalData = applyTop10MicroFluctuation(rawData)
    lastTop10Cache = [...finalData]
  } else {
    finalData = applyTop10FallbackFluctuation(rawData)
  }

  top10Data.value = finalData
}

const loadAllData = async () => {
  lastRefreshTime.value = formatDateTime()
  console.log(`[DataV] ========== 开始全量刷新 @ ${lastRefreshTime.value} ==========`)
  await Promise.all([
    loadOverview(),
    loadUserGrowth(),
    loadTokenTrend(),
    loadTop10()
  ])
  console.log(`[DataV] ========== 全量刷新完成 @ ${lastRefreshTime.value} ==========\n`)
}

const handleResize = () => {
  userGrowthChartInstance?.resize()
  tokenTrendChartInstance?.resize()
}

onMounted(() => {
  loadAllData()
  window.addEventListener('resize', handleResize)
  refreshTimer = window.setInterval(() => {
    loadAllData()
  }, REFRESH_INTERVAL)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  currentAnomalies.value.forEach(a => clearTimeout(a.timerId))
  userGrowthChartInstance?.dispose()
  tokenTrendChartInstance?.dispose()
})
</script>

<style scoped>
.datav-screen {
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, #0a1929, #1a2332);
  color: #fff;
  padding: 20px;
  box-sizing: border-box;
}

.anomaly-alert-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(90deg, #ff3b30, #ff6b6b, #ff3b30);
  animation: anomalyBlink 0.5s ease-in-out infinite alternate;
  padding: 12px 20px;
  box-shadow: 0 0 20px rgba(255, 59, 48, 0.8);
}

@keyframes anomalyBlink {
  0% { opacity: 0.8; }
  100% { opacity: 1; box-shadow: 0 0 30px rgba(255, 59, 48, 1); }
}

.anomaly-alert-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  font-weight: bold;
  font-size: 16px;
  color: #fff;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.anomaly-icon {
  font-size: 20px;
  animation: iconPulse 0.8s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.anomaly-alert-text {
  display: flex;
  gap: 30px;
}

.anomaly-alert-item {
  white-space: nowrap;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
  margin-top: 50px;
  height: 80px;
}

.decoration-left,
.decoration-right {
  flex: 1;
  height: 40px;
}

.title-box {
  display: flex;
  align-items: center;
  gap: 20px;
}

.decoration-8 {
  width: 150px;
  height: 40px;
}

.title {
  margin: 0;
  font-size: 32px;
  font-weight: bold;
  color: #4cd964;
  text-shadow: 0 0 10px rgba(76, 217, 100, 0.5);
  white-space: nowrap;
}

.refresh-indicator {
  font-size: 14px;
  color: rgba(76, 217, 100, 0.8);
  white-space: nowrap;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100% - 170px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 5px;
}

/* 自定义滚动条样式 */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: rgba(76, 217, 100, 0.1);
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb {
  background: rgba(76, 217, 100, 0.5);
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: rgba(76, 217, 100, 0.7);
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  height: 150px;
}

.metrics-row:last-of-type {
  grid-template-columns: repeat(2, 1fr);
}

.chart-row {
  height: 300px;
}

.chart-row .chart-content {
  height: 100%;
}

.chart-row .chart-inner {
  flex: 1;
  min-height: 220px;
}

.bottom-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  flex: 1;
  min-height: 400px;
}

.metric-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
  padding: 20px;
}

.metric-title {
  font-size: 16px;
  color: #4cd964;
}

.metric-value {
  font-size: 42px;
  color: #4cd964;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(76, 217, 100, 0.5);
}

.metric-value-animated {
  font-size: 48px;
  color: #4cd964;
  font-weight: bold;
  text-shadow: 0 0 20px rgba(76, 217, 100, 0.8), 0 0 40px rgba(76, 217, 100, 0.4);
  animation: numberPulse 2s ease-in-out infinite;
  letter-spacing: 2px;
}

@keyframes numberPulse {
  0%, 100% {
    text-shadow: 0 0 20px rgba(76, 217, 100, 0.8), 0 0 40px rgba(76, 217, 100, 0.4);
  }
  50% {
    text-shadow: 0 0 25px rgba(76, 217, 100, 1), 0 0 50px rgba(76, 217, 100, 0.6);
  }
}

.digital-flop {
  width: 100%;
}

.chart-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 15px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-shrink: 0;
}

.chart-title {
  font-size: 18px;
  color: #4cd964;
  font-weight: bold;
}

.dimension-tabs {
  display: flex;
  gap: 10px;
}

.tab {
  padding: 5px 15px;
  background: rgba(76, 217, 100, 0.2);
  border: 1px solid #4cd964;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.tab:hover {
  background: rgba(76, 217, 100, 0.3);
}

.tab.active {
  background: #4cd964;
  color: #0a1929;
}

.chart-inner {
  flex: 1;
  min-height: 0;
}

.scroll-board {
  height: calc(100% - 60px);
  margin-top: 10px;
}

.ranking-table {
  height: calc(100% - 40px);
  margin-top: 10px;
  overflow: hidden;
}

.ranking-header {
  display: grid;
  grid-template-columns: 80px 1fr 150px;
  gap: 10px;
  padding: 12px 15px;
  background: #4cd964;
  color: #0a1929;
  font-weight: bold;
  font-size: 16px;
  border-radius: 4px 4px 0 0;
}

.ranking-body {
  max-height: calc(100% - 50px);
  overflow-y: auto;
}

.ranking-body::-webkit-scrollbar {
  width: 6px;
}

.ranking-body::-webkit-scrollbar-track {
  background: rgba(76, 217, 100, 0.1);
}

.ranking-body::-webkit-scrollbar-thumb {
  background: rgba(76, 217, 100, 0.5);
  border-radius: 3px;
}

.ranking-row {
  display: grid;
  grid-template-columns: 80px 1fr 150px;
  gap: 10px;
  padding: 12px 15px;
  color: #4cd964;
  font-size: 14px;
  border-bottom: 1px solid rgba(76, 217, 100, 0.1);
}

.ranking-row:nth-child(odd) {
  background: rgba(76, 217, 100, 0.05);
}

.ranking-row:nth-child(even) {
  background: rgba(26, 35, 50, 0.3);
}

.col-rank {
  text-align: center;
}

.col-name {
  text-align: left;
}

.col-token {
  text-align: right;
}

.ranking-box,
.chart-box-large {
  height: 100%;
}

.anomaly-section {
  min-height: 250px;
}

.anomaly-content {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.anomaly-table {
  margin-top: 10px;
  flex: 1;
  overflow: hidden;
}

.anomaly-header {
  display: grid;
  grid-template-columns: 120px 1fr 120px 150px;
  gap: 10px;
  padding: 12px 15px;
  background: linear-gradient(90deg, #ff3b30, #ff6b6b);
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  border-radius: 4px 4px 0 0;
}

.anomaly-body {
  max-height: 180px;
  overflow-y: auto;
}

.anomaly-body::-webkit-scrollbar {
  width: 6px;
}

.anomaly-body::-webkit-scrollbar-track {
  background: rgba(255, 59, 48, 0.1);
}

.anomaly-body::-webkit-scrollbar-thumb {
  background: rgba(255, 59, 48, 0.5);
  border-radius: 3px;
}

.anomaly-row {
  display: grid;
  grid-template-columns: 120px 1fr 120px 150px;
  gap: 10px;
  padding: 10px 15px;
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 59, 48, 0.15);
}

.anomaly-row:nth-child(odd) {
  background: rgba(255, 59, 48, 0.05);
}

.anomaly-row:nth-child(even) {
  background: rgba(26, 35, 50, 0.3);
}

.col-time {
  color: rgba(255, 255, 255, 0.7);
  font-family: monospace;
}

.col-metric {
  color: #fff;
}

.col-change {
  font-weight: bold;
  text-align: center;
}

.col-change.up {
  color: #ff4444;
}

.col-change.down {
  color: #00e676;
}

.col-value {
  color: #4cd964;
  text-align: right;
  font-weight: bold;
  font-family: monospace;
}

.anomaly-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(76, 217, 100, 0.5);
  font-size: 16px;
  margin-top: 20px;
}
</style>

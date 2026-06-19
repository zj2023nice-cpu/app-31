<template>
  <dv-full-screen-container>
    <div class="datav-screen">
      <!-- 顶部异常提醒条：本轮所有异常指标并列显示 -->
      <div v-if="isAlertFlashing" class="alert-bar">
        <span class="alert-icon">⚠</span>
        <span class="alert-prefix">检测到指标剧烈波动：</span>
        <span
          v-for="(a, i) in currentAlerts"
          :key="i"
          class="alert-item"
        >
          {{ a.metric }}
          <span :class="a.changeRate >= 0 ? 'rate-up' : 'rate-down'">
            {{ a.changeRate >= 0 ? '+' : '' }}{{ a.changeRate.toFixed(1) }}%
          </span>
          <span class="alert-current">（当前 {{ formatNumber(a.currentValue) }}）</span>
        </span>
      </div>

      <!-- 头部标题 -->
      <div class="header">
        <dv-decoration-10 class="decoration-left" />
        <div class="title-box">
          <dv-decoration-8 :color="['#4cd964', '#1a2332']" class="decoration-8" />
          <h1 class="title">SnapFeel 数据可视化大屏</h1>
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

        <!-- 第五行：近期异常记录 -->
        <div class="anomaly-row">
          <dv-border-box-8>
            <div class="chart-content">
              <div class="chart-title">近期异常记录（最近 {{ MAX_ANOMALY_RECORDS }} 条）</div>
              <div class="anomaly-table">
                <div class="anomaly-header">
                  <div>时间</div>
                  <div>指标</div>
                  <div>变化幅度</div>
                  <div>当前数值</div>
                </div>
                <div class="anomaly-body">
                  <div
                    v-for="(row, idx) in anomalyList"
                    :key="idx"
                    class="anomaly-row-item"
                  >
                    <div>{{ row.time }}</div>
                    <div>{{ row.metric }}</div>
                    <div :class="row.changeRate >= 0 ? 'rate-up' : 'rate-down'">
                      {{ row.changeRate >= 0 ? '+' : '' }}{{ row.changeRate.toFixed(1) }}%
                    </div>
                    <div>{{ formatNumber(row.currentValue) }}</div>
                  </div>
                  <div v-if="anomalyList.length === 0" class="anomaly-empty">
                    暂无异常记录
                  </div>
                </div>
              </div>
            </div>
          </dv-border-box-8>
        </div>
      </div>
    </div>
  </dv-full-screen-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { getOverview, getUserGrowth, getTokenTrend, getTokenTop10 } from '../api/datav'
import type { OverviewData, TrendItem, Top10Item } from '../api/datav'
import { mockOverviewData, mockUserGrowthData, mockTokenTrendData, mockTop10Data } from '../api/mock'

// 定时刷新与异常检测相关常量
const REFRESH_INTERVAL = 30_000
const ANOMALY_THRESHOLD = 0.5
const MAX_ANOMALY_RECORDS = 20
const ALERT_MIN_DURATION = 10_000

// 演示扰动配置（不修改 mock 文件，仅在赋值前对数值做轻微随机浮动）
const DEMO_JITTER_ENABLED = true
const DEMO_JITTER_RANGE = 0.05
const DEMO_SPIKE_PROBABILITY = 0.1
const DEMO_SPIKE_RANGE = 0.6
const JITTER_MIN_VALUE = 10

// 异常记录类型
interface AnomalyRecord {
  time: string
  metric: string
  changeRate: number
  currentValue: number
}

// 待监测指标快照类型
interface MetricSnapshot {
  todayNewUsers: number
  todayActiveUsers: number
  totalTokens: number
}

// 概览数据
const overviewData = ref<OverviewData | null>(null)

// 用户增长趋势
const userGrowthDimension = ref<'daily' | 'weekly' | 'monthly'>('daily')
const userGrowthData = ref<TrendItem[]>([])
const userGrowthChart = ref<HTMLElement>()
let userGrowthChartInstance: ECharts | null = null

// Token 趋势
const tokenTrendDimension = ref<'daily' | 'weekly' | 'monthly'>('daily')
const tokenTrendData = ref<TrendItem[]>([])
const tokenTrendChart = ref<HTMLElement>()
let tokenTrendChartInstance: ECharts | null = null

// Token Top 10
const top10Data = ref<Top10Item[]>([])

// 异常检测状态
const previousSnapshot = ref<MetricSnapshot | null>(null)
const anomalyList = ref<AnomalyRecord[]>([])
const currentAlerts = ref<AnomalyRecord[]>([])
const alertVisible = ref<boolean>(false)
const isAlertFlashing = computed(() => alertVisible.value && currentAlerts.value.length > 0)

// 定时器与首次加载标志
let refreshTimer: number | null = null
let alertTimer: number | null = null
let isFirstLoad = true

// 格式化数字，添加千位分隔符
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

// 时间格式化：YYYY-MM-DD HH:mm:ss
const formatTime = (d: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 通用扰动：常态 ±5%，剧烈 ±60%（10% 概率），下限保护避免归零或假性异常
const jitter = (value: number): number => {
  if (!DEMO_JITTER_ENABLED || isFirstLoad) return value
  if (value < JITTER_MIN_VALUE) return value
  const isSpike = Math.random() < DEMO_SPIKE_PROBABILITY
  const range = isSpike ? DEMO_SPIKE_RANGE : DEMO_JITTER_RANGE
  const factor = 1 + (Math.random() * 2 - 1) * range
  const next = Math.round(value * factor)
  return Math.max(JITTER_MIN_VALUE, next)
}

// 累计类指标只允许向上扰动（保留 spike 概率以便触发告警），且单调不降
const jitterMonotonic = (value: number, prev?: number): number => {
  if (!DEMO_JITTER_ENABLED || isFirstLoad) return Math.max(value, prev ?? value)
  if (value < JITTER_MIN_VALUE) return Math.max(value, prev ?? value)
  const isSpike = Math.random() < DEMO_SPIKE_PROBABILITY
  const range = isSpike ? DEMO_SPIKE_RANGE : DEMO_JITTER_RANGE
  // 只取正向因子：[1, 1+range]
  const factor = 1 + Math.random() * range
  const baseline = Math.max(value, prev ?? 0)
  return Math.round(baseline * factor)
}

// 加载概览数据
const loadOverview = async () => {
  let raw: OverviewData
  try {
    raw = await getOverview()
  } catch (error) {
    console.warn('API 请求失败，使用 Mock 数据', error)
    raw = mockOverviewData
  }
  const prev = overviewData.value
  // 普通指标：双向扰动；累计指标：单向扰动 + 单调不降
  overviewData.value = {
    ...raw,
    totalUsers: jitterMonotonic(raw.totalUsers, prev?.totalUsers),
    todayNewUsers: jitter(raw.todayNewUsers),
    todayActiveUsers: jitter(raw.todayActiveUsers),
    tokenUsersTotal: jitterMonotonic(raw.tokenUsersTotal, prev?.tokenUsersTotal),
    totalTokens: jitterMonotonic(raw.totalTokens, prev?.totalTokens)
  }
}

// 加载用户增长趋势
const loadUserGrowth = async () => {
  let raw: TrendItem[]
  try {
    raw = await getUserGrowth(userGrowthDimension.value)
  } catch (error) {
    console.warn('API 请求失败，使用 Mock 数据', error)
    raw = mockUserGrowthData[userGrowthDimension.value]
  }
  // 用户新增是增量类指标，可双向扰动让折线动起来
  userGrowthData.value = raw.map(item => ({ ...item, value: jitter(item.value) }))
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

// 渲染用户增长趋势图
const renderUserGrowthChart = () => {
  if (!userGrowthChart.value) {
    console.warn('用户增长图表容器未准备好')
    return
  }
  
  if (!userGrowthData.value || userGrowthData.value.length === 0) {
    console.warn('用户增长数据为空')
    return
  }
  
  console.log('开始渲染用户增长图表，数据：', userGrowthData.value)
  
  if (!userGrowthChartInstance) {
    userGrowthChartInstance = echarts.init(userGrowthChart.value)
    console.log('初始化用户增长图表实例')
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#4cd964',
      textStyle: {
        color: '#fff'
      }
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
      axisLine: {
        lineStyle: {
          color: '#4cd964'
        }
      },
      axisLabel: {
        color: '#4cd964'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#4cd964'
        }
      },
      axisLabel: {
        color: '#4cd964'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(76, 217, 100, 0.2)'
        }
      }
    },
    series: [
      {
        name: '新增用户',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#4cd964'
        },
        lineStyle: {
          width: 2,
          color: '#4cd964'
        },
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
  console.log('用户增长图表渲染完成')
}

// 加载 Token 趋势
const loadTokenTrend = async () => {
  let raw: TrendItem[]
  try {
    raw = await getTokenTrend(tokenTrendDimension.value)
  } catch (error) {
    console.warn('API 请求失败，使用 Mock 数据', error)
    raw = mockTokenTrendData[tokenTrendDimension.value]
  }
  // 折线图按日切片视为当日消耗量（增量），允许双向扰动以驱动可视化
  tokenTrendData.value = raw.map(item => ({ ...item, value: jitter(item.value) }))
  await nextTick()
  setTimeout(() => {
    renderTokenTrendChart()
  }, 100)
}

// 切换 Token 趋势维度
const changeTokenTrendDimension = (dimension: 'daily' | 'weekly' | 'monthly') => {
  tokenTrendDimension.value = dimension
  loadTokenTrend()
}

// 渲染 Token 趋势图
const renderTokenTrendChart = () => {
  if (!tokenTrendChart.value) {
    console.warn('Token趋势图表容器未准备好')
    return
  }
  
  if (!tokenTrendData.value || tokenTrendData.value.length === 0) {
    console.warn('Token趋势数据为空')
    return
  }
  
  console.log('开始渲染Token趋势图表，数据：', tokenTrendData.value)
  
  if (!tokenTrendChartInstance) {
    tokenTrendChartInstance = echarts.init(tokenTrendChart.value)
    console.log('初始化Token趋势图表实例')
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#4cd964',
      textStyle: {
        color: '#fff'
      }
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
      axisLine: {
        lineStyle: {
          color: '#4cd964'
        }
      },
      axisLabel: {
        color: '#4cd964'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#4cd964'
        }
      },
      axisLabel: {
        color: '#4cd964'
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(76, 217, 100, 0.2)'
        }
      }
    },
    series: [
      {
        name: 'Token 消耗',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#4cd964'
        },
        lineStyle: {
          width: 2,
          color: '#4cd964'
        },
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
  console.log('Token趋势图表渲染完成')
}

// 加载 Top 10 数据
const loadTop10 = async () => {
  let raw: Top10Item[]
  try {
    raw = await getTokenTop10()
  } catch (error) {
    console.warn('API 请求失败，使用 Mock 数据', error)
    raw = mockTop10Data
  }
  // 个人累计消耗：单调不降扰动
  const prevMap = new Map<string, number>()
  top10Data.value.forEach(item => prevMap.set(item.nick_name, item.token_sum))
  top10Data.value = raw.map(item => ({
    ...item,
    token_sum: jitterMonotonic(item.token_sum, prevMap.get(item.nick_name))
  }))
}

// 异常检测：仅对相邻两次刷新做对比，本轮所有命中的指标一并记录
const detectAnomaly = () => {
  if (!overviewData.value) return
  const snap: MetricSnapshot = {
    todayNewUsers: overviewData.value.todayNewUsers,
    todayActiveUsers: overviewData.value.todayActiveUsers,
    totalTokens: overviewData.value.totalTokens
  }
  // 冷启动：仅记录快照，不报警
  if (previousSnapshot.value === null) {
    previousSnapshot.value = snap
    return
  }
  const checks: Array<{ key: keyof MetricSnapshot; label: string }> = [
    { key: 'todayNewUsers', label: '今日新增用户' },
    { key: 'todayActiveUsers', label: 'DAU' },
    { key: 'totalTokens', label: '累计 Token 消耗' }
  ]
  const hits: AnomalyRecord[] = []
  const now = formatTime(new Date())
  checks.forEach(({ key, label }) => {
    const prevVal = previousSnapshot.value![key]
    const currVal = snap[key]
    // 下限保护：基数过小时跳过，避免假性异常
    if (prevVal < JITTER_MIN_VALUE) return
    const rate = (currVal - prevVal) / prevVal
    if (Math.abs(rate) > ANOMALY_THRESHOLD) {
      hits.push({
        time: now,
        metric: label,
        changeRate: rate * 100,
        currentValue: currVal
      })
    }
  })
  if (hits.length > 0) {
    currentAlerts.value = hits
    alertVisible.value = true
    // 历史列表保留最近 N 条
    anomalyList.value.unshift(...hits)
    if (anomalyList.value.length > MAX_ANOMALY_RECORDS) {
      anomalyList.value.length = MAX_ANOMALY_RECORDS
    }
    // 红条至少停留 ALERT_MIN_DURATION 毫秒
    if (alertTimer !== null) {
      clearTimeout(alertTimer)
    }
    alertTimer = window.setTimeout(() => {
      alertVisible.value = false
      currentAlerts.value = []
      alertTimer = null
    }, ALERT_MIN_DURATION)
  }
  previousSnapshot.value = snap
}

// 一次性刷新全部数据，并触发异常检测
const refreshAll = async () => {
  await Promise.all([loadOverview(), loadUserGrowth(), loadTokenTrend(), loadTop10()])
  detectAnomaly()
  isFirstLoad = false
}

// 窗口 resize 处理
const handleResize = () => {
  userGrowthChartInstance?.resize()
  tokenTrendChartInstance?.resize()
}

// 组件挂载
onMounted(async () => {
  await refreshAll()
  // 启动 30 秒自动刷新
  refreshTimer = window.setInterval(refreshAll, REFRESH_INTERVAL)
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (refreshTimer !== null) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  if (alertTimer !== null) {
    clearTimeout(alertTimer)
    alertTimer = null
  }
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

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
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
  width: 200px;
  height: 40px;
}

.title {
  margin: 0;
  font-size: 36px;
  font-weight: bold;
  color: #4cd964;
  text-shadow: 0 0 10px rgba(76, 217, 100, 0.5);
  white-space: nowrap;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100% - 120px);
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

/* 顶部异常告警条 */
.alert-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 20px;
  margin-bottom: 12px;
  background: #ff2d55;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-radius: 4px;
  box-shadow: 0 0 20px rgba(255, 45, 85, 0.8);
  animation: alertFlash 0.8s ease-in-out infinite;
}

.alert-icon {
  font-size: 20px;
}

.alert-prefix {
  letter-spacing: 1px;
}

.alert-item {
  padding-right: 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.4);
}

.alert-item:last-child {
  border-right: none;
}

.alert-current {
  font-weight: normal;
  opacity: 0.85;
  margin-left: 4px;
}

@keyframes alertFlash {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 20px rgba(255, 45, 85, 0.8);
  }
  50% {
    opacity: 0.55;
    box-shadow: 0 0 30px rgba(255, 45, 85, 1);
  }
}

/* 近期异常记录列表 */
.anomaly-row {
  height: 260px;
  flex-shrink: 0;
}

.anomaly-table {
  height: calc(100% - 40px);
  margin-top: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.anomaly-header {
  display: grid;
  grid-template-columns: 200px 1fr 140px 160px;
  gap: 10px;
  padding: 12px 15px;
  background: #4cd964;
  color: #0a1929;
  font-weight: bold;
  font-size: 16px;
  border-radius: 4px 4px 0 0;
  flex-shrink: 0;
}

.anomaly-body {
  flex: 1;
  overflow-y: auto;
}

.anomaly-body::-webkit-scrollbar {
  width: 6px;
}

.anomaly-body::-webkit-scrollbar-track {
  background: rgba(76, 217, 100, 0.1);
}

.anomaly-body::-webkit-scrollbar-thumb {
  background: rgba(76, 217, 100, 0.5);
  border-radius: 3px;
}

.anomaly-row-item {
  display: grid;
  grid-template-columns: 200px 1fr 140px 160px;
  gap: 10px;
  padding: 10px 15px;
  color: #4cd964;
  font-size: 14px;
  border-bottom: 1px solid rgba(76, 217, 100, 0.1);
}

.anomaly-row-item:nth-child(odd) {
  background: rgba(76, 217, 100, 0.05);
}

.anomaly-row-item:nth-child(even) {
  background: rgba(26, 35, 50, 0.3);
}

.anomaly-empty {
  text-align: center;
  color: rgba(76, 217, 100, 0.6);
  padding: 30px 0;
  font-size: 14px;
}

.rate-up {
  color: #ff2d55;
  font-weight: bold;
}

.rate-down {
  color: #4cd964;
  font-weight: bold;
}
</style>

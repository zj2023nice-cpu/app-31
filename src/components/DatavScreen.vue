<template>
  <dv-full-screen-container>
    <div class="datav-screen">
      <!-- 异常告警条 -->
      <div v-if="activeAlerts.length > 0" class="alert-bar-container">
        <div
          v-for="(alert, idx) in activeAlerts"
          :key="`${alert.time}-${alert.metricKey}-${idx}`"
          class="alert-bar"
        >
          <span class="alert-icon">⚠</span>
          <span class="alert-text">
            异常提醒：<b class="alert-metric">{{ alert.metricName }}</b>
            从 <b>{{ formatNumber(alert.prevValue) }}</b>
            <span :class="['alert-change', alert.changeRate >= 0 ? 'up' : 'down']">
              {{ alert.changeRate >= 0 ? '骤升至' : '骤降至' }}
              {{ formatNumber(alert.currentValue) }}
              （{{ formatChangeRate(alert.changeRate) }}）
            </span>
            ，请关注！
          </span>
          <span v-if="activeAlerts.length > 1 && idx === 0" class="alert-more">
            +{{ activeAlerts.length - 1 }}
          </span>
        </div>
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
        <div class="abnormal-row">
          <dv-border-box-8>
            <div class="chart-content">
              <div class="chart-header">
                <div class="chart-title">近期异常记录（最近 20 条）</div>
              </div>
              <div class="abnormal-table">
                <div class="abnormal-header">
                  <div class="col-time">时间</div>
                  <div class="col-metric">指标名称</div>
                  <div class="col-change">变化幅度</div>
                  <div class="col-value">当前数值</div>
                </div>
                <div class="abnormal-body">
                  <div v-if="abnormalRecords.length === 0" class="abnormal-empty">
                    暂无异常记录
                  </div>
                  <div
                    v-for="(record, index) in abnormalRecords"
                    :key="`${record.time}-${record.metricKey}-${index}`"
                    class="abnormal-row-item"
                  >
                    <div class="col-time">{{ record.time }}</div>
                    <div class="col-metric">{{ record.metricName }}</div>
                    <div :class="['col-change', record.changeRate >= 0 ? 'up' : 'down']">
                      {{ formatChangeRate(record.changeRate) }}
                    </div>
                    <div class="col-value">{{ formatNumber(record.currentValue) }}</div>
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
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { getOverview, getUserGrowth, getTokenTrend, getTokenTop10 } from '../api/datav'
import type { OverviewData, TrendItem, Top10Item, AbnormalRecord, MetricKey } from '../api/datav'
import { mockOverviewData, mockUserGrowthData, mockTokenTrendData, mockTop10Data } from '../api/mock'

const REFRESH_INTERVAL = 30000
const ABNORMAL_THRESHOLD = 0.5
const ALERT_DISPLAY_DURATION = 6000
const MAX_ABNORMAL_RECORDS = 20

const METRIC_META: Record<MetricKey, { name: string }> = {
  todayNewUsers: { name: '今日新增用户' },
  todayActiveUsers: { name: 'DAU（今日活跃用户）' },
  totalTokens: { name: '累计 Token 消耗' },
}

// 概览数据
const overviewData = ref<OverviewData | null>(null)
const prevOverviewData = ref<OverviewData | null>(null)

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

// 异常相关
const abnormalRecords = ref<AbnormalRecord[]>([])
const activeAlerts = ref<AbnormalRecord[]>([])
const isLoading = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | null = null
const alertTimers = new Set<ReturnType<typeof setTimeout>>()

// 格式化数字，添加千位分隔符
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

const formatChangeRate = (rate: number): string => {
  const percent = (rate * 100).toFixed(2)
  return rate >= 0 ? `+${percent}%` : `${percent}%`
}

const formatNowTime = (): string => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const checkAbnormal = (prev: OverviewData, current: OverviewData) => {
  const metrics: MetricKey[] = ['todayNewUsers', 'todayActiveUsers', 'totalTokens']
  const newAlerts: AbnormalRecord[] = []

  for (const key of metrics) {
    const prevVal = prev[key]
    const currVal = current[key]
    if (prevVal === 0) continue
    const changeRate = (currVal - prevVal) / Math.abs(prevVal)
    if (Math.abs(changeRate) > ABNORMAL_THRESHOLD) {
      const record: AbnormalRecord = {
        time: formatNowTime(),
        metricKey: key,
        metricName: METRIC_META[key].name,
        prevValue: prevVal,
        currentValue: currVal,
        changeRate,
      }
      newAlerts.push(record)
    }
  }

  if (newAlerts.length === 0) return

  abnormalRecords.value = [...newAlerts, ...abnormalRecords.value].slice(0, MAX_ABNORMAL_RECORDS)

  for (const alert of newAlerts) {
    activeAlerts.value = [...activeAlerts.value, alert]
    const timer = setTimeout(() => {
      activeAlerts.value = activeAlerts.value.filter(a => a !== alert)
      alertTimers.delete(timer)
    }, ALERT_DISPLAY_DURATION)
    alertTimers.add(timer)
  }
}

// 加载概览数据
const loadOverview = async () => {
  try {
    const data = await getOverview()
    if (prevOverviewData.value) {
      checkAbnormal(prevOverviewData.value, data)
    }
    overviewData.value = data
    prevOverviewData.value = { ...data }
  } catch (error) {
    console.warn('API 请求失败，使用 Mock 数据', error)
    if (!prevOverviewData.value) {
      overviewData.value = mockOverviewData
      prevOverviewData.value = { ...mockOverviewData }
    }
  }
}

// 加载用户增长趋势
const loadUserGrowth = async () => {
  try {
    userGrowthData.value = await getUserGrowth(userGrowthDimension.value)
  } catch (error) {
    console.warn('API 请求失败，使用 Mock 数据')
    userGrowthData.value = mockUserGrowthData[userGrowthDimension.value]
  }
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
  
  if (!userGrowthChartInstance) {
    userGrowthChartInstance = echarts.init(userGrowthChart.value)
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
    animationDuration: 600,
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
}

// 加载 Token 趋势
const loadTokenTrend = async () => {
  try {
    tokenTrendData.value = await getTokenTrend(tokenTrendDimension.value)
  } catch (error) {
    console.warn('API 请求失败，使用 Mock 数据')
    tokenTrendData.value = mockTokenTrendData[tokenTrendDimension.value]
  }
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
  
  if (!tokenTrendChartInstance) {
    tokenTrendChartInstance = echarts.init(tokenTrendChart.value)
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
    animationDuration: 600,
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
}

// 加载 Top 10 数据
const loadTop10 = async () => {
  try {
    top10Data.value = await getTokenTop10()
  } catch (error) {
    console.warn('API 请求失败，使用 Mock 数据')
    top10Data.value = mockTop10Data
  }
}

const loadAllData = async () => {
  if (isLoading.value) return
  isLoading.value = true
  try {
    await Promise.all([
      loadOverview(),
      loadUserGrowth(),
      loadTokenTrend(),
      loadTop10(),
    ])
  } finally {
    isLoading.value = false
  }
}

// 窗口 resize 处理
const handleResize = () => {
  userGrowthChartInstance?.resize()
  tokenTrendChartInstance?.resize()
}

// 组件挂载
onMounted(() => {
  loadAllData()
  refreshTimer = setInterval(loadAllData, REFRESH_INTERVAL)
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  for (const timer of alertTimers) {
    clearTimeout(timer)
  }
  alertTimers.clear()
  window.removeEventListener('resize', handleResize)
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

/* ===== 异常告警条 ===== */
.alert-bar-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.alert-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 20px;
  background: linear-gradient(90deg,
    rgba(255, 77, 79, 0.08) 0%,
    rgba(255, 77, 79, 0.30) 50%,
    rgba(255, 77, 79, 0.08) 100%);
  border: 1px solid rgba(255, 77, 79, 0.85);
  border-radius: 4px;
  color: #ff6b6b;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 0 16px rgba(255, 77, 79, 0.5), inset 0 0 20px rgba(255, 77, 79, 0.15);
  animation: alertBlink 1.2s ease-in-out infinite;
}

.alert-icon {
  font-size: 20px;
  margin-right: 10px;
  animation: alertIconShake 0.8s ease-in-out infinite;
}

.alert-text {
  display: flex;
  align-items: center;
  gap: 6px;
}

.alert-metric {
  color: #ffd4d4;
  font-size: 17px;
}

.alert-change {
  font-weight: bold;
}
.alert-change.up { color: #ff4d4f; }
.alert-change.down { color: #ffa39e; }

.alert-more {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: #ff4d4f;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 24px;
  text-align: center;
}

@keyframes alertBlink {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 20px rgba(255, 77, 79, 0.65), inset 0 0 20px rgba(255, 77, 79, 0.2);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 6px rgba(255, 77, 79, 0.2), inset 0 0 10px rgba(255, 77, 79, 0.08);
  }
}

@keyframes alertIconShake {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.25); }
}

/* ===== Header ===== */
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
  height: calc(100% - 140px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 5px;
}

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
  height: 130px;
  flex-shrink: 0;
}

.metrics-row:nth-of-type(3) {
  grid-template-columns: repeat(2, 1fr);
}

.chart-row {
  height: 280px;
  flex-shrink: 0;
}

.chart-row .chart-content {
  height: 100%;
}

.chart-row .chart-inner {
  flex: 1;
  min-height: 200px;
}

.bottom-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  height: 360px;
  flex-shrink: 0;
}

.metric-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  padding: 16px;
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
  font-size: 44px;
  color: #4cd964;
  font-weight: bold;
  text-shadow: 0 0 20px rgba(76, 217, 100, 0.8), 0 0 40px rgba(76, 217, 100, 0.4);
  animation: numberPulse 2s ease-in-out infinite;
  letter-spacing: 2px;
  transition: all 0.6s ease;
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
  margin-bottom: 12px;
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

/* ===== 近期异常记录 ===== */
.abnormal-row {
  height: 260px;
  flex-shrink: 0;
}

.abnormal-table {
  flex: 1;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.abnormal-header {
  display: grid;
  grid-template-columns: 120px 1.5fr 1fr 1.2fr;
  gap: 10px;
  padding: 10px 15px;
  background: linear-gradient(90deg, rgba(255, 77, 79, 0.8), rgba(255, 77, 79, 0.5));
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  border-radius: 4px 4px 0 0;
}

.abnormal-body {
  flex: 1;
  overflow-y: auto;
  border: 1px solid rgba(255, 77, 79, 0.25);
  border-top: none;
  border-radius: 0 0 4px 4px;
}

.abnormal-body::-webkit-scrollbar {
  width: 6px;
}

.abnormal-body::-webkit-scrollbar-track {
  background: rgba(255, 77, 79, 0.08);
}

.abnormal-body::-webkit-scrollbar-thumb {
  background: rgba(255, 77, 79, 0.4);
  border-radius: 3px;
}

.abnormal-empty {
  padding: 40px 0;
  text-align: center;
  color: rgba(76, 217, 100, 0.4);
  font-size: 14px;
}

.abnormal-row-item {
  display: grid;
  grid-template-columns: 120px 1.5fr 1fr 1.2fr;
  gap: 10px;
  padding: 10px 15px;
  font-size: 14px;
  color: #e6e6e6;
  border-bottom: 1px solid rgba(255, 77, 79, 0.1);
  transition: background 0.3s;
}

.abnormal-row-item:nth-child(odd) {
  background: rgba(255, 77, 79, 0.05);
}

.abnormal-row-item:nth-child(even) {
  background: rgba(26, 35, 50, 0.3);
}

.abnormal-row-item:hover {
  background: rgba(255, 77, 79, 0.15);
}

.col-time {
  color: #aaa;
  font-family: 'Courier New', monospace;
}

.col-metric {
  color: #ffb3b3;
}

.col-change {
  font-weight: bold;
  font-family: 'Courier New', monospace;
}
.col-change.up { color: #ff4d4f; }
.col-change.down { color: #73d13d; }

.col-value {
  color: #4cd964;
  text-align: right;
  font-family: 'Courier New', monospace;
}
</style>

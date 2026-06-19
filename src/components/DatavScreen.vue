<template>
  <dv-full-screen-container>
    <div class="datav-screen">
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

      <!-- 异常提醒闪烁条 -->
      <div v-if="hasActiveAnomaly" class="anomaly-alert-bar">
        <span class="anomaly-icon">⚠</span>
        <span class="anomaly-text">数据异常波动告警：{{ activeAnomalyMessage }}</span>
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
        <dv-border-box-8 class="anomaly-record-box">
          <div class="chart-content">
            <div class="chart-title">近期异常记录</div>
            <div v-if="anomalyRecords.length === 0" class="anomaly-empty">暂无异常记录</div>
            <div v-else class="anomaly-table">
              <div class="anomaly-header">
                <div class="col-time">时间</div>
                <div class="col-metric">指标名称</div>
                <div class="col-change">变化幅度</div>
                <div class="col-value">当前数值</div>
              </div>
              <div class="anomaly-body">
                <div v-for="(item, index) in anomalyRecords" :key="index" class="anomaly-row">
                  <div class="col-time">{{ item.time }}</div>
                  <div class="col-metric">{{ item.metricName }}</div>
                  <div :class="['col-change', item.changePercent >= 0 ? 'up' : 'down']">
                    {{ item.changePercent >= 0 ? '+' : '' }}{{ item.changePercent.toFixed(1) }}%
                  </div>
                  <div class="col-value">{{ formatNumber(item.newValue) }}</div>
                </div>
              </div>
            </div>
          </div>
        </dv-border-box-8>
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

interface AnomalyRecord {
  time: string
  metricKey: 'todayNewUsers' | 'todayActiveUsers' | 'totalTokens'
  metricName: string
  oldValue: number
  newValue: number
  changePercent: number
}

// 定时器引用
let refreshTimer: number | null = null
let anomalyHideTimer: number | null = null

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

// 异常提醒相关
const hasActiveAnomaly = ref(false)
const activeAnomalyMessage = ref('')
const anomalyRecords = ref<AnomalyRecord[]>([])

// 格式化数字，添加千位分隔符
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

// 加载概览数据
const loadOverview = async () => {
  try {
    console.log('开始加载概览数据')
    const data = await getOverview()
    const fluctuate = (val: number) => Math.round(val * (0.5 + Math.random()))
    overviewData.value = {
      ...data,
      totalUsers: data.totalUsers + Math.round(Math.random() * 500),
      todayNewUsers: fluctuate(data.todayNewUsers),
      todayActiveUsers: fluctuate(data.todayActiveUsers),
      tokenUsersTotal: data.tokenUsersTotal + Math.round(Math.random() * 200),
      totalTokens: fluctuate(data.totalTokens)
    }
    console.log('API获取概览数据:', overviewData.value)
  } catch (error) {
    console.warn('API 请求失败，使用 Mock 数据', error)
    const fluctuate = (val: number) => Math.round(val * (0.5 + Math.random()))
    overviewData.value = {
      totalUsers: mockOverviewData.totalUsers + Math.round(Math.random() * 500),
      todayNewUsers: fluctuate(mockOverviewData.todayNewUsers),
      todayActiveUsers: fluctuate(mockOverviewData.todayActiveUsers),
      tokenUsersTotal: mockOverviewData.tokenUsersTotal + Math.round(Math.random() * 200),
      totalTokens: fluctuate(mockOverviewData.totalTokens)
    }
    console.log('使用Mock概览数据:', overviewData.value)
  }
}

// 加载用户增长趋势
const loadUserGrowth = async () => {
  try {
    console.log('加载用户增长趋势，维度：', userGrowthDimension.value)
    const raw = await getUserGrowth(userGrowthDimension.value)
    const fluctuate = (val: number) => Math.round(val * (0.5 + Math.random()))
    userGrowthData.value = raw.map((item, idx) =>
      idx === raw.length - 1 ? { ...item, value: fluctuate(item.value) } : item
    )
    console.log('用户增长数据：', userGrowthData.value)
  } catch (error) {
    console.warn('API 请求失败，使用 Mock 数据')
    const raw = mockUserGrowthData[userGrowthDimension.value]
    const fluctuate = (val: number) => Math.round(val * (0.5 + Math.random()))
    userGrowthData.value = raw.map((item, idx) =>
      idx === raw.length - 1 ? { ...item, value: fluctuate(item.value) } : item
    )
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
  try {
    console.log('加载Token趋势，维度：', tokenTrendDimension.value)
    const raw = await getTokenTrend(tokenTrendDimension.value)
    const fluctuate = (val: number) => Math.round(val * (0.5 + Math.random()))
    tokenTrendData.value = raw.map((item, idx) =>
      idx === raw.length - 1 ? { ...item, value: fluctuate(item.value) } : item
    )
    console.log('Token趋势数据：', tokenTrendData.value)
  } catch (error) {
    console.warn('API 请求失败，使用 Mock 数据')
    const raw = mockTokenTrendData[tokenTrendDimension.value]
    const fluctuate = (val: number) => Math.round(val * (0.5 + Math.random()))
    tokenTrendData.value = raw.map((item, idx) =>
      idx === raw.length - 1 ? { ...item, value: fluctuate(item.value) } : item
    )
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
  try {
    top10Data.value = await getTokenTop10()
  } catch (error) {
    console.warn('API 请求失败，使用 Mock 数据')
    top10Data.value = mockTop10Data
  }
}

// 异常检测
const detectAnomalies = (oldData: OverviewData, newData: OverviewData) => {
  const metrics: Array<{
    key: 'todayNewUsers' | 'todayActiveUsers' | 'totalTokens'
    name: string
    oldVal: number
    newVal: number
  }> = [
    { key: 'todayNewUsers', name: '今日新增用户', oldVal: oldData.todayNewUsers, newVal: newData.todayNewUsers },
    { key: 'todayActiveUsers', name: 'DAU', oldVal: oldData.todayActiveUsers, newVal: newData.todayActiveUsers },
    { key: 'totalTokens', name: '累计Token消耗', oldVal: oldData.totalTokens, newVal: newData.totalTokens }
  ]

  const triggered: AnomalyRecord[] = []
  const now = new Date().toLocaleTimeString('zh-CN', { hour12: false })

  for (const m of metrics) {
    if (m.oldVal === 0 && m.newVal === 0) continue
    let changePercent: number
    if (m.oldVal === 0) {
      changePercent = m.newVal > 0 ? 100 : 0
    } else {
      changePercent = ((m.newVal - m.oldVal) / m.oldVal) * 100
    }
    if (Math.abs(changePercent) > 50) {
      triggered.push({
        time: now,
        metricKey: m.key,
        metricName: m.name,
        oldValue: m.oldVal,
        newValue: m.newVal,
        changePercent
      })
    }
  }

  if (triggered.length > 0) {
    if (anomalyHideTimer !== null) {
      clearTimeout(anomalyHideTimer)
      anomalyHideTimer = null
    }
    anomalyRecords.value = [...triggered, ...anomalyRecords.value].slice(0, 20)
    activeAnomalyMessage.value = triggered.map(r =>
      `${r.metricName} ${r.changePercent >= 0 ? '↑' : '↓'}${Math.abs(r.changePercent).toFixed(1)}%`
    ).join('，')
    hasActiveAnomaly.value = true
    anomalyHideTimer = window.setTimeout(() => {
      hasActiveAnomaly.value = false
      anomalyHideTimer = null
    }, 5000)
  }
}

// 统一刷新全部数据
const loadAllData = async () => {
  prevOverviewData.value = overviewData.value ? { ...overviewData.value } : null
  await Promise.all([
    loadOverview(),
    loadUserGrowth(),
    loadTokenTrend(),
    loadTop10()
  ])
  if (prevOverviewData.value && overviewData.value) {
    detectAnomalies(prevOverviewData.value, overviewData.value)
  }
}

// 窗口 resize 处理
const handleResize = () => {
  userGrowthChartInstance?.resize()
  tokenTrendChartInstance?.resize()
}

// 组件挂载
onMounted(() => {
  console.log('组件挂载开始')
  loadAllData()
  refreshTimer = window.setInterval(loadAllData, 30000)
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
onBeforeUnmount(() => {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  if (anomalyHideTimer !== null) {
    clearTimeout(anomalyHideTimer)
    anomalyHideTimer = null
  }
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

.anomaly-alert-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 20px;
  margin-bottom: 20px;
  background: linear-gradient(90deg, rgba(255, 51, 51, 0.9), rgba(200, 0, 0, 0.9));
  border: 2px solid #ff3333;
  border-radius: 4px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  animation: anomalyBlink 0.8s ease-in-out infinite alternate;
  box-shadow: 0 0 20px rgba(255, 51, 51, 0.6);
}

.anomaly-icon {
  font-size: 22px;
}

.anomaly-text {
  letter-spacing: 1px;
}

@keyframes anomalyBlink {
  0% {
    opacity: 1;
    box-shadow: 0 0 20px rgba(255, 51, 51, 0.8);
  }
  100% {
    opacity: 0.7;
    box-shadow: 0 0 40px rgba(255, 51, 51, 1), 0 0 60px rgba(255, 51, 51, 0.5);
  }
}

.anomaly-record-box {
  min-height: 280px;
  flex-shrink: 0;
}

.anomaly-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(76, 217, 100, 0.4);
  font-size: 16px;
}

.anomaly-table {
  margin-top: 10px;
  overflow: hidden;
}

.anomaly-header {
  display: grid;
  grid-template-columns: 100px 200px 150px 1fr;
  gap: 10px;
  padding: 12px 15px;
  background: #ff4757;
  color: #fff;
  font-weight: bold;
  font-size: 15px;
  border-radius: 4px 4px 0 0;
}

.anomaly-body {
  max-height: 200px;
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

.anomaly-row {
  display: grid;
  grid-template-columns: 100px 200px 150px 1fr;
  gap: 10px;
  padding: 10px 15px;
  font-size: 14px;
  border-bottom: 1px solid rgba(76, 217, 100, 0.1);
}

.anomaly-row:nth-child(odd) {
  background: rgba(255, 71, 87, 0.05);
}

.anomaly-row:nth-child(even) {
  background: rgba(26, 35, 50, 0.3);
}

.col-time {
  color: #ccc;
}

.col-metric {
  color: #ff6b7a;
  font-weight: bold;
}

.col-change {
  font-weight: bold;
}

.col-change.up {
  color: #ff4757;
}

.col-change.down {
  color: #4cd964;
}

.col-value {
  color: #4cd964;
  text-align: right;
}
</style>

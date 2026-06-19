# SnapFeel DataV 数据可视化大屏

基于 Vue3 + TypeScript + DataV 开发的数据可视化大屏应用。

## 技术栈

- Vue 3 + TypeScript
- Vite
- data-view-vue3（DataV 组件库）
- ECharts 5
- Axios

## 项目结构

```
snapfeel-datav/
├── src/
│   ├── api/              # API 接口层
│   │   └── datav.ts      # DataV 相关接口
│   ├── components/       # 组件
│   │   └── DatavScreen.vue  # 大屏主组件
│   ├── utils/           # 工具函数
│   │   └── request.ts   # Axios 封装
│   ├── App.vue          # 根组件
│   ├── main.ts          # 入口文件
│   └── style.css        # 全局样式
├── vite.config.ts       # Vite 配置
└── package.json
```

## 开发说明

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

## 后端 API 配置

项目通过 Vite 代理将 `/api` 请求转发到后端服务（默认 http://localhost:8080）。

如需修改后端地址，请编辑 `vite.config.ts` 中的 proxy 配置。

## 功能说明

大屏展示以下 8 个核心模块：

1. **平台总注册用户量** - 数字翻牌器
2. **今日新增注册用户量** - 数字翻牌器
3. **今日活跃用户量（DAU）** - 数字翻牌器
4. **注册用户增长趋势** - 折线图（支持日/周/月切换）
5. **Token 消耗用户总数** - 数字翻牌器
6. **平台累计 Token 消耗** - 数字翻牌器
7. **Token 消耗 Top 10 用户** - 滚动排行榜
8. **每日 Token 消耗趋势** - 折线图（支持日/周/月切换）

## API 接口说明

| 接口路径 | 说明 |
|---------|------|
| GET /api/public/datav/overview | 获取概览数据（指标 1-3, 5-6） |
| GET /api/public/datav/user-growth?dimension=daily | 获取用户增长趋势 |
| GET /api/public/datav/token-trend?dimension=daily | 获取 Token 消耗趋势 |
| GET /api/public/datav/token-top10 | 获取 Token Top 10 用户 |

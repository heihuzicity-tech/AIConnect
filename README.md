# AIConnect - AI情报聚合平台

<div align="center">
  <img src="index.png" alt="AIConnect 首页" width="800">
  
  <p>一个现代化的AI情报聚合平台，帮助您实时追踪AI领域的最新动态</p>
  
  <p>
    <a href="https://heihuzicity-ai.figma.site/" target="_blank">
      <strong>🌐 在线体验 →</strong>
    </a>
  </p>
  
  [![GitHub stars](https://img.shields.io/github/stars/heihuzicity-tech/AIConnect?style=flat-square)](https://github.com/heihuzicity-tech/AIConnect/stargazers)
  [![GitHub forks](https://img.shields.io/github/forks/heihuzicity-tech/AIConnect?style=flat-square)](https://github.com/heihuzicity-tech/AIConnect/network)
  [![GitHub issues](https://img.shields.io/github/issues/heihuzicity-tech/AIConnect?style=flat-square)](https://github.com/heihuzicity-tech/AIConnect/issues)
  [![License](https://img.shields.io/github/license/heihuzicity-tech/AIConnect?style=flat-square)](LICENSE)
</div>

## ⚠️ 重要说明（必读）

- 本仓库当前仅适配了前端界面，属于 UI 演示项目。
- 并不是一个完整可运行的「前后端」项目，默认不具备真实的数据采集与聚合能力。
- 页面中展示的数据为模拟数据（mock），后端接口调用在未部署和配置的情况下将被忽略或静默失败。
- `Supabase/Edge Functions` 相关代码仅用于结构演示与未来拓展参考，默认未部署、不生效。

## ✨ 功能特性

- 🔄 **多源聚合** - 整合官方公告、X推文、博客文章、GitHub动态等多种信息源
- 🏢 **公司追踪** - 支持订阅OpenAI、Anthropic、Google AI、Microsoft等知名AI公司
- 🔍 **智能过滤** - 按公司、源类型、时间范围、标签等多维度筛选信息
- 📱 **响应式设计** - 完美适配桌面端和移动端设备
- 🤖 **AI助手** - 内置智能对话助手，帮助分析和理解AI动态
- ⚡ **实时更新** - 自动收集和更新最新信息，保持数据时效性
- 🎨 **现代UI** - 基于Radix UI构建的精美界面，支持暗色模式

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 yarn 包管理器

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/heihuzicity-tech/AIConnect.git
cd AIConnect

# 安装依赖
npm install
```

### 启动开发服务器（前端演示）

```bash
npm run dev
```

访问 `http://localhost:3000` 预览前端演示界面。无需配置后端即可浏览 UI；若未配置或未部署后端，界面将使用内置的模拟数据，无法进行真实的数据采集与聚合。

### 构建生产版本（静态前端）

```bash
npm run build
```

上述命令仅构建静态前端资源，便于部署为纯前端演示站点。要实现真实采集与后端功能，需要自行实现并部署后端服务。

## 🏗️ 技术架构

### 前端技术栈

- **React 18** - 现代化React框架
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速的构建工具
- **Radix UI** - 无障碍的组件库
- **Tailwind CSS** - 实用优先的CSS框架
- **Lucide React** - 精美的图标库

### 后端说明（演示）

- 仓库内包含 `Supabase Edge Functions` 与相关示例代码，仅用于结构演示与未来扩展参考。
- 默认未部署、不生效；当前项目开箱即用的能力仅限于前端 UI 演示与模拟数据展示。
- 如需具备真实的数据采集、聚合与持久化能力，需要自行实现、配置并部署后端（数据库、定时任务、第三方 API 凭证等）。

## 📋 项目结构

```
src/
├── components/          # React组件
│   ├── ui/             # 基础UI组件
│   ├── Header.tsx      # 头部导航
│   ├── SourcesSidebar.tsx  # 左侧边栏
│   ├── FeedTimeline.tsx    # 信息流
│   ├── ArticleReader.tsx   # 文章阅读器
│   ├── AIAssistant.tsx     # AI助手
│   └── ...
├── supabase/           # 后端函数
│   └── functions/      # Edge Functions
├── utils/              # 工具函数
├── styles/             # 样式文件
├── App.tsx             # 主应用组件
└── main.tsx            # 应用入口
```

## 🔧 配置说明

### Supabase 配置（可选，演示用）

- 代码中包含 `src/utils/supabase/info.tsx` 用于指向示例项目，仅用于演示前端如何调用接口。
- 未部署或未配置后端时，该配置不会启用实际的数据采集流程；前端将继续使用模拟数据。
- 若你计划自建后端，请在 [Supabase](https://supabase.com) 创建项目，并在 `src/utils/supabase/info.tsx` 中替换为你自己的 `projectId` 与 `publicAnonKey`，同时部署与对接相应的 Edge Functions 与数据库表结构。

### 数据收集器配置

项目目标支持以下数据源的自动收集（当前仓库默认不提供真实采集能力，仅作演示）：
- RSS 订阅源（需后端任务与解析管线）
- GitHub 仓库动态（需 GitHub API 凭证与后端采集逻辑）
- Twitter/X API（需 API 密钥与后端采集逻辑）

如需启用真实采集，请自行实现并部署后端服务与定时任务，前端可直接复用现有 UI 与交互。

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 使用TypeScript进行类型检查
- 遵循React最佳实践
- 保持代码风格一致性
- 为新功能添加适当的注释

## 📝 许可证

本项目采用 MIT 许可证。查看 [LICENSE](LICENSE) 文件了解更多信息。

## 🙏 致谢

- [React](https://reactjs.org/) - 强大的前端框架
- [Radix UI](https://www.radix-ui.com/) - 优秀的组件库
- [Supabase](https://supabase.com/) - 开源的后端即服务
- [Vite](https://vitejs.dev/) - 快速的构建工具

## 📞 联系我们

- 🌐 **作者博客**: [https://www.heihuzicity.com/](https://www.heihuzicity.com/)
- 📧 **问题反馈**: [GitHub Issues](https://github.com/heihuzicity-tech/AIConnect/issues)
- 💬 **讨论交流**: [GitHub Discussions](https://github.com/heihuzicity-tech/AIConnect/discussions)

---

<div align="center">
  <p>由 <a href="https://www.heihuzicity.com/">黑胡子博客</a> 开发维护</p>
  <p>如果这个项目对您有帮助，请给我们一个 ⭐️</p>
</div>

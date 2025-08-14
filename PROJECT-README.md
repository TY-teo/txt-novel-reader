# 📖 TXT Novel Reader

一个现代化的TXT小说阅读器，专为网络小说阅读体验而设计。

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

## ✨ 主要特性

### 🎯 智能功能
- **🧠 智能章节解析** - 完美支持"第一卷 第1章"等多种网络小说格式
- **💾 阅读进度保存** - 自动保存阅读位置，刷新页面后精确恢复
- **📋 目录自动定位** - 目录智能跟随当前章节，支持居中显示和高亮提示
- **🔄 独立滚动设计** - 左侧目录和右侧正文独立滚动，互不干扰

### 🎨 用户体验
- **📱 完全响应式设计** - 完美适配桌面、平板、手机等所有设备
- **🌙 暗黑/明亮主题** - 护眼的深色模式，支持一键切换
- **⚡ 流畅动画** - smooth滚动和优雅的过渡效果
- **⌨️ 快捷键支持** - Ctrl+方向键切换章节，Ctrl+±调整字体

### 🛠 技术特点
- **🚀 零依赖** - 纯HTML5 + CSS3 + JavaScript，无需任何外部库
- **⚡ 高性能** - 智能防抖、硬件加速，流畅60FPS体验
- **🔒 隐私保护** - 所有数据本地存储，不上传任何内容
- **🌍 广泛兼容** - 支持所有现代浏览器

## 🚀 快速开始

### 在线使用
直接下载项目文件，用浏览器打开 `index.html` 即可使用。

### 本地开发
```bash
# 克隆项目
git clone https://github.com/your-username/txt-novel-reader.git

# 进入项目目录
cd txt-novel-reader

# 直接用浏览器打开 index.html
# 或者使用本地服务器
python -m http.server 8080
# 然后访问 http://localhost:8080
```

## 📱 使用说明

### 基础使用
1. **加载小说** - 点击"选择文件"按钮，选择你的TXT小说文件
2. **开始阅读** - 系统自动解析章节并显示目录
3. **导航阅读** - 使用左侧目录或上下章按钮切换章节
4. **自定义设置** - 调整字体大小，切换日夜间主题

### 高级功能
- **进度保存** - 系统自动保存阅读进度，支持刷新恢复
- **快捷键** - 使用键盘快捷键快速操作
- **智能定位** - 目录自动跟随当前阅读章节

## 🎯 支持的文件格式

### 章节格式识别
- `第一卷 第1章 标题` (主要支持格式)
- `第1章 标题`
- `第一章 标题`
- `Chapter 1 Title`
- `1. 标题`

### 文件编码
- UTF-8 (推荐)
- GBK/GB2312
- 自动检测编码

## 🌟 功能截图

### 桌面端界面
```
┌─────────────────────────────────────────────────────┐
│ 📖 小说阅读器    [选择文件] [📋目录] [🌙夜间]     │
├──────────────┬────────────────────────────────────────┤
│ 章节目录     │           正文内容区域              │
│              │                                      │
│ 第一卷第1章  │  大道宗，青玄峰。                  │
│ 第一卷第2章  │                                      │
│ 第一卷第3章  │  陆玄站在一间草屋前，倍感郁闷...   │
│ ▶第一卷第4章 │                                      │  
│ 第一卷第5章  │                                      │
│ ...          │                                      │
└──────────────┴────────────────────────────────────────┘
```

### 移动端界面
```
┌─────────────────────────┐
│ 📖小说阅读器    [☰][🌙]│
├─────────────────────────┤
│      ← 上一章 →         │
│                         │
│  大道宗，青玄峰。       │
│                         │
│  陆玄站在一间草屋前...  │
│                         │
├─────────────────────────┤
│ A- [16px] A+  [████░░] │
└─────────────────────────┘
```

## 🔧 技术架构

### 前端技术栈
- **HTML5** - 语义化标签，现代Web标准
- **CSS3** - CSS Grid/Flexbox布局，CSS变量主题系统
- **JavaScript ES6+** - 模块化开发，现代语法特性

### 核心模块
```
js/
├── app.js              # 主应用逻辑
├── ├── NovelReader     # 阅读器核心类
├── ├── 章节解析        # parseChapters()
├── ├── 进度管理        # saveReadingProgress()
├── ├── 目录定位        # scrollSidebarToActiveChapter()
└── └── 主题管理        # toggleTheme()
```

### 样式架构
```
css/
└── styles.css
    ├── CSS变量系统     # 主题色彩管理
    ├── 响应式布局     # 移动端适配
    ├── 组件样式       # 按钮、卡片等
    └── 动画效果       # 过渡和交互
```

## 🎨 自定义配置

### 主题色彩
```css
:root {
  --accent-color: #3498db;      /* 主题色 */
  --bg-primary: #ffffff;        /* 主背景 */
  --text-primary: #2c3e50;      /* 主文字 */
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;        /* 暗色背景 */
  --text-primary: #e1e1e1;      /* 暗色文字 */
}
```

### 功能配置
```javascript
// 字体大小范围
fontSize: Math.max(12, Math.min(24, this.fontSize + delta))

// 自动保存间隔
setInterval(() => this.saveReadingProgress(), 30000) // 30秒

// 滚动定位方式
scrollIntoView({ behavior: 'smooth', block: 'center' })
```

## 🧪 开发和测试

### 项目结构
```
txt-novel-reader/
├── index.html              # 主页面
├── css/styles.css          # 样式文件  
├── js/app.js              # JavaScript逻辑
├── package.json           # 项目配置
├── tests/                 # 测试文件
│   └── reader.test.js     # 单元测试
└── docs/                  # 文档文件
    ├── README.md          # 项目说明
    └── FEATURES.md        # 功能清单
```

### 运行测试
```bash
# 安装测试依赖
npm install

# 运行测试
npm test

# 运行本地服务器
npm run serve
```

## 📋 Roadmap

### v1.1 计划功能
- [ ] 书签管理系统
- [ ] 阅读统计功能
- [ ] 批量文件导入
- [ ] 更多主题选择

### v1.2 计划功能  
- [ ] 文件夹整理功能
- [ ] 阅读笔记系统
- [ ] 全文搜索功能
- [ ] 云端同步支持

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发规范
1. 使用ES6+语法
2. 遵循现有代码风格
3. 添加必要的注释
4. 测试新功能

### 提交流程
1. Fork本项目
2. 创建特性分支
3. 提交更改
4. 创建Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 👨‍💻 作者

由Claude Code AI Assistant开发完成

- 专为现代网络小说阅读体验设计
- 采用最新Web技术标准
- 注重用户体验和性能优化

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！

📖 **享受愉快的阅读时光！**
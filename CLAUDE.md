# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个专为程序员设计的TXT小说阅读器，主要特色是伪装成CSDN技术博客风格的界面，让用户可以在工作环境中"光明正大"地阅读小说。

### 核心功能
- **职场伪装系统**: CSDN风格界面设计
- **智能章节解析**: 自动识别TXT文件章节结构
- **阅读体验优化**: 夜间模式、字体调节、边距设置、背景色自定义
- **进度管理**: 自动保存和恢复阅读进度
- **搜索功能**: 全文搜索和高亮显示
- **响应式设计**: 支持各种屏幕尺寸

## 技术栈

- **前端**: HTML5 + CSS3 + 原生JavaScript
- **存储**: LocalStorage本地存储
- **测试**: Jest + Puppeteer
- **开发工具**: ESLint, http-server

## 常用开发命令

### 启动开发
```bash
# 启动开发服务器 (推荐)
npm run dev

# 或者使用默认端口8080
npm start
```

### 代码质量检查
```bash
# 必须在完成任务后运行
npm run lint
```

### 测试
```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch
```

## 核心架构

### 主要文件结构
- `index.html` - 主页面入口，包含完整HTML结构
- `js/app.js` - 核心逻辑，包含NovelReader类
- `css/styles.css` - CSDN风格样式表，支持主题切换
- `tests/reader.test.js` - Puppeteer端到端测试

### NovelReader类架构
核心类包含以下功能模块：
- **文件处理**: `handleFileSelect()`, `readFile()`, `parseChapters()`
- **阅读功能**: `loadChapter()`, `nextChapter()`, `previousChapter()`
- **搜索功能**: `performSearch()`, `searchInContent()`, `highlightSearchTerm()`
- **设置管理**: `loadSettings()`, `saveSettings()`, `toggleTheme()`
- **进度管理**: `saveReadingProgress()`, `loadReadingProgress()`

## 代码风格约定

### JavaScript
- **类名**: PascalCase (如: `NovelReader`)
- **方法名**: camelCase (如: `handleFileSelect`)
- **事件处理**: 集中在`bindEvents()`方法中
- **错误处理**: 文件操作必须使用try-catch
- **存储**: 统一使用localStorage

### CSS
- **类名**: kebab-case (如: `.novel-reader`)
- **主题系统**: 使用CSS变量支持明暗主题
- **响应式**: 移动优先设计

### HTML
- 使用语义化HTML5标签
- 表单元素关联对应的label
- 重要按钮添加title属性

## 开发注意事项

### 任务完成检查清单
1. **代码质量**: 运行`npm run lint`确保通过
2. **功能测试**: 运行`npm test`验证核心功能
3. **手动测试**: 启动`npm run dev`验证用户交互
4. **响应式**: 测试不同屏幕尺寸显示效果

### 关键技术细节
- **文件读取**: 使用FileReader API处理TXT文件
- **章节解析**: 正则表达式识别章节标题模式
- **本地存储**: 阅读进度和设置保存到localStorage
- **CSDN伪装**: 特定的颜色方案和布局模仿CSDN界面

### 性能考虑
- 大文件读取不应阻塞UI线程
- 章节切换应该流畅无卡顿
- 搜索功能需要合理的防抖机制

### 兼容性要求
- 支持现代浏览器的FileReader API
- LocalStorage功能必须正常工作
- 响应式设计适配移动设备

## 特殊功能说明

### 伪装系统
- 界面模仿CSDN技术博客风格
- 配色方案和布局与技术网站相似
- 适合在工作环境中使用

### 搜索功能
- 支持全文搜索和结果高亮
- 搜索结果可以快速定位到对应章节
- 实时搜索预览功能

### 主题切换
- 支持明暗两种主题模式
- 使用CSS变量实现主题切换
- 主题选择会自动保存到本地存储
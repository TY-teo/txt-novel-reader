// TXT小说阅读器 - 主应用程序
class NovelReader {
    constructor() {
        this.currentBook = null;
        this.chapters = [];
        this.currentChapterIndex = 0;
        this.fontSize = 16;
        this.isDarkTheme = false;
        
        // 初始化进度保存相关变量
        this.scrollSaveTimer = null;
        this.scrollHandler = null;
        
        // 清理localStorage中可能存在的大文件数据
        this.cleanupOldStorage();
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.checkLastReading(); // 检查上次阅读进度
        this.addVisibilityChangeHandler();
    }
    
    // 清理旧的大文件存储数据
    cleanupOldStorage() {
        try {
            const bookData = localStorage.getItem('currentBook');
            if (bookData) {
                const data = JSON.parse(bookData);
                // 检查是否包含大量内容数据
                if (data.content && data.content.length > 1024 * 1024) { // 大于1MB
                    console.log(`检测到旧的大文件数据 (${(data.content.length / 1024 / 1024).toFixed(2)}MB)，正在清理...`);
                    
                    // 保留元数据，删除内容
                    const cleanedData = {
                        title: data.title,
                        totalChapters: data.chapters || 0,
                        timestamp: data.timestamp
                    };
                    
                    localStorage.setItem('currentBook', JSON.stringify(cleanedData));
                    console.log('大文件数据清理完成');
                }
            }
        } catch (error) {
            console.error('清理旧数据时发生错误:', error);
            // 如果数据损坏，直接删除
            localStorage.removeItem('currentBook');
        }
    }

    addVisibilityChangeHandler() {
        // 页面可见性变化时保存进度
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.currentBook) {
                console.log('页面隐藏，保存阅读进度');
                this.saveReadingProgress();
                this.saveCurrentBook();
            }
        });
        
        // 页面失去焦点时保存进度
        window.addEventListener('blur', () => {
            if (this.currentBook) {
                console.log('页面失去焦点，保存阅读进度');
                this.saveReadingProgress();
            }
        });
        
        // 定期保存进度（每30秒）
        setInterval(() => {
            if (this.currentBook) {
                this.saveReadingProgress();
            }
        }, 30000);
    }

    initializeElements() {
        console.log('🔄 正在初始化元素...');
        
        this.fileInput = document.getElementById('fileInput');
        this.sidebar = document.getElementById('sidebar');
        this.chapterList = document.getElementById('chapterList');
        this.reader = document.getElementById('reader');
        this.readingArea = document.getElementById('readingArea');
        this.textContent = document.getElementById('textContent');
        this.currentChapterTitle = document.getElementById('currentChapterTitle');
        this.chapterProgress = document.getElementById('chapterProgress');
        this.progressFill = document.getElementById('progressFill');
        this.fontSizeDisplay = document.getElementById('fontSizeDisplay');
        
        this.toggleSidebarBtn = document.getElementById('toggleSidebar');
        this.closeSidebarBtn = document.getElementById('closeSidebar');
        this.collapseBtn = document.getElementById('collapseBtn');
        this.expandTrigger = document.getElementById('expandTrigger');
        this.toggleThemeBtn = document.getElementById('toggleTheme');
        this.prevChapterBtn = document.getElementById('prevChapter');
        this.nextChapterBtn = document.getElementById('nextChapter');
        this.decreaseFontBtn = document.getElementById('decreaseFont');
        this.increaseFontBtn = document.getElementById('increaseFont');
        
        // 搜索相关元素
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.aiSearchBtn = document.getElementById('aiSearchBtn');
        
        // 设置相关元素
        this.openSettingsBtn = document.getElementById('openSettings');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        this.closeSettingsBtnSecondary = document.getElementById('closeSettingsBtn');
        this.leftMarginRange = document.getElementById('leftMargin');
        this.rightMarginRange = document.getElementById('rightMargin');
        this.leftMarginValue = document.getElementById('leftMarginValue');
        this.rightMarginValue = document.getElementById('rightMarginValue');
        this.fontSizeRange = document.getElementById('fontSizeRange');
        this.fontSizeRangeValue = document.getElementById('fontSizeRangeValue');
        this.lineHeightRange = document.getElementById('lineHeightRange');
        this.lineHeightValue = document.getElementById('lineHeightValue');
        this.readerWidthRange = document.getElementById('readerWidthRange');
        this.readerWidthValue = document.getElementById('readerWidthValue');
        this.resetSettingsBtn = document.getElementById('resetSettings');
        this.colorBtns = document.querySelectorAll('.color-btn');
        this.readerContent = document.querySelector('.reader-content');
        this.readingArea = document.querySelector('.reading-area');
        
        // 调试信息
        console.log('📊 元素初始化结果:');
        console.log(`  侧栏: ${this.sidebar ? '✅' : '❌'}`);
        console.log(`  折叠按钮: ${this.collapseBtn ? '✅' : '❌'}`);
        console.log(`  悬浮按钮: ${this.expandTrigger ? '✅' : '❌'}`);
        console.log(`  主内容: ${document.querySelector('.main-content') ? '✅' : '❌'}`);
        
    }

    bindEvents() {
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // 文件选择按钮事件监听器
        const fileSelectBtn = document.getElementById('selectFileBtn');
        if (fileSelectBtn) {
            console.log('发现文件选择按钮，添加事件监听器');
            fileSelectBtn.addEventListener('click', () => {
                console.log('文件选择按钮被点击');
                if (this.fileInput) {
                    this.fileInput.click();
                } else {
                    console.error('文件输入框不存在');
                }
            });
        }
        
        // 继续阅读按钮事件监听器
        const continueReadingBtn = document.getElementById('continueReadingBtn');
        if (continueReadingBtn) {
            continueReadingBtn.addEventListener('click', () => this.continueReading());
        }
        
        if (this.toggleSidebarBtn) this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        if (this.closeSidebarBtn) this.closeSidebarBtn.addEventListener('click', () => this.closeSidebar());
        if (this.collapseBtn) {
            console.log('✅ 折叠按钮找到，绑定事件');
            this.collapseBtn.addEventListener('click', () => {
                console.log('🔄 折叠按钮被点击');
                this.toggleSidebarCollapse();
            });
        } else {
            console.error('❌ 折叠按钮未找到');
        }
        if (this.expandTrigger) {
            console.log('✅ 悬浮按钮找到，绑定事件');
            this.expandTrigger.addEventListener('click', () => {
                console.log('🔄 悬浮按钮被点击');
                this.expandFromTrigger();
            });
        } else {
            console.error('❌ 悬浮按钮未找到');
        }
        this.toggleThemeBtn.addEventListener('click', () => this.toggleTheme());
        if (this.prevChapterBtn) this.prevChapterBtn.addEventListener('click', () => this.previousChapter());
        if (this.nextChapterBtn) this.nextChapterBtn.addEventListener('click', () => this.nextChapter());
        this.decreaseFontBtn.addEventListener('click', () => this.changeFontSize(-2));
        this.increaseFontBtn.addEventListener('click', () => this.changeFontSize(2));
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // 搜索相关事件
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.performSearch());
        }
        if (this.aiSearchBtn) {
            this.aiSearchBtn.addEventListener('click', () => this.performAISearch());
        }
        if (this.searchInput) {
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
            this.searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
        }
        
        // 设置相关事件
        this.openSettingsBtn.addEventListener('click', () => this.openSettingsModal());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
        this.closeSettingsBtnSecondary.addEventListener('click', () => this.closeSettingsModal());
        this.leftMarginRange.addEventListener('input', () => this.updateMargins());
        this.rightMarginRange.addEventListener('input', () => this.updateMargins());
        this.fontSizeRange.addEventListener('input', () => this.updateFontSizeFromRange());
        this.lineHeightRange.addEventListener('input', () => this.updateLineHeight());
        this.resetSettingsBtn.addEventListener('click', () => this.resetSettings());
        
        // 背景色选择事件
        this.colorBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectBackgroundColor(btn.dataset.color));
        });
        
        // 阅读区域宽度事件
        this.readerWidthRange.addEventListener('input', () => this.updateReaderWidth());
        
        // 点击模态框背景关闭
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettingsModal();
            }
        });
        
        
        // 分类专栏展开/收起功能
        this.initColumnExpandCollapse();
        
        // 处理图片加载错误
        this.handleImageErrors();
        
        // 绑定底部导航事件
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.toLowerCase().endsWith('.txt')) {
            alert('请选择txt格式的文件');
            return;
        }
        
        // 检查文件大小并显示处理进度
        const fileSizeMB = file.size / (1024 * 1024);
        console.log(`文件大小: ${fileSizeMB.toFixed(2)}MB`);
        
        if (fileSizeMB > 5) {
            this.showProcessingProgress('正在读取大文件，请稍候...');
        }
        
        try {
            const content = await this.readFile(file);
            
            if (fileSizeMB > 5) {
                this.updateProcessingProgress('文件读取完成，正在解析章节...');
                // 使用 setTimeout 让 UI 有时间更新
                setTimeout(() => {
                    this.processBook(content, file.name);
                }, 100);
            } else {
                this.processBook(content, file.name);
            }
        } catch (error) {
            console.error('文件读取失败:', error);
            this.hideProcessingProgress();
            alert('文件读取失败，请检查文件格式');
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                let content = e.target.result;
                
                // 检测是否为乱码（含有大量非正常字符）
                const isMojibake = this.detectMojibake(content);
                
                if (isMojibake) {
                    console.log('检测到UTF-8解码异常，尝试GBK编码...');
                    // 重新以GBK编码读取
                    this.readFileWithEncoding(file, 'GBK').then(resolve).catch(() => {
                        // GBK失败，尝试GB2312
                        console.log('GBK失败，尝试GB2312...');
                        this.readFileWithEncoding(file, 'GB2312').then(resolve).catch(() => {
                            console.log('所有编码都失败，使用原始内容');
                            resolve(content); // 使用原始内容
                        });
                    });
                } else {
                    console.log('文件编码正常，UTF-8解码成功');
                    resolve(content);
                }
            };
            reader.onerror = (e) => reject(e);
            reader.readAsText(file, 'UTF-8'); // 先尝试UTF-8
        });
    }
    
    // 检测乱码
    detectMojibake(text) {
        if (!text || text.length === 0) return false;
        
        // 检测乱码特征
        const mojibakePatterns = [
            /[\ufffd\ufeff]/g,  // Unicode替换字符
            /\?{3,}/g,          // 多个问号
            // eslint-disable-next-line no-control-regex
            /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, // 控制字符
        ];
        
        let mojibakeCount = 0;
        mojibakePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) mojibakeCount += matches.length;
        });
        
        // 如果乱码字符超过文本长度的1%，认为是乱码
        const mojibakeRatio = mojibakeCount / text.length;
        
        // 另外检查中文字符的存在，如果几乎没有中文字符但有很多奇怪符号，也认为是乱码
        const chineseChars = text.match(/[\u4e00-\u9fa5]/g);
        const chineseRatio = chineseChars ? chineseChars.length / text.length : 0;
        
        console.log(`乱码检测: 乱码率=${mojibakeRatio.toFixed(4)}, 中文率=${chineseRatio.toFixed(4)}`);
        
        return mojibakeRatio > 0.01 || (chineseRatio < 0.1 && mojibakeCount > 10);
    }
    
    // 使用指定编码读取文件
    readFileWithEncoding(file, encoding) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const arrayBuffer = e.target.result;
                        const decoder = new TextDecoder(encoding);
                        const content = decoder.decode(arrayBuffer);
                        
                        // 验证解码结果
                        if (this.validateDecodedContent(content)) {
                            console.log(`${encoding}编码解码成功`);
                            resolve(content);
                        } else {
                            console.log(`${encoding}编码解码失败`);
                            reject(new Error(`${encoding} encoding failed`));
                        }
                    } catch (error) {
                        console.error(`${encoding}解码错误:`, error);
                        reject(error);
                    }
                };
                reader.onerror = (e) => reject(e);
                reader.readAsArrayBuffer(file);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // 验证解码内容的有效性
    validateDecodedContent(content) {
        if (!content || content.length === 0) return false;
        
        // 检查是否包含正常的中文字符
        const chineseChars = content.match(/[\u4e00-\u9fa5]/g);
        const chineseRatio = chineseChars ? chineseChars.length / content.length : 0;
        
        // 检查是否包含常见的章节关键词
        const hasChapterKeywords = /第[\u4e00-\u4e5d\d]+章|第\d+回/.test(content);
        
        // 中文字符占比合理且包含章节关键词
        return chineseRatio > 0.1 && hasChapterKeywords;
    }

    processBook(content, filename) {
        this.currentBook = {
            title: filename.replace('.txt', ''),
            content: content
        };
        
        console.log(`开始处理文件: ${filename}`);
        console.log(`文件内容长度: ${content.length} 字符`);
        console.log(`文件内容预览 (前200字符): ${content.substring(0, 200)}`);
        
        // 检查文件内容是否有效
        if (!content || content.trim().length === 0) {
            this.hideProcessingProgress();
            alert('文件内容为空，请检查文件是否正确');
            return;
        }
        
        // 对于大文件，使用异步解析
        const fileSizeMB = content.length / (1024 * 1024);
        if (fileSizeMB > 5) {
            console.log(`大文件检测: ${fileSizeMB.toFixed(2)}MB，使用异步解析`);
            this.updateProcessingProgress('正在解析章节结构...');
            setTimeout(() => {
                this.parseChaptersAsync(content).then(chapters => {
                    console.log(`异步解析完成，共找到 ${chapters.length} 个章节`);
                    this.chapters = chapters;
                    this.finishBookProcessing();
                }).catch(error => {
                    console.error('章节解析失败:', error);
                    this.hideProcessingProgress();
                    // 提供更详细的错误信息
                    const errorMsg = `章节解析失败：${error.message || '未知错误'}\n\n可能原因：\n1. 文件编码问题\n2. 文件格式不支持\n3. 文件内容异常\n\n请检查文件是否为正常的TXT小说文件。`;
                    alert(errorMsg);
                });
            }, 50);
        } else {
            console.log(`小文件检测: ${fileSizeMB.toFixed(2)}MB，使用同步解析`);
            try {
                this.chapters = this.parseChapters(content);
                console.log(`同步解析完成，共找到 ${this.chapters.length} 个章节`);
                this.finishBookProcessing();
            } catch (error) {
                console.error('同步章节解析失败:', error);
                this.hideProcessingProgress();
                alert(`章节解析失败：${error.message || '未知错误'}，请检查文件格式`);
            }
        }
    }
    
    finishBookProcessing() {
        this.updateChapterList();
        this.showReading();
        
        // 检查是否有保存的阅读进度，并检查书籍是否匹配
        const hasProgress = this.tryLoadReadingProgress();
        
        // 如果没有进度或加载失败，从第一章开始
        if (!hasProgress) {
            this.loadChapter(0);
            console.log('从第一章开始阅读');
        } else {
            console.log('✅ 阅读进度恢复成功！');
        }
        
        // 保存当前书籍信息
        this.saveCurrentBook();
        this.hideProcessingProgress();
        
        // 隐藏欢迎页面的上次阅读信息
        this.hideLastBookInfo();
        
        // 显示章节数量信息
        console.log(`解析完成！共找到 ${this.chapters.length} 个章节`);
    }
    
    // 隐藏欢迎页面的上次阅读信息
    hideLastBookInfo() {
        const lastBookInfo = document.querySelector('.last-book-info');
        if (lastBookInfo) {
            lastBookInfo.style.display = 'none';
        }
    }

    // 显示处理进度
    showProcessingProgress(message) {
        // 创建进度蒙版
        if (!this.processingOverlay) {
            this.processingOverlay = document.createElement('div');
            this.processingOverlay.className = 'processing-overlay';
            this.processingOverlay.innerHTML = `
                <div class="processing-content">
                    <div class="processing-spinner"></div>
                    <div class="processing-message">正在处理文件...</div>
                </div>
            `;
            
            // 添加样式
            const style = document.createElement('style');
            style.textContent = `
                .processing-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    backdrop-filter: blur(2px);
                }
                .processing-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    text-align: center;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                }
                .processing-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .processing-message {
                    color: #333;
                    font-size: 1rem;
                    margin-bottom: 0.5rem;
                }
                [data-theme="dark"] .processing-content {
                    background: #2c3e50;
                    color: white;
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(this.processingOverlay);
        }
        
        this.updateProcessingProgress(message);
    }
    
    // 更新进度消息
    updateProcessingProgress(message) {
        if (this.processingOverlay) {
            const messageEl = this.processingOverlay.querySelector('.processing-message');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }
    }
    
    // 隐藏进度显示
    hideProcessingProgress() {
        if (this.processingOverlay) {
            document.body.removeChild(this.processingOverlay);
            this.processingOverlay = null;
        }
    }

    // 异步章节解析（大文件优化）
    async parseChaptersAsync(content) {
        return new Promise((resolve) => {
            const lines = content.split('\n');
            const chapters = [];
            let currentChapter = null;
            let chapterContent = [];
            let processedLines = 0;
            const totalLines = lines.length;

            // 增强的章节识别模式，专门优化网络小说格式
            const chapterPatterns = [
                // "第一卷 第1章" 格式 - 针对史上最强师父
                /^第[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u96f6\u3007\u767e\u5343\u4e07\d]+卷\s+第\d+章.*$/,
                // "第X卷 第Y章" 变体
                /^第[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u96f6\u3007\u767e\u5343\u4e07\d]+卷.*第\d+章.*$/,
                // 传统章节格式
                /^第[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u96f6\u3007\u767e\u5343\u4e07\d]+章.*$/,
                /^第\d+章.*$/,
                // 其他常见格式
                /^第[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u96f6\u3007\u767e\u5343\u4e07\d]+[回|篇|节].*$/,
                /^Chapter\s*\d+.*$/i,
                /^[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u96f6\u3007\u767e\u5343\u4e07\d]+\s*[.、].*$/,
                /^\d+[.\s].*$/,
                // 包含中文字符的章节标题
                /^[\u4e00-\u9fa5]*第\d+章.*$/
            ];

            // 预处理：过滤掉明显的非章节行
            const skipPatterns = [
                /^-+$/,           // 分隔线
                /^\s*$/,          // 空行
                /^[\u3000\s]*$/       // 全角空格行
            ];

            const processNextBatch = () => {
                const batchSize = 1000; // 每次处理1000行
                const endIndex = Math.min(processedLines + batchSize, lines.length);
                
                for (let i = processedLines; i < endIndex; i++) {
                    const line = lines[i].trim();
                    
                    // 跳过空行和分隔线
                    if (skipPatterns.some(pattern => pattern.test(line))) {
                        if (chapterContent.length > 0 && currentChapter) {
                            chapterContent.push('');
                        }
                        continue;
                    }

                    const isChapterTitle = chapterPatterns.some(pattern => pattern.test(line));
                    
                    if (isChapterTitle) {
                        if (currentChapter && chapterContent.length > 0) {
                            currentChapter.content = chapterContent.join('\n').trim();
                            chapters.push(currentChapter);
                        }
                        
                        currentChapter = {
                            title: line,
                            content: '',
                            startIndex: i
                        };
                        chapterContent = [];
                    } else if (currentChapter) {
                        chapterContent.push(line);
                    } else {
                        if (chapters.length === 0) {
                            if (!currentChapter) {
                                currentChapter = {
                                    title: this.currentBook ? this.currentBook.title : '第一章',
                                    content: '',
                                    startIndex: 0
                                };
                                chapterContent = [];
                            }
                            chapterContent.push(line);
                        }
                    }
                }
                
                processedLines = endIndex;
                
                // 更新进度
                const progress = Math.round((processedLines / totalLines) * 100);
                this.updateProcessingProgress(`正在解析章节... ${progress}%`);
                
                if (processedLines < lines.length) {
                    // 继续处理下一批
                    setTimeout(processNextBatch, 10);
                } else {
                    // 处理最后一章
                    if (currentChapter && chapterContent.length > 0) {
                        currentChapter.content = chapterContent.join('\n').trim();
                        chapters.push(currentChapter);
                    }

                    // 如果没有识别到章节，将整个内容作为一章
                    if (chapters.length === 0) {
                        chapters.push({
                            title: this.currentBook ? this.currentBook.title : '全文',
                            content: content,
                            startIndex: 0
                        });
                    }
                    
                    resolve(chapters);
                }
            };
            
            processNextBatch();
        });
    }
    parseChapters(content) {
        const lines = content.split('\n');
        const chapters = [];
        let currentChapter = null;
        let chapterContent = [];

        // 增强的章节识别模式，专门优化网络小说格式
        const chapterPatterns = [
            // "第一卷 第1章" 格式 - 针对史上最强师父
            /^第[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u96f6\u3007\u767e\u5343\u4e07\d]+卷\s+第\d+章.*$/,
            // "第X卷 第Y章" 变体
            /^第[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u96f6\u3007\u767e\u5343\u4e07\d]+卷.*第\d+章.*$/,
            // 传统章节格式
            /^第[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u96f6\u3007\u767e\u5343\u4e07\d]+章.*$/,
            /^第\d+章.*$/,
            // 其他常见格式
            /^第[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u96f6\u3007\u767e\u5343\u4e07\d]+[回|篇|节].*$/,
            /^Chapter\s*\d+.*$/i,
            /^[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u96f6\u3007\u767e\u5343\u4e07\d]+\s*[.、].*$/,
            /^\d+[.\s].*$/,
            // 包含中文字符的章节标题
            /^[\u4e00-\u9fa5]*第\d+章.*$/
        ];

        // 预处理：过滤掉明显的非章节行
        const skipPatterns = [
            /^-+$/,           // 分隔线
            /^\s*$/,          // 空行
            /^[\u3000\s]*$/       // 全角空格行
        ];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 跳过空行和分隔线
            if (skipPatterns.some(pattern => pattern.test(line))) {
                if (chapterContent.length > 0 && currentChapter) {
                    chapterContent.push('');
                }
                continue;
            }

            const isChapterTitle = chapterPatterns.some(pattern => pattern.test(line));
            
            if (isChapterTitle) {
                if (currentChapter && chapterContent.length > 0) {
                    currentChapter.content = chapterContent.join('\n').trim();
                    chapters.push(currentChapter);
                }
                
                currentChapter = {
                    title: line,
                    content: '',
                    startIndex: i
                };
                chapterContent = [];
            } else if (currentChapter) {
                chapterContent.push(line);
            } else {
                if (chapters.length === 0) {
                    if (!currentChapter) {
                        currentChapter = {
                            title: this.currentBook ? this.currentBook.title : '第一章',
                            content: '',
                            startIndex: 0
                        };
                        chapterContent = [];
                    }
                    chapterContent.push(line);
                }
            }
        }

        if (currentChapter && chapterContent.length > 0) {
            currentChapter.content = chapterContent.join('\n').trim();
            chapters.push(currentChapter);
        }

        // 如果没有识别到章节，将整个内容作为一章
        if (chapters.length === 0) {
            chapters.push({
                title: this.currentBook ? this.currentBook.title : '全文',
                content: content,
                startIndex: 0
            });
        }

        return chapters;
    }

    updateChapterList() {
        const chapterListHtml = this.chapters.map((chapter, index) => 
            `<div class="chapter-item" data-chapter="${index}">
                ${chapter.title}
            </div>`
        ).join('');
        
        this.chapterList.innerHTML = chapterListHtml;
        
        this.chapterList.addEventListener('click', (e) => {
            if (e.target.classList.contains('chapter-item')) {
                const chapterIndex = parseInt(e.target.dataset.chapter);
                this.loadChapter(chapterIndex);
                this.closeSidebar();
            }
        });
    }

    showReading() {
        document.querySelector('.welcome-screen').style.display = 'none';
        this.readingArea.style.display = 'block';
    }

    loadChapter(index, isRestoringProgress = false) {
        if (index < 0 || index >= this.chapters.length) return;
        
        this.currentChapterIndex = index;
        const chapter = this.chapters[index];
        
        if (this.currentChapterTitle) this.currentChapterTitle.textContent = chapter.title;
        
        // 只显示章节内容，去除不必要的空白
        this.textContent.innerHTML = `<div class="chapter-text" id="chapterText">${chapter.content.replace(/\n/g, '<br>')}</div>`;
        
        if (this.chapterProgress) this.chapterProgress.textContent = `${index + 1} / ${this.chapters.length}`;
        
        const progressPercentage = ((index + 1) / this.chapters.length) * 100;
        this.progressFill.style.width = `${progressPercentage}%`;
        
        if (this.prevChapterBtn) this.prevChapterBtn.disabled = index === 0;
        if (this.nextChapterBtn) this.nextChapterBtn.disabled = index === this.chapters.length - 1;
        
        document.querySelectorAll('.chapter-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        // 自动滚动目录到当前章节，传递恢复进度状态
        this.scrollSidebarToActiveChapter(index, isRestoringProgress);
        
        // 只有在不是恢复进度时才保存进度和重置滚动位置
        if (!isRestoringProgress) {
            this.saveReadingProgress();
            this.textContent.scrollTop = 0;
        }
        
        // 添加滚动事件监听，保存滚动位置
        this.addScrollProgressSaver();
        
        // 应用当前的字体和行距设置到新加载的章节
        setTimeout(() => {
            this.applyFontSize();
            const settings = this.getReadingSettings();
            this.applyLineHeight(settings.lineHeight);
        }, 100);
        
    }


    addScrollProgressSaver() {
        // 移除之前的滚动监听器（如果存在）
        if (this.scrollSaveTimer) {
            clearTimeout(this.scrollSaveTimer);
        }
        
        // 防抖保存滚动位置
        const debouncedSave = () => {
            if (this.scrollSaveTimer) {
                clearTimeout(this.scrollSaveTimer);
            }
            this.scrollSaveTimer = setTimeout(() => {
                this.saveReadingProgress();
            }, 1000); // 1秒后保存
        };
        
        // 移除旧的事件监听器
        if (this.scrollHandler) {
            this.textContent.removeEventListener('scroll', this.scrollHandler);
        }
        
        // 添加滚动事件监听器
        this.scrollHandler = debouncedSave;
        this.textContent.addEventListener('scroll', this.scrollHandler);
    }

    scrollSidebarToActiveChapter(chapterIndex) {
        // 增加重试机制，确保DOM完全渲染后再滚动
        const attemptScroll = (attempts = 0) => {
            const maxAttempts = 10;
            
            if (attempts >= maxAttempts) {
                console.warn('目录滚动定位失败：超过最大重试次数');
                return;
            }
            
            const chapterItems = document.querySelectorAll('.chapter-item');
            const sidebarContainer = document.querySelector('#chapterList');
            
            // 检查必要元素是否存在
            if (!sidebarContainer || chapterItems.length === 0) {
                console.log(`目录滚动重试 ${attempts + 1}/${maxAttempts}: DOM未就绪`);
                setTimeout(() => attemptScroll(attempts + 1), 50);
                return;
            }
            
            // 确保章节索引有效
            if (chapterIndex < 0 || chapterIndex >= chapterItems.length) {
                console.warn(`章节索引无效: ${chapterIndex}/${chapterItems.length}`);
                return;
            }
            
            const targetItem = chapterItems[chapterIndex];
            
            if (!targetItem) {
                console.log(`目录滚动重试 ${attempts + 1}/${maxAttempts}: 目标章节项未找到`);
                setTimeout(() => attemptScroll(attempts + 1), 50);
                return;
            }
            
            console.log(`目录滚动到第${chapterIndex + 1}章 (尝试 ${attempts + 1})`);
            
            // 使用更可靠的滚动方法
            try {
                // 计算目标元素相对于容器的位置
                const containerHeight = sidebarContainer.clientHeight;
                const targetTop = targetItem.offsetTop;
                
                // 计算滚动位置，让目标章节居中显示
                const scrollPosition = targetTop - (containerHeight / 2) + (targetItem.offsetHeight / 2);
                
                // 执行滚动
                sidebarContainer.scrollTo({
                    top: Math.max(0, scrollPosition),
                    behavior: 'smooth'
                });
                
                // 添加临时高亮效果
                this.highlightCurrentChapter(targetItem);
                
                console.log(`✅ 目录滚动成功定位到第${chapterIndex + 1}章`);
                
            } catch (error) {
                console.error('目录滚动执行失败:', error);
                // 降级方案：使用scrollIntoView
                try {
                    targetItem.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                    this.highlightCurrentChapter(targetItem);
                    console.log('✅ 目录滚动降级方案成功');
                } catch (fallbackError) {
                    console.error('目录滚动降级方案也失败:', fallbackError);
                }
            }
        };
        
        // 根据当前状态决定延迟时间
        const isRestoring = arguments[1]; // 从调用方传入是否为恢复进度
        const delay = isRestoring ? 300 : 100; // 恢复进度时给更多时间
        
        setTimeout(() => attemptScroll(0), delay);
    }

    highlightCurrentChapter(targetItem) {
        if (!targetItem) return;
        
        // 添加临时高亮效果，让用户更容易注意到当前章节
        targetItem.style.transition = 'background-color 0.5s ease';
        const originalBg = getComputedStyle(targetItem).backgroundColor;
        
        // 短暂闪烁效果
        setTimeout(() => {
            targetItem.style.backgroundColor = 'var(--accent-hover)';
            setTimeout(() => {
                targetItem.style.backgroundColor = originalBg;
                // 清理内联样式
                setTimeout(() => {
                    targetItem.style.backgroundColor = '';
                }, 500);
            }, 300);
        }, 100);
    }

    previousChapter() {
        if (this.currentChapterIndex > 0) {
            this.loadChapter(this.currentChapterIndex - 1);
        }
    }

    nextChapter() {
        if (this.currentChapterIndex < this.chapters.length - 1) {
            this.loadChapter(this.currentChapterIndex + 1);
        }
    }

    changeFontSize(delta) {
        this.fontSize = Math.max(12, Math.min(24, this.fontSize + delta));
        this.applyFontSize();
        this.syncFontSizeControls();
        this.saveReadingSettings();
    }

    toggleSidebar() {
        if (window.innerWidth <= 768) {
            const wasOpen = this.sidebar.classList.contains('open');
            this.sidebar.classList.toggle('open');
            
            // 如果侧边栏刚刚打开，且有当前章节，则自动定位
            if (!wasOpen && this.sidebar.classList.contains('open') && this.currentBook) {
                console.log('移动端侧边栏打开，自动定位到当前章节');
                // 延迟一点时间让侧边栏动画完成
                setTimeout(() => {
                    this.scrollSidebarToActiveChapter(this.currentChapterIndex);
                }, 350); // 侧边栏动画时间 + 50ms缓冲
            }
        }
    }

    closeSidebar() {
        this.sidebar.classList.remove('open');
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.body.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
        this.toggleThemeBtn.textContent = this.isDarkTheme ? '☀️ 日间' : '🌙 夜间';
        this.saveSettings();
    }

    handleKeydown(event) {
        switch(event.key) {
            case 'ArrowLeft':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.previousChapter();
                }
                break;
            case 'ArrowRight':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.nextChapter();
                }
                break;
            case '=':
            case '+':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.changeFontSize(2);
                }
                break;
            case '-':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.changeFontSize(-2);
                }
                break;
            case 'Escape':
                this.closeSidebar();
                break;
        }
    }

    saveCurrentBook() {
        if (this.currentBook) {
            try {
                // 基础书籍元数据
                const bookMeta = {
                    title: this.currentBook.title,
                    totalChapters: this.chapters.length,
                    firstChapterPreview: this.chapters[0] ? this.chapters[0].title : '',
                    fileSize: this.currentBook.content.length,
                    timestamp: Date.now()
                };
                
                // 检查内容大小，决定存储策略
                const contentSize = this.currentBook.content.length;
                const maxContentSize = 3 * 1024 * 1024; // 3MB 内容限制，为其他数据留出空间
                
                if (contentSize <= maxContentSize) {
                    // 小文件：保存完整内容
                    bookMeta.content = this.currentBook.content;
                    localStorage.setItem('currentBook', JSON.stringify(bookMeta));
                    console.log(`完整书籍数据已保存: ${bookMeta.title}, 共${bookMeta.totalChapters}章`);
                } else {
                    // 大文件：分块存储内容
                    console.log(`大文件检测(${(contentSize/1024/1024).toFixed(2)}MB)，使用分块存储策略`);
                    
                    // 先保存元数据
                    localStorage.setItem('currentBook', JSON.stringify(bookMeta));
                    
                    // 分块保存内容
                    const chunkSize = 1024 * 1024; // 1MB per chunk
                    const totalChunks = Math.ceil(contentSize / chunkSize);
                    
                    // 清理旧的内容块
                    this.clearBookContentChunks();
                    
                    // 保存内容块
                    for (let i = 0; i < totalChunks; i++) {
                        const start = i * chunkSize;
                        const end = Math.min(start + chunkSize, contentSize);
                        const chunk = this.currentBook.content.substring(start, end);
                        
                        try {
                            localStorage.setItem(`bookChunk_${i}`, chunk);
                        } catch (chunkError) {
                            console.error(`保存内容块 ${i} 失败:`, chunkError);
                            // 如果保存失败，删除已保存的块并保存不含内容的元数据
                            this.clearBookContentChunks();
                            bookMeta.hasContentChunks = false;
                            bookMeta.contentTooLarge = true;
                            localStorage.setItem('currentBook', JSON.stringify(bookMeta));
                            console.log('由于存储空间限制，仅保存书籍元数据');
                            return;
                        }
                    }
                    
                    // 更新元数据，标记使用了分块存储
                    bookMeta.hasContentChunks = true;
                    bookMeta.totalContentChunks = totalChunks;
                    localStorage.setItem('currentBook', JSON.stringify(bookMeta));
                    
                    console.log(`分块存储完成: ${bookMeta.title}, 共${totalChunks}个内容块`);
                }
            } catch (error) {
                console.error('保存书籍数据失败:', error);
                // 如果保存失败，可能是因为空间不足，尝试只保存元数据
                if (error.name === 'QuotaExceededError') {
                    try {
                        const minimalMeta = {
                            title: this.currentBook.title,
                            totalChapters: this.chapters.length,
                            firstChapterPreview: this.chapters[0] ? this.chapters[0].title : '',
                            fileSize: this.currentBook.content.length,
                            timestamp: Date.now(),
                            contentTooLarge: true
                        };
                        localStorage.setItem('currentBook', JSON.stringify(minimalMeta));
                        console.log('由于空间限制，已保存简化元数据');
                    } catch (secondError) {
                        console.error('保存简化数据也失败:', secondError);
                    }
                }
            }
        }
    }

    clearBookContentChunks() {
        // 清理所有可能存在的内容块
        for (let i = 0; i < 50; i++) { // 最多清理50个块
            const chunkKey = `bookChunk_${i}`;
            if (localStorage.getItem(chunkKey)) {
                localStorage.removeItem(chunkKey);
            }
        }
    }

    showLastBookHint(book) {
        // 显示上次阅读的书籍信息，提示用户重新选择相同文件
        const lastBookInfo = document.getElementById('lastBookInfo');
        if (lastBookInfo) {
            lastBookInfo.style.display = 'block';
            lastBookInfo.innerHTML = `
                <div class="last-book-hint">
                    <h4>📚 上次阅读记录</h4>
                    <p><strong>书名:</strong> ${book.title}</p>
                    <p><strong>章节数:</strong> ${book.totalChapters || '未知'}章</p>
                    <p><strong>文件大小:</strong> ${book.fileSize ? (book.fileSize / (1024 * 1024)).toFixed(2) + 'MB' : '未知'}</p>
                    <p class="hint-text">由于文件过大，内容数据未完整保存。请重新选择相同的TXT文件继续阅读。</p>
                </div>
            `;
        }
    }

    saveReadingProgress() {
        if (this.currentBook && this.textContent) {
            try {
                // 获取更详细的进度信息
                const scrollTop = this.textContent.scrollTop;
                const scrollHeight = this.textContent.scrollHeight;
                const clientHeight = this.textContent.clientHeight;
                const scrollPercentage = scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0;
                
                const progressData = {
                    bookTitle: this.currentBook.title,
                    chapterIndex: this.currentChapterIndex,
                    scrollPosition: scrollTop,
                    scrollPercentage: scrollPercentage,
                    chapterTitle: this.chapters[this.currentChapterIndex]?.title || '',
                    totalChapters: this.chapters.length,
                    timestamp: Date.now(),
                    // 添加更多上下文信息
                    fileSize: this.currentBook.content?.length || 0,
                    currentChapterLength: this.chapters[this.currentChapterIndex]?.content?.length || 0
                };
                
                localStorage.setItem('readingProgress', JSON.stringify(progressData));
                console.log(`阅读进度已保存: 第${this.currentChapterIndex + 1}章 (滚动: ${scrollTop}px, ${scrollPercentage.toFixed(1)}%)`);
            } catch (error) {
                console.error('保存阅读进度失败:', error);
            }
        }
    }

    tryLoadReadingProgress() {
        try {
            const progress = localStorage.getItem('readingProgress');
            if (progress && this.currentBook) {
                const data = JSON.parse(progress);
                console.log('尝试加载阅读进度:', data);
                
                // 检查书籍是否匹配（支持多种匹配方式）
                const isBookMatch = this.isBookMatching(data.bookTitle, this.currentBook.title);
                
                if (isBookMatch && 
                    data.chapterIndex !== undefined && 
                    data.chapterIndex >= 0 &&
                    data.chapterIndex < this.chapters.length) {
                    
                    console.log(`✅ 书籍匹配成功，恢复阅读进度: 第${data.chapterIndex + 1}章, 滚动位置: ${data.scrollPosition}`);
                    
                    // 加载指定章节（标记为恢复进度，避免重置滚动位置）
                    this.loadChapter(data.chapterIndex, true);
                    
                    // 恢复滚动位置
                    setTimeout(() => {
                        if (this.textContent && data.scrollPosition !== undefined && data.scrollPosition > 0) {
                            this.textContent.scrollTop = data.scrollPosition;
                            console.log('滚动位置已恢复:', data.scrollPosition);
                        }
                    }, 300); // 增加延迟确保 DOM 渲染完成
                    
                    // 显示恢复成功的提示
                    setTimeout(() => {
                        this.showProgressRestoredMessage(data);
                    }, 500);
                    
                    return true; // 成功加载进度
                } else {
                    if (!isBookMatch) {
                        console.log(`书籍不匹配: 存储的="${data.bookTitle}", 当前="${this.currentBook.title}"`);
                    }
                    if (data.chapterIndex >= this.chapters.length) {
                        console.log(`章节索引超出范围: ${data.chapterIndex} >= ${this.chapters.length}`);
                    }
                }
            }
        } catch (error) {
            console.error('读取阅读进度失败:', error);
        }
        
        console.log('没有可用的阅读进度，从第一章开始');
        return false; // 没有进度或加载失败
    }
    
    // 检查书籍是否匹配（支持多种匹配方式）
    isBookMatching(savedTitle, currentTitle) {
        if (!savedTitle || !currentTitle) return false;
        
        // 完全匹配
        if (savedTitle === currentTitle) return true;
        
        // 去除扩展名后匹配
        const cleanSaved = savedTitle.replace(/\.(txt|TXT)$/i, '');
        const cleanCurrent = currentTitle.replace(/\.(txt|TXT)$/i, '');
        if (cleanSaved === cleanCurrent) return true;
        
        // 去除空格和特殊字符后匹配
        const normalizeSaved = cleanSaved.replace(/[\s\-_\u3000]/g, '').toLowerCase();
        const normalizeCurrent = cleanCurrent.replace(/[\s\-_\u3000]/g, '').toLowerCase();
        if (normalizeSaved === normalizeCurrent) return true;
        
        return false;
    }
    
    // 显示进度恢复成功的提示
    showProgressRestoredMessage(progressData) {
        // 创建提示消息
        const message = document.createElement('div');
        message.className = 'progress-restored-message';
        message.innerHTML = `
            <div class="message-content">
                <span class="message-icon">✅</span>
                <span class="message-text">阅读进度已恢复！继续阅读 ${progressData.chapterTitle || `第${progressData.chapterIndex + 1}章`}</span>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .progress-restored-message {
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--success-color, #10b981);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: var(--border-radius);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                animation: slideInDown 0.3s ease-out forwards, slideOutUp 0.3s ease-in 3s forwards;
                font-size: 0.9rem;
                font-weight: 500;
                max-width: 400px;
                text-align: center;
            }
            
            .message-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                justify-content: center;
            }
            
            .message-icon {
                font-size: 1.2rem;
            }
            
            @keyframes slideInDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            @keyframes slideOutUp {
                from {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(message);
        
        // 3.5秒后自动移除
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 3500);
    }

    loadReadingProgress() {
        // 保持原有方法的兼容性
        return this.tryLoadReadingProgress();
    }

    saveSettings() {
        localStorage.setItem('readerSettings', JSON.stringify({
            fontSize: this.fontSize,
            isDarkTheme: this.isDarkTheme,
            timestamp: Date.now()
        }));
    }

    loadSettings() {
        try {
            // 加载旧的主题设置
            const settings = localStorage.getItem('readerSettings');
            if (settings) {
                const data = JSON.parse(settings);
                
                this.isDarkTheme = data.isDarkTheme || false;
                document.body.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
                this.toggleThemeBtn.textContent = this.isDarkTheme ? '☀️ 日间' : '🌙 夜间';
            }
        } catch (error) {
            console.error('读取设置失败:', error);
        }
        
        // 加载阅读设置（包括字体大小）
        this.loadReadingSettings();
        
        // 加载侧栏折叠状态
        this.loadSidebarState();
    }

    // 折叠/展开侧栏切换 - 支持两种状态：展开、完全折叠
    toggleSidebarCollapse() {
        console.log('🔄 toggleSidebarCollapse 方法被调用');
        
        if (!this.sidebar) {
            console.error('❌ 侧栏元素不存在');
            return;
        }
        
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) {
            console.error('❌ 主内容元素不存在');
            return;
        }
        
        const isFullyCollapsed = this.sidebar.classList.contains('fully-collapsed');
        console.log(`📊 当前状态: ${isFullyCollapsed ? '完全折叠' : '展开'}`);
        
        if (isFullyCollapsed) {
            // 从完全折叠到展开状态
            console.log('⬅️ 展开侧栏');
            this.sidebar.classList.remove('fully-collapsed');
            mainContent.classList.remove('sidebar-fully-collapsed');
            if (this.expandTrigger) this.expandTrigger.classList.remove('visible');
            if (this.collapseBtn) {
                this.collapseBtn.setAttribute('aria-expanded', 'true');
                this.collapseBtn.setAttribute('aria-label', '折叠目录');
                this.collapseBtn.setAttribute('title', '折叠目录');
            }
            this.saveSidebarState('expanded');
        } else {
            // 从展开到完全折叠状态
            console.log('➡️ 折叠侧栏');
            this.sidebar.classList.add('fully-collapsed');
            mainContent.classList.add('sidebar-fully-collapsed');
            if (this.expandTrigger) this.expandTrigger.classList.add('visible');
            if (this.collapseBtn) {
                this.collapseBtn.setAttribute('aria-expanded', 'false');
                this.collapseBtn.setAttribute('aria-label', '展开目录');
                this.collapseBtn.setAttribute('title', '展开目录');
            }
            this.saveSidebarState('fully-collapsed');
            // 修复折叠状态下的底部空间问题
            this.fixCollapsedLayoutHeight();
        }
        
        console.log('✅ 侧栏状态切换完成');
        
        // 验证结果
        setTimeout(() => {
            const newState = this.sidebar.classList.contains('fully-collapsed');
            console.log(`🔍 状态验证: ${newState ? '完全折叠' : '展开'}`);
            console.log(`🔍 主内容类: ${mainContent.className}`);
        }, 100);
    }

    // 从悬浮按钮展开侧栏
    expandFromTrigger() {
        const mainContent = document.querySelector('.main-content');
        
        this.sidebar.classList.remove('fully-collapsed');
        mainContent.classList.remove('sidebar-fully-collapsed');
        this.expandTrigger.classList.remove('visible');
        
        this.collapseBtn.setAttribute('aria-expanded', 'true');
        this.collapseBtn.setAttribute('aria-label', '折叠目录');
        this.collapseBtn.setAttribute('title', '折叠目录');
        
        this.saveSidebarState('expanded');
        console.log('从悬浮按钮展开侧栏');
    }

    // 保存侧栏状态
    saveSidebarState(state) {
        localStorage.setItem('sidebarState', state);
        console.log('侧栏状态已保存:', state);
    }

    // 修复折叠状态下的底部空间问题
    fixCollapsedLayoutHeight() {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent || !mainContent.classList.contains('sidebar-fully-collapsed')) {
            return;
        }

        // 计算正确的高度 (viewport高度 - header高度)
        const correctHeight = window.innerHeight - 80;
        
        // 应用修复到主容器
        mainContent.style.cssText += `
            grid-template-rows: ${correctHeight}px !important;
            height: ${correctHeight}px !important;
        `;
        
        // 应用修复到grid子元素
        const gridElements = [
            '.recommendations-panel',
            '.right-sidebar', 
            '.welcome-screen'
        ];
        
        gridElements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.cssText += `
                    height: ${correctHeight}px !important;
                    min-height: ${correctHeight}px !important;
                    max-height: ${correctHeight}px !important;
                `;
            }
        });
        
        console.log(`🔧 折叠布局高度已修复: ${correctHeight}px`);
    }

    // 加载侧栏状态
    loadSidebarState() {
        try {
            const sidebarState = localStorage.getItem('sidebarState') || 'expanded';
            const mainContent = document.querySelector('.main-content');
            
            // 清除所有状态
            this.sidebar.classList.remove('fully-collapsed');
            mainContent.classList.remove('sidebar-fully-collapsed');
            this.expandTrigger.classList.remove('visible');
            
            switch (sidebarState) {
                case 'fully-collapsed':
                    this.sidebar.classList.add('fully-collapsed');
                    mainContent.classList.add('sidebar-fully-collapsed');
                    this.expandTrigger.classList.add('visible');
                    console.log('侧栏状态已恢复: 完全折叠');
                    // 修复折叠状态下的底部空间问题
                    this.fixCollapsedLayoutHeight();
                    break;
                default: // expanded
                    this.collapseBtn.setAttribute('aria-expanded', 'true');
                    this.collapseBtn.setAttribute('aria-label', '折叠目录');
                    this.collapseBtn.setAttribute('title', '折叠目录');
                    console.log('侧栏状态已恢复: 展开');
                    break;
            }
        } catch (error) {
            console.error('读取侧栏状态失败:', error);
        }
    }

    // 检查上次阅读进度并显示继续阅读按钮
    checkLastReading() {
        try {
            const bookData = localStorage.getItem('currentBook');
            const progressData = localStorage.getItem('readingProgress');
            
            if (bookData && progressData) {
                const book = JSON.parse(bookData);
                const progress = JSON.parse(progressData);
                
                // 关键修复：检查书籍是否匹配并且有内容数据
                if (book.title && progress.bookTitle && 
                    this.isBookMatching(progress.bookTitle, book.title) &&
                    book.content && book.content.trim().length > 0) {
                    
                    console.log('发现上次阅读记录:', book.title);
                    this.showContinueReadingButton(book, progress);
                } else {
                    console.log('书籍数据不完整，不显示继续阅读按钮');
                    if (!book.content) {
                        console.log('缺少书籍内容数据');
                    }
                }
            } else {
                console.log('没有找到完整的阅读记录');
            }
        } catch (error) {
            console.error('检查上次阅读记录失败:', error);
        }
    }
    
    // 显示继续阅读按钮
    showContinueReadingButton(bookData, progressData) {
        const continueSection = document.getElementById('continueReadingSection');
        const lastReadingInfo = document.getElementById('lastReadingInfo');
        
        if (continueSection && lastReadingInfo) {
            // 更新书籍信息
            const titleElement = lastReadingInfo.querySelector('.last-book-title');
            const progressElement = lastReadingInfo.querySelector('.last-reading-progress');
            
            if (titleElement) {
                titleElement.textContent = bookData.title;
            }
            
            if (progressElement) {
                const chapterInfo = progressData.chapterTitle || `第${progressData.chapterIndex + 1}章`;
                const progressPercent = progressData.scrollPercentage ? 
                    ` (${Math.round(progressData.scrollPercentage)}%)` : '';
                progressElement.textContent = `上次阅读到：${chapterInfo}${progressPercent}`;
            }
            
            // 显示继续阅读部分
            continueSection.style.display = 'block';
        }
    }
    
    // 继续阅读功能
    continueReading() {
        try {
            const bookData = localStorage.getItem('currentBook');
            if (!bookData) {
                alert('未找到上次阅读的书籍记录');
                return;
            }
            
            const book = JSON.parse(bookData);
            let bookContent = null;
            
            // 检查内容数据的获取方式
            if (book.content) {
                // 直接保存的完整内容
                bookContent = book.content;
                console.log('从完整存储中加载内容');
            } else if (book.hasContentChunks && book.totalContentChunks) {
                // 从分块存储中重建内容
                console.log(`从${book.totalContentChunks}个内容块中重建内容`);
                const contentParts = [];
                
                for (let i = 0; i < book.totalContentChunks; i++) {
                    const chunk = localStorage.getItem(`bookChunk_${i}`);
                    if (chunk === null) {
                        throw new Error(`内容块 ${i} 缺失，无法重建完整内容`);
                    }
                    contentParts.push(chunk);
                }
                
                bookContent = contentParts.join('');
                console.log(`内容重建完成，总长度: ${bookContent.length} 字符`);
            } else if (book.contentTooLarge) {
                // 文件太大，内容未保存
                alert('书籍文件过大，内容数据未保存。请重新选择原文件继续阅读。');
                this.showWelcome();
                this.showLastBookHint(book);
                return;
            } else {
                // 没有内容数据
                alert('书籍内容数据缺失，请重新选择文件继续阅读');
                this.showWelcome();
                this.showLastBookHint(book);
                return;
            }
            
            // 重新构建书籍对象
            this.currentBook = {
                title: book.title,
                content: bookContent,
                size: book.fileSize
            };
            
            // 解析章节
            this.chapters = this.parseChapters(bookContent);
            console.log(`章节解析完成，共${this.chapters.length}章`);
            
            // 更新章节列表
            this.updateChapterList();
            
            // 尝试恢复阅读进度
            const hasProgress = this.tryLoadReadingProgress();
            
            // 如果没有进度，从第一章开始
            if (!hasProgress) {
                this.loadChapter(0);
                console.log('从第一章开始阅读');
            }
            
            // 显示阅读区域
            this.showReading();
            
            // 隐藏欢迎页面的继续阅读按钮
            this.hideLastBookInfo();
            
            console.log('成功恢复上次阅读:', book.title);
            
        } catch (error) {
            console.error('继续阅读失败:', error);
            alert(`恢复阅读失败: ${error.message}\n\n请重新选择文件`);
            this.showWelcome();
        }
    }

    loadLastBook() {
        try {
            const bookData = localStorage.getItem('currentBook');
            if (bookData) {
                const data = JSON.parse(bookData);
                console.log(`上次阅读: ${data.title}, ${data.totalChapters}章节, 文件大小: ${(data.fileSize / 1024 / 1024).toFixed(2)}MB`);
                
                // 在欢迎页面显示上次阅读信息
                if (data.title && data.totalChapters > 0) {
                    this.showLastBookInfo(data);
                }
            }
        } catch (error) {
            console.error('读取上次打开的书籍失败:', error);
            // 清除损坏的数据
            localStorage.removeItem('currentBook');
        }
    }
    
    // 在欢迎页面显示上次阅读的书籍信息
    showLastBookInfo(bookData) {
        const welcomeScreen = document.querySelector('.welcome-screen');
        if (!welcomeScreen) return;
        
        // 检查是否已经添加了上次阅读信息
        const existingInfo = welcomeScreen.querySelector('.last-book-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        // 获取阅读进度信息
        let progressInfo = '';
        try {
            const progress = localStorage.getItem('readingProgress');
            if (progress) {
                const progressData = JSON.parse(progress);
                if (progressData.bookTitle === bookData.title) {
                    progressInfo = `上次阅读到：${progressData.chapterTitle || `第${progressData.chapterIndex + 1}章`}`;
                }
            }
        } catch (error) {
            console.error('读取进度信息失败:', error);
        }
        
        // 创建上次阅读信息面板
        const lastBookInfo = document.createElement('div');
        lastBookInfo.className = 'last-book-info';
        lastBookInfo.innerHTML = `
            <div class="last-book-card">
                <h3>📖 继续上次阅读</h3>
                <div class="book-details">
                    <p class="book-title">${bookData.title}</p>
                    <p class="book-stats">共 ${bookData.totalChapters} 章节 • ${(bookData.fileSize / 1024 / 1024).toFixed(2)}MB</p>
                    ${progressInfo ? `<p class="progress-info">${progressInfo}</p>` : ''}
                </div>
                <div class="book-actions">
                    <button class="btn btn-primary" id="continueLastBook">📖 继续阅读</button>
                    <button class="btn btn-secondary" id="clearLastBook">✕ 清除记录</button>
                </div>
            </div>
        `;
        
        // 在feature-list之前插入
        const featureList = welcomeScreen.querySelector('.feature-list');
        if (featureList) {
            welcomeScreen.insertBefore(lastBookInfo, featureList);
        } else {
            welcomeScreen.appendChild(lastBookInfo);
        }
        
        // 绑定事件
        const continueBtn = lastBookInfo.querySelector('#continueLastBook');
        const clearBtn = lastBookInfo.querySelector('#clearLastBook');
        
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                // 直接继续阅读，不需要重新选择文件
                this.continueReading();
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                // 清除上次阅读记录
                localStorage.removeItem('currentBook');
                localStorage.removeItem('readingProgress');
                lastBookInfo.remove();
                console.log('已清除上次阅读记录');
            });
        }
        
        // 添加样式
        this.addLastBookInfoStyles();
    }
    
    // 添加上次阅读信息的样式
    addLastBookInfoStyles() {
        // 检查是否已经添加了样式
        if (document.querySelector('#lastBookInfoStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'lastBookInfoStyles';
        style.textContent = `
            .last-book-info {
                margin: 2rem 0;
                padding: 0;
            }
            
            .last-book-card {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: 1.5rem;
                text-align: left;
            }
            
            .last-book-card h3 {
                margin: 0 0 1rem 0;
                color: var(--accent-color);
                font-size: 1.2rem;
                text-align: center;
            }
            
            .book-details {
                margin-bottom: 1.5rem;
            }
            
            .book-title {
                font-weight: bold;
                font-size: 1.1rem;
                color: var(--text-primary);
                margin: 0 0 0.5rem 0;
                word-break: break-word;
            }
            
            .book-stats {
                color: var(--text-muted);
                font-size: 0.9rem;
                margin: 0 0 0.5rem 0;
            }
            
            .progress-info {
                color: var(--accent-color);
                font-size: 0.9rem;
                margin: 0;
                font-style: italic;
            }
            
            .book-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .book-actions .btn {
                flex: 1;
                min-width: 150px;
                padding: 0.75rem 1rem;
                font-size: 0.9rem;
            }
            
            @media (max-width: 480px) {
                .book-actions {
                    flex-direction: column;
                }
                
                .book-actions .btn {
                    flex: none;
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // 设置功能方法
    openSettingsModal() {
        this.settingsModal.classList.add('show');
        this.loadSettingsToModal();
    }

    closeSettingsModal() {
        this.settingsModal.classList.remove('show');
    }

    loadSettingsToModal() {
        // 从localStorage加载设置
        const settings = this.getReadingSettings();
        
        // 更新滑块值
        this.leftMarginRange.value = settings.leftMargin;
        this.rightMarginRange.value = settings.rightMargin;
        this.leftMarginValue.textContent = settings.leftMargin + 'px';
        this.rightMarginValue.textContent = settings.rightMargin + 'px';
        
        // 更新字体大小滑块
        this.fontSizeRange.value = settings.fontSize;
        this.fontSizeRangeValue.textContent = settings.fontSize + 'px';
        
        // 更新行距滑块
        this.lineHeightRange.value = settings.lineHeight;
        this.lineHeightValue.textContent = settings.lineHeight.toFixed(1);
        
        // 更新阅读区域宽度滑块
        this.readerWidthRange.value = settings.readerWidth;
        this.readerWidthValue.textContent = settings.readerWidth + 'px';
        
        // 更新背景色选择
        this.colorBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === settings.backgroundColor);
        });
    }

    updateMargins() {
        const leftMargin = this.leftMarginRange.value;
        const rightMargin = this.rightMarginRange.value;
        
        // 更新显示值
        this.leftMarginValue.textContent = leftMargin + 'px';
        this.rightMarginValue.textContent = rightMargin + 'px';
        
        // 应用边距
        this.applyMargins(leftMargin, rightMargin);
        
        // 保存设置
        this.saveReadingSettings();
    }

    applyMargins(leftMargin, rightMargin) {
        if (this.readerContent) {
            // 关键修复：移除max-width和margin限制，让内容占满整个容器
            this.readerContent.style.setProperty('max-width', 'none', 'important');
            this.readerContent.style.setProperty('margin', '0', 'important');
            this.readerContent.style.setProperty('width', '100%', 'important');
            
            // 然后应用自定义边距
            this.readerContent.style.setProperty('padding-left', leftMargin + 'px', 'important');
            this.readerContent.style.setProperty('padding-right', rightMargin + 'px', 'important');
            this.readerContent.style.setProperty('padding-top', '0', 'important');
            this.readerContent.style.setProperty('padding-bottom', '0', 'important');
        }
        if (this.readingArea) {
            // 重置reading-area的padding为上下2rem，左右0
            this.readingArea.style.setProperty('padding', '2rem 0', 'important');
        }
        
        // 确保text-content没有额外的margin
        if (this.textContent) {
            this.textContent.style.setProperty('margin', '0', 'important');
            this.textContent.style.setProperty('margin-bottom', '2rem', 'important'); // 保持底部间距
        }
    }

    // 阅读区域宽度相关方法
    updateReaderWidth() {
        const readerWidth = parseInt(this.readerWidthRange.value);
        
        // 更新显示值
        this.readerWidthValue.textContent = readerWidth + 'px';
        
        // 应用阅读区域宽度
        this.applyReaderWidth(readerWidth);
        
        // 保存设置
        this.saveReadingSettings();
    }
    
    applyReaderWidth(readerWidth) {
        // 使用CSS自定义属性来动态调整折叠状态下的阅读区域宽度
        document.documentElement.style.setProperty('--reader-width', `${readerWidth}px`);
        document.documentElement.style.setProperty('--reader-width-value', `${readerWidth}px`);
    }

    // 行距相关方法
    updateLineHeight() {
        const lineHeight = parseFloat(this.lineHeightRange.value);
        
        // 更新显示值
        this.lineHeightValue.textContent = lineHeight.toFixed(1);
        
        // 应用行距
        this.applyLineHeight(lineHeight);
        
        // 保存设置
        this.saveReadingSettings();
    }
    
    applyLineHeight(lineHeight) {
        // 应用行距到章节文本元素
        const chapterText = document.getElementById('chapterText');
        if (chapterText) {
            chapterText.style.lineHeight = lineHeight;
        }
        
        // 也应用到textContent容器作为后备
        if (this.textContent) {
            this.textContent.style.lineHeight = lineHeight;
        }
    }
    
    // 字体大小相关方法
    updateFontSizeFromRange() {
        this.fontSize = parseInt(this.fontSizeRange.value);
        this.applyFontSize();
        this.syncFontSizeControls();
        this.saveReadingSettings();
    }

    applyFontSize() {
        // 应用字体大小到章节文本元素
        const chapterText = document.getElementById('chapterText');
        if (chapterText) {
            chapterText.style.fontSize = `${this.fontSize}px`;
        }
        
        // 也应用到textContent容器作为后备
        if (this.textContent) {
            this.textContent.style.fontSize = `${this.fontSize}px`;
        }
    }

    syncFontSizeControls() {
        // 同步底部字体显示
        if (this.fontSizeDisplay) {
            this.fontSizeDisplay.textContent = `${this.fontSize}px`;
        }
        
        // 同步设置弹窗中的滑块
        if (this.fontSizeRange) {
            this.fontSizeRange.value = this.fontSize;
        }
        if (this.fontSizeRangeValue) {
            this.fontSizeRangeValue.textContent = `${this.fontSize}px`;
        }
    }

    selectBackgroundColor(color) {
        // 更新选中状态
        this.colorBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === color);
        });
        
        // 应用背景色
        this.applyBackgroundColor(color);
        
        // 保存设置
        this.saveReadingSettings();
    }

    applyBackgroundColor(color) {
        if (this.textContent) {
            this.textContent.style.backgroundColor = color === 'transparent' ? 'transparent' : color;
            this.textContent.style.padding = color === 'transparent' ? '0' : '1rem';
            this.textContent.style.borderRadius = color === 'transparent' ? '0' : 'var(--border-radius)';
        }
    }

    resetSettings() {
        const defaultSettings = {
            leftMargin: 32,
            rightMargin: 32,
            backgroundColor: 'transparent',
            fontSize: 16,
            lineHeight: 1.6,
            readerWidth: 800
        };
        
        // 更新UI
        this.leftMarginRange.value = defaultSettings.leftMargin;
        this.rightMarginRange.value = defaultSettings.rightMargin;
        this.leftMarginValue.textContent = defaultSettings.leftMargin + 'px';
        this.rightMarginValue.textContent = defaultSettings.rightMargin + 'px';
        
        // 更新字体大小UI
        this.fontSize = defaultSettings.fontSize;
        this.fontSizeRange.value = defaultSettings.fontSize;
        this.fontSizeRangeValue.textContent = defaultSettings.fontSize + 'px';
        
        // 更新行距UI
        this.lineHeightRange.value = defaultSettings.lineHeight;
        this.lineHeightValue.textContent = defaultSettings.lineHeight.toFixed(1);
        
        // 更新阅读区域宽度UI
        this.readerWidthRange.value = defaultSettings.readerWidth;
        this.readerWidthValue.textContent = defaultSettings.readerWidth + 'px';
        
        // 应用设置
        this.applyMargins(defaultSettings.leftMargin, defaultSettings.rightMargin);
        this.applyFontSize();
        this.applyLineHeight(defaultSettings.lineHeight);
        this.applyReaderWidth(defaultSettings.readerWidth);
        this.syncFontSizeControls();
        this.selectBackgroundColor(defaultSettings.backgroundColor);
        
        // 保存设置
        localStorage.setItem('readingSettings', JSON.stringify(defaultSettings));
    }

    getReadingSettings() {
        const defaultSettings = {
            leftMargin: 32,
            rightMargin: 32,
            backgroundColor: 'transparent',
            fontSize: 16,
            lineHeight: 1.6,
            readerWidth: 800
        };
        
        try {
            const saved = localStorage.getItem('readingSettings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (error) {
            console.error('读取阅读设置失败:', error);
            return defaultSettings;
        }
    }

    saveReadingSettings() {
        const settings = {
            leftMargin: parseInt(this.leftMarginRange.value),
            rightMargin: parseInt(this.rightMarginRange.value),
            backgroundColor: document.querySelector('.color-btn.active')?.dataset.color || 'transparent',
            fontSize: this.fontSize,
            lineHeight: parseFloat(this.lineHeightRange.value),
            readerWidth: parseInt(this.readerWidthRange.value)
        };
        
        try {
            localStorage.setItem('readingSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('保存阅读设置失败:', error);
        }
    }

    loadReadingSettings() {
        const settings = this.getReadingSettings();
        this.applyMargins(settings.leftMargin, settings.rightMargin);
        this.applyBackgroundColor(settings.backgroundColor);
        this.fontSize = settings.fontSize;
        this.applyFontSize();
        this.applyLineHeight(settings.lineHeight);
        this.applyReaderWidth(settings.readerWidth);
        this.syncFontSizeControls();
    }

    // 分类专栏展开/收起功能
    initColumnExpandCollapse() {
        const columnContainer = document.getElementById('aside-content-column');
        const expandBtn = document.querySelector('.kind_person .flexible-btn-new');
        const collapseBtn = document.querySelector('.kind_person .flexible-btn-new-close');
        
        if (!columnContainer || !expandBtn || !collapseBtn) return;
        
        const columnItems = columnContainer.querySelectorAll('li');
        const maxVisibleItems = 4; // 默认显示4个专栏
        
        // 初始化：只显示前4个专栏
        this.showLimitedColumns(columnItems, maxVisibleItems);
        
        // 展开按钮事件
        expandBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.expandAllColumns(columnItems, expandBtn, collapseBtn);
        });
        
        // 收起按钮事件
        collapseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.collapseColumns(columnItems, maxVisibleItems, expandBtn, collapseBtn);
        });
    }
    
    showLimitedColumns(items, maxVisible) {
        items.forEach((item, index) => {
            if (index >= maxVisible) {
                item.classList.add('column-item-hidden');
            } else {
                item.classList.remove('column-item-hidden');
            }
        });
    }
    
    expandAllColumns(items, expandBtn, collapseBtn) {
        items.forEach(item => {
            item.classList.remove('column-item-hidden');
        });
        expandBtn.style.display = 'none';
        collapseBtn.style.display = 'inline-flex';
    }
    
    collapseColumns(items, maxVisible, expandBtn, collapseBtn) {
        this.showLimitedColumns(items, maxVisible);
        expandBtn.style.display = 'inline-flex';
        collapseBtn.style.display = 'none';
    }

    // 处理图片加载错误
    handleImageErrors() {
        const columnImages = document.querySelectorAll('.special-column-name img, .related-column-name img');
        columnImages.forEach(img => {
            img.addEventListener('error', function() {
                // 替换为默认图标，使用Unicode符号
                this.style.display = 'none';
                const fallbackIcon = document.createElement('div');
                fallbackIcon.innerHTML = '📂';
                fallbackIcon.style.cssText = `
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--bg-secondary);
                    border-radius: 4px;
                    font-size: 18px;
                    flex-shrink: 0;
                `;
                this.parentNode.insertBefore(fallbackIcon, this);
            });
        });
    }

    // ==============================
    // 搜索功能相关方法
    // ==============================

    // 执行搜索
    performSearch() {
        const query = this.searchInput?.value?.trim();
        if (!query) {
            this.showSearchMessage('请输入搜索关键词');
            return;
        }

        if (!this.currentBook || !this.chapters.length) {
            this.showSearchMessage('请先加载小说文件');
            return;
        }

        console.log('执行搜索:', query);
        this.searchInContent(query);
    }

    // AI搜索（暂时使用普通搜索）
    performAISearch() {
        const query = this.searchInput?.value?.trim();
        if (!query) {
            this.showSearchMessage('请输入搜索关键词');
            return;
        }

        if (!this.currentBook || !this.chapters.length) {
            this.showSearchMessage('请先加载小说文件');
            return;
        }

        console.log('执行AI搜索:', query);
        // 暂时使用普通搜索，后续可以扩展为更智能的搜索
        this.searchInContent(query, true);
    }

    // 在内容中搜索
    searchInContent(query, isAISearch = false) {
        const results = [];
        const searchQuery = query.toLowerCase();

        // 搜索所有章节
        this.chapters.forEach((chapter, chapterIndex) => {
            if (!chapter.content) return;

            const lines = chapter.content.split('\n');
            
            // 查找包含关键词的行
            lines.forEach((line, lineIndex) => {
                if (line.toLowerCase().includes(searchQuery)) {
                    results.push({
                        chapterIndex,
                        chapterTitle: chapter.title,
                        lineIndex,
                        line: line.trim(),
                        preview: this.getSearchPreview(line, query)
                    });
                }
            });
        });

        if (results.length > 0) {
            this.showSearchResults(results, query, isAISearch);
        } else {
            this.showSearchMessage(`未找到包含"${query}"的内容`);
        }
    }

    // 获取搜索预览
    getSearchPreview(line, query) {
        const maxLength = 100;
        const queryIndex = line.toLowerCase().indexOf(query.toLowerCase());
        
        if (queryIndex === -1) return line.substring(0, maxLength);
        
        const start = Math.max(0, queryIndex - 30);
        const end = Math.min(line.length, queryIndex + query.length + 30);
        
        let preview = line.substring(start, end);
        if (start > 0) preview = '...' + preview;
        if (end < line.length) preview = preview + '...';
        
        return preview;
    }

    // 显示搜索结果
    showSearchResults(results, query, isAISearch = false) {
        const searchType = isAISearch ? 'AI搜索' : '搜索';
        console.log(`${searchType}完成，找到 ${results.length} 个结果`);
        
        // 暂时在控制台显示结果，后续可以添加搜索结果面板
        console.log('搜索结果:', results);
        
        // 跳转到第一个搜索结果
        if (results.length > 0) {
            const firstResult = results[0];
            this.loadChapter(firstResult.chapterIndex);
            
            // 延迟高亮显示搜索关键词
            setTimeout(() => {
                this.highlightSearchTerm(query);
            }, 500);
        }
        
        this.showSearchMessage(`找到 ${results.length} 个结果，已跳转到第一个`);
    }

    // 高亮搜索关键词
    highlightSearchTerm(query) {
        const chapterText = document.getElementById('chapterText');
        if (!chapterText) return;

        // 移除之前的高亮
        this.removeSearchHighlight();

        const content = chapterText.innerHTML;
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        const highlightedContent = content.replace(regex, '<mark class="search-highlight">$1</mark>');
        
        chapterText.innerHTML = highlightedContent;

        // 滚动到第一个高亮位置
        const firstHighlight = chapterText.querySelector('.search-highlight');
        if (firstHighlight) {
            firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // 移除搜索高亮
    removeSearchHighlight() {
        const highlights = document.querySelectorAll('.search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        });
    }

    // 转义正则表达式特殊字符
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 处理搜索输入
    handleSearchInput(e) {
        // 可以在这里添加实时搜索建议等功能
        const query = e.target.value.trim();
        if (query.length === 0) {
            this.removeSearchHighlight();
        }
    }

    // 显示搜索消息
    showSearchMessage(message) {
        // 简单的消息显示，可以后续优化为更好的UI
        console.log('搜索消息:', message);
        
        // 暂时使用alert，后续可以改为更优雅的提示
        if (message.includes('未找到') || message.includes('请')) {
            alert(message);
        }
    }


}

document.addEventListener('DOMContentLoaded', () => {
    const reader = new NovelReader();
    
    // 将reader实例暴露给全局变量，供测试页面使用
    window.reader = reader;
    
    window.addEventListener('beforeunload', () => {
        if (reader.currentBook) {
            reader.saveReadingProgress();
            reader.saveCurrentBook();
        }
    });
    
    reader.loadLastBook();
});

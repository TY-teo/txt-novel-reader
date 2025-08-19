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
        
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.addVisibilityChangeHandler();
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
        this.resetSettingsBtn = document.getElementById('resetSettings');
        this.colorBtns = document.querySelectorAll('.color-btn');
        this.readerContent = document.querySelector('.reader-content');
        this.readingArea = document.querySelector('.reading-area');
        
        
    }

    bindEvents() {
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // 文件选择按钮事件监听器
        const fileSelectBtn = document.querySelector('.btn-primary');
        if (fileSelectBtn && fileSelectBtn.textContent.trim() === '选择文件') {
            console.log("发现文件选择按钮，添加事件监听器");
            fileSelectBtn.addEventListener("click", (e) => {
                console.log("文件选择按钮被点击");
                if (this.fileInput) {
                    this.fileInput.click();
                } else {
                    console.error("文件输入框不存在");
                }
            });
        }
        this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        this.closeSidebarBtn.addEventListener('click', () => this.closeSidebar());
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
        this.leftMarginRange.addEventListener('input', (e) => this.updateMargins());
        this.rightMarginRange.addEventListener('input', (e) => this.updateMargins());
        this.fontSizeRange.addEventListener('input', (e) => this.updateFontSizeFromRange());
        this.resetSettingsBtn.addEventListener('click', () => this.resetSettings());
        
        // 背景色选择事件
        this.colorBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectBackgroundColor(btn.dataset.color));
        });
        
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
        
        try {
            const content = await this.readFile(file);
            this.processBook(content, file.name);
        } catch (error) {
            console.error('文件读取失败:', error);
            alert('文件读取失败，请检查文件格式');
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file, 'UTF-8');
        });
    }

    processBook(content, filename) {
        this.currentBook = {
            title: filename.replace('.txt', ''),
            content: content
        };
        
        this.chapters = this.parseChapters(content);
        this.updateChapterList();
        this.showReading();
        
        // 检查是否有保存的阅读进度
        const hasProgress = this.tryLoadReadingProgress();
        
        // 如果没有进度或加载失败，从第一章开始
        if (!hasProgress) {
            this.loadChapter(0);
        } else {
            console.log('✅ 阅读进度恢复成功！');
        }
        
        this.saveCurrentBook();
    }

    parseChapters(content) {
        const lines = content.split('\n');
        const chapters = [];
        let currentChapter = null;
        let chapterContent = [];

        // 增强的章节识别模式，专门优化网络小说格式
        const chapterPatterns = [
            // "第一卷 第1章" 格式 - 针对史上最强师父
            /^第[一二三四五六七八九十零〇百千万\d]+卷\s+第\d+章.*$/,
            // "第X卷 第Y章" 变体
            /^第[一二三四五六七八九十零〇百千万\d]+卷.*第\d+章.*$/,
            // 传统章节格式
            /^第[一二三四五六七八九十零〇百千万\d]+章.*$/,
            /^第\d+章.*$/,
            // 其他常见格式
            /^第[一二三四五六七八九十零〇百千万\d]+[回|篇|节].*$/,
            /^Chapter\s*\d+.*$/i,
            /^[一二三四五六七八九十零〇百千万\d]+\s*[\.、].*$/,
            /^\d+[\.\s].*$/,
            // 包含中文字符的章节标题
            /^[\u4e00-\u9fa5]*第\d+章.*$/
        ];

        // 预处理：过滤掉明显的非章节行
        const skipPatterns = [
            /^-+$/,           // 分隔线
            /^\s*$/,          // 空行
            /^[　\s]*$/       // 全角空格行
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

    loadChapter(index) {
        if (index < 0 || index >= this.chapters.length) return;
        
        this.currentChapterIndex = index;
        const chapter = this.chapters[index];
        
        if (this.currentChapterTitle) this.currentChapterTitle.textContent = chapter.title;
        
        // 只显示章节内容
        this.textContent.innerHTML = `
            <div class="chapter-text" id="chapterText">
                ${chapter.content.replace(/\n/g, '<br>')}
            </div>
        `;
        
        if (this.chapterProgress) this.chapterProgress.textContent = `${index + 1} / ${this.chapters.length}`;
        
        const progressPercentage = ((index + 1) / this.chapters.length) * 100;
        this.progressFill.style.width = `${progressPercentage}%`;
        
        if (this.prevChapterBtn) this.prevChapterBtn.disabled = index === 0;
        if (this.nextChapterBtn) this.nextChapterBtn.disabled = index === this.chapters.length - 1;
        
        document.querySelectorAll('.chapter-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        // 自动滚动目录到当前章节
        this.scrollSidebarToActiveChapter(index);
        
        this.saveReadingProgress();
        this.textContent.scrollTop = 0;
        
        // 添加滚动事件监听，保存滚动位置
        this.addScrollProgressSaver();
        
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
        // 延迟执行，确保DOM已更新
        setTimeout(() => {
            const activeChapterItem = document.querySelector('.chapter-item.active');
            if (activeChapterItem) {
                console.log(`目录滚动到第${chapterIndex + 1}章`);
                
                // 使用smooth滚动，并且尽量居中显示
                activeChapterItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',    // 垂直居中
                    inline: 'nearest'   // 水平方向就近
                });
                
                // 添加临时高亮效果，让用户更容易注意到当前章节
                activeChapterItem.style.transition = 'background-color 0.5s ease';
                const originalBg = activeChapterItem.style.backgroundColor;
                
                // 短暂闪烁效果
                setTimeout(() => {
                    activeChapterItem.style.backgroundColor = 'var(--accent-hover)';
                    setTimeout(() => {
                        activeChapterItem.style.backgroundColor = originalBg;
                    }, 300);
                }, 100);
            } else {
                // 如果找不到激活的章节，尝试通过索引查找
                const chapterItems = document.querySelectorAll('.chapter-item');
                if (chapterItems[chapterIndex]) {
                    console.log(`通过索引滚动到第${chapterIndex + 1}章`);
                    chapterItems[chapterIndex].scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }
            }
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
            localStorage.setItem('currentBook', JSON.stringify({
                title: this.currentBook.title,
                content: this.currentBook.content,
                chapters: this.chapters.length,
                timestamp: Date.now()
            }));
        }
    }

    saveReadingProgress() {
        if (this.currentBook && this.textContent) {
            try {
                const progressData = {
                    bookTitle: this.currentBook.title,
                    chapterIndex: this.currentChapterIndex,
                    scrollPosition: this.textContent.scrollTop,
                    chapterTitle: this.chapters[this.currentChapterIndex]?.title || '',
                    totalChapters: this.chapters.length,
                    timestamp: Date.now()
                };
                
                localStorage.setItem('readingProgress', JSON.stringify(progressData));
                console.log(`阅读进度已保存: 第${this.currentChapterIndex + 1}章, 滚动位置: ${progressData.scrollPosition}`);
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
                
                if (data.bookTitle === this.currentBook.title && 
                    data.chapterIndex !== undefined && 
                    data.chapterIndex < this.chapters.length) {
                    
                    console.log(`恢复阅读进度: 第${data.chapterIndex + 1}章, 滚动位置: ${data.scrollPosition}`);
                    this.loadChapter(data.chapterIndex);
                    
                    // 恢复滚动位置
                    setTimeout(() => {
                        if (this.textContent && data.scrollPosition !== undefined) {
                            this.textContent.scrollTop = data.scrollPosition;
                            console.log('滚动位置已恢复:', data.scrollPosition);
                        }
                    }, 200);
                    
                    return true; // 成功加载进度
                }
            }
        } catch (error) {
            console.error('读取阅读进度失败:', error);
        }
        
        console.log('没有可用的阅读进度，从第一章开始');
        return false; // 没有进度或加载失败
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
    }

    loadLastBook() {
        try {
            const bookData = localStorage.getItem('currentBook');
            if (bookData) {
                const data = JSON.parse(bookData);
                this.processBook(data.content, data.title + '.txt');
                this.loadReadingProgress();
            }
        } catch (error) {
            console.error('读取上次打开的书籍失败:', error);
        }
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

    // 字体大小相关方法
    updateFontSizeFromRange() {
        this.fontSize = parseInt(this.fontSizeRange.value);
        this.applyFontSize();
        this.syncFontSizeControls();
        this.saveReadingSettings();
    }

    applyFontSize() {
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
            fontSize: 16
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
        
        // 应用设置
        this.applyMargins(defaultSettings.leftMargin, defaultSettings.rightMargin);
        this.applyFontSize();
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
            fontSize: 16
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
            fontSize: this.fontSize
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

            const content = chapter.content.toLowerCase();
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
    
    
    window.addEventListener('beforeunload', () => {
        if (reader.currentBook) {
            reader.saveReadingProgress();
            reader.saveCurrentBook();
        }
    });
    
    reader.loadLastBook();
});

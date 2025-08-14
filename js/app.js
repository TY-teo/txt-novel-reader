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
    }

    bindEvents() {
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        this.closeSidebarBtn.addEventListener('click', () => this.closeSidebar());
        this.toggleThemeBtn.addEventListener('click', () => this.toggleTheme());
        this.prevChapterBtn.addEventListener('click', () => this.previousChapter());
        this.nextChapterBtn.addEventListener('click', () => this.nextChapter());
        this.decreaseFontBtn.addEventListener('click', () => this.changeFontSize(-2));
        this.increaseFontBtn.addEventListener('click', () => this.changeFontSize(2));
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
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
        
        this.currentChapterTitle.textContent = chapter.title;
        this.textContent.textContent = chapter.content;
        this.chapterProgress.textContent = `${index + 1} / ${this.chapters.length}`;
        
        const progressPercentage = ((index + 1) / this.chapters.length) * 100;
        this.progressFill.style.width = `${progressPercentage}%`;
        
        this.prevChapterBtn.disabled = index === 0;
        this.nextChapterBtn.disabled = index === this.chapters.length - 1;
        
        document.querySelectorAll('.chapter-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        // 自动滚动目录到当前章节
        this.scrollSidebarToActiveChapter(index);
        
        this.saveReadingProgress();
        this.textContent.scrollTop = 0;
        
        // 添加滚动事件监听，实时保存滚动位置
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
        
        // 添加新的滚动事件监听器
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
        this.textContent.style.fontSize = `${this.fontSize}px`;
        this.fontSizeDisplay.textContent = `${this.fontSize}px`;
        this.saveSettings();
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
            const settings = localStorage.getItem('readerSettings');
            if (settings) {
                const data = JSON.parse(settings);
                
                this.fontSize = data.fontSize || 16;
                this.textContent.style.fontSize = `${this.fontSize}px`;
                this.fontSizeDisplay.textContent = `${this.fontSize}px`;
                
                this.isDarkTheme = data.isDarkTheme || false;
                document.body.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
                this.toggleThemeBtn.textContent = this.isDarkTheme ? '☀️ 日间' : '🌙 夜间';
            }
        } catch (error) {
            console.error('读取设置失败:', error);
        }
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

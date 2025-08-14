const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

describe('TXT小说阅读器测试', () => {
    let browser;
    let page;
    const testFilePath = path.join(__dirname, 'test-novel.txt');

    beforeAll(async () => {
        // 创建测试用的txt文件
        const testContent = '第一章 开始\n这是第一章的内容。\n\n第二章 发展\n这是第二章的内容。\n\n第三章 高潮\n这是第三章的内容。';
        fs.writeFileSync(testFilePath, testContent, 'utf8');

        browser = await puppeteer.launch({ headless: false, slowMo: 100 });
        page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        await page.goto('file://' + path.join(__dirname, '../index.html'));
    });

    afterAll(async () => {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
        await browser.close();
    });

    test('页面应该正确加载', async () => {
        const title = await page.title();
        expect(title).toBe('TXT小说阅读器');
        
        const welcomeText = await page.$eval('.welcome-screen h2', el => el.textContent);
        expect(welcomeText).toBe('欢迎使用TXT小说阅读器');
    });

    test('应该能够切换主题', async () => {
        await page.click('#toggleTheme');
        const theme = await page.evaluate(() => document.body.getAttribute('data-theme'));
        expect(theme).toBe('dark');
        
        await page.click('#toggleTheme');
        const themeAfter = await page.evaluate(() => document.body.getAttribute('data-theme'));
        expect(themeAfter).toBe('light');
    });

    test('应该能够上传并解析txt文件', async () => {
        const fileInput = await page.$('#fileInput');
        await fileInput.uploadFile(testFilePath);
        
        await page.waitForSelector('.reading-area', { visible: true });
        const readingAreaVisible = await page.$eval('.reading-area', el => 
            window.getComputedStyle(el).display !== 'none'
        );
        expect(readingAreaVisible).toBe(true);
    });

    test('应该显示正确的章节列表', async () => {
        const chapterItems = await page.$$('.chapter-item');
        expect(chapterItems.length).toBeGreaterThan(0);
        
        const firstChapterText = await page.$eval('.chapter-item', el => el.textContent);
        expect(firstChapterText).toContain('第一章');
    });

    test('应该能够切换章节', async () => {
        const chapterItems = await page.$$('.chapter-item');
        if (chapterItems.length > 1) {
            await chapterItems[1].click();
            const currentChapterTitle = await page.$eval('#currentChapterTitle', el => el.textContent);
            expect(currentChapterTitle).toContain('第二章');
        }
    });

    test('应该能够调整字体大小', async () => {
        const initialFontSize = await page.$eval('#textContent', el => 
            window.getComputedStyle(el).fontSize
        );
        
        await page.click('#increaseFont');
        const increasedFontSize = await page.$eval('#textContent', el => 
            window.getComputedStyle(el).fontSize
        );
        
        expect(parseInt(increasedFontSize)).toBeGreaterThan(parseInt(initialFontSize));
    });

    test('响应式设计：移动端侧边栏', async () => {
        await page.setViewport({ width: 500, height: 800 });
        
        const sidebarInitial = await page.$eval('#sidebar', el => 
            window.getComputedStyle(el).left
        );
        expect(sidebarInitial).toBe('-300px');
        
        await page.click('#toggleSidebar');
        const sidebarOpen = await page.$eval('#sidebar', el => 
            el.classList.contains('open')
        );
        expect(sidebarOpen).toBe(true);
    });

    test('键盘快捷键应该工作', async () => {
        await page.setViewport({ width: 1200, height: 800 });
        
        // 获取当前章节标题
        const initialChapter = await page.$eval('#currentChapterTitle', el => el.textContent);
        
        // 使用Ctrl+右箭头切换到下一章
        await page.keyboard.down('Control');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.up('Control');
        
        // 等待章节切换
        await page.waitForTimeout(500);
        const newChapter = await page.$eval('#currentChapterTitle', el => el.textContent);
        expect(newChapter).not.toBe(initialChapter);
    });

    test('本地存储功能', async () => {
        const settings = await page.evaluate(() => {
            return localStorage.getItem('readerSettings');
        });
        expect(settings).not.toBeNull();
    });

    test('性能测试：文件处理速度', async () => {
        const startTime = Date.now();
        
        // 创建大文件进行测试
        const largeContent = '第一章 测试\n' + '测试内容。'.repeat(1000) + '\n\n第二章 测试\n' + '测试内容。'.repeat(1000);
        const largeFilePath = path.join(__dirname, 'large-test.txt');
        fs.writeFileSync(largeFilePath, largeContent, 'utf8');
        
        const fileInput = await page.$('#fileInput');
        await fileInput.uploadFile(largeFilePath);
        
        await page.waitForSelector('.reading-area', { visible: true });
        const endTime = Date.now();
        
        expect(endTime - startTime).toBeLessThan(5000); // 应在5秒内完成
        
        // 清理
        if (fs.existsSync(largeFilePath)) {
            fs.unlinkSync(largeFilePath);
        }
    });
});

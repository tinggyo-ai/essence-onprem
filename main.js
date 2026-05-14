const path = require('path');
const fs   = require('fs');

// ── ELECTRON_RUN_AS_NODE 감지 시 올바른 환경으로 재실행 ──
const electronOrPath = require('electron');
if (typeof electronOrPath === 'string') {
    const { spawn } = require('child_process');
    const env = Object.assign({}, process.env);
    delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(electronOrPath, [__dirname], {
        env,
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
    });
    child.unref();
    process.exit(0);
}

const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, shell } = electronOrPath;

// ── Ollama 로컬 엔드포인트 ──
const OLLAMA_URL   = 'http://localhost:11434/v1/chat/completions';
const OLLAMA_PING  = 'http://localhost:11434/api/tags';
const DEFAULT_MODEL = 'gemma3:4b';    // 저사양 기본값
const MEDIUM_MODEL  = 'gemma4:e2b';   // 빠른 버전
const QUALITY_MODEL = 'gemma4:e4b';   // 고품질 버전

const SYSTEM_PROMPT = `당신은 Essence On(AI Responsive Intelligence Assistant) 온프레미스 버전입니다.
IT 기업에서 일하는 직원들의 전반적인 업무를 도와주는 친근한 AI 동료입니다.
인터넷 없이 로컬에서 동작하며, 보안이 중요한 업무에 사용할 수 있습니다.

[말투 & 태도]
- 항상 존댓말을 사용하고, 예의 바르고 친절하게 대화합니다.
- 딱딱하지 않고 따뜻하고 친근한 친구 같은 느낌으로 말합니다.
- 상황에 맞는 센스 있는 표현을 자연스럽게 씁니다.

[답변 원칙]
- 반드시 사실(팩트) 기반으로 답변하며, 불확실한 내용은 "확실하지 않지만"이라고 먼저 밝힙니다.
- 모르는 것은 모른다고 솔직하게 말합니다.
- 답변은 간결하고 핵심을 먼저 전달합니다.

[전문 분야]
- IT/개발, 기획, 마케팅, 인사, 총무, 회계 등 IT 기업의 전반적인 업무를 지원합니다.
- 문서 작성, 이메일 초안, 보고서, 회의록, 일정 관리, 아이디어 정리 등을 도와줍니다.
- 코드 리뷰, 기술 문서, 개발 관련 질문에도 답변합니다.

한국어로 대화합니다.`;

let win;
let tray;

const MARGIN    = 16;
const EXPANDED  = { w: 380, h: 560 };
const COLLAPSED = { w: 92, h: 120 };

app.setPath('userData', path.join(__dirname, 'userdata'));

function getPos(w, h) {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    return { x: width - w - MARGIN, y: height - h - MARGIN };
}

function settingsPath() {
    return path.join(app.getPath('userData'), 'aria-onprem-settings.json');
}
function loadSettings() {
    try { return JSON.parse(fs.readFileSync(settingsPath(), 'utf8')); }
    catch { return {}; }
}
function saveSettings(data) {
    const dir = app.getPath('userData');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(settingsPath(), JSON.stringify(data, null, 2));
}

function windowStatePath() {
    return path.join(app.getPath('userData'), 'window-state.json');
}
function loadWindowState() {
    try { return JSON.parse(fs.readFileSync(windowStatePath(), 'utf8')); }
    catch { return { w: EXPANDED.w, h: EXPANDED.h }; }
}
function saveWindowState(w, h) {
    const dir = app.getPath('userData');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(windowStatePath(), JSON.stringify({ w, h }));
}

function showWindow() {
    if (!win) return;
    win.show();
    win.focus();
}

function setupTray() {
    const iconPath = path.join(__dirname, 'icon.png');
    const icon = fs.existsSync(iconPath)
        ? nativeImage.createFromPath(iconPath)
        : nativeImage.createEmpty();

    tray = new Tray(icon);
    tray.setToolTip('');
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: 'Essence On 열기', click: () => showWindow() },
        { type: 'separator' },
        { label: '종료', click: () => app.quit() },
    ]));
    tray.on('click', () => showWindow());
}

app.whenReady().then(() => {
    const p = getPos(COLLAPSED.w, COLLAPSED.h);

    win = new BrowserWindow({
        width : COLLAPSED.w,
        height: COLLAPSED.h,
        x: p.x,
        y: p.y,
        frame          : false,
        transparent    : true,
        backgroundColor: '#00000000',
        hasShadow      : false,
        alwaysOnTop    : false,
        skipTaskbar    : true,
        resizable      : false,
        show           : false,
        webPreferences : {
            preload              : path.join(__dirname, 'preload.js'),
            contextIsolation     : true,
            backgroundThrottling : false,
        },
    });

    win.setAlwaysOnTop(true, 'floating');
    win.setIgnoreMouseEvents(true, { forward: true });

    win.setTitle('');
    win.loadFile('index.html');
    win.once('ready-to-show', () => win.show());
    win.on('page-title-updated', (e) => { e.preventDefault(); win.setTitle(''); });

    setupTray();
});

ipcMain.on('expand', () => {
    win.setIgnoreMouseEvents(false);
    const b = win.getBounds();
    const ws = loadWindowState();
    win.setResizable(true);
    win.setMinimumSize(320, 400);
    win.setBounds({ x: b.x + b.width - ws.w, y: b.y + b.height - ws.h,
                    width: ws.w, height: ws.h });
});

ipcMain.on('collapse', () => {
    const b = win.getBounds();
    saveWindowState(b.width, b.height);
    win.setResizable(false);
    win.setMinimumSize(COLLAPSED.w, COLLAPSED.h);
    win.setBounds({ x: b.x + b.width - COLLAPSED.w, y: b.y + b.height - COLLAPSED.h,
                    width: COLLAPSED.w, height: COLLAPSED.h });
    win.setIgnoreMouseEvents(true, { forward: true });
});

ipcMain.on('mouse-enter-robot', () => win.setIgnoreMouseEvents(false));
ipcMain.on('mouse-leave-robot', () => {
    if (!isDragging) win.setIgnoreMouseEvents(true, { forward: true });
});

let dragOffset = null;
let isDragging = false;
ipcMain.on('drag-start', (_, { sx, sy }) => {
    isDragging = true;
    const [wx, wy] = win.getPosition();
    dragOffset = { dx: sx - wx, dy: sy - wy };
});
ipcMain.on('drag-move', (_, { sx, sy }) => {
    if (!dragOffset) return;
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const b = win.getBounds();
    const x = Math.max(0, Math.min(Math.round(sx - dragOffset.dx), width  - b.width));
    const y = Math.max(0, Math.min(Math.round(sy - dragOffset.dy), height - b.height));
    win.setPosition(x, y);
});
ipcMain.on('drag-end', () => {
    isDragging = false;
    dragOffset = null;
    win.webContents.invalidate();
});
ipcMain.on('invalidate-window', () => {
    setTimeout(() => win.webContents.invalidate(), 30);
});

ipcMain.handle('get-settings',  ()        => loadSettings());
ipcMain.handle('save-settings', (_, data) => { saveSettings(data); return true; });

// Ollama 연결 확인
ipcMain.handle('check-ollama', async () => {
    try {
        const res = await fetch(OLLAMA_PING, { signal: AbortSignal.timeout(3000) });
        return res.ok;
    } catch {
        return false;
    }
});

// Ollama 스트리밍 채팅
ipcMain.on('chat-stream', async (_, { messages, model }) => {
    try {
        const finalModel = model || DEFAULT_MODEL;

        const res = await fetch(OLLAMA_URL, {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model   : finalModel,
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
                stream  : true,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            win.webContents.send('chat-error', `Ollama 오류 (${res.status}): ${err}`);
            return;
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6).trim();
                if (data === '[DONE]') { win.webContents.send('chat-done'); continue; }
                try {
                    const json = JSON.parse(data);
                    const chunk = json.choices?.[0]?.delta?.content;
                    if (chunk) win.webContents.send('chat-chunk', chunk);
                } catch {}
            }
        }
        win.webContents.send('chat-done');
    } catch (err) {
        win.webContents.send('chat-error', err.message);
    }
});

ipcMain.on('open-external', (_, url) => shell.openExternal(url));

// ── History (대화 요약 저장/불러오기) ──────────────────────────────
const historiesDir = () => path.join(app.getPath('userData'), 'histories');

ipcMain.handle('list-histories', () => {
    const dir = historiesDir();
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter(f => f.endsWith('.md'))
        .sort()
        .map(f => f.replace(/\.md$/, ''));
});

ipcMain.handle('save-history', (_, { title, content }) => {
    const dir = historiesDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const safe = title.replace(/[\\/:*?"<>|]/g, '_');
    fs.writeFileSync(path.join(dir, safe + '.md'), content, 'utf8');
    return true;
});

ipcMain.handle('load-history', (_, title) => {
    const safe = title.replace(/[\\/:*?"<>|]/g, '_');
    const p = path.join(historiesDir(), safe + '.md');
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
});

ipcMain.handle('delete-history', (_, title) => {
    const safe = title.replace(/[\\/:*?"<>|]/g, '_');
    const p = path.join(historiesDir(), safe + '.md');
    if (fs.existsSync(p)) fs.unlinkSync(p);
    return true;
});

ipcMain.handle('summarize-chat', async (_, { messages, model }) => {
    const res = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model || DEFAULT_MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages,
                { role: 'user', content: '지금까지의 대화를 인수인계 문서 형식으로 요약해주세요. 다음 세션에서 AI가 맥락을 빠르게 파악할 수 있도록 핵심 주제, 중요한 결정사항, 진행 중인 작업, 이어서 논의할 내용을 마크다운 형식으로 간결하게 정리해주세요.' },
            ],
            stream: false,
        }),
    });
    if (!res.ok) throw new Error(`Ollama 오류 (${res.status}): ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
});

ipcMain.on('uninstall', () => {
    const installDir = __dirname;
    const normalized = installDir.replace(/\//g, '\\').toLowerCase();
    if (normalized !== 'c:\\essenceon') {
        win.webContents.send('chat-error',
            '⚠️ 언인스톨은 C:\\EssenceOn 에 정식 설치된 경우에만 사용 가능합니다.\n현재 경로: ' + installDir);
        return;
    }
    const tempScript = require('os').tmpdir() + '\\essenceon_remove.bat';
    const script = [
        '@echo off',
        'timeout /t 8 /nobreak > nul',
        `rmdir /S /Q "${installDir}" 2>nul`,
        `if exist "%USERPROFILE%\\Desktop\\Essence On.lnk" del "%USERPROFILE%\\Desktop\\Essence On.lnk"`,
        `if exist "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\EssenceOn" rmdir /S /Q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\EssenceOn"`,
        'del "%~f0"',
    ].join('\r\n');
    fs.writeFileSync(tempScript, script, 'utf8');
    const { spawn } = require('child_process');
    spawn('cmd', ['/c', tempScript], { detached: true, stdio: 'ignore' }).unref();
    app.quit();
});

ipcMain.on('quit', () => app.quit());

app.on('window-all-closed', () => {});

process.on('uncaughtException', (err) => {
    console.error('[Essence On 오류]', err.message);
});

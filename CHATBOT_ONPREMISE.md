# ARIA 온프레미스 챗봇 인수인계 문서

> 작성일: 2026-05-13  
> 대상 경로: `c:\chatbot-onprem\`  
> 배포 패키지: `C:\ARIA_ONPREM_USB_PACKAGE\`

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 프로젝트명 | ARIA 온프레미스 (On-Premises) |
| 버전 | 1.0.0 |
| 프레임워크 | Electron 35.x |
| AI 백엔드 | Ollama (로컬 LLM 서버) |
| 기본 모델 | Gemma 4 e2b / e4b |
| 개발 경로 | `c:\chatbot-onprem\` |
| 설치 경로 | `C:\ARIA_ONPREM\` |
| USB 패키지 | `C:\ARIA_ONPREM_USB_PACKAGE\` |

ARIA 온프레미스는 인터넷 없이 로컬 PC에서 완전히 동작하는 Electron 기반 AI 챗봇 위젯이다.  
화면 우측 하단에 항상 떠 있는 반투명 부유창(Always-on-top) 형태로 동작한다.

---

## 2. 챗봇의 목적

IT 기업 직원들의 일상 업무를 지원하는 **로컬 AI 어시스턴트**다.

- 문서 작성, 이메일 초안, 보고서, 회의록 작성
- 코드 리뷰, 기술 문서, 개발 관련 질의응답
- 일정 정리, 아이디어 구조화
- 기밀 자료를 외부 서버에 전송하지 않아도 되는 **보안 민감 업무** 지원

오프라인 환경에서도 동작하므로, 인터넷 차단 망분리 환경이나 보안 규정이 엄격한 조직에서 특히 유용하다.

---

## 3. 현재 동작 방식

### 기본 흐름

```
사용자 입력
  → index.html (렌더러)
  → preload.js (IPC 브릿지)
  → main.js (메인 프로세스)
  → Ollama API (http://localhost:11434)
  → Gemma 4 모델 추론
  → 토큰 단위 스트리밍 응답
  → index.html 실시간 렌더링
```

### 창 동작 방식

- **축소 상태 (108×120px):** 로봇/캐릭터 아이콘만 표시. 마우스로 드래그 이동 가능
- **확장 상태 (380×560px):** 전체 채팅 UI 표시. 아이콘 클릭 시 전환
- 항상 최상단(always-on-top) `'floating'` 레벨로 유지
- 작업표시줄에 표시되지 않음(`skipTaskbar: true`)
- 시스템 트레이 아이콘으로 숨기기/다시 열기 가능

### 모델 전환

채팅창 헤더의 토글 버튼으로 실시간 전환 가능.

| 버튼 | 모델 | 특징 |
|---|---|---|
| `e2b ⚡` | gemma4:e2b | 빠름, 7.2 GB, 8 GB RAM 이상 권장 |
| `e4b 🧠` | gemma4:e4b | 고품질, 9.8 GB, 16 GB RAM 이상 필요 |

---

## 4. 온프레미스/오프라인 모드 가능 여부

**완전 오프라인 운영 가능.** 인터넷 연결이 전혀 필요하지 않다.

- AI 추론: Ollama가 로컬에서 처리 (외부 전송 없음)
- 대화 이력: 로컬 JSON 파일 저장
- 설정: 로컬 JSON 파일 저장
- 업데이트: USB 패키지로 수동 배포

> 단, Ollama 및 모델 파일의 **최초 설치**는 USB 패키지를 통해 오프라인으로 수행한다.

---

## 5. 외부 API 사용 여부

| 서비스 | 사용 여부 | 비고 |
|---|---|---|
| 외부 LLM API (OpenAI, Anthropic 등) | **미사용** | Ollama 로컬 서버만 사용 |
| 외부 인증 서버 | **미사용** | — |
| 클라우드 스토리지 | **미사용** | — |
| 외부 분석/로깅 서버 | **미사용** | — |
| Ollama (로컬) | 사용 | `http://localhost:11434` |

모든 통신은 `localhost` 내부에서만 이루어진다.

---

## 6. 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 PC (로컬)                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Electron 앱 (ARIA)                   │   │
│  │                                                   │   │
│  │  ┌─────────────┐     IPC      ┌───────────────┐  │   │
│  │  │ index.html  │ ──────────── │   main.js     │  │   │
│  │  │ (렌더러 UI) │   preload.js  │ (메인 프로세스)│  │   │
│  │  └─────────────┘  (IPC 브릿지) └───────┬───────┘  │   │
│  │                                        │ HTTP     │   │
│  └────────────────────────────────────────│──────────┘   │
│                                           ↓              │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Ollama 로컬 서버 (:11434)               │   │
│  │   /v1/chat/completions  |  /api/tags             │   │
│  └──────────────────┬───────────────────────────────┘   │
│                     ↓                                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │        Gemma 4 모델 (e2b / e4b)                  │   │
│  │        C:\Users\[사용자]\.ollama\models           │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────┐                                    │
│  │  userdata/      │  ← 설정 및 대화이력 (로컬 저장)      │
│  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 7. 폴더 구조 설명

### 개발 소스 (`c:\chatbot-onprem\`)

```
c:\chatbot-onprem\
├── main.js          ← Electron 메인 프로세스 (창 관리, IPC, Ollama 통신)
├── preload.js       ← IPC 브릿지 (renderer ↔ main 안전한 통신)
├── index.html       ← UI 전체 (CSS + JavaScript 인라인 포함)
├── icon.png         ← 시스템 트레이 아이콘
├── icon.ico         ← 바탕화면 바로가기 아이콘
├── package.json     ← 프로젝트 정의 (Electron 의존성)
├── CHATBOT_ONPREMISE.md  ← 이 문서
├── node_modules\    ← Electron 런타임 (약 295 MB)
└── userdata\        ← 런타임 데이터 (앱 실행 중 생성됨)
    └── aria-onprem-settings.json
```

### USB 배포 패키지 (`C:\ARIA_ONPREM_USB_PACKAGE\`)

```
C:\ARIA_ONPREM_USB_PACKAGE\           (총 약 24 GB)
├── ARIA_온프_설치안내.txt              ← 사용자 배포용 안내서
├── ARIA_온프_설치하기.hta              ← GUI 설치 프로그램 (더블클릭)
├── install.bat                        ← 텍스트 방식 설치
├── ollama\                            ← Ollama 실행파일 + CUDA DLL (약 6.7 GB)
├── models\                            ← Gemma 4 모델 파일 (약 16.8 GB)
│   ├── blobs\                         ← 모델 가중치 데이터
│   └── manifests\                     ← 모델 메타데이터
│       └── registry.ollama.ai\library\gemma4\
│           ├── e2b                    ← 빠른 버전 (7.2 GB)
│           └── e4b                    ← 고품질 버전 (9.6 GB)
└── source\                            ← ARIA 앱 소스 (약 295 MB)
    ├── main.js
    ├── preload.js
    ├── index.html
    ├── icon.png / icon.ico
    ├── package.json
    └── node_modules\
```

> **중요:** `c:\chatbot-onprem\`(개발)과 `C:\ARIA_ONPREM_USB_PACKAGE\source\`(배포 백업)은 **별개**다.  
> 파일 수정 후 반드시 USB 패키지에도 동기화해야 한다 (아래 16번 참고).

---

## 8. 주요 파일 역할

### `main.js` — Electron 메인 프로세스

Electron 앱의 핵심. OS와 직접 상호작용하는 Node.js 환경에서 실행된다.

**주요 책임:**

| 기능 | 설명 |
|---|---|
| 창 생성 및 관리 | 축소/확장 전환, 위치 계산, 항상 최상단 설정 |
| `win.setShape()` | OS 레벨 창 모양 지정 (축소 시 흰 배경 비침 방지) |
| 드래그 처리 | `drag-start/move/end` IPC 수신, 화면 경계 내 위치 고정 |
| Ollama 통신 | `/v1/chat/completions` 스트리밍 API 호출 |
| 설정 파일 I/O | `aria-onprem-settings.json` 읽기/쓰기 |
| 언인스톨 | `C:\ARIA_ONPREM` 경로에서만 동작, 배치 스크립트로 삭제 |

**핵심 상수 (파일 상단):**

```js
const OLLAMA_URL    = 'http://localhost:11434/v1/chat/completions';
const OLLAMA_PING   = 'http://localhost:11434/api/tags';
const DEFAULT_MODEL = 'gemma4:e2b';
const QUALITY_MODEL = 'gemma4:e4b';
const MARGIN    = 16;                   // 화면 가장자리 여백(px)
const EXPANDED  = { w: 380, h: 560 };  // 채팅창 크기
const COLLAPSED = { w: 108, h: 120 };  // 로봇 아이콘 크기
```

**`win.setShape()` 좌표 (축소 상태 한정):**

```js
{ x: 14, y: 10, width: 94, height: 110 }
```

창 크기(108×120) 중 실제 콘텐츠 영역만 OS에 등록한다.  
드래그 시작/종료 시 shape를 잠시 해제/복원하여 드래그 중 이벤트 단절 문제를 방지한다.

---

### `preload.js` — IPC 브릿지

Electron의 컨텍스트 격리(contextIsolation) 환경에서 렌더러가 메인 프로세스와 통신할 수 있도록 `window.aria` 객체를 노출한다.

```js
window.aria = {
  expand(), collapse(), quit(),
  getSettings(), saveSettings(data),
  dragStart(sx, sy), dragMove(sx, sy), dragEnd(),
  chatStream({ messages, model }),
  onChunk(cb), onDone(cb), onError(cb), offListeners(),
  checkOllama(),
  openExternal(url),
  uninstall(),
  mouseEnterRobot(), mouseLeaveRobot()
}
```

렌더러는 반드시 이 API를 통해서만 메인 프로세스와 통신해야 한다. `nodeIntegration`은 비활성화되어 있다.

---

### `index.html` — UI 전체 (약 56 KB, 1,378줄)

CSS + HTML + JavaScript가 단일 파일에 인라인으로 구성되어 있다.

**UI 구성:**

| 영역 | 설명 |
|---|---|
| `#robot-btn` | 축소 상태의 캐릭터 버튼. 클릭 시 채팅창 확장 |
| `#chat-panel` | 전체 채팅 UI (헤더 + 메시지 영역 + 입력창) |
| `#settings-panel` | 설정 패널 (캐릭터, 봇 이름, 시스템 프롬프트) |

**캐릭터 목록 (6종):**

| ID | 이모지 | 이름 | 강조색 |
|---|---|---|---|
| `robot` | 🤖 | 로봇 | #00b4d8 (시안) |
| `cat` | 🐱 | 고양이 | #ff9500 (주황) |
| `fox` | 🦊 | 여우 | #ff4444 (빨강) |
| `penguin` | 🐧 | 펭귄 | #a78bfa (보라) |
| `dog` | 🐶 | 강아지 | #ffd740 (노랑) |
| `alien` | 👾 | 에일리언 | #4ade80 (초록) |

**지원 첨부파일:**

- 이미지: JPG, PNG, GIF, BMP (1,280px 초과 시 자동 리사이즈)
- 텍스트: TXT, MD, PY, JS, TS, HTML, CSS, JSON, CSV, LOG (최대 100 KB)

---

### `package.json`

```json
{
  "name": "aria-desktop",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": { "start": ".\\node_modules\\.bin\\electron.cmd ." },
  "devDependencies": { "electron": "^35.0.0" }
}
```

의존성은 Electron 하나뿐이다. `node_modules`는 이미 포함되어 있으므로 `npm install` 불필요.

---

## 9. 설치 방법

### 방법 A — GUI 설치 (권장)

1. USB 드라이브를 PC에 연결
2. USB 내 `ARIA_온프_설치하기.hta` 더블클릭
3. 화면 안내에 따라 진행 (5~15분 소요)
4. 설치 완료 후 바탕화면 "ARIA 온프" 바로가기로 실행

### 방법 B — 배치 설치

1. `install.bat` 더블클릭 (관리자 권한 권장)
2. 텍스트 진행 상황 확인

### 설치 경로 (자동)

| 항목 | 경로 |
|---|---|
| ARIA 앱 | `C:\ARIA_ONPREM\` |
| Ollama 서버 | `C:\Users\[사용자]\AppData\Local\Programs\Ollama\` |
| AI 모델 | `C:\Users\[사용자]\.ollama\models\` |
| 바탕화면 바로가기 | `C:\Users\[사용자]\Desktop\ARIA 온프.lnk` |

### 필요 디스크 공간

| 항목 | 크기 |
|---|---|
| Ollama | 약 6.7 GB |
| Gemma 4 e2b | 약 7.2 GB |
| Gemma 4 e4b | 약 9.6 GB |
| ARIA 앱 | 약 295 MB |
| **합계** | **약 24 GB** |

---

## 10. 실행 방법

### 일반 사용자

바탕화면 **"ARIA 온프"** 바로가기 더블클릭.

Ollama는 앱 시작 시 자동으로 백그라운드에서 실행된다.

### 개발자 (직접 실행)

```powershell
cd c:\chatbot-onprem
node_modules\.bin\electron.cmd .
```

### Ollama 수동 확인

```powershell
# 연결 확인
curl http://localhost:11434/api/tags

# 수동 실행 (자동 시작이 안 될 경우)
ollama serve
```

### 바로가기 Target 구조

```
cmd /c "cd /d C:\ARIA_ONPREM && node_modules\.bin\electron.cmd ."
```

창 스타일: 숨김(7) — 터미널 창이 뜨지 않음.

---

## 11. 환경설정 파일 설명

### `userdata\aria-onprem-settings.json`

앱 실행 중 자동 생성/갱신된다. 직접 편집도 가능하다.

```json
{
  "customPrompt": "",          // 커스텀 시스템 프롬프트. 빈 문자열이면 기본 프롬프트 사용
  "model": "gemma4:e2b",       // 현재 선택된 모델 ("gemma4:e2b" 또는 "gemma4:e4b")
  "botName": "ARIA",           // 채팅창에 표시되는 봇 이름
  "charId": "robot"            // 선택된 캐릭터 ID (robot/cat/fox/penguin/dog/alien)
}
```

### 기본 시스템 프롬프트 (main.js 내 `SYSTEM_PROMPT` 상수)

`customPrompt`가 비어 있으면 `main.js` 상단의 `SYSTEM_PROMPT` 상수가 사용된다.  
설정 패널에서 커스텀 프롬프트를 입력하면 해당 내용이 우선 적용된다.

---

## 12. 데이터 저장 위치

| 데이터 종류 | 저장 위치 | 형식 |
|---|---|---|
| 사용자 설정 | `c:\chatbot-onprem\userdata\aria-onprem-settings.json` | JSON |
| 대화 이력 | 메모리(변수) — 앱 종료 시 삭제됨 | — |
| AI 모델 | `C:\Users\[사용자]\.ollama\models\` | 바이너리 |
| 앱 바이너리 | `C:\ARIA_ONPREM\` (정식 설치 시) | — |

> **대화 이력은 영속 저장되지 않는다.** 앱을 닫으면 초기화된다.  
> 영속 저장이 필요하면 향후 개선 과제로 추가해야 한다 (18번 참고).

---

## 13. AI 모델 및 API 연결 방식

### 연결 구조

```
main.js  →  POST http://localhost:11434/v1/chat/completions
```

Ollama는 OpenAI 호환 API를 제공한다. 요청 형식:

```json
{
  "model": "gemma4:e2b",
  "messages": [
    { "role": "system", "content": "[시스템 프롬프트]" },
    { "role": "user",   "content": "[사용자 메시지]" }
  ],
  "stream": true
}
```

### 스트리밍 처리 방식

`stream: true`로 요청하면 SSE(Server-Sent Events) 형식으로 응답이 온다.

```
data: {"choices":[{"delta":{"content":"안"}}]}
data: {"choices":[{"delta":{"content":"녕"}}]}
...
data: [DONE]
```

`main.js`에서 `TextDecoder`로 청크를 디코딩하고, `\n`으로 분리 후 `data: ` 접두사를 제거해 JSON 파싱한다. 각 토큰을 `chat-chunk` IPC로 렌더러에 전송한다.

### Ollama 연결 확인

앱 시작 시 자동으로 `http://localhost:11434/api/tags`에 HEAD 요청을 보내 3초 이내 응답 여부로 연결을 확인한다. 실패 시 안내 모달을 표시한다.

### 모델 파일 위치

```
C:\Users\[사용자]\.ollama\models\
├── blobs\        ← 모델 가중치 파일 (대용량)
└── manifests\
    └── registry.ollama.ai\library\gemma4\
        ├── e2b   ← 빠른 버전 메타데이터
        └── e4b   ← 고품질 버전 메타데이터
```

---

## 14. 오프라인 전환 시 수정해야 할 부분

**현재 이 프로젝트는 이미 완전 오프라인으로 동작한다.**

만약 온라인 버전(`C:\ARIA_USB_PACKAGE\source\`)에서 온프레미스 버전으로 전환하거나, 외부 API를 제거하고 싶다면 아래를 확인한다.

### 온라인 버전과의 차이점

| 항목 | 온라인 버전 | 온프레미스 버전 |
|---|---|---|
| AI 서버 | 외부 API (Groq 등) | Ollama (로컬) |
| API Key | 필요 | 불필요 |
| 창 너비 (축소) | 92px | 108px |
| `win.setShape()` | 미사용 | 사용 (흰 바 방지) |
| 인터넷 필요 | 필요 | 불필요 |

### 온라인 버전 → 온프레미스 전환 시 체크리스트

1. `main.js` 상단의 API URL을 `http://localhost:11434/...`로 변경
2. API Key 관련 헤더 제거
3. `COLLAPSED.w`를 `92`에서 `108`로 변경
4. `win.setShape()` 로직 추가 (흰 바 방지)
5. `getPos()` 함수가 `height - h` 기준인지 확인
6. Ollama 및 모델 파일 설치 확인

---

## 15. 보안상 주의사항

### 절대 포함하면 안 되는 것

- API Key, 토큰, 비밀번호를 소스 코드에 하드코딩하지 말 것
- 실제 서버 IP, 내부망 도메인을 문서에 기재하지 말 것
- 사용자 대화 이력을 외부로 전송하는 기능을 추가하지 말 것

### 현재 보안 수준

| 항목 | 상태 |
|---|---|
| 외부 네트워크 통신 | 없음 (localhost만 사용) |
| 대화 이력 외부 전송 | 없음 |
| API Key | 불필요 (오프라인 모델) |
| 파일 시스템 접근 | `userdata\` 폴더 한정 |
| 언인스톨 경로 제한 | `C:\ARIA_ONPREM` 경로 외 불가 |

### 운영 시 주의사항

1. **Ollama 포트 노출 금지:** `localhost:11434`가 외부 네트워크에 노출되지 않도록 방화벽 설정
2. **모델 파일 접근 제한:** `%USERPROFILE%\.ollama\models`는 해당 사용자만 접근 가능
3. **USB 패키지 관리:** 배포 USB에는 소스코드가 포함되므로 분실 주의
4. **Codex 등 AI 도구 주의:** 과거 외부 AI 도구가 `index.html`, `main.js`를 임의 수정한 전례가 있음. 작업 후 항상 USB 백업 확인

---

## 16. 운영 및 유지보수 방법

### 파일 수정 후 필수 동기화

`c:\chatbot-onprem\`의 파일을 수정했다면 **반드시** USB 패키지에 덮어쓴다.  
USB 패키지가 신뢰할 수 있는 유일한 백업이다.

```powershell
# main.js 수정 후
Copy-Item "c:\chatbot-onprem\main.js" "C:\ARIA_ONPREM_USB_PACKAGE\source\main.js" -Force

# index.html 수정 후
Copy-Item "c:\chatbot-onprem\index.html" "C:\ARIA_ONPREM_USB_PACKAGE\source\index.html" -Force

# 두 파일 동시 동기화
Copy-Item "c:\chatbot-onprem\main.js"    "C:\ARIA_ONPREM_USB_PACKAGE\source\main.js"    -Force
Copy-Item "c:\chatbot-onprem\index.html" "C:\ARIA_ONPREM_USB_PACKAGE\source\index.html" -Force
```

### 설치된 PC에 업데이트 배포

1. `C:\ARIA_ONPREM_USB_PACKAGE\source\`의 파일을 최신으로 동기화
2. 대상 PC에서 ARIA 앱 종료
3. USB 내 `source\main.js`, `source\index.html`을 `C:\ARIA_ONPREM\`에 덮어쓰기
4. ARIA 앱 재시작

### Ollama 모델 업데이트

```powershell
# 온라인 환경에서만 가능
ollama pull gemma4:e2b
ollama pull gemma4:e4b
```

오프라인 환경에서는 새 모델 파일을 USB로 가져와 `%USERPROFILE%\.ollama\models\`에 수동 복사한다.

### 대화 이력 초기화

앱 내 설정 패널 → "대화 초기화" 버튼 클릭.  
또는 앱 재시작 (이력이 메모리에만 저장되므로 자동 초기화).

### 설정 초기화

```powershell
Remove-Item "c:\chatbot-onprem\userdata\aria-onprem-settings.json" -Force
# 앱 재시작 시 기본값으로 초기화됨
```

---

## 17. 장애 발생 시 점검 순서

### 증상별 점검

#### Ollama 연결 실패 모달이 뜸

```powershell
# 1. Ollama 프로세스 확인
Get-Process ollama -ErrorAction SilentlyContinue

# 2. API 응답 확인
curl http://localhost:11434/api/tags

# 3. Ollama 수동 실행
ollama serve

# 4. Ollama 앱 실행 (트레이 아이콘 방식)
Start-Process "$env:LOCALAPPDATA\Programs\Ollama\ollama app.exe"
```

#### 메모리 부족 오류 (e4b 모델)

```
오류: model requires more system memory (9.8 GiB) than is available (X GiB)
```

→ 채팅창 헤더에서 `e4b 🧠` → `e2b ⚡`로 모델 전환.  
→ 다른 무거운 앱을 닫아 메모리 확보 후 재시도.

#### 앱이 실행되지 않음

```powershell
# 직접 실행으로 오류 메시지 확인
cd C:\ARIA_ONPREM
node_modules\.bin\electron.cmd .
```

#### 앱이 보이지 않음 (화면 밖으로 나간 경우)

```powershell
# 설정 파일 삭제 후 재시작 (창 위치 초기화)
Remove-Item "C:\ARIA_ONPREM\userdata\aria-onprem-settings.json" -Force
```

#### 캐릭터 드래그 시 쏠리거나 사라짐

이미 수정된 버그. 증상이 재발하면 `main.js`의 `drag-start` 핸들러에 `win.setShape([])`가 있는지 확인.

```js
ipcMain.on('drag-start', (_, { sx, sy }) => {
    isDragging = true;
    win.setShape([]);   // ← 이 줄이 있어야 함
    ...
});
```

#### 흰색 바가 나타남

`main.js`의 `ready-to-show`, `collapse`, `drag-end` 핸들러에 `win.setShape([{ x: 14, y: 10, width: 94, height: 110 }])`가 있는지 확인.

#### 언인스톨이 동작하지 않음

언인스톨은 `C:\ARIA_ONPREM`에 설치된 경우에만 동작한다.  
개발 환경(`c:\chatbot-onprem`)에서는 의도적으로 비활성화되어 있다.

---

## 18. 향후 개선할 부분

| 우선순위 | 항목 | 설명 |
|---|---|---|
| 상 | 대화 이력 영속 저장 | 현재 앱 종료 시 이력 삭제됨. `userdata`에 JSON으로 저장 필요 |
| 상 | 다중 모델 지원 | LLaMA, Mistral, Qwen 등 Ollama 호환 모델 선택 UI |
| 중 | 자동 시작 설정 | Windows 시작 시 Ollama + ARIA 자동 실행 옵션 |
| 중 | 대화 내보내기 | 대화 이력을 TXT/MD 파일로 저장하는 기능 |
| 중 | 다국어 지원 | UI 및 시스템 프롬프트 영어/일본어 전환 옵션 |
| 하 | 음성 입출력 | STT/TTS 연동 (오프라인 모델 조합 필요) |
| 하 | 플러그인 시스템 | 사용자 정의 도구 추가 인터페이스 |
| 하 | 팀 협업 기능 | 로컬 네트워크 내 공유 대화 |

---

## IPC 채널 목록 (main ↔ renderer)

| 채널 | 방향 | 설명 |
|---|---|---|
| `expand` | renderer → main | 채팅창 확장 |
| `collapse` | renderer → main | 채팅창 축소 |
| `chat-stream` | renderer → main | Ollama 스트리밍 요청 |
| `chat-chunk` | main → renderer | 스트리밍 토큰 전달 |
| `chat-done` | main → renderer | 스트리밍 완료 |
| `chat-error` | main → renderer | 오류 메시지 전달 |
| `check-ollama` | renderer → main (invoke) | Ollama 연결 확인 |
| `get-settings` | renderer → main (invoke) | 설정 불러오기 |
| `save-settings` | renderer → main (invoke) | 설정 저장 |
| `drag-start/move/end` | renderer → main | 창 드래그 이동 |
| `mouse-enter/leave-robot` | renderer → main | 마우스 이벤트 통과 제어 |
| `open-external` | renderer → main | 외부 URL 브라우저 열기 |
| `uninstall` | renderer → main | 앱 완전 삭제 |
| `quit` | renderer → main | 앱 종료 |

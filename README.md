# AI 여행 일정 플래너

Firebase Authentication으로 로그인한 사용자가 여행지, 날짜, 항공권·숙소를 제외한 현지 사용 예산, 인원, 관심사를 입력하면 FastAPI 백엔드가 Google AI API를 호출해 한국어 여행 일정을 생성하는 웹 프로젝트입니다. 생성된 일정은 Firestore에 공개 또는 비공개로 저장할 수 있고, 공개 일정은 커뮤니티에서 조회할 수 있습니다.

## 주요 기능

- 이메일/비밀번호 회원가입, 로그인, 로그아웃
- 닉네임 저장과 로그인 상태 유지
- 여행 정보 입력과 프론트엔드/백엔드 양쪽 검증
- Firebase ID Token을 포함한 FastAPI AI 생성 요청
- Google AI API 키를 백엔드에서만 사용
- AI 응답 JSON 파싱, 검증, 정규화
- Firestore 일정 저장, 조회, 수정, 삭제
- 공개/비공개 일정 처리
- 공개 일정 커뮤니티, 여행지 검색, 더 보기
- Firestore Security Rules와 Indexes
- Netlify 정적 배포, Render FastAPI 배포

## 기술 스택

- 프론트엔드: HTML5, CSS3, Vanilla JavaScript, ES Module, Firebase Web SDK, Fetch API
- 백엔드: Python 3.12+, FastAPI, Uvicorn, Pydantic, Pydantic Settings, Firebase Admin SDK, Google Gen AI Python SDK
- 인증/DB: Firebase Authentication, Cloud Firestore
- 배포: Netlify, Render

## 시스템 구조와 데이터 흐름

1. 사용자가 Netlify 정적 사이트에 접속합니다.
2. Firebase Authentication으로 회원가입 또는 로그인합니다.
3. `planner.html`에서 여행 정보를 입력합니다.
4. 프론트엔드가 Firebase ID Token을 가져와 `Authorization: Bearer` 헤더로 FastAPI에 보냅니다.
5. FastAPI가 Firebase Admin SDK로 ID Token을 검증합니다.
6. 인증된 요청만 Google AI API를 호출합니다.
7. 서버가 AI 응답을 JSON으로 파싱하고 Pydantic 모델로 검증합니다.
8. 프론트엔드가 결과를 표시합니다.
9. 사용자가 저장하면 Firestore `itineraries` 컬렉션에 저장합니다.
10. Firestore Rules가 비공개 읽기와 수정·삭제 권한을 작성자 본인으로 제한합니다.

## 폴더 구조

```text
/
├── frontend/
│   ├── index.html
│   ├── planner.html
│   ├── result.html
│   ├── login.html
│   ├── my-plans.html
│   ├── community.html
│   ├── plan-detail.html
│   ├── edit-plan.html
│   ├── css/style.css
│   └── js/
│       ├── firebase-config.example.js
│       ├── app-config.example.js
│       ├── firebase.js
│       ├── auth.js
│       ├── auth-guard.js
│       ├── common.js
│       ├── ui.js
│       ├── validators.js
│       ├── api.js
│       └── 페이지별 JS 파일
├── server/app
├── server/tests
├── firestore.rules
├── firestore.indexes.json
├── netlify.toml
├── render.yaml
├── AGENTS.md
├── PLAN.md
└── TEST_CHECKLIST.md
```

## 로컬 실행 준비

프론트엔드 설정 파일을 만듭니다.

```powershell
Copy-Item frontend/js/firebase-config.example.js frontend/js/firebase-config.js
Copy-Item frontend/js/app-config.example.js frontend/js/app-config.js
```

`frontend/js/firebase-config.js`에는 Firebase Console의 웹 앱 설정값을 입력합니다. `frontend/js/app-config.js`의 `apiBaseUrl`은 로컬에서는 `http://localhost:8000`, 배포 후에는 Render 주소로 바꿉니다.

백엔드 설정 파일은 사용자가 직접 만듭니다. `.env`를 열기 어렵다면 `server/local-settings.txt`를 사용해도 됩니다.

```powershell
Copy-Item server/.env.example server/local-settings.txt
```

## Firebase 설정

1. Firebase Console에서 프로젝트를 생성합니다.
2. Authentication에서 이메일/비밀번호 제공자를 활성화합니다.
3. Firestore Database를 생성합니다.
4. 프로젝트 설정에서 웹 앱을 추가하고 Firebase Web 설정값을 `frontend/js/firebase-config.js`에 입력합니다.
5. 프로젝트 설정의 서비스 계정에서 Admin SDK용 값을 확인합니다.
6. Render 환경변수 또는 로컬 `server/local-settings.txt`에 다음 값을 입력합니다.

```text
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

`FIREBASE_PRIVATE_KEY`는 줄바꿈을 `\n`으로 넣어도 서버가 실제 줄바꿈으로 변환합니다.

## Google AI API 설정

Google AI Studio에서 API 키를 발급하고 로컬은 `server/local-settings.txt`, 배포는 Render 환경변수에 넣습니다.

```text
GOOGLE_AI_API_KEY=your-google-ai-api-key
GOOGLE_AI_MODEL=gemini-2.5-flash
```

이 프로젝트는 Google의 공식 `google-genai` Python SDK를 사용합니다. 서버 코드는 `GOOGLE_AI_API_KEY`가 없으면 실제 AI 호출을 하지 않고 한국어 설정 오류를 반환합니다.

## FastAPI 로컬 실행

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

확인 주소:

- `http://localhost:8000/`
- `http://localhost:8000/health`

## 프론트엔드 로컬 실행

정적 파일은 `frontend/` 폴더에 모여 있습니다. ES Module을 사용하므로 로컬 웹 서버로 실행합니다. Windows 환경에서 기본 `python -m http.server`가 `.js` 파일을 `text/plain`으로 내보내는 경우가 있어, 이 저장소에는 MIME을 보정한 `dev-server.py`를 포함했습니다.

```powershell
python dev-server.py 5500
```

브라우저에서 `http://localhost:5500/index.html`로 접속합니다. FastAPI `ALLOWED_ORIGINS`에는 `http://localhost:5500`을 포함해야 합니다.

## 테스트 실행

```powershell
cd server
pytest
```

자동 테스트는 실제 Google AI API를 호출하지 않습니다. 요청 검증, 인증 실패, AI 응답 파싱과 필수 필드 누락 처리를 확인합니다.

프론트엔드 수동 테스트는 `TEST_CHECKLIST.md`를 따릅니다.

## Firestore Rules 배포

Firebase CLI를 설치하고 로그인한 뒤 실행합니다.

```powershell
firebase deploy --only firestore:rules
```

## Firestore Indexes 배포

```powershell
firebase deploy --only firestore:indexes
```

필요 인덱스:

- `itineraries`: `userId ASC`, `updatedAt DESC`
- `itineraries`: `isPublic ASC`, `createdAt DESC`

## Netlify 배포

1. 저장소 루트를 Netlify 사이트로 연결합니다.
2. Build command는 비워 둡니다.
3. Publish directory는 `frontend`입니다.
4. 배포 후 `frontend/js/app-config.js`의 `apiBaseUrl`을 Render 서버 주소로 설정합니다.
5. Render `ALLOWED_ORIGINS`에 Netlify 주소를 추가합니다.

`netlify.toml`은 정적 HTML 다중 페이지 구조를 그대로 사용하므로 SPA 리다이렉트를 적용하지 않습니다.

## Render 배포

Render Web Service를 만들 때 루트 디렉터리는 `server`로 설정합니다.

```text
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```

Render 환경변수:

```text
GOOGLE_AI_API_KEY
GOOGLE_AI_MODEL
ALLOWED_ORIGINS
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
PORT
ENVIRONMENT
RATE_LIMIT_PER_MINUTE
AI_TIMEOUT_SECONDS
```

운영 환경에서는 `ALLOWED_ORIGINS`에 실제 Netlify 주소만 넣는 것을 권장합니다.

루트의 `render.yaml`을 사용하면 Render Blueprint로도 같은 설정을 만들 수 있습니다. 수동으로 만드는 경우에도 위 값과 동일하게 입력하면 됩니다.

## 테스트 사용자 생성

1. `login.html`에서 회원가입 탭을 엽니다.
2. 닉네임, 이메일, 비밀번호, 비밀번호 확인을 입력합니다.
3. 로그인 후 `planner.html`에서 일정을 생성합니다.
4. 생성 결과를 비공개와 공개로 각각 저장해 봅니다.

## 자주 발생하는 오류

- Firebase 설정 오류: `frontend/js/firebase-config.js`가 없거나 값이 예시 그대로이면 인증과 Firestore가 동작하지 않습니다.
- CORS 오류: Render `ALLOWED_ORIGINS`에 프론트엔드 주소를 추가합니다.
- Firestore 권한 오류: Rules 배포 여부, 로그인 상태, 문서의 `userId`가 현재 UID와 같은지 확인합니다.
- AI API 오류: `GOOGLE_AI_API_KEY`, 모델명, Render 환경변수 입력 여부를 확인합니다.
- Render 콜드 스타트: 무료 플랜에서는 첫 요청이 느릴 수 있습니다. 잠시 후 다시 시도하면 정상화됩니다.

## 보안 주의사항

- Google AI API 키는 프론트엔드에 넣지 않습니다.
- Firebase Admin 키와 `server/.env`, `server/local-settings.txt`는 커밋하지 않습니다.
- Firebase ID Token을 localStorage에 직접 저장하지 않습니다.
- 공개 페이지에는 작성자 닉네임만 표시하고 이메일과 UID를 표시하지 않습니다.
- 비공개 일정은 Firestore Rules에서 작성자만 읽을 수 있습니다.
- AI 응답은 서버에서 검증 후 반환합니다.
- 서버 오류 응답에는 내부 스택 트레이스와 키를 포함하지 않습니다.

## 참고 문서

- [Google Gen AI Python SDK 공식 문서](https://googleapis.github.io/python-genai/)
- [Gemini API Structured Outputs 공식 문서](https://ai.google.dev/gemini-api/docs/structured-output)

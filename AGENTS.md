# AGENTS.md

## 프로젝트 목적

AI 여행 일정 플래너는 Firebase Authentication으로 로그인한 사용자가 여행 조건을 입력하고, FastAPI 백엔드를 통해 Google AI API로 한국어 여행 일정을 생성한 뒤 Firestore에 저장·조회·수정·삭제하는 정적 웹 프로젝트입니다.

## 기술 스택

- 프론트엔드: HTML5, CSS3, Vanilla JavaScript, ES Module, Firebase Web SDK, Fetch API
- 백엔드: Python 3.12 이상, FastAPI, Uvicorn, Pydantic, Pydantic Settings, Google Gen AI Python SDK, Firebase Admin SDK
- 배포: Netlify 정적 사이트, Render Web Service
- 데이터: Firebase Authentication, Cloud Firestore

## 금지 사항

- React, Vue, Angular, Svelte, TypeScript를 도입하지 않습니다.
- Google AI API 키를 프론트엔드 파일에 넣지 않습니다.
- Firebase Admin 서비스 계정 JSON이나 `server/.env`를 저장소에 넣지 않습니다.
- 사용자 입력이나 Firestore 문자열을 `innerHTML`에 직접 넣지 않습니다.

## 파일별 역할

- `frontend/index.html`: 메인 화면과 최신 공개 일정 일부
- `frontend/planner.html`: 여행 정보 입력
- `frontend/result.html`: AI 생성 결과와 Firestore 저장
- `frontend/login.html`: 로그인과 회원가입
- `frontend/my-plans.html`: 내 일정 목록
- `frontend/community.html`: 공개 일정 목록과 검색
- `frontend/plan-detail.html`: 일정 상세
- `frontend/edit-plan.html`: 내 일정 수정
- `frontend/css/style.css`: 전체 반응형 스타일
- `frontend/js/firebase.js`: Firebase Web SDK 초기화
- `frontend/js/auth.js`: 인증 공통 함수
- `frontend/js/common.js`: 공통 내비게이션과 인증 메뉴
- `frontend/js/api.js`: FastAPI 호출
- `frontend/js/validators.js`: 프론트엔드 입력 검증
- `server/app`: FastAPI 앱
- `server/app/utils/ai_parser.py`: AI 응답 JSON 파싱과 정규화
- `firestore.rules`: Firestore 보안 규칙
- `firestore.indexes.json`: 필요한 복합 인덱스

## 코드 스타일

- 페이지별 JavaScript를 분리합니다.
- 공통 DOM 생성은 `frontend/js/ui.js`의 `createElement`를 우선 사용합니다.
- 비동기 작업은 `try/catch`로 사용자 메시지를 표시합니다.
- 오류 응답은 한국어로 표시하되 내부 키, 토큰, 스택 트레이스는 노출하지 않습니다.
- 서버 로그에 Firebase ID Token 전체를 출력하지 않습니다.

## 테스트 명령

```bash
cd server
pytest
```

프론트엔드 수동 테스트는 `TEST_CHECKLIST.md`를 따릅니다.

## 배포 구조

- Netlify는 `frontend` 폴더를 정적 사이트로 배포합니다.
- Render는 `server`를 루트 디렉터리로 사용하고 `uvicorn app.main:app --host 0.0.0.0 --port $PORT`로 실행합니다.
- 운영 환경에서는 Render의 `ALLOWED_ORIGINS`에 실제 Netlify 주소만 등록합니다.

## 작업 완료 전 점검

- 실제 키가 저장소에 들어가지 않았는지 확인합니다.
- `server/.env.example`과 `frontend/js/*example.js`만 예시 설정으로 유지합니다.
- FastAPI 테스트를 실행합니다.
- HTML, CSS, JavaScript 파일 연결을 확인합니다.
- Firestore Rules와 실제 쿼리 조건이 충돌하지 않는지 확인합니다.

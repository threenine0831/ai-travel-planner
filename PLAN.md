# AI 여행 일정 플래너 구현 계획

- [x] 저장소 전체 구조 확인
- [x] 기존 파일 분석
- [x] `.gitignore` 보안 항목 확인 및 작성
- [x] 요구사항을 작은 작업 단위로 분해
- [x] 데이터 모델 설계
- [x] 기본 HTML 페이지와 공통 내비게이션 구현
- [x] 반응형 CSS 구현
- [x] Firebase 초기화 및 인증 구현
- [x] FastAPI 기본 서버 구현
- [x] Firebase ID Token 검증 구현
- [x] Google AI API 연결 구현
- [x] AI 응답 검증 구현
- [x] 여행 일정 결과 화면 구현
- [x] Firestore 저장 및 조회 구현
- [x] 내 일정 수정 및 삭제 구현
- [x] 공개 일정 커뮤니티 구현
- [x] Firestore Security Rules 작성
- [x] Firestore Indexes 작성
- [x] 자동 테스트와 수동 테스트 체크리스트 작성
- [x] Netlify와 Render 배포 설정 작성
- [x] README 작성
- [x] AGENTS.md 작성
- [x] 전체 오류 점검
- [x] 완료 조건 점검
- [x] Render/Netlify 배포에 맞춰 프론트엔드 정적 파일을 `frontend/`로 분리

## 구현 기준

- 프론트엔드는 HTML5, CSS3, Vanilla JavaScript ES Module, Firebase Web SDK, Fetch API만 사용한다.
- 백엔드는 Python 3.12 이상, FastAPI, Pydantic, Firebase Admin SDK, Google Gen AI Python SDK를 사용한다.
- 실제 API 키와 Firebase 설정은 저장소에 넣지 않고 example 파일과 README로 안내한다.
- Google AI API 키는 백엔드의 `server/.env`, `server/local-settings.txt`, 또는 Render 환경변수의 `GOOGLE_AI_API_KEY`에서만 읽는다.
- AI 응답은 서버에서 JSON 파싱, 검증, 정규화 후 프론트엔드로 전달한다.
- 비공개 일정은 Firestore Security Rules와 클라이언트 로직 모두에서 작성자 본인만 접근하게 한다.

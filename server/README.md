# AI 여행 일정 플래너 FastAPI 서버

이 폴더는 Render Web Service로 배포하는 FastAPI 백엔드입니다.

## 로컬 실행

```bash
cd server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

`.env`에는 실제 `GOOGLE_AI_API_KEY`와 Firebase Admin 환경변수를 직접 입력해야 합니다. `.env`는 `.gitignore`에 포함되어 커밋되지 않습니다.

AI 응답 속도와 일관성은 다음 환경변수로 조정할 수 있습니다.

```text
AI_MAX_OUTPUT_TOKENS=12288
AI_TEMPERATURE=0.45
```

서버는 여행 일수에 따라 실제 출력 토큰 상한을 자동으로 조절합니다. 값이 너무 낮으면 긴 일정의 JSON 응답이 중간에 잘릴 수 있습니다.

## 테스트

```bash
cd server
pytest
```

테스트는 실제 Google AI API를 호출하지 않고 요청 검증, 인증 실패, AI 응답 파서를 확인합니다.

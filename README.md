# Physics Merge Game MVP

TypeScript, React, Matter.js, Express, PostgreSQL 기반의 물리 합체 게임 MVP입니다.

## 권장 프로젝트 구조

```text
m-melongame/
  client/
    src/
      components/
      game/
      hooks/
      services/
  server/
    src/
      config/
      db/
      routes/
```

## 주요 패키지

- `react`, `react-dom`: 브라우저 UI 구성
- `typescript`: 프론트엔드와 백엔드 타입 안정성
- `vite`: React 개발 서버와 번들링
- `matter-js`: 중력, 충돌, 마찰, 회전 등 2D 물리 엔진
- `express`: REST API 서버
- `pg`: PostgreSQL 연결
- `cors`: 클라이언트와 서버 개발 포트 분리 대응
- `dotenv`: DB 접속 정보 등 환경 변수 관리
- `tsx`: 개발 중 TypeScript 서버 실행
- `concurrently`: 루트에서 client/server 개발 서버 동시 실행

## 실행 명령어

```bash
npm install
npm run dev
```

브라우저에서는 HTML 파일을 직접 열지 말고 개발 서버 주소로 접속합니다.

```text
http://localhost:5173/
```

`client/index.html`을 `file://`로 열면 Vite가 `/src/main.tsx`를 처리하지 못해 CORS 오류가 발생합니다.

개별 실행:

```bash
npm run dev --workspace client
npm run dev --workspace server
```

타입 점검:

```bash
npm run typecheck
```

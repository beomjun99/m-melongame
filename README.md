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

## PostgreSQL 설정

서버는 `server/.env`의 `DATABASE_URL`을 사용합니다.

```bash
copy server\.env.example server\.env
npm run db:init --workspace server
```

DB 연결 확인:

```text
GET http://localhost:4000/api/health/db
```

## 커스텀 테마 이미지

캐릭터 이미지는 PostgreSQL에 binary로 저장하지 않고 `server/uploads/`에 저장합니다.
DB의 `themes`, `theme_items` 테이블에는 Level별 이미지 URL만 저장합니다.

지원 형식은 PNG, JPG/JPEG, WebP이며 기본 파일 크기 제한은 2MB입니다.

## 외부 테스트 배포

다른 사용자가 같은 Battle Room에 접속하려면 `localhost`가 아니라 공개 URL이 필요합니다.
현재 구조에서는 Supabase를 PostgreSQL로 사용하고, Express/Socket.IO 서버와 React 정적 파일은 별도 호스팅에 배포합니다.

권장 MVP 구성:

```text
React client: Vercel, Netlify 등 정적 호스팅
Express + Socket.IO server: Railway
PostgreSQL: Supabase
```

Supabase + Railway 서버 설정:

1. Supabase 프로젝트를 생성합니다.
2. Database connection string에서 `Session pooler` 방식을 선택합니다.
3. 해당 connection string을 Railway 서버 서비스의 `DATABASE_URL` 환경변수로 설정합니다.
4. 서버 배포 환경변수에 다음 값을 설정합니다.

```text
DATABASE_URL=<Supabase Session pooler connection string>
CLIENT_ORIGIN=<배포된 프론트 URL>
```

`PORT`는 Railway가 자동으로 제공합니다.
Supabase connection string에 `sslmode=require`가 있거나 host에 `supabase`가 포함되어 있으면 서버가 SSL을 자동 적용합니다.
필요하면 `DATABASE_SSL=true`로 명시할 수도 있습니다.

서버 DB 초기화:

```bash
npm run db:init --workspace server
```

Railway에서 루트 디렉터리 기준으로 배포하면 `railway.json` 설정에 따라 서버만 빌드/실행됩니다.

```text
Build command: npm run build --workspace server
Start command: npm run start --workspace server
Healthcheck: /api/health
```

프론트 배포 환경변수:

```text
VITE_API_BASE_URL=<배포된 서버 URL>
VITE_SOCKET_URL=<배포된 서버 URL>
```

Battle 연결 테스트:

1. 사용자 A가 배포된 프론트 URL에 접속합니다.
2. `배틀 모드`에서 닉네임을 입력하고 `방 만들기`를 누릅니다.
3. 표시된 Room Code를 사용자 B에게 전달합니다.
4. 사용자 B가 같은 배포 URL에 접속한 뒤 Room Code로 참가합니다.
5. 두 사용자의 방 상태가 `READY`로 바뀌면 Phase 14 Room 연결이 성공한 상태입니다.

참고: Supabase Edge Functions는 WebSocket을 처리할 수 있지만, 현재 서버는 Express + Socket.IO 기반입니다.
따라서 이 MVP에서는 Supabase에 Express 서버를 그대로 배포하지 않고, Node 서버 호스팅에 배포하는 구성이 가장 단순합니다.

## Battle MVP 검증 한계

현재 Battle MVP는 Matter.js 물리 시뮬레이션을 각 클라이언트에서 독립적으로 실행하는 client-authoritative 구조입니다.
서버는 Room 참가 여부, PLAYING 상태 여부, merge level 범위, 짧은 시간 내 과도한 merge 이벤트 발생 여부만 검증합니다.
경쟁 서비스로 확장할 경우 server-authoritative validation 또는 리플레이 검증이 추가로 필요합니다.

## Phase 24 통합 점검

API 서버와 PostgreSQL이 연결된 상태에서 다음 명령으로 핵심 통합 시나리오를 반복 검증할 수 있습니다.

```bash
npm run test:phase24
```

이 스모크 테스트는 Matter.js 합체와 공격 Ping-Pong 방지, 싱글 결과 저장과 랭킹 조회, Level 1~11 테마 업로드와 불러오기/삭제/이름 중복 차단, Battle Room 인원 제한, Ready/Countdown/Start, Level 2~5 공격, 일시정지, 승패와 DB 저장, 재경기, 연결 종료 처리를 확인합니다. 테스트 데이터는 실행이 끝날 때 삭제됩니다.

브라우저에서는 별도로 싱글 게임 시작과 낙하 조작, 원형 스킨 렌더링, Next 패널, 일시정지 모달, 랭킹 Refresh, 스킨 설정 미리보기와 Battle Lobby 화면을 확인합니다.

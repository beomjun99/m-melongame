# Physics Merge Game MVP

TypeScript, React, Matter.js, Express, PostgreSQL 기반의 물리 합체 게임 MVP입니다.

## 권장 프로젝트 구조

```text
m-melongame/
  shared/
    src/              # Client/Server Battle 이벤트와 payload 계약
  client/
    src/
      battle/
      components/
      game/
      services/
      theme/
  server/
    src/
      battle/
      config/
      db/
      repositories/
      routes/
      services/
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

## Phase 26 모바일 레이아웃

물리 보드는 420 × 576 좌표를 유지하며 화면에서만 같은 비율로 축소합니다. 캔버스, 상단 미리보기, 게임오버 라인은 동일한 좌표계를 사용하고 포인터 좌표는 화면 배율을 역산합니다. 화면 크기 변경은 Matter 엔진 재생성을 유발하지 않습니다.

540px 이하 화면 또는 터치 입력 장치에서는 별도의 모바일 컨트롤을 표시합니다. 모바일 보드 터치/드래그는 위치 변경이나 낙하를 실행하지 않으며 DROP 버튼을 사용합니다. 넓은 화면의 마우스 이동/클릭 조작은 유지합니다. 작은 화면에서는 Pause/재시작/Next 패널을 보드 위에 배치하고 보드 표시 크기는 화면 높이도 고려합니다.

확인 항목: 320/375/540px 화면의 가로 넘침, 캔버스와 미리보기 정렬, 축소된 보드 클릭 위치, 크기 변경 전후 오브젝트 유지, Pause/Resume, 모바일 컨트롤의 Pause 중 비활성화. 실제 iOS/Android 터치 동작은 기기에서도 확인해야 합니다.

## Phase 27 모바일 좌우 이동

Phase 26의 임시 슬라이더를 보드 아래 왼쪽의 ◀/▶ 버튼으로 교체했습니다. `client/src/controls/config.ts`의 `CONTROL_CONFIG.moveStep`으로 이동량을 조절하며 기본값은 물리 좌표 기준 6입니다. 화면 표시 배율과 무관하게 현재 오브젝트의 반지름부터 보드 너비에서 반지름을 뺀 위치까지만 이동합니다.

이동 버튼은 누르는 즉시 한 번 이동하고, 200ms 이상 누르면 30ms마다 반복 이동합니다. 손을 떼거나 포인터가 취소되거나 캡처를 잃으면 멈춥니다. 창 포커스/가시성 변경, Pause/Game Over, 컴포넌트 해제에서도 타이머를 정리합니다. 포인터 이후의 click은 이동을 중복 실행하지 않으며 키보드/접근성 click은 지원합니다. 반복 시간은 같은 config에서 조절합니다. 끝에서 반대편으로 넘어가는 Wrap은 Phase 30 범위입니다.

## Phase 28 DROP 버튼

모바일 보드 아래 오른쪽 DROP 버튼으로 현재 선택한 위치에서 낙하시킵니다. 단일 click 이벤트, 450ms cooldown과 동기 타이머 잠금으로 연속 입력을 제한하며 Pause/Game Over에서는 비활성화합니다. 싱글과 배틀은 동일한 낙하 경로를 사용합니다.

연속 이동 회귀 검증: `npx tsx scripts/mobile-hold-smoke.ts`. 실제 입력 hook이 사용하는 타이머 모듈을 가상 시계로 실행해 짧은 탭, 반복 시작 지연, 반복 간격, 해제 후 정지, 방향 변경을 확인합니다.

## 스킨 미리보기와 뒤로가기

초기 테마/이미지 로딩이 끝난 후 타이틀을 표시하며 낙하 전 미리보기는 이미지 요소로 렌더링합니다. 이미지 로딩 실패나 8초 초과 시 준비 대기를 해제합니다. 게임 중 브라우저 뒤로가기는 기존 Pause 동작을 호출하고, Pause 상태에서 다시 뒤로가기를 눌러도 게임을 유지합니다. 스킨 설정·배틀 로비·순위 화면에서는 타이틀로 돌아옵니다. 타이틀에서는 브라우저의 기본 뒤로가기가 유지됩니다. 배틀 Pause/방 나가기는 기존 서버 이벤트를 사용합니다. 상점은 현재 진입 불가이며 향후 화면 추가 시 `useAppBack`의 활성 화면 조건에 포함해야 합니다.

## Phase 29 낙하 가이드

`game/preview.ts`에서 낙하 원과 기존 원의 반지름 합을 이용해 수직 이동 중 첫 접촉 위치를 계산합니다. `game/DropGuide.tsx`는 수직 점선과 현재 스킨의 30% 불투명도 이미지를 표시하며 이동 중인 Body에도 매 프레임 갱신합니다. 예측용 Matter Body를 만들거나 물리 위치를 수정하지 않습니다. Pause/Game Over/cooldown 중에는 가이드를 숨기며 재개 시 다시 계산합니다. 튕김·구름·합체 후 최종 정착 위치는 예측하지 않습니다.

검증: `npx tsx scripts/preview-smoke.ts` (바닥, 쌓임, 수평 오프셋, 스폰 위치 겹침, 물리 무변경). 브라우저에서는 스킨 표시, 좌우 이동, DROP 후 가이드 갱신과 뒤로가기 Pause/타이틀 복귀를 확인합니다.

## Phase 30 화면 끝 순환 이동

좌우 버튼을 길게 누르면 가장자리에 도달했을 때 반복 이동을 종료하고 멈춥니다. 계속 누르고 있어도 넘어가지 않으며, 손을 떼고 같은 방향을 다시 눌렀을 때만 반대편 끝으로 이동합니다. 반대편으로 이동한 뒤에도 멈추므로 가장자리에서 DROP할 수 있습니다. 이동할 수 있는 양끝은 현재 오브젝트 반지름을 반영하며 보조선도 새 X 위치를 따라갑니다. 마우스 위치 지정에는 Wrap을 적용하지 않습니다. `mobile-hold-smoke.ts`는 양쪽 경계 정지와 재입력 Wrap도 검증합니다.

`client/src/controls/config.ts`의 `wrapMovementEnabled` 기본값은 `true`입니다. `false`이면 끝에서 멈춥니다. 사용자 설정창 토글과 저장은 Phase 31·32에서 연결합니다. `npx tsx scripts/wrap-smoke.ts`로 양방향, 끝 도달/추가 입력 구분, OFF, Level 1~11 반지름 및 연속 이동 경계를 검증합니다.

## Phase 31 Pause 컨트롤 설정

Pause 모달의 **좌우반전** 체크박스 하나로 방향 버튼과 DROP 위치를 함께 전환합니다. 요청된 UI 규칙에 따라 체크 시 `ARROWS_LEFT`(방향 버튼 왼쪽, DROP 오른쪽), 해제 시 `ARROWS_RIGHT`(DROP 왼쪽, 방향 버튼 오른쪽)입니다. 기존 배치를 유지하도록 초기 체크 상태입니다. 좌우 이동 방향 자체는 바뀌지 않습니다.

**화면 끝에서 반대편으로 이동**을 해제하면 재입력해도 끝에서 멈춥니다. 설정 변경은 물리 엔진을 다시 만들지 않으며 싱글/배틀 공통으로 적용됩니다. 재시작·타이틀 이동 후에도 설정을 유지하며 Phase 32부터 새로고침 후에도 복원합니다.

## Phase 32 사용자 설정 저장

`settings/useGameSettings.ts`는 초기 렌더에서 저장 설정을 읽고 변경 시 저장합니다. localStorage 접근·기본값·검증은 `settings/settingsService.ts`, 타입은 `settings/types.ts`로 분리했습니다. 저장 키는 `m-melongame:game-settings`이며 `{ version: 1, settings: ... }` 형식입니다.

버튼 배치와 Wrap 설정, BGM/SFX 볼륨(0~1)을 새로고침 후에도 유지합니다. 현재 단일 볼륨 슬라이더는 두 볼륨을 함께 변경하며 실제 Audio 재생과 개별 슬라이더는 후속 Phase 범위입니다. 잘못된 필드는 기본값으로 복구하고 볼륨은 범위 안으로 제한합니다. 저장 차단/용량 초과 시 현재 게임의 메모리 설정은 유지됩니다.

localStorage는 브라우저·사이트 주소별입니다. Cloudflare 임시 URL이 바뀌면 이전 주소의 설정을 공유하지 않습니다. `npx tsx scripts/settings-smoke.ts`로 저장/복원, false/0 유지, 손상·누락·잘못된 값 및 저장 접근 실패를 검증합니다.

# coterie — 개발 진행 보고서

> 최초 작성일: 2026-03-20
> 최종 업데이트: 2026-03-20 (세션 2)
> 대상: 기획 에이전트 인수인계용

---

## 프로젝트 개요

- **서비스명**: coterie
- **성격**: 초대 코드 전용 완전 폐쇄형 프라이빗 소셜 커뮤니티
- **배포 URL**: https://coterie-phi.vercel.app
- **저장소**: https://github.com/junesok/coterie (main 브랜치 push → Vercel 자동 배포)
- **관리자 계정**: `coterie_admin` (Vercel에 배포된 DB에 시딩 완료)

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 프레임워크 | Next.js 16.2.0 (App Router, Turbopack) |
| 인증 | NextAuth.js v4 — Credentials Provider (username 기반) |
| DB | Neon (PostgreSQL) |
| ORM | Prisma 7 + PrismaNeon Driver Adapter |
| 이미지 저장소 | Cloudinary |
| 이메일 | nodemailer + Gmail SMTP (App Password, port 465 SSL) |
| HTTP 클라이언트 | Axios |
| 배포 | Vercel (Hobby plan) |
| 미들웨어 | `proxy.ts` (Next.js 16에서 middleware.ts 대신 사용) |

---

## DB 스키마 (prisma/schema.prisma 기준)

### 모델 목록

| 모델 | 설명 |
|---|---|
| `User` | 유저. `username`, `isAdmin`, `isVerified`, `theme`, `avatarUrl` 필드 포함 |
| `InviteCode` | 초대 코드. `owner`, `usedBy` 관계 |
| `PasswordReset` | 비밀번호 재설정 코드 (6자리, 10분 만료) |
| `Post` | 게시물 |
| `PostImage` | 게시물 첨부 이미지 (Cloudinary URL 저장) |
| `Comment` | 댓글 + 대댓글 (self-relation, `parentId`) |
| `Like` | 좋아요. `@@unique([postId, userId])` |
| `Notification` | 알림 |
| `ModerationLog` | 관리자 제재 로그 |

### 주요 Enum

- `NotificationType`: `COMMENT`, `LIKE`, `MENTION_POST`, `MENTION_COMMENT`, `ADMIN_DELETE_POST`, `ADMIN_DELETE_COMMENT`
- `ModerationTarget`: `POST`, `COMMENT`
- `ModerationReason`: `SEXUAL_CONTENT`, `HATE_SPEECH`, `SPAM`, `VIOLENCE`, `PRIVACY_VIOLATION`, `OTHER`

---

## 완료된 기능 전체 목록

### 인증

- [x] 초대 코드 검증 → 회원가입
- [x] 가입 시 `isVerified: true` 즉시 설정 (이메일 인증 없음)
- [x] 로그인: `username` + 비밀번호 (email 기반 로그인 제거)
- [x] `coterie_admin` 유저네임은 예약어 (가입 불가)
- [x] JWT 세션에 `isAdmin`, `username` 포함
- [x] 가입 시 초대 코드 3개 즉시 발급

### 비밀번호 재설정

- [x] `/forgot-password` — 이메일로 6자리 인증 코드 발송 (10분 만료)
- [x] 인증 코드 확인 후 리셋 토큰 발급
- [x] `/reset-password` — 새 비밀번호 입력 + PasswordStrengthBar
- [x] nodemailer + Gmail SMTP로 발송 (`lib/mailer.ts`)
- [x] 로그인 페이지에 "Forgot password?" 링크, 재설정 완료 후 `?reset=1` 성공 메시지

### 게시물

- [x] 게시물 작성 / 수정 / 삭제
- [x] 이미지 첨부 (최대 3장, Cloudinary 직접 업로드)
  - 브라우저 → `/api/upload/sign` 서명 취득 → Cloudinary REST API 직접 POST
  - 게시 버튼 클릭 시 업로드 (선택 즉시 업로드 아님)
- [x] 게시물 삭제 시 Cloudinary 이미지 자동 삭제
- [x] 수정 시 제거된 이미지 Cloudinary에서 자동 삭제

### 댓글 / 대댓글

- [x] 댓글 작성 / 수정 / 삭제 (소프트 삭제)
- [x] 대댓글 (1단계 중첩)
- [x] 작성자 표시: `@username` 우선, 없으면 `name`
- [x] 댓글 작성자 이름 클릭 → 프로필 페이지 이동

### 좋아요

- [x] 게시물 좋아요 / 취소 (유저당 1회)
- [x] 좋아요 알림 (자기 자신 제외, 중복 방지)

### 알림

- [x] 알림 타입: 댓글, 좋아요, @멘션(게시물/댓글), 관리자 삭제
- [x] NavBar 알림 뱃지 (30초 폴링)
- [x] 알림 읽음 처리 / 전체 읽음
- [x] @멘션 파싱: `/@([a-z0-9_]{3,20})/gi`
- [x] 알림 목록에서 액터 이름 클릭 → 프로필 이동

### 초대 코드

- [x] 가입 시 초대 코드 3개 즉시 지급
- [x] 내 초대 코드 목록 조회 (`/settings` 내 인라인 표시)
- [x] 복사 버튼 → 가입 링크 클립보드 복사 (`/register?code=XXX`)
- [x] `/register?code=XXX` 접속 시 초대 코드 자동 입력

### 프로필

- [x] `/profile/[username]` — 타인/자신 프로필 페이지
  - 아바타, 이름, 유저네임, 가입일, 게시물 목록 표시
  - 본인 프로필: 카메라 버튼으로 아바타 직접 업로드
  - 본인 프로필: 타이틀바에 "edit" 버튼 → `/profile/edit`
- [x] `/profile/me` — 세션 username으로 자동 리다이렉트
- [x] `/profile/edit` — 프로필 편집 전용 페이지
  - 프로필 사진 업로드 / 교체 / 제거 (X 버튼, null 저장 시 Cloudinary 삭제)
  - 이름 변경
  - 유저네임 변경 (0.5초 디바운스 실시간 중복 확인, regex/예약어 검증)
  - 저장 성공 시 해당 프로필 페이지로 자동 이동
- [x] 기본 프로필 이미지: `/public/default-profile.png` (아바타 없을 시 fallback)
- [x] PostCard 타이틀바에 작성자 아바타(22px) + 유저네임 표시

### 관리자

- [x] 관리자 전용 경로: `/coterie-admin/*`
- [x] `proxy.ts`에서 비관리자 접근 시 `/feed` 리다이렉트
- [x] NavBar에 관리자 버튼 (ShieldCheck 아이콘, `isAdmin`일 때만 표시)
- [x] 관리자 대시보드: 통계(총 유저/게시물/댓글/오늘 신규 가입)
- [x] 관리자 초대 코드 직접 발급 (유저 없이 생성 가능)
- [x] 게시물/댓글 관리 (목록, 삭제, 제재 사유 선택)
- [x] 유저 목록 조회
- [x] 제재 로그 (`ModerationLog`)

### 설정 (`/settings`)

- [x] 테마 변경 (라이트/다크) — DB 저장, 다기기 동기화
- [x] 기본 테마: 라이트 모드
- [x] 내 초대 코드 목록 + 복사
- [x] 비밀번호 변경 (현재 비밀번호 확인 + PasswordStrengthBar)
- [x] 로그아웃
- [x] 사이트 소개 섹션
- ※ 이름/유저네임 변경은 `/profile/edit`으로 분리

### 디자인

- [x] Windows XP Luna 창 스타일 전면 적용
  - 진짜 Luna 그라디언트 타이틀바 (6단계 멀티스톱 `#6FAED8 → #1649B9 → #55A0E0`)
  - `xp-window`: 파란 창 테두리 + 내부 흰색 하이라이트 + 상단 둥근 모서리
  - `xp-statusbar`: 회색 하단 상태바
  - `xp-ctrl-btn`: 창 컨트롤 버튼 (─ □ ✕) 스타일
  - XP 스타일 스크롤바
- [x] PostCard: 각 포스트가 독립 XP 창 (타이틀바: 아바타+작성자+시간 / 상태바: 좋아요·댓글 수)
- [x] 외부 데스크탑 배경: `#3A7EC9` (Luna 블루)
- [x] 모든 클릭 요소 `cursor: pointer`
- [x] iPhone 11 홈 바 `safe-area-inset-bottom` 적용
- [x] `viewport-fit: cover` 설정

### NavBar

- [x] 헤더 전체 크기 ~50% 확대 (모바일 터치 영역 개선)
  - 세로 패딩 `py-2` → `py-3`, 가로 `px-3` → `px-4`
  - 아이콘 `size={16}` → `size={24}`, 패딩 `p-1` → `p-1.5`
  - Back 버튼 화살표 14px → 20px, 폰트 12px → 13px
- [x] `showBack` 페이지: 헤더 정중앙에 **coterie** 링크 (absolute 중앙 배치) → `/feed`
- [x] 오른쪽 고정 아이콘: 프로필(CircleUser) · 관리자(ShieldCheck) · 알림(Bell)
  - 프로필 버튼: 항상 표시, username 있으면 `/profile/[username]`, 없으면 `/profile/me`
- [x] 게시물 상세 페이지: edit/delete 버튼 NavBar에서 제거 → 본문 내 작성자 행으로 이동

### 에러 페이지

- [x] `app/not-found.tsx` — 404
- [x] `app/error.tsx` — 런타임 에러 (XP 블루스크린)
- [x] `app/global-error.tsx` — 루트 레이아웃 에러

### 메타데이터

- [x] OG 이미지: `/public/coterie.jpg` (250×219)
- [x] `metadataBase: https://coterie-phi.vercel.app`
- [x] Twitter card: `summary_large_image`

### UI 언어

- [x] 사용자 대면 페이지 전체 영문화
- [x] `date-fns` 로케일 `enUS`

### 사이트 소개글

- [x] 회원가입 페이지 + 설정 페이지에 소개 섹션 추가

---

## 현재 라우트 구조

| 경로 | 유형 | 설명 |
|---|---|---|
| `/` | 정적 | 랜딩 (→ `/feed` 리다이렉트) |
| `/login` | 정적 | 로그인 (`?reset=1` 성공 메시지) |
| `/register` | 정적 | 회원가입 (`?code=` 자동 입력) |
| `/forgot-password` | 정적 | 비밀번호 재설정 요청 |
| `/reset-password` | 정적 | 새 비밀번호 입력 |
| `/feed` | 정적 | 피드 |
| `/post/new` | 정적 | 게시물 작성 |
| `/post/[id]` | 동적 | 게시물 상세 |
| `/post/[id]/edit` | 동적 | 게시물 수정 |
| `/notifications` | 정적 | 알림 |
| `/settings` | 정적 | 설정 (테마·초대코드·비밀번호·로그아웃) |
| `/profile/me` | 정적 | 내 프로필 (→ `/profile/[username]` 리다이렉트) |
| `/profile/[username]` | 동적 | 유저 프로필 |
| `/profile/edit` | 정적 | 프로필 편집 (사진·이름·유저네임) |
| `/profile/me/invite` | 정적 | 내 초대 코드 (레거시, settings에 통합) |
| `/coterie-admin` | 정적 | 관리자 진입점 |
| `/coterie-admin/dashboard` | 정적 | 관리자 대시보드 |
| `/coterie-admin/users` | 정적 | 유저 목록 |
| `/coterie-admin/posts` | 정적 | 게시물 관리 |
| `/coterie-admin/comments` | 정적 | 댓글 관리 |
| `/coterie-admin/logs` | 정적 | 제재 로그 |

---

## 환경 변수 목록 (Vercel Production 설정 완료)

```
DATABASE_URL
DIRECT_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
SMTP_FROM
ADMIN_PASSWORD
```

> ⚠️ Vercel 환경변수 설정 시 `echo` 대신 `printf`를 사용해야 함 (`echo`는 값에 `\n` 추가)

---

## 알려진 미구현 항목 (향후 개발 후보)

| 항목 | 비고 |
|---|---|
| 무한 스크롤 | 현재 "Load more" 버튼 방식 |
| 푸시 알림 | 현재 30초 폴링 방식 |
| 이미지 업로드 고도화 | 현재 최대 3장, 1MB 압축 |
| 계정 탈퇴 | 미구현 |

---

## 주요 설계 결정 사항 (히스토리)

| 결정 | 이유 |
|---|---|
| 이메일 인증 제거 | Resend `onboarding@resend.dev`는 계정 소유자 이메일로만 발송 가능. 도메인 미구입으로 우회 불가 |
| nodemailer + Gmail SMTP | Resend 제거 후 비밀번호 재설정 이메일 발송용. App Password 방식 |
| 로그인을 username으로 | 이메일 노출 최소화, UX 개선 |
| `proxy.ts` 사용 | Next.js 16에서 `middleware.ts` 미지원 |
| Cloudinary 직접 업로드 | Vercel 서버리스 함수 경유 시 SDK 호환성 문제 + 4.5MB 바디 제한 우회 |
| `prisma migrate deploy` 수동 | Vercel 빌드 환경이 비대화형 — `migrate dev` 불가 |
| edit/delete 버튼 본문 이동 | NavBar 오른쪽에 프로필+어드민+벨+edit+delete 집중 시 모바일 overflow 발생 |
| 프로필 버튼 항상 표시 | `{username && ...}` 조건 사용 시 username=null 유저에게 버튼 미표시 버그 |

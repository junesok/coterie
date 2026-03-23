# coterie — 개발 진행 보고서

> 최초 작성일: 2026-03-20
> 최종 업데이트: 2026-03-23 (세션 4)
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
| `Post` | 게시물. `visibility(PostVisibility)` 필드 포함 |
| `PostImage` | 게시물 첨부 이미지 (Cloudinary URL 저장) |
| `Comment` | 댓글 + 대댓글 (self-relation, `parentId`) |
| `Like` | 좋아요. `@@unique([postId, userId])` |
| `Notification` | 알림. `friendshipId` 필드 포함 |
| `ModerationLog` | 관리자 제재 로그 |
| `Friendship` | 친구 관계. `senderId`, `receiverId`, `status(FriendshipStatus)`, `@@unique([senderId, receiverId])` |

### 주요 Enum

- `PostVisibility`: `PUBLIC`, `FRIENDS`
- `FriendshipStatus`: `PENDING`, `ACCEPTED`, `REJECTED`
- `NotificationType`: `COMMENT`, `LIKE`, `MENTION_POST`, `MENTION_COMMENT`, `ADMIN_DELETE_POST`, `ADMIN_DELETE_COMMENT`, `FRIEND_REQUEST`, `FRIEND_ACCEPT`
- `ModerationTarget`: `POST`, `COMMENT`
- `ModerationReason`: `SEXUAL_CONTENT`, `HATE_SPEECH`, `SPAM`, `VIOLENCE`, `PRIVACY_VIOLATION`, `OTHER`

---

## 완료된 기능 전체 목록

### 인증

- [x] 초대 코드 검증 → 회원가입
- [x] 가입 시 `isVerified: true` 즉시 설정 (이메일 인증 없음)
- [x] 로그인: `username` + 비밀번호 (email 기반 로그인 제거)
- [x] `coterie_admin` 유저네임은 예약어 (가입 불가)
- [x] JWT 세션에 `isAdmin`, `username`, `avatarUrl` 포함
- [x] 가입 시 초대 코드 3개 즉시 발급
- [x] name 필드 optional (가입/수정 모두)

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
- [x] 게시물 글 optional (이미지 있는 경우)
- [x] 글자 수 카운터 (500자 제한, 초과 시 빨간 표시)
- [x] 공개 범위 설정: 전체 공개(PUBLIC) / 친구 전용(FRIENDS) — 작성/수정 모두
- [x] 친구 전용 게시물 URL 직접 접근 차단 (비친구는 404)
- [x] 게시물 상세 페이지 공개 범위 배지 (시간 옆 표시)

### 댓글 / 대댓글

- [x] 댓글 작성 / 수정 / 삭제 (소프트 삭제)
- [x] 대댓글 (1단계 중첩)
- [x] 작성자 표시: `@username` 우선, 없으면 `name`
- [x] 댓글 작성자 이름 클릭 → 프로필 페이지 이동

### 좋아요

- [x] 게시물 좋아요 / 취소 (유저당 1회)
- [x] 좋아요 알림 (자기 자신 제외, 중복 방지)

### 알림

- [x] 알림 타입: 댓글, 좋아요, @멘션(게시물/댓글), 관리자 삭제, 친구 신청, 친구 수락
- [x] NavBar 알림 뱃지 (30초 폴링)
- [x] 알림 읽음 처리 / 전체 읽음
- [x] @멘션 파싱: `/@([a-z0-9_]{3,20})/gi`
- [x] 알림 목록에서 액터 이름 클릭 → 프로필 이동
- [x] 친구 신청 알림: PENDING 상태일 때만 수락/거절 버튼 표시
- [x] 알림 자동 정리: 20개 초과 시 오래된 것 삭제 (PENDING 친구 신청 알림 제외)
  - ACCEPTED/REJECTED된 친구 신청 알림은 정리 대상 포함
- [x] 친구 거절 / 친구 삭제 시 FRIEND_REQUEST 알림 자동 삭제

### 친구 시스템

- [x] 친구 신청 / 신청 취소 / 수락 / 거절
- [x] 친구 삭제
- [x] 친구 수 프로필에 표시 (클릭 시 친구 목록 모달)
- [x] 친구 목록 모달: 화면 중앙 표시, Luna XP 빨간 닫기 버튼
- [x] 친구 신청 상태별 버튼: Add friend / Cancel request / Friends / Respond
- [x] 친구 신청/수락 시 알림 생성 (FRIEND_REQUEST / FRIEND_ACCEPT)

### 피드

- [x] 피드 탭: All(전체 공개 게시물) / Friends(친구 전용 게시물, 친구+자신)
- [x] 탭 버튼: 작은 pill 형태, active = 파란 배경
- [x] Load more 페이지네이션

### 초대 코드

- [x] 가입 시 초대 코드 3개 즉시 지급
- [x] 내 초대 코드 목록 조회 (`/settings` 내 인라인 표시)
  - 기본 3개만 표시, 초과 시 Load more / Show less 버튼
  - used by: 이름 없는 계정은 username으로 fallback
- [x] 복사 버튼 → 가입 링크 클립보드 복사 (`/register?code=XXX`)
- [x] `/register?code=XXX` 접속 시 초대 코드 자동 입력

### 프로필

- [x] `/profile/[username]` — 타인/자신 프로필 페이지
  - 아바타, 이름, 유저네임, 가입일, 게시물 목록 표시
  - 본인 프로필: 카메라 버튼으로 아바타 직접 업로드
  - 본인 프로필: 타이틀바에 "edit" 버튼 → `/profile/edit`
  - 친구 수 표시, 클릭 시 친구 목록 모달
  - 친구 버튼: Add friend / Cancel request / Friends / Respond
  - 게시물 5개씩 cursor 기반 페이지네이션 (Load more)
  - 친구 전용 게시물: 비친구에게 숨김
  - 본인 게시물: 공개 범위 잠금 배지 표시
- [x] `/profile/me` — 세션 username으로 자동 리다이렉트
- [x] `/profile/edit` — 프로필 편집 전용 페이지
  - 프로필 사진 업로드 / 교체 / 제거 (null 저장 시 Cloudinary 삭제)
  - 이름 변경 (optional)
  - 유저네임 변경 (0.5초 디바운스 실시간 중복 확인, regex/예약어 검증)
  - 저장 성공 시 세션 avatarUrl 즉시 갱신 (`updateSession({ avatarUrl })`)
  - 저장 성공 시 해당 프로필 페이지로 자동 이동
- [x] 기본 프로필 이미지: `/public/default-profile.png`

### UI 컴포넌트

- [x] `PostCard`: 독립 XP 창, 타이틀바(아바타+작성자+시간), 상태바(좋아요·댓글)
  - 이미지 1/N 카운터 배지 (여러 장인 경우 우상단 표시)
  - 친구 전용 게시물 잠금 배지 (본인 게시물에 표시)
  - `MentionText` 적용 (본문 @멘션 파싱)
  - nested `<a>` 하이드레이션 오류 수정: `<Link>` → `<div onClick>`
- [x] `CommentItem`: 아바타(20px) + 유저네임, `MentionText` 적용
- [x] `MentionText`: 텍스트에서 `@username` 파싱 → 프로필 링크 `<a>` 렌더링
- [x] `Avatar`: 사이즈 가변, avatarUrl 없을 시 default 이미지
- [x] `ImageCarousel`: 터치 스와이프, smooth 전환, dot indicator
- [x] `PostForm`: visibility 토글(Globe/Users pill 버튼), 500자 카운터
- [x] `XpDialog`: XP 스타일 확인 다이얼로그

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
- [x] 내 초대 코드 목록 + 복사 (3개 기본, Load more / Show less)
- [x] 비밀번호 변경 (현재 비밀번호 확인 + PasswordStrengthBar)
- [x] 로그아웃
- [x] 사이트 소개 섹션

### NavBar

- [x] 헤더 전체 크기 ~50% 확대 (모바일 터치 영역 개선)
- [x] `showBack` 페이지: 헤더 정중앙에 **coterie** 링크 (absolute 중앙 배치) → `/feed`
- [x] 오른쪽 고정 아이콘: 프로필 · 관리자(ShieldCheck) · 알림(Bell)
  - 프로필 버튼: 세션에서 `avatarUrl` 직접 읽어 표시 (API 호출 없음)
  - 프로필 사진 있으면 아바타 이미지, 없으면 CircleUser 아이콘
- [x] 알림 뱃지 30초 폴링

### 디자인

- [x] Windows XP Luna 창 스타일 전면 적용
  - 진짜 Luna 그라디언트 타이틀바
  - `xp-window`, `xp-statusbar`, `xp-ctrl-btn`, `xp-ctrl-btn.close` (Luna 빨간 둥근 버튼)
  - XP 스타일 스크롤바
- [x] 외부 데스크탑 배경: `#3A7EC9` (Luna 블루)
- [x] iPhone 11 홈 바 `safe-area-inset-bottom` 적용

### 에러 페이지

- [x] `app/not-found.tsx` — 404
- [x] `app/error.tsx` — 런타임 에러 (XP 블루스크린)
- [x] `app/global-error.tsx` — 루트 레이아웃 에러

---

## 현재 라우트 구조

| 경로 | 유형 | 설명 |
|---|---|---|
| `/` | 정적 | 랜딩 (→ `/feed` 리다이렉트) |
| `/login` | 정적 | 로그인 (`?reset=1` 성공 메시지) |
| `/register` | 정적 | 회원가입 (`?code=` 자동 입력) |
| `/forgot-password` | 정적 | 비밀번호 재설정 요청 |
| `/reset-password` | 정적 | 새 비밀번호 입력 |
| `/feed` | 정적 | 피드 (All/Friends 탭) |
| `/post/new` | 정적 | 게시물 작성 |
| `/post/[id]` | 동적 | 게시물 상세 (공개 범위 배지 포함) |
| `/post/[id]/edit` | 동적 | 게시물 수정 |
| `/notifications` | 정적 | 알림 (친구 신청 수락/거절 포함) |
| `/settings` | 정적 | 설정 (테마·초대코드·비밀번호·로그아웃) |
| `/profile/me` | 정적 | 내 프로필 (→ `/profile/[username]` 리다이렉트) |
| `/profile/[username]` | 동적 | 유저 프로필 (친구 기능 포함) |
| `/profile/edit` | 정적 | 프로필 편집 (사진·이름·유저네임) |
| `/coterie-admin` | 정적 | 관리자 진입점 |
| `/coterie-admin/dashboard` | 정적 | 관리자 대시보드 |
| `/coterie-admin/users` | 정적 | 유저 목록 |
| `/coterie-admin/posts` | 정적 | 게시물 관리 |
| `/coterie-admin/comments` | 정적 | 댓글 관리 |
| `/coterie-admin/logs` | 정적 | 제재 로그 |

### 주요 API 엔드포인트

| Method | Endpoint | 설명 |
|---|---|---|
| GET/POST | `/api/posts` | 피드 조회(`?tab=all\|friends`), 게시물 작성 |
| GET/PUT/DELETE | `/api/posts/[id]` | 게시물 상세/수정/삭제 |
| POST/DELETE | `/api/posts/[id]/like` | 좋아요 추가/취소 |
| GET/POST | `/api/posts/[id]/comments` | 댓글 조회/작성 |
| PUT/DELETE | `/api/comments/[id]` | 댓글 수정/삭제 |
| GET | `/api/users/[username]` | 유저 프로필 + 게시물(cursor 기반) |
| GET | `/api/users/[username]/friends` | 유저 친구 목록 |
| GET/PUT | `/api/users/me` | 내 정보 조회/수정 |
| GET/POST | `/api/friends` | 친구 목록 조회 / 친구 신청 |
| PUT/DELETE | `/api/friends/[id]` | 친구 수락·거절 / 취소·삭제 |
| GET | `/api/friends/status` | `?targetId=` 친구 관계 상태 조회 |
| GET | `/api/notifications` | 알림 목록 (자동 정리 포함) |
| PUT | `/api/notifications/[id]/read` | 알림 읽음 처리 |
| PUT | `/api/notifications/read-all` | 전체 읽음 처리 |
| GET | `/api/invite/my-codes` | 내 초대 코드 목록 (usedBy.username 포함) |

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
| 계정 탈퇴 | 미구현 |
| 게시물 신고 | 미구현 |
| @멘션 자동완성 | 백엔드 파싱만 구현, 프론트 autocomplete UI 미구현 |
| Cloudinary 도메인 next.config 등록 | 현재 X박스 → 도메인 등록 시 해결 |

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
| edit/delete 버튼 본문 이동 | NavBar 오른쪽에 버튼 집중 시 모바일 overflow 발생 |
| NavBar avatarUrl → JWT 세션 저장 | 페이지 이동마다 `/api/users/me` 호출 방지. 변경 시 `updateSession({ avatarUrl })` 즉시 갱신 |
| 친구 알림 정리 기준 | PENDING 상태인 친구 신청 알림만 정리 제외. ACCEPTED/REJECTED는 정리 대상 포함 |
| nested `<a>` 수정 | PostCard `<Link>` → `<div onClick>` 교체로 MentionText `<a>` 중첩 하이드레이션 오류 해결 |

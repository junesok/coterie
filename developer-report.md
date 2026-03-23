# coterie — 개발 완료 보고서 (기획 에이전트 전달용)

**작성일:** 2026-03-23 (최초 2026-03-19, 세션 4 업데이트)
**작성자:** Development Agent
**수신:** Planning Agent

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 서비스명 | coterie |
| 설명 | 초대 코드 기반 완전 폐쇄형 프라이빗 소셜 커뮤니티 |
| 개발 기간 | 2026-03-19 ~ 2026-03-23 |
| 배포 URL | https://coterie-phi.vercel.app |
| GitHub | https://github.com/junesok/coterie (private) |
| 상태 | **MVP 배포 완료 + Post-MVP 기능 추가 완료** |

---

## 2. 기술 스택 (실제 적용)

| 영역 | 기술 | 버전 | 비고 |
|---|---|---|---|
| Framework | Next.js | 16.2.0 | App Router, Turbopack, TypeScript |
| Styling | Tailwind CSS | 4.x | XP CSS 변수 방식 커스텀 테마 |
| ORM | Prisma | 7.5.0 | `prisma-client` provider, `prisma.config.ts` 방식 |
| Database | Neon (PostgreSQL) | 17 | PrismaNeon 어댑터 (Driver Adapter 방식) |
| 인증 | NextAuth.js | 4.24.x | Credentials Provider, JWT 세션 (`username`, `isAdmin`, `avatarUrl` 포함) |
| 인증 게이트 | proxy.ts | — | Next.js 16에서 `middleware` → `proxy` 변경 |
| 이미지 저장 | Cloudinary | — | 무료 플랜 25GB, 브라우저 직접 업로드 방식 |
| 이미지 압축 | browser-image-compression | — | 클라이언트 업로드 전 압축 (max 1MB) |
| 이메일 | nodemailer + Gmail SMTP | — | App Password 방식 (포트 465 SSL) |
| 아이콘 | lucide-react | — | size=16~24, strokeWidth=1.5 |
| HTTP Client | Axios | — | 클라이언트 API 호출 |
| 시간 표시 | date-fns | — | `enUS` 로케일, 상대 시간 |
| 배포 | Vercel | — | GitHub 자동 배포 연동 |

> **핸드오프 문서 대비 실제 변경 사항:**
> - Prisma 7은 기존 `prisma-client-js` 방식이 아닌 **Driver Adapter 필수** → `@prisma/adapter-neon` 적용
> - Next.js 16은 `middleware.ts` → **`proxy.ts`** 로 파일명/함수명 변경
> - `ctx.params`는 Next.js 16에서 반드시 **`await`** 필요
> - Resend → **nodemailer + Gmail SMTP** 로 교체 (Resend 무료 플랜 커스텀 도메인 제약)

---

## 3. 구현된 기능 전체

### 3-1. 인증 플로우

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| 초대 코드 기반 회원가입 | ✅ | `COTERIE-XXXXXXXX` 포맷 검증 |
| 가입 즉시 활성화 | ✅ | `isVerified: true` 즉시 설정 (이메일 인증 제거) |
| 가입 시 초대 코드 3개 자동 발급 | ✅ | `lib/invite.ts` |
| 로그인 / 로그아웃 | ✅ | NextAuth JWT 세션, username 기반 |
| 비로그인 접근 차단 | ✅ | `proxy.ts` 전역 적용 |
| 비밀번호 재설정 | ✅ | 이메일 6자리 코드, 10분 만료 |
| name 필드 optional | ✅ | 가입/수정 모두 빈값 허용 |

### 3-2. 게시물

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| 게시물 작성 / 수정 / 삭제 | ✅ | 본인만 수정/삭제 가능 |
| 이미지 첨부 | ✅ | 최대 3장, Cloudinary 직접 업로드 |
| 이미지 삭제 동기화 | ✅ | 게시물/수정 시 Cloudinary 자동 삭제 |
| 글 내용 optional | ✅ | 이미지 있는 경우 본문 없이 작성 가능 |
| 500자 제한 + 카운터 | ✅ | 초과 시 빨간 표시, 등록 차단 |
| 공개 범위 설정 | ✅ | PUBLIC(전체) / FRIENDS(친구 전용) |
| 친구 전용 접근 차단 | ✅ | 비친구 URL 직접 접근 시 404 |
| 게시물 상세 공개 범위 배지 | ✅ | 시간 옆 Lock 배지 표시 |
| 이미지 캐러셀 | ✅ | 터치 스와이프, smooth 전환, 1/N 카운터 배지 |

### 3-3. 댓글 / 대댓글

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| 댓글 작성 / 인라인 수정 / 삭제 | ✅ | |
| 대댓글 (1단계 중첩) | ✅ | 답글에 답글 불가 |
| 소프트 삭제 | ✅ | 답글 있으면 `isDeleted=true`, 없으면 하드 삭제 |
| 작성자 아바타 표시 | ✅ | 20px 아바타 + 유저네임 |

### 3-4. 친구 시스템

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| 친구 신청 | ✅ | PENDING 상태 생성 + 알림 발송 |
| 친구 신청 취소 | ✅ | PENDING 삭제 + 알림 삭제 |
| 친구 수락 | ✅ | ACCEPTED 상태 + 알림 발송 |
| 친구 거절 | ✅ | REJECTED 상태 + FRIEND_REQUEST 알림 삭제 |
| 친구 삭제 | ✅ | 관계 삭제 + FRIEND_REQUEST 알림 삭제 |
| 친구 수 표시 | ✅ | 프로필 페이지, 클릭 시 친구 목록 모달 |
| 친구 목록 모달 | ✅ | 화면 중앙, Luna XP 빨간 닫기 버튼 |

### 3-5. 피드

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| All 탭 | ✅ | 모든 사용자의 PUBLIC 게시물 |
| Friends 탭 | ✅ | 친구+자신의 FRIENDS 게시물만 |
| 탭 UI | ✅ | 작은 pill 버튼, active = 파란 배경 |
| Load more 페이지네이션 | ✅ | 15개씩 |

### 3-6. 알림

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| COMMENT / LIKE / MENTION | ✅ | 자기 자신 제외, 중복 방지 |
| FRIEND_REQUEST | ✅ | 신청 시 생성 |
| FRIEND_ACCEPT | ✅ | 수락 시 생성 |
| ADMIN_DELETE_POST/COMMENT | ✅ | 관리자 삭제 시 |
| 수락/거절 버튼 | ✅ | PENDING 상태일 때만 표시 |
| 알림 자동 정리 | ✅ | 20개 초과 시 오래된 것 삭제 (PENDING 친구 신청 알림 제외) |
| 친구 거절/삭제 시 알림 정리 | ✅ | FRIEND_REQUEST 알림 자동 삭제 |
| NavBar 미읽음 뱃지 | ✅ | 30초 폴링 |

### 3-7. @멘션

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| 게시물/댓글 @멘션 파싱 | ✅ | 저장 시 username 조회 → 알림 생성 |
| @username 클릭 → 프로필 이동 | ✅ | `MentionText` 컴포넌트 |
| @멘션 자동완성 UI | ❌ | 백엔드 파싱만 구현 |

### 3-8. 프로필

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| 프로필 페이지 | ✅ | 아바타, 이름, 유저네임, 게시물 목록 |
| 프로필 편집 | ✅ | 사진, 이름(optional), 유저네임 |
| 게시물 Load more | ✅ | 5개씩 cursor 기반 페이지네이션 |
| 친구 전용 게시물 숨김 | ✅ | 비친구에게 표시 안 됨 |
| 공개 범위 배지 | ✅ | 본인 게시물에만 Lock 아이콘 표시 |

### 3-9. NavBar

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| 프로필 버튼 | ✅ | 사진 있으면 아바타 이미지, 없으면 CircleUser 아이콘 |
| avatarUrl 세션 캐시 | ✅ | API 호출 없이 JWT에서 직접 읽음 |
| 관리자 버튼 | ✅ | `isAdmin`일 때만 표시 |
| 알림 뱃지 | ✅ | 30초 폴링 |
| showBack 페이지 중앙 coterie 링크 | ✅ | `/feed` 이동 |

### 3-10. 초대 코드

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| 가입 시 3개 자동 발급 | ✅ | |
| 설정 페이지 목록 | ✅ | 3개 기본, 초과 시 Load more / Show less |
| used by fallback | ✅ | 이름 없으면 username 표시 |
| 가입 링크 복사 | ✅ | `/register?code=XXX` |

### 3-11. 관리자

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| 접근 제어 | ✅ | `proxy.ts` + `isAdmin` 세션 체크 |
| 대시보드 통계 | ✅ | 유저/게시물/댓글/신규 가입 |
| 초대 코드 직접 발급 | ✅ | 유저 없이 생성 가능 |
| 게시물/댓글 삭제 | ✅ | 사유 선택 + ModerationLog 기록 + 작성자 알림 |
| 유저 목록 | ✅ | |
| 제재 로그 | ✅ | ModerationLog 조회 |

### 3-12. UI/디자인

| 기능 | 구현 여부 |
|---|---|
| Windows XP Luna 테마 (라이트) | ✅ |
| Zune/Media Center 테마 (다크) | ✅ |
| xp-ctrl-btn.close (Luna 빨간 둥근 버튼) | ✅ |
| 모바일 390px 컨테이너 | ✅ |
| safe-area-inset 적용 | ✅ |

---

## 4. 전체 라우트 목록

### 페이지

| Route | 설명 | Auth |
|---|---|---|
| `/login` | 로그인 | 불필요 |
| `/register` | 초대 코드 기반 회원가입 | 불필요 |
| `/forgot-password` | 비밀번호 재설정 요청 | 불필요 |
| `/reset-password` | 새 비밀번호 입력 | 불필요 |
| `/feed` | 게시물 피드 (All/Friends 탭) | 필수 |
| `/post/new` | 게시물 작성 | 필수 |
| `/post/[id]` | 게시물 상세 + 댓글 | 필수 |
| `/post/[id]/edit` | 게시물 수정 | 필수 + 본인 |
| `/notifications` | 알림 | 필수 |
| `/settings` | 테마/초대코드/비밀번호/로그아웃 | 필수 |
| `/profile/me` | 내 프로필 (리다이렉트) | 필수 |
| `/profile/[username]` | 유저 프로필 | 필수 |
| `/profile/edit` | 프로필 편집 | 필수 |
| `/coterie-admin/*` | 관리자 페이지 | 필수 + isAdmin |

### API

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/auth/register` | 회원가입 |
| GET | `/api/auth/check-username` | 유저네임 중복 확인 |
| POST | `/api/auth/forgot-password` | 비밀번호 재설정 코드 발송 |
| POST | `/api/auth/reset-password` | 새 비밀번호 저장 |
| POST | `/api/upload/sign` | Cloudinary 서명 발급 |
| GET/POST | `/api/posts` | 피드 조회 (`?tab=all\|friends`) / 작성 |
| GET/PUT/DELETE | `/api/posts/[id]` | 게시물 상세/수정/삭제 |
| POST/DELETE | `/api/posts/[id]/like` | 좋아요 추가/취소 |
| GET/POST | `/api/posts/[id]/comments` | 댓글 조회/작성 |
| PUT/DELETE | `/api/comments/[id]` | 댓글 수정/삭제 |
| GET | `/api/users/[username]` | 유저 프로필 + cursor 기반 게시물 |
| GET | `/api/users/[username]/friends` | 유저 친구 목록 |
| GET/PUT | `/api/users/me` | 내 정보 조회/수정 |
| GET/POST | `/api/friends` | 친구 목록 / 친구 신청 |
| PUT/DELETE | `/api/friends/[id]` | 친구 수락·거절 / 취소·삭제 |
| GET | `/api/friends/status` | 친구 관계 상태 조회 |
| GET | `/api/notifications` | 알림 목록 (자동 정리) |
| PUT | `/api/notifications/[id]/read` | 알림 읽음 처리 |
| PUT | `/api/notifications/read-all` | 전체 읽음 처리 |
| GET | `/api/invite/my-codes` | 내 초대 코드 목록 |

---

## 5. DB 스키마 (배포 적용 완료)

```
User
  id, email, name, passwordHash, isVerified, isAdmin
  username, avatarUrl, theme
  → inviteCodes[], posts[], comments[], likes[]
  → notifications[], friendsSent[], friendsReceived[]

InviteCode
  id, code (COTERIE-XXXXXXXX), ownerId, usedById, isUsed, usedAt

PasswordReset
  id, userId, code (6자리), expiresAt, usedAt

Post
  id, content, authorId, visibility (PUBLIC|FRIENDS)
  createdAt, updatedAt
  → images (PostImage[]), comments[], likes[]

PostImage
  id, postId, url, publicId (Cloudinary), order

Comment
  id, postId, authorId, parentId (self-reference)
  content (nullable), isDeleted, isEdited
  → replies (Comment[])

Like
  id, postId, userId
  @@unique([postId, userId])

Notification
  id, type (NotificationType), userId, actorId
  postId?, commentId?, reason?, friendshipId?
  isRead, createdAt

ModerationLog
  id, targetType (POST|COMMENT), targetId
  reason (ModerationReason), adminId, createdAt

Friendship
  id, senderId, receiverId, status (PENDING|ACCEPTED|REJECTED)
  createdAt, updatedAt
  @@unique([senderId, receiverId])

Enum NotificationType:
  COMMENT, LIKE, MENTION_POST, MENTION_COMMENT,
  ADMIN_DELETE_POST, ADMIN_DELETE_COMMENT,
  FRIEND_REQUEST, FRIEND_ACCEPT

Enum PostVisibility: PUBLIC, FRIENDS
Enum FriendshipStatus: PENDING, ACCEPTED, REJECTED
Enum ModerationTarget: POST, COMMENT
Enum ModerationReason: SEXUAL_CONTENT, HATE_SPEECH, SPAM, VIOLENCE, PRIVACY_VIOLATION, OTHER
```

---

## 6. 파일 구조

```
coterie/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    NextAuth 핸들러
│   │   ├── auth/register/         회원가입
│   │   ├── auth/check-username/   유저네임 중복 확인
│   │   ├── auth/forgot-password/  비밀번호 재설정 요청
│   │   ├── auth/reset-password/   새 비밀번호 저장
│   │   ├── comments/[id]/         댓글 수정/삭제
│   │   ├── friends/               친구 목록 / 신청
│   │   ├── friends/[id]/          친구 수락·거절·취소·삭제
│   │   ├── friends/status/        친구 관계 상태 조회
│   │   ├── invite/my-codes/       초대 코드 조회
│   │   ├── notifications/         알림 목록
│   │   ├── notifications/[id]/read/    알림 읽음
│   │   ├── notifications/read-all/     전체 읽음
│   │   ├── posts/                 피드 + 작성
│   │   ├── posts/[id]/            상세/수정/삭제
│   │   ├── posts/[id]/comments/   댓글 조회/작성
│   │   ├── posts/[id]/like/       좋아요
│   │   ├── upload/sign/           Cloudinary 서명 발급
│   │   ├── users/[username]/      유저 프로필 + 게시물
│   │   ├── users/[username]/friends/  친구 목록
│   │   └── users/me/              내 정보 조회/수정
│   ├── coterie-admin/             관리자 페이지 (dashboard, users, posts, comments, logs)
│   ├── feed/                      피드 (All/Friends 탭)
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── notifications/
│   ├── post/[id]/                 게시물 상세
│   ├── post/[id]/edit/            게시물 수정
│   ├── post/new/
│   ├── profile/[username]/        유저 프로필 (친구 기능 포함)
│   ├── profile/edit/              프로필 편집
│   ├── profile/me/                → 내 프로필 리다이렉트
│   ├── settings/
│   ├── globals.css                XP 테마 CSS 변수
│   └── layout.tsx
├── components/
│   ├── Avatar.tsx                 사이즈 가변 아바타
│   ├── CommentItem.tsx            댓글 아이템 (아바타, MentionText)
│   ├── ImageCarousel.tsx          이미지 캐러셀 (smooth, 1/N 배지)
│   ├── ImageUploader.tsx          이미지 업로드 + 압축
│   ├── MentionText.tsx            @username → 프로필 링크 렌더링
│   ├── NavBar.tsx                 XP 타이틀바 네비게이션
│   ├── PostCard.tsx               피드 카드 (공개 범위 배지, MentionText)
│   ├── PostForm.tsx               게시물 작성/수정 폼 (visibility, 500자 카운터)
│   ├── ThemeToggle.tsx
│   ├── XpDialog.tsx               XP 스타일 확인 다이얼로그
│   └── providers.tsx
├── lib/
│   ├── auth.ts                    NextAuth 설정 (avatarUrl JWT 포함)
│   ├── mailer.ts                  nodemailer Gmail SMTP
│   ├── invite.ts                  초대 코드 생성 유틸
│   └── prisma.ts                  Prisma 클라이언트 싱글톤
├── types/
│   └── next-auth.d.ts             세션 타입 확장 (username, isAdmin, avatarUrl)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── proxy.ts                       인증 게이트 (Next.js 16)
├── prisma.config.ts
├── next.config.ts
├── dev-progress.md                개발 진행 보고서
└── DEPLOYMENT.md                  배포 가이드
```

---

## 7. 인프라 구성

```
사용자 (모바일 390px)
    │
    ▼
Vercel (Next.js 16, Turbopack)
    ├── proxy.ts → 비로그인 시 /login 리다이렉트
    ├── Route Handlers → API 처리
    │
    ├── Neon PostgreSQL 17 (ap-southeast-1, Singapore)
    │     └── Prisma 7 + PrismaNeon Driver Adapter
    │
    ├── Cloudinary (이미지 CDN, 25GB 무료)
    │     └── 브라우저 직접 업로드 (서버 경유 없음)
    │
    └── Gmail SMTP (비밀번호 재설정 이메일)
```

---

## 8. 환경 변수 (Vercel 등록 완료)

| 변수명 | 설명 | 상태 |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL 연결 (pooling) | ✅ 등록 |
| `DIRECT_URL` | Neon PostgreSQL 직접 연결 (마이그레이션용) | ✅ 등록 |
| `NEXTAUTH_URL` | 배포 도메인 URL | ✅ 등록 |
| `NEXTAUTH_SECRET` | JWT 서명 시크릿 | ✅ 등록 |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary 클라우드명 | ✅ 등록 |
| `CLOUDINARY_API_KEY` | Cloudinary API 키 | ✅ 등록 |
| `CLOUDINARY_API_SECRET` | Cloudinary API 시크릿 | ✅ 등록 |
| `SMTP_HOST` | Gmail SMTP 호스트 | ✅ 등록 |
| `SMTP_PORT` | 465 | ✅ 등록 |
| `SMTP_USER` | Gmail 계정 | ✅ 등록 |
| `SMTP_PASS` | Gmail App Password | ✅ 등록 |
| `SMTP_FROM` | 발신 이메일 | ✅ 등록 |
| `ADMIN_PASSWORD` | coterie_admin 초기 비밀번호 | ✅ 등록 |

---

## 9. 미구현 항목 (향후 개발 후보)

| 기능 | 우선순위 | 비고 |
|---|---|---|
| @멘션 자동완성 UI | 높음 | 백엔드 파싱은 완료, 프론트 autocomplete UI만 미구현 |
| Cloudinary 도메인 next.config 등록 | 높음 | 미등록 시 `<img>` X박스 → domains 배열에 `res.cloudinary.com` 추가 필요 |
| 무한 스크롤 | 중간 | 현재 "Load more" 버튼 방식 |
| 푸시 알림 | 중간 | 현재 30초 폴링 방식 (Vercel 무료 플랜 WebSocket 불가) |
| 계정 탈퇴 | 중간 | 미구현 |
| 게시물 신고 | 낮음 | 미구현 |

---

## 10. 주요 설계 결정 사항

| 결정 | 이유 |
|---|---|
| 이메일 인증 제거 | Resend 무료 플랜은 소유 도메인 이메일로만 발송 가능 |
| nodemailer + Gmail SMTP | 비밀번호 재설정 이메일 발송용, App Password 방식 |
| Cloudinary 브라우저 직접 업로드 | Vercel 서버리스 4.5MB 바디 제한 + SDK 호환성 문제 우회 |
| `proxy.ts` 사용 | Next.js 16에서 `middleware.ts` 미지원 |
| `prisma migrate deploy` 수동 | Vercel 빌드 환경이 비대화형 |
| avatarUrl JWT 세션 캐시 | 페이지 이동마다 `/api/users/me` 호출 방지. `updateSession({ avatarUrl })` 즉시 갱신 |
| 친구 알림 20개 정리 기준 | PENDING 상태인 친구 신청 알림만 제외. 처리된 친구 신청(ACCEPTED/REJECTED) 알림은 정리 대상 포함 |
| nested `<a>` 수정 | PostCard `<Link>` → `<div onClick>` 교체로 MentionText `<a>` 중첩 하이드레이션 오류 해결 |
| 피드 탭 분리 | All = PUBLIC 전체 / Friends = FRIENDS 게시물 (친구+자신) |

---

## 11. 배포 트러블슈팅 기록

### [2026-03-19] Vercel 빌드 에러 — Prisma 클라이언트 누락

**원인:** Prisma 7은 클라이언트를 `app/generated/prisma/`에 생성하는데, 해당 경로가 `.gitignore`에 포함되어 Vercel 빌드 시 클라이언트가 없는 상태로 빌드 실행.

**해결:** `package.json`에 `postinstall: "prisma generate"` 스크립트 추가.

### [2026-03-22] Cloudinary 이미지 X박스

**원인:** Next.js `<Image>` 컴포넌트는 `next.config.ts`의 `images.domains`에 등록된 도메인만 최적화 처리. `res.cloudinary.com` 미등록 시 X박스.

**해결 방법 (미적용):** `next.config.ts`에 아래 추가:
```ts
images: {
  domains: ["res.cloudinary.com"],
}
```
현재는 `<img>` 태그 직접 사용으로 우회 중.

# coterie — Developer Handoff

**Version:** 1.0
**Date:** 2026-03-19
**Status:** Confirmed

---

## 1. Project Summary

초대 코드 기반의 완전 폐쇄형 프라이빗 소셜 커뮤니티. 로그인하지 않으면 어떤 페이지도 열람 불가. 초대 코드 인증을 완료한 사용자만 가입 가능. 이미지 첨부 게시물과 댓글/답글 기능을 제공하며, Windows XP 노스탤지어 디자인의 모바일 전용 UI를 갖는다.

---

## 2. Key Features

- **완전 비공개**: 미들웨어에서 비로그인 시 /login 강제 리다이렉트
- **초대 코드 시스템**: 계정당 코드 3개 자동 발급. 코드 사용 시 이메일 인증 필수
- **게시물 CRUD**: 텍스트 + 이미지 최대 3장. 업로드 전 클라이언트 압축
- **댓글/답글 CRUD**: 수정 시 isEdited 플래그. 답글 있는 댓글 삭제 시 내용 null 처리 + isDeleted 플래그
- **라이트/다크 모드**: next-themes 사용
- **모바일 전용 레이아웃**: max-width 390px 고정 컨테이너

---

## 3. Core Pages & Routes

| Route | 설명 | Auth |
|---|---|---|
| `/login` | 로그인 | 불필요 |
| `/register` | 초대 코드 + 이메일 인증 가입 | 불필요 |
| `/verify-email` | 이메일 인증 안내 | 불필요 |
| `/feed` | 게시물 피드 (최신순) | 필수 |
| `/post/new` | 게시물 작성 | 필수 |
| `/post/[id]` | 게시물 상세 + 댓글 | 필수 |
| `/post/[id]/edit` | 게시물 수정 | 필수 + 본인 |
| `/profile/[userId]` | 유저 프로필 + 게시물 | 필수 |
| `/profile/me/invite` | 내 초대 코드 관리 | 필수 |
| `/settings` | 테마/계정 설정 | 필수 |

**미들웨어 처리**: `middleware.ts`에서 세션 확인 후 비인증 요청을 /login으로 redirect.

---

## 4. Database Schema (Prisma)

```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String
  passwordHash String
  isVerified   Boolean   @default(false)
  invitedById  String?
  invitedBy    User?     @relation("InvitedBy", fields: [invitedById], references: [id])
  invitees     User[]    @relation("InvitedBy")
  inviteCodes  InviteCode[] @relation("Owner")
  usedCode     InviteCode?  @relation("UsedBy")
  posts        Post[]
  comments     Comment[]
  createdAt    DateTime  @default(now())
}

model InviteCode {
  id        String    @id @default(cuid())
  code      String    @unique
  owner     User      @relation("Owner", fields: [ownerId], references: [id])
  ownerId   String
  usedBy    User?     @relation("UsedBy", fields: [usedById], references: [id])
  usedById  String?   @unique
  isUsed    Boolean   @default(false)
  createdAt DateTime  @default(now())
  usedAt    DateTime?
}

model EmailVerification {
  id        String    @id @default(cuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
}

model Post {
  id        String      @id @default(cuid())
  content   String
  author    User        @relation(fields: [authorId], references: [id])
  authorId  String
  images    PostImage[]
  comments  Comment[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

model PostImage {
  id        String   @id @default(cuid())
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  url       String
  order     Int
  createdAt DateTime @default(now())
}

model Comment {
  id        String    @id @default(cuid())
  post      Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  parent    Comment?  @relation("Replies", fields: [parentId], references: [id])
  parentId  String?
  replies   Comment[] @relation("Replies")
  content   String?
  isDeleted Boolean   @default(false)
  isEdited  Boolean   @default(false)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

---

## 5. API Overview

### Auth

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/auth/register` | 회원가입 (초대 코드 + 이메일 인증 메일 발송) |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/logout` | 로그아웃 |
| GET | `/api/auth/verify-email?token=` | 이메일 인증 토큰 확인 |
| POST | `/api/auth/verify-invite-code` | 초대 코드 유효성 확인 |

### Posts

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/posts?page=1` | 피드 목록 (최신순, 페이지네이션) |
| POST | `/api/posts` | 게시물 작성 |
| GET | `/api/posts/[id]` | 게시물 상세 |
| PUT | `/api/posts/[id]` | 게시물 수정 (본인만) |
| DELETE | `/api/posts/[id]` | 게시물 삭제 (본인만) |

### Images

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/upload/image` | Cloudinary 이미지 업로드 (최대 3장) |

### Comments

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/posts/[id]/comments` | 댓글 + 답글 목록 |
| POST | `/api/posts/[id]/comments` | 댓글 또는 답글 작성 (parentId 있으면 답글) |
| PUT | `/api/comments/[id]` | 댓글 수정 (isEdited = true) |
| DELETE | `/api/comments/[id]` | 댓글 삭제 (답글 있으면 소프트 삭제, 없으면 하드 삭제) |

### Invite Codes

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/invite/my-codes` | 내 초대 코드 3개 + 사용 현황 |

### Users

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/users/[id]` | 유저 프로필 + 게시물 목록 |
| PUT | `/api/users/me` | 이름 / 비밀번호 변경 |

---

## 6. Tech Stack

| 영역 | 기술 | 비고 |
|---|---|---|
| Framework | Next.js 14+ (App Router) | TypeScript |
| Styling | Tailwind CSS | XP 커스텀 테마 확장 |
| UI 컴포넌트 | shadcn/ui + 커스텀 XP 스타일 | |
| 아이콘 | lucide-react | size=16, strokeWidth=1.5 |
| HTTP Client | Axios | 인터셉터로 토큰 자동 첨부 |
| ORM | Prisma | |
| Database | Neon (PostgreSQL) | 무료 플랜 |
| 이미지 저장 | Cloudinary | 무료 플랜, 25GB |
| 이미지 압축 | browser-image-compression | 클라이언트 업로드 전 압축 |
| 인증 | NextAuth.js (Credentials Provider) | |
| 테마 관리 | next-themes | |
| 이메일 | Resend | 무료 100건/일 |
| 배포 | Vercel | |
| 버전 관리 | GitHub | Vercel 자동 배포 연동 |

---

## 7. MVP Scope

**포함**

- 초대 코드 기반 회원가입 + 이메일 인증
- 로그인 / 로그아웃
- 미들웨어 기반 비로그인 접근 차단
- 게시물 CRUD (이미지 최대 3장 + 압축)
- 피드 페이지 (최신순)
- 게시물 상세 페이지
- 댓글 / 답글 CRUD (수정됨 표기, 삭제 소프트/하드 처리)
- 라이트 / 다크 모드
- 초대 코드 현황 페이지
- 계정 설정 (이름, 비밀번호 변경)

**MVP 이후**

- 좋아요 / 반응
- 알림 (새 댓글, 답글)
- 관리자 페이지
- 프로필 이미지 업로드
- 애드센스 연동

---

## 8. Development Priority

```
1단계 — 기반 구축
  1. Prisma 스키마 + Neon DB 연결
  2. NextAuth.js Credentials Provider 설정
  3. 미들웨어: 비로그인 → /login 리다이렉트

2단계 — 인증 플로우
  4. 회원가입 시 초대 코드 3개 자동 생성 로직
  5. 회원가입 API (초대 코드 검증 + 이메일 인증 메일 발송)
  6. Resend 이메일 인증 연동
  7. 로그인 / 로그아웃

3단계 — 핵심 기능
  8. Cloudinary 이미지 업로드 API
  9. browser-image-compression 클라이언트 압축 적용
  10. 게시물 CRUD API + 피드/상세/작성 페이지

4단계 — 소셜 기능
  11. 댓글 / 답글 CRUD API
  12. 수정됨(isEdited) / 삭제됨(isDeleted) 처리 로직
  13. 댓글 포함 게시물 상세 페이지 완성

5단계 — UI 마무리
  14. Tailwind XP 커스텀 테마 적용
  15. 라이트 / 다크 모드 (next-themes)
  16. 초대 코드 관리 페이지
  17. 설정 페이지
  18. 전체 UI QA (모바일 390px 기준)
```

---

## 9. 주요 구현 주의사항

**댓글 삭제 처리**
답글(replies)이 존재하는 댓글은 하드 삭제 금지. `isDeleted = true`, `content = null`로 소프트 삭제. 답글이 없는 경우 DB에서 하드 삭제 가능.

**초대 코드 발급 시점**
회원가입 완료(이메일 인증 확인) 시점에 서버에서 코드 3개를 자동 생성. 코드 포맷 예시: `COTERIE-XXXXXXXX` (cuid 기반 8자리 대문자).

**이미지 업로드 순서**
1. 클라이언트에서 `browser-image-compression`으로 압축
2. `/api/upload/image`로 전송
3. 서버에서 Cloudinary에 업로드 후 URL 반환
4. 반환된 URL을 Post 생성 요청에 포함

**인증 흐름**
이메일 인증 완료(`isVerified = true`) 전에는 로그인 불가 처리. NextAuth의 `authorize` 콜백에서 `isVerified` 체크 필수.

**레이아웃 고정**
`app/layout.tsx`의 최상위에서 `max-w-[390px] mx-auto` 컨테이너 적용. PC 좌우 배경은 `body` 또는 outer wrapper에서 처리.

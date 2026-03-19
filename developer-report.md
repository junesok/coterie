# coterie — 개발 완료 보고서 (기획 에이전트 전달용)

**작성일:** 2026-03-19
**작성자:** Development Agent
**수신:** Planning Agent

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 서비스명 | coterie |
| 설명 | 초대 코드 기반 완전 폐쇄형 프라이빗 소셜 커뮤니티 |
| 개발 기간 | 2026-03-19 |
| 배포 URL | https://coterie-phi.vercel.app |
| GitHub | https://github.com/junesok/coterie (private) |
| 상태 | **MVP 배포 완료** |

---

## 2. 기술 스택 (실제 적용)

| 영역 | 기술 | 버전 | 비고 |
|---|---|---|---|
| Framework | Next.js | 16.2.0 | App Router, Turbopack, TypeScript |
| Styling | Tailwind CSS | 4.x | XP CSS 변수 방식 커스텀 테마 |
| ORM | Prisma | 7.5.0 | `prisma-client` provider, `prisma.config.ts` 방식 |
| Database | Neon (PostgreSQL) | 17 | PrismaNeon 어댑터 (Driver Adapter 방식) |
| 인증 | NextAuth.js | 4.24.x | Credentials Provider, JWT 세션 |
| 인증 게이트 | proxy.ts | — | Next.js 16에서 `middleware` → `proxy` 변경 |
| 이미지 저장 | Cloudinary | — | 무료 플랜 25GB |
| 이미지 압축 | browser-image-compression | — | 클라이언트 업로드 전 압축 (max 1MB) |
| 이메일 | Resend | — | 무료 100건/일 |
| 테마 | next-themes | 0.4.x | `class` attribute 방식 |
| 아이콘 | lucide-react | — | size=16, strokeWidth=1.5 |
| HTTP Client | Axios | — | 클라이언트 API 호출 |
| 시간 표시 | date-fns | — | 한국어 상대 시간 |
| 배포 | Vercel | — | GitHub 자동 배포 연동 |

> **핸드오프 문서 대비 실제 변경 사항:**
> - Prisma 7은 기존 `prisma-client-js` 방식이 아닌 **Driver Adapter 필수** → `@prisma/adapter-neon` 적용
> - Next.js 16은 `middleware.ts` → **`proxy.ts`** 로 파일명/함수명 변경
> - `ctx.params`는 Next.js 16에서 반드시 **`await`** 필요

---

## 3. 구현된 기능 (MVP 전체 완료)

### 3-1. 인증 플로우

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| 초대 코드 기반 회원가입 | ✅ | `COTERIE-XXXXXXXX` 포맷 검증 |
| 이메일 인증 | ✅ | Resend + 24시간 토큰 |
| 이메일 인증 완료 시 초대 코드 3개 자동 발급 | ✅ | `lib/invite.ts` |
| 로그인 / 로그아웃 | ✅ | NextAuth JWT 세션 |
| 미인증 유저 로그인 차단 | ✅ | `isVerified` 체크 |
| 비로그인 접근 차단 | ✅ | `proxy.ts` 전역 적용 |

### 3-2. 게시물

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| 게시물 작성 | ✅ | 텍스트 + 이미지 최대 3장 |
| 게시물 수정 | ✅ | 본인만, 이미지 교체 가능 |
| 게시물 삭제 | ✅ | 본인만, XP 확인 다이얼로그 |
| 피드 (최신순) | ✅ | 페이지네이션 (15개씩) |
| 이미지 클라이언트 압축 | ✅ | 업로드 전 자동 압축 |
| Cloudinary 업로드 | ✅ | 서버사이드 업로드 |
| 이미지 캐러셀 | ✅ | 터치 스와이프 + dot indicator |

### 3-3. 댓글 / 답글

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| 댓글 작성 | ✅ | 하단 고정 입력창 |
| 답글 작성 | ✅ | 1단계 중첩, 답글에 답글 불가 |
| 댓글 인라인 수정 | ✅ | `isEdited = true` 플래그 |
| 댓글 삭제 | ✅ | 소프트/하드 삭제 분기 처리 |
| 소프트 삭제 | ✅ | 답글 있으면 `isDeleted=true`, `content=null` |
| 하드 삭제 | ✅ | 답글 없으면 DB에서 완전 제거 |
| "수정됨" 표기 | ✅ | `(수정됨)` 텍스트 표시 |
| "삭제된 댓글" 표시 | ✅ | 회색 이탤릭 처리 |

### 3-4. UI / 테마

| 기능 | 구현 여부 | 비고 |
|---|---|---|
| Windows XP Luna 라이트 테마 | ✅ | CSS 변수 전체 적용 |
| Zune/Media Center 다크 테마 | ✅ | `.dark` 클래스 전환 |
| 라이트/다크 모드 토글 | ✅ | next-themes, Sun/Moon 아이콘 |
| 모바일 전용 390px 컨테이너 | ✅ | `max-w-[390px] mx-auto` |
| XP 3D 버튼 (.xp-btn) | ✅ | raised/inset box-shadow |
| XP inset 인풋 (.xp-input) | ✅ | inset box-shadow + focus outline |
| XP 타이틀바 (.xp-titlebar) | ✅ | 그라디언트 배경 |
| XP 창 프레임 (.xp-window) | ✅ | 로그인/회원가입 등 |
| XP 수평선 (.xp-hr) | ✅ | raised/inset 2px 선 |

### 3-5. 기타 페이지

| 페이지 | 구현 여부 |
|---|---|
| 초대 코드 관리 (`/profile/me/invite`) | ✅ |
| 계정 설정 (`/settings`) | ✅ |
| 이름 / 비밀번호 변경 | ✅ |

---

## 4. 전체 라우트 목록

### 페이지

| Route | 설명 | Auth |
|---|---|---|
| `/login` | 로그인 | 불필요 |
| `/register` | 초대 코드 기반 회원가입 | 불필요 |
| `/verify-email` | 이메일 인증 안내 | 불필요 |
| `/feed` | 게시물 피드 (최신순) | 필수 |
| `/post/new` | 게시물 작성 | 필수 |
| `/post/[id]` | 게시물 상세 + 댓글 | 필수 |
| `/post/[id]/edit` | 게시물 수정 | 필수 + 본인 |
| `/profile/me/invite` | 초대 코드 관리 | 필수 |
| `/settings` | 테마/이름/비밀번호/로그아웃 | 필수 |

### API

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | NextAuth 내부 처리 |
| GET | `/api/auth/verify-email` | 이메일 토큰 인증 |
| POST | `/api/auth/verify-invite-code` | 초대 코드 유효성 확인 |
| POST | `/api/upload/image` | Cloudinary 이미지 업로드 |
| GET | `/api/posts` | 피드 목록 (페이지네이션) |
| POST | `/api/posts` | 게시물 작성 |
| GET | `/api/posts/[id]` | 게시물 상세 |
| PUT | `/api/posts/[id]` | 게시물 수정 |
| DELETE | `/api/posts/[id]` | 게시물 삭제 |
| GET | `/api/posts/[id]/comments` | 댓글 + 답글 목록 |
| POST | `/api/posts/[id]/comments` | 댓글/답글 작성 |
| PUT | `/api/comments/[id]` | 댓글 수정 |
| DELETE | `/api/comments/[id]` | 댓글 삭제 |
| GET | `/api/invite/my-codes` | 내 초대 코드 현황 |
| PUT | `/api/users/me` | 이름/비밀번호 변경 |

---

## 5. DB 스키마 (배포 적용 완료)

```
User
  id, email, name, passwordHash, isVerified
  invitedById (self-reference)
  → inviteCodes (InviteCode[])
  → posts (Post[])
  → comments (Comment[])

InviteCode
  id, code (COTERIE-XXXXXXXX), ownerId, usedById, isUsed, usedAt

EmailVerification
  id, userId, token, expiresAt, usedAt

Post
  id, content, authorId
  → images (PostImage[])
  → comments (Comment[])

PostImage
  id, postId, url, order

Comment
  id, postId, authorId, parentId (self-reference)
  content (nullable), isDeleted, isEdited
  → replies (Comment[])
```

---

## 6. 파일 구조

```
coterie/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    NextAuth 핸들러
│   │   ├── auth/register/         회원가입
│   │   ├── auth/verify-email/     이메일 인증
│   │   ├── auth/verify-invite-code/
│   │   ├── comments/[id]/         댓글 수정/삭제
│   │   ├── invite/my-codes/       초대 코드 조회
│   │   ├── posts/                 피드 + 작성
│   │   ├── posts/[id]/            상세/수정/삭제
│   │   ├── posts/[id]/comments/   댓글 조회/작성
│   │   ├── upload/image/          Cloudinary 업로드
│   │   └── users/me/              프로필 수정
│   ├── feed/                      피드 페이지
│   ├── login/                     로그인 페이지
│   ├── register/                  회원가입 페이지
│   ├── verify-email/              이메일 인증 안내
│   ├── post/[id]/                 게시물 상세
│   ├── post/[id]/edit/            게시물 수정
│   ├── post/new/                  게시물 작성
│   ├── profile/me/invite/         초대 코드 관리
│   ├── settings/                  설정
│   ├── generated/prisma/          Prisma 7 생성 클라이언트
│   ├── globals.css                XP 테마 CSS 변수
│   └── layout.tsx                 루트 레이아웃 (Providers 포함)
├── components/
│   ├── CommentItem.tsx            댓글 아이템 (인라인 편집, 삭제)
│   ├── ImageCarousel.tsx          이미지 캐러셀 (터치 스와이프)
│   ├── ImageUploader.tsx          이미지 업로드 (압축 + 미리보기)
│   ├── NavBar.tsx                 XP 타이틀바 네비게이션
│   ├── PostCard.tsx               피드 카드
│   ├── PostForm.tsx               게시물 작성/수정 공용 폼
│   ├── ThemeToggle.tsx            라이트/다크 토글
│   ├── XpDialog.tsx               XP 스타일 확인 다이얼로그
│   └── providers.tsx              SessionProvider + ThemeProvider
├── lib/
│   ├── auth.ts                    NextAuth 설정
│   ├── email.ts                   Resend 이메일 발송
│   ├── invite.ts                  초대 코드 생성 유틸
│   └── prisma.ts                  Prisma 클라이언트 싱글톤
├── types/
│   └── next-auth.d.ts             세션 타입 확장
├── prisma/
│   ├── schema.prisma              DB 스키마
│   └── migrations/                마이그레이션 파일
├── proxy.ts                       인증 게이트 (Next.js 16)
├── prisma.config.ts               Prisma 7 설정
├── next.config.ts                 Turbopack root 설정
├── SETUP.md                       서비스 계정 및 환경 변수 문서
└── DEPLOYMENT.md                  배포 가이드
```

---

## 7. 인프라 구성

```
사용자 (모바일 390px)
    │
    ▼
Vercel (Next.js 16, Turbopack, iad1 - 워싱턴)
    ├── proxy.ts → 비로그인 시 /login 리다이렉트
    ├── Route Handlers → API 처리
    │
    ├── Neon PostgreSQL 17 (ap-southeast-1, Singapore)
    │     └── Prisma 7 + PrismaNeon Driver Adapter
    │
    ├── Cloudinary (이미지 CDN, 25GB 무료)
    │
    └── Resend (이메일, 100건/일 무료)
```

---

## 8. 환경 변수 (Vercel 등록 완료)

| 변수명 | 설명 | 상태 |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL 연결 문자열 | ✅ 등록 |
| `NEXTAUTH_URL` | 배포 도메인 URL | ✅ 등록 |
| `NEXTAUTH_SECRET` | JWT 서명 시크릿 | ✅ 등록 |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary 클라우드명 | ✅ 등록 |
| `CLOUDINARY_API_KEY` | Cloudinary API 키 | ✅ 등록 |
| `CLOUDINARY_API_SECRET` | Cloudinary API 시크릿 | ✅ 등록 |
| `RESEND_API_KEY` | Resend API 키 | ✅ 등록 |
| `RESEND_FROM_EMAIL` | 발신 이메일 | ✅ 등록 |

---

## 9. Git 커밋 히스토리

```
2e631ef  chore: 배포 준비 완료 — DEPLOYMENT.md 추가
212b8ff  feat: UI 마무리 — 테마/초대코드/설정 페이지 (5단계)
deff55c  feat: 댓글/답글 CRUD 구현 (4단계)
0a48487  feat: 게시물 CRUD + Cloudinary 이미지 업로드 (3단계)
ba8196e  feat: 인증 플로우 구현 (1단계 + 2단계)
b48edb7  chore: 프로젝트 초기 세팅 — Next.js 16, Prisma 7, 환경 변수 구성
```

---

## 10. MVP 이후 개발 예정 기능 (기획 에이전트 참고)

핸드오프 문서 기준 MVP 이후 항목 — 아직 미구현:

| 기능 | 우선순위 | 비고 |
|---|---|---|
| 좋아요 / 반응 | 중 | Post에 likes 관계 추가 필요 |
| 알림 (새 댓글, 답글) | 중 | Push or polling 방식 검토 필요 |
| 프로필 이미지 업로드 | 중 | User 모델에 `avatarUrl` 필드 추가 필요 |
| 유저 프로필 페이지 (`/profile/[userId]`) | 중 | 해당 유저의 게시물 목록 |
| 관리자 페이지 | 낮음 | 유저 관리, 초대 코드 강제 발급 등 |
| 애드센스 연동 | 낮음 | 트래픽 확보 후 검토 |

---

## 11. 알려진 제약 사항 및 주의사항

| 항목 | 내용 |
|---|---|
| Neon 무료 플랜 | 0.5GB 스토리지, 비활성 시 자동 슬립 (첫 요청 지연 가능) |
| Resend 무료 플랜 | 100건/일 발신 제한 — 이메일 인증 폭증 시 유료 전환 필요 |
| Cloudinary 무료 플랜 | 25GB 스토리지, 월 25GB 대역폭 |
| Vercel 서버 위치 | 워싱턴(iad1) 기준 빌드 — 실제 DB는 싱가포르(ap-southeast-1) |
| `RESEND_FROM_EMAIL` | 현재 `onboarding@resend.dev` (테스트용) — 프로덕션 운영 시 커스텀 도메인 이메일 권장 |
| 초대 코드 발급 시점 | 이메일 인증 완료 시점 — 미인증 유저는 코드 없음 |

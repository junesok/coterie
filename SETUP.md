# coterie — 프로젝트 셋업 문서

> 이 문서는 개발 시작 전 환경 구성 및 외부 서비스 연동 정보를 기록한 문서입니다.

---

## 1. 기술 스택

| 영역 | 기술 | 버전 | 비고 |
|---|---|---|---|
| Framework | Next.js | 16.x | App Router, TypeScript |
| Styling | Tailwind CSS | 4.x | XP 커스텀 테마 확장 |
| UI 컴포넌트 | shadcn/ui + 커스텀 XP 스타일 | - | |
| 아이콘 | lucide-react | - | size=16, strokeWidth=1.5 |
| ORM | Prisma | 7.x | prisma.config.ts 방식 |
| Database | Neon (PostgreSQL) | 17 | 무료 플랜 |
| 인증 | NextAuth.js | 4.x | Credentials Provider |
| 이미지 저장 | Cloudinary | - | 무료 플랜 25GB |
| 이미지 압축 | browser-image-compression | - | 클라이언트 업로드 전 압축 |
| 이메일 | Resend | - | 무료 100건/일 |
| 테마 | next-themes | - | 라이트/다크 모드 |
| HTTP Client | Axios | - | 인터셉터로 세션 토큰 자동 첨부 |
| 배포 | Vercel | - | GitHub 자동 배포 연동 |

---

## 2. 외부 서비스 계정 정보

### 2-1. Neon DB (PostgreSQL)

| 항목 | 값 |
|---|---|
| 프로젝트명 | coterie |
| PostgreSQL 버전 | 17 |
| Cloud | AWS Asia Pacific (Singapore) |
| 플랜 | Free (0.5 GB) |
| 대시보드 | https://console.neon.tech |

**Connection String (pooler):**
```
postgresql://neondb_owner:***@ep-sparkling-fog-a1gv72a7-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

> 실제 값은 `.env` 파일의 `DATABASE_URL` 참조

---

### 2-2. Cloudinary (이미지 저장소)

| 항목 | 값 |
|---|---|
| Cloud Name | dwhsrs6bj |
| 플랜 | Free (25GB) |
| 대시보드 | https://cloudinary.com/console |

**사용 환경 변수:**
```
CLOUDINARY_CLOUD_NAME=dwhsrs6bj
CLOUDINARY_API_KEY=***
CLOUDINARY_API_SECRET=***
```

> 실제 값은 `.env` 파일 참조

**이미지 업로드 흐름:**
1. 클라이언트: `browser-image-compression`으로 압축
2. `POST /api/upload/image` 호출
3. 서버에서 Cloudinary SDK로 업로드 후 URL 반환
4. 반환된 URL을 Post 생성 요청에 포함

---

### 2-3. Resend (이메일 발송)

| 항목 | 값 |
|---|---|
| API Key 이름 | coterie |
| 발신 이메일 | onboarding@resend.dev (테스트용) |
| 플랜 | Free (100건/일) |
| 대시보드 | https://resend.com/overview |

**사용 환경 변수:**
```
RESEND_API_KEY=re_***
RESEND_FROM_EMAIL=onboarding@resend.dev
```

> 실제 값은 `.env` 파일 참조
> 프로덕션 배포 시 커스텀 도메인 이메일로 교체 권장

**이메일 발송 시점:**
- 회원가입 시: 이메일 인증 링크 발송
- 링크 포맷: `{NEXTAUTH_URL}/api/auth/verify-email?token={token}`

---

## 3. 환경 변수 목록

`.env.example` 기준 전체 환경 변수:

```env
# DATABASE (Neon PostgreSQL)
DATABASE_URL="postgresql://..."

# NEXTAUTH
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-here"

# CLOUDINARY
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# RESEND
RESEND_API_KEY="re_your-api-key"
RESEND_FROM_EMAIL="onboarding@resend.dev"
```

> `.env` 파일은 `.gitignore`에 포함되어 있어 절대 커밋되지 않습니다.
> `.env.example` 파일을 복사하여 실제 값으로 채워 사용하세요.

---

## 4. Prisma 스키마 요약

Prisma 7 기준 — `prisma.config.ts`에서 DB URL 관리, `schema.prisma`에는 `url` 미포함

**모델 목록:**

| 모델 | 주요 필드 |
|---|---|
| `User` | id, email, name, passwordHash, isVerified, invitedById |
| `InviteCode` | id, code, ownerId, usedById, isUsed, usedAt |
| `EmailVerification` | id, userId, token, expiresAt, usedAt |
| `Post` | id, content, authorId, images, comments |
| `PostImage` | id, postId, url, order |
| `Comment` | id, postId, authorId, parentId, content, isDeleted, isEdited |

**마이그레이션 명령어:**
```bash
npx prisma migrate dev --name init    # 개발 환경
npx prisma migrate deploy             # 프로덕션 배포 시
npx prisma studio                     # DB GUI 확인
```

---

## 5. 주요 구현 주의사항 (Next.js 16 / Prisma 7)

### Next.js 16 변경점
- `ctx.params`는 반드시 `await` 필요
  ```ts
  // Route Handler
  export async function GET(_req: NextRequest, ctx: RouteContext<'/posts/[id]'>) {
    const { id } = await ctx.params
  }
  ```
- Route Handlers는 기본 캐시 없음. `GET` 캐싱은 명시적 `export const dynamic = 'force-static'` 필요
- 이 프로젝트는 모든 API가 인증 필요 → 캐싱 미적용

### Prisma 7 변경점
- Generator: `provider = "prisma-client"` (기존 `prisma-client-js` 아님)
- 클라이언트 출력 위치: `app/generated/prisma`
- DB URL: `prisma.config.ts`의 `datasource.url`에서 관리
- `schema.prisma`의 `datasource` 블록에 `url` 필드 없음

### 인증 흐름 주의사항
- 이메일 미인증(`isVerified = false`) 유저는 로그인 불가
- NextAuth `authorize` 콜백에서 반드시 `isVerified` 체크
- 미들웨어(`middleware.ts`): `/login`, `/register`, `/verify-email` 외 모든 경로 보호

### 댓글 삭제 처리
- 답글(replies) 있는 댓글: **소프트 삭제** (`isDeleted = true`, `content = null`)
- 답글 없는 댓글: **하드 삭제** (DB에서 완전 제거)

### 초대 코드
- 이메일 인증 완료 시점에 서버에서 3개 자동 생성
- 포맷: `COTERIE-XXXXXXXX` (cuid 기반 8자리 대문자)

---

## 6. 개발 시작 명령어

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 실제 값 입력

# DB 마이그레이션
npx prisma migrate dev --name init

# Prisma 클라이언트 생성
npx prisma generate

# 개발 서버 실행
npm run dev
```

---

## 7. 개발 우선순위

```
1단계 — 기반 구축
  [ ] Prisma 마이그레이션 + DB 연결 확인
  [ ] NextAuth.js Credentials Provider 설정
  [ ] 미들웨어: 비로그인 → /login 리다이렉트

2단계 — 인증 플로우
  [ ] 회원가입 API (초대 코드 검증 + 이메일 인증)
  [ ] 초대 코드 3개 자동 생성 로직
  [ ] Resend 이메일 인증 연동
  [ ] 로그인 / 로그아웃

3단계 — 핵심 기능
  [ ] Cloudinary 이미지 업로드 API
  [ ] browser-image-compression 클라이언트 압축
  [ ] 게시물 CRUD API + 피드/상세/작성 페이지

4단계 — 소셜 기능
  [ ] 댓글 / 답글 CRUD API
  [ ] isEdited / isDeleted 처리 로직
  [ ] 댓글 포함 게시물 상세 페이지

5단계 — UI 마무리
  [ ] Tailwind XP 커스텀 테마 (Luna/Zune 팔레트)
  [ ] 라이트 / 다크 모드 (next-themes)
  [ ] 초대 코드 관리 페이지
  [ ] 설정 페이지
  [ ] 전체 UI QA (모바일 390px)
```

---

## 8. 배포 (Vercel)

1. GitHub 리포지토리: `junesok/coterie`
2. Vercel에서 해당 리포지토리 import
3. 환경 변수를 Vercel 대시보드에 등록 (`.env` 내용 전체)
4. `NEXTAUTH_URL`을 실제 Vercel 도메인으로 변경
5. `RESEND_FROM_EMAIL`을 실제 도메인 이메일로 교체 권장

**빌드/배포 명령어:**
```bash
npm run build          # 빌드 확인
npx prisma migrate deploy  # 프로덕션 DB 마이그레이션
```

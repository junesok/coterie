# coterie — 배포 가이드

> 배포 환경: Vercel + Neon (PostgreSQL) + Cloudinary + Resend

---

## 1. 빌드 명령어

| 항목 | 명령어 |
|---|---|
| 빌드 | `npm run build` |
| 개발 서버 | `npm run dev` |
| 프로덕션 서버 | `npm run start` |
| DB 마이그레이션 (개발) | `npx prisma migrate dev` |
| DB 마이그레이션 (프로덕션) | `npx prisma migrate deploy` |
| Prisma 클라이언트 생성 | `npx prisma generate` |

---

## 2. 필수 환경 변수

Vercel 대시보드 → 프로젝트 → Settings → Environment Variables에 아래 값들을 등록하세요.

```env
# Neon PostgreSQL
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://your-vercel-domain.vercel.app"
NEXTAUTH_SECRET="랜덤 시크릿 값 (openssl rand -base64 32)"

# Cloudinary
CLOUDINARY_CLOUD_NAME="dwhsrs6bj"
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Resend
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="onboarding@resend.dev"
```

> **주의**: `NEXTAUTH_URL`은 반드시 실제 Vercel 배포 URL로 설정해야 합니다.
> 커스텀 도메인 연결 시 해당 도메인으로 변경하세요.

---

## 3. Vercel 배포 절차

### 방법 A — Vercel 대시보드 (권장)

1. https://vercel.com 접속 → 로그인
2. **Add New Project** → Import Git Repository
3. `junesok/coterie` 선택 (GitHub 연동 필요)
4. **Environment Variables** 섹션에 위 환경 변수 모두 입력
5. **Deploy** 클릭

### 방법 B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 4. 배포 후 DB 마이그레이션

Vercel 배포 완료 후, 로컬에서 프로덕션 DB에 마이그레이션을 적용합니다.

```bash
# .env의 DATABASE_URL이 Neon 프로덕션 DB를 가리키고 있는지 확인 후
npx prisma migrate deploy
```

> Neon 무료 플랜은 브랜치 기능을 지원하므로, 개발/프로덕션 브랜치를 분리하는 것을 권장합니다.

---

## 5. 인프라 구성도

```
사용자 (모바일 390px)
    │
    ▼
Vercel (Next.js 16, Turbopack)
    ├── /api/* → Route Handlers
    ├── proxy.ts → 인증 게이트
    │
    ├── Neon (PostgreSQL 17, Singapore)
    │     └── Prisma 7 + PrismaNeon 어댑터
    │
    ├── Cloudinary (이미지 저장, 25GB)
    │     └── 업로드 전 browser-image-compression
    │
    └── Resend (이메일 인증, 100건/일)
```

---

## 6. NEXTAUTH_SECRET 생성 방법

```bash
openssl rand -base64 32
```

또는 https://generate-secret.vercel.app/32 에서 생성

---

## 7. 배포 체크리스트

- [ ] Vercel 프로젝트 생성 및 GitHub 연동
- [ ] 환경 변수 전체 등록 (NEXTAUTH_URL 실제 도메인으로 설정)
- [ ] NEXTAUTH_SECRET 랜덤 값으로 설정
- [ ] 배포 성공 확인
- [ ] /login 페이지 접근 확인
- [ ] 회원가입 → 이메일 인증 흐름 확인
- [ ] 게시물 작성 + 이미지 업로드 확인

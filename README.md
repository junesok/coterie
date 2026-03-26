# coterie

> A private social network built on invitation only.
> 초대 코드로만 가입할 수 있는 프라이빗 소셜 네트워크.

---

## 1. Project Overview / 프로젝트 소개

**EN**
coterie is a closed social platform where membership requires an invitation code. Users can share posts with photos, connect with friends, mention others with `@username`, and control who sees each post. An admin panel provides moderation tools for managing posts, comments, and user accounts.

**KO**
coterie는 초대 코드 없이는 가입할 수 없는 폐쇄형 소셜 플랫폼입니다. 사진이 포함된 게시물 작성, 친구 연결, `@유저네임` 멘션, 게시물 공개 범위 설정 등의 기능을 제공합니다. 관리자 패널을 통해 게시물·댓글·계정을 관리할 수 있습니다.

---

## 2. Key Features / 주요 기능

| Feature | Description (EN) | 설명 (KO) |
|---|---|---|
| Invite-only signup | New accounts require a valid invite code | 초대 코드 없이 가입 불가 |
| Posts | Text + multi-image posts with carousel | 텍스트 + 다중 이미지 게시물 (캐러셀) |
| Visibility control | Public or Friends-only per post | 게시물별 전체공개 / 친구공개 설정 |
| Friends | Send / accept / reject friend requests | 친구 신청·수락·거절 |
| @Mention | Mention users in posts and comments | 게시물·댓글에서 `@유저네임` 멘션 |
| Comments | Threaded comments and replies | 댓글 및 대댓글 |
| Likes | Like posts | 게시물 좋아요 |
| Notifications | Friend requests, likes, comments, mentions | 친구 신청·좋아요·댓글·멘션 알림 |
| User search | Search users and add friends from the feed | 피드에서 사용자 검색 및 친구 추가 |
| Profile | Avatar, display name, username, post history | 프로필 사진·이름·유저네임·게시물 이력 |
| Password reset | Email-based password reset flow | 이메일 기반 비밀번호 재설정 |
| Admin panel | Manage posts, comments, users, invite codes | 게시물·댓글·계정·초대 코드 관리 |
| Account suspension | Suspend / unsuspend accounts with reason logged | 사유 기록과 함께 계정 정지·해제 |

---

## 3. Tech Stack / 기술 스택

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma 7 |
| Auth | NextAuth.js v4 (JWT, Credentials provider) |
| Image storage | Cloudinary (browser-direct upload) |
| Email | Nodemailer + Gmail SMTP |
| Styling | Tailwind CSS + Windows XP Luna custom design system |
| Icons | Lucide React |
| Deployment | Vercel |

---

## 4. Local Setup / 로컬 실행 방법

**EN**

```bash
# 1. Clone the repository
git clone https://github.com/junesok/coterie.git
cd coterie

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Open .env and fill in your actual values

# 4. Run database migrations
npx prisma migrate deploy

# 5. (Optional) Seed the initial admin account
npx prisma db seed

# 6. Start the development server
npm run dev
```

**KO**

```bash
# 1. 저장소 클론
git clone https://github.com/junesok/coterie.git
cd coterie

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 실제 값으로 채워주세요

# 4. DB 마이그레이션 실행
npx prisma migrate deploy

# 5. (선택) 관리자 계정 시드
npx prisma db seed

# 6. 개발 서버 실행
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하세요.

---

## 5. Environment Variables / 환경 변수

Copy `.env.example` to `.env` and fill in each value.
`.env.example`을 `.env`로 복사한 후 각 값을 채워주세요.

| Variable | Description (EN) | 설명 (KO) |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string | Neon DB 연결 문자열 |
| `NEXTAUTH_URL` | Full URL of the app (e.g. `http://localhost:3000`) | 앱 전체 URL |
| `NEXTAUTH_SECRET` | Random secret for JWT signing — generate with `openssl rand -base64 32` | JWT 서명용 랜덤 시크릿 |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Cloudinary 클라우드 이름 |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Cloudinary API 키 |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Cloudinary API 시크릿 |
| `SMTP_HOST` | SMTP server host (e.g. `smtp.gmail.com`) | SMTP 서버 호스트 |
| `SMTP_PORT` | SMTP port (`465` for Gmail SSL) | SMTP 포트 |
| `SMTP_USER` | SMTP login email | SMTP 로그인 이메일 |
| `SMTP_PASS` | Gmail app password (16 characters) | Gmail 앱 비밀번호 (16자리) |
| `SMTP_FROM` | Sender display name and address | 발신자 이름 및 주소 |
| `ADMIN_PASSWORD` | Initial admin account password | 초기 관리자 계정 비밀번호 |

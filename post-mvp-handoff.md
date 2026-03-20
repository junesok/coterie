# coterie — Post-MVP Developer Handoff

**Version:** 2.0
**Date:** 2026-03-20
**작성자:** Planning Agent

---

## 사이클 이력

| 사이클 | 내용 | 상태 |
|---|---|---|
| MVP | 인증, 게시물 CRUD, 댓글/답글, XP 디자인, 초대 코드 | 완료 |
| 사이클 1 | 유저네임 로그인, 에러 페이지, 관리자 페이지, 좋아요, 알림 | 완료 |
| **사이클 2** | **프로필 페이지, 비밀번호 재설정, 비밀번호 강도 표시** | **진행 예정** |

---

## 개발 우선순위 (사이클 2)

```
1단계 — 프로필 페이지 (본인 + 타인)     ← DB 변경 포함 (프로필 이미지)
2단계 — 비밀번호 재설정                  ← nodemailer 신규 도입
3단계 — 비밀번호 강도 표시              ← UI only
```

---

## 1. 프로필 페이지

### 개요

본인 프로필 페이지와 타인 프로필 페이지를 동일한 구조로 제공합니다.
기존 `/profile/me/invite` 페이지와 `/settings` 페이지에 흩어져 있던 유저 정보를 프로필 페이지로 통합합니다.

### 라우트

| 경로 | 대상 | 비고 |
|---|---|---|
| `/profile/me` | 본인 프로필 | 수정 버튼 노출 |
| `/profile/[username]` | 타인 프로필 | 수정 버튼 미노출 |

### 페이지 구성

```
┌──────────────────────┐
│ [← 뒤로]   [편집]   │  ← 본인만 편집 버튼 노출
│ ━━━━━━━━━━━━━━━━━━━━ │
│                      │
│  [프로필 이미지]     │  ← 원형, 클릭 시 업로드 (본인만)
│  username            │
│  name                │
│  가입일              │
│                      │
│ ━━━━━━━━━━━━━━━━━━━━ │
│ 게시물 N개           │
│ ┌──────────────────┐ │
│ │ [PostCard]       │ │  ← 기존 피드 카드와 동일
│ └──────────────────┘ │
│ ...                  │
└──────────────────────┘
```

### DB 변경

```prisma
model User {
  // 기존 유지
  ...

  // 추가
  avatarUrl  String?   // Cloudinary URL, null이면 기본 아바타 표시
}
```

마이그레이션 필요. 기존 유저는 `avatarUrl = null` → 기본 아바타(이니셜 또는 고정 기본 이미지) 표시.

### 프로필 이미지 처리

- 업로드 방식: 게시물 이미지와 동일하게 Cloudinary 직접 업로드 (`/api/upload/sign` 서명 취득 후)
- 이미지 제한: 1장, 정사각형 크롭 권장, 최대 1MB
- 기존 이미지 교체 시 이전 Cloudinary 이미지 자동 삭제
- `avatarUrl` null 시: username 첫 글자를 대문자로 표시하는 기본 아바타 (CSS only, 이미지 없음)

### 기존 항목과의 관계

| 기존 위치 | 변경 |
|---|---|
| `/profile/me/invite` 초대 코드 | 라우트 유지 (프로필 페이지에서 링크 연결) |
| `/settings` 이름 변경 | settings 유지, 프로필 페이지에서도 편집 가능하게 연결 |
| 피드 게시물 카드 작성자 클릭 | `/profile/[username]`으로 이동 |
| 댓글 작성자 클릭 | `/profile/[username]`으로 이동 |
| 알림 actor 클릭 | `/profile/[username]`으로 이동 |

### API

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/users/[username]` | 유저 프로필 + 게시물 목록 |
| PUT | `/api/users/me` | 이름 / 비밀번호 / avatarUrl 변경 (기존 엔드포인트 확장) |

---

## 2. 비밀번호 재설정

### 개요

nodemailer를 사용해 인증번호를 이메일로 발송하고, 인증번호 일치 시 비밀번호 재설정 화면으로 이동합니다.
기존 `EmailVerification` 테이블을 재활용합니다.

> **Resend 미사용 이유 (기존 결정):** Resend 무료 플랜의 `onboarding@resend.dev`는 계정 소유자 이메일로만 발송 가능. 친구들 이메일로 미도달. → nodemailer + Gmail SMTP (또는 다른 SMTP)로 대체.

### 흐름

```
/login 하단 "비밀번호를 잊으셨나요?" 링크
→ /forgot-password
→ 이메일 입력 + "인증번호 발송" 버튼
→ 해당 이메일로 6자리 숫자 인증번호 발송 (유효시간 10분)
→ 인증번호 입력 화면 (같은 페이지 인라인 or 다음 스텝)
→ 인증번호 일치 → /reset-password?token={token} 이동
→ 새 비밀번호 입력 + 확인 입력
→ 완료 → /login 이동
```

### 라우트

| 경로 | 설명 |
|---|---|
| `/forgot-password` | 이메일 입력 + 인증번호 요청 + 인증번호 확인 (단계형) |
| `/reset-password` | 새 비밀번호 입력 (`?token=` 쿼리 필수) |

### DB 재활용

```prisma
// 기존 EmailVerification 테이블 그대로 사용
model EmailVerification {
  id        String    @id @default(cuid())
  userId    String
  token     String    @unique   // 인증번호 6자리 숫자 (문자열 저장)
  expiresAt DateTime            // now() + 10분
  usedAt    DateTime?           // 사용 완료 시 기록
}
```

인증번호 검증 성공 시 별도 단기 토큰(cuid)을 생성해 `/reset-password?token=` 으로 전달 → 비밀번호 변경 완료 후 토큰 폐기.

### nodemailer 설정

- 패키지: `nodemailer` + `@types/nodemailer`
- SMTP: Gmail SMTP (App Password 방식) 또는 다른 SMTP 서버
- 환경 변수 추가 필요:

```
SMTP_HOST        # smtp.gmail.com
SMTP_PORT        # 465
SMTP_USER        # 발신 Gmail 주소
SMTP_PASS        # Gmail App Password (16자리)
SMTP_FROM        # 표시될 발신자명 + 이메일
```

- Vercel 환경 변수 등록 필요

### 이메일 본문 (텍스트 기반, XP 감성)

```
Subject: your coterie verification code

Hey,

Your verification code is:

  123456

This code expires in 10 minutes.
If you didn't request this, ignore this email.

— coterie
```

### API

| Method | Endpoint | 설명 |
|---|---|---|
| POST | `/api/auth/forgot-password` | 이메일 입력 → 인증번호 발송 |
| POST | `/api/auth/verify-code` | 인증번호 검증 → reset 토큰 반환 |
| POST | `/api/auth/reset-password` | 새 비밀번호 저장 (token 검증 후) |

### 예외 처리

| 케이스 | 처리 |
|---|---|
| 존재하지 않는 이메일 | 보안상 "발송 완료" 메시지 동일하게 표시 (이메일 존재 여부 노출 방지) |
| 인증번호 만료 | "인증번호가 만료되었어요. 다시 요청해 주세요." |
| 인증번호 불일치 | "인증번호가 올바르지 않아요." (5회 이상 실패 시 토큰 폐기, optional) |
| reset 토큰 만료 | `/forgot-password`로 redirect |
| SMTP 발송 실패 | "메일 발송에 실패했어요. 잠시 후 다시 시도해 주세요." |

---

## 3. 비밀번호 강도 표시

### 개요

회원가입(`/register`)과 비밀번호 변경(`/settings`, `/reset-password`) 페이지의 비밀번호 입력 필드 하단에 강도 인디케이터를 추가합니다. 현재는 8자 이상만 검증합니다.

### 강도 단계 (4단계)

| 단계 | 조건 | 표시 색상 (라이트) | 표시 색상 (다크) | 텍스트 |
|---|---|---|---|---|
| 매우 약함 | 7자 이하 | `#CC0000` (빨강) | `#FF4444` | Weak |
| 약함 | 8자 이상, 영문 또는 숫자만 | `#FF8C00` (주황) | `#FF8C00` | Fair |
| 보통 | 영문+숫자 혼합 또는 특수문자 포함 | `#DAA520` (금색) | `#DAA520` | Good |
| 강함 | 영문 대소문자+숫자+특수문자 모두 포함, 10자 이상 | `#228B22` (녹색) | `#4CAF50` | Strong |

### UI

```
┌──────────────────────┐
│ ●●●●●●●●             │  ← 비밀번호 입력 필드
└──────────────────────┘
[■■■□] Fair             ← 4칸 바 + 텍스트 레이블
```

- 바(bar): 4칸 분할, 현재 단계만큼 채움
- XP 스타일: 각 칸은 `xp-raised` 스타일 적용
- 클라이언트 사이드 실시간 계산 (타이핑할 때마다 즉시 업데이트)
- 서버 측 최종 검증은 기존 8자 이상 규칙 유지 (강함 강제 불필요)

### 적용 위치

| 페이지 | 필드 |
|---|---|
| `/register` | 비밀번호 입력 필드 |
| `/settings` | 비밀번호 변경 필드 |
| `/reset-password` | 새 비밀번호 입력 필드 |

---

## 4. 보류 항목

현재 운영 상태로 충분하며, 필요성이 높아질 때 재검토합니다.

| 항목 | 사유 |
|---|---|
| 무한 스크롤 | "Load more" 방식이 현재 사용 패턴에 적합. 변경 불필요 |
| 푸시 알림 | 30초 폴링으로 운영 중. Vercel 무료 플랜 WebSocket 불가. 트래픽 증가 시 재검토 |
| 애드센스 연동 | 트래픽 확보 후 검토 |

---

## 5. DB 마이그레이션 요약 (사이클 2)

```prisma
// User 모델 변경
model User {
  ...
  avatarUrl  String?   // 추가
}
```

`EmailVerification`, `Notification`, `ModerationLog` 등 기존 모델은 변경 없음.

---

## 6. 개발 순서

```
1단계 — 프로필 페이지
  1. User 모델 avatarUrl 필드 추가 + 마이그레이션
  2. /api/users/[username] API 신규 작성
  3. /api/users/me PUT 확장 (avatarUrl 포함)
  4. /api/upload/sign 재활용 (프로필 이미지 서명)
  5. /profile/me, /profile/[username] 페이지 구현
  6. 피드 카드, 댓글, 알림에서 username 클릭 → 프로필 링크 연결

2단계 — 비밀번호 재설정
  7. nodemailer 패키지 설치 + SMTP 환경 변수 설정
  8. lib/mailer.ts 작성 (nodemailer 클라이언트 싱글톤)
  9. /api/auth/forgot-password — 인증번호 발송
  10. /api/auth/verify-code — 인증번호 검증 + reset 토큰 반환
  11. /api/auth/reset-password — 비밀번호 변경
  12. /forgot-password 페이지 (2단계 형식)
  13. /reset-password 페이지
  14. /login 하단 "비밀번호를 잊으셨나요?" 링크 추가

3단계 — 비밀번호 강도 표시
  15. 강도 계산 유틸 함수 작성 (순수 클라이언트 로직)
  16. PasswordStrengthBar 컴포넌트 작성 (XP 스타일 4칸 바)
  17. /register, /settings, /reset-password에 컴포넌트 적용
```

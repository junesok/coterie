# coterie — 변경 이력

> 매 요청 완료 후 자동 기록. 최신 항목이 위에 위치.

---

## 2026-03-23 — dev-progress, developer-report 업데이트

**요청:** dev-progress와 developer-report를 최신 상태로 업데이트해달라

**수정 내용:**
- `dev-progress.md`: 최종 업데이트 날짜 → 2026-03-23 (세션 4), DB 스키마(Friendship, PostVisibility, FriendshipStatus, NotificationType 확장), 친구 시스템·피드 탭·알림 개선·공개 범위·@멘션·초대 코드 개선·NavBar 세션 캐시 등 전 기능 반영, API 엔드포인트 테이블 추가
- `developer-report.md`: 기술 스택 업데이트(Resend → nodemailer, avatarUrl 세션), 기능 전체 현행화, DB 스키마 최신화, 미구현 항목 및 트러블슈팅 기록 추가

---

## 2026-03-23 — NavBar 프로필 사진 세션 캐시로 전환

**요청:** NavBar의 내 프로필 아이콘에 프로필 사진이 있으면 아이콘 대신 사진이 보이게, 매번 API 호출하는 문제 개선

**수정 내용:**
- `lib/auth.ts`: `authorize` 반환값에 `avatarUrl` 추가, JWT callback에서 `token.avatarUrl` 저장, `trigger === "update"` 시 `sessionUpdate.avatarUrl` 갱신 처리, `session` callback에서 `session.user.avatarUrl` 노출
- `types/next-auth.d.ts`: `Session.user.avatarUrl`, `JWT.avatarUrl` 타입 추가
- `components/NavBar.tsx`: `useMyAvatar` 훅(API 호출) 제거 → `session.user.avatarUrl` 직접 사용
- `app/profile/edit/page.tsx`: 프로필 저장 시 `updateSession({ avatarUrl })` 호출하여 세션 즉시 갱신

**예외/편차:**
- X박스가 뜨는 근본 원인은 `next.config.ts`에 `res.cloudinary.com` 도메인이 미등록된 것. `<Image>` 컴포넌트가 아닌 `<img>` 태그를 쓰거나 domains를 등록해야 완전 해결됨. 이번 작업에서는 세션 캐시 전환만 적용하고, 도메인 등록은 별도 작업으로 남김.

---

## 2026-03-23 — 설정 페이지 초대 코드 개선

**요청:** settings에서 초대 코드가 3개 초과 시 Load more / Show less 버튼으로 표시, used by에서 이름 없는 계정은 username으로 fallback

**수정 내용:**
- `app/api/invite/my-codes/route.ts`: `usedBy` select에 `username: true` 추가
- `app/settings/page.tsx`: `InviteCode.usedBy` 타입에 `username` 추가, `showAll` state 추가, 기본 3개만 표시, 초과 시 "load more" / "show less" 버튼 렌더링, `usedBy` 표시 시 `name || username` fallback

---

## 2026-03-22 — 친구 거절/삭제 시 FRIEND_REQUEST 알림 삭제

**요청:** 친구를 제거하거나 친구 신청을 거절하면 알림에서 "sent a friend request" 알림도 삭제

**수정 내용:**
- `app/api/friends/[id]/route.ts`: PUT(거절) 처리 시 `type: "FRIEND_REQUEST", friendshipId` 조건으로 알림 삭제, DELETE(취소/삭제) 처리 시 동일 조건 알림 삭제

---

## 2026-03-22 — 알림 자동 정리 기준 수정

**요청:** 알림 자동 정리(20개 초과 시 삭제)에서 "친구 신청 제외"는 PENDING 상태인 것만 제외, ACCEPTED/REJECTED 된 것은 정리 대상

**수정 내용:**
- `app/api/notifications/route.ts`: PENDING 상태 friendship ID를 먼저 조회한 후, 해당 friendshipId를 가진 FRIEND_REQUEST 알림만 정리 제외로 변경. 기존 `type: "FRIEND_REQUEST"` 전체 제외 로직 삭제

---

## 2026-03-22 — 친구 시스템 + 피드 탭 + 공개 범위 + 알림 개선

**요청:** 친구 신청/취소/수락/거절/삭제, 친구 전용 게시물, 피드 탭(All/Friends), 알림 UI 개선 및 수락/거절 버튼 조건 표시, 알림 20개 자동 정리, 친구 목록 모달 중앙 배치 + Luna 닫기 버튼

**수정 내용:**
- `prisma/schema.prisma`: `PostVisibility` enum, `FriendshipStatus` enum, `Friendship` 모델, `Post.visibility`, `Notification.friendshipId`, `FRIEND_REQUEST`/`FRIEND_ACCEPT` NotificationType 추가
- `prisma/migrations/20260322000000_add_friendship_visibility/migration.sql`: 위 스키마 변경 SQL
- `app/api/friends/route.ts` (신규): 친구 신청(POST) / 친구 목록 조회(GET)
- `app/api/friends/[id]/route.ts` (신규): 수락·거절(PUT) / 취소·삭제(DELETE)
- `app/api/friends/status/route.ts` (신규): 친구 관계 상태 조회
- `app/api/users/[username]/friends/route.ts` (신규): 유저 친구 목록
- `app/api/posts/route.ts`: `?tab=all|friends` 파라미터 지원, All = PUBLIC, Friends = FRIENDS + 친구+자신
- `app/api/posts/[id]/route.ts`: FRIENDS 게시물 비친구 접근 차단(404), visibility 수정 지원
- `app/api/users/[username]/route.ts`: cursor 기반 페이지네이션(5개), friendCount, FRIENDS 게시물 비친구 숨김
- `app/api/notifications/route.ts`: PENDING 친구 신청 알림 제외 후 20개 초과 자동 정리
- `app/notifications/page.tsx`: FRIEND_REQUEST/FRIEND_ACCEPT 표시, PENDING일 때만 수락/거절 버튼, divider 기반 목록 UI
- `app/feed/page.tsx`: All/Friends pill 탭 버튼, 탭 전환 시 목록 초기화
- `app/profile/[username]/page.tsx`: 친구 버튼 상태(Add/Cancel/Friends/Respond), 친구 수 표시, 친구 모달(중앙 배치, Luna 닫기 버튼), 게시물 Load more
- `components/PostForm.tsx`: visibility toggle, 500자 카운터
- `app/post/[id]/edit/page.tsx`: initialVisibility 로드 및 PostForm 전달
- `app/globals.css`: `.xp-ctrl-btn.close` Luna 빨간 둥근 버튼 스타일

---

## 2026-03-21 — name optional, 글 optional, 500자 카운터, 중첩 a 태그 수정

**요청:** name 필드 optional, 게시물 글 optional(이미지 있을 때), 500자 카운터, profile/edit name 빈값 저장 가능, nested a 태그 하이드레이션 오류 수정

**수정 내용:**
- `app/register/page.tsx`: name `required` 제거, `(optional)` 레이블 추가
- `app/api/auth/register/route.ts`: name 필수 체크 제거, `name?.trim() || ""`
- `app/api/users/me/route.ts`: `name !== undefined && name !== null` 조건으로 빈 문자열 저장 허용
- `app/profile/edit/page.tsx`: `if (!name.trim())` 유효성 검사 제거
- `components/PostForm.tsx`: 500자 카운터 추가, 이미지 있으면 내용 없이 제출 허용
- `app/api/posts/route.ts`: content 또는 images 중 하나 필수, 500자 서버 검증
- `app/api/posts/[id]/route.ts`: 동일 검증
- `components/PostCard.tsx`: `<Link>` → `<div onClick={router.push()}>` 교체 (MentionText `<a>` 중첩 방지)

**예외/편차:**
- Next.js 하이드레이션 오류는 개발 모드에서만 발생하고 Vercel 배포본에서는 정상이었으나, 잠재적 버그이므로 구조 수정으로 해결

---

## 2026-03-21 — @멘션 클릭 시 프로필 이동

**요청:** 게시물과 댓글에서 @username 클릭 시 해당 프로필 페이지로 이동

**수정 내용:**
- `components/MentionText.tsx` (신규): `@username` 패턴 파싱, `<a href="/profile/{username}">` 렌더링, `e.stopPropagation()` 처리
- `components/PostCard.tsx`: 본문 미리보기에 `MentionText` 적용
- `components/CommentItem.tsx`: 댓글 내용에 `MentionText` 적용
- `app/post/[id]/page.tsx`: 게시물 상세 본문에 `MentionText` 적용

---

## 2026-03-21 — 이미지 캐러셀 개선 + PostCard 1/N 배지

**요청:** 다중 이미지 캐러셀 전환 부드럽게, PostCard에서 이미지 장수 표시 (우상단 1/N 카운터 배지)

**수정 내용:**
- `components/ImageCarousel.tsx`: `transition: transform 0.3s ease` smooth 전환 적용
- `components/PostCard.tsx`: 이미지 2장 이상일 때 우상단 `1 / N` 카운터 배지 추가

---

## 2026-03-20 — 프로필 사진 게시물/댓글에 표시

**요청:** 게시물 타이틀바 유저네임 옆에 프로필 사진 추가, 댓글에도 동일하게 적용

**수정 내용:**
- `components/PostCard.tsx`: author 인터페이스에 `avatarUrl` 추가, 타이틀바에 `Avatar` (22px) 표시
- `components/CommentItem.tsx`: author에 `avatarUrl` 추가, 댓글 헤더에 `Avatar` (20px) 표시
- `app/api/posts/route.ts`, `app/api/posts/[id]/route.ts`, `app/api/posts/[id]/comments/route.ts`: author select에 `avatarUrl: true` 추가
- `app/post/[id]/page.tsx`: 게시물 상세 작성자 행에 `Avatar` (28px) 추가

# coterie — Design Handoff

**Version:** 1.0
**Date:** 2026-03-19
**Status:** Confirmed

---

## 1. Design Overview

coterie는 초대받은 소수의 친구들만 사용하는 완전 폐쇄형 프라이빗 소셜 커뮤니티입니다.

**핵심 디자인 방향**

- **Windows XP 노스탤지어**: Luna 테마의 3D 버튼, raised/inset border, 타이틀바 스타일을 모던 모바일 UI에 녹인다.
- **모바일 전용 레이아웃**: PC에서도 모바일 너비(390px)로 고정된 컨테이너 안에서 서비스가 동작한다. 좌우 여백은 별도 배경으로 처리한다.
- **Emoji 사용 금지**: 모든 UI 디자인 요소에서 emoji를 사용하지 않는다. 아이콘은 lucide-react SVG로 대체한다.
- **라이트 / 다크 모드**: 두 가지 테마 모두 XP 계열 팔레트를 기반으로 독립적으로 설계한다.

---

## 2. UI Style Direction

### 2-1. 레이아웃 컨테이너

| 항목 | 값 |
|---|---|
| 최대 너비 | 390px |
| 정렬 | 수평 중앙 (mx-auto) |
| PC 좌우 배경 (라이트) | XP Bliss 언덕 이미지 블러 처리 또는 회색 타일 패턴 |
| PC 좌우 배경 (다크) | 단색 #0D0D0D 또는 Media Center 그라디언트 |
| 스크롤 | 컨테이너 내부에서만 발생 |

### 2-2. 컬러 팔레트

**라이트 모드 (XP Luna)**

| 역할 | 색상 | 비고 |
|---|---|---|
| 페이지 배경 | `#ECE9D8` | XP 클래식 베이지 |
| 카드 / 창 배경 | `#FFFFFF` | |
| 타이틀바 | `linear-gradient(#0A246A, #3A6EA5)` | XP 파란 그라디언트 |
| 타이틀바 텍스트 | `#FFFFFF` | |
| 기본 버튼 배경 | `#ECE9D8` | |
| 포인트 컬러 | `#003399` | XP 파랑 |
| 본문 텍스트 | `#000000` | |
| 서브 텍스트 | `#6B6B6B` | |
| 구분선 | `#ACA899` | |
| 위험 / 삭제 | `#CC0000` | |

**다크 모드 (XP Media Center / Zune)**

| 역할 | 색상 | 비고 |
|---|---|---|
| 페이지 배경 | `#1A1A1A` | |
| 카드 / 창 배경 | `#2D2D2D` | |
| 타이틀바 | `linear-gradient(#1F1F1F, #2A2A2A)` | |
| 타이틀바 텍스트 | `#FFFFFF` | |
| 기본 버튼 배경 | `#3A3A3A` | |
| 포인트 컬러 | `#FF8C00` | Zune 오렌지 |
| 본문 텍스트 | `#E8E8E8` | |
| 서브 텍스트 | `#999999` | |
| 구분선 | `#444444` | |
| 위험 / 삭제 | `#FF4444` | |

### 2-3. 타이포그래피

| 항목 | 값 |
|---|---|
| Primary Font | Tahoma, Segoe UI, sans-serif |
| 본문 크기 | 14px |
| 서브 텍스트 크기 | 12px |
| 헤딩 크기 | 16px (bold) |
| 줄 높이 | 1.5 |

### 2-4. XP 버튼 스타일

3D raised 버튼 (라이트 모드 기준):

```css
.xp-button {
  background: #ECE9D8;
  border: 1px solid #ACA899;
  box-shadow:
    inset 1px 1px #FFFFFF,
    inset -1px -1px #848284;
  padding: 4px 12px;
  font-family: Tahoma, sans-serif;
  font-size: 14px;
  cursor: pointer;
}

.xp-button:active {
  box-shadow:
    inset 1px 1px #848284,
    inset -1px -1px #FFFFFF;
}
```

### 2-5. XP Input 스타일 (inset)

```css
.xp-input {
  background: #FFFFFF;
  border: 1px solid #ACA899;
  box-shadow:
    inset 1px 1px #848284,
    inset -1px -1px #FFFFFF;
  padding: 4px 8px;
  font-family: Tahoma, sans-serif;
  font-size: 14px;
}
```

### 2-6. 아이콘 시스템

- 라이브러리: `lucide-react`
- 크기: `size=16` (기본), `size=20` (강조)
- stroke-width: `1.5` 통일
- 색상: `currentColor` (테마 자동 상속)
- 원칙: 텍스트 라벨과 함께 사용 권장. 아이콘 단독 사용 최소화.

| 기능 | 아이콘 |
|---|---|
| 뒤로가기 | ChevronLeft |
| 새 글 작성 | PenLine |
| 댓글 | MessageSquare |
| 설정 | Settings |
| 라이트 모드 | Sun |
| 다크 모드 | Moon |
| 삭제 | Trash2 |
| 수정 | Pencil |
| 복사 | Copy |
| 초대 코드 | Key |
| 사용자 | User |
| 이미지 추가 | ImagePlus |

---

## 3. Page Layout Summary

### /login — 로그인

- PC 환경: 좌우 배경 위에 390px 컨테이너가 XP 창 프레임으로 표현됨
- 구성: XP 타이틀바 ("coterie") + 이메일 필드 + 비밀번호 필드 + 로그인 버튼 + 가입 링크
- 타이틀바에 창 컨트롤 버튼(최소화/최대화/닫기 아이콘) 시각적 장식으로 배치 가능 (기능 없음)

### /register — 회원가입

- 구성: 이름 + 이메일 + 비밀번호 + 초대 코드 입력 + 가입 버튼
- 초대 코드 필드는 별도 강조 처리 (포인트 컬러 border)
- 이메일 인증 완료 전 가입 불가 상태 표시

### /verify-email — 이메일 인증 안내

- 구성: 안내 텍스트 + 이메일 주소 표시 + "인증 메일 재발송" 버튼
- 심플한 단일 카드 레이아웃

### /feed — 피드

- 상단: 서비스명 텍스트 로고 (좌) + 설정 아이콘 (우)
- 구분선 (XP 스타일 horizontal rule)
- 게시물 카드 리스트 (최신순)
- 우하단: "새 글" 버튼 (고정, XP 3D 버튼 스타일)

### /post/[id] — 게시물 상세

- 상단: 뒤로가기 버튼 (좌) + 수정/삭제 버튼 (우, 본인만 표시)
- 이미지 캐러셀 (CSS dot indicator, 최대 3장)
- 작성자 + 날짜 + 본문
- 구분선
- 댓글 목록 (답글 1단계 들여쓰기)
- 하단 고정: 댓글 입력창 + 전송 버튼

### /post/new, /post/[id]/edit — 게시물 작성/수정

- 이미지 업로드 영역 (최대 3장, 미리보기 + 삭제)
- 텍스트 입력창 (여러 줄)
- 하단: 취소 / 저장 버튼

### /profile/me/invite — 초대 코드 관리

- 초대 코드 3개 카드 나열
- 각 카드: 코드 텍스트 + 복사 버튼 + 상태 표시 (미사용 / 사용됨 + 사용자명)

### /settings — 설정

- 테마 토글 (라이트 / 다크 / 시스템)
- 이름 변경 폼
- 비밀번호 변경 폼

---

## 4. UI Component List

### Navigation Bar (상단 바)
- 좌: 서비스명 텍스트 또는 뒤로가기 버튼
- 우: 컨텍스트 버튼 (설정, 수정/삭제 등)
- XP 타이틀바 그라디언트 배경 적용
- 하단에 구분선

### XP Window Frame (창 프레임)
- 로그인/회원가입 페이지에서 사용
- 상단 타이틀바 (그라디언트 + 흰색 텍스트)
- 창 내용 영역 (흰색 배경)
- raised border로 입체감 표현

### Primary Button (XP 3D 버튼)
- raised box-shadow 스타일
- 클릭 시 inset으로 전환 (눌리는 효과)
- 라이트/다크 각각 팔레트 적용

### Input Field (XP inset 필드)
- inset box-shadow 스타일
- focus 시 포인트 컬러 outline

### Post Card (게시물 카드)
- 이미지 썸네일 (있을 경우)
- 본문 텍스트 미리보기 (2줄 clamp)
- 작성자 + 상대 시간
- raised border 카드 스타일

### Image Carousel (이미지 캐러셀)
- 스와이프 지원 (터치)
- CSS dot indicator (현재 위치 표시)
- 최대 3장

### Comment Item (댓글 아이템)
- 작성자 + 내용 + 상대 시간
- "수정됨" 텍스트 표시 (isEdited = true)
- 삭제된 댓글: "삭제된 댓글입니다" 텍스트, 회색 처리
- 답글: 좌측 들여쓰기 + 세로 구분선

### Invite Code Card (초대 코드 카드)
- 코드 텍스트 (monospace)
- 복사 버튼
- 상태: 미사용 (기본) / 사용됨 (회색 처리 + 사용자명 표시)

### Theme Toggle (테마 토글)
- Sun / Moon 아이콘 (lucide-react)
- 클릭 시 라이트 ↔ 다크 전환
- 상태 저장: localStorage 또는 next-themes

### Modal / Alert (XP 스타일 다이얼로그)
- 삭제 확인 등에 사용
- XP 경고창 느낌의 타이틀바 + 버튼 배치
- 배경 dimmed overlay

---

## 5. Interaction Notes

**버튼 클릭**
- 클릭 시 box-shadow inset 전환으로 눌리는 피드백 제공 (CSS :active)
- 비활성 버튼은 opacity 0.5 + cursor not-allowed

**폼 유효성**
- 실시간 유효성 검사보다 제출 시 에러 표시 방식 채택 (XP 스타일 에러 메시지 박스)
- 에러 메시지: 포인트 컬러 border + 아이콘 없는 텍스트 메시지

**이미지 업로드**
- 업로드 전 클라이언트에서 자동 압축
- 미리보기 즉시 표시
- 3장 초과 시 추가 버튼 비활성화

**댓글 삭제 (답글 있는 경우)**
- "삭제됩니다" 확인 다이얼로그 표시
- 삭제 후 내용 숨김, "삭제된 댓글입니다" 텍스트로 대체
- 답글은 그대로 유지

**댓글 수정**
- 인라인 편집 (댓글 내용이 input으로 전환)
- 저장 후 "수정됨" 텍스트 표시

**라이트/다크 모드 전환**
- 전환 시 transition 0.2s 적용 (급격한 색상 변화 완화)

**비로그인 접근**
- /login, /register, /verify-email 외 모든 경로는 미들웨어에서 /login으로 리다이렉트
- 별도 안내 없이 즉시 이동

---

## 6. Design System Suggestions

**Tailwind CSS 커스텀 테마 확장**

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      xp: {
        beige: '#ECE9D8',
        blue: '#003399',
        titleStart: '#0A246A',
        titleEnd: '#3A6EA5',
        border: '#ACA899',
        shadow: '#848284',
      },
      zune: {
        bg: '#1A1A1A',
        card: '#2D2D2D',
        orange: '#FF8C00',
      }
    },
    fontFamily: {
      xp: ['Tahoma', 'Segoe UI', 'sans-serif'],
    },
    boxShadow: {
      'xp-raised': 'inset 1px 1px #FFFFFF, inset -1px -1px #848284, 1px 1px #000000',
      'xp-inset': 'inset 1px 1px #848284, inset -1px -1px #FFFFFF',
    }
  }
}
```

**컴포넌트 공통 원칙**
- 모든 컴포넌트는 라이트/다크 모드 variant를 함께 정의
- XP raised/inset 스타일은 유틸리티 클래스로 추출해 재사용
- 반응형 breakpoint 불필요 (390px 고정 컨테이너)
- 애니메이션은 최소화 (테마 전환 transition만 적용)

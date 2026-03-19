import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

/**
 * 이메일 인증 링크 발송
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "coterie — 이메일 인증",
    html: `
      <div style="font-family: Tahoma, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: linear-gradient(#0A246A, #3A6EA5); padding: 12px 16px;">
          <h1 style="color: #fff; font-size: 16px; margin: 0;">coterie</h1>
        </div>
        <div style="background: #fff; border: 1px solid #ACA899; padding: 24px;">
          <p style="font-size: 14px; color: #000;">안녕하세요,</p>
          <p style="font-size: 14px; color: #000;">
            아래 버튼을 클릭하면 이메일 인증이 완료됩니다.<br/>
            링크는 <strong>24시간</strong> 동안 유효합니다.
          </p>
          <a
            href="${verifyUrl}"
            style="
              display: inline-block;
              background: #ECE9D8;
              border: 1px solid #ACA899;
              box-shadow: inset 1px 1px #fff, inset -1px -1px #848284;
              padding: 6px 16px;
              font-family: Tahoma, sans-serif;
              font-size: 14px;
              color: #000;
              text-decoration: none;
              margin-top: 8px;
            "
          >
            이메일 인증하기
          </a>
          <p style="font-size: 12px; color: #6B6B6B; margin-top: 24px;">
            버튼이 작동하지 않으면 아래 링크를 복사해 브라우저에 붙여넣으세요:<br/>
            <a href="${verifyUrl}" style="color: #003399;">${verifyUrl}</a>
          </p>
        </div>
      </div>
    `,
  });
}

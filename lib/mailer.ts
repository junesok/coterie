import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true, // port 465 → SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * 비밀번호 재설정 인증번호 발송
 */
export async function sendPasswordResetCode(
  to: string,
  code: string
): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "your coterie verification code",
    text: [
      "Hey,",
      "",
      "Your verification code is:",
      "",
      `  ${code}`,
      "",
      "This code expires in 10 minutes.",
      "If you didn't request this, ignore this email.",
      "",
      "— coterie",
    ].join("\n"),
  });
}

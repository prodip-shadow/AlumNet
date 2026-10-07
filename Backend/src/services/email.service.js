const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  return null;
};

const send2FACode = async (toEmail, code) => {
  const transporter = createTransporter();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@alumnet.pstu.ac.bd';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #2563eb; text-align: center; margin-bottom: 20px;">PSTU AlumNet Security</h2>
      <p style="font-size: 14px; color: #333333;">Hello,</p>
      <p style="font-size: 14px; color: #333333;">Your Two-Factor Authentication (2FA) verification code is:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b; background-color: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px dashed #cbd5e1; display: inline-block;">
          ${code}
        </span>
      </div>
      <p style="font-size: 13px; color: #e11d48; font-weight: bold; text-align: center;">This code is valid for exactly 5 minutes.</p>
      <p style="font-size: 12px; color: #64748b; margin-top: 30px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        If you did not request this login code, please change your password immediately.
      </p>
    </div>
  `;

  if (transporter) {
    try {
      const formattedFrom = fromEmail.includes('<') ? fromEmail : `"PSTU AlumNet" <${fromEmail}>`;
      await transporter.sendMail({
        from: formattedFrom,
        to: toEmail,
        subject: `${code} is your AlumNet 2FA Verification Code`,
        html: htmlContent,
      });
    } catch (err) {
      console.error(`[Email Service Error] Failed to send email to ${toEmail}:`, err.message);
      console.log(`[Email Service Fallback] 2FA Code for ${toEmail}: [ ${code} ] (Valid for 5 mins)`);
    }
  } else {
    console.log(`[Email Service Notice] SMTP not configured in .env. 2FA Code for ${toEmail}: [ ${code} ] (Valid for 5 mins)`);
  }
};

const sendResetPasswordCode = async (toEmail, code) => {
  const transporter = createTransporter();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@alumnet.pstu.ac.bd';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #dc2626; text-align: center; margin-bottom: 20px;">PSTU AlumNet Password Reset</h2>
      <p style="font-size: 14px; color: #333333;">Hello,</p>
      <p style="font-size: 14px; color: #333333;">You requested to reset your password. Your 6-digit reset code is:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #991b1b; background-color: #fef2f2; padding: 12px 24px; border-radius: 8px; border: 1px dashed #fca5a5; display: inline-block;">
          ${code}
        </span>
      </div>
      <p style="font-size: 13px; color: #e11d48; font-weight: bold; text-align: center;">This code is valid for 5 minutes.</p>
      <p style="font-size: 12px; color: #64748b; margin-top: 30px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        If you did not request a password reset, please ignore this email.
      </p>
    </div>
  `;

  if (transporter) {
    try {
      const formattedFrom = fromEmail.includes('<') ? fromEmail : `"PSTU AlumNet" <${fromEmail}>`;
      await transporter.sendMail({
        from: formattedFrom,
        to: toEmail,
        subject: `${code} is your AlumNet Password Reset Code`,
        html: htmlContent,
      });
      console.log(`[Email Service] Password reset email sent to ${toEmail}`);
    } catch (err) {
      console.error(`[Email Service Error] Failed to send email to ${toEmail}:`, err.message);
      console.log(`[Email Service Fallback] Password Reset Code for ${toEmail}: [ ${code} ] (Valid for 5 mins)`);
    }
  } else {
    console.log(`[Email Service Notice] SMTP not configured in .env. Password Reset Code for ${toEmail}: [ ${code} ] (Valid for 5 mins)`);
  }
};

module.exports = {
  send2FACode,
  sendResetPasswordCode,
};

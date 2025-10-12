import { Resend } from "resend";
import catchAsync from "./catchAsync.js";
import AppError from "./appError.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ email, resetToken }) => {
  try {
    const resetURL = `http://127.0.0.1:3001/api/v1/users/resetpassword/${resetToken}`;

    const { data, error } = await resend.emails.send({
      from: "contactform@johanlindell.dev",
      to: process.env.RESEND_SEND_TO,
      subject: "Password reset",
      replyTo: email,
      html: `
        <strong>Here is your password reset token:</strong>
        <hr />
        <p><strong>Token:</strong> ${resetToken}</p>
        <p>Please use this token to reset your password.</p>
        <p>Visit ${resetURL}</p>
        <p>If you didn’t request this email, you can safely ignore it.</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new AppError(
        `Email sending failed: ${error.message}`,
        error.statusCode || 500
      );
    }

    console.log("Resend success:", data);
    return data;
  } catch (err) {
    throw new AppError(err.message || "Email sending failed", 500);
  }
};

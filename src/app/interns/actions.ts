"use server";

import nodemailer from "nodemailer";

export async function sendInternCredentialsEmail(email: string, password: string, name: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"IMS Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Welcome to our Internship Program 🎉",
      text: `Hello ${name},\n\nWelcome to IMS!\nYour credentials are:\nEmail: ${email}\nPassword: ${password}\n\nPlease login and change your password.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 12px; border: 1px solid #ddd;">
          <h2 style="color: #4F46E5;">Welcome to IMS, ${name}!</h2>
          <p style="color: #475569;">Your intern account has been created by your administrator.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email Address:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          <p style="color: #475569;">Please log in to the portal and update your profile.</p>
        </div>
      `,
    });

    // console.log("================================");
    // console.log("EMAIL SENT SUCCESSFULLY");
    // console.log("Message ID: %s", info.messageId);
    // console.log("================================");

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "Failed to dispatch email." };
  }
}

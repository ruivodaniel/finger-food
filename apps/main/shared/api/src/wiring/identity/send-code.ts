// Delivers the one-time codes of the local identity provider by email, straight over SMTP.
// Not queued: a code that did not arrive is asked for again. Local: maildev. Elsewhere: any SMTP service.
import nodemailer from "nodemailer";
import type { CodePurpose } from "@modules/user-organization-mgmt/api";
import { Env } from "@/env";

const transporter = nodemailer.createTransport({
  host: Env.SMTP_HOST ?? "localhost",
  port: Env.SMTP_PORT,
  secure: Env.SMTP_PORT === 465,
  ignoreTLS: Env.NODE_ENV === "development" && !Env.SMTP_USER,
  ...(Env.SMTP_USER ? { auth: { user: Env.SMTP_USER, pass: Env.SMTP_PASS ?? "" } } : {}),
});

const SUBJECT: Record<CodePurpose, string> = {
  registration: "Your Finger Food sign-up code",
  login: "Your Finger Food sign-in code",
  verification: "Confirm your email for Finger Food",
  recovery: "Your Finger Food recovery code",
};

export async function sendLoginCode(to: string, code: string, purpose: CodePurpose): Promise<void> {
  await transporter.sendMail({
    from: Env.EMAIL_FROM,
    to,
    subject: SUBJECT[purpose],
    text: `Your code is ${code}. It is valid for 10 minutes. If you did not ask for it, ignore this email.`,
  });
}

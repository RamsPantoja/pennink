import { env } from "~/env";
import { type TRPCContext } from "../trpc";
import { Resend } from "resend";
import { TRPCError } from "@trpc/server";

type EmailServiceContructor = {
  ctx: TRPCContext;
};

type SendPayload = {
  html: string;
  subject: string;
  to: string[];
  from: string;
};

class EmailService {
  ctx: TRPCContext;
  service: Resend;

  constructor({ ctx }: EmailServiceContructor) {
    this.ctx = ctx;
    this.service = new Resend(env.RESEND_API_KEY);
  }

  public async send(payload: SendPayload) {
    const { from, to, subject, html } = payload;
    const { data, error } = await this.service.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      throw new TRPCError({
        message: error.message,
        code: "INTERNAL_SERVER_ERROR",
      });
    }

    return data;
  }
}

export default EmailService;

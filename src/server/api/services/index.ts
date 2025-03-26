import type { TRPCContext } from "../trpc";
import { UserService } from "./user";
import EmailService from "./email";
import PaymentService from "./payment";
import { WorkspaceService } from "./workspace";
import { Chat } from "./chat";
import { NoteService } from "./note";

export type ServicesContext = {
	userService: UserService;
	emailService: EmailService;
	paymentService: PaymentService;
	workspaceService: WorkspaceService;
	chatService: Chat;
	noteService: NoteService;
};

export type ServicesConfig = {
	ctx: TRPCContext;
};

const Services = ({ ctx }: ServicesConfig): ServicesContext => {
	return {
		userService: new UserService({ ctx }),
		emailService: new EmailService({ ctx }),
		paymentService: new PaymentService({ ctx }),
		workspaceService: new WorkspaceService({ ctx }),
		chatService: new Chat({ ctx }),
		noteService: new NoteService({ ctx }),
	};
};

export default Services;

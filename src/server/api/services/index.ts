import type { TRPCContext } from "../trpc";
import { UserService } from "./user";
import EmailService from "./email";
import PaymentService from "./payment";
import { NotebookService } from "./notebook";
import { Chat } from "./chat";
import { NoteService } from "./note";

export type ServicesContext = {
	userService: UserService;
	emailService: EmailService;
	paymentService: PaymentService;
	notebookService: NotebookService;
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
		notebookService: new NotebookService({ ctx }),
		chatService: new Chat({ ctx }),
		noteService: new NoteService({ ctx }),
	};
};

export default Services;

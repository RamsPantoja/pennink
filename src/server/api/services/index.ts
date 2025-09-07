import type { TRPCContext } from "../trpc";
import { UserService } from "./user";
import EmailService from "./email";
import PaymentService from "./payment";
import { WorkspaceService } from "./workspace";
import { Chat } from "./chat";
import { NoteService } from "./note";
import { StorageService } from "./storage";
import { Subscription } from "./subscription";
import { FeedbackService } from "./feedback";
import { FormService } from "./form";
import { LinkService } from "./link";

export type ServicesContext = {
	userService: UserService;
	emailService: EmailService;
	paymentService: PaymentService;
	workspaceService: WorkspaceService;
	chatService: Chat;
	noteService: NoteService;
	storageService: StorageService;
	subscriptionService: Subscription;
	feedbackService: FeedbackService;
	formService: FormService;
	linkService: LinkService;
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
		storageService: new StorageService({ ctx }),
		subscriptionService: new Subscription({ ctx }),
		feedbackService: new FeedbackService({ ctx }),
		formService: new FormService({ ctx }),
		linkService: new LinkService({ ctx }),
	};
};

export default Services;

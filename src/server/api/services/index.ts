import type { TRPCContext } from "../trpc";
import BookingRequestService from "./bookingRequest";
import InterestService from "./interest";
import ProfileService from "./profile";
import RoleService from "./role";
import { UserService } from "./user";
import UserRoleService from "./userRole";
import UserTimeService from "./userTime";
import WeeklyDaysService from "./weeklyDays";
import EmailService from "./email";
import PaymentService from "./payment";
import { NotebookService } from "./notebook";

export type ServicesContext = {
	userRoleService: UserRoleService;
	roleService: RoleService;
	weeklyDaysService: WeeklyDaysService;
	userTimeService: UserTimeService;
	userService: UserService;
	interestService: InterestService;
	profileService: ProfileService;
	bookingRequestService: BookingRequestService;
	emailService: EmailService;
	paymentService: PaymentService;
	notebookService: NotebookService;
};

export type ServicesConfig = {
	ctx: TRPCContext;
};

const Services = ({ ctx }: ServicesConfig): ServicesContext => {
	return {
		userRoleService: new UserRoleService({ ctx }),
		roleService: new RoleService({ ctx }),
		weeklyDaysService: new WeeklyDaysService({ ctx }),
		userTimeService: new UserTimeService({ ctx }),
		userService: new UserService({ ctx }),
		interestService: new InterestService({ ctx }),
		profileService: new ProfileService({ ctx }),
		bookingRequestService: new BookingRequestService({ ctx }),
		emailService: new EmailService({ ctx }),
		paymentService: new PaymentService({ ctx }),
		notebookService: new NotebookService({ ctx }),
	};
};

export default Services;

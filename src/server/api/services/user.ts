import type { TRPCContext } from "../trpc";

type UserServiceContructor = {
	ctx: TRPCContext;
};

export class UserService {
	ctx: TRPCContext;

	constructor({ ctx }: UserServiceContructor) {
		this.ctx = ctx;
	}
}

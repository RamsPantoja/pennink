import { type TRPCContext } from "../trpc"
import RoleService from "./role"
import UserService from "./user"
import UserRoleService from "./userRole"
import UserTimeService from "./userTime"
import WeeklyDaysService from "./weeklyDays"

export type ServicesContext = {
    userRoleService: UserRoleService
    roleService: RoleService
    weeklyDaysService: WeeklyDaysService
    userTimeService: UserTimeService
    userService: UserService
}

export type ServicesConfig = {
    ctx: TRPCContext
}

const Services = ({ ctx }: ServicesConfig): ServicesContext => {
    return {
        userRoleService: new UserRoleService({ ctx }),
        roleService: new RoleService({ ctx }),
        weeklyDaysService: new WeeklyDaysService({ ctx }),
        userTimeService: new UserTimeService({ ctx }),
        userService: new UserService({ ctx }),
    }
}

export default Services;
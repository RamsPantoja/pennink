import { type TRPCContext } from "../trpc"
import RoleService from "./role"
import UserRoleService from "./userRole"
import WeeklyDaysService from "./weeklyDays"

export type ServicesContext = {
    userRoleService: UserRoleService
    roleService: RoleService
    weeklyDaysService: WeeklyDaysService
}

export type ServicesConfig = {
    ctx: TRPCContext
}

const Services = ({ ctx }: ServicesConfig): ServicesContext => {
    return {
        userRoleService: new UserRoleService({ ctx }),
        roleService: new RoleService({ ctx }),
        weeklyDaysService: new WeeklyDaysService({ ctx })
    }
}

export default Services;
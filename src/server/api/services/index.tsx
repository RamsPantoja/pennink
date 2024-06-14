import { type TRPCContext } from "../trpc"
import RoleService from "./role"
import UserRoleService from "./userRole"

export type ServicesContext = {
    userRoleService: UserRoleService
    roleService: RoleService
}

export type ServicesConfig = {
    ctx: TRPCContext
}

const Services = ({ ctx }: ServicesConfig): ServicesContext => {
    return {
        userRoleService: new UserRoleService({ ctx }),
        roleService: new RoleService({ ctx }),
    }
}

export default Services;
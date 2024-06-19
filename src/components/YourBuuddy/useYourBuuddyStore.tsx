import { create } from 'zustand';
import { type RouterOutputs } from '~/utils/api';
type UserRolesQueryType = RouterOutputs["userRole"]["userRoles"];

type YourBuuddyState = {
    setUserRoles: (roles: UserRolesQueryType) => void
    userRoles: UserRolesQueryType
}

const useYourBuuddyStore = create<YourBuuddyState>()((set) => ({
    batch: "Hola",
    setUserRoles: (roles) => set(() => ({ userRoles: roles })),
    userRoles: []
}))

export default useYourBuuddyStore;
import { api } from "~/utils/api";

type UseRoleLogicProps = {
    userId: string | undefined
};

const useRoleLogic = ({ userId }: UseRoleLogicProps) => {
    const { data: buuddyRolesData, isLoading: buuddyRolesIsLoading, isError: buuddyRolesIsError } = api.userRole.buuddyRoles.useQuery({
        userId: userId!
    });

    return {
        buuddyRolesData,
        buuddyRolesIsLoading,
        buuddyRolesIsError
    }
}

export default useRoleLogic;
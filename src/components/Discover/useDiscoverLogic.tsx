import { api } from "~/utils/api";

const useDiscoverLogic = () => {
    const { data: buuddiesData, isLoading: buuddiesIsLoading, isError: buuddiesIsError } = api.user.buuddies.useQuery({
        interests: [],
    });

    return {
        buuddiesData,
        buuddiesIsLoading,
        buuddiesIsError
    }
}

export default useDiscoverLogic;
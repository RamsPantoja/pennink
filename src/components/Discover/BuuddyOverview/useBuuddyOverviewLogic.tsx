import { useRouter } from "next/router";
import { api } from "~/utils/api";


const useBuuddyOverviewLogic = () => {
    const router = useRouter();
    const { username } = router.query;

    const { data: buuddyProfileData, isLoading: buuddyProfileIsLoading, isError: buuddyProfileIsError } = api.profile.buuddyProfile.useQuery({
        username: username as string
    });

    return {
        buuddyProfileIsError,
        buuddyProfileIsLoading,
        buuddyProfileData
    }
}

export default useBuuddyOverviewLogic;
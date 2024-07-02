import { type Session } from "next-auth";
import { api } from "~/utils/api";

type UseProfileLogicProps = {
    session: Session;
}

const useProfileLogic = ({ session }: UseProfileLogicProps) => {
    const { data: userData, isError: userIsError, isLoading: userIsLoading } = api.user.userById.useQuery({
        id: session.user.id
    });

    return {
        userIsError,
        userIsLoading,
        userData
    }
}

export default useProfileLogic;
import useDiscoverLogic from "./useDiscoverLogic";
import UserList from "./UserList";


const Discover = () => {
    const {
        buuddiesData,
        buuddiesIsLoading,
        buuddiesIsError
    } = useDiscoverLogic();

    return (
        <div className="flex w-full p-4">
            <UserList
                users={buuddiesData}
                isLoading={buuddiesIsLoading}
                isError={buuddiesIsError}
            />
        </div>
    )
}

export default Discover;
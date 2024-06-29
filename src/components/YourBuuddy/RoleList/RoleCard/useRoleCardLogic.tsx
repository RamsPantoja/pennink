import { useState } from "react";

// type useRoleCardLogicProps = {

// }

const useRoleCardLogic = () => {
    const [displayRoleForm, setDisplayRoleForm] = useState<boolean>(false);

    return {
        setDisplayRoleForm,
        displayRoleForm
    }
}

export default useRoleCardLogic;
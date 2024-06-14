import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { api } from "~/utils/api";
import { typeid } from "typeid-js";

const detailSchema = z.object({
    id: z.string({
        required_error: "Campo requerido"
    }).uuid("Not allowed"),
    allowed: z.boolean({
        required_error: "Campo requerido",
        invalid_type_error: "Campo requerido",
    }),
    description: z.string({
        required_error: "Campo requerido"
    }).min(1, "Campo requerido"),
});


const roleValidationSchema = z
    .object({
        role: z.string({
            required_error: "Campo requerido"
        }).min(1, "Campo requerido"),
        description: z.string({
            required_error: "Campo requerido"
        }).min(1, "Campo requerido"),
        hourPrice: z
            .number({
                required_error: "Campo requerido"
            })
            .min(100)
            .max(1000),
        details: z.array(detailSchema).nonempty()
    });
    

export type RoleValidationSchema = z.infer<typeof roleValidationSchema>
export type DetailSchema = z.infer<typeof detailSchema>

const useRoleFormLogic = () => {
    const [displayRoleForm, setDisplayRoleForm] = useState<boolean>(false);
    const useRoleForm = useForm<RoleValidationSchema>({
        resolver: zodResolver(roleValidationSchema),
        defaultValues: {
            role: "",
            description: "",
            hourPrice: 2,
        }
    });

    const [details, setDetails] = useState<DetailSchema[]>([]);

    const { data: rolesData, isError: rolesIsError, isLoading: rolesIsLoading } = api.role.roles.useQuery();

    const onAddRole = (data: RoleValidationSchema) => {
        console.log(data);
    }

    const onAddDetail = () => {
        setDetails([...details, {
            id: typeid().toUUID(),
            allowed: false,
            description: ""
        }]);
    }

    const onRemoveDetail = (id: string) => {
        setDetails((prevState) => {
            return prevState.filter((item) => item.id !== id);
        })
    }

    return {
        onAddRole,
        useRoleForm,
        displayRoleForm,
        setDisplayRoleForm,
        rolesData,
        rolesIsError,
        rolesIsLoading,
        onAddDetail,
        onRemoveDetail,
        details
    }
}

export default useRoleFormLogic;
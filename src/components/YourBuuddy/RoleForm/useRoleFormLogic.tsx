import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { typeid } from "typeid-js";
import { toast } from "sonner";

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
        details: z.array(detailSchema).min(1)
    });


export type RoleValidationSchema = z.infer<typeof roleValidationSchema>
export type DetailSchema = z.infer<typeof detailSchema>


type useRoleFormLogicProps = {
    onOpenChange: (open: boolean) => void
    userRoleId?: string
}

const useRoleFormLogic = ({ onOpenChange, userRoleId }: useRoleFormLogicProps) => {
    const utils = api.useUtils();
    const defaultDetail = {
        id: typeid().toUUID(),
        allowed: false,
        description: ""
    };
    const [details, setDetails] = useState<DetailSchema[]>([defaultDetail]);

    const useRoleForm = useForm<RoleValidationSchema>({
        resolver: zodResolver(roleValidationSchema),
        defaultValues: {
            role: "",
            description: "",
            hourPrice: 100,
            details: [defaultDetail]
        }
    });

    const { data: rolesData, isError: rolesIsError, isLoading: rolesIsLoading } = api.role.roles.useQuery();
    const { data: userRoleData, isLoading: userRoleIsLoading, error: userRoleError } = api.userRole.userRoleById.useQuery(
        {
            id: userRoleId!
        },
        {
            enabled: userRoleId ? true : false
        }
    );

    useEffect(() => {
        if (userRoleData && !userRoleError && !userRoleIsLoading) {
            const detailsSaved = userRoleData.userRoleDetails.map((item) => {
                return {
                    id: item.id,
                    allowed: item.allowed,
                    description: item.description
                }
            });

            useRoleForm.reset({
                role: userRoleData.roleId,
                description: userRoleData.description,
                hourPrice: parseInt(userRoleData.hourPrice),
                details: detailsSaved
            });

            setDetails(detailsSaved);
        }
    }, [userRoleData, userRoleIsLoading, userRoleError, useRoleForm]);

    const { mutate: createUserRoleMutation, isPending: createUserRoleMutationIsPending } = api.userRole.create.useMutation({
        onSuccess: async () => {
            useRoleForm.reset();
            setDetails([defaultDetail]);
            toast.success('Role agregado!');
            onOpenChange(false);
            await utils.userRole.userRoles.invalidate();
        },
        onError: (error) => {
            toast.error(error.message);
        }
    })

    const onAddRole = (data: RoleValidationSchema) => {
        createUserRoleMutation({
            roleId: data.role,
            hourPrice: data.hourPrice,
            description: data.description,
            details: data.details
        });
    }

    const onAddDetail = () => {
        const tempDetails = [...details, {
            id: typeid().toUUID(),
            allowed: false,
            description: ""
        }];

        setDetails(tempDetails);

        useRoleForm.setValue("details", tempDetails);
    }

    const onRemoveDetail = (id: string) => {
        const tempDetails = details.filter((item) => item.id !== id);
        setDetails(tempDetails);
        useRoleForm.setValue("details", tempDetails);
    }

    const onCloseForm = () => {
        useRoleForm.reset();
        setDetails([defaultDetail]);
    }

    const handleOnChangeDescriptionDetail = (detailId: string, value: string) => {
        const tempDetails = details.map((item) => {
            if (item.id === detailId) {
                return {
                    ...item,
                    description: value
                };
            } else {
                return item;
            }
        });

        useRoleForm.setValue("details", tempDetails);
        setDetails(tempDetails);
    }

    const handleOnChangeAllowedDetail = (detailId: string, check: boolean) => {
        const tempDetails = details.map((item) => {
            if (item.id === detailId) {
                return {
                    ...item,
                    allowed: check
                };
            } else {
                return item;
            }
        });

        useRoleForm.setValue("details", tempDetails);
        setDetails(tempDetails);
    }

    return {
        onAddRole,
        useRoleForm,
        rolesData,
        rolesIsError,
        rolesIsLoading,
        onAddDetail,
        onRemoveDetail,
        details,
        onCloseForm,
        handleOnChangeDescriptionDetail,
        handleOnChangeAllowedDetail,
        createUserRoleMutationIsPending,
        userRoleIsLoading,
        userRoleError,
        userRoleData
    }
}

export default useRoleFormLogic;
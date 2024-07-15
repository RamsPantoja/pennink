import { BuuddyButton } from "~/components/common/BuuddyButton";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import useRoleFormLogic from "./useRoleFormLogic";
import InputFeedbackMessage from "~/components/common/InputFeedbackMessage";
import { Controller } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Skeleton } from "~/components/ui/skeleton";
import { Card } from "~/components/ui/card";
import RoleCard from "./RoleCard";
import { Slider } from "@nextui-org/slider";
import DetailList from "./DetailList";
import { Fragment } from "react";

type RoleFormProps = {
    userRoleId?: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

const RoleForm = ({ open, onOpenChange, userRoleId }: RoleFormProps) => {
    const {
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
        userRoleData,
        updateUserRoleMutationIsPending,
        onEditRole
    } = useRoleFormLogic({ onOpenChange, userRoleId });

    const { register, formState, control, handleSubmit } = useRoleForm;

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent
                onEscapeKeyDown={(e) => {
                    e.preventDefault();
                }}
                onCloseAutoFocus={(e) => {
                    e.preventDefault();
                }}
                onInteractOutside={(e) => {
                    e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle>{userRoleId ? "Edit role" : "Your new role"}</DialogTitle>
                    <DialogDescription>
                        {
                            userRoleId ? "Edit the information related to the role. If you want to change the selected role, you will need to add a new role." :
                                "Complete the fields to add your new role and start offering your services!"
                        }
                    </DialogDescription>
                </DialogHeader>
                {
                    rolesIsError && !rolesIsLoading && <FeedbackMessage message="Error on getting the role list" status="ERROR" />
                }
                {
                    userRoleError && !userRoleIsLoading && <FeedbackMessage message="Error on getting the user role" status="ERROR" />
                }
                {
                    (rolesIsLoading || userRoleIsLoading) &&
                    <Card className="flex gap-2 flex-col">
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    </Card>
                }
                {
                    !rolesIsError && !rolesIsLoading && !userRoleError && !userRoleIsLoading &&
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <p className="font-bold text-sm">Role</p>
                            {
                                userRoleId && userRoleData && <span className="text-lg text-blackMain font-semibold">{userRoleData.role.name}</span>
                            }
                            {
                                !userRoleId && <Fragment>
                                    <Controller
                                        name="role"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}

                                            >
                                                <SelectTrigger ref={field.ref} className="w-[180px]">
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {
                                                        rolesData?.map((item) => {
                                                            return (
                                                                <SelectItem key={item.id} value={item.id}>
                                                                    <RoleCard
                                                                        name={item.name}
                                                                        description={item.description}
                                                                    />
                                                                </SelectItem>
                                                            )
                                                        })
                                                    }

                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {
                                        formState.errors.role && <InputFeedbackMessage status="ERROR" message={formState.errors.role.message} />
                                    }
                                </Fragment>
                            }
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm">Description</span>
                            <Textarea
                                placeholder="Type here..."
                                className="resize-none"
                                rows={7}
                                {...register("description")}
                                status={formState.errors.description && "ERROR"}
                            />
                            {
                                formState.errors.description && <InputFeedbackMessage status="ERROR" message={formState.errors.description.message} />
                            }
                        </div>
                        <div className="flex flex-col gap-1">
                            <Controller
                                name="hourPrice"
                                control={control}
                                render={({ field }) => (
                                    <Slider
                                        size="sm"
                                        step={10}
                                        color="primary"
                                        label="Price by hour"
                                        showSteps={false}
                                        maxValue={150}
                                        minValue={10}
                                        radius='full'
                                        defaultValue={userRoleId && userRoleData ? parseInt(userRoleData.hourPrice) : field.value}
                                        className="max-w-md"
                                        formatOptions={{ style: "currency", currency: "USD", currencyDisplay: "code" }}
                                        onChangeEnd={(value) => {
                                            field.onChange(value);
                                        }}
                                        classNames={{
                                            track: "border-s-blackMain",
                                            filler: "bg-gradient-to-r from-blackMain to-blackMain",
                                            label: "text-blackMain font-bold",
                                            value: "text-blackMain font-bold text-base",
                                            step: "data-[in-range=true]:bg-black/30 dark:data-[in-range=true]:bg-white/50",
                                            thumb: [
                                                "transition-size",
                                                "bg-gradient-to-r from-blackMain to-blackMain",
                                                "data-[dragging=true]:shadow-lg data-[dragging=true]:shadow-black/20",
                                                "data-[dragging=true]:w-7 data-[dragging=true]:h-7 data-[dragging=true]:after:h-6 data-[dragging=true]:after:w-6"
                                            ],
                                        }}
                                        ref={field.ref}
                                    />
                                )}
                            />
                            {
                                formState.errors.hourPrice && <InputFeedbackMessage status="ERROR" message={formState.errors.hourPrice.message} />
                            }
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm">Details allowed and not allowed</span>
                            <DetailList
                                onRemove={onRemoveDetail}
                                onAdd={onAddDetail}
                                details={details}
                                errors={formState.errors.details}
                                handleOnChangeAllowedDetail={handleOnChangeAllowedDetail}
                                handleOnChangeDescriptionDetail={handleOnChangeDescriptionDetail}
                            />
                        </div>
                    </div>
                }
                <DialogFooter className="flex flex-row items-center justify-between gap-2">
                    <DialogClose asChild>
                        <BuuddyButton onClick={onCloseForm} type="button" variant="secondary">
                            Discard
                        </BuuddyButton>
                    </DialogClose>
                    <BuuddyButton
                        onClick={handleSubmit(userRoleId ? onEditRole : onAddRole)}
                        variant='default'
                        isPending={createUserRoleMutationIsPending || updateUserRoleMutationIsPending}>
                        {
                            userRoleId ? "Save" : "Add role"
                        }
                    </BuuddyButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default RoleForm;
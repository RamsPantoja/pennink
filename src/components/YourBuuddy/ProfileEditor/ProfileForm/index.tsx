import { Card } from "~/components/ui/card";
import { type ProfileValidationSchema } from "./useProfileFormLogic";
import { Textarea } from "~/components/ui/textarea";
import InputFeedbackMessage from "~/components/common/InputFeedbackMessage";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { educationLevelEnum, genderEnum, } from "~/server/db/schema";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { Fragment } from "react";
import { mapSkeletons } from "~/lib/utils";
import { Skeleton } from "~/components/ui/skeleton";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Controller, type UseFormReturn } from "react-hook-form";
import { type Interest } from "~/server/api/services/interest";
import { type EducationLevel, type Genders } from "~/lib/enum";

type ProfileFormProps = {
    interestIsLoading: boolean
    useProfileForm: UseFormReturn<ProfileValidationSchema>
    interestIsError: boolean
    interestData?: Interest[]
}

const ProfileForm = ({ useProfileForm, interestIsLoading, interestIsError, interestData }: ProfileFormProps) => {
    const { register, formState, control } = useProfileForm;

    const skeletons = mapSkeletons({ numberOfSkeletons: 15, skeleton: <Skeleton className="h-10 w-40" /> })

    return (
        <Card className="flex gap-4 flex-col h-full overflow-auto">
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Your name*</span>
                <Input
                    placeholder="Escribe aquí..."
                    {...register("name")}
                    status={formState.errors.name && "ERROR"}
                />
                {
                    formState.errors.name && <InputFeedbackMessage status="ERROR" message={formState.errors.name.message} />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Username*</span>
                <Input
                    placeholder="Escribe aquí..."
                    {...register("username")}
                    status={formState.errors.username && "ERROR"}
                />
                {
                    formState.errors.username && <InputFeedbackMessage status="ERROR" message={formState.errors.username.message} />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Your headline*</span>
                <Input
                    placeholder="Escribe aquí..."
                    {...register("headline")}
                    status={formState.errors.headline && "ERROR"}
                />
                {
                    formState.errors.headline && <InputFeedbackMessage status="ERROR" message={formState.errors.headline.message} />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">About you*</span>
                <Textarea
                    placeholder="Escribe aquí..."
                    className="resize-none"
                    rows={4}
                    {...register("about")}
                    status={formState.errors.about && "ERROR"}
                />
                {
                    formState.errors.about && <InputFeedbackMessage status="ERROR" message={formState.errors.about.message} />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Your experience</span>
                <Textarea
                    placeholder="Escribe aquí..."
                    className="resize-none"
                    rows={4}
                    {...register("experience")}
                    status={formState.errors.experience && "ERROR"}
                />
                {
                    formState.errors.experience && <InputFeedbackMessage status="ERROR" message={formState.errors.experience.message} />
                }
            </div>
            <div className="flex flex-col gap-2">
                <span className="font-bold text-sm">Interests (min 1)</span>
                {
                    interestIsLoading && <div className="flex flex-wrap gap-2">
                        {
                            skeletons.map((skeleton, index) => {
                                return (
                                    <Fragment key={index}>
                                        {skeleton}
                                    </Fragment>
                                )
                            })
                        }
                    </div>
                }
                {
                    !interestIsLoading && !interestIsError && interestData &&
                    <Controller
                        control={control}
                        name="interests"
                        render={({ field }) => {
                            return (
                                <ToggleGroup
                                    className="flex flex-wrap gap-2"
                                    type="multiple"
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                    }}
                                    ref={field.ref}
                                    defaultValue={field.value}
                                >
                                    {
                                        interestData.map((interest) => {
                                            return (
                                                <ToggleGroupItem key={interest.id} value={interest.id} aria-label="Toggle bold">
                                                    {interest.name}
                                                </ToggleGroupItem>
                                            )
                                        })
                                    }
                                </ToggleGroup>
                            )
                        }}
                    />

                }
                {
                    !interestIsLoading && interestIsError && <FeedbackMessage status="ERROR" message="Fail to get the interest list" />
                }
                {
                    formState.errors.interests && <InputFeedbackMessage status="ERROR" message={formState.errors.interests.message} />
                }
            </div>
            <div className="flex flex-col gap-2">
                <span className="font-bold text-sm">Gender</span>
                <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => {
                        return (
                            <RadioGroup
                                className="gap-4"
                                defaultValue={field.value}
                                onValueChange={(value) => {
                                    field.onChange(value as Genders);
                                }}
                                ref={field.ref}
                            >
                                {
                                    genderEnum.enumValues.map((item) => {
                                        return (
                                            <div key={item} className="flex items-center space-x-2">
                                                <RadioGroupItem value={item} id={item} />
                                                <Label htmlFor={item}>
                                                    {
                                                        item === "FEMALE" && "Female"
                                                    }
                                                    {
                                                        item === "MALE" && "Male"
                                                    }
                                                </Label>
                                            </div>
                                        )
                                    })
                                }
                            </RadioGroup>
                        )
                    }}
                />
                {
                    formState.errors.gender && <InputFeedbackMessage status="ERROR" message={formState.errors.gender.message} />
                }
            </div>
            <div className="flex flex-col gap-2">
                <span className="font-bold text-sm">Education level</span>
                <Controller
                    control={control}
                    name="educationLevel"
                    render={({ field }) => {
                        return (
                            <RadioGroup
                                className="gap-4"
                                defaultValue={field.value}
                                onValueChange={(value) => {
                                    field.onChange(value as EducationLevel);
                                }}
                                ref={field.ref}
                            >
                                {
                                    educationLevelEnum.enumValues.map((item) => {
                                        return (
                                            <div key={item} className="flex items-center space-x-2">
                                                <RadioGroupItem value={item} id={item} />
                                                <Label htmlFor={item}>
                                                    {
                                                        item === "GRADUATE_DEGREE" && "Graduate degree"
                                                    }
                                                    {
                                                        item === "HIGH_SCHOOL" && "High school"
                                                    }
                                                    {
                                                        item === "IN_COLLEGE" && "In college"
                                                    }
                                                    {
                                                        item === "TECH_SCHOOL" && "Tech school"
                                                    }
                                                </Label>
                                            </div>
                                        )
                                    })
                                }
                            </RadioGroup>
                        )
                    }}
                />
                {
                    formState.errors.educationLevel && <InputFeedbackMessage status="ERROR" message={formState.errors.educationLevel.message} />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Website</span>
                <Input
                    placeholder="Escribe aquí..."
                    {...register("website")}
                    status={formState.errors.website && "ERROR"}
                />
                {
                    formState.errors.website && <InputFeedbackMessage status="ERROR" message={formState.errors.website.message} />
                }
            </div>
        </Card>
    )
}

export default ProfileForm;
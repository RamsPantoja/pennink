import { Card } from "~/components/ui/card";
import useProfileFormLogic from "./useProfileFormLogic";
import { Textarea } from "~/components/ui/textarea";
import InputFeedbackMessage from "~/components/common/InputFeedbackMessage";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { drinkingEnum, educationLevelEnum, exerciseEnum, genderEnum, smokingEnum } from "~/server/db/schema";
import { Badge } from "~/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";


const ProfileForm = () => {
    const {
        useProfileForm,
        interestData,
        interestError,
        interestIsLoading
    } = useProfileFormLogic();

    const { register, formState } = useProfileForm;

    return (
        <Card className="flex gap-4 flex-col h-full overflow-auto">
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Your name</span>
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
                <span className="font-bold text-sm">About you</span>
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
            <div className="flex flex-col gap-2">
                <span className="font-bold text-sm">Interests</span>
                <ToggleGroup className="flex flex-wrap gap-2" type="multiple">
                    {
                        !interestIsLoading && interestData?.map((interest) => {
                            return (
                                <ToggleGroupItem key={interest.id} value={interest.id} aria-label="Toggle bold">
                                    {interest.name}
                                </ToggleGroupItem>
                            )
                        })
                    }
                </ToggleGroup>
                {
                    formState.errors.gender && <InputFeedbackMessage status="ERROR" message={formState.errors.gender.message} />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Gender</span>
                <RadioGroup className="flex gap-4" defaultValue="FEMALE">
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
                {
                    formState.errors.gender && <InputFeedbackMessage status="ERROR" message={formState.errors.gender.message} />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Your work</span>
                <Textarea
                    placeholder="Escribe aquí..."
                    className="resize-none"
                    rows={4}
                    {...register("work")}
                    status={formState.errors.work && "ERROR"}
                />
                {
                    formState.errors.work && <InputFeedbackMessage status="ERROR" message={formState.errors.work.message} />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">What you love</span>
                <Textarea
                    placeholder="Escribe aquí..."
                    className="resize-none"
                    rows={4}
                    {...register("whatLoves")}
                    status={formState.errors.whatLoves && "ERROR"}
                />
                {
                    formState.errors.whatLoves && <InputFeedbackMessage status="ERROR" message={formState.errors.whatLoves.message} />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Your pets</span>
                <Textarea
                    placeholder="Escribe aquí..."
                    className="resize-none"
                    rows={4}
                    {...register("whatLoves")}
                    status={formState.errors.whatLoves && "ERROR"}
                />
                {
                    formState.errors.whatLoves && <InputFeedbackMessage status="ERROR" message={formState.errors.whatLoves.message} />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Education level</span>
                <RadioGroup className="flex gap-4" defaultValue="GRADUATE_DEGREE">
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
                {
                    formState.errors.gender && <InputFeedbackMessage status="ERROR" message={formState.errors.gender.message} />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Exercise</span>
                <RadioGroup className="flex gap-4" defaultValue="GRADUATE_DEGREE">
                    {
                        exerciseEnum.enumValues.map((item) => {
                            return (
                                <div key={item} className="flex items-center space-x-2">
                                    <RadioGroupItem value={item} id={item} />
                                    <Label htmlFor={item}>
                                        {
                                            item === "ACTIVE" && "Active"
                                        }
                                        {
                                            item === "ALMOST_NEVER" && "Almost never"
                                        }
                                        {
                                            item === "SOMETIMES" && "Sometimes"
                                        }
                                    </Label>
                                </div>
                            )
                        })
                    }
                </RadioGroup>
                {
                    formState.errors.gender && <InputFeedbackMessage status="ERROR" message={formState.errors.gender.message} />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Drinking</span>
                <RadioGroup className="flex gap-4" defaultValue="GRADUATE_DEGREE">
                    {
                        drinkingEnum.enumValues.map((item) => {
                            return (
                                <div key={item} className="flex items-center space-x-2">
                                    <RadioGroupItem value={item} id={item} />
                                    <Label htmlFor={item}>
                                        {
                                            item === "FREQUENTLY" && "Frequently"
                                        }
                                        {
                                            item === "NEVER" && "Never"
                                        }
                                        {
                                            item === "SOBER" && "Sober"
                                        }
                                        {
                                            item === "SOCIALLY" && "Socially"
                                        }
                                    </Label>
                                </div>
                            )
                        })
                    }
                </RadioGroup>
                {
                    formState.errors.gender && <InputFeedbackMessage status="ERROR" message={formState.errors.gender.message} />
                }
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-bold text-sm">Smoking</span>
                <RadioGroup className="flex gap-4" defaultValue="GRADUATE_DEGREE">
                    {
                        smokingEnum.enumValues.map((item) => {
                            return (
                                <div key={item} className="flex items-center space-x-2">
                                    <RadioGroupItem value={item} id={item} />
                                    <Label htmlFor={item}>
                                        {
                                            item === "NEVER" && "Never"
                                        }
                                        {
                                            item === "REGULARLY" && "Regularly"
                                        }
                                        {
                                            item === "SOCIALLY" && "Socially"
                                        }
                                    </Label>
                                </div>
                            )
                        })
                    }
                </RadioGroup>
                {
                    formState.errors.gender && <InputFeedbackMessage status="ERROR" message={formState.errors.gender.message} />
                }
            </div>
        </Card>
    )
}

export default ProfileForm;
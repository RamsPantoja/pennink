import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { educationLevelEnum, genderEnum } from "~/server/db/schema";
import { api } from "~/utils/api";

const profileValidationSchema = z
    .object({
        username: z.string({
            required_error: "Required field"
        }).min(1, "Required field").trim(),
        website: z.string().trim().optional().nullable(),
        about: z.string({
            required_error: "Required field"
        }).min(1, "Required field").trim(),
        gender: z.enum(genderEnum.enumValues),
        experience: z.string().trim().optional().nullable(),
        name: z.string({
            required_error: "Required field"
        }).min(1, "Required field").trim(),
        headline: z.string({
            required_error: "Required field"
        }).min(1, "Required field").trim(),
        educationLevel: z.enum(educationLevelEnum.enumValues),
        interests: z.array(z.string().uuid()).min(1, "Least 1 interest")
    });

export type ProfileValidationSchema = z.infer<typeof profileValidationSchema>

type UseProfileFormLogicProps = {
    onSuccessCallback?: () => void
}

const useProfileFormLogic = ({ onSuccessCallback }: UseProfileFormLogicProps) => {
    const utils = api.useUtils();
    const { data: interestData, isLoading: interestIsLoading, isError: interestIsError } = api.interest.interests.useQuery();
    const { data: userProfileData, isLoading: userProfileIsLoading, isError: userProfileIsError } = api.profile.userProfile.useQuery();

    const useProfileForm = useForm<ProfileValidationSchema>({
        resolver: zodResolver(profileValidationSchema),
        defaultValues: {
            about: "",
            gender: "FEMALE",
            experience: "",
            name: "",
            headline: "",
            username: "",
            educationLevel: "GRADUATE_DEGREE",
            website: "",
            interests: []
        }
    });

    useEffect(() => {
        if (userProfileData && !userProfileIsLoading && !userProfileIsError) {
            useProfileForm.reset({
                about: userProfileData.profile?.about,
                username: userProfileData.profile?.username,
                website: userProfileData.profile?.website,
                gender: userProfileData.profile?.gender,
                experience: userProfileData.profile?.experience,
                name: userProfileData.session.user.name!,
                headline: userProfileData.profile?.headline,
                educationLevel: userProfileData.profile?.educationLevel,
                interests: userProfileData.interests.map((item) => item.interestId)
            });
        }
    }, [userProfileData, userProfileIsLoading, userProfileIsError, useProfileForm]);

    const { mutate: upsertProfileMutation, isPending: upsertProfileMutationIsPending } = api.profile.upsert.useMutation({
        onSuccess: async () => {
            toast.success('The information has been saved!');
            await utils.user.userById.invalidate();

            if (onSuccessCallback) {
                onSuccessCallback();
            }
        },
        onError: (error) => {
            toast.error(error.message);
        }
    })

    const onSave = (data: ProfileValidationSchema) => {
        upsertProfileMutation(data);
    }

    return {
        useProfileForm,
        interestData,
        interestIsLoading,
        interestIsError,
        onSave,
        upsertProfileMutationIsPending,
        userProfileIsLoading
    }
}

export default useProfileFormLogic;
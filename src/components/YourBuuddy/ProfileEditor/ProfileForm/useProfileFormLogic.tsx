import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { drinkingEnum, educationLevelEnum, exerciseEnum, genderEnum, smokingEnum } from "~/server/db/schema";
import { api } from "~/utils/api";

const profileValidationSchema = z
    .object({
        about: z.string({
            required_error: "Campo requerido"
        }).min(1, "Campo requerido"),
        gender: z.enum(genderEnum.enumValues),
        work: z.string({
            required_error: "Campo requerido"
        }).min(1, "Campo requerido"),
        birthday: z.string({
            required_error: "Campo requerido"
        }).min(1, "Campo requerido"),
        whatLoves: z.string({
            required_error: "Campo requerido"
        }).min(1, "Campo requerido"),
        name: z.string({
            required_error: "Campo requerido"
        }).min(1, "Campo requerido"),
        pets: z.string({
            required_error: "Campo requerido"
        }).min(1, "Campo requerido"),
        educationLevel: z.enum(educationLevelEnum.enumValues),
        exercise: z.enum(exerciseEnum.enumValues),
        drinking: z.enum(drinkingEnum.enumValues),
        smoking: z.enum(smokingEnum.enumValues),
    });

export type ProfileValidationSchema = z.infer<typeof profileValidationSchema>


const useProfileFormLogic = () => {

    const { data: interestData, isLoading: interestIsLoading, error: interestError } = api.interest.interests.useQuery();

    const useProfileForm = useForm<ProfileValidationSchema>({
        resolver: zodResolver(profileValidationSchema),
        defaultValues: {
            about: "",
            gender: "FEMALE",
            work: "",
            birthday: "",
            whatLoves: "",
            name: "",
            pets: "",
            educationLevel: "GRADUATE_DEGREE",
            exercise: "SOMETIMES",
            drinking: "SOCIALLY",
            smoking: "SOCIALLY"
        }
    });

    return {
        useProfileForm,
        interestData,
        interestIsLoading,
        interestError
    }
}

export default useProfileFormLogic;
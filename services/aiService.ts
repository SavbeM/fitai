import type {
    AlgorithmInput,
    WorkoutPlanInput,
    ProfileInput,
    GoalInput,
} from "@/types/databaseServiceTypes";
import {zodResponseFormat} from "openai/helpers/zod";
import {algorithmSchema, goalSchema, profileSchema, workoutPlanSchema} from "@/validation/zodSchema";
import OpenAI from "openai";

const openai = new OpenAI();


export const aiService = {

    async generateAlgorithm(
        viewTemplate: string,
        profile: ProfileInput,
        goal: GoalInput
    ): Promise<AlgorithmInput> {


        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o-2024-08-06",
            messages: [
                { role: "system", content: "Ты генерируешь алгоритм для фитнес-проекта. На основе данных профиля и цели сгенерируй алгоритм" +
                        "который будет создавать план тренировок" },

                { role: "user", content: JSON.stringify({ viewTemplate, profile, goal }) },
            ],
            response_format: zodResponseFormat(algorithmSchema, "algorithm"),
        });

        const result = completion.choices[0].message?.content;
        if (!result) throw new Error("AI не вернул результат для алгоритма.");
        try {
            const parsed = JSON.parse(result);
            const valid = algorithmSchema.parse(parsed);
            return valid;
        } catch (e) {
            console.error("Ошибка генерации алгоритма:", e);
            throw new Error("Некорректный формат AI-ответа для алгоритма.");
        }
    },


    async generateWorkoutPlan(
        goal: GoalInput,
        profile: ProfileInput,
        algorithm: AlgorithmInput
    ): Promise<WorkoutPlanInput> {

        const completion = await openai.beta.chat.completions.parse(
            {
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "Ты генерируешь план тренировок для фитнес-проекта на основе данных цели, текущего профиля и алгоритма." },
                    { role: "user", content:  JSON.stringify({ goal, profile, algorithm }) },
                ],
                response_format: zodResponseFormat(workoutPlanSchema, "workoutPlan"),
            }
        );
        const result = completion.choices[0].message?.content;
        if (!result) throw new Error("AI не вернул результат для плана тренировок.");
        try {
            const parsed = JSON.parse(result);
            const valid = workoutPlanSchema.parse(parsed);
            return valid;
        } catch (e) {
            console.error("Ошибка генерации плана тренировок:", e);
            throw new Error("Некорректный формат AI-ответа для плана тренировок.");
        }
    },

    async generateProfile(
        projectDescription: string,
        projectName: string,
    ): Promise<ProfileInput> {

    const completion = await openai.beta.chat.completions.parse({
       model: "gpt-4o",
         messages: [
              { role: "system", content: "Ты генерируешь структуру профиля пользователя которая нужна для того чтобы он достиг своей цели в фитнес проекте" },
              { role: "user", content: JSON.stringify({ projectDescription, projectName }) },
         ],
    })
        const result = completion.choices[0].message?.content;
        if (!result) throw new Error("AI не вернул результат для профиля.");
        try {
            const parsed = JSON.parse(result);
            const valid = profileSchema.parse(parsed);
            return valid;
        } catch (e) {
            console.error("Ошибка генерации профиля:", e);
            throw new Error("Некорректный формат AI-ответа для профиля.");
        }
    },


    async generateGoal(
        projectName: string,
        projectDescription: string,
        profile: ProfileInput
    ): Promise<GoalInput> {

     const completion = await openai.beta.chat.completions.parse({
        model: "gpt-4o",
        messages: [
            { role: "system", content: "Ты генерируешь цель для фитнес-проекта на основе данных профиля и описания проекта. Цель это желаемый профиль пользователя." },
            { role: "user", content: JSON.stringify({ projectName, projectDescription, profile }) },
        ],
        response_format: zodResponseFormat(goalSchema, "goal"),
     });
        const result = completion.choices[0].message?.content;
        if (!result) throw new Error("AI не вернул результат для цели.");
        try {
            const parsed = JSON.parse(result);
            const valid = goalSchema.parse(parsed);
            return valid;
        } catch (e) {
            console.error("Ошибка генерации цели:", e);
            throw new Error("Некорректный формат AI-ответа для цели.");
        }
    },

};

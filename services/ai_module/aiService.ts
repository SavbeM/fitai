import { zodResponseFormat } from "openai/helpers/zod";
import {
    algorithmSchema,
    goalSchema, profileBiometricsSchema,

    workoutPlanSchema
} from "@/validation/zodSchema";
import OpenAI from "openai";

import type {
    AlgorithmInput,
    WorkoutPlanInput,
    ProfileInput,
    GoalInput
} from "@/types/databaseServiceTypes";


import {
    ALGORITHM_SYSTEM_PROMPT,
    createAlgorithmUserPrompt,
    WORKOUT_PLAN_SYSTEM_PROMPT,
    createWorkoutPlanUserPrompt,
    PROFILE_SYSTEM_PROMPT,
    createProfileUserPrompt,
    GOAL_SYSTEM_PROMPT,
    createGoalUserPrompt
} from "./prompts";

import {BiometricsResponse} from "@/services/ai_module/types"; // Importing prompt templates

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
                { role: "system", content: ALGORITHM_SYSTEM_PROMPT },
                { role: "user", content: createAlgorithmUserPrompt(viewTemplate, profile, goal) },
            ],
            response_format: zodResponseFormat(algorithmSchema, "algorithm"),
        });

        const result = completion.choices[0].message?.content;
        if (!result) throw new Error("AI did not return a valid algorithm.");
        try {
            const parsed = JSON.parse(result);
            const valid = algorithmSchema.parse(parsed);
            return valid;
        } catch (e) {
            console.error("Algorithm generation error:", e);
            throw new Error("Invalid AI response format for algorithm.");
        }
    },

    async generateWorkoutPlan(
        goal: GoalInput,
        profile: ProfileInput,
        algorithm: AlgorithmInput
    ): Promise<WorkoutPlanInput> {
        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o",
            messages: [
                { role: "system", content: WORKOUT_PLAN_SYSTEM_PROMPT },
                { role: "user", content: createWorkoutPlanUserPrompt(goal, profile, algorithm) },
            ],
            response_format: zodResponseFormat(workoutPlanSchema, "workoutPlan"),
        });

        const result = completion.choices[0].message?.content;
        if (!result) throw new Error("AI did not return a valid workout plan.");
        try {
            const parsed = JSON.parse(result);
            const valid = workoutPlanSchema.parse(parsed);
            return valid;
        } catch (e) {
            console.error("Workout plan generation error:", e);
            throw new Error("Invalid AI response format for workout plan.");
        }
    },


    async generateProfile(
        projectDescription: string,
        projectName: string
    ): Promise<BiometricsResponse> {
        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o",
            messages: [
                { role: "system", content: PROFILE_SYSTEM_PROMPT },
                { role: "user", content: createProfileUserPrompt(projectDescription, projectName) },
            ],
            response_format: zodResponseFormat(profileBiometricsSchema, "biometrics"),
        });

        const result = completion.choices[0].message?.content;
        if (!result) throw new Error("AI did not return a valid profile.");
        try {
            const parsed = JSON.parse(result);
            const valid = profileBiometricsSchema.parse(parsed);
            return valid;
        } catch (e) {
            console.error("Profile generation error:", e);
            throw new Error("Invalid AI response format for profile.");
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
                { role: "system", content: GOAL_SYSTEM_PROMPT },
                { role: "user", content: createGoalUserPrompt(projectName, projectDescription, profile) },
            ],
            response_format: zodResponseFormat(goalSchema, "goal"),
        });

        const result = completion.choices[0].message?.content;
        if (!result) throw new Error("AI did not return a valid goal.");
        try {
            const parsed = JSON.parse(result);
            const valid = goalSchema.parse(parsed);
            return valid;
        } catch (e) {
            console.error("Goal generation error:", e);
            throw new Error("Invalid AI response format for goal.");
        }
    },
};

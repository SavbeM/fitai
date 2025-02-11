import {zodResponseFormat} from "openai/helpers/zod";
import {
    ActivityCandidate, activityCandidateArraySchema,
    AlgorithmAI,
    algorithmSchema, biometricsArray,
    GoalArray,
    goalSchema,

    profileBiometricsSchema,
} from "@/validation/zodSchema";
import OpenAI from "openai";

import {
    ACTIVITIES_SYSTEM_PROMPT,
    ALGORITHM_SYSTEM_PROMPT, createActivitiesUserPrompt,
    createAlgorithmUserPrompt,
    createGoalUserPrompt,
    createProfileUserPrompt,
    GOAL_SYSTEM_PROMPT,
    PROFILE_SYSTEM_PROMPT,
} from "./prompts";


const openai = new OpenAI();

export const aiService = {
    async generateAlgorithm(
        activities: ActivityCandidate[],
        profile: biometricsArray,
        goal: GoalArray
    ): Promise<AlgorithmAI> {
        const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o-2024-08-06",
            messages: [
                { role: "system", content: ALGORITHM_SYSTEM_PROMPT },
                { role: "user", content: createAlgorithmUserPrompt(activities, profile, goal) },
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


    async generateProfile(
        projectDescription: string,
        projectName: string
    ): Promise<biometricsArray> {
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
        profile: biometricsArray
    ): Promise<GoalArray> {
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

    async  generateActivities(
        goal: GoalArray,
        profile: biometricsArray,
        acceptedActivities?: ActivityCandidate[],
        declinedActivities?: ActivityCandidate[]
    ): Promise<ActivityCandidate[]> {


            const completion = await openai.beta.chat.completions.parse({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: ACTIVITIES_SYSTEM_PROMPT
                    },
                    { role: "user", content: createActivitiesUserPrompt(goal, profile, acceptedActivities, declinedActivities)},
                ],
                response_format: zodResponseFormat(activityCandidateArraySchema, "activity"),
            });

        const result = completion.choices[0].message?.content;
        if (!result) throw new Error("AI did not return a valid goal.");
        try {
            const parsed = JSON.parse(result);
            const valid = activityCandidateArraySchema.parse(parsed);
            return valid;
        } catch (e) {
            console.error("Goal generation error:", e);
            throw new Error("Invalid AI response format for goal.");
        }

    }
};

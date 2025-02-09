import {zodResponseFormat} from "openai/helpers/zod";
import {
    ActivityCandidate,
    activitySchema, AlgorithmAI,
    algorithmSchema,
    GoalArray,
    goalSchema,
    ProfileBiometricsArray,
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
        profile: ProfileBiometricsArray,
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
    ): Promise<ProfileBiometricsArray> {
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
        profile: ProfileBiometricsArray
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
        profile: ProfileBiometricsArray,
        userChoice: (activityCandidate: ActivityCandidate) => Promise<boolean>
    ): Promise<{ activities: ActivityCandidate[] }> {

        const acceptedActivities: ActivityCandidate[] = [];
        const declinedActivities: ActivityCandidate[] = [];
        const maxIterations = 20;
        let iterations = 0;

        while (acceptedActivities.length < 10 && iterations < maxIterations) {
            iterations++;
            const completion = await openai.beta.chat.completions.parse({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: ACTIVITIES_SYSTEM_PROMPT
                    },
                    { role: "user", content: createActivitiesUserPrompt({...declinedActivities, ...acceptedActivities}, goal, profile ) },
                ],
                response_format: zodResponseFormat(activitySchema, "activity"),
            });

            const result = completion.choices[0].message?.content;
            if (!result) {
                console.error("No result received for candidate activity.");
                continue;
            }
            let candidateActivity;
            try {
                candidateActivity = JSON.parse(result);
                candidateActivity = activitySchema.parse(candidateActivity);
            } catch (e) {
                console.error("Error parsing candidate activity:", e);
                continue;
            }

            const approved = await userChoice(candidateActivity);
            if (approved) {
                acceptedActivities.push(candidateActivity);
            } else {
                declinedActivities.push(candidateActivity);
            }
        }

        if (acceptedActivities.length < 10) {
            console.warn("Not enough activities approved. Returning available activities.");
        }

        return {activities: acceptedActivities};
    }
};

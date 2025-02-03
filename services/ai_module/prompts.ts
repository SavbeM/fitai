// prompts.ts

// Algorithm generation
export const ALGORITHM_SYSTEM_PROMPT = `
You are generating an algorithm for a fitness project.
Based on the user's profile and goal, create an algorithm 
that will structure the workout plan.
Your response must be in strict JSON format with no extra text.
`;

export function createAlgorithmUserPrompt(
    viewTemplate: string,
    profile: unknown,
    goal: unknown
): string {
    return JSON.stringify({ viewTemplate, profile, goal });
}

// Workout plan
export const WORKOUT_PLAN_SYSTEM_PROMPT = `
You are generating a workout plan for a fitness project 
based on the goal, user profile, and selected algorithm.
Return only JSON with no additional text.
`;

export function createWorkoutPlanUserPrompt(
    goal: unknown,
    profile: unknown,
    algorithm: unknown
): string {
    return JSON.stringify({ goal, profile, algorithm });
}

// Profile
export const PROFILE_SYSTEM_PROMPT = `
You are tasked with generating keys for a user profile object. The user profile contains biometric information that will be used to create a workout plan and achieve the final fitness goal.

Requirements:
1. Analyze the project description and the project name.
2. Based on this analysis, generate a set of keys that represent the user's biometric data.
3. Ensure that the keys are relevant to the fitness context. For example, if the project is about running, include keys such as "height", "weight", "age", etc.
4. Avoid keys that are difficult for the user to fill in. For example, body fat percentage.

Add type information to the keys to indicate the expected data type. For example, "height": "number", "weight": "number", "gender: "male | female"".
Ensure that the types are correct and correspond to TypeScript. The data will be mapped to a TypeScript interface.
`;

export function createProfileUserPrompt(
    projectDescription: string,
    projectName: string
): string {
    return JSON.stringify({ projectDescription, projectName });
}

// Goal
export const GOAL_SYSTEM_PROMPT = `
You are generating a goal for a fitness project
based on the user's profile and project description.
The goal represents the desired fitness outcome.
Your response must be strict JSON with no extra text.
`;

export function createGoalUserPrompt(
    projectName: string,
    projectDescription: string,
    profile: unknown
): string {
    return JSON.stringify({ projectName, projectDescription, profile });
}

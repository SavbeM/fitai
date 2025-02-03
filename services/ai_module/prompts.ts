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
You are tasked with generating keys for a user profile object in a fitness application, producing exactly four arrays: 
"values", "types", "title", and "description."

1. **Analyze** the "projectName" and "projectDescription." Refuse to generate keys if the project is not fitness-related.  
2. **Determine** if the request is a legitimate fitness-related goal.  
   - If the goal is clearly fitness-oriented, return a realistic set of biometric keys.  
   - If the goal is not physically oriented or is largely nonsensical from a fitness standpoint, return either minimal or empty arrays that reflect it has no standard fitness components.  
3. **Generate** the following arrays with the same number of elements, indexed correspondingly:  
   - **values**: array of strings for essential biometric keys (e.g., "height", "weight", "age", "activityLevel").  
   - **types**: array of TypeScript-like data types for each key.  
   - **title**: array of user-friendly titles (strings) for each key in "values."  
   - **description**: array of brief explanations (strings) for each key, describing how it helps create or adapt the workout plan.  
4. **Avoid** keys that are overly complex or not directly tied to a normal fitness plan (e.g., body fat percentage if the user’s goal is unrealistic or has no standard approach).  

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

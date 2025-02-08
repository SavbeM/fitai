import {GoalArray, ProfileBiometricsArray} from "@/validation/zodSchema";

export type ObjectGeneratorReturnType = {
    profileDefinition?: Record<string, { type: string; title: string; description: string }>;
    goalDefinition?: Record<string, { type: string; value: string }>;
};

export type ObjectGeneratorArgs = {
    profile: ProfileBiometricsArray;
    goal: GoalArray;
};
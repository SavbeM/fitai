import {GoalArray, ProfileBiometricsArray} from "@/validation/zodSchema";
import {BiometricsData, GoalData} from "@/services/databaseServiceTypes";

export type ObjectGeneratorReturnType = {
    profileDefinition?: BiometricsData
    goalDefinition?: GoalData
};


export type ObjectGeneratorArgs = {
    profile: ProfileBiometricsArray;
    goal: GoalArray;
};
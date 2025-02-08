import type {EnumTabType, EnumViewTemplate, TabInput} from "@/services/databaseServiceTypes";
import {ActivityCandidate, ProfileBiometricsArray} from "@/validation/zodSchema";

export interface BuildProject {
    name: string
    description: string
    userId: string
}

export interface InitProjectParams {
    user: {
        id?: string;
        name: string;
        email: string;
    };
    project: Omit<BuildProject, "userId">;
    initialTab: {
        type: EnumTabType;
        tabData: TabInput;
    };
    viewTemplate: EnumViewTemplate;
    userChoice: (activityCandidate: ActivityCandidate) => Promise<boolean>;
    fillProfile: (profileData: ProfileBiometricsArray) => Promise<ProfileBiometricsArray>;
}
import {
    Prisma,
    $Enums,
    EnumTabType,
    EnumProfileActivityLevel,
} from "@prisma/client";


enum EnumAllowedValues {
    VALUE1,
    VALUE2,
    VALUE3,
    VALUE4,
    VALUE5,
}

export interface StatsData {
    [key: string]: number | boolean | EnumAllowedValues;
}


export interface CreateProjectArgs {
    userId: string;
    name: string;
    description: string;
    profile: CreateProfileArgs;
    tabs: CreateTabArgs[];
    goal: CreateGoalArgs;
}


export interface CreateGoalArgs {
    goalData: StatsData;
}


export interface CreateProfileArgs {
    age: number;
    weight: number;
    height: number;
    activityLevel: EnumProfileActivityLevel;
    otherData: StatsData;
}


export interface CreateTabArgs {
    title: string;
    type: EnumTabType;
    algorithms: Prisma.AlgorithmCreateWithoutTabInput[];
    workoutPlan?: Prisma.WorkoutPlanCreateWithoutTabInput;
    activities: CreateActivityArgs[];
}


export interface CreateActivityArgs {
    title: string;
    description: string;
    type: $Enums.EnumActivityDataType;
    data: ActivityData;
}



export interface ActivityData {
    enum?: number | boolean | EnumAllowedValues | undefined;
    atomic?: number | boolean | EnumAllowedValues | undefined;
    numeric?: number | boolean | EnumAllowedValues | undefined;
}
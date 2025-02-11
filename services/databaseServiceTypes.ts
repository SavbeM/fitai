import { Prisma } from "@prisma/client";

export type EnumProfileActivityLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type EnumActivityDataType = 'ATOMIC' | 'NUMERIC' | 'ENUM';
export type EnumViewTemplate = 'TODO';
export type EnumTabType = 'WORKOUT' | 'NUTRITION' | 'PROGRESS';

export const EnumTabTypes = ['WORKOUT', 'NUTRITION', 'PROGRESS'] as const;
export const EnumActivityDataTypes = ['ATOMIC', 'NUMERIC', 'ENUM'] as const;
export const EnumViewTemplates = ['TODO'] as const;

export interface CreateProjectInput {
    name: string;
    description: string;
    userId: string;
    profile: ProfileInput;
    tabs: TabInput[];
    goal: GoalInput;
}

export type BiometricsData = Record<string, { type: string; title: string; description: string }>;

export type GoalData = Record<string, { type: string; value: string }>;


export interface ProfileInput {
    biometrics: Prisma.InputJsonValue;
}

export interface TabInput {
    title: string;
    type: EnumTabType;
    workoutPlan?: WorkoutPlanInput;
}

export interface WorkoutPlanInput {
    activities: ActivityInput[];
    algorithm?: AlgorithmInput;
    viewTemplate: EnumViewTemplate;
}

export interface ActivityInput {
    title: string;
    description: string;
    type: EnumActivityDataType;
    data: ActivityDataInput;
    date: Date | string;
}

export interface ActivityDataInput {
    atomic?: boolean;
    numeric?: number;
    enum?: string;
}

export interface AlgorithmInput {
    calculationAlgorithm: string;
}

export interface GoalInput {
    goalStats: Prisma.InputJsonValue;
}

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
    include: {
        profile: true;
        goal: true;
        tabs: {
            include: {
                workoutPlan: {
                    include: {
                        activities: true;
                        algorithm: true;
                    };
                };
            };
        };
    };
}>;

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

export interface ProfileInput {
    biometrics: Prisma.InputJsonValue;
}

export interface TabInput {
    title: string;
    type: EnumTabType;
    algorithms: AlgorithmInput[];
    workoutPlan?: WorkoutPlanInput;
}

export interface WorkoutPlanInput {
    activities: ActivityInput[];
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
    viewTemplate: EnumViewTemplate;
    calculationAlgorithm: string;
    //TODO: replace this shit with normal type
    viewData: object;
}

export interface GoalInput {
    goalStats: Prisma.InputJsonValue;
}

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
    include: {
        profile: true;
        projectGoal: true;
        tabs: {
            include: {
                algorithms: true;
                workoutPlan: {
                    include: {
                        activities: true;
                    };
                };
            };
        };
    };
}>;

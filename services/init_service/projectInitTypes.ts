import {ConfigTemplate, Project} from "@prisma/client";

export interface ProjectBuilderParams {
    userId: string;
    title: string;
    description: string;
}

export interface ProjectBuilderContext {
    userId: string;
    title: string;
    description: string;
    project?: Project;
    configTemplate?: ConfigTemplate;
}


export const StepName = {
    CREATE_PROJECT: "createProject",
    GET_CONFIG_TEMPLATE: "getConfigTemplate",
} as const;

export type StepNameType = (typeof StepName)[keyof typeof StepName];

export interface ProjectBuilderResponse{
    message: string;
    success: boolean;
    step: StepNameType;
}

export interface ProjectBuilderResult{
    ok: boolean;
    project: Project;
}


export type ServerMessage =
    | { type: "hello" }
    | { type: "step"; payload: ProjectBuilderResponse }
    | { type: "done"; payload: ProjectBuilderResult }
    | { type: "error"; payload: {message: string} };
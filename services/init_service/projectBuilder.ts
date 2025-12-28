import {DatabaseService} from "@/services/database_service/databaseServiceTypes";
import {databaseService} from "@/services/database_service/databaseService";
import {
    ProjectBuilderContext,
    ProjectBuilderParams,
    ProjectBuilderResponse, StepName, StepNameType
} from "@/services/init_service/projectInitTypes";



const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    try { return JSON.stringify(error); } catch { return String(error); }
};

const handleResponse = (
    step: StepNameType,
    { error, message }: { error?: unknown; message?: string } = {},
): ProjectBuilderResponse => {
    const success = !error;
    const fallbackMessage = success
        ? `Step ${step} completed successfully.`
        : `Step ${step} failed: ${getErrorMessage(error)}`;

    return { step, success, message: message ?? fallbackMessage };
}

/** Builder responsible for creating a project with profile and workout plan.
 Some methods rely on future AI or executor modules and are mocked for now. **/

export class ProjectBuilder {
    private context: ProjectBuilderContext;
    private databaseService: DatabaseService;
    constructor({userId, title, description}: ProjectBuilderParams) {
        this.databaseService = databaseService;
        this.context = {
            userId,
            title,
            description,
        };
    }

    async createProject(): Promise<ProjectBuilderResponse> {
        try{
            this.context.project = await this.databaseService.createProject({
                userId: this.context.userId,
                title: this.context.title,
                description: this.context.description,
            });
            return handleResponse(StepName.CREATE_PROJECT);
        }
        catch (error) {
            return handleResponse(StepName.CREATE_PROJECT, { error });
        }
    }

    // Final result of builder execution
    build(){
        return {
        };
    }
}

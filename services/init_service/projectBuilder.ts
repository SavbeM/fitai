import {DatabaseService} from "@/services/database_service/databaseServiceTypes";
import {databaseService} from "@/services/database_service/databaseService";
import {
    ProjectBuilderContext,
    ProjectBuilderParams,
    ProjectBuilderResponse, StepName, StepNameType
} from "@/services/init_service/projectInitTypes";
import {SearchService} from "@/services/search_service/searchService";
import {AtlasTemplateSearch} from "@/services/search_service/atlasTemplateSearch";
import {SmartTemplateSearch} from "@/services/search_service/smartTemplateSearch";
import {TemplateSearchResult} from "@/services/search_service/searchServiceTypes";


const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
};

const handleResponse = (
    step: StepNameType,
    {error, message}: { error?: unknown; message?: string } = {},
): ProjectBuilderResponse => {
    const success = !error;
    const fallbackMessage = success
        ? `Step ${step} completed successfully.`
        : `Step ${step} failed: ${getErrorMessage(error)}`;

    return {step, success, message: message ?? fallbackMessage};
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
        try {
            this.context.project = await this.databaseService.createProject({
                userId: this.context.userId,
                title: this.context.title,
                description: this.context.description,
            });
            return handleResponse(StepName.CREATE_PROJECT);
        } catch (error) {
            return handleResponse(StepName.CREATE_PROJECT, {error});
        }
    }

    async getConfigTemplate(): Promise<ProjectBuilderResponse> {
        try {
            const smartSearch = new SmartTemplateSearch({candidateLimit: 10});
            const atlasSearch = new AtlasTemplateSearch({minScore: 1.5, indexName: 'configTemplate_text', limit: 1});
            const svc = new SearchService({atlas: atlasSearch, ai: smartSearch});
            const searchResult: TemplateSearchResult = await svc.searchConfigTemplates({
                title: this.context.title,
                description: this.context.description,
            });

            if (searchResult.error) {
                return handleResponse(StepName.GET_CONFIG_TEMPLATE, {message: JSON.stringify(searchResult.error)});
            }

            if (searchResult.hits.length < 1) {
                return handleResponse(StepName.GET_CONFIG_TEMPLATE, {message: 'No suitable config template found.'});
            }

            const template = await databaseService.getConfigTemplateById(searchResult.hits[0].templateId);

            if (!template) {
                return handleResponse(StepName.GET_CONFIG_TEMPLATE, {message: 'Config template not found.'});
            }

            this.context.configTemplate = template;
            return handleResponse(StepName.GET_CONFIG_TEMPLATE);


        } catch (error) {
            return handleResponse(StepName.GET_CONFIG_TEMPLATE, {message: JSON.stringify(error)});
        }
    }

    async cleanup(){
        if(this.context.project)
        await this.databaseService.deleteProject(this.context.project.id);
    }

    // Final result of builder execution
    build() {
        return {};
    }
}

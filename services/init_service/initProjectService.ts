import {ProjectBuilder} from './projectBuilder';
import {ProjectBuilderResponse, StepNameType} from "@/services/init_service/projectInitTypes";

// Service orchestrating project initialization using ProjectBuilder.

export class InitProjectService {
    private builder: ProjectBuilder | undefined;
    private step: StepNameType | undefined;

    async handleClose(): Promise<void> {
        if (this.builder) {
            await this.builder.cleanup();
        }
    }

    // Runs minimal initialization flow
    async initProject(userId: string, title: string, description: string, callback: (response: ProjectBuilderResponse) => void): Promise<void> {
        // Set basic info about the project
        this.builder = new ProjectBuilder({userId, title, description});
        // Proceed with Step 1. Create Project
        const createProjectStepResponse = await this.builder.createProject();
        this.step = createProjectStepResponse.step;
        // Invoke callback with the step result response
        callback(createProjectStepResponse);
        // End process if step failed
        if (!createProjectStepResponse.success) {
            await this.builder.cleanup()
            return;
        }
        // Step 2. Get Config Template
        const getConfigTemplateStepResponse = await this.builder.getConfigTemplate();
        // Update current step
        this.step = getConfigTemplateStepResponse.step;
        // Invoke callback with the step result response
        callback(getConfigTemplateStepResponse);
        // End process if step failed
        if (!getConfigTemplateStepResponse.success) {
            await this.builder.cleanup()
            return;
        }

        // return builder.build();
    }
}

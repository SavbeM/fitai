import { ProjectBuilder } from './projectBuilder';
import {ProjectBuilderResponse, StepNameType} from "@/services/init_service/projectInitTypes";

// Service orchestrating project initialization using ProjectBuilder.

export class InitProjectService {
    private builder: ProjectBuilder | undefined;
    private step: StepNameType | undefined;

    // Runs minimal initialization flow
    async initProject(userId: string, title: string, description: string, callback: (response: ProjectBuilderResponse) => void): Promise<void> {
        // Set basic info about the project
        this.builder = new ProjectBuilder({ userId, title, description });
        // Proceed with Step 1. Create Project
        const projectStepResponse =  await this.builder.createProject();
        this.step = projectStepResponse.step;
        // Invoke callback with the step result response
        callback(projectStepResponse);


        // return builder.build();
    }
}

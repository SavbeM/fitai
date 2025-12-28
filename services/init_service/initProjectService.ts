import { ProjectBuilder } from './projectBuilder';
import {ProjectBuilderResponse} from "@/services/init_service/projectInitTypes";

// Service orchestrating project initialization using ProjectBuilder.

export class InitProjectService {
    // Runs minimal initialization flow
    async initProject(userId: string, title: string, description: string, callback: (response: ProjectBuilderResponse) => void): Promise<void> {
        const builder = new ProjectBuilder({ userId, title, description });
        const projectStepResponse =  await builder.createProject();
        callback(projectStepResponse);
        // return builder.build();
    }
}

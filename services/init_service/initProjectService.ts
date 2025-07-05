import { ProjectBuilder } from './projectBuilder';
import { ProjectBuildResult } from './projectInitTypes';

// Service orchestrating project initialization using ProjectBuilder.
export class InitProjectService {
    // Runs minimal initialization flow
    async initProject(userId: string, title: string, description: string, templateId: string, biometrics: Record<string, number | string>): Promise<ProjectBuildResult> {
        const builder = new ProjectBuilder(userId, title, description);
        await builder.createProject();
        await builder.useTemplate(templateId); // TODO: AI based selection
        await builder.generatePlanConfig(); // TODO: AI based generation
        await builder.createProfile(biometrics);
        await builder.createWorkoutPlan();
        return builder.build();
    }
}

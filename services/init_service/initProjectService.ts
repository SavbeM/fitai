import { ProjectBuilder } from './projectBuilder';
import { ProjectBuildResult } from './projectInitTypes';

// Service orchestrating project initialization using ProjectBuilder.
// TODO: Rethink activity generation, there is no activity generation step now. Also createWorkoutPlan rely on activities.
export class InitProjectService {
    // Runs minimal initialization flow
    async initProject(userId: string, title: string, description: string): Promise<ProjectBuildResult> {
        const builder = new ProjectBuilder(userId, title, description);
        await builder.createProject();
        await builder.useTemplate(); // TODO: AI based selection
        await builder.generatePlanConfig(); // TODO: AI based generation
        // TODO: gather biometrics from user input
        const  biometrics: Record<string, number | string> = { age: 30, weight: 70, height: 175 };
        await builder.createProfile(biometrics);
        await builder.createWorkoutPlan();
        return builder.build();
    }
}

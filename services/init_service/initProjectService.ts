import { databaseService } from "@/services/database_service/databaseService";
import { ProjectBuilder } from "./projectBuilder";
import { InitResult } from "./projectInitTypes";

/**
 * InitProjectService orchestrates project creation using data from ProjectBuilder.
 * AI related logic is left as placeholders for future implementation.
 */
export class InitProjectService {
    constructor(private db = databaseService) {}

    /**
     * Execute initialization sequence: create project, profile and initial plan.
     */
    async initialize(builder: ProjectBuilder): Promise<InitResult> {
        const data = builder.build();

        // 1. basic project entry
        const project = await this.db.createProject(
            data.userId,
            data.title,
            data.description
        );

        // 2. create user profile if biometrics provided
        let profile;
        if (data.biometrics) {
            // target biometrics generation via AI is not defined yet
            profile = await this.db.createProfile(project.id, data.biometrics, {});
        }

        // 3. select template and generate plan config via AI (not implemented)
        if (!data.template) {
            await this.selectTemplate();
        }
        await this.generateWorkoutPlan();

        return { projectId: project.id, profileId: profile?.id };
    }

    /**
     * Placeholder: choose suitable ConfigTemplate using AI module.
     */
    private async selectTemplate(): Promise<void> {
        // TODO: integrate AI selection logic
        return Promise.resolve();
    }

    /**
     * Placeholder: generate WorkoutPlanConfig and execute ConfigExecutor.
     */
    private async generateWorkoutPlan(): Promise<void> {
        // TODO: call AI module and ConfigExecutor
        return Promise.resolve();
    }
}

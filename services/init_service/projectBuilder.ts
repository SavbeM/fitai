import { databaseService } from '@/services/database_service/databaseService';
import { ProjectBuildContext, ProjectBuildResult } from './projectInitTypes';

// Builder responsible for creating a project with profile and workout plan.
// Some methods rely on future AI or executor modules and are mocked for now.
export class ProjectBuilder {
    private context: ProjectBuildContext;

    constructor(userId: string, title: string, description: string) {
        this.context = { userId, title, description };
    }

    // Creates a new project in the database
    async createProject(): Promise<this> {
        this.context.project = await databaseService.createProject(
            this.context.userId,
            this.context.title,
            this.context.description
        );
        return this;
    }

    // Loads template by id. In the future can be replaced with AI based selection
    async useTemplate(templateId: string): Promise<this> {
        this.context.template = await databaseService.getConfigTemplateById(templateId);
        return this;
    }

    // Generates minimal WorkoutPlanConfig using AI. Mock implementation for now
    async generatePlanConfig(): Promise<this> {
        // TODO: integrate AI module to fill config based on template and inputs
        this.context.planConfig = {
            id: 'mock-config',
            templateId: this.context.template?.id || '',
            projectId: this.context.project?.id || '',
            biometrics: {},
            goals: [],
            activities: [],
            adaptationRules: {},
            createdAt: new Date().toISOString(),
            meta: {},
        };
        return this;
    }

    // Creates user profile in the database based on biometrics provided
    async createProfile(biometrics: Record<string, number | string>): Promise<this> {
        if (!this.context.project) throw new Error('Project must be created before profile');
        this.context.profile = await databaseService.createProfile(
            this.context.project.id,
            biometrics,
            {}
        );
        return this;
    }

    // Generates workout plan from config via ConfigExecutor (mocked)
    async createWorkoutPlan(): Promise<this> {
        if (!this.context.project || !this.context.template || !this.context.planConfig) {
            throw new Error('Missing data for workout plan creation');
        }
        // TODO: plug ConfigExecutor here
        this.context.workoutPlan = await databaseService.createWorkoutPlan(
            this.context.project.id,
            this.context.template.id,
            this.context.planConfig.id
        );
        return this;
    }

    // Final result of builder execution
    build(): ProjectBuildResult {
        return {
            project: this.context.project,
            profile: this.context.profile,
            template: this.context.template,
            planConfig: this.context.planConfig,
            workoutPlan: this.context.workoutPlan,
        };
    }
}

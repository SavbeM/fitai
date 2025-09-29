import { databaseService } from '@/services/database_service/databaseService';
import { ProjectBuildContext, ProjectBuildResult } from './projectInitTypes';
import { Activity, WorkoutPlan } from "@/services/database_service/databaseServiceTypes";

    /** Builder responsible for creating a project with profile and workout plan.
    Some methods rely on future AI or executor modules and are mocked for now. **/
export class ProjectBuilder {
    private context: ProjectBuildContext;

    constructor(userId: string, title: string, description: string) {
        this.context = { userId, title, description };
    }

    /** Creates a new project in the database **/
    async createProject(): Promise<this> {
        this.context.project = await databaseService.createProject(
            this.context.userId,
            this.context.title,
            this.context.description
        );
        return this;
    }

    // AI based selection of configuration template by ID.
    async useTemplate(): Promise<this> {
        if (!this.context.project) throw new Error('Project must be created before selecting template');
        // TODO: AI module selects matching ConfigTemplate based on user input.
        // For now, we mock the template selection
        // TODO: debug why template is undefined
        // this.context.template = await databaseService.getConfigTemplateById('688e1ea30f24749cbc08bee6');
        this.context.template = this.context.template = {
            id: "688e1ea30f24749cbc08bee6",
            templateName: "Weight Loss Basic",
            description: "Basic configuration for users aiming to reduce body fat and improve metabolic health.",
            goalTypes: ["weight_loss", "fat_reduction"],
            requiredBiometrics: ["weight", "body_fat_percentage", "age", "height"],
            activityGuidelines: {
                minActivities: 3,
                maxActivities: 6,
                allowedTypes: ["Numeric", "Boolean"],
                activityFields: [
                    { name: "activityName", type: "string", required: true },
                    { name: "durationMinutes", type: "number", required: true },
                    { name: "intensity", type: "enum", required: false, enum: ["low", "medium", "high"] },
                    { name: "isOutdoor", type: "boolean", required: false }
                ],
                constraints: {
                    durationMinutes: { min: 15, max: 90 }
                },
                mustInclude: ["Walking", "Calisthenics"],
                frequencyPattern: "each activity at least twice per week"
            },
            adaptationRules: {
                onSkip: "reduceTargetBy5%",
                onComplete: "increaseTargetBy3%"
            },
            aiPromptTemplate: "Create a training plan for a {age}-year-old user aiming for {goalTypes}, including {minActivities} to {maxActivities} activities per week.",
            meta: {
                author: "AI Fitness Generator v1.0",
                version: "1.2.3"
            }
        };
        return this
    }
    // Generates minimal WorkoutPlanConfig using AI. Mock implementation for now
    async generatePlanConfig(): Promise<this> {
        if (!this.context.project) throw new Error('Project must be created before plan config');
        if (!this.context.template) throw new Error('Template must be selected before plan config');
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

    // Creates user profile with required biometrics in the database based on biometrics provided
    async createProfile(biometrics: Record<string, number | string>): Promise<this> {
        if (!this.context.project) throw new Error('Project must be created before profile');
        this.context.profile = await databaseService.createProfile(
            this.context.project.id,
            biometrics,
            {}
        );
        return this;
    }
    // TODO: This trash, rewrite it all
    // Generates workout plan from config via ConfigExecutor (mocked)
    async createWorkoutPlan(): Promise<this> {
        if (!this.context.project || !this.context.template || !this.context.planConfig) {
            throw new Error('Missing data for workout plan creation');
        }
        // TODO: plug ConfigExecutor here
        try {
            const plan: Omit<WorkoutPlan, 'project' | 'activities'> = await databaseService.createWorkoutPlan(
                this.context.project.id,
                this.context.template.id,
                this.context.planConfig.id
            );
             const activities: Activity = await databaseService.createActivity(plan.id, {date: new Date(), title: 'Run', description: 'run 10 km', type: "NUMERIC", targetMetric: 30, unit: 'minutes', order: 1});
             this.context.workoutPlan = {...plan,project: this.context.project, activities: [activities]}
        } catch (error) {
            console.error('Failed to create workout plan:', error);
            throw new Error('Workout plan creation failed');
        }

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

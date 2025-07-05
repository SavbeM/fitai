import { ActivityConfig, ConfigTemplate } from "@/services/database_service/databaseServiceTypes";
import { ProjectBuilderParams, ProjectBuildData } from "./projectInitTypes";

/**
 * ProjectBuilder aggregates all data required for project initialization.
 * It follows a simple builder pattern with chainable setters.
 */
export class ProjectBuilder {
    private data: ProjectBuildData;

    constructor(params: ProjectBuilderParams) {
        this.data = { ...params };
    }

    /**
     * Attach ConfigTemplate selected for this project.
     */
    setTemplate(template: ConfigTemplate): this {
        this.data.template = template;
        return this;
    }

    /**
     * Store user biometrics that will be used for profile creation.
     */
    setBiometrics(biometrics: Record<string, string | number>): this {
        this.data.biometrics = biometrics;
        return this;
    }

    /**
     * Optional fitness goal for the workout plan.
     */
    setGoal(goal: string): this {
        this.data.goal = goal;
        return this;
    }

    /**
     * Attach activity configs to be used during workout plan generation.
     */
    setActivities(activities: ActivityConfig[]): this {
        this.data.activities = activities;
        return this;
    }

    /**
     * Finalize builder and return collected data.
     */
    build(): ProjectBuildData {
        return this.data;
    }
}

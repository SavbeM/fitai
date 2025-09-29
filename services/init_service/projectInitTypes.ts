// Types used by project initialization workflow

import { Project, ConfigTemplate, WorkoutPlanConfig, Profile, WorkoutPlan } from '@/services/database_service/databaseServiceTypes';
import {  ConfigTemplate as DbConfigTemplate } from '@prisma/client';

// Context object passed around builder methods
export interface ProjectBuildContext {
    userId: string;
    title: string;
    description: string;
    project?: Project;
    template?: ConfigTemplate | DbConfigTemplate | null;
    planConfig?: WorkoutPlanConfig | null;
    profile?: Profile | null;
    workoutPlan?: WorkoutPlan | null;
}

// Result returned to callers after initialization
export interface ProjectBuildResult {
    project: Project | undefined;
    profile?: Profile | null;
    template?: ConfigTemplate | DbConfigTemplate | null;
    planConfig?: WorkoutPlanConfig | null;
    workoutPlan?: WorkoutPlan | null;
}

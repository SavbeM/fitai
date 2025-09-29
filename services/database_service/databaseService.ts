import { PrismaClient, Prisma } from '@prisma/client';

export const prisma = new PrismaClient();

/*
  databaseService: provides CRUD operations for all core entities.
  Cascade logic is handled manually in service code — Prisma with MongoDB does NOT support ON DELETE CASCADE at schema level.
*/

export const databaseService = {
    // ----- User -----
    // Create a new user
    createUser: (name: string, email: string) =>
        prisma.user.create({ data: { name, email } }),

    // Get user by ID with all related projects
    getUserById: (userId: string) =>
        prisma.user.findUnique({
            where: { id: userId },
            include: { projects: true },
        }),

    // Update user data (name and/or email)
    updateUser: (userId: string, data: Partial<{ name: string; email: string }>) =>
        prisma.user.update({
            where: { id: userId },
            data,
        }),

    // Delete user with cascade: removes all related projects and their entities
    deleteUser: async (userId: string) => {
        const projects = await prisma.project.findMany({ where: { userId } });
        for (const project of projects) {
            await databaseService.deleteProject(project.id);
        }
        await prisma.user.delete({ where: { id: userId } });
    },

    // ----- Project -----
    // Create new project for a user
    createProject: (userId: string, title: string, description: string) =>
        prisma.project.create({
            data: { userId, title, description },
        }),

    // Get project by ID, include profile and workout plan with activities
    getProjectById: (projectId: string) =>
        prisma.project.findUnique({
            where: { id: projectId },
            include: {
                profile: true,
                workoutPlan: { include: { activities: true } },
            },
        }),

    // Update project title or description
    updateProject: (projectId: string, data: Partial<{ title: string; description: string }>) =>
        prisma.project.update({
            where: { id: projectId },
            data,
        }),

    // Delete project with cascade: removes all related workout plans, activities, profile, configs
    deleteProject: async (projectId: string) => {
        const plans = await prisma.workoutPlan.findMany({ where: { projectId } });
        for (const plan of plans) {
            await databaseService.deleteWorkoutPlan(plan.id);
        }
        await prisma.profile.deleteMany({ where: { projectId } });
        await prisma.workoutPlanConfig.deleteMany({ where: { projectId } });
        await prisma.project.delete({ where: { id: projectId } });
    },

    // ----- Profile -----
    // Create user profile for a project
    createProfile: (projectId: string, biometrics: Prisma.InputJsonValue, targetBiometrics: Prisma.InputJsonValue) =>
        prisma.profile.create({
            data: { projectId, biometrics, targetBiometrics },
        }),

    // Get profile by project ID (1:1)
    getProfileByProjectId: (projectId: string) =>
        prisma.profile.findUnique({ where: { projectId } }),

    // Update profile biometrics
    updateProfile: (profileId: string, biometrics: Prisma.InputJsonValue) =>
        prisma.profile.update({
            where: { id: profileId },
            data: { biometrics },
        }),

    // ----- ConfigTemplate -----
    // Get config template by ID
    getConfigTemplateById: (templateId: string) =>
        prisma.configTemplate.findUnique({ where: { id: templateId } }),

    // Get all config templates
    getAllConfigTemplates: () =>
        prisma.configTemplate.findMany(),

    // ----- WorkoutPlanConfig -----
    // Create new WorkoutPlanConfig (used as input for plan generation)
    createWorkoutPlanConfig: (
        templateId: string,
        projectId: string,
        biometrics: Prisma.InputJsonValue,
        goals: string[],
        activities: Prisma.InputJsonValue,
        adaptationRules: Prisma.InputJsonValue,
        meta?: Prisma.InputJsonValue
    ) =>
        prisma.workoutPlanConfig.create({
            data: { templateId, projectId, biometrics, goals, activities, adaptationRules, meta },
        }),

    // Get all WorkoutPlanConfigs for a project
    getWorkoutPlanConfigsByProjectId: (projectId: string) =>
        prisma.workoutPlanConfig.findMany({ where: { projectId } }),

    // ----- WorkoutPlan -----
    // Create WorkoutPlan (bind to config/template/project)
    createWorkoutPlan: (
        projectId: string,
        configTemplateId: string,
        generatedFromConfig: string,
    ) =>
        prisma.workoutPlan.create({
            data: { projectId, configTemplateId, generatedFromConfig },
        }),

    // Get all workout plans for a project (with activities)
    getWorkoutPlansByProjectId: (projectId: string) =>
        prisma.workoutPlan.findMany({
            where: { projectId },
            include: { activities: true },
        }),

    // Delete workout plan with all related activities
    deleteWorkoutPlan: async (workoutPlanId: string) => {
        await prisma.activity.deleteMany({ where: { workoutPlanId } });
        await prisma.workoutPlan.delete({ where: { id: workoutPlanId } });
    },

    // ----- Activity -----
    // Create new activity for workout plan
    createActivity: (
        workoutPlanId: string,
        data: Omit<Prisma.ActivityCreateInput, 'workoutPlan'>
    ) =>
        prisma.activity.create({
            data: { ...data, workoutPlanId },
        }),

    // Get all activities for a workout plan
    getActivitiesByWorkoutPlanId: (workoutPlanId: string) =>
        prisma.activity.findMany({ where: { workoutPlanId } }),

    // Update activity (for example: completedMetric, etc.)
    updateActivity: (activityId: string, data: Partial<Prisma.ActivityUpdateInput>) =>
        prisma.activity.update({ where: { id: activityId }, data }),

    // Delete activity
    deleteActivity: (activityId: string) =>
        prisma.activity.delete({ where: { id: activityId } }),
};

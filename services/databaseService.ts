import {PrismaClient, Prisma} from '@prisma/client';
import {CreateProjectArgs} from "@/types/databaseServiceTypes";


const prisma = new PrismaClient();

export const databaseService = {

    // --------------------------
    //           User
    // -----  ---------------------

    createUser: (name: string, email?: string) => {
        return prisma.user.create({
            data: {name, email},
        });
    },

    getUserById: (userId: string) => {
        return prisma.user.findUnique({
            where: {id: userId},
            include: {projects: true},
        });
    },

    updateUser: (userId: string, newName?: string) => {
        return prisma.user.update({
            where: {id: userId},
            data: {name: newName},
        });
    },

    deleteUser: (userId: string) => {
        return prisma.user.delete({
            where: {id: userId},
        });
    },

    // --------------------------
    //          Project
    // --------------------------

    createProject: async (args: CreateProjectArgs) => {
        const { userId, name, description, profile, tabs, goal } = args;

        return prisma.project.create({
            data: {
                userId,
                name,
                description,
                profile: {
                    create: {
                        age: profile.age,
                        weight: profile.weight,
                        height: profile.height,
                        activityLevel: profile.activityLevel,
                        otherStats: profile.otherData,
                    },
                },
                projectGoal: {
                    create: {
                        goalStats: goal.goalData,
                    },
                },
                tabs: {
                    create: tabs.map(tab => ({
                        title: tab.title,
                        type: tab.type,
                        algorithms: {
                            create: tab.algorithms.map(algorithm => ({
                                name: algorithm.name,
                                viewTemplate: algorithm.viewTemplate,
                                calculationAlgorithm: algorithm.calculationAlgorithm,
                            })),
                        },
                        workoutPlan: tab.workoutPlan
                            ? {
                                create: { ...tab.workoutPlan },
                            }
                            : undefined,

                        activities: {
                            create: tab.activities.map((activity) => ({
                                title: activity.title,
                                description: activity.description,
                                type: activity.type,
                                data: {
                                    create: {
                                        atomic: activity.data.atomic,
                                        numeric: activity.data.numeric,
                                        enum: activity.data.enum,
                                    },
                                },
                            })),
                        },
                    })),
                },
            },
            include: {
                profile: true,
                projectGoal: true,
                tabs: {
                    include: {
                        algorithms: true,
                        workoutPlan: true,
                        activities: true,
                    },
                },
            },
        });
    },


    // TODO: остальное хуево работает, надо доделать

    getProjectsByUserId: (userId: string) => {
        return prisma.project.findMany({
            where: {userId},
            include: {profile: true, tabs: true, algorithms: true, projectGoal: true},
        });
    },

    updateProject: (projectId: string, data: Prisma.ProjectUpdateInput) => {
        return prisma.project.update({
            where: {id: projectId},
            data,
        });
    },

    deleteProject: (projectId: string) => {
        return prisma.project.delete({
            where: {id: projectId},
        });
    },

    // --------------------------
    //          Profile
    // --------------------------
    createProfile: (projectId: string, age: number, weight: number, height: number, data: object) => {
        return prisma.profile.create({
            data: {projectId, age, weight, height, data},
        });
    },

    getProfileByProjectId: (projectId: string) => {
        return prisma.profile.findUnique({
            where: {projectId},
        });
    },

    updateProfile: (profileId: string, data: Prisma.ProfileUpdateInput) => {
        return prisma.profile.update({
            where: {id: profileId},
            data,
        });
    },

    deleteProfile: (profileId: string) => {
        return prisma.profile.delete({
            where: {id: profileId},
        });
    },

    // --------------------------
    //         GoalData
    // --------------------------
    createGoalData: (projectId: string, data: any) => {
        return prisma.goalData.create({
            data: {projectId, data},
        });
    },

    getGoalDataByProjectId: (projectId: string) => {
        return prisma.goalData.findUnique({
            where: {projectId},
        });
    },

    updateGoalData: (goalDataId: string, newData: any) => {
        return prisma.goalData.update({
            where: {id: goalDataId},
            data: {data: newData},
        });
    },

    // --------------------------
    //           Tab
    // --------------------------
    createTab: (projectId: string, title: string, type: string, data?: any) => {
        return prisma.tab.create({
            data: {projectId, title, type, data},
        });
    },

    getTabsByProjectId: (projectId: string) => {
        return prisma.tab.findMany({
            where: {projectId},
        });
    },

    updateTab: (tabId: string, data: any) => {
        return prisma.tab.update({
            where: {id: tabId},
            data: {data},
        });
    },

    deleteTab: (tabId: string) => {
        return prisma.tab.delete({
            where: {id: tabId},
        });
    },

    // --------------------------
    //        Algorithm
    // --------------------------
    createAlgorithm: (tabId: string, name: string, codeSnippet: string) => {
        return prisma.algorithm.create({
            data: {name, codeSnippet, tab: {connect: {id: tabId}}},
        });
    },

    getAlgorithmsByTabId: (tabId: string) => {
        return prisma.algorithm.findMany({
            where: {tabId},
        });
    },

    updateAlgorithm: (algorithmId: string, data: Prisma.AlgorithmUpdateInput) => {
        return prisma.algorithm.update({
            where: {id: algorithmId},
            data,
        });
    },

    deleteAlgorithm: (algorithmId: string) => {
        return prisma.algorithm.delete({
            where: {id: algorithmId},
        });
    },
};

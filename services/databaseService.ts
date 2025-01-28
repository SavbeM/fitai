import {PrismaClient, Prisma} from '@prisma/client';
import {CreateProjectInput} from "@/types/databaseServiceTypes";

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

    createProject: async (args: CreateProjectInput) => {
        const {userId, name, description, profile, tabs, goal} = args;

        return prisma.project.create({
            data: {
                userId,
                name,
                description,
                profile: {
                    create: {
                        biometrics: profile.biometrics,
                    },
                },
                projectGoal: {
                    create: {
                        goalStats: goal.goalStats,
                    },
                },
                tabs: {
                    create: tabs.map((tab) => ({
                        title: tab.title,
                        type: tab.type,
                        algorithms: {
                            create: tab.algorithms.map((algorithm) => ({
                                viewTemplate: algorithm.viewTemplate,
                                calculationAlgorithm: algorithm.calculationAlgorithm,
                                viewAlgorithm: algorithm.viewAlgorithm,
                            })),
                        },
                        workoutPlan: tab.workoutPlan
                            ? {
                                create: {
                                    calendar: {
                                        create: {
                                            activities: {
                                                create: tab.workoutPlan.calendar.map((activity) => ({
                                                    title: activity.title,
                                                    description: activity.description,
                                                    type: activity.type,
                                                    data: {
                                                        ...activity.data, // Преобразование данных в JSON
                                                    } as Prisma.InputJsonValue,
                                                    date: activity.date ? activity.date : new Date(),
                                                })),
                                            },
                                        },
                                    },
                                },
                            }
                            : undefined,
                    })),
                },
            },
            include: {
                profile: true,
                projectGoal: true,
                tabs: {
                    include: {
                        algorithms: true,
                        workoutPlan: {
                            include: {
                                calendar: {
                                    include: {
                                        activities: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    },


};



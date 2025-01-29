import {PrismaClient, Prisma} from '@prisma/client';
import {CreateProjectInput, TabInput} from "@/types/databaseServiceTypes";

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

                    goal: {
                        create: {goalStats: goal.goalStats},
                    },

                    profile: {
                        create: {biometrics: profile.biometrics},
                    },

                    tabs: {
                        create: tabs.map(tab => ({
                            title: tab.title,
                            type: tab.type,
                            algorithms: {
                                create: tab.algorithms.map(algorithm => ({
                                    viewTemplate: algorithm.viewTemplate,
                                    calculationAlgorithm: algorithm.calculationAlgorithm,
                                    viewData: algorithm.viewData,
                                })),
                            },

                            workoutPlan: tab.workoutPlan
                                ? {
                                    create: {
                                        activities: {
                                            create: tab.workoutPlan.activities.map(activity => ({
                                                date: activity.date || new Date(),
                                                title: activity.title,
                                                description: activity.description,
                                                type: activity.type,
                                                data: activity.data as Prisma.InputJsonValue,
                                            })),
                                        },
                                    },
                                }
                                : undefined,
                        })),
                    },
                },

                include: {
                    goal: true,
                    profile: true,
                    tabs: {
                        include: {
                            algorithms: true,
                            workoutPlan: {
                                include: {
                                    activities: true,
                                },
                            },
                        },
                    },
                },
            });
        },

        getProjectById: (projectId: string) => {
            return prisma.project.findUnique({
                where: {id: projectId},
                include: {
                    profile: true,
                    goal: true,
                    tabs: {
                        include: {
                            algorithms: true,
                            workoutPlan: {
                                include: {
                                    activities: true,
                                },
                            },
                        },
                    },
                },
            });
        },

        deleteProject: async (projectId: string) => {
            // Delete all activities
            await prisma.activity.deleteMany({
                where: {
                    workoutPlan: {
                        tab: {
                            projectId: projectId,
                        },
                    },
                },
            });

            // Delete all workout plans
            await prisma.workoutPlan.deleteMany({
                where: {
                    tab: {
                        projectId: projectId,
                    },
                },
            });

            // Delete all algorithms
            await prisma.algorithm.deleteMany({
                where: {
                    tab: {
                        projectId: projectId,
                    },
                },
            });

            // Delete all tabs
            await prisma.tab.deleteMany({
                where: {
                    projectId: projectId,
                },
            });

            // Delete the goal
            await prisma.goal.deleteMany({
                where: {
                    projectId: projectId,
                },
            });

            // Delete the profile
            await prisma.profile.deleteMany({
                where: {
                    projectId: projectId,
                },
            });

            // Finally, delete the project
            await prisma.project.delete({
                where: {
                    id: projectId,
                },
            });
        },

        // --------------------------//
        //           Profile         //
        // --------------------------//

        getProfileById:
            (profileId: string) => {
                return prisma.profile.findUnique({
                    where: {id: profileId},
                });
            },

        getProfileByProjectId:
            (projectId: string) => {
                return prisma.profile.findFirst({
                    where: {projectId},
                });
            },

        updateProfile:
            (profileId: string, biometrics: Prisma.InputJsonValue) => {
                return prisma.profile.update({
                    where: {id: profileId},
                    data: {biometrics},
                });
            },

        // --------------------------//
        //          Goal            //
        // --------------------------//

        getGoalById:
            (goalId: string) => {
                return prisma.goal.findUnique({
                    where: {id: goalId},
                });
            },

        getGoalByProjectId:
            (projectId: string) => {
                return prisma.goal.findFirst({
                    where: {projectId},
                });
            },

        updateGoal:
            (goalId: string, goalStats: Prisma.InputJsonValue) => {
                return prisma.goal.update({
                    where: {id: goalId},
                    data: {goalStats},
                });
            },

        // --------------------------//
        //          Tab             //
        // --------------------------//

        getTabById:
            (tabId: string) => {
                return prisma.tab.findUnique({
                    where: {id: tabId},
                });
            },

        getTabsByProjectId:
            (projectId: string) => {
                return prisma.tab.findMany({
                    where: {projectId},
                });
            },

        updateTabTitle:
            (tabId: string, title: string) => {
                return prisma.tab.update({
                    where: {id: tabId},
                    data: {title},
                });
            },

        deleteTab:
            async (tabId: string) => {
                await prisma.tab.delete({
                    where: {id: tabId},
                    include: {
                        algorithms: true,
                        workoutPlan: {
                            include: {
                                activities: true,
                            },
                        },
                    },
                });
            },

        addTab:
            async (projectId: string, args: TabInput) => {
                return prisma.tab.create({
                    data: {
                        projectId: projectId,
                        title: args.title,
                        type: args.type,
                        algorithms: {
                            create: args.algorithms.map((algorithm) => ({
                                viewTemplate: algorithm.viewTemplate,
                                calculationAlgorithm: algorithm.calculationAlgorithm,
                                viewData: algorithm.viewData,
                            })),
                        },
                        workoutPlan: args.workoutPlan
                            ? {
                                create: {
                                    activities: {
                                        create: args.workoutPlan.activities.map((activity) => ({
                                            title: activity.title,
                                            description: activity.description,
                                            type: activity.type,
                                            data: {
                                                ...activity.data,
                                            } as Prisma.InputJsonValue,
                                            date: activity.date ? activity.date : new Date(),
                                        })),
                                    },
                                },
                            }
                            : undefined,
                    },
                    include: {
                        algorithms: true,
                        workoutPlan: {
                            include: {
                                activities: true,
                            },
                        },
                    },
                });
            },

        // --------------------------//
        //          Algorithm       //
        // --------------------------//

        getAlgorithmById:
            (algorithmId: string) => {
                return prisma.algorithm.findUnique({
                    where: {id: algorithmId},
                });
            },

        getAlgorithmsByTabId:
            (tabId: string) => {
                return prisma.algorithm.findMany({
                    where: {tabId},
                });
            },

        deleteAlgorithm:
            (algorithmId: string) => {
                return prisma.algorithm.delete({
                    where: {id: algorithmId},
                });
            }
    }
;

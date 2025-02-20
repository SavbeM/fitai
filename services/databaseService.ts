import {PrismaClient, Prisma} from '@prisma/client';
import {AlgorithmInput, CreateProjectInput, TabInput} from "@/services/databaseServiceTypes";

export const prisma = new PrismaClient();

export const databaseService = {
    // ------------- User ---------------
    createUser: (name: string, email: string) => {
        try {
            return prisma.user.create({
                data: {name, email},
            });
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    },

    getUserById: (userId: string) => {
        try {
            return prisma.user.findUnique({
                where: {id: userId},
                include: {projects: true},
            });
        } catch (error) {
            console.error("Error getting user by ID:", error);
            throw error;
        }
    },

    updateUser: (userId: string, newName?: string) => {
        try {
            return prisma.user.update({
                where: {id: userId},
                data: {name: newName},
            });
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    },

    deleteUser: (userId: string) => {
        try {
            return prisma.user.delete({
                where: {id: userId},
            });
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    },

    // ------------- Project ---------------
    createProject: async (args: CreateProjectInput) => {
        const {userId, name, description, profile, tabs, goal} = args;
        try {
            return prisma.project.create({
                data: {
                    userId,
                    name,
                    description,
                    goal: {create: {goalStats: goal.goalStats}},
                    profile: {create: {biometrics: profile.biometrics}},
                    tabs: {
                        create: tabs.map(tab => ({
                            title: tab.title,
                            type: tab.type,
                            workoutPlan: tab.workoutPlan
                                ? {
                                    create: {
                                        viewTemplate: tab.workoutPlan.viewTemplate,
                                        activities: {
                                            create: tab.workoutPlan.activities.map(activity => ({
                                                date: activity.date ? new Date(activity.date) : new Date(),
                                                title: activity.title,
                                                description: activity.description,
                                                type: activity.type,
                                                data: activity.data as Prisma.InputJsonValue,
                                            })),
                                        },
                                        algorithm: tab.workoutPlan.algorithm
                                            ? {create: tab.workoutPlan.algorithm}
                                            : undefined,
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
                            workoutPlan: {include: {activities: true, algorithm: true}},
                        },
                    },
                },
            });
        } catch (error) {
            console.error("Error creating project:", error);
            throw error;
        }
    },

    getProjectById: (projectId: string) => {
        try {
            return prisma.project.findUnique({
                where: {id: projectId},
                include: {
                    profile: true,
                    goal: true,
                    tabs: {
                        include: {
                            workoutPlan: {include: {activities: true, algorithm: true}},
                        },
                    },
                },
            });
        } catch (error) {
            console.error("Error getting project by ID:", error);
            throw error;
        }
    },

    updateProject: async (projectId: string, name?: string, description?: string) => {
        try {
            return prisma.project.update({
                where: {id: projectId},
                data: {name, description},
            });
        } catch (error) {
            console.error("Error updating project by ID:", error);
            throw error;
        }
    },

    deleteProject: async (projectId: string) => {
        try {
            await prisma.$transaction([
                prisma.activity.deleteMany({
                    where: {workoutPlan: {tab: {projectId: projectId}}},
                }),
                prisma.algorithm.deleteMany({
                    where: {workoutPlan: {tab: {projectId: projectId}}},
                }),
                prisma.workoutPlan.deleteMany({
                    where: {tab: {projectId: projectId}},
                }),
                prisma.tab.deleteMany({
                    where: {projectId: projectId},
                }),
                prisma.goal.deleteMany({
                    where: {projectId: projectId},
                }),
                prisma.profile.deleteMany({
                    where: {projectId: projectId},
                }),
                prisma.project.delete({
                    where: {id: projectId},
                }),
            ]);
        } catch (error) {
            console.error("Error deleting project:", error);
            throw error;
        }
    },

    // ----------- Profile ------------
    getProfileById: (profileId: string) => {
        try {
            return prisma.profile.findUnique({where: {id: profileId}});
        } catch (error) {
            console.error("Error getting profile by ID:", error);
            throw error;
        }
    },

    getProfileByProjectId: (projectId: string) => {
        try {
            return prisma.profile.findFirst({where: {projectId}});
        } catch (error) {
            console.error("Error getting profile by project ID:", error);
            throw error;
        }
    },

    updateProfile: (profileId: string, biometrics: Prisma.InputJsonValue) => {
        try {
            return prisma.profile.update({
                where: {id: profileId},
                data: {biometrics},
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    },

    // ----------- Goal ------------

    getGoalById: (goalId: string) => {
        try {
            return prisma.goal.findUnique({where: {id: goalId}});
        } catch (error) {
            console.error("Error getting goal by ID:", error);
            throw error;
        }
    },

    getGoalByProjectId: (projectId: string) => {
        try {
            return prisma.goal.findFirst({where: {projectId}});
        } catch (error) {
            console.error("Error getting goal by project ID:", error);
            throw error;
        }
    },

    updateGoal: (goalId: string, goalStats: Prisma.InputJsonValue) => {
        try {
            return prisma.goal.update({
                where: {id: goalId},
                data: {goalStats},
            });
        } catch (error) {
            console.error("Error updating goal:", error);
            throw error;
        }
    },

    // ----------- Tab ------------
    getTabById: (tabId: string) => {
        try {
            return prisma.tab.findUnique({where: {id: tabId}});
        } catch (error) {
            console.error("Error getting tab by ID:", error);
            throw error;
        }
    },

    getTabsByProjectId: (projectId: string) => {
        try {
            return prisma.tab.findMany({where: {projectId}});
        } catch (error) {
            console.error("Error getting tabs by project ID:", error);
            throw error;
        }
    },

    updateTabTitle: (tabId: string, title: string) => {
        try {
            return prisma.tab.update({
                where: {id: tabId},
                data: {title},
            });
        } catch (error) {
            console.error("Error updating tab title:", error);
            throw error;
        }
    },

    deleteTab: async (tabId: string) => {
        try {
            await prisma.$transaction([
                prisma.algorithm.deleteMany({where: {workoutPlan: {tabId}}}),
                prisma.activity.deleteMany({where: {workoutPlan: {tabId}}}),
                prisma.workoutPlan.deleteMany({where: {tabId}}),
                prisma.tab.delete({where: {id: tabId}}),
            ]);
        } catch (error) {
            console.error("Error deleting tab:", error);
            throw error;
        }
    },

    addTab: async (projectId: string, args: TabInput) => {
        try {
            return prisma.tab.create({
                data: {
                    projectId,
                    title: args.title,
                    type: args.type,
                    workoutPlan: args.workoutPlan
                        ? {
                            create: {
                                activities: {
                                    create: args.workoutPlan.activities.map((activity) => ({
                                        title: activity.title,
                                        description: activity.description,
                                        type: activity.type,
                                        data: activity.data as Prisma.InputJsonValue,
                                        date: activity.date ? activity.date : new Date(),
                                    })),
                                },
                                viewTemplate: args.workoutPlan.viewTemplate,
                            },
                        }
                        : undefined,
                },
                include: {
                    workoutPlan: {include: {activities: true, algorithm: true}},
                },
            });
        } catch (error) {
            console.error("Error adding tab:", error);
            throw error;
        }
    },

    // ----------- Algorithm ------------

    getAlgorithmByWorkoutPlanId: async (workoutPlanId: string) => {
        try {
            return prisma.algorithm.findFirst({where: {workoutPlanId}});
        } catch (error) {
            console.error("Error getting algorithm by workout plan ID:", error);
            throw error;
        }
    },

    getAlgorithmById: (algorithmId: string) => {
        try {
            return prisma.algorithm.findUnique({where: {id: algorithmId}});
        } catch (error) {
            console.error("Error getting algorithm by ID:", error);
            throw error;
        }
    },

    updateAlgorithm: (algorithmId: string, algorithmInput: AlgorithmInput) => {
        try {
            return prisma.algorithm.update({
                where: {id: algorithmId},
                data: {...algorithmInput},
            });
        } catch (error) {
            console.error("Error updating algorithm:", error);
            throw error;
        }
    },

    deleteAlgorithm: (algorithmId: string) => {
        try {
            return prisma.algorithm.delete({where: {id: algorithmId}});
        } catch (error) {
            console.error("Error deleting algorithm:", error);
            throw error;
        }
    },

    // ----------- Activity ------------
    getActivityById: (activityId: string) => {
        try {
            return prisma.activity.findUnique({where: {id: activityId}});
        } catch (error) {
            console.error("Error getting activity by ID:", error);
            throw error;
        }
    },

    getActivitiesByWorkoutPlanId: (workoutPlanId: string) => {
        try {
            return prisma.activity.findMany({where: {workoutPlanId}});
        } catch (error) {
            console.error("Error getting activities by workout plan ID:", error);
            throw error;
        }
    },

    addActivity: async (workoutPlanId: string, activityData: Omit<Prisma.ActivityCreateInput, "workoutPlan">) => {
        try {
            return prisma.activity.create({
                data: {
                    ...activityData,
                    workoutPlanId,
                },
            });
        } catch (error) {
            console.error("Error adding activity:", error);
            throw error;
        }
    },

    deleteActivity: (activityId: string) => {
        try {
            return prisma.activity.delete({where: {id: activityId}});
        } catch (error) {
            console.error("Error deleting activity:", error);
            throw error;
        }
    },

    // ----------- Workout Plan ------------
    getWorkoutPlanById: (workoutPlanId: string) => {
        try {
            return prisma.workoutPlan.findUnique({where: {id: workoutPlanId}});
        } catch (error) {
            console.error("Error getting workout plan by ID:", error);
            throw error;
        }
    },

    getWorkoutPlanByTabId: (tabId: string) => {
        try {
            return prisma.workoutPlan.findFirst({where: {tabId}});
        } catch (error) {
            console.error("Error getting workout plan by tab ID:", error);
            throw error;
        }
    },


    deleteWorkoutPlan: async (workoutPlanId: string) => {
        try {
            await prisma.$transaction([
                prisma.activity.deleteMany({where: {workoutPlanId}}),
                prisma.algorithm.deleteMany({where: {workoutPlanId}}),
                prisma.workoutPlan.delete({where: {id: workoutPlanId}}),
            ])
        } catch (error) {
            console.error("Error deleting workout plan:", error);
            throw error;
        }
    },
};

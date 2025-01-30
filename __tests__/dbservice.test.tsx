import {ObjectId} from 'bson';
import {PrismaClient} from '@prisma/client';

import {databaseService} from '@/services/databaseService';
import {CreateProjectInput} from "@/types/databaseServiceTypes";

const prisma = new PrismaClient();

describe('databaseService', () => {
    describe('User methods', () => {
        let createdUserId: string;

        afterAll(async () => {
            if (createdUserId) {
                await prisma.user.delete({where: {id: createdUserId}});
            }
        });

        it('should create a user and store it in the database', async () => {
            const name = 'Test User';
            const email = 'testuser@example.com';

            const user = await databaseService.createUser(name, email);

            expect(user).toHaveProperty('id');
            expect(user.name).toBe(name);
            expect(user.email).toBe(email);

            createdUserId = user.id;

            const userInDb = await prisma.user.findUnique({
                where: {id: user.id},
            });

            expect(userInDb).not.toBeNull();
            expect(userInDb?.name).toBe(name);
            expect(userInDb?.email).toBe(email);
        });

        it('should retrieve a user by ID', async () => {
            const user = await databaseService.getUserById(createdUserId);

            expect(user).not.toBeNull();
            expect(user?.id).toBe(createdUserId);
            expect(user?.name).toBe('Test User');
        });

        it('should update a user name', async () => {
            const newName = 'Updated User';
            const updatedUser = await databaseService.updateUser(createdUserId, newName);

            expect(updatedUser).not.toBeNull();
            expect(updatedUser.name).toBe(newName);

            const userInDb = await prisma.user.findUnique({
                where: {id: createdUserId},
            });

            expect(userInDb?.name).toBe(newName);
        });

        it('should delete a user', async () => {
            await databaseService.deleteUser(createdUserId);

            const userInDb = await prisma.user.findUnique({
                where: {id: createdUserId},
            });

            expect(userInDb).toBeNull();
            createdUserId = '';
        });
    });


    describe('Project methods', () => {
        let projectId: string;
        let profileId: string;
        let tabIds: string[] = [];

        afterAll(async () => {
            if (projectId) {
                await prisma.$transaction([
                    prisma.algorithm.deleteMany({
                        where: {tabId: {in: tabIds}},
                    }),
                    prisma.tab.deleteMany({
                        where: {projectId},
                    }),
                    prisma.profile.deleteMany({
                        where: {projectId},
                    }),
                    prisma.goal.deleteMany({
                        where: {projectId},
                    }),
                    prisma.project.delete({
                        where: {id: projectId},
                    }),
                ]);
            }
        });


        it('should create a project and store it in the database', async () => {
            const args: CreateProjectInput = {
                userId: new ObjectId().toString(),
                name: 'Test Project',
                description: 'This is a test project',
                profile: {
                    biometrics: {height: 180, weight: 75, age: 25},
                },
                tabs: [
                    {
                        title: 'Workout Tab',
                        type: 'WORKOUT',
                        algorithms: [
                            {
                                viewTemplate: 'TODO',
                                calculationAlgorithm: 'calcAlgo1',
                                viewData: {input: 'data1', title: 'title1'},
                            },
                        ],
                        workoutPlan: {
                            activities: [
                                {
                                    title: 'Activity 1',
                                    description: 'Description 1',
                                    type: 'ATOMIC',
                                    data: {atomic: true},
                                    date: new Date(),
                                },
                                {
                                    title: 'Activity 2',
                                    description: 'Description 2',
                                    type: 'NUMERIC',
                                    data: {numeric: 100},
                                    date: new Date(),
                                },
                            ],
                        },
                    },
                ],
                goal: {
                    goalStats: {targetWeight: 70, targetBMI: 22},
                },
            };

            const project = await databaseService.createProject(args);
            projectId = project.id;
            tabIds = project.tabs.map(t => t.id);
            expect(project).toMatchObject({
                name: args.name,
                description: args.description,
                userId: args.userId,
            });

            // Проверка связи с Goal
            expect(project.goal).toBeDefined();
            expect(project.goal?.goalStats).toEqual(args.goal.goalStats);
            expect(project.goal?.projectId).toBe(project.id);

            // Проверка связи с Profile
            expect(project.profile).toBeDefined();
            expect(project.profile?.biometrics).toEqual(args.profile.biometrics);
            expect(project.profile?.projectId).toBe(project.id);
        });

        it('should get project by ID', async () => {
            const project = await databaseService.getProjectById(projectId);
            expect(project?.id).toBe(projectId);
        });

        it('should get profile by project ID', async () => {
            const profile = await databaseService.getProfileByProjectId(projectId);
            profileId = profile?.id ?? '';
            expect(profile?.projectId).toBe(projectId);
        });

        it('should get profile by ID', async () => {
            const profile = await databaseService.getProfileById(profileId);
            expect(profile?.id).toBe(profileId);
        });

        it('should update profile biometrics', async () => {
            const newBiometrics = {height: 185, weight: 80, age: 26};
            const updatedProfile = await databaseService.updateProfile(profileId, newBiometrics);
            expect(updatedProfile.biometrics).toEqual(newBiometrics);
        });


        it('should delete a project', async () => {
            const tempProject = await databaseService.createProject({
                userId: new ObjectId().toString(),
                name: 'Temp Project',
                description: 'Temporary project for deletion test',
                profile: {biometrics: {height: 180, weight: 75, age: 25}},
                tabs: [],
                goal: {goalStats: {targetWeight: 70, targetBMI: 22}},
            });

            await databaseService.deleteProject(tempProject.id);

            const checks = await prisma.$transaction([
                prisma.project.findUnique({ where: { id: tempProject.id } }),
                prisma.goal.findUnique({ where: { projectId: tempProject.id } }),
                prisma.profile.findUnique({ where: { projectId: tempProject.id } }),
                prisma.tab.findMany({ where: { projectId: tempProject.id } }),
                prisma.algorithm.findMany({
                    where: { tabId: { in: tempProject.tabs.map(t => t.id) } }
                }),
                prisma.workoutPlan.findMany({
                    where: { tabId: { in: tempProject.tabs.map(t => t.id) } }
                }),
                prisma.activity.findMany({
                    where: {
                        workoutPlanId: {
                            in: tempProject.tabs
                                .map(t => t.workoutPlan?.id)
                                .filter(Boolean) as string[]
                        }
                    }
                })
            ]);

            const [
                project,
                goal,
                profile,
                tabs,
                algorithms,
                workoutPlans,
                activities
            ] = checks;

            expect(project).toBeNull();
            expect(goal).toBeNull();
            expect(profile).toBeNull();
            expect(tabs).toHaveLength(0);
            expect(algorithms).toHaveLength(0);
            expect(workoutPlans).toHaveLength(0);
            expect(activities).toHaveLength(0);

        });
    });


    describe('Goal methods', () => {
        let projectId: string | undefined;
        let goalId: string | undefined;

        beforeAll(async () => {
            const project = await databaseService.createProject({
                userId: new ObjectId().toString(),
                name: 'Test Project for Goal',
                description: 'Test project for goal methods',
                profile: {biometrics: {height: 180, weight: 75, age: 25}},
                tabs: [],
                goal: {goalStats: {targetWeight: 70, targetBMI: 22}},
            });


            projectId = project.id;
            goalId = project.goal?.id;
            expect(goalId).toBeDefined();
        });

        afterAll(async () => {
            if (projectId) {
                await prisma.$transaction([
                    prisma.goal.deleteMany({where: {projectId}}),
                    prisma.project.delete({where: {id: projectId}})
                ]);
            }
        });

        it('should get goal by ID', async () => {
            const goal = await databaseService.getGoalById(goalId ?? '');
            expect(goal?.id).toBe(goalId);
        });


        it('should get goal by project ID', async () => {
            const goal = await databaseService.getGoalByProjectId(projectId ?? '');
            expect(goal?.projectId).toBe(projectId);
        });

        it('should update goal stats', async () => {
            const newGoalStats = {targetWeight: 65, targetBMI: 21};
            const updatedGoal = await databaseService.updateGoal(goalId ?? '', newGoalStats);
            expect(updatedGoal.goalStats).toEqual(newGoalStats);
        });
    });

    describe('Tab methods', () => {
        let projectId: string;
        let tabId: string;
        let workoutPlanId: string;
        beforeAll(async () => {
            const project = await databaseService.createProject({
                userId: new ObjectId().toString(),
                name: 'Test Project for Tab',
                description: 'Test project for tab methods',
                profile: {biometrics: {height: 180, weight: 75, age: 25}},
                tabs: [],
                goal: {goalStats: {targetWeight: 70, targetBMI: 22}},
            });

            projectId = project.id;
        });

        afterAll(async () => {
            if (projectId) {
                await prisma.$transaction([
                    prisma.goal.deleteMany({
                        where: {projectId},
                    }),
                    prisma.algorithm.deleteMany({
                        where: {tabId},
                    }),
                    prisma.tab.deleteMany({
                        where: {projectId},
                    }),
                    prisma.profile.deleteMany({
                        where: {projectId},
                    }),
                    prisma.project.delete({
                        where: {id: projectId},
                    }),
                ]);
            }
        });


        it('should add new tab', async () => {
            const tab = await databaseService.addTab(projectId, {
                title: 'Test Tab',
                type: 'WORKOUT',
                algorithms: [{
                    viewTemplate: 'TODO',
                    calculationAlgorithm: 'calcAlgo1',
                    viewData: {input: 'data1', title: 'title1'}
                }],
                workoutPlan: {
                    activities: [
                        {
                            date: new Date(),
                            title: 'Activity 1',
                            description: 'Description 1',
                            type: 'ATOMIC',
                            data: {atomic: true}
                        },
                    ],
                },
            });

            tabId = tab.id;
            workoutPlanId = tab.workoutPlan?.id ?? '';
            expect(tab.title).toBe('Test Tab');
            expect(tab.type).toBe('WORKOUT');
            expect(tab.algorithms.length).toBe(1);
            expect(tab.workoutPlan?.activities.length).toBe(1);

        });

        it('should get tab by id', async () => {
            const fetchedTab = await databaseService.getTabById(tabId);
            expect(fetchedTab?.id).toBe(tabId);
        });


        it('should get tabs by project id', async () => {
            const tabs = await databaseService.getTabsByProjectId(projectId);
            expect(tabs.some(t => t.id === tabId)).toBeTruthy();
        });

        it('should update tab title', async () => {
            const updatedTab = await databaseService.updateTabTitle(tabId, 'Updated Title');
            expect(updatedTab.title).toBe('Updated Title');
        });



        it('should delete tab', async () => {
        await databaseService.deleteTab(tabId);

        const checks = await prisma.$transaction([
            prisma.tab.findUnique({where: {id: tabId}}),
            prisma.algorithm.findMany({where: {tabId: tabId}}),
            prisma.workoutPlan.findUnique({where: {tabId: tabId}}),
            prisma.activity.findMany({
                where: {
                    workoutPlanId: workoutPlanId
                }
            })
        ]);

        const [
            deletedTab,
            remainingAlgorithms,
            remainingWorkoutPlan,
            remainingActivities
        ] = checks;

        expect(deletedTab).toBeNull();
        expect(remainingAlgorithms).toHaveLength(0);
        expect(remainingWorkoutPlan).toBeNull();
        expect(remainingActivities).toHaveLength(0);
    });
    });

    describe('Algorithm methods', () => {
        let projectId: string;
        let tabId: string;
        let algorithmId: string;

        beforeAll(async () => {
            const project = await databaseService.createProject({
                userId: new ObjectId().toString(),
                name: 'Test Project for Algorithm',
                description: 'Test project for algorithm methods',
                profile: {biometrics: {height: 180, weight: 75, age: 25}},
                tabs: [
                    {
                        title: 'Test Tab',
                        type: 'WORKOUT',
                        algorithms: [{
                            viewTemplate: 'TODO',
                            calculationAlgorithm: 'calcAlgo1',
                            viewData: {input: 'data1', title: 'title1'}
                        }],
                        workoutPlan: {
                            activities: [
                                {
                                    date: new Date(),
                                    title: 'Activity 1',
                                    description: 'Description 1',
                                    type: 'ATOMIC',
                                    data: {atomic: true}
                                },
                            ],
                        },
                    },
                ],
                goal: {goalStats: {targetWeight: 70, targetBMI: 22}},
            });

            projectId = project.id;
            tabId = project.tabs[0].id;
            algorithmId = project.tabs[0].algorithms[0].id;
        });

        afterAll(async () => {
            if (projectId) {
                await prisma.$transaction([
                    prisma.algorithm.deleteMany({
                        where: {tabId},
                    }),
                    prisma.tab.deleteMany({
                        where: {projectId},
                    }),
                    prisma.profile.deleteMany({
                        where: {projectId},
                    }),
                    prisma.goal.deleteMany({
                        where: {projectId},
                    }),
                    prisma.project.delete({
                        where: {id: projectId},
                    }),
                ]);
            }
        });

        it('should update algorithm', async () => {
            const algorithm = await databaseService.updateAlgorithm(algorithmId, {
                viewTemplate: 'TODO',
                calculationAlgorithm: 'calcAlgo1',
                viewData: {input: 'data1', title: 'title1'},
            });

            algorithmId = algorithm.id;
            expect(algorithm.viewTemplate).toBe('TODO');
            expect(algorithm.calculationAlgorithm).toBe('calcAlgo1');
            expect(algorithm.viewData).toEqual({input: 'data1', title: 'title1'});
        });

        it('should get algorithm by id', async () => {
            const fetchedAlgorithm = await databaseService.getAlgorithmById(algorithmId);
            expect(fetchedAlgorithm?.id).toBe(algorithmId);
        });

        it('should get algorithms by tab id', async () => {
            const algorithms = await databaseService.getAlgorithmsByTabId(tabId);
            expect(algorithms.some(a => a.id === algorithmId)).toBeTruthy();
        });

        it('should delete algorithm', async () => {
            await databaseService.deleteAlgorithm(algorithmId);
            const deletedAlgorithm = await prisma.algorithm.findUnique({where: {id: algorithmId}});
            expect(deletedAlgorithm).toBeNull();
        });
    });

    describe('Activity methods', () => {
        let projectId: string;
        let tabId: string;
        let workoutPlanId: string;
        let activityId: string;

        beforeAll(async () => {
            const project = await databaseService.createProject({
                userId: new ObjectId().toString(),
                name: 'Test Project for Activity',
                description: 'Test project for activity methods',
                profile: {biometrics: {height: 180, weight: 75, age: 25}},
                tabs: [
                    {
                        title: 'Test Tab',
                        type: 'WORKOUT',
                        algorithms: [],
                        workoutPlan: {
                            activities: [
                                {
                                    date: new Date(),
                                    title: 'Activity 1',
                                    description: 'Description 1',
                                    type: 'ATOMIC',
                                    data: {atomic: true}
                                },
                            ],
                        },
                    },
                ],
                goal: {goalStats: {targetWeight: 70, targetBMI: 22}},
            });

            projectId = project.id;
            tabId = project.tabs[0].id;
            workoutPlanId = project.tabs[0].workoutPlan?.id ?? '';
            activityId = project.tabs[0].workoutPlan?.activities[0].id ?? '';
        });

        afterAll(async () => {
            if (projectId) {
                await prisma.$transaction([
                    prisma.activity.deleteMany({
                        where: {workoutPlanId},
                    }),
                    prisma.workoutPlan.deleteMany({
                        where: {tabId},
                    }),
                    prisma.tab.deleteMany({
                        where: {projectId},
                    }),
                    prisma.profile.deleteMany({
                        where: {projectId},
                    }),
                    prisma.goal.deleteMany({
                        where: {projectId},
                    }),
                    prisma.project.delete({
                        where: {id: projectId},
                    }),
                ]);
            }
        });

        it('should get activity by ID', async () => {
            const activity = await databaseService.getActivityById(activityId);
            expect(activity?.id).toBe(activityId);
        });

        it('should get activities by workout plan ID', async () => {
            const activities = await databaseService.getActivitiesByWorkoutPlanId(workoutPlanId);
            expect(activities.some(a => a.id === activityId)).toBeTruthy();
        });

        it('should delete activity', async () => {
            await databaseService.deleteActivity(activityId);
            const deletedActivity = await prisma.activity.findUnique({where: {id: activityId}});
            expect(deletedActivity).toBeNull();
        });
    });

    describe('Workout Plan methods', () => {
    let projectId: string;
    let tabId: string;
    let workoutPlanId: string;

    beforeAll(async () => {
        const project = await databaseService.createProject({
            userId: new ObjectId().toString(),
            name: 'Test Project for Workout Plan',
            description: 'Test project for workout plan methods',
            profile: {biometrics: {height: 180, weight: 75, age: 25}},
            tabs: [
                {
                    title: 'Test Tab',
                    type: 'WORKOUT',
                    algorithms: [],
                    workoutPlan: {
                        activities: [
                            {
                                date: new Date(),
                                title: 'Activity 1',
                                description: 'Description 1',
                                type: 'ATOMIC',
                                data: {atomic: true}
                            },
                        ],
                    },
                },
            ],
            goal: {goalStats: {targetWeight: 70, targetBMI: 22}},
        });

        projectId = project.id;
        tabId = project.tabs[0].id;
        workoutPlanId = project.tabs[0].workoutPlan?.id ?? '';
    });

    afterAll(async () => {
        if (projectId) {
            await prisma.$transaction([
                prisma.activity.deleteMany({
                    where: {workoutPlanId},
                }),
                prisma.workoutPlan.deleteMany({
                    where: {tabId},
                }),
                prisma.tab.deleteMany({
                    where: {projectId},
                }),
                prisma.profile.deleteMany({
                    where: {projectId},
                }),
                prisma.goal.deleteMany({
                    where: {projectId},
                }),
                prisma.project.delete({
                    where: {id: projectId},
                }),
            ]);
        }
    });

    it('should get workout plan by ID', async () => {
        const workoutPlan = await databaseService.getWorkoutPlanById(workoutPlanId);
        expect(workoutPlan?.id).toBe(workoutPlanId);
    });

    it('should get workout plan by tab ID', async () => {
        const workoutPlan = await databaseService.getWorkoutPlanByTabId(tabId);
        expect(workoutPlan?.tabId).toBe(tabId);
    });

    it('should delete workout plan', async () => {
        await databaseService.deleteWorkoutPlan(workoutPlanId);
        const deletedWorkoutPlan = await prisma.workoutPlan.findUnique({where: {id: workoutPlanId}});
        expect(deletedWorkoutPlan).toBeNull();
    });
});
});

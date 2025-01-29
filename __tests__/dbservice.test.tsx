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
                                name: 'Algorithm 1',
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

            const deletedProject = await prisma.project.findUnique({
                where: {id: tempProject.id},
            });

            expect(deletedProject).toBeNull();
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
            });

            tabId = tab.id;
            expect(tab.title).toBe('Test Tab');
            expect(tab.type).toBe('WORKOUT');
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
            const deletedTab = await prisma.tab.findUnique({where: {id: tabId}});
            expect(deletedTab).toBeNull();
        });
    });

});

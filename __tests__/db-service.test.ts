import { PrismaClient } from '@prisma/client';
import { databaseService } from '@/services/databaseService';

type TestDependencies = {
    userId: string;
    projectId: string;
    tabId: string;
    workoutPlanId: string;
};

const prisma = new PrismaClient();

const createTestUser = async () => {
    return await databaseService.createUser('Test User', 'test@example.com');
};

const createTestProject = async (userId: string) => {
    return await databaseService.createProject({
        userId,
        name: 'Test Project',
        description: 'Test Description',
        profile: { biometrics: { height: 180, weight: 75 } },
        tabs: [
            {
                title: 'Test Tab',
                type: 'WORKOUT',
                workoutPlan: {
                    activities: [
                        {
                            title: 'Test Activity',
                            description: 'Test Description',
                            type: 'ATOMIC',
                            data: { atomic: true },
                            date: new Date(),
                        },
                    ],
                    algorithm: { calculationAlgorithm: 'TODO_calculationAlgorithm' },
                    viewTemplate: 'TODO',
                },
            },
        ],
        goal: { goalStats: { targetWeight: 70 } },
    });
};

const setupTestDependencies = async (): Promise<TestDependencies> => {
    const user = await createTestUser();
    const project = await createTestProject(user.id);
    const tabId = project.tabs[0].id;
    const workoutPlan = await databaseService.getWorkoutPlanByTabId(tabId);

    if (!workoutPlan) {
        throw new Error('Workout plan not created');
    }

    return {
        userId: user.id,
        projectId: project.id,
        tabId,
        workoutPlanId: workoutPlan.id,
    };
};

const cleanupTestDependencies = async (deps: TestDependencies) => {
    await prisma.$transaction([
        prisma.activity.deleteMany({ where: { workoutPlanId: deps.workoutPlanId } }),
        prisma.algorithm.deleteMany({ where: { workoutPlanId: deps.workoutPlanId } }),
        prisma.workoutPlan.deleteMany({ where: { id: deps.workoutPlanId } }),
        prisma.tab.deleteMany({ where: { projectId: deps.projectId } }),
        prisma.goal.deleteMany({ where: { projectId: deps.projectId } }),
        prisma.profile.deleteMany({ where: { projectId: deps.projectId } }),
        prisma.project.deleteMany({ where: { id: deps.projectId } }),
        prisma.user.deleteMany({ where: { id: deps.userId } }),
    ]);
};

describe('databaseService', () => {
    describe('User', () => {
        let userId: string;

        afterEach(async () => {
            if (userId) {
                await prisma.user.deleteMany({
                    where: { id: userId }
                });
            }
        });

        it('should handle user lifecycle', async () => {
            // Create
            const user = await createTestUser();
            userId = user.id;
            expect(user).toMatchObject({ name: 'Test User' });

            // Get
            const fetchedUser = await databaseService.getUserById(userId);
            expect(fetchedUser?.id).toBe(userId);

            // Update
            const updatedUser = await databaseService.updateUser(userId, 'New Name');
            expect(updatedUser.name).toBe('New Name');

            // Delete
            await databaseService.deleteUser(userId);
            const deletedUser = await databaseService.getUserById(userId);
            expect(deletedUser).toBeNull();
        });
    });

    describe('Project', () => {
        let deps: TestDependencies;

        afterAll(async () => {
            const projectExists = await prisma.project.findUnique({
                where: { id: deps.projectId }
            });

            if (projectExists) {
                await cleanupTestDependencies(deps);
            }
        });

        beforeAll(async () => {
            deps = await setupTestDependencies();
        });


        it('should handle project lifecycle', async () => {
            // Get project
            const project = await databaseService.getProjectById(deps.projectId);
            expect(project?.name).toBe('Test Project');

            // Update
            const updatedProject = await databaseService.updateProject(
                deps.projectId,
                'New Name',
                'New Description'
            );
            expect(updatedProject.name).toBe('New Name');
            expect(updatedProject.description).toBe('New Description');

            // Delete
            await databaseService.deleteProject(deps.projectId);
            const deletedProject = await databaseService.getProjectById(deps.projectId);
            expect(deletedProject).toBeNull();
        });
    });

    describe('Tab', () => {
        let deps: TestDependencies;
        let newTabId: string;

        beforeAll(async () => {
            deps = await setupTestDependencies();
        });

        afterAll(async () => {
            await cleanupTestDependencies(deps);
        });

        it('should handle tab lifecycle', async () => {
            // Add new tab
            const tab = await databaseService.addTab(deps.projectId, {
                title: 'New Tab',
                type: 'WORKOUT',
                workoutPlan: {
                    viewTemplate: 'TODO',
                    activities: [],
                },
            });
            newTabId = tab.id;

            // Get
            const fetchedTab = await databaseService.getTabById(newTabId);
            expect(fetchedTab?.title).toBe('New Tab');

            // Update
            const updatedTab = await databaseService.updateTabTitle(newTabId, 'Updated Tab');
            expect(updatedTab.title).toBe('Updated Tab');

            // Delete
            await databaseService.deleteTab(newTabId);
            const deletedTab = await databaseService.getTabById(newTabId);
            expect(deletedTab).toBeNull();
        });
    });

    describe('Algorithm', () => {
        let deps: TestDependencies;
        let algorithmId: string;

        beforeAll(async () => {
            deps = await setupTestDependencies();
            const algorithm = await prisma.algorithm.findFirst({
                where: { workoutPlanId: deps.workoutPlanId },
            });
            algorithmId = algorithm?.id || '';
        });

        afterAll(async () => {
            await cleanupTestDependencies(deps);
        });

        it('should handle algorithm lifecycle', async () => {
            // Update
            const updatedAlgorithm = await databaseService.updateAlgorithm(algorithmId, {
                calculationAlgorithm: 'UPDATED_ALGO',
            });
            expect(updatedAlgorithm.calculationAlgorithm).toBe('UPDATED_ALGO');

            // Delete
            await databaseService.deleteAlgorithm(algorithmId);
            const deletedAlgorithm = await databaseService.getAlgorithmById(algorithmId);
            expect(deletedAlgorithm).toBeNull();
        });
    });

    describe('Activity', () => {
        let deps: TestDependencies;
        let activityId: string;

        beforeAll(async () => {
            deps = await setupTestDependencies();
        });

        afterAll(async () => {
            await cleanupTestDependencies(deps);
        });

        it('should handle activity lifecycle', async () => {
            // Add
            const activity = await databaseService.addActivity(deps.workoutPlanId, {
                title: 'Evening Yoga',
                description: '30-minute session',
                type: 'NUMERIC',
                data: { numeric: 30 },
                date: new Date(),
            });
            activityId = activity.id;

            // Get
            const fetchedActivity = await databaseService.getActivityById(activityId);
            expect(fetchedActivity?.title).toBe('Evening Yoga');

            // Delete
            await databaseService.deleteActivity(activityId);
            const deletedActivity = await databaseService.getActivityById(activityId);
            expect(deletedActivity).toBeNull();
        });
    });

    describe('WorkoutPlan', () => {
        let deps: TestDependencies;

        beforeAll(async () => {
            deps = await setupTestDependencies();
        });

        afterAll(async () => {
            await cleanupTestDependencies(deps);
        });

        it('should handle workout plan operations', async () => {
            // Get by ID
            const plan = await databaseService.getWorkoutPlanById(deps.workoutPlanId);
            expect(plan?.id).toBe(deps.workoutPlanId);

            // Delete
            await databaseService.deleteWorkoutPlan(deps.workoutPlanId);
            const deletedPlan = await databaseService.getWorkoutPlanById(deps.workoutPlanId);
            expect(deletedPlan).toBeNull();
        });
    });

    describe('Error Handling', () => {
        it('should throw when creating invalid activity', async () => {
            const deps = await setupTestDependencies();

            await expect(
                databaseService.addActivity(deps.workoutPlanId, {
                    title: '', // Invalid empty title
                    description: 'Test',
                    type: 'INVALID_TYPE' as never,
                    data: {},
                    date: new Date(),
                })
            ).rejects.toThrow();

            await cleanupTestDependencies(deps);
        });

        it('should throw when updating non-existent entity', async () => {
            await expect(
                databaseService.updateProject('non-existent-id', 'Name', 'Desc')
            ).rejects.toThrow();
        });
    });
});
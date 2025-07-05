import {databaseService, prisma} from "@/services/database_service/databaseService"
import {testLog} from "@/utils/logUtil";
import {ObjectId} from "mongodb";

describe('databaseService', () => {
    let userId: string;
    let projectId: string;
    let profileId: string;
    let templateId: string;
    let configId: string;
    let workoutPlanId: string;

    afterAll(async () => {
        // Clean up all test data
        await prisma.activity.deleteMany({});
        await prisma.workoutPlan.deleteMany({});
        await prisma.profile.deleteMany({});
        await prisma.workoutPlanConfig.deleteMany({});
        await prisma.configTemplate.deleteMany({});
        await prisma.project.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.$disconnect();
        console.log('🧹 Database cleaned and connection closed.');
    });

    // --------- USER CRUD ---------
    it('should create, get, update and delete a user', async () => {
        let user;
        // Create user
        try {
            user = await databaseService.createUser('Test Jest', 'jestuser@test.com');
            testLog('success', 'User created:', user);
            userId = user.id;
            expect(user).toHaveProperty('id');
            expect(user.email).toBe('jestuser@test.com');
        } catch (error: unknown) {
            testLog('error', 'Error in create user request' + (error as Error).message);
        }

        // Get user by ID
        try {
            const userFetched = await databaseService.getUserById(userId);
            testLog('success', 'User fetched by ID:', userFetched);

            expect(userFetched).toBeDefined();
            expect(userFetched?.id).toBe(userId);
        } catch (error: unknown) {
            testLog('error', `Error fetching user by ID: ${(error as Error).message}`);
            throw error;
        }

        // Update user
        try {
            const updatedUser = await databaseService.updateUser(userId, {name: 'Jest Updated'});
            testLog('success', 'User updated with new name:', updatedUser);

            expect(updatedUser.name).toBe('Jest Updated');
        } catch (error: unknown) {
            testLog('error', `Error updating user: ${(error as Error).message}`);
            throw error;
        }

        // Critical: Try creating user with same email (should fail)
        try {
            await expect(databaseService.createUser('Another', 'jestuser@test.com'))
                .rejects.toThrow();
            testLog('success', 'Duplicate email test passed: creation was rejected as expected');
        } catch (error: unknown) {
            testLog('error', `Duplicate email test failed: ${(error as Error).message}`);
            throw error;
        }

        // Edge: Try fetching non-existent user
        try {
            const fakeId = new ObjectId().toHexString();
            const missingUser = await databaseService.getUserById(fakeId);
            testLog('info', 'Non-existent user fetch test:', {result: missingUser, exists: !!missingUser});

            expect(missingUser).toBeNull();
        } catch (error: unknown) {
            testLog('error', `Error in non-existent user test: ${(error as Error).message}`);
            throw error;
        }
    });

    // --------- PROJECT CRUD ---------
    it('should create, get, update and delete a project', async () => {
        let project;
        let projectFetched;
        let updatedProject;
        let updatedProject2;
        let missingProject;

        // Create project
        try {
            project = await databaseService.createProject(userId, 'Jest Project', 'For tests');
            projectId = project.id;
            testLog('success', 'Project created', project);
            expect(project).toHaveProperty('id');
        } catch (error) {
            testLog('error', 'Failed to create project', error);
            throw error;
        }

        // Get project by ID
        try {
            projectFetched = await databaseService.getProjectById(projectId);
            testLog('info', 'Project fetched', projectFetched);
            expect(projectFetched?.id).toBe(projectId);
        } catch (error) {
            testLog('error', 'Failed to fetch project', error);
            throw error;
        }

        // Update project
        try {
            updatedProject = await databaseService.updateProject(projectId, {title: 'New Jest Project'});
            testLog('update', 'Project updated', updatedProject);
            expect(updatedProject.title).toBe('New Jest Project');
        } catch (error) {
            testLog('error', 'Failed to update project', error);
            throw error;
        }

        // Edge: Update project with empty data (should not throw, but change nothing)
        try {
            updatedProject2 = await databaseService.updateProject(projectId, {});
            testLog('info', 'Project updated with empty data', updatedProject2);
            expect(updatedProject2.title).toBe('New Jest Project');
        } catch (error) {
            testLog('warn', 'Empty update threw an error', error);
            throw error;
        }

        // Edge: Try fetching non-existent project (should return null)
        try {
            const fakeId = '000000000000000000000000'; // валидный ObjectId
            missingProject = await databaseService.getProjectById(fakeId);
            testLog('info', 'Non-existent project fetch test', {result: missingProject, exists: !!missingProject});
            expect(missingProject).toBeNull();
        } catch (error) {
            testLog('error', 'Failed to fetch non-existent project', error);
            throw error;
        }
    });

    // --------- PROFILE CRUD ---------
    it('should create, fetch and update a profile', async () => {
        let profile;
        let fetchedProfile;
        let updatedProfile;

        // Create profile for project
        try {
            profile = await databaseService.createProfile(projectId, { weight: 95 }, { weight: 85 });
            testLog('success', 'Profile created', profile);
            profileId = profile.id;
            expect(profile.projectId).toBe(projectId);
        } catch (error) {
            testLog('error', 'Failed to create Profile', error);
            throw error;
        }

        // Get profile by project ID
        try {
            fetchedProfile = await databaseService.getProfileByProjectId(projectId);
            testLog('info', 'Profile fetched', fetchedProfile);
            expect(fetchedProfile?.id).toBe(profileId);
        } catch (error) {
            testLog('error', 'Failed to fetch Profile', error);
            throw error;
        }

        // Update profile biometrics
        try {
            updatedProfile = await databaseService.updateProfile(profileId, { weight: 90 });
            testLog('update', 'Profile updated', updatedProfile);
            expect((updatedProfile.biometrics as any).weight).toBe(90);
        } catch (error) {
            testLog('error', 'Failed to update Profile', error);
            throw error;
        }
    });

    // --------- CONFIG TEMPLATE & PLAN CONFIG ---------
    it('should create a workout plan config and read templates', async () => {
        let template;
        let config;

        // Insert config template directly
        try {
            template = await prisma.configTemplate.create({
                data: {
                    templateName: 'tmpl',
                    description: 't',
                    goalTypes: ['test'],
                    requiredBiometrics: ['weight'],
                    activityGuidelines: {},
                    adaptationRules: {},
                },
            });
            templateId = template.templateId;
            testLog('success', 'ConfigTemplate created', template);
        } catch (error) {
            testLog('error', 'Failed to create ConfigTemplate', error);
            throw error;
        }

        // Create workout plan config using service
        try {
            config = await databaseService.createWorkoutPlanConfig(
                templateId,
                projectId,
                { weight: 95 },
                'test_goal',
                [],
                {}
            );
            configId = config.configId;
            testLog('success', 'WorkoutPlanConfig created', config);
        } catch (error) {
            testLog('error', 'Failed to create WorkoutPlanConfig', error);
            throw error;
        }

        // Fetch template and configs
        try {
            const fetchedTemplate = await databaseService.getConfigTemplateById(templateId);
            testLog('info', 'Template fetched', fetchedTemplate);
            const configs = await databaseService.getWorkoutPlanConfigsByProjectId(projectId);
            testLog('info', 'Configs fetched', configs);
            expect(fetchedTemplate?.templateId).toBe(templateId);
            expect(configs[0].configId).toBe(configId);
        } catch (error) {
            testLog('error', 'Failed to fetch template or configs', error);
            throw error;
        }
    });

    // --------- WORKOUT PLAN CRUD ---------
    it('should create, fetch and delete a workout plan', async () => {
        let plan;
        let plans;

        // Create plan
        try {
            plan = await databaseService.createWorkoutPlan(projectId, templateId, configId);
            workoutPlanId = plan.id;
            testLog('success', 'WorkoutPlan created', plan);
            expect(plan.projectId).toBe(projectId);
        } catch (error) {
            testLog('error', 'Failed to create WorkoutPlan', error);
            throw error;
        }

        // Get plans by project
        try {
            plans = await databaseService.getWorkoutPlansByProjectId(projectId);
            testLog('info', 'Plans fetched', plans);
            expect(plans.some(p => p.id === workoutPlanId)).toBe(true);
        } catch (error) {
            testLog('error', 'Failed to fetch WorkoutPlans', error);
            throw error;
        }

        // Delete plan
        try {
            await databaseService.deleteWorkoutPlan(workoutPlanId);
            testLog('delete', 'WorkoutPlan deleted', workoutPlanId);
            const shouldBeNull = await prisma.workoutPlan.findUnique({ where: { id: workoutPlanId } });
            expect(shouldBeNull).toBeNull();
        } catch (error) {
            testLog('error', 'Failed to delete WorkoutPlan', error);
            throw error;
        }
    });

    // --------- ACTIVITY CRUD ---------
    it('should create, get, update and delete activity for workout plan', async () => {
        let workoutPlan, activity, activities, updatedActivity, afterDelete, workoutPlanId;
        // Create activity
        try {
            workoutPlan = await databaseService.createWorkoutPlan(
                projectId,
                'template1',
                'config1'
            );
            workoutPlanId = workoutPlan.id;
            testLog('success', 'WorkoutPlan created', workoutPlan);
        } catch (error) {
            testLog('error', 'Failed to create WorkoutPlan', error);
            throw error;
        }

        try {
            activity = await databaseService.createActivity(workoutPlanId, {
                title: 'Pushups',
                type: 'NUMERIC',
                targetMetric: 20,
                order: 1,
                date: new Date().toISOString(),
            });
            testLog('success', 'Activity created', activity);
            expect(activity).toHaveProperty('id');
        } catch (error) {
            testLog('error', 'Failed to create Activity', error);
            throw error;
        }

        try {
            activities = await databaseService.getActivitiesByWorkoutPlanId(workoutPlanId);
            testLog('info', 'Activities fetched', activities);
            expect(Array.isArray(activities)).toBe(true);
            expect(activities[0].title).toBe('Pushups');
        } catch (error) {
            testLog('error', 'Failed to fetch Activities', error);
            throw error;
        }

        try {
            updatedActivity = await databaseService.updateActivity(activity.id, {completedMetric: 99999});
            testLog('update', 'Activity updated (extreme value)', updatedActivity);
            expect(updatedActivity.completedMetric).toBe(99999);
        } catch (error) {
            testLog('error', 'Failed to update Activity', error);
            throw error;
        }

        try {
            await expect(databaseService.updateActivity('000000000000000000000000', {completedMetric: 1}))
                .rejects.toThrow();
        } catch (error) {
            testLog('error', 'Failed to update non-existent Activity', error);
            throw error;
        }

        try {
            await databaseService.deleteActivity(activity.id);
            testLog('delete', 'Activity deleted', activity.id);

            afterDelete = await prisma.activity.findUnique({where: {id: activity.id}});
            expect(afterDelete).toBeNull();
        } catch (error) {
            testLog('error', 'Failed to delete Activity', error);
            throw error;
        }

        try {
            await expect(databaseService.deleteActivity(activity.id)).rejects.toThrow();
        } catch (error) {
            testLog('error', 'Failed to delete already deleted Activity', error);
            throw error;
        }
    });

    // --------- CASCADE DELETE ---------
    it('should delete user with all related projects (cascade)', async () => {
        try {
            await databaseService.deleteUser(userId);
            testLog('delete', 'User deleted (cascade)', userId);

            const user = await prisma.user.findUnique({where: {id: userId}});
            expect(user).toBeNull();
            const project = await prisma.project.findUnique({where: {id: projectId}});
            expect(project).toBeNull();

            // Edge: Try deleting already deleted user (should throw)
            await expect(databaseService.deleteUser(userId)).rejects.toThrow();
        } catch (error) {
            testLog('error', 'Cascade delete test failed', error);
            throw error;
        }
    });
});

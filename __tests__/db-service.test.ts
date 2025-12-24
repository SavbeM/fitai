import { databaseService, prisma } from "@/services/database_service/databaseService";
import { ObjectId } from "mongodb";
import { ActivityStatus, ExerciseType, UnitType } from "@prisma/client";

/**
 * Reusable acceptance tests for databaseService.
 *
 * Contract:
 * - Each entity CRUD should work end-to-end against the configured Prisma datasource.
 * - Every test cleans up its own created records so the suite is re-runnable.
 * - Tests use unique emails/names so they don’t conflict between runs.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL);

(hasDatabase ? describe : describe.skip)("databaseService acceptance", () => {
    const createdIds = {
        activityIds: [] as string[],
        workoutPlanIds: [] as string[],
        exerciseIds: [] as string[],
        projectIds: [] as string[],
        userIds: [] as string[],
        templateIds: [] as string[],
    };

    const unique = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const track = {
        activity: (id: string) => createdIds.activityIds.push(id),
        workoutPlan: (id: string) => createdIds.workoutPlanIds.push(id),
        exercise: (id: string) => createdIds.exerciseIds.push(id),
        project: (id: string) => createdIds.projectIds.push(id),
        user: (id: string) => createdIds.userIds.push(id),
        template: (id: string) => createdIds.templateIds.push(id),
    };

    async function cleanupCreated() {
        // Delete in dependency order.
        await prisma.activity.deleteMany({ where: { id: { in: createdIds.activityIds } } });
        await prisma.workoutPlan.deleteMany({ where: { id: { in: createdIds.workoutPlanIds } } });

        // Join table cleanup (template <-> exercise) to avoid orphans in Mongo.
        await prisma.configTemplateRecommendedExercise.deleteMany({
            where: { templateId: { in: createdIds.templateIds } },
        });
        await prisma.configTemplateRecommendedExercise.deleteMany({
            where: { exerciseId: { in: createdIds.exerciseIds } },
        });

        await prisma.exercise.deleteMany({ where: { id: { in: createdIds.exerciseIds } } });
        await prisma.project.deleteMany({ where: { id: { in: createdIds.projectIds } } });
        await prisma.user.deleteMany({ where: { id: { in: createdIds.userIds } } });
        await prisma.configTemplate.deleteMany({ where: { id: { in: createdIds.templateIds } } });

        createdIds.activityIds = [];
        createdIds.workoutPlanIds = [];
        createdIds.exerciseIds = [];
        createdIds.projectIds = [];
        createdIds.userIds = [];
        createdIds.templateIds = [];
    }

    afterEach(async () => {
        await cleanupCreated();
    });

    afterAll(async () => {
        await cleanupCreated();
        await prisma.$disconnect();
    });

    async function createUserFixture() {
        const user = await databaseService.createUser({
            name: unique("User"),
            email: `${unique("user")}@test.com`,
        });
        track.user(user.id);
        return user;
    }

    async function createTemplateFixture(overrides?: Partial<Parameters<typeof prisma.configTemplate.create>[0]["data"]>) {
        const template = await prisma.configTemplate.create({
            data: {
                templateName: unique("Template"),
                tags: [],
                description: "Template desc",
                requiredTargetMetrics: { name: "duration", unit: UnitType.MIN },
                activityGuidelines: { frequency_per_week: 3, required_exercise_ids: [] },
                ...overrides,
            },
        });
        track.template(template.id);
        return template;
    }

    async function createExerciseFixture() {
        const exercise = await databaseService.createExercise({
            title: unique("Exercise"),
            description: "desc",
            type: ExerciseType.NUMERIC,
            loadMetrics: [{ name: "reps", unit: UnitType.REP, description: null }],
        });
        track.exercise(exercise.id);
        return exercise;
    }

    async function createProjectFixture(userId: string) {
        const project = await databaseService.createProject({
            title: unique("Project"),
            description: "Project description",
            userId,
        });
        track.project(project.id);
        return project;
    }

    // ---------- USER ----------
    it(
        "User CRUD + error handling",
        async () => {
            const email = `${unique("dup")}@test.com`;

            const user = await databaseService.createUser({
                name: unique("Test User"),
                email,
            });

            expect(user).toHaveProperty("id");
            track.user(user.id);

            const fetched = await databaseService.getUserById(user.id);
            expect(fetched?.id).toBe(user.id);

            const updated = await databaseService.updateUser({
                id: user.id,
                name: "Updated User",
            });
            expect(updated.name).toBe("Updated User");

            await expect(
                databaseService.createUser({
                    name: "Duplicate",
                    email,
                })
            ).rejects.toThrow();

            const fakeId = new ObjectId().toHexString();
            await expect(
                databaseService.updateUser({
                    id: fakeId,
                    name: "Ghost",
                })
            ).rejects.toThrow();

            await databaseService.deleteUser(user.id);

            // Important: avoid double-delete issues with afterEach cleanup.
            createdIds.userIds = createdIds.userIds.filter((id) => id !== user.id);

            const deleted = await prisma.user.findUnique({ where: { id: user.id } });
            expect(deleted).toBeNull();

            await expect(databaseService.deleteUser(user.id)).rejects.toThrow();
        },
        15000
    );

    // ---------- PROJECT ----------
    it(
        "Project CRUD",
        async () => {
            const user = await createUserFixture();
            const project = await createProjectFixture(user.id);

            const fetched = await databaseService.getProjectById(project.id);
            expect(fetched?.id).toBe(project.id);

            const updated = await databaseService.updateProject({
                id: project.id,
                title: "Updated Project",
            });
            expect(updated.title).toBe("Updated Project");

            await expect(
                databaseService.updateProject({
                    id: new ObjectId().toHexString(),
                    title: "Ghost Project",
                })
            ).rejects.toThrow();

            await databaseService.deleteProject(project.id);
            createdIds.projectIds = createdIds.projectIds.filter((id) => id !== project.id);

            const deleted = await prisma.project.findUnique({ where: { id: project.id } });
            expect(deleted).toBeNull();
        },
        15000
    );

    // ---------- CONFIG TEMPLATE ----------
    it("ConfigTemplate read endpoints", async () => {
        const template = await createTemplateFixture({
            templateName: "Weight Loss",
            tags: ["weight_loss"],
        });

        const fetched = await databaseService.getConfigTemplateById(template.id);
        expect(fetched?.id).toBe(template.id);

        const all = await databaseService.getAllConfigTemplates();
        expect(all.some((t) => t.id === template.id)).toBe(true);
    });

    // ---------- EXERCISE ----------
    it(
        "Exercise CRUD",
        async () => {
            const exercise = await databaseService.createExercise({
                title: "Push Ups",
                description: "Bodyweight",
                type: ExerciseType.NUMERIC,
                loadMetrics: [{ name: "reps", unit: UnitType.REP, description: null }],
            });

            expect(exercise).toHaveProperty("id");
            track.exercise(exercise.id);

            const fetched = await databaseService.getExerciseByID(exercise.id);
            expect(fetched?.id).toBe(exercise.id);

            const updated = await databaseService.updateExercise({
                id: exercise.id,
                title: "Wide Push Ups",
            });
            expect(updated.title).toBe("Wide Push Ups");

            await databaseService.deleteExerciseByID(exercise.id);
            createdIds.exerciseIds = createdIds.exerciseIds.filter((id) => id !== exercise.id);

            const deleted = await prisma.exercise.findUnique({ where: { id: exercise.id } });
            expect(deleted).toBeNull();

            await expect(databaseService.deleteExerciseByID(exercise.id)).rejects.toThrow();
        },
        15000
    );

    // ---------- WORKOUT PLAN + ACTIVITY ----------
    it(
        "WorkoutPlan + Activity flow",
        async () => {
            const user = await createUserFixture();
            const project = await createProjectFixture(user.id);
            const template = await createTemplateFixture({
                templateName: "WP Template",
                activityGuidelines: { frequency_per_week: 2, required_exercise_ids: [] },
            });
            const exercise = await createExerciseFixture();

            const plan = await databaseService.createWorkoutPlan({
                projectId: project.id,
                templateId: template.id,
            });
            expect(plan).toHaveProperty("id");
            track.workoutPlan(plan.id);

            const activity = await databaseService.createActivity({
                exerciseId: exercise.id,
                workoutPlanId: plan.id,
                date: new Date(),
                planned_load: [{ metric: { name: "minutes", unit: UnitType.MIN, description: null }, value: 20 }],
            });

            expect(activity).toHaveProperty("id");
            track.activity(activity.id);

            const updatedActivity = await databaseService.updateActivity({
                id: activity.id,
                status: ActivityStatus.COMPLETED,
                actual_load: [{ metric: { name: "minutes", unit: UnitType.MIN, description: null }, value: 25 }],
            });

            expect(updatedActivity.status).toBe(ActivityStatus.COMPLETED);

            await databaseService.deleteActivity(activity.id);
            createdIds.activityIds = createdIds.activityIds.filter((id) => id !== activity.id);

            const deletedActivity = await prisma.activity.findUnique({ where: { id: activity.id } });
            expect(deletedActivity).toBeNull();

            await databaseService.deleteWorkoutPlan(plan.id);
            createdIds.workoutPlanIds = createdIds.workoutPlanIds.filter((id) => id !== plan.id);

            const deletedPlan = await prisma.workoutPlan.findUnique({ where: { id: plan.id } });
            expect(deletedPlan).toBeNull();
        },
        20000
    );
});

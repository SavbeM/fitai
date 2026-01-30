import { PrismaClient, ExerciseType, UnitType } from "@prisma/client";

const prisma = new PrismaClient();

type Metric = {
    name: string;
    unit: UnitType;
    description?: string | null;
};

async function upsertExercise(input: {
    title: string;
    description?: string;
    type: ExerciseType;
    loadMetrics: Metric[];
}) {
    const existing = await prisma.exercise.findFirst({ where: { title: input.title } });
    if (existing) return existing;

    return prisma.exercise.create({
        data: {
            title: input.title,
            description: input.description,
            type: input.type,
            loadMetrics: input.loadMetrics,
        },
    });
}

async function upsertTemplate(input: {
    templateName: string;
    tags: string[];
    description?: string;
    requiredTargetMetrics: Metric;
    frequency_per_week: number;
    required_exercise_ids: string[];
    recommended_exercise_ids: string[];
}) {
    const existing = await prisma.configTemplate.findFirst({
        where: { templateName: input.templateName },
        select: { id: true },
    });

    const template =
        existing ??
        (await prisma.configTemplate.create({
            data: {
                templateName: input.templateName,
                tags: input.tags,
                description: input.description,
                requiredTargetMetrics: input.requiredTargetMetrics,
                activityGuidelines: {
                    frequency_per_week: input.frequency_per_week,
                    required_exercise_ids: input.required_exercise_ids,
                },
            },
            select: { id: true },
        }));

    if (input.recommended_exercise_ids.length) {
        for (const exerciseId of input.recommended_exercise_ids) {
            const exists = await prisma.configTemplateRecommendedExercise.findFirst({
                where: { templateId: template.id, exerciseId },
            });
            if (!exists) {
                await prisma.configTemplateRecommendedExercise.create({
                    data: { templateId: template.id, exerciseId },
                });
            }
        }
    }

    return template;
}

async function main() {
    // Exercises
    const bench = await upsertExercise({
        title: "Barbell Bench Press",
        description: "Classic chest press. Track weight and reps.",
        type: ExerciseType.NUMERIC,
        loadMetrics: [
            { name: "weight", unit: UnitType.KG, description: "Working weight" },
            { name: "reps", unit: UnitType.REP, description: "Repetitions" },
        ],
    });

    const squat = await upsertExercise({
        title: "Back Squat",
        description: "Main lower-body strength lift.",
        type: ExerciseType.NUMERIC,
        loadMetrics: [
            { name: "weight", unit: UnitType.KG },
            { name: "reps", unit: UnitType.REP },
        ],
    });

    const deadlift = await upsertExercise({
        title: "Deadlift",
        description: "Main posterior-chain strength lift.",
        type: ExerciseType.NUMERIC,
        loadMetrics: [
            { name: "weight", unit: UnitType.KG },
            { name: "reps", unit: UnitType.REP },
        ],
    });

    const pullup = await upsertExercise({
        title: "Pull-up",
        description: "Upper-body pulling. Can be bodyweight.",
        type: ExerciseType.NUMERIC,
        loadMetrics: [
            { name: "reps", unit: UnitType.REP },
            { name: "added_weight", unit: UnitType.KG, description: "Optional" },
        ],
    });

    const run = await upsertExercise({
        title: "Easy Run",
        description: "Zone-2 style run. Track time or distance.",
        type: ExerciseType.NUMERIC,
        loadMetrics: [
            { name: "time", unit: UnitType.MIN },
            { name: "distance", unit: UnitType.KM },
        ],
    });

    const plank = await upsertExercise({
        title: "Plank Hold",
        description: "Core stability hold.",
        type: ExerciseType.NUMERIC,
        loadMetrics: [{ name: "time", unit: UnitType.SEC }],
    });

    const burpees = await upsertExercise({
        title: "Burpees",
        description: "Conditioning staple.",
        type: ExerciseType.NUMERIC,
        loadMetrics: [{ name: "reps", unit: UnitType.REP }],
    });

    const mobility = await upsertExercise({
        title: "Mobility Routine",
        description: "Stretching / mobility session.",
        type: ExerciseType.BOOLEAN,
        loadMetrics: [{ name: "done", unit: UnitType.NONE, description: "Completed or not" }],
    });

    // Templates
    await upsertTemplate({
        templateName: "Strength Beginner (3x/week)",
        tags: ["strength", "beginner", "fullbody"],
        description: "Base strength plan for novices with big lifts.",
        requiredTargetMetrics: {
            name: "Strength progression",
            unit: UnitType.KG,
            description: "Primary lifts working weight trend",
        },
        frequency_per_week: 3,
        required_exercise_ids: [bench.id, squat.id],
        recommended_exercise_ids: [bench.id, squat.id, deadlift.id, plank.id],
    });

    await upsertTemplate({
        templateName: "Hypertrophy Upper/Lower (4x/week)",
        tags: ["hypertrophy", "intermediate", "upper-lower"],
        description: "More volume, basic split, simple metrics.",
        requiredTargetMetrics: {
            name: "Volume load",
            unit: UnitType.REP,
            description: "Total reps across main movements",
        },
        frequency_per_week: 4,
        required_exercise_ids: [bench.id, pullup.id],
        recommended_exercise_ids: [bench.id, pullup.id, squat.id, plank.id],
    });

    await upsertTemplate({
        templateName: "Fat Loss Conditioning (3x/week)",
        tags: ["fatloss", "conditioning", "cardio"],
        description: "Conditioning focus with simple tracking.",
        requiredTargetMetrics: {
            name: "Weekly conditioning volume",
            unit: UnitType.MIN,
            description: "Total conditioning minutes per week",
        },
        frequency_per_week: 3,
        required_exercise_ids: [run.id],
        recommended_exercise_ids: [run.id, burpees.id, plank.id],
    });

    await upsertTemplate({
        templateName: "Mobility + Recovery (2x/week)",
        tags: ["mobility", "recovery", "easy"],
        description: "Low intensity routine for recovery and consistency.",
        requiredTargetMetrics: {
            name: "Consistency",
            unit: UnitType.NONE,
            description: "Completion rate",
        },
        frequency_per_week: 2,
        required_exercise_ids: [mobility.id],
        recommended_exercise_ids: [mobility.id, plank.id],
    });

    // Optional: create a demo user + project + plan quickly (disabled by default)
    // If you want it, uncomment and pick a templateId from above.

    console.log("Seed complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

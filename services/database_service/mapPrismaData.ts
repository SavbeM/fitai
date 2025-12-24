import {ActivityStatus, ExerciseType, Metric, MetricValue, Prisma} from "@prisma/client";

/// -- Mapper function to convert raw DTOs to Prisma Create/UpdateInput types -- ///

/** Project raw DTOs */
export type RawProjectCreateDTO = {
    title: string;
    description: string;
    userId: string;
};

export type RawProjectUpdateDTO = Partial<{
    id: string;
    title: string;
    description: string;
    userId: string;
}>;

/** User raw DTOs */
export type RawUserCreateDTO = {
    name: string;
    email: string;
};

export type RawUserUpdateDTO = Partial<{
    id: string;
    name: string;
    email: string;
}>;

/** Activity */
export type RawActivityCreateDTO = Partial<{
    exerciseId: string;
    workoutPlanId: string;
    date: Date;
    planned_load: MetricValue[];
}>;

export type RawActivityUpdateDTO = {
    id: string;
    actual_load?: MetricValue[];
    status?: ActivityStatus;
};

/** Workout Plan */
export type RawWorkoutPlanCreateDTO = {
    projectId: string;
    templateId: string;
    activityIds?: string[];
};

export type RawWorkoutPlanUpdateDTO = {
    id: string;
    templateId?: string;
    activityIdsToConnect?: string[];
};

/** ConfigTemplate */
export type RawConfigTemplateCreateDTO = {
    templateName: string;
    tags: string[];
    description?: string;
    requiredTargetMetrics: Metric;
    activityGuidelines: {
        frequency_per_week: number;
        required_exercise_ids: string[];
    };
    recommendedExerciseIds: string[];
};

export type RawConfigTemplateUpdateDTO = Partial<{
    id: string;
    templateName: string;
    tags: string[];
    description?: string | null;
    requiredTargetMetrics: Metric;
    activityGuidelines: {
        frequency_per_week: number;
        required_exercise_ids: string[];
    };
    exerciseIdsToAdd?: string[];
    exerciseIdsToRemove?: string[];
}>;

/** Exercise */
export type RawExerciseCreateDTO = {
    title: string;
    description?: string;
    type: ExerciseType;
    loadMetrics: Metric[];
};

export type RawExerciseUpdateDTO = Partial<{
    id: string;
    title: string;
    description?: string | null;
    type: ExerciseType;
    loadMetrics: Metric[];
}>;

/** Entity-to-Prisma mapping definitions */
type EntityToInputMap = {
    Project: {
        createRaw: RawProjectCreateDTO;
        updateRaw: RawProjectUpdateDTO;
        create: Prisma.ProjectCreateInput;
        update: Prisma.ProjectUpdateInput;
    };
    User: {
        createRaw: RawUserCreateDTO;
        updateRaw: RawUserUpdateDTO;
        create: Prisma.UserCreateInput;
        update: Prisma.UserUpdateInput;
    };
    Activity: {
        createRaw: RawActivityCreateDTO;
        updateRaw: Omit<RawActivityUpdateDTO, "id">;
        create: Prisma.ActivityCreateInput;
        update: Prisma.ActivityUpdateInput;
    };
    WorkoutPlan: {
        createRaw: RawWorkoutPlanCreateDTO;
        updateRaw: Omit<RawWorkoutPlanUpdateDTO, "id">;
        create: Prisma.WorkoutPlanCreateInput;
        update: Prisma.WorkoutPlanUpdateInput;
    };
    ConfigTemplate: {
        createRaw: RawConfigTemplateCreateDTO;
        updateRaw: RawConfigTemplateUpdateDTO;
        create: Prisma.ConfigTemplateCreateInput;
        update: Prisma.ConfigTemplateUpdateInput;
    };
    Exercise: {
        createRaw: RawExerciseCreateDTO;
        updateRaw: RawExerciseUpdateDTO;
        create: Prisma.ExerciseCreateInput;
        update: Prisma.ExerciseUpdateInput;
    };
};

/**
 * Generic mapper used to transform raw DTOs into Prisma-compatible inputs
 * depending on entity type and operation ("create" | "update")
 */
export function mapToPrismaData<
    E extends keyof EntityToInputMap,
    A extends "create" | "update"
>(
    entity: E,
    action: A,
    data: EntityToInputMap[E][`${A}Raw`]
): EntityToInputMap[E][A] {
    switch (entity) {
        case "Project": {
            if (action === "create") {
                const { title, description, userId } = data as RawProjectCreateDTO;
                const prismaData: Prisma.ProjectCreateInput = {
                    title,
                    description,
                    user: { connect: { id: userId } },
                };
                return prismaData as EntityToInputMap[E][A];
            }

            if (action === "update") {
                const { title, description, userId } = data as RawProjectUpdateDTO;
                const prismaData: Prisma.ProjectUpdateInput = {
                    title,
                    description,
                    user: userId ? { connect: { id: userId } } : undefined,
                };
                return prismaData as EntityToInputMap[E][A];
            }

            throw new Error(`Invalid action '${action}' for Project`);
        }

        case "User": {
            if (action === "create") {
                const { name, email } = data as RawUserCreateDTO;
                const prismaData: Prisma.UserCreateInput = { name, email };
                return prismaData as EntityToInputMap[E][A];
            }

            if (action === "update") {
                const { name, email } = data as RawUserUpdateDTO;
                const prismaData: Prisma.UserUpdateInput = {
                    name,
                    email,
                };
                return prismaData as EntityToInputMap[E][A];
            }

            throw new Error(`Invalid action '${action}' for User`);
        }

        case "ConfigTemplate": {
            if (action === "create") {
                const {
                    templateName,
                    tags,
                    description,
                    requiredTargetMetrics,
                    activityGuidelines,
                    recommendedExerciseIds,
                } = data as RawConfigTemplateCreateDTO;

                const prismaData: Prisma.ConfigTemplateCreateInput = {
                    templateName,
                    tags,
                    description,
                    requiredTargetMetrics,
                    activityGuidelines,
                    recommendedExercises: recommendedExerciseIds?.length
                        ? {
                              create: recommendedExerciseIds.map((exerciseId) => ({
                                  exercise: { connect: { id: exerciseId } },
                              })),
                          }
                        : undefined,
                };
                return prismaData as EntityToInputMap[E][A];
            }

            if (action === "update") {
                const {
                    templateName,
                    tags,
                    description,
                    requiredTargetMetrics,
                    activityGuidelines,
                    exerciseIdsToAdd,
                    exerciseIdsToRemove,
                } = data as RawConfigTemplateUpdateDTO;

                const prismaData: Prisma.ConfigTemplateUpdateInput = {
                    templateName,
                    tags,
                    description,
                    requiredTargetMetrics,
                    activityGuidelines,
                    ...(exerciseIdsToAdd?.length || exerciseIdsToRemove?.length
                        ? {
                              recommendedExercises: {
                                  ...(exerciseIdsToAdd?.length
                                      ? {
                                            create: exerciseIdsToAdd.map((exerciseId) => ({
                                                exercise: { connect: { id: exerciseId } },
                                            })),
                                        }
                                      : {}),
                                  ...(exerciseIdsToRemove?.length
                                      ? {
                                            deleteMany: {
                                                exerciseId: { in: exerciseIdsToRemove },
                                            },
                                        }
                                      : {}),
                              },
                          }
                        : {}),
                };
                return prismaData as EntityToInputMap[E][A];
            }

            throw new Error(`Invalid action '${action}' for ConfigTemplate`);
        }

        case "Exercise": {
            if (action === "create") {
                const { title, description, type, loadMetrics } = data as RawExerciseCreateDTO;
                const prismaData: Prisma.ExerciseCreateInput = {
                    title,
                    description,
                    type,
                    loadMetrics,
                };
                return prismaData as EntityToInputMap[E][A];
            }

            if (action === "update") {
                const { title, description, type, loadMetrics } = data as RawExerciseUpdateDTO;
                const prismaData: Prisma.ExerciseUpdateInput = {
                    title,
                    description,
                    type,
                    loadMetrics,
                };
                return prismaData as EntityToInputMap[E][A];
            }

            throw new Error(`Invalid action '${action}' for Exercise`);
        }

        case "Activity": {
            if (action === "create") {
                const { planned_load, workoutPlanId, exerciseId, date } = data as RawActivityCreateDTO;
                const prismaData: Prisma.ActivityCreateInput = {
                    planned_load,
                    actual_load: [],
                    date,
                    workoutPlan: {
                        connect: { id: workoutPlanId },
                    },
                    exercise: {
                        connect: { id: exerciseId },
                    },
                };

                return prismaData as EntityToInputMap[E][A];
            }

            if (action === "update") {
                const { actual_load, status } = data as Omit<RawActivityUpdateDTO, "id">;
                const prismaData: Prisma.ActivityUpdateInput = {
                    actual_load,
                    status,
                };
                return prismaData as EntityToInputMap[E][A];
            }

            throw new Error(`Invalid action '${action}' for Activity`);
        }

        case "WorkoutPlan": {
            if (action === "create") {
                const { projectId, templateId, activityIds } = data as RawWorkoutPlanCreateDTO;

                const prismaData: Prisma.WorkoutPlanCreateInput = {
                    project: { connect: { id: projectId } },
                    configTemplate: { connect: { id: templateId } },
                    activities: activityIds?.length
                        ? { connect: activityIds.map((id) => ({ id })) }
                        : undefined,
                };

                return prismaData as EntityToInputMap[E][A];
            }

            if (action === "update") {
                const { templateId, activityIdsToConnect } =
                    data as Omit<RawWorkoutPlanUpdateDTO, "id">;

                const prismaData: Prisma.WorkoutPlanUpdateInput = {
                    configTemplate: templateId ? { connect: { id: templateId } } : undefined,
                    activities: activityIdsToConnect?.length
                        ? { connect: activityIdsToConnect.map((id) => ({ id })) }
                        : undefined,
                };

                return prismaData as EntityToInputMap[E][A];
            }

            throw new Error(`Invalid action '${action}' for WorkoutPlan`);
        }

        default:
            throw new Error(`Mapper for entity '${entity}' not implemented`);
    }
}

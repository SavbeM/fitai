import {z} from 'zod';
import {EnumActivityDataTypes, EnumTabTypes, EnumViewTemplates} from "@/types/databaseServiceTypes";


export const userSchema = z.object({
    name: z.string()
        .min(3, "Name length must be at least 3 characters")
        .max(15, "Name length must be at most 15 characters")
        .regex(/^[a-zA-Z]+$/, "Name must contain only alphabetic characters"),
    email: z.string().email("Invalid email address").regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Email must be a valid email address"),
});


export const projectSchema = z.object({
    name: z.string()
        .min(3, "Name length must be at least 3 characters")
        .max(15, "Name length must be at most 15 characters")
        .regex(/^[a-zA-Z]+$/, "Name must contain only alphabetic characters"),
    description: z.string().min(10, "Description length must be at least 10 characters"),
    userId: z.string(),
    profile: z.object({
        biometrics: z.record(z.string()),
    }),
    tabs: z.array(z.object({
        title: z.string().min(3, "Title length must be at least 3 characters"),
        type: z.enum(EnumTabTypes),
        algorithms: z.array(z.object({
            viewTemplate: z.enum(EnumViewTemplates),
            calculationAlgorithm: z.string(),
            viewData: z.record(z.string()),
        })),
        workoutPlan: z.object({
            activities: z.array(z.object({
                title: z.string().min(3, "Title length must be at least 3 characters"),
                description: z.string().min(10, "Description length must be at least 10 characters"),
                type: z.enum(EnumActivityDataTypes),
                data: z.object({
                    atomic: z.boolean(),
                    numeric: z.number(),
                    enum: z.string(),
                }),
                date: z.string().refine((val) => !isNaN(Date.parse(val)), {
                    message: "Invalid date format",
                }),
            })),
        }),
    })),
    goal: z.object({
        goalStats: z.record(z.string()),
    }),
});


export const algorithmSchema = z
    .object({
        viewTemplate: z.enum(EnumViewTemplates),
        calculationAlgorithm: z.string(),
        viewData: z
            .object({})
            .strict(),
    })
    .strict();

export const workoutPlanSchema = z
    .object({
        activities: z.array(
            z
                .object({
                    title: z.string(),
                    description: z.string(),
                    type: z.enum(EnumActivityDataTypes),
                    data: z
                        .object({
                            atomic: z.boolean().optional(),
                            numeric: z.number().optional(),
                            enum: z.string().optional(),
                        })
                        .strict(),
                    date: z.string(),
                })
                .strict()
        ),
    })
    .strict();


export const profileBiometricsSchema = z
    .object({
        values: z.array(z.string()),
        types: z.array(z.string()),
    })
    .strict();

export const goalSchema = z
    .object({
        goalStats: z.object({}).strict(),
    })
    .strict();
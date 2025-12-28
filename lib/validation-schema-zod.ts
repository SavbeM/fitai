import {z} from "zod";


export const CreateProjectPayloadSchema = z.object({
    userId: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
});

export const ClientMessageSchema = z.object({
    type: z.literal("create-project"),
    payload: CreateProjectPayloadSchema,
});
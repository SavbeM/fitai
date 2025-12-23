import { Prisma } from "@prisma/client";

export function handlePrismaError(error: unknown): never {
    // Known Prisma request errors (constraint, not found, etc.)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2000":
                throw new Error("Value too long for field");
            case "P2001":
            case "P2025":
                throw new Error("Record not found");
            case "P2002":
                throw new Error("Unique constraint failed");
            case "P2003":
                throw new Error("Foreign key constraint failed");
            case "P2005":
                throw new Error("Invalid value for field type");
            case "P2009":
                throw new Error("Invalid query argument");
            case "P2011":
                throw new Error("Null constraint violation");
            case "P2012":
                throw new Error("Missing required value");
            case "P2014":
                throw new Error("Invalid relation operation");
            default:
                throw new Error(`Prisma error (${error.code}): ${error.message}`);
        }
    }

    // Validation errors (wrong shape, missing fields, etc.)
    if (error instanceof Prisma.PrismaClientValidationError) {
        throw new Error("Validation error");
    }

    // Prisma client init errors (DB down, wrong connection string)
    if (error instanceof Prisma.PrismaClientInitializationError) {
        throw new Error("Database initialization failed");
    }

    // Prisma engine panic (rare, but fatal)
    if (error instanceof Prisma.PrismaClientRustPanicError) {
        throw new Error("Internal Prisma panic");
    }

    // Any other unknown error
    if (error instanceof Error) {
        throw error;
    }

    throw new Error("Unknown error occurred");
}

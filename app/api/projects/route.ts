import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { projectSchema } from '@/validation/zodSchema';
import { databaseService } from '@/services/databaseService';
import {handleServerError} from "@/utils/error_handler";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsedData = projectSchema.parse(body);

        const newProject = await databaseService.createProject(parsedData);
        return NextResponse.json(newProject, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ errors: error.errors }, { status: 400 });
        }
        return handleServerError(error);
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Doesn’t exist or incorrect id' }, { status: 400 });
    }

    try {
        const project = await databaseService.getProjectById(id);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        return NextResponse.json(project);
    } catch (error: unknown) {
        return handleServerError(error);
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Doesn’t exist or incorrect id' }, { status: 400 });
    }

    try {
        await databaseService.deleteProject(id);
        return NextResponse.json({ message: 'Project deleted' }, { status: 200 });
    } catch (error: unknown) {
        return handleServerError(error);
    }
}

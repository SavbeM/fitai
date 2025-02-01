import { NextRequest, NextResponse } from 'next/server';
import { userSchema } from '@/validation/zodSchema';
import { databaseService } from '@/services/databaseService';
import {handleServerError} from "@/utils/error_handler";


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsedData = userSchema.parse(body);

        const newUser = await databaseService.createUser(
            parsedData.name,
            parsedData.email
        );

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
      return  handleServerError(error);
    }
}


export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing or invalid id parameter' }, { status: 400 });
    }

    try {
        const user = await databaseService.getUserById(id);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json(user);
    } catch (error) {
        return handleServerError(error);
    }
}


export async function PUT(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing or invalid id parameter' }, { status: 400 });
    }

    try {
        const body = await req.json();
        const nameSchema = userSchema.pick({ name: true });
        const parsedData = nameSchema.parse(body);

        const updatedUser = await databaseService.updateUser(id, parsedData.name);
        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
        return handleServerError(error);
    }
}


export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing or invalid id parameter' }, { status: 400 });
    }

    try {
        const deletedUser = await databaseService.deleteUser(id);
        return NextResponse.json(deletedUser, { status: 200 });
    } catch (error) {
        return handleServerError(error);
    }
}

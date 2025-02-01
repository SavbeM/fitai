import {NextResponse} from "next/server";

export function handleServerError(error: unknown) {
    let errorDetails: { message?: string; stack?: string } = {};

    if (error instanceof Error) {
        errorDetails = { message: error.message, stack: error.stack || 'No stack available' };
    } else if (typeof error === 'object' && error !== null) {
        errorDetails = { message: JSON.stringify(error) };
    } else {
        errorDetails = { message: String(error) };
    }

    console.error('Server error:', errorDetails);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
}
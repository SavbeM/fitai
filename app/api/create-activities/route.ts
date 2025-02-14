import { NextResponse } from 'next/server';
import { InitProjectService } from '@/services/middleware/initProjectService';

export async function POST(request: Request) {
    try {
        const service = new InitProjectService();
        let result;

        if (request.headers.get('content-type') === 'application/json') {
            const { acceptedActivities, declinedActivities } = await request.json();
            result = await service.createActivities(acceptedActivities, declinedActivities);
        } else {
            result = await service.createActivities();
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Activities successfully created',
                data: result
            },
            { status: 201 }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        console.error('[ActivitiesCreationError]', errorMessage);

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to create activities',
                error: errorMessage
            },
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}
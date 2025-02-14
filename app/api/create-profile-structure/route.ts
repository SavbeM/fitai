import { NextResponse } from 'next/server';
import { InitProjectService } from '@/services/middleware/initProjectService';

export async function GET() {
    try {
        const service = new InitProjectService();
        const structure = await service.createProfileStructure();

        return NextResponse.json(
            {
                success: true,
                data: structure,
            },
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=3600',
                },
            }
        );

    } catch (error) {
        const errorMessage = error instanceof Error
            ? error.message
            : 'Failed to retrieve profile structure';

        console.error('[ProfileStructureFetchError]', errorMessage);

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
            },
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
}
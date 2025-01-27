import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { databaseService } from '@/services/databaseService';
import { CreateProjectArgs } from '@/types/databaseServiceTypes';

const prisma = mockDeep<PrismaClient>();

describe('databaseService.createProject', () => {
    it('should create a project with all related entities', async () => {
        // Мок входных данных
        const args: CreateProjectArgs = {
            userId: 'test-user-id',
            name: 'Test Project',
            description: 'Test Description',
            profile: {
                age: 25,
                weight: 70,
                height: 175,
                activityLevel: 'MEDIUM',
                otherData: { flexibility: true },
            },
            goal: {
                goalData: { targetWeight: 65 },
            },
            tabs: [
                {
                    title: 'Workout',
                    type: 'WORKOUT',
                    algorithms: [
                        {
                            name: 'Algorithm 1',
                            viewTemplate: 'TODO',
                            calculationAlgorithm: 'return x + y;',
                        },
                    ],
                    workoutPlan: undefined,
                    activities: [
                        {
                            title: 'Squats',
                            description: 'Leg workout',
                            type: 'ATOMIC',
                            data: {
                                atomic: true,
                                numeric: null,
                                enum: null,
                            },
                        },
                    ],
                },
            ],
        };

        // Мок результата
        prisma.project.create.mockResolvedValue({
            id: 'test-project-id',
            name: args.name,
            description: args.description,
            userId: args.userId,
            profile: {
                id: 'test-profile-id',
                age: args.profile.age,
                weight: args.profile.weight,
                height: args.profile.height,
                activityLevel: args.profile.activityLevel,
                otherStats: args.profile.otherData,
            },
            projectGoal: {
                id: 'test-goal-id',
                goalStats: args.goal.goalData,
            },
            tabs: [],
        } as any);

        // Вызов метода
        const result = await databaseService.createProject(args);

        // Проверки
        expect(prisma.project.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    name: args.name,
                    description: args.description,
                    userId: args.userId,
                }),
            })
        );
        expect(result).toHaveProperty('id');
        expect(result.name).toBe(args.name);
    });
});

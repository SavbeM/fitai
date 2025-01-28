import {ObjectId} from 'bson';
import {databaseService} from '@/services/databaseService';
import {PrismaClient} from '@prisma/client';
import {CreateProjectInput} from "@/types/databaseServiceTypes";


const prisma = new PrismaClient();

describe('databaseService (User methods)', () => {
    let createdUserId: string;

    afterAll(async () => {
        // Удаление тестового пользователя после тестов
        if (createdUserId) {
            await prisma.user.delete({where: {id: createdUserId}});
        }
    });

    it('should create a user and store it in the database', async () => {
        const name = 'Test User';
        const email = 'testuser@example.com';

        const user = await databaseService.createUser(name, email);

        expect(user).toHaveProperty('id');
        expect(user.name).toBe(name);
        expect(user.email).toBe(email);

        createdUserId = user.id;

        const userInDb = await prisma.user.findUnique({
            where: {id: user.id},
        });

        expect(userInDb).not.toBeNull();
        expect(userInDb?.name).toBe(name);
        expect(userInDb?.email).toBe(email);
    });

    it('should retrieve a user by ID', async () => {
        const user = await databaseService.getUserById(createdUserId);

        expect(user).not.toBeNull();
        expect(user?.id).toBe(createdUserId);
        expect(user?.name).toBe('Test User');
    });

    it('should update a user name', async () => {
        const newName = 'Updated User';

        const updatedUser = await databaseService.updateUser(createdUserId, newName);

        expect(updatedUser).not.toBeNull();
        expect(updatedUser.name).toBe(newName);

        const userInDb = await prisma.user.findUnique({
            where: {id: createdUserId},
        });

        expect(userInDb?.name).toBe(newName);
    });

    it('should delete a user', async () => {
        await databaseService.deleteUser(createdUserId);

        const userInDb = await prisma.user.findUnique({
            where: {id: createdUserId},
        });

        expect(userInDb).toBeNull();

        createdUserId = '';
    });
});

describe('databaseService.createProject', () => {

    it('should create a project and store it in the database', async () => {
        const userId = new ObjectId().toString();

        const args: CreateProjectInput = {
            userId: userId,
            name: 'Test Project',
            description: 'This is a test project',
            profile: {
                biometrics: {height: 180, weight: 75, age: 25},
            },
            tabs: [
                {
                    title: 'Workout Tab',
                    type: 'WORKOUT',
                    algorithms: [
                        {
                            name: 'Algorithm 1',
                            viewTemplate: 'TODO',
                            calculationAlgorithm: 'calcAlgo1',
                            viewAlgorithm: 'viewAlgo1',
                        },
                    ],
                    workoutPlan: {
                        calendar: [
                            {
                                title: 'Activity 1',
                                description: 'Description 1',
                                type: 'ATOMIC',
                                data: {atomic: true},
                            },
                            {
                                title: 'Activity 2',
                                description: 'Description 2',
                                type: 'NUMERIC',
                                data: {numeric: 100},
                            },
                        ],
                    },
                },
            ],
            goal: {
                goalStats: {targetWeight: 70, targetBMI: 22},
            },
        };

        const project = await databaseService.createProject(args);

        expect(project).toHaveProperty('id');
        expect(project.name).toBe(args.name);
        expect(project.description).toBe(args.description);
        expect(project.description).toBe(args.description);
        expect(project.userId).toBe(args.userId);


    });
});
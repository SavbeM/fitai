import { ObjectId } from 'bson';
import { databaseService } from '@/services/databaseService';
import {EnumActivityDataType, PrismaClient} from '@prisma/client';
import { CreateProjectArgs } from '@/types/databaseServiceTypes';

const prisma = new PrismaClient();

describe('databaseService (User methods)', () => {
    let createdUserId: string;

    afterAll(async () => {
        // Удаление тестового пользователя после тестов
        if (createdUserId) {
            await prisma.user.delete({ where: { id: createdUserId } });
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
            where: { id: user.id },
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
            where: { id: createdUserId },
        });

        expect(userInDb?.name).toBe(newName);
    });

    it('should delete a user', async () => {
        await databaseService.deleteUser(createdUserId);

        const userInDb = await prisma.user.findUnique({
            where: { id: createdUserId },
        });

        expect(userInDb).toBeNull();

        createdUserId = ''; // Убедимся, что ID не будет использоваться в `afterAll`
    });
});

describe('databaseService.createProject', () => {
    it('should create a project and store it in the database', async () => {
        const userId = new ObjectId().toString(); // Генерация валидного ObjectId
        const args: CreateProjectArgs = {
            userId,
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
            tabs: [{
                title: 'Test Tab',
                type: 'WORKOUT',
                algorithms: [],
                activities: [
                    {
                        title: 'Test Activity',
                        description: 'Test Description',
                        type: EnumActivityDataType.ATOMIC,
                        data: { atomic: true },
                    },
                ],
            }],
        };

        const result = await databaseService.createProject(args);

        expect(result).toHaveProperty('id');
        expect(result.name).toBe(args.name);
        expect(result.description).toBe(args.description);

        const projectInDb = await prisma.project.findUnique({
            where: { id: result.id },
            include: {
                profile: true,
                projectGoal: true,
            },
        });

        expect(projectInDb).not.toBeNull();
        expect(projectInDb?.name).toBe(args.name);
    });
});

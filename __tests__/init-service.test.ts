import { ProjectBuilder } from '@/services/init_service/projectBuilder';
import { InitProjectService } from '@/services/init_service/initProjectService';
import { databaseService } from '@/services/database_service/databaseService';
import { dbMock } from './dbMock';

jest.mock('@/services/database_service/databaseService');

const mockedDb = jest.mocked(databaseService);

beforeEach(() => {
    mockedDb.createProject.mockResolvedValue(dbMock.project);
    mockedDb.getConfigTemplateById.mockResolvedValue(dbMock.configTemplate);
    mockedDb.createProfile.mockResolvedValue(dbMock.profile);
    mockedDb.createWorkoutPlan.mockResolvedValue(dbMock.workoutPlan);
});

describe('ProjectBuilder', () => {
    it('builds project step by step', async () => {
        const builder = new ProjectBuilder(dbMock.user.id, dbMock.project.title, dbMock.project.description);
        await builder.createProject();
        await builder.useTemplate(dbMock.configTemplate.templateId);
        await builder.generatePlanConfig();
        await builder.createProfile(dbMock.profile.biometrics);
        await builder.createWorkoutPlan();
        const result = builder.build();

        expect(result.project).toEqual(dbMock.project);
        expect(result.template).toEqual(dbMock.configTemplate);
        expect(result.profile).toEqual(dbMock.profile);
        expect(result.workoutPlan).toEqual(dbMock.workoutPlan);
    });
});

describe('InitProjectService', () => {
    it('runs initialization flow', async () => {
        const service = new InitProjectService();
        const result = await service.initProject(
            dbMock.user.id,
            dbMock.project.title,
            dbMock.project.description,
            dbMock.configTemplate.templateId,
            dbMock.profile.biometrics
        );

        expect(result.project).toEqual(dbMock.project);
        expect(mockedDb.createProject).toHaveBeenCalled();
    });
});

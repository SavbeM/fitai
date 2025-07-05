import { InitProjectService } from "@/services/init_service/initProjectService";
import { ProjectBuilder } from "@/services/init_service/projectBuilder";
import { databaseService } from "@/services/database_service/databaseService";
import { dbMock } from "./dbMock";

jest.mock("@/services/database_service/databaseService", () => ({
    databaseService: {
        createProject: jest.fn(),
        createProfile: jest.fn(),
    },
}));

describe('InitProjectService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create project and profile from builder data', async () => {
        const createProjectMock = databaseService.createProject as jest.Mock;
        const createProfileMock = databaseService.createProfile as jest.Mock;

        createProjectMock.mockResolvedValue({ id: dbMock.project.id });
        createProfileMock.mockResolvedValue({ id: dbMock.profile.id });

        const builder = new ProjectBuilder({
            userId: dbMock.user.id,
            title: dbMock.project.title,
            description: dbMock.project.description,
        }).setBiometrics(dbMock.profile.biometrics);

        const service = new InitProjectService();
        const result = await service.initialize(builder);

        expect(createProjectMock).toHaveBeenCalledWith(
            dbMock.user.id,
            dbMock.project.title,
            dbMock.project.description
        );
        expect(createProfileMock).toHaveBeenCalledWith(
            dbMock.project.id,
            dbMock.profile.biometrics,
            {}
        );
        expect(result).toEqual({ projectId: dbMock.project.id, profileId: dbMock.profile.id });
    });
});


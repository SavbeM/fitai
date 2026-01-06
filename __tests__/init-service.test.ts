import { ProjectBuilder } from "@/services/init_service/projectBuilder";
import { StepName } from "@/services/init_service/projectInitTypes";

// Mock databaseService used inside ProjectBuilder
jest.mock("@/services/database_service/databaseService", () => {
  return {
    databaseService: {
      createProject: jest.fn(),
    },
  }
});

// Mock InitProjectService when testing the API route (we don't want DB/Builder there)
jest.mock("@/services/init_service/initProjectService", () => {
  return {
    InitProjectService: jest.fn().mockImplementation(() => ({
      initProject: jest.fn(),
    })),
  };
});

import { databaseService } from "@/services/database_service/databaseService";

describe("init-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ProjectBuilder.createProject", () => {
    it("creates project via databaseService and returns success response", async () => {
      (databaseService.createProject as jest.Mock).mockResolvedValue({
        id: "507f1f77bcf86cd799439011", // valid Mongo ObjectId-like string
        userId: "507f191e810c19729de860ea",
        title: "Test title",
        description: "Test description",
      });

      const builder = new ProjectBuilder({
        userId: "507f191e810c19729de860ea",
        title: "Test title",
        description: "Test description",
      });

      const res = await builder.createProject();

      expect(databaseService.createProject).toHaveBeenCalledTimes(1);
      expect(databaseService.createProject).toHaveBeenCalledWith({
        userId: "507f191e810c19729de860ea",
        title: "Test title",
        description: "Test description",
      });

      expect(res).toEqual(
        expect.objectContaining({
          step: StepName.CREATE_PROJECT,
          success: true,
        })
      );
    });

    it("returns failure response when databaseService throws", async () => {
      (databaseService.createProject as jest.Mock).mockRejectedValue(
        new Error("DB down")
      );

      const builder = new ProjectBuilder({
        userId: "507f191e810c19729de860ea",
        title: "Test title",
        description: "Test description",
      });

      const res = await builder.createProject();

      expect(res.step).toBe(StepName.CREATE_PROJECT);
      expect(res.success).toBe(false);
      expect(res.message).toContain("failed");
    });
  });

});


import { aiService } from "@/services/aiService";
import type {
    AlgorithmInput,
    WorkoutPlanInput,
    ProfileInput,
    GoalInput,
} from "@/types/databaseServiceTypes";

describe("aiService (integration)", () => {
    // Increase timeout for potentially long requests
    jest.setTimeout(20000);

    it("should generate an algorithm", async () => {
        const profile: ProfileInput = {
            biometrics: { height: "180", weight: "75" },
        };
        const goal: GoalInput = {
            goalStats: { target: "lose weight", duration: "3 months" },
        };
        const result: AlgorithmInput = await aiService.generateAlgorithm("TODO", profile, goal);
        console.log("Algorithm =>", result);
        expect(result.viewTemplate).toBe("TODO");
    });

    it("should generate a workout plan", async () => {
        const goal: GoalInput = {
            goalStats: { target: "lose weight", duration: "3 months" },
        };
        const profile: ProfileInput = {
            biometrics: { height: "180", weight: "75" },
        };
        const algorithm: AlgorithmInput = {
            viewTemplate: "TODO",
            calculationAlgorithm: "testAlgorithm",
            viewData: { param: "value" },
        };
        const result: WorkoutPlanInput = await aiService.generateWorkoutPlan(goal, profile, algorithm);
        console.log("WorkoutPlan =>", result);
        expect(Array.isArray(result.activities)).toBe(true);
    });

    it("should generate a profile", async () => {
        const projectDescription = "Test project for weight loss";
        const projectName = "LoseWeight";
        // This might take time, so it's good we increased the timeout
        const result: ProfileInput = await aiService.generateProfile(projectDescription, projectName);
        console.log("Profile =>", result);
        expect(result).toHaveProperty("biometrics");
    });

    it("should generate a goal", async () => {
        const projectName = "TestProject";
        const projectDescription = "A test project to check AI generation logic";
        const profile: ProfileInput = {
            biometrics: { height: "180", weight: "75" },
        };
        const result: GoalInput = await aiService.generateGoal(projectName, projectDescription, profile);
        console.log("Goal =>", result);
        expect(result).toHaveProperty("goalStats");
    });
});

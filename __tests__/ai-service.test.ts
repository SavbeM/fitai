import { aiService } from "@/services/ai_service/aiService";
import {
    ActivityCandidate,
    ProfileBiometricsArray,
    GoalArray,
} from "@/validation/zodSchema";

jest.setTimeout(60000);

describe("Integration tests for aiService", () => {
    test("generateAlgorithm returns valid algorithm", async () => {
        const activities: ActivityCandidate[] = [
            { title: "Swimming", description: "Swim in pool", type: "ATOMIC" },
        ];
        const profile: ProfileBiometricsArray = {
            keys: ["weight", "age"],
            types: ["number", "number"],
            title: ["Weight", "Age"],
            description: ["Weight in kg", "Age in years"],
            values: ["70", "25"],
        };
        const goal: GoalArray = {
            keys: ["targetWeight"],
            types: ["number"],
            values: ["65"],
        };

        const result = await aiService.generateAlgorithm(activities, profile, goal);
        console.log("generateAlgorithm result:", result);
        expect(result).toHaveProperty("calculationAlgorithm");
        expect(result).toHaveProperty("viewTemplate");
    });

    test("generateProfile returns valid profile", async () => {
        const projectDescription = "I want to run 10 km in 30 days";
        const projectName = "Run 10 km";
        const result = await aiService.generateProfile(projectDescription, projectName);
        console.log("generateProfile result:", result);
        // Проверяем, что результат соответствует ожидаемой структуре
        expect(result).toHaveProperty("keys");
        expect(result.keys.length).toBeGreaterThan(0);
    });

    test("generateGoal returns valid goal", async () => {
        const projectName = "Test Project";
        const projectDescription = "Project description for testing";
        const profile: ProfileBiometricsArray = {
            keys: ["weight", "age"],
            types: ["number", "number"],
            title: ["Weight", "Age"],
            description: ["Weight in kg", "Age in years"],
            values: ["70", "25"],
        };

        const result = await aiService.generateGoal(projectName, projectDescription, profile);
        console.log("generateGoal result:", result);
        expect(result).toHaveProperty("keys");
        expect(result.keys.length).toBeGreaterThan(0);
    });

    test("generateActivities returns a list of activities", async () => {
        const goal: GoalArray = {
            keys: ["targetWeight"],
            types: ["number"],
            values: ["65"],
        };
        const profile: ProfileBiometricsArray = {
            keys: ["weight", "age"],
            types: ["number", "number"],
            title: ["Weight", "Age"],
            description: ["Weight in kg", "Age in years"],
            values: ["70", "25"],
        };


        const userChoice = async (activityCandidate: ActivityCandidate): Promise<boolean> => {
            console.log("User choice for activity:", activityCandidate);
            return true;
        };

        const result = await aiService.generateActivities(goal, profile, userChoice);
        console.log("generateActivities result:", result);
        expect(result.activities.length).toBeGreaterThan(0);
    });
});

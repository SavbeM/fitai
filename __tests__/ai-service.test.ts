import {aiService} from "@/services/ai_module/aiService";
import type {
    AlgorithmInput,
    WorkoutPlanInput,
    ProfileInput,
    GoalInput, ActivityInput,
} from "@/services/databaseServiceTypes";
import {ActivityCandidate, AlgorithmAI, GoalArray, ProfileBiometricsArray} from "@/validation/zodSchema";
import {object_generator} from "@/utils/object_generator";
import {runDynamicFunction} from "@/utils/execute_func";

describe("aiService (integration)", () => {
    const profile: ProfileBiometricsArray = {
        keys: ['weight', 'age', 'activityLevel', 'maxBenchPress'],
        types: ['Number', 'Number', 'Enum', 'Number'],
        description: [
            'This helps determine the starting point for weight adjustments needed to reach your goal and ensures safety when increasing weights.',
            'Knowing your age helps tailor the intensity and recovery times in your workout plan to optimize gains and reduce injury risk.',
            'Helps tailor the frequency and intensity of your workouts based on your typical daily and weekly activity levels.',
            'This determines your current capability and helps structure a gradual plan to help achieve your 100 kg bench press goal.'
        ],
        title: ['Weight', 'Age', 'Activity Level', 'Max Bench Press']
    }

    const activities: ActivityCandidate[] = [{
        title: 'Bench Press with Controlled Tempo',
        description: 'Perform a standard bench press but focus on a 3-second lowering phase and explosive upward pushing to increase strength and control.',
        type: 'NUMERIC'
    },
        {
            title: 'Dumbbell Floor Press',
            description: 'Lie on your back with dumbbells held above your chest. Lower them until your arms touch the floor, then press back up to strengthen your triceps and chest.',
            type: 'NUMERIC'
        },
        {
            title: 'Incline Dumbbell Press',
            description: 'Lie on an incline bench with dumbbells in hand. Press them upwards while keeping elbows slightly bent, targeting upper chest and shoulders.',
            type: 'NUMERIC'
        },
        {
            title: 'Spoto Press',
            description: 'Perform a bench press but pause just above your chest, then press back up. This builds strength at your weakest point.',
            type: 'NUMERIC'
        },
        {
            title: 'Tricep Dips',
            description: 'Use parallel bars or a bench to lower and raise your body, targeting your triceps and improving lockout strength for bench press.',
            type: 'NUMERIC'
        },
        {
            title: 'Push-Up Variations',
            description: 'Perform standard push-ups or variations like diamond or wide push-ups to enhance chest and tricep strength without equipment.',
            type: 'NUMERIC'
        },]

    const goal: GoalArray = {keys: ['maxBenchPress'], types: ['Number'], values: ['100']};
    jest.setTimeout(60000);

    it("should generate an algorithm", async () => {

        const profileDefinition = {
            weight: {
                type: 'Number',
                title: 'Weight',
                description: 'This helps determine the starting point for weight adjustments needed to reach your goal and ensures safety when increasing weights.'
            },
            age: {
                type: 'Number',
                title: 'Age',
                description: 'Knowing your age helps tailor the intensity and recovery times in your workout plan to optimize gains and reduce injury risk.'
            },
            activityLevel: {
                type: 'Enum',
                title: 'Activity Level',
                description: 'Helps tailor the frequency and intensity of your workouts based on your typical daily and weekly activity levels.'
            },
            maxBenchPress: {
                type: 'Number',
                title: 'Max Bench Press',
                description: 'This determines your current capability and helps structure a gradual plan to help achieve your 100 kg bench press goal.'
            }
        }

        const goalDefinition = {'maxBenchPress': {type: 'Number', value: '100'}}

        const result: AlgorithmAI = await aiService.generateAlgorithm(activities, profileDefinition, goalDefinition);
        console.log("Algorithm =>", result);
        const evalResult = runDynamicFunction(result.calculationAlgorithm, "generateWorkoutPlan", profileDefinition, goalDefinition, activities);

        console.log("Algorithm =>", evalResult);

    });

    it("should generate a workout plan", async () => {
        const goal: GoalInput = {
            goalStats: {target: "lose weight", duration: "3 months"},
        };
        const profile: ProfileInput = {
            biometrics: {height: "180", weight: "75"},
        };
        const algorithm: AlgorithmInput = {
            viewTemplate: "TODO",
            calculationAlgorithm: "testAlgorithm",
            viewData: {param: "value"},
        };
        const result: WorkoutPlanInput = await aiService.generateWorkoutPlan(goal, profile, algorithm);
        console.log("WorkoutPlan =>", result);
        expect(Array.isArray(result.activities)).toBe(true);
    });

    it("should generate a profile", async () => {
        const projectDescription = "Test project. Хочу пожать 100 кг на грудь";
        const projectName = "Жим лежа";
        const result: ProfileBiometricsArray = await aiService.generateProfile(projectDescription, projectName);
        console.log("Profile =>", result);
        expect(result).toHaveProperty("values");
        expect(result).toHaveProperty("types");
    });

    it("should generate a goal", async () => {
        const projectName = "Branch Press 100 kg";
        const projectDescription = "Test project. Хочу пожать 100 кг на грудь";


        const result: GoalArray = await aiService.generateGoal(projectName, projectDescription, profile);
        const obj = object_generator({profile, goal: result});
        console.log("Goal =>", obj);
    });


    it("should generate activities", async () => {

        const dummyUserChoice = async (activityCandidate: ActivityCandidate): Promise<boolean> => {
            console.log("Candidate activity:", activityCandidate);
            return true;
        };

        const workoutPlan = await aiService.generateActivities(goal, profile, dummyUserChoice);
        console.log("Generated activities:", workoutPlan);

        expect(Array.isArray(workoutPlan.activities)).toBe(true);
        expect(workoutPlan.activities.length).toBe(10);
    });

});

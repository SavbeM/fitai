// --- USER ---
import {
    Activity,
    ActivityConfig,
    ConfigTemplate,
    Profile,
    Project,
    User, WorkoutPlan, WorkoutPlanConfig
} from "@/services/database_service/databaseServiceTypes";

export const testUser: User = {
    id: 'user1',
    name: 'Test User',
    email: 'testuser@example.com',
    projects: [],
};

// --- PROJECT ---
export const testProject: Project = {
    id: 'project1',
    title: 'Fat Loss Journey',
    description: 'Cutting phase 2025',
    userId: testUser.id,
    profile: undefined,
};

// --- PROFILE ---
export const testProfile: Profile = {
    id: 'profile1',
    biometrics: { weight: 92, height: 180, age: 30 },
    targetBiometrics: { weight: 80 },
    projectId: testProject.id,
};

// --- CONFIG TEMPLATE ---
export const testConfigTemplate: ConfigTemplate = {
    templateId: 'basic_weight_loss',
    templateName: 'Basic Weight Loss',
    description: 'For healthy fat loss with minimal muscle loss',
    goalTypes: ['weight_loss'],
    requiredBiometrics: ['weight', 'height', 'age'],
    activityGuidelines: {
        minActivities: 3,
        maxActivities: 6,
        allowedTypes: ['NUMERIC', 'BOOLEAN'],
        activityFields: [
            { name: 'title', type: 'string', required: true },
            { name: 'targetMetric', type: 'number', required: true },
            { name: 'unit', type: 'string', required: false }
        ],
        constraints: { targetMetric: { min: 10, max: 120 } },
        mustInclude: ['Cardio', 'Strength'],
        frequencyPattern: 'each activity twice per week',
    },
    adaptationRules: {
        onSkip: 'reduceTargetBy10%',
        onComplete: 'increaseTargetBy5%',
    },
    aiPromptTemplate: 'Generate up to {maxActivities} weight loss activities...',
    meta: { author: 'TestBot', version: 'v1.0' }
};

// --- ACTIVITY CONFIG (for plan config) ---
export const testActivityConfig: ActivityConfig = {
    title: 'Cardio',
    type: 'NUMERIC',
    targetMetric: 30,
    unit: 'minutes',
    order: 1,
    adaptationRule: { onSkip: 'reduceTargetBy10%', onComplete: 'increaseTargetBy5%' }
};

// --- WORKOUT PLAN CONFIG ---
export const testWorkoutPlanConfig: WorkoutPlanConfig = {
    configId: 'config1',
    templateId: testConfigTemplate.templateId,
    projectId: testProject.id,
    biometrics: { weight: 92, height: 180, age: 30 },
    goal: 'weight_loss',
    activities: [testActivityConfig],
    adaptationRules: { onSkip: 'reduceTargetBy10%', onComplete: 'increaseTargetBy5%' },
    createdAt: new Date().toISOString(),
    meta: { author: 'TestBot', version: 'v1.0' },
};

// --- ACTIVITY (db entity) ---
export const testActivity: Activity = {
    id: 'activity1',
    workoutPlanId: 'workoutplan1',
    date: new Date().toISOString(),
    title: 'Cardio',
    type: 'NUMERIC',
    targetMetric: 30,
    completedMetric: 32,
    unit: 'minutes',
    order: 1,
    adaptationRule: { onSkip: 'reduceTargetBy10%', onComplete: 'increaseTargetBy5%' }
};

// --- WORKOUT PLAN (db entity) ---
export const testWorkoutPlan: WorkoutPlan = {
    id: 'workoutplan1',
    projectId: testProject.id,
    project: testProject,
    configTemplateId: testConfigTemplate.templateId,
    generatedFromConfig: testWorkoutPlanConfig.configId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activities: [testActivity]
};

// --- EXPORT ALL IN ONE ---
export const dbMock = {
    user: testUser,
    project: testProject,
    profile: testProfile,
    goal: testGoal,
    configTemplate: testConfigTemplate,
    workoutPlanConfig: testWorkoutPlanConfig,
    activity: testActivity,
    workoutPlan: testWorkoutPlan,
    activityConfig: testActivityConfig,
};

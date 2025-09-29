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
    id: new Date().toISOString(),
    name: 'Mark Selikhov',
    email: 'testuser@example.com',
    projects: [],
};

// --- PROJECT ---
export const testProject: Project = {
    id: new Date().toISOString(),
    title: 'Run a marathon',
    description: 'Run a marathon 40 km',
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
    id: 'basic_running_template',
    templateName: 'Basic Running Plan',
    description: 'Running-focused plan for weight loss',
    goalTypes: ['weight_loss', 'stamina'],
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
    aiPromptTemplate: 'Generate up to {maxActivities} running weight loss activities...',
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
    id: 'config1',
    templateId: testConfigTemplate.id,
    projectId: testProject.id,
    biometrics: { weight: 92, height: 180, age: 30 },
    goals: ['weight_loss'],
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
    configTemplateId: testConfigTemplate.id,
    generatedFromConfig: testWorkoutPlanConfig.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    activities: [testActivity]
};

// --- EXPORT ALL IN ONE ---
export const dbMock = {
    user: testUser,
    project: testProject,
    profile: testProfile,
    configTemplate: testConfigTemplate,
    workoutPlanConfig: testWorkoutPlanConfig,
    activity: testActivity,
    workoutPlan: testWorkoutPlan,
    activityConfig: testActivityConfig,
};

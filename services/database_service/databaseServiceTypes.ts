// ----------- ActivityConfig -----------
// Structure for each planned activity inside WorkoutPlanConfig.
// Not a DB entity. Used for config and plan generation.
export interface ActivityConfig {
    title: string; // Activity title
    description?: string; // Optional detailed description
    type: "NUMERIC" | "BOOLEAN"; // Input type: Numeric (e.g., reps) or Boolean (completed or not)
    targetMetric: number | boolean; // Goal value for the activity
    unit?: string; // Unit of measurement ("kg", "reps", etc.)
    adaptationRule?: { // Adaptation logic for this activity (applied at runtime)
        onSkip?: string; // Rule if user skips activity
        onComplete?: string; // Rule if activity is completed
    };
    order: number; // Order in workout day/plan
}

// ----------- WorkoutPlanConfig -----------
// Filled configuration instance for a specific project.
// Used as the basis for WorkoutPlan generation. Stores all config parameters and generated activities.
export interface WorkoutPlanConfig {
    id: string; // Unique config instance ID
    templateId: string; // Reference to ConfigTemplate.id
    projectId: string; // Project this config belongs to
    biometrics: { [field: string]: string | number }; // User biometric data at config generation
    goals: string[]; // Target goals for this plan
    activities: ActivityConfig[]; // Generated activity configs
    adaptationRules: { // Plan-level adaptation logic (from template)
        onSkip?: string;
        onComplete?: string;
    };
    createdAt: string; // ISO date string
    meta?: { [key: string]: unknown }; // Versioning/audit metadata (optional)
}

// ----------- ConfigTemplate -----------
// Developer/admin-defined template for WorkoutPlanConfig/plan generation.
// Specifies structure, allowed values, rules, and boundaries for safe AI-based plan creation.
export interface ConfigTemplate {
    id: string; // Unique template identifier
    templateName: string; // Human-readable template name
    description: string; // Template purpose/description
    goalTypes: string[]; // Supported fitness goals (e.g., "muscle_gain")
    requiredBiometrics: string[]; // Required biometric fields (e.g., "weight")
    activityGuidelines: { // Structural rules for generated activities
        minActivities: number; // Min # of activities per plan
        maxActivities: number; // Max # of activities per plan
        allowedTypes: Array<"NUMERIC" | "BOOLEAN">; // Allowed types of input
        activityFields: Array<{ // Activity field schema (matches structure of ActivityConfig)
            name: string;
            type: "string" | "number" | "enum";
            required: boolean;
            enum?: string[];
        }>;
        constraints?: { // Min/max constraints for specific fields
            [fieldName: string]: {
                min?: number;
                max?: number;
            };
        };
        mustInclude?: string[]; // Required activity titles
        frequencyPattern?: string; // Frequency guideline (e.g., "each activity once per week")
    };
    adaptationRules: { // Plan-level adaptation rules
        onSkip?: string;
        onComplete?: string;
    };
    aiPromptTemplate?: string; // AI prompt string (slots for dynamic content)
    meta?: { // Metadata: author, version, etc. (optional)
        author?: string;
        version?: string;
        [key: string]: any;
    };
}

// ----------- Activity -----------
// Physical activity scheduled in WorkoutPlan.
// Generated based on ActivityConfig and matches its structure.
export interface Activity {
    id: string; // Unique activity ID
    workoutPlanId: string; // Linked WorkoutPlan
    date: string; // Scheduled date (ISO string)
    title: string; // Short activity name
    description?: string; // Optional long description
    type: "NUMERIC" | "BOOLEAN"; // Input type
    targetMetric?: number | boolean; // Planned value
    completedMetric?: number | boolean; // User input/result
    unit?: string; // Measurement unit (optional)
    adaptationRule?: { // Runtime adaptation logic
        onSkip?: string;
        onComplete?: string;
    };
    order: number; // Order in the day/plan
}

// ----------- WorkoutPlan -----------
// Actual user workout plan, generated from config & template.
// Activities must strictly match the config structure.
export interface WorkoutPlan {
    id: string; // Unique plan ID
    projectId: string; // Linked project
    project: Project;
    configTemplateId: string; // Source template
    generatedFromConfig: string; // Source WorkoutPlanConfig
    createdAt: string; // Plan creation date (ISO)
    updatedAt: string; // Plan update date (ISO)
    activities: Activity[]; // All generated activities
}

// ----------- Profile -----------
// User biometrics at project creation.
export interface Profile {
    id: string; // Unique profile ID
    biometrics: { [key: string]: number | string }; // User biometric data
    targetBiometrics: { [key: string]: number | string }; // Target values for each biometric
    projectId: string; // Linked project
}

// ----------- Project -----------
// Fitness project owned by user; links to all generated data.
export interface Project {
    id: string; // Unique project ID
    title: string; // Project name
    description: string; // Project description
    userId: string; // Project owner
    profile?: Profile; // 1:1 relation with Profile
    workoutPlan?: WorkoutPlan; // 1:1 relation with WorkoutPlan
}

// ----------- User -----------
// User account; has list of all projects.
export interface User {
    id: string; // Unique user ID
    name: string; // Username
    email: string; // Email address
    projects?: Project[]; // All owned projects (optional)
}

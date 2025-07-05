import {databaseService} from '@/services/database_service/databaseService';
import type {
    ActivityInput,
    BiometricsData,
    CreateProjectInput,
    EnumViewTemplate,
    GoalData,
    TabInput,
    WorkoutPlanInput
} from '@/services/database_service/databaseServiceTypes';
import {Project, User} from '@prisma/client';
import {aiService} from '@/services/ai_service/aiService';
import {runDynamicFunction} from "@/utils/execute_func";
import {ActivityCandidate, GoalArray, biometricsArray} from "@/validation/zodSchema";
import {generateGoalDefinition, generateProfileDefinition} from "@/utils/object_generator";
import {BuildProject} from "@/services/init_service/projectInitTypes";


export class ProjectBuilder {
    private user: User | null = null;
    private project: BuildProject | null = null;
    private tabs: TabInput[] = [];
    private goalArray: GoalArray | null = null;
    private workoutPlan: WorkoutPlanInput | null = null;
    private activities: ActivityCandidate[] = [];
    private biometricsArray: biometricsArray | null = null;
    private goal: GoalData | null = null;
    private biometrics: BiometricsData | null = null;

    public async buildUser(id: string | undefined, name: string, email: string): Promise<this> {
        if (id) {
            this.user = await databaseService.getUserById(id);
        }
        if (!this.user) {
            this.user = await databaseService.createUser(name, email);
        }
        return this;
    }

    public async buildProject(projectData: Omit<BuildProject, 'userId'>): Promise<this> {
        if (!this.user) {
            throw new Error('User must be built before creating a project.');
        }
        this.project = {
            ...projectData,
            userId: this.user.id,
        };
        return this;
    }

    public async addTab(tabData: Omit<TabInput, "workoutPlan">): Promise<this> {
        if (!this.project || !this.workoutPlan) {
            throw new Error('Project must be built before adding tabs.');
        }

        const newTab = {
            ...tabData,
            workoutPlan: this.workoutPlan,
        }

        this.tabs.push(newTab);
        return this;
    }

public async createActivities(acceptedActivities?: ActivityCandidate[], declinedActivities?: ActivityCandidate[]): Promise<ActivityCandidate[]> {
  if (!this.project) {
            throw new Error('Project must be built before creating activities.');
        }
        if (!this.biometricsArray || !this.goalArray) {
            throw new Error('Profile and goal must be added before creating activities.');
        }


        return await aiService.generateActivities(this.goalArray, this.biometricsArray, acceptedActivities, declinedActivities);
    }

    public addActivities(acceptedActivities: ActivityCandidate[]): this {
        if (!this.project) {
            throw new Error('Project must be built before adding activities.');
        }
        if (!this.biometricsArray || !this.goalArray) {
            throw new Error('Profile and goal must be added before adding activities.');
        }
        if (!acceptedActivities.length) {
            throw new Error('At least one activity must be accepted.');
        }

        this.activities = [...acceptedActivities];
        return this;
    }

    public async addWorkoutPlan(viewTemplate: EnumViewTemplate): Promise<this> {
        if (!this.biometricsArray || !this.goalArray  || !this.activities.length) {
            throw new Error('Project must be built before adding workout plan.');
        }

        const algo = await aiService.generateAlgorithm(this.activities, this.biometricsArray, this.goalArray );
        const generatedWorkoutPlan: {activities: ActivityInput[]} = runDynamicFunction(algo.calculationAlgorithm, "generateWorkoutPlan", this.biometrics, this.goal, this.activities);

        this.workoutPlan = {
            activities: generatedWorkoutPlan.activities,
            algorithm: algo,
            viewTemplate: viewTemplate,
        }
        return this;
    }

    public async createProfileStructure(): Promise<BiometricsData> {
        if (!this.project || !this.project.name || !this.project.description) {
            throw new Error('Project must be built before creating profile structure.');
        }

        this.biometricsArray = await aiService.generateProfile(this.project.description, this.project.name);
        this.biometrics = generateProfileDefinition(this.biometrics);

        return this.biometrics;
    }

public  addBiometricsData(biometricsData: BiometricsData): this {
        if (!this.project) {
            throw new Error('Project must be built before adding profile.');
        }
        if (!this.biometricsArray) {
            throw new Error('Profile structure must be created before adding profile.');
        }
        if(!biometricsData) {
            throw new Error('Biometrics data must be provided.');
        }

        this.biometrics = biometricsData;

        return this;
    }


    public async addGoal(): Promise<this> {
        if (!this.project) {
            throw new Error('Project must be built before adding goal.');
        }
        if (!this.biometricsArray) {
            throw new Error('Profile must be added before adding goal.');
        }


        this.goalArray = await aiService.generateGoal(this.project.name, this.project.description, this.biometricsArray);

        if(!this.goalArray.keys.length || !this.goalArray.types.length || !this.goalArray.values.length) {
            throw new Error("Goal generation error")
        }

        this.goal = generateGoalDefinition(this.goalArray);

        return this;

    }


    public async build(): Promise<Project> {
        if (!this.project || !this.user || !this.biometrics || !this.goal || !this.workoutPlan) {
            throw new Error('All components must be built before finalizing the project.');
        }


        const projectInput: CreateProjectInput = {
            ...this.project,
            profile: {
                biometrics: this.biometrics,
            },
            tabs: this.tabs,
            goal: {
                goalStats: this.goal,
            },
        }

        return await databaseService.createProject(projectInput);
    }
}

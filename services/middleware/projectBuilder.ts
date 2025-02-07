import {databaseService} from '@/services/databaseService';
import type {
    ActivityInput,
    CreateProjectInput,
    EnumViewTemplate,
    TabInput,
    WorkoutPlanInput
} from '@/types/databaseServiceTypes';
import {Project, User} from '@prisma/client';
import {aiService} from '@/services/ai_module/aiService';
import {runDynamicFunction} from "@/utils/execute_func";
import {ActivityCandidate, GoalArray, ProfileBiometricsArray} from "@/validation/zodSchema";
import {object_generator} from "@/utils/object_generator";


export interface BuildProject {
    name: string
    description: string
    userId: string
}

export class ProjectBuilder {
    private user: User | null = null;
    private project: BuildProject | null = null;
    private tabs: TabInput[] = [];
    private goal: GoalArray | null = null;
    private workoutPlan: WorkoutPlanInput | null = null;
    private activities: ActivityCandidate[] = [];
    private profile: ProfileBiometricsArray | null = null;

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

    public async addActivities(userChoice: (activityCandidate: ActivityCandidate) => Promise<boolean>): Promise<this> {
        if (!this.project) {
            throw new Error('Project must be built before adding activities.');
        }
        if (!this.profile || !this.goal) {
            throw new Error('Profile and goal must be added before adding activities.');
        }
        //Я конченный долбаеб
        const result = await aiService.generateActivities(this.goal, this.profile, userChoice);
        this.activities = result.activities;
        return this;
    }

    public async addWorkoutPlan(viewTemplate: EnumViewTemplate): Promise<this> {
        if (!this.project || !this.goal || !this.profile || !this.activities.length) {
            throw new Error('Project must be built before adding workout plan.');
        }

        const algo = await aiService.generateAlgorithm(this.activities, this.goal, this.profile);
        const generatedWorkoutPlan: {activities: ActivityInput[]} = runDynamicFunction(algo.calculationAlgorithm, "generateWorkoutPlan", this.profile, this.goal, this.activities);

        this.workoutPlan = {
            activities: generatedWorkoutPlan.activities,
            algorithm: algo,
            viewTemplate: viewTemplate,
        }
        return this;
    }

    public async addProfile(): Promise<this> {
        if (!this.project) {
            throw new Error('Project must be built before adding profile.');
        }
        const result = await aiService.generateProfile(this.project.description, this.project.name);

        if (!result.keys.length || !result.title || !result.types.length || !result.description ) {
            throw new Error('Profile generation failed.');
        }

        this.profile = result;

        return this;
    }


    public async addGoal(): Promise<this> {
        if (!this.project) {
            throw new Error('Project must be built before adding goal.');
        }
        if (!this.profile) {
            throw new Error('Profile must be added before adding goal.');
        }


        const result = await aiService.generateGoal(this.project.name, this.project.description, this.profile);

        if(!result.keys.length || !result.types.length || !result.values.length) {
            throw new Error("Goal generation error")
        }

        this.goal = result;

        return this;

    }


    public async build(): Promise<Project> {
        if (!this.project || !this.user || !this.profile || !this.goal || !this.workoutPlan) {
            throw new Error('All components must be built before finalizing the project.');
        }

        console.log("Profile =>", this.profile);
        console.log("Goal =>", this.goal);

        const formattedData = object_generator({profile: this.profile, goal: this.goal});

        console.log("Formatted data =>", formattedData);

        const projectInput: CreateProjectInput = {
            ...this.project,
            profile: {
                biometrics: formattedData.profileDefinition,
            },
            tabs: this.tabs,
            goal: {
                goalStats: formattedData.goalDefinition,
            },
        }

        return await databaseService.createProject(projectInput);
    }
}

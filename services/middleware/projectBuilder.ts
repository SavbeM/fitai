import {databaseService} from '@/services/databaseService';
import type {
    ActivityInput,
    CreateProjectInput,
    EnumViewTemplate,
    TabInput,
    WorkoutPlanInput
} from '@/services/databaseServiceTypes';
import {Project, User} from '@prisma/client';
import {aiService} from '@/services/ai_module/aiService';
import {runDynamicFunction} from "@/utils/execute_func";
import {ActivityCandidate, GoalArray, ProfileBiometricsArray} from "@/validation/zodSchema";
import {generateGoalDefinition, generateProfileDefinition} from "@/utils/object_generator";
import {ObjectGeneratorReturnType} from "@/utils/utilsTypes";
import {BuildProject} from "@/services/middleware/projectInitTypes";


export class ProjectBuilder {
    private user: User | null = null;
    private project: BuildProject | null = null;
    private tabs: TabInput[] = [];
    private goalArray: GoalArray | null = null;
    private workoutPlan: WorkoutPlanInput | null = null;
    private activities: ActivityCandidate[] = [];
    private profileBiometricsArray: ProfileBiometricsArray | null = null;
    private goal: ObjectGeneratorReturnType | null = null;
    private profile: ObjectGeneratorReturnType | null = null;

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
        if (!this.profileBiometricsArray || !this.goalArray) {
            throw new Error('Profile and goal must be added before adding activities.');
        }

        const result = await aiService.generateActivities(this.goalArray, this.profileBiometricsArray, userChoice);
        this.activities = result.activities;
        return this;
    }

    public async addWorkoutPlan(viewTemplate: EnumViewTemplate): Promise<this> {
        if (!this.profileBiometricsArray || !this.goalArray  || !this.activities.length) {
            throw new Error('Project must be built before adding workout plan.');
        }

        const algo = await aiService.generateAlgorithm(this.activities, this.profileBiometricsArray, this.goalArray );
        const generatedWorkoutPlan: {activities: ActivityInput[]} = runDynamicFunction(algo.calculationAlgorithm, "generateWorkoutPlan", this.profile, this.goal, this.activities);

        this.workoutPlan = {
            activities: generatedWorkoutPlan.activities,
            algorithm: algo,
            viewTemplate: viewTemplate,
        }
        return this;
    }

public async addProfile(fillProfile: (emptyProfile: ProfileBiometricsArray) => Promise<ProfileBiometricsArray>): Promise<this> {
        if (!this.project) {
            throw new Error('Project must be built before adding profile.');
        }

         this.profileBiometricsArray = await aiService.generateProfile(this.project.description, this.project.name);

        if (!this.profileBiometricsArray || !this.profileBiometricsArray.keys.length || !this.profileBiometricsArray.types.length || !this.profileBiometricsArray.title.length || !this.profileBiometricsArray.description.length) {
            throw new Error('Profile generation failed.');
        }


        this.profileBiometricsArray = await fillProfile(this.profileBiometricsArray);

        this.profile = generateProfileDefinition(this.profileBiometricsArray);

        return this;
    }


    public async addGoal(): Promise<this> {
        if (!this.project) {
            throw new Error('Project must be built before adding goal.');
        }
        if (!this.profileBiometricsArray) {
            throw new Error('Profile must be added before adding goal.');
        }


        this.goalArray = await aiService.generateGoal(this.project.name, this.project.description, this.profileBiometricsArray);

        if(!this.goalArray.keys.length || !this.goalArray.types.length || !this.goalArray.values.length) {
            throw new Error("Goal generation error")
        }

        this.goal = generateGoalDefinition(this.goalArray);

        return this;

    }


    public async build(): Promise<Project> {
        if (!this.project || !this.user || !this.profile || !this.goal || !this.workoutPlan) {
            throw new Error('All components must be built before finalizing the project.');
        }


        const projectInput: CreateProjectInput = {
            ...this.project,
            profile: {
                biometrics: this.profile,
            },
            tabs: this.tabs,
            goal: {
                goalStats: this.goal,
            },
        }

        return await databaseService.createProject(projectInput);
    }
}

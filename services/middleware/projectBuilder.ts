import { databaseService } from '@/services/databaseService';
import type {
    CreateProjectInput,
    EnumViewTemplate, GoalInput, ProfileInput,
    TabInput
} from '@/types/databaseServiceTypes';
import { Activity, Goal, Profile, Project, Tab, User, WorkoutPlan } from '@prisma/client';
import { aiService } from '@/services/aiService';


/**
 * Класс, отвечающий за пошаговое создание агрегата "Проект"
 */
export class ProjectBuilder {
    private _user: User | null = null;
    private _project: Project | null = null;
    private _tabs: Tab[] = [];
    private _goal: Goal | null = null;
    private _algorithms: Algorithm[] = [];
    private _workoutPlan: WorkoutPlan | null = null;
    private _activities: Activity[] = [];
    private _profile: Profile | null = null;

    /**
     * Создает или получает пользователя.
     */
    public async buildUser(id: string | undefined, name: string, email?: string): Promise<this> {
        if (id) {
            this._user = await databaseService.getUserById(id);
        }
        if (!this._user) {
            this._user = await databaseService.createUser(name, email);
        }
        return this;
    }

    /**
     * Создает проект, привязывая его к уже созданному пользователю.
     * @param projectData Данные проекта (без поля userId)
     */
    public async buildProject(projectData: Omit<CreateProjectInput, 'userId'>): Promise<this> {
        if (!this._user) {
            throw new Error('User must be initialized before building project.');
        }
        const projectInput: CreateProjectInput = {
            ...projectData,
            userId: this._user.id,
        };

        this._project = await databaseService.createProject(projectInput);
        return this;
    }

    /**
     * Добавляет таб к созданному проекту.
     * Если в tabData отсутствуют алгоритмы или workoutPlan, они будут сгенерированы через AI.
     * @param tabData Данные таба
     */
    public async addTab(tabData: TabInput): Promise<this> {
        if (!this._project) {
            throw new Error('Project must be built before adding tabs.');
        }

        if (!tabData.algorithms || tabData.algorithms.length === 0) {
            const generatedAlgorithm = await aiService.generateAlgorithm("TODO", this._profile, this._goal);
            tabData.algorithms = [generatedAlgorithm];
        }

        if (!tabData.workoutPlan) {
            const generatedWorkoutPlan = await aiService.generateWorkoutPlan();
            tabData.workoutPlan = generatedWorkoutPlan;
        }
        const newTab = await databaseService.addTab(this._project.id, tabData);
        this._tabs.push(newTab);
        return this;
    }

    /**
     * Генерирует и добавляет план тренировок к проекту через AI.
     */
    public async addWorkoutPlan(): Promise<this> {
        if (!this._project || !this._goal || !this._profile) {
            throw new Error('Project must be built before adding workout plan.');
        }
        const generatedWorkoutPlan  = await aiService.generateWorkoutPlan({gaol: this._goal,profile: this._profile,algorithm: this._algorithms[0]});
        const newWorkoutPlan  = await databaseService.addWorkoutPlan(this._project.id, generatedWorkoutPlan);
        this._workoutPlan = newWorkoutPlan;
        return this;
    }

    /**
     * Генерирует и добавляет активность в план тренировок через AI.
     */
    public async addActivity(): Promise<this> {
        if (!this._workoutPlan) {
            throw new Error('WorkoutPlan must be built before adding activities.');
        }
        const generatedActivity = await aiService.generateActivity();
        const newActivity = await databaseService.addActivity(this._workoutPlan.id, generatedActivity);
        this._activities.push(newActivity);
        return this;
    }

    /**
     * Генерирует и добавляет профиль к проекту через AI.
     */
    public async addProfile(profile: ProfileInput): Promise<this> {
        if (!this._project) {
            throw new Error('Project must be built before adding profile.');
        }

        const newProfile = await databaseService.createProfileForProject(this._project.id, profile.biometrics);
        this._profile = newProfile;
        return this;
    }

    /**
     * Генерирует и добавляет цель к проекту через AI.
     * @param projectName Название проекта
     * @param projectDescription Описание проекта
     */
    public async addGoal(projectName: string, projectDescription: string): Promise<this> {
        if (!this._project) {
            throw new Error('Project must be built before adding goal.');
        }
        if (!this._profile) {
            throw new Error('Profile must be added before adding goal.');
        }
        const generatedGoal = await aiService.generateGoal(projectName, projectDescription, this._profile);
        this._goal = generatedGoal;
        return this;
    }

    /**
     * Генерирует и добавляет алгоритм к первому табу проекта через AI.
     * @param viewTemplate Один из шаблонов EnumViewTemplate
     */
    public async addAlgorithm(viewTemplate: EnumViewTemplate): Promise<this> {
        if (this._tabs.length === 0) {
            throw new Error('At least one tab must be added before adding algorithm.');
        }
        const tabId = this._tabs[0].id;
        const generatedAlgorithm = await aiService.generateAlgorithm(viewTemplate, this._profile, this._goal);
        const newAlgorithm = await databaseService.addAlgorithm(tabId, generatedAlgorithm);
        this._algorithms.push(newAlgorithm);
        return this;
    }

    /**
     * Возвращает агрегированный результат сборки проекта.
     */
    public build(): { user: User; project: Project; tabs: Tab[]; goal: Goal;  } {
        if (!this._user || !this._project || this._tabs.length === 0 || !this._goal) {
            throw new Error('Incomplete project build: missing user, project or tabs.');
        }
        return {
            user: this._user,
            project: this._project,
            tabs: this._tabs,
            goal: this._goal,
        };
    }
}

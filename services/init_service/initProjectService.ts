import {InitProjectParams} from "@/services/init_service/projectInitTypes";
import {ProjectBuilder} from "@/services/init_service/projectBuilder";
import {ActivityCandidate} from "@/validation/zodSchema";
import {BiometricsData} from "@/services/database_service/databaseServiceTypes";


export class InitProjectService {
    builder: ProjectBuilder;
    constructor() {
        this.builder = new ProjectBuilder();
    }

    public async createProfileStructure() {
        return await this.builder.createProfileStructure();
    }

    public async createActivities(acceptedActivities?: ActivityCandidate[], declinedActivities?: ActivityCandidate[]) {
        return  await this.builder.createActivities(acceptedActivities, declinedActivities);

    }

    public async addProfile(biometricsData: BiometricsData) {
        return this.builder.addBiometricsData(biometricsData);
    }

    public async createProject(params: InitProjectParams) {
        await this.builder.buildUser(params.user.id, params.user.name, params.user.email);

        await this.builder.buildProject(params.project);

        await this.builder.addGoal();
    }

    public async initializeNewProject(params: InitProjectParams) {
        await this.builder.addWorkoutPlan(params.viewTemplate);

        await this.builder.addTab(params.initialTab.tabData);

        return await this.builder.build();
    }
}

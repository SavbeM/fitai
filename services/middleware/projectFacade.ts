import {InitProjectParams} from "@/services/middleware/projectInitTypes";
import {ProjectBuilder} from "@/services/middleware/projectBuilder";


export class InitProjectService {
    public async initializeNewProject(params: InitProjectParams) {
        const builder = new ProjectBuilder();

        await builder.buildUser(params.user.id, params.user.name, params.user.email);

        await builder.buildProject(params.project);

        await builder.addProfile(params.fillProfile);

        await builder.addGoal();

        await builder.addActivities(params.userChoice);

        await builder.addWorkoutPlan(params.viewTemplate);

        await builder.addTab(params.initialTab.tabData);

        return await builder.build();
    }
}

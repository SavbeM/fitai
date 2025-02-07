import type { EnumTabType, EnumViewTemplate, TabInput} from '@/types/databaseServiceTypes';
import {BuildProject, ProjectBuilder} from "@/services/middleware/projectBuilder";
import {ActivityCandidate} from "@/validation/zodSchema";


export interface InitProjectParams {
    user: {
        id?: string;
        name: string;
        email: string;
    };
project: Omit<BuildProject, "userId">;
    initialTab: {
        type: EnumTabType;
        tabData: TabInput;
    };
    viewTemplate: EnumViewTemplate;
    userChoice: (activityCandidate: ActivityCandidate) => Promise<boolean>;
}

export class InitProjectService {
    public async initializeNewProject(params: InitProjectParams) {
        const builder = new ProjectBuilder();

        await builder.buildUser(params.user.id, params.user.name, params.user.email);

        await builder.buildProject(params.project);

        await builder.addProfile();

        await builder.addGoal();

        await builder.addActivities(params.userChoice);

        await builder.addWorkoutPlan(params.viewTemplate);

        await builder.addTab(params.initialTab.tabData);

        return await builder.build();
    }
}

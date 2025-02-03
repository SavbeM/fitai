import type { CreateProjectInput, EnumTabType, TabInput } from '@/types/databaseServiceTypes';
import {ProjectBuilder} from "@/services/middleware/projectBuilder";


export interface InitProjectParams {
    user: {
        id?: string;
        name: string;
        email?: string;
    };
    project: Omit<CreateProjectInput, 'userId'>;
    initialTab: {
        type: EnumTabType;
        tabData: TabInput;
    };
}

export class InitProjectService {
    public async initializeNewProject(params: InitProjectParams) {
        const builder = new ProjectBuilder();

        await builder.buildUser(params.user.id, params.user.name, params.user.email);

        await builder.buildProject(params.project);

        await builder.addProfile(params.project.profile);

        await builder.addGoal(params.project.name, params.project.description);

        await builder.addTab(params.initialTab.tabData);

        await builder.addAlgorithm("TODO");

        await builder.addWorkoutPlan();


        return { ...builder.build() };
    }
}

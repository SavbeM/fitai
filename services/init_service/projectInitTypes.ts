import type {EnumTabType, EnumViewTemplate, TabInput} from "@/services/database_service/databaseServiceTypes";


export interface BuildProject {
    name: string
    description: string
    userId: string
}

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
}
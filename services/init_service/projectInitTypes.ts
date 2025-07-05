export interface ProjectBuilderParams {
    userId: string;
    title: string;
    description: string;
}

import { ConfigTemplate, ActivityConfig } from "@/services/database_service/databaseServiceTypes";

export interface ProjectBuildData extends ProjectBuilderParams {
    template?: ConfigTemplate;
    biometrics?: Record<string, string | number>;
    goal?: string;
    activities?: ActivityConfig[];
}

export interface InitResult {
    projectId: string;
    profileId?: string;
    // Additional fields may be added later
}

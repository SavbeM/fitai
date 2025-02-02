import { aiService } from '@/services/aiService';
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

        // 1. Создаем или получаем пользователя
        await builder.buildUser(params.user.id, params.user.name, params.user.email);

        // 2. Создаем проект
        await builder.buildProject(params.project);

        // 3. Добавляем начальный таб (например, типа WORKOUT)
        await builder.addTab(params.initialTab.tabData);

        // 4. (Опционально) Вызываем AI-сервис для генерации дополнительного контента
        // Здесь можно вызывать дополнительные методы builder-а, например,
        // builder.addProfile(...), builder.addWorkoutPlan(...), builder.addGoal(...), builder.addAlgorithm(...)


        // Возвращаем агрегированный результат
        return { ...builder.build()};
    }
}

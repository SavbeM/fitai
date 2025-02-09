import {$Enums, EnumTabType} from "@prisma/client";
import EnumViewTemplate = $Enums.EnumViewTemplate;
import {prisma} from "@/services/databaseService";
import {ActivityCandidate, ProfileBiometricsArray} from "@/validation/zodSchema";
import * as readline from "node:readline";
import {InitProjectService} from "@/services/middleware/projectFacade";
import {InitProjectParams} from "@/services/middleware/projectInitTypes";



describe('Project initialization service Integration Tests', () => {
    jest.setTimeout(100000);
    it('should create a project in the database', async () => {
        const initProjectService = new InitProjectService();
        const userChoice = async (activityCandidate: ActivityCandidate): Promise<boolean> => {
            console.log("Candidate activity:", activityCandidate);
            return true;
        }

        const fillProfile = async (profileData: ProfileBiometricsArray): Promise<ProfileBiometricsArray> => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            for (let i = 0; i < profileData.keys.length; i++) {
                profileData.values[i] = await new Promise((resolve) => {
                    rl.question(`Enter value for ${profileData.keys[i]}: `, (answer) => {
                        resolve(answer);
                    });
                });
            }

            rl.close();
            return profileData;
        }

        const initProjectParams: InitProjectParams = {
          user: {
            name: 'John Doe',
            email: 'daun@cmo.com',
          },
          project: {
            name: 'Присесть 1000 раз',
            description: 'Присесть 1000 раз за 30 дней',
          },
            initialTab: {
                type: EnumTabType.WORKOUT,
                tabData: {
                title: 'Workout Tab',
                type: EnumTabType.WORKOUT,
                },
            },
            viewTemplate: EnumViewTemplate.TODO,
            userChoice,
            fillProfile
        }

        const project = await initProjectService.initializeNewProject(initProjectParams);

        const createdProject = await prisma.project.findUnique({ where: { id: project.id } });
        expect(createdProject).not.toBeNull();

        console.log('Created project:', createdProject);

    });
});
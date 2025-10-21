import {ProjectBuilder} from '@/services/init_service/projectBuilder';
import {databaseService} from '@/services/database_service/databaseService';
import {dbMock} from './dbMock';

jest.mock('@/services/database_service/databaseService');

const mockedDb = jest.mocked(databaseService);
let builder: ProjectBuilder;

beforeAll(async () => {
    builder = new ProjectBuilder(dbMock.user.id, dbMock.project.title, dbMock.project.description);
})

beforeEach(() => {
    mockedDb.createProject.mockResolvedValue(dbMock.project);
    mockedDb.createProfile.mockResolvedValue(dbMock.profile);
    mockedDb.createWorkoutPlan.mockResolvedValue(dbMock.workoutPlan);
});


describe('Create project', () => {
    it('creates project in DB', async () => {
        try {
           const context = await builder.createProject();
            console.log('Created project:', context);

        } catch (error) {
            console.error('Error during createProject test:', error);
        }
    });
    it('AI choose template and query it from DB', async () => {
        try {
            const context = await builder.useTemplate();
            console.log('Create project:', context);
        } catch (error) {
            console.error('Error during useTemplate test:', error);
        }
    })
    it('generates plan config', async () => {
        try{
            const context = await builder.generatePlanConfig();
            console.log('Generated plan config:', context);
        } catch (error) {
            console.error('Error during generatePlanConfig test:', error);
        }
    });
    it('creates profile', async () => {
        try {
            const context = await builder.createProfile(dbMock.profile.biometrics as Record<string, number | string>);
            console.log('Created profile:', context);
        } catch (error) {
            console.error('Error during createProfile test:', error);
        }
    })
    it('generates workout plan', () => {
        try {
            const  context =  builder.createWorkoutPlan();
            console.log('Generated workout plan:', context);
        }  catch (error) {
           console.error('Error during generateWorkout plan:', error);
        }
    });
    it('build', () => {
        try {
            const result = builder.build();
            console.log('Build result:', result);
        } catch (error) {
            console.error('Error during build test:', error);
        }
    })
});



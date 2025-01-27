import nextJest from 'next/jest';

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

module.exports = createJestConfig(customJestConfig);

export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: {
                    noUnusedLocals: false,
                    noUnusedParameters: false,
                    rootDir: '.',
                    module: 'ESNext',
                    target: 'ES2022',
                },
            },
        ],
    },
    testMatch: [
        '**/src/**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.test.ts',
        '**/plugins/**/__tests__/**/*.test.ts',
    ],
    collectCoverageFrom: [
        'src/**/*.ts',
        'plugins/**/src/**/*.ts',
        '!**/*.d.ts',
        '!**/types.ts',
        '!**/node_modules/**',
    ],
    coverageDirectory: './coverage',
    verbose: true,
    testTimeout: 30000,
    maxWorkers: 4,
    rootDir: '.',
};

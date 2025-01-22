import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
	dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	testEnvironment: 'jest-environment-jsdom',
	preset: 'ts-jest',
	moduleNameMapper: {
		// Handle module aliases
		'^@/components/(.*)$': '<rootDir>/components/$1',
		'^@/lib/(.*)$': '<rootDir>/lib/$1',
		'^@/hooks/(.*)$': '<rootDir>/hooks/$1',
		'^@/types/(.*)$': '<rootDir>/types/$1',
	},
	coverageThreshold: {
		global: {
			branches: 80,
			functions: 80,
			lines: 80,
			statements: 80,
		},
	},
	collectCoverageFrom: [
		'components/**/*.{ts,tsx}',
		'lib/**/*.{ts,tsx}',
		'hooks/**/*.{ts,tsx}',
		'!**/*.d.ts',
		'!**/node_modules/**',
	],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);

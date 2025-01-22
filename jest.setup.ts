import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import fetchMock from 'jest-fetch-mock';

// Enable fetch mocking
fetchMock.enableMocks();

// Polyfill for encoding which isn't present globally in jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
	createClientComponentClient: jest.fn(() => ({
		auth: {
			signIn: jest.fn(),
			signUp: jest.fn(),
			signOut: jest.fn(),
			resetPassword: jest.fn(),
		},
		from: jest.fn(() => ({
			select: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
		})),
	})),
	createServerComponentClient: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
	useRouter: jest.fn(() => ({
		push: jest.fn(),
		replace: jest.fn(),
		refresh: jest.fn(),
	})),
	useSearchParams: jest.fn(() => ({
		get: jest.fn(),
	})),
}));

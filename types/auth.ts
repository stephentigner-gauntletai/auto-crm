import { ApiResponse, ResourceMetadata } from './api';

/**
 * User roles in the system
 */
export enum UserRole {
	ADMIN = 'admin',
	AGENT = 'agent',
	CUSTOMER = 'customer',
}

/**
 * Base user interface
 */
export interface User extends ResourceMetadata {
	id: string;
	email: string;
	full_name: string;
	role: UserRole;
	is_active: boolean;
	avatar_url?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Request body for user registration
 */
export interface SignUpRequest {
	email: string;
	password: string;
	full_name: string;
	role?: UserRole;
	metadata?: Record<string, unknown>;
}

/**
 * Request body for user sign in
 */
export interface SignInRequest {
	email: string;
	password: string;
}

/**
 * Request body for password reset
 */
export interface ResetPasswordRequest {
	email: string;
}

/**
 * Request body for password update
 */
export interface UpdatePasswordRequest {
	current_password: string;
	new_password: string;
}

/**
 * Request body for updating user profile
 */
export interface UpdateUserRequest {
	full_name?: string;
	avatar_url?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Session information
 */
export interface Session {
	access_token: string;
	refresh_token: string;
	expires_at: number;
	user: User;
}

/**
 * Response for user operations
 */
export type UserResponse = ApiResponse<User>;

/**
 * Response for authentication operations
 */
export type AuthResponse = ApiResponse<{
	session: Session;
	user: User;
}>;

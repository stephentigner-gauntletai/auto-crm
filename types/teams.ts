import { ApiResponse, PaginatedResponse, BaseQueryParams, ResourceMetadata } from './api';
import { User } from './auth';

/**
 * Team member roles
 */
export enum TeamRole {
	OWNER = 'owner',
	ADMIN = 'admin',
	MEMBER = 'member',
}

/**
 * Team member interface
 */
export interface TeamMember {
	user: User;
	role: TeamRole;
	joined_at: string;
}

/**
 * Base team interface
 */
export interface Team extends ResourceMetadata {
	id: string;
	name: string;
	description?: string;
	avatar_url?: string;
	members: TeamMember[];
	metadata?: Record<string, unknown>;
}

/**
 * Request body for creating a team
 */
export interface CreateTeamRequest {
	name: string;
	description?: string;
	avatar_url?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Request body for updating a team
 */
export interface UpdateTeamRequest {
	name?: string;
	description?: string;
	avatar_url?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Request body for adding a team member
 */
export interface AddTeamMemberRequest {
	user_id: string;
	role: TeamRole;
}

/**
 * Request body for updating a team member
 */
export interface UpdateTeamMemberRequest {
	role: TeamRole;
}

/**
 * Query parameters for listing teams
 */
export interface ListTeamsParams extends BaseQueryParams {
	search?: string;
	member_id?: string;
}

/**
 * Response for a single team
 */
export type TeamResponse = ApiResponse<Team>;

/**
 * Response for listing teams
 */
export type ListTeamsResponse = PaginatedResponse<Team[]>;

/**
 * Team invitation interface
 */
export interface TeamInvitation extends ResourceMetadata {
	id: string;
	team_id: string;
	email: string;
	role: TeamRole;
	expires_at: string;
	accepted_at?: string;
	declined_at?: string;
}

/**
 * Request body for creating a team invitation
 */
export interface CreateTeamInvitationRequest {
	email: string;
	role: TeamRole;
	expires_at?: string;
}

/**
 * Response for team invitation operations
 */
export type TeamInvitationResponse = ApiResponse<TeamInvitation>;

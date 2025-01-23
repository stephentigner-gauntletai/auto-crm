export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			attachments: {
				Row: {
					created_at: string | null;
					file_name: string;
					file_size: number;
					file_type: string;
					id: string;
					ticket_id: string | null;
					updated_at: string | null;
					url: string;
					user_id: string | null;
				};
				Insert: {
					created_at?: string | null;
					file_name: string;
					file_size: number;
					file_type: string;
					id?: string;
					ticket_id?: string | null;
					updated_at?: string | null;
					url: string;
					user_id?: string | null;
				};
				Update: {
					created_at?: string | null;
					file_name?: string;
					file_size?: number;
					file_type?: string;
					id?: string;
					ticket_id?: string | null;
					updated_at?: string | null;
					url?: string;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'attachments_ticket_id_fkey';
						columns: ['ticket_id'];
						referencedRelation: 'tickets';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'attachments_user_id_fkey';
						columns: ['user_id'];
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
			conversations: {
				Row: {
					created_at: string | null;
					id: string;
					message: string;
					ticket_id: string | null;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					message: string;
					ticket_id?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					message?: string;
					ticket_id?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'conversations_ticket_id_fkey';
						columns: ['ticket_id'];
						referencedRelation: 'tickets';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'conversations_user_id_fkey';
						columns: ['user_id'];
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
			team_members: {
				Row: {
					created_at: string | null;
					id: string;
					role: string;
					team_id: string | null;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					role: string;
					team_id?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					role?: string;
					team_id?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'team_members_team_id_fkey';
						columns: ['team_id'];
						referencedRelation: 'teams';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'team_members_user_id_fkey';
						columns: ['user_id'];
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
			teams: {
				Row: {
					created_at: string | null;
					id: string;
					name: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					name: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					name?: string;
					updated_at?: string | null;
				};
				Relationships: [];
			};
			ticket_history: {
				Row: {
					action: string;
					created_at: string | null;
					details: Json | null;
					id: string;
					ticket_id: string | null;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					action: string;
					created_at?: string | null;
					details?: Json | null;
					id?: string;
					ticket_id?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					action?: string;
					created_at?: string | null;
					details?: Json | null;
					id?: string;
					ticket_id?: string | null;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'ticket_history_ticket_id_fkey';
						columns: ['ticket_id'];
						referencedRelation: 'tickets';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'ticket_history_user_id_fkey';
						columns: ['user_id'];
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
			ticket_metadata: {
				Row: {
					created_at: string | null;
					id: string;
					key: string;
					ticket_id: string | null;
					updated_at: string | null;
					value: string;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					key: string;
					ticket_id?: string | null;
					updated_at?: string | null;
					value: string;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					key?: string;
					ticket_id?: string | null;
					updated_at?: string | null;
					value?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'ticket_metadata_ticket_id_fkey';
						columns: ['ticket_id'];
						referencedRelation: 'tickets';
						referencedColumns: ['id'];
					},
				];
			};
			tickets: {
				Row: {
					assigned_to: string | null;
					created_at: string | null;
					description: string;
					id: string;
					priority: string;
					status: string;
					team_id: string | null;
					title: string;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					assigned_to?: string | null;
					created_at?: string | null;
					description: string;
					id?: string;
					priority?: string;
					status?: string;
					team_id?: string | null;
					title: string;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					assigned_to?: string | null;
					created_at?: string | null;
					description?: string;
					id?: string;
					priority?: string;
					status?: string;
					team_id?: string | null;
					title?: string;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'tickets_assigned_to_fkey';
						columns: ['assigned_to'];
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'tickets_team_id_fkey';
						columns: ['team_id'];
						referencedRelation: 'teams';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'tickets_user_id_fkey';
						columns: ['user_id'];
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
			user_presence: {
				Row: {
					created_at: string | null;
					id: string;
					last_seen: string | null;
					status: string;
					updated_at: string | null;
					user_id: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					last_seen?: string | null;
					status?: string;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					last_seen?: string | null;
					status?: string;
					updated_at?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'user_presence_user_id_fkey';
						columns: ['user_id'];
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
			workflows: {
				Row: {
					created_at: string | null;
					description: string;
					id: string;
					is_active: boolean;
					name: string;
					steps: Json;
					trigger: Json;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					description: string;
					id?: string;
					is_active?: boolean;
					name: string;
					steps: Json;
					trigger: Json;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					description?: string;
					id?: string;
					is_active?: boolean;
					name?: string;
					steps?: Json;
					trigger?: Json;
					updated_at?: string | null;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}

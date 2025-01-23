export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue };

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					operationName?: string;
					query?: string;
					variables?: Json;
					extensions?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
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
						isOneToOne: false;
						referencedRelation: 'tickets';
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
					user_id: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					role: string;
					team_id?: string | null;
					user_id?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					role?: string;
					team_id?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'team_members_team_id_fkey';
						columns: ['team_id'];
						isOneToOne: false;
						referencedRelation: 'teams';
						referencedColumns: ['id'];
					},
				];
			};
			teams: {
				Row: {
					created_at: string | null;
					description: string | null;
					id: string;
					name: string;
					updated_at: string | null;
				};
				Insert: {
					created_at?: string | null;
					description?: string | null;
					id?: string;
					name: string;
					updated_at?: string | null;
				};
				Update: {
					created_at?: string | null;
					description?: string | null;
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
					user_id: string | null;
				};
				Insert: {
					action: string;
					created_at?: string | null;
					details?: Json | null;
					id?: string;
					ticket_id?: string | null;
					user_id?: string | null;
				};
				Update: {
					action?: string;
					created_at?: string | null;
					details?: Json | null;
					id?: string;
					ticket_id?: string | null;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'ticket_history_ticket_id_fkey';
						columns: ['ticket_id'];
						isOneToOne: false;
						referencedRelation: 'tickets';
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
					value: string | null;
				};
				Insert: {
					created_at?: string | null;
					id?: string;
					key: string;
					ticket_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Update: {
					created_at?: string | null;
					id?: string;
					key?: string;
					ticket_id?: string | null;
					updated_at?: string | null;
					value?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'ticket_metadata_ticket_id_fkey';
						columns: ['ticket_id'];
						isOneToOne: false;
						referencedRelation: 'tickets';
						referencedColumns: ['id'];
					},
				];
			};
			tickets: {
				Row: {
					assigned_to: string | null;
					created_at: string | null;
					created_by: string | null;
					customer_id: string | null;
					description: string | null;
					id: string;
					priority: string;
					status: string;
					team_id: string | null;
					title: string;
					updated_at: string | null;
				};
				Insert: {
					assigned_to?: string | null;
					created_at?: string | null;
					created_by?: string | null;
					customer_id?: string | null;
					description?: string | null;
					id?: string;
					priority: string;
					status: string;
					team_id?: string | null;
					title: string;
					updated_at?: string | null;
				};
				Update: {
					assigned_to?: string | null;
					created_at?: string | null;
					created_by?: string | null;
					customer_id?: string | null;
					description?: string | null;
					id?: string;
					priority?: string;
					status?: string;
					team_id?: string | null;
					title?: string;
					updated_at?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'tickets_team_id_fkey';
						columns: ['team_id'];
						isOneToOne: false;
						referencedRelation: 'teams';
						referencedColumns: ['id'];
					},
				];
			};
			user_presence: {
				Row: {
					id: string;
					last_seen: string | null;
					status: string | null;
				};
				Insert: {
					id: string;
					last_seen?: string | null;
					status?: string | null;
				};
				Update: {
					id?: string;
					last_seen?: string | null;
					status?: string | null;
				};
				Relationships: [];
			};
			attachments: {
				Row: {
					id: string;
					ticket_id: string | null;
					user_id: string | null;
					file_name: string;
					file_size: number;
					content_type: string;
					storage_path: string;
					created_at: string | null;
					updated_at: string | null;
				};
				Insert: {
					id?: string;
					ticket_id?: string | null;
					user_id?: string | null;
					file_name: string;
					file_size: number;
					content_type: string;
					storage_path: string;
					created_at?: string | null;
					updated_at?: string | null;
				};
				Update: {
					id?: string;
					ticket_id?: string | null;
					user_id?: string | null;
					file_name?: string;
					file_size?: number;
					content_type?: string;
					storage_path?: string;
					created_at?: string | null;
					updated_at?: string | null;
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
			notifications: {
				Row: {
					id: string;
					type: 'email' | 'in_app' | 'webhook';
					recipients: string[];
					template: string;
					context: JsonValue;
					status: 'sent' | 'failed';
					error?: string;
					metadata?: JsonValue;
					created_at?: string;
				};
				Insert: {
					id?: string;
					type: 'email' | 'in_app' | 'webhook';
					recipients: string[];
					template: string;
					context: JsonValue;
					status: 'sent' | 'failed';
					error?: string;
					metadata?: JsonValue;
					created_at?: string;
				};
				Update: {
					id?: string;
					type?: 'email' | 'in_app' | 'webhook';
					recipients?: string[];
					template?: string;
					context?: JsonValue;
					status?: 'sent' | 'failed';
					error?: string;
					metadata?: JsonValue;
					created_at?: string;
				};
				Relationships: [];
			};
			user_notifications: {
				Row: {
					id: string;
					user_id: string;
					type: string;
					message: string;
					data?: JsonValue;
					read: boolean;
					created_at?: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					type: string;
					message: string;
					data?: JsonValue;
					read?: boolean;
					created_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					type?: string;
					message?: string;
					data?: JsonValue;
					read?: boolean;
					created_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'user_notifications_user_id_fkey';
						columns: ['user_id'];
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
				];
			};
			workflows: {
				Row: {
					id: string;
					name: string;
					description?: string;
					trigger: JsonValue;
					steps: JsonValue;
					is_active: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Insert: {
					id?: string;
					name: string;
					description?: string;
					trigger: JsonValue;
					steps: JsonValue;
					is_active?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					description?: string;
					trigger?: JsonValue;
					steps?: JsonValue;
					is_active?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			workflow_executions: {
				Row: {
					id: string;
					workflow_id: string;
					trigger_type: string;
					context: JsonValue;
					status: string;
					started_at?: string;
					completed_at?: string;
					error?: string;
					step_results: JsonValue;
				};
				Insert: {
					id?: string;
					workflow_id: string;
					trigger_type: string;
					context: JsonValue;
					status: string;
					started_at?: string;
					completed_at?: string;
					error?: string;
					step_results: JsonValue;
				};
				Update: {
					id?: string;
					workflow_id?: string;
					trigger_type?: string;
					context?: JsonValue;
					status?: string;
					started_at?: string;
					completed_at?: string;
					error?: string;
					step_results?: JsonValue;
				};
				Relationships: [
					{
						foreignKeyName: 'workflow_executions_workflow_id_fkey';
						columns: ['workflow_id'];
						referencedRelation: 'workflows';
						referencedColumns: ['id'];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			is_admin: {
				Args: Record<PropertyKey, never>;
				Returns: boolean;
			};
			is_agent: {
				Args: Record<PropertyKey, never>;
				Returns: boolean;
			};
			is_team_member: {
				Args: {
					team_id: string;
				};
				Returns: boolean;
			};
			mark_inactive_users: {
				Args: Record<PropertyKey, never>;
				Returns: undefined;
			};
			run_all_tests: {
				Args: Record<PropertyKey, never>;
				Returns: {
					test_name: string;
					passed: boolean;
					error_message: string;
				}[];
			};
			test_query_performance: {
				Args: Record<PropertyKey, never>;
				Returns: {
					query_name: string;
					execution_time_ms: number;
				}[];
			};
			test_realtime_setup: {
				Args: Record<PropertyKey, never>;
				Returns: boolean;
			};
			test_relationships: {
				Args: Record<PropertyKey, never>;
				Returns: boolean;
			};
			test_rls_policies: {
				Args: Record<PropertyKey, never>;
				Returns: boolean;
			};
			test_schema_validation: {
				Args: Record<PropertyKey, never>;
				Returns: boolean;
			};
		};
		Enums: {
			user_role: 'admin' | 'agent' | 'customer';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
	PublicTableNameOrOptions extends
		| keyof (PublicSchema['Tables'] & PublicSchema['Views'])
		| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
				Database[PublicTableNameOrOptions['schema']]['Views'])
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
			Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
		? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: PublicTableNameOrOptions extends keyof PublicSchema['Tables']
		? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: PublicTableNameOrOptions extends keyof PublicSchema['Tables']
		? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
	EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
		: never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
	? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
	: PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
		? PublicSchema['Enums'][PublicEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof PublicSchema['CompositeTypes']
		| { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
		? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

declare module "@supabase/supabase-js" {
	export interface Session {
		access_token: string;
		user: User;
	}
	export interface User {
		id: string;
		email?: string;
	}
}

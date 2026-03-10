export type Env = {
	DB: D1Database;
	ADMIN_TOKEN: string;
	ENCRYPTION_KEY: string;
	CLERK_PUBLISHABLE_KEY?: string;
	CLERK_SECRET_KEY?: string;
	PLATFORM_OWNER_ID?: string;
	CNY_USD_RATE?: string;
	STRIPE_SECRET_KEY?: string;
	STRIPE_WEBHOOK_SECRET?: string;
	ASSETS?: Fetcher;
	/** System-level API keys for dynamic model sync (provider /models endpoints) */
	DEEPSEEK_KEY?: string;
	OPENAI_KEY?: string;
	GEMINI_KEY?: string;
	ANTHROPIC_KEY?: string;
	/** When set, sync model catalog from this URL instead of running local syncAllModels */
	CATALOG_URL?: string;
};

export type AppEnv = {
	Bindings: Env;
	Variables: {
		owner_id: string;
		api_key_id?: string;
		allowed_models?: string[];
	};
};

export interface Settlement {
	consumerCharged: number;
	providerEarned: number;
	platformFee: number;
}

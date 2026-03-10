export interface ApiKeyInfo {
	id: string;
	name: string;
	keyHint: string;
	isEnabled: boolean;
	expiresAt: number | null;
	quotaLimit: number | null;
	quotaUsed: number;
	allowedModels: string[] | null;
	allowedIps: string[] | null;
	createdAt: number;
}

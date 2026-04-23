export interface DbPayment {
	id: string;
	owner_id: string;
	type: "manual" | "auto";
	stripe_session_id: string;
	amount_cents: number;
	credits: number;
	status: string;
	created_at: number;
}

export class PaymentsDao {
	constructor(private db: D1Database) {}

	async create(p: Omit<DbPayment, "id" | "created_at">): Promise<string> {
		const id = `pay_${crypto.randomUUID()}`;
		await this.db
			.prepare(
				`INSERT INTO payments (id, owner_id, type, stripe_session_id, amount_cents, credits, status, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.bind(
				id,
				p.owner_id,
				p.type,
				p.stripe_session_id,
				p.amount_cents,
				p.credits,
				p.status,
				Date.now(),
			)
			.run();
		return id;
	}

	async transition(
		sessionId: string,
		to: "expired" | "canceled",
	): Promise<boolean> {
		const res = await this.db
			.prepare(
				"UPDATE payments SET status = ? WHERE stripe_session_id = ? AND status = 'pending'",
			)
			.bind(to, sessionId)
			.run();
		return (res.meta?.changes ?? 0) > 0;
	}

	/**
	 * Idempotently mark a session completed. Returns true on the first
	 * transition (→ caller should credit the wallet), false on subsequent
	 * calls or when no row matches. Allows upgrading from any non-completed
	 * status so a stale `canceled` row (e.g. from a cancel_url redirect that
	 * raced the paid webhook) doesn't silently swallow the payment.
	 */
	async markCompleted(sessionId: string): Promise<boolean> {
		const res = await this.db
			.prepare(
				"UPDATE payments SET status = 'completed' WHERE stripe_session_id = ? AND status != 'completed'",
			)
			.bind(sessionId)
			.run();
		return (res.meta?.changes ?? 0) > 0;
	}

	async cancelSession(sessionId: string, ownerId: string): Promise<boolean> {
		const res = await this.db
			.prepare(
				"UPDATE payments SET status = 'canceled' WHERE stripe_session_id = ? AND owner_id = ? AND status = 'pending'",
			)
			.bind(sessionId, ownerId)
			.run();
		return (res.meta?.changes ?? 0) > 0;
	}
}

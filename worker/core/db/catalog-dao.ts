import type { DbModelCatalog } from "./schema";

export class CatalogDao {
	constructor(private db: D1Database) {}

	async upsert(
		models: Omit<DbModelCatalog, "refreshed_at" | "is_active">[],
	): Promise<void> {
		const now = Date.now();
		const stmt = this.db.prepare(
			`INSERT INTO model_catalog (id, provider_id, model_id, name, model_type, input_price, output_price, context_length, input_modalities, output_modalities, is_active, upstream_model_id, metadata, created, refreshed_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
			 ON CONFLICT(id) DO UPDATE SET
			   name = excluded.name,
			   model_type = excluded.model_type,
			   input_price = excluded.input_price,
			   output_price = excluded.output_price,
			   context_length = excluded.context_length,
			   input_modalities = excluded.input_modalities,
			   output_modalities = excluded.output_modalities,
			   is_active = 1,
			   upstream_model_id = excluded.upstream_model_id,
			   metadata = excluded.metadata,
			   created = excluded.created,
			   refreshed_at = excluded.refreshed_at`,
		);

		const batch = models.map((m) =>
			stmt.bind(
				m.id,
				m.provider_id,
				m.model_id,
				m.name,
				m.model_type,
				m.input_price,
				m.output_price,
				m.context_length,
				m.input_modalities,
				m.output_modalities,
				m.upstream_model_id,
				m.metadata,
				m.created,
				now,
			),
		);

		for (let i = 0; i < batch.length; i += 100) {
			await this.db.batch(batch.slice(i, i + 100));
		}
	}

	async deactivateMissing(
		providerId: string,
		activeIds: string[],
	): Promise<void> {
		if (activeIds.length === 0) return;

		const activeSet = new Set(activeIds);
		const existing = await this.db
			.prepare(
				"SELECT id FROM model_catalog WHERE provider_id = ? AND is_active = 1",
			)
			.bind(providerId)
			.all<{ id: string }>();

		const toDeactivate = (existing.results || [])
			.map((r) => r.id)
			.filter((id) => !activeSet.has(id));
		if (toDeactivate.length === 0) return;

		const stmt = this.db.prepare(
			"UPDATE model_catalog SET is_active = 0 WHERE id = ?",
		);
		for (let i = 0; i < toDeactivate.length; i += 100) {
			await this.db.batch(
				toDeactivate.slice(i, i + 100).map((id) => stmt.bind(id)),
			);
		}
	}

	async getAllActive(): Promise<DbModelCatalog[]> {
		const res = await this.db
			.prepare("SELECT * FROM model_catalog WHERE is_active = 1")
			.all<DbModelCatalog>();
		return res.results || [];
	}

	/** Fuzzy model lookup: case-insensitive, org-prefix optional. */
	async findByModelId(rawModelId: string): Promise<DbModelCatalog[]> {
		const id = rawModelId.toLowerCase();

		const exact = await this.db
			.prepare(
				"SELECT * FROM model_catalog WHERE model_id = ? AND is_active = 1 ORDER BY input_price ASC",
			)
			.bind(id)
			.all<DbModelCatalog>();
		if (exact.results?.length) return exact.results;

		if (!id.includes("/")) {
			const suffix = await this.db
				.prepare(
					"SELECT * FROM model_catalog WHERE model_id LIKE ? AND is_active = 1 ORDER BY input_price ASC",
				)
				.bind(`%/${id}`)
				.all<DbModelCatalog>();
			return suffix.results || [];
		}

		return [];
	}

	async getActiveWithBestMultiplier(): Promise<
		(DbModelCatalog & { best_multiplier: number | null })[]
	> {
		const res = await this.db
			.prepare(
				`SELECT mc.*, MIN(c.price_multiplier) AS best_multiplier
				 FROM model_catalog mc
				 LEFT JOIN upstream_credentials c
				   ON c.provider_id = mc.provider_id
				   AND c.is_enabled = 1
				   AND c.health_status NOT IN ('dead')
				 WHERE mc.is_active = 1
				 GROUP BY mc.id
				 ORDER BY mc.created DESC,
				   CASE WHEN mc.metadata IS NOT NULL THEN 0 ELSE 1 END,
				   mc.input_price ASC`,
			)
			.all<DbModelCatalog & { best_multiplier: number | null }>();
		return res.results || [];
	}
}

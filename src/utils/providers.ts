import type { Modality } from "../../worker/core/db/schema";
import type { ModelEntry } from "../types/model";
import type { ProviderMeta } from "../types/provider";

export interface ProviderModel {
	id: string;
	name: string;
	inputPrice: number;
	outputPrice: number;
	platformInputPrice?: number;
	platformOutputPrice?: number;
	contextLength: number;
	inputModalities: Modality[];
	outputModalities: Modality[];
}

export interface ProviderGroup {
	provider: ProviderMeta;
	models: ProviderModel[];
	bestMultiplier?: number;
}

export function aggregateProviders(
	entries: ModelEntry[],
	metas: ProviderMeta[],
): ProviderGroup[] {
	const providerMap = new Map<string, ProviderMeta>();
	for (const p of metas) providerMap.set(p.id, p);

	const byProvider = new Map<string, ProviderGroup>();
	for (const m of entries) {
		const meta = providerMap.get(m.provider_id);
		if (!meta) continue;
		let group = byProvider.get(m.provider_id);
		if (!group) {
			group = { provider: meta, models: [] };
			byProvider.set(m.provider_id, group);
		}
		group.models.push({
			id: m.id,
			name: m.name ?? m.id,
			inputPrice: m.input_price ?? 0,
			outputPrice: m.output_price ?? 0,
			platformInputPrice: m.platform_input_price,
			platformOutputPrice: m.platform_output_price,
			contextLength: m.context_length ?? 0,
			inputModalities: m.input_modalities ?? ["text"],
			outputModalities: m.output_modalities ?? ["text"],
		});
	}

	for (const g of byProvider.values()) {
		const sample = g.models.find(
			(m) => m.platformInputPrice != null && m.inputPrice > 0,
		);
		if (sample?.platformInputPrice != null) {
			g.bestMultiplier = sample.platformInputPrice / sample.inputPrice;
		}
	}

	return [...byProvider.values()].sort(
		(a, b) => b.models.length - a.models.length,
	);
}

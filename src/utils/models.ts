import type { Modality } from "../../worker/core/db/schema";
import type { ModelEntry } from "../types/model";
import { mergeModalities } from "./modalities";

export interface ModelGroup {
	id: string;
	displayName: string;
	providers: ProviderRow[];
	createdAt: number;
	inputModalities: Modality[];
	outputModalities: Modality[];
}

export interface ProviderRow {
	provider: string;
	inputPrice: number;
	outputPrice: number;
	platformInputPrice?: number;
	platformOutputPrice?: number;
	contextLength: number;
}

export function aggregateModels(entries: ModelEntry[]): ModelGroup[] {
	const groups = new Map<string, ModelGroup>();

	for (const e of entries) {
		let group = groups.get(e.id);
		if (!group) {
			group = {
				id: e.id,
				displayName: e.name || e.id,
				providers: [],
				createdAt: 0,
				inputModalities: e.input_modalities ?? ["text"],
				outputModalities: e.output_modalities ?? ["text"],
			};
			groups.set(e.id, group);
		}
		if (e.name && group.displayName === group.id) {
			group.displayName = e.name;
		}
		mergeModalities(group.inputModalities, e.input_modalities);
		mergeModalities(group.outputModalities, e.output_modalities);
		if (e.created_at && (!group.createdAt || e.created_at < group.createdAt)) {
			group.createdAt = e.created_at;
		}
		group.providers.push({
			provider: e.provider,
			inputPrice: e.input_price ?? 0,
			outputPrice: e.output_price ?? 0,
			platformInputPrice: e.platform_input_price,
			platformOutputPrice: e.platform_output_price,
			contextLength: e.context_length ?? 0,
		});
	}

	for (const g of groups.values()) {
		g.providers.sort((a, b) => a.inputPrice - b.inputPrice);
	}

	return [...groups.values()];
}

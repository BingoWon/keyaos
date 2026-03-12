#!/usr/bin/env node
/**
 * Image Generation — Verification Script
 *
 * Tests whether Keyaos correctly proxies image generation requests via OpenRouter.
 * Covers: model discovery, non-streaming, streaming, billing/usage, response structure.
 *
 * Usage: node scripts/verify/image-generation.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";

const envFile = readFileSync(".env.local", "utf-8");
const KEYAOS_KEY = envFile.match(/KEYAOS_API_KEY=(.+)/)?.[1]?.trim();
const OR_KEY = envFile.match(/OR_KEY=(.+)/)?.[1]?.trim();
if (!KEYAOS_KEY) {
	console.error("KEYAOS_API_KEY not found in .env.local");
	process.exit(1);
}

const KEYAOS_BASE = "http://localhost:5173/v1";
const OR_BASE = "https://openrouter.ai/api/v1";
const results = {};

function section(title) {
	console.log(`\n${"═".repeat(60)}`);
	console.log(`  ${title}`);
	console.log(`${"═".repeat(60)}`);
}

function sub(title) {
	console.log(`\n── ${title} ──`);
}

// ─── 1. Discover image-capable models on OpenRouter ─────────

section("1. OpenRouter — Image-capable models");

try {
	const res = await fetch(`${OR_BASE}/models?output_modality=image`);
	const json = await res.json();
	const data = json.data || [];

	console.log(`Total image-capable models: ${data.length}`);

	const modelsByOrg = {};
	for (const m of data) {
		const org = m.id.split("/")[0];
		if (!modelsByOrg[org]) modelsByOrg[org] = [];
		modelsByOrg[org].push({
			id: m.id,
			name: m.name,
			outputModalities: m.architecture?.output_modalities,
			inputModalities: m.architecture?.input_modalities,
			pricing: m.pricing
				? {
						prompt: m.pricing.prompt,
						completion: m.pricing.completion,
						image: m.pricing.image,
					}
				: null,
		});
	}

	for (const [org, models] of Object.entries(modelsByOrg).sort()) {
		sub(`${org} (${models.length} models)`);
		for (const m of models) {
			console.log(
				`  ${m.id} | output: ${JSON.stringify(m.outputModalities)} | pricing: ${JSON.stringify(m.pricing)}`,
			);
		}
	}

	results.openRouterImageModels = {
		total: data.length,
		orgs: Object.keys(modelsByOrg).sort(),
		models: data.map((m) => m.id),
	};
} catch (err) {
	console.error("ERROR:", err.message);
	results.openRouterImageModels = { error: err.message };
}

// ─── 2. Test via Keyaos — Non-streaming image generation ────

section("2. Keyaos — Non-streaming image generation");

const imageModels = [
	"openai/gpt-5-image-mini",
	"google/gemini-2.5-flash-image",
	"google/gemini-3.1-flash-image-preview",
];

for (const model of imageModels) {
	sub(`Model: ${model} (non-streaming)`);
	const start = Date.now();
	try {
		const res = await fetch(`${KEYAOS_BASE}/chat/completions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${KEYAOS_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model,
				messages: [
					{
						role: "user",
						content: "Draw a simple red circle on white background",
					},
				],
				modalities: ["image", "text"],
				max_tokens: 4096,
			}),
		});

		const elapsed = Date.now() - start;
		const xProvider = res.headers.get("x-provider");
		const xRequestId = res.headers.get("x-request-id");
		const contentType = res.headers.get("content-type");

		console.log(`Status: ${res.status} (${elapsed}ms)`);
		console.log(`x-provider: ${xProvider}`);
		console.log(`x-request-id: ${xRequestId}`);
		console.log(`content-type: ${contentType}`);

		if (!res.ok) {
			const errText = await res.text();
			console.log(`Error body: ${errText.slice(0, 500)}`);
			results[`nonStream_${model}`] = {
				status: res.status,
				error: errText.slice(0, 300),
			};
			continue;
		}

		const json = await res.json();

		sub("Response structure analysis");
		console.log(`Top-level keys: ${Object.keys(json)}`);
		console.log(`model: ${json.model}`);
		console.log(`choices count: ${json.choices?.length}`);

		if (json.choices?.[0]) {
			const choice = json.choices[0];
			console.log(`choice[0].finish_reason: ${choice.finish_reason}`);
			console.log(
				`choice[0].message keys: ${Object.keys(choice.message || {})}`,
			);

			const msg = choice.message;
			if (msg?.content) {
				console.log(
					`message.content (first 200 chars): ${msg.content.slice(0, 200)}`,
				);
			}
			if (msg?.images) {
				console.log(`message.images count: ${msg.images.length}`);
				for (let i = 0; i < msg.images.length; i++) {
					const img = msg.images[i];
					console.log(`  image[${i}] type: ${img.type}`);
					console.log(
						`  image[${i}] url prefix: ${img.image_url?.url?.slice(0, 60)}...`,
					);
					console.log(
						`  image[${i}] url length: ${img.image_url?.url?.length}`,
					);
				}
			} else {
				console.log("message.images: NOT PRESENT");
			}

			// Check if content contains base64 data URL inline
			if (msg?.content?.includes("data:image")) {
				console.log(
					"⚠️  content contains inline base64 image data URL!",
				);
			}
		}

		sub("Usage / Billing");
		console.log(`usage: ${JSON.stringify(json.usage)}`);

		results[`nonStream_${model}`] = {
			status: res.status,
			elapsed,
			xProvider,
			model: json.model,
			hasImages: !!json.choices?.[0]?.message?.images,
			imageCount: json.choices?.[0]?.message?.images?.length || 0,
			hasContent: !!json.choices?.[0]?.message?.content,
			contentHasBase64:
				json.choices?.[0]?.message?.content?.includes("data:image") ||
				false,
			usage: json.usage,
			messageKeys: Object.keys(json.choices?.[0]?.message || {}),
		};
	} catch (err) {
		console.error("ERROR:", err.message);
		results[`nonStream_${model}`] = { error: err.message };
	}
}

// ─── 3. Test via Keyaos — Streaming image generation ────────

section("3. Keyaos — Streaming image generation");

for (const model of [imageModels[0]]) {
	sub(`Model: ${model} (streaming)`);
	const start = Date.now();
	try {
		const res = await fetch(`${KEYAOS_BASE}/chat/completions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${KEYAOS_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model,
				messages: [
					{
						role: "user",
						content: "Draw a simple blue square on white background",
					},
				],
				modalities: ["image", "text"],
				stream: true,
				max_tokens: 4096,
			}),
		});

		const elapsed = Date.now() - start;
		const xProvider = res.headers.get("x-provider");
		const contentType = res.headers.get("content-type");

		console.log(`Status: ${res.status} (${elapsed}ms to first byte)`);
		console.log(`x-provider: ${xProvider}`);
		console.log(`content-type: ${contentType}`);

		if (!res.ok) {
			const errText = await res.text();
			console.log(`Error body: ${errText.slice(0, 500)}`);
			results[`stream_${model}`] = {
				status: res.status,
				error: errText.slice(0, 300),
			};
			continue;
		}

		const text = await res.text();
		const lines = text.split("\n").filter((l) => l.startsWith("data: "));
		const dataLines = lines.filter((l) => l !== "data: [DONE]");

		console.log(`Total SSE data lines: ${lines.length}`);
		console.log(`Ends with [DONE]: ${text.includes("data: [DONE]")}`);

		let hasImages = false;
		let hasUsage = false;
		let imageChunkCount = 0;
		let usageData = null;

		for (const line of dataLines) {
			try {
				const parsed = JSON.parse(line.slice(6));
				if (parsed.choices?.[0]?.delta?.images) {
					hasImages = true;
					imageChunkCount++;
					if (imageChunkCount <= 2) {
						const imgs = parsed.choices[0].delta.images;
						console.log(
							`  Image chunk ${imageChunkCount}: ${imgs.length} image(s), url prefix: ${imgs[0]?.image_url?.url?.slice(0, 60)}...`,
						);
					}
				}
				if (parsed.usage) {
					hasUsage = true;
					usageData = parsed.usage;
				}
			} catch {}
		}

		sub("Stream analysis");
		console.log(`Has image chunks: ${hasImages}`);
		console.log(`Image chunk count: ${imageChunkCount}`);
		console.log(`Has usage chunk: ${hasUsage}`);
		if (usageData) console.log(`Usage: ${JSON.stringify(usageData)}`);

		results[`stream_${model}`] = {
			status: res.status,
			elapsed,
			xProvider,
			totalChunks: lines.length,
			hasImages,
			imageChunkCount,
			hasUsage,
			usage: usageData,
		};
	} catch (err) {
		console.error("ERROR:", err.message);
		results[`stream_${model}`] = { error: err.message };
	}
}

// ─── 4. Direct OpenRouter comparison ────────────────────────

section("4. Direct OpenRouter comparison (same request)");

if (OR_KEY) {
	for (const model of [imageModels[0]]) {
		sub(`Model: ${model} (direct to OpenRouter)`);
		const start = Date.now();
		try {
			const res = await fetch(`${OR_BASE}/chat/completions`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${OR_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model,
					messages: [
						{
							role: "user",
							content:
								"Draw a simple red circle on white background",
						},
					],
					modalities: ["image", "text"],
					max_tokens: 4096,
				}),
			});

			const elapsed = Date.now() - start;
			console.log(`Status: ${res.status} (${elapsed}ms)`);

			if (!res.ok) {
				const errText = await res.text();
				console.log(`Error: ${errText.slice(0, 500)}`);
				results[`directOR_${model}`] = {
					status: res.status,
					error: errText.slice(0, 300),
				};
				continue;
			}

			const json = await res.json();
			console.log(`model: ${json.model}`);
			console.log(`choices count: ${json.choices?.length}`);

			const msg = json.choices?.[0]?.message;
			console.log(`message keys: ${Object.keys(msg || {})}`);
			if (msg?.content) console.log(`content (first 200): ${msg.content.slice(0, 200)}`);
			if (msg?.images) {
				console.log(`images count: ${msg.images.length}`);
				for (let i = 0; i < msg.images.length; i++) {
					console.log(
						`  image[${i}] url prefix: ${msg.images[i]?.image_url?.url?.slice(0, 60)}...`,
					);
				}
			} else {
				console.log("images: NOT PRESENT");
			}
			console.log(`usage: ${JSON.stringify(json.usage)}`);

			results[`directOR_${model}`] = {
				status: res.status,
				elapsed,
				model: json.model,
				hasImages: !!msg?.images,
				imageCount: msg?.images?.length || 0,
				hasContent: !!msg?.content,
				usage: json.usage,
				messageKeys: Object.keys(msg || {}),
			};
		} catch (err) {
			console.error("ERROR:", err.message);
			results[`directOR_${model}`] = { error: err.message };
		}
	}
} else {
	console.log("Skipping — OR_KEY not found in .env.local");
}

// ─── 5. Edge cases ──────────────────────────────────────────

section("5. Edge cases");

sub("5a. Image model WITHOUT modalities param (should it work?)");
try {
	const res = await fetch(`${KEYAOS_BASE}/chat/completions`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${KEYAOS_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: imageModels[0],
			messages: [
				{
					role: "user",
					content: "What is 2+2?",
				},
			],
			max_tokens: 100,
		}),
	});
	console.log(`Status: ${res.status}`);
	if (res.ok) {
		const json = await res.json();
		console.log(
			`Works without modalities: yes (content: "${json.choices?.[0]?.message?.content?.slice(0, 100)}")`,
		);
		console.log(`Has images field: ${!!json.choices?.[0]?.message?.images}`);
	} else {
		const text = await res.text();
		console.log(`Error: ${text.slice(0, 300)}`);
	}
	results.edgeCase_noModalities = { status: res.status };
} catch (err) {
	console.error("ERROR:", err.message);
}

sub("5b. modalities=[\"image\"] only (image-only models)");
try {
	const res = await fetch(`${KEYAOS_BASE}/chat/completions`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${KEYAOS_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: imageModels[0],
			messages: [
				{
					role: "user",
					content: "A sunset over mountains",
				},
			],
			modalities: ["image"],
			max_tokens: 4096,
		}),
	});
	console.log(`Status: ${res.status}`);
	if (res.ok) {
		const json = await res.json();
		const msg = json.choices?.[0]?.message;
		console.log(`Has images: ${!!msg?.images}, count: ${msg?.images?.length || 0}`);
		console.log(`Has content: ${!!msg?.content}`);
	} else {
		const text = await res.text();
		console.log(`Error: ${text.slice(0, 300)}`);
	}
	results.edgeCase_imageOnly = { status: res.status };
} catch (err) {
	console.error("ERROR:", err.message);
}

// ─── Summary ────────────────────────────────────────────────

section("SUMMARY");
console.log(JSON.stringify(results, null, 2));

writeFileSync(
	"scripts/verify/image-generation.json",
	JSON.stringify(results, null, 2),
);
console.log("\nResults saved to scripts/verify/image-generation.json");

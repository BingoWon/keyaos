#!/usr/bin/env node
/**
 * OpenRouter Multimodal Audit — Check what OpenRouter supports for:
 * 1. Image generation features (image_config, etc.)
 * 2. TTS / audio speech
 * 3. STT / audio transcriptions
 *
 * Usage: node scripts/verify/openrouter-multimodal-audit.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";

const envFile = readFileSync(".env.local", "utf-8");
const OR_KEY = envFile.match(/OR_KEY=(.+)/)?.[1]?.trim();
const KEYAOS_KEY = envFile.match(/KEYAOS_API_KEY=(.+)/)?.[1]?.trim();

const OR_BASE = "https://openrouter.ai/api/v1";
const KEYAOS_BASE = "http://localhost:5173/v1";
const results = {};

function section(title) {
	console.log(`\n${"═".repeat(60)}`);
	console.log(`  ${title}`);
	console.log(`${"═".repeat(60)}`);
}
function sub(title) {
	console.log(`\n── ${title} ──`);
}

// ─── 1. OpenRouter model capabilities audit ─────────────────

section("1. OpenRouter — Full modality audit");

try {
	const res = await fetch(`${OR_BASE}/models`);
	const json = await res.json();
	const data = json.data || [];

	const audioOutputModels = data.filter((m) =>
		m.architecture?.output_modalities?.includes("audio"),
	);
	const audioInputModels = data.filter((m) =>
		m.architecture?.input_modalities?.includes("audio"),
	);
	const imageOutputModels = data.filter((m) =>
		m.architecture?.output_modalities?.includes("image"),
	);
	const imageInputModels = data.filter((m) =>
		m.architecture?.input_modalities?.includes("image"),
	);

	sub("Models with audio OUTPUT");
	console.log(`Count: ${audioOutputModels.length}`);
	for (const m of audioOutputModels) {
		console.log(
			`  ${m.id} | output: ${JSON.stringify(m.architecture?.output_modalities)} | input: ${JSON.stringify(m.architecture?.input_modalities)}`,
		);
	}

	sub("Models with audio INPUT");
	console.log(`Count: ${audioInputModels.length}`);
	for (const m of audioInputModels.slice(0, 20)) {
		console.log(
			`  ${m.id} | input: ${JSON.stringify(m.architecture?.input_modalities)}`,
		);
	}
	if (audioInputModels.length > 20)
		console.log(`  ... and ${audioInputModels.length - 20} more`);

	sub("Models with image OUTPUT");
	console.log(`Count: ${imageOutputModels.length}`);
	for (const m of imageOutputModels) {
		console.log(
			`  ${m.id} | output: ${JSON.stringify(m.architecture?.output_modalities)}`,
		);
	}

	sub("Unique output modalities across all models");
	const allOutputMods = new Set();
	for (const m of data) {
		for (const mod of m.architecture?.output_modalities || []) {
			allOutputMods.add(mod);
		}
	}
	console.log(`Modalities: ${JSON.stringify([...allOutputMods])}`);

	sub("Unique input modalities across all models");
	const allInputMods = new Set();
	for (const m of data) {
		for (const mod of m.architecture?.input_modalities || []) {
			allInputMods.add(mod);
		}
	}
	console.log(`Modalities: ${JSON.stringify([...allInputMods])}`);

	results.audioOutputModels = audioOutputModels.map((m) => m.id);
	results.audioInputModels = audioInputModels.map((m) => m.id);
	results.imageOutputModels = imageOutputModels.map((m) => m.id);
	results.allOutputModalities = [...allOutputMods];
	results.allInputModalities = [...allInputMods];
} catch (err) {
	console.error("ERROR:", err.message);
}

// ─── 2. Check OpenRouter TTS endpoint ───────────────────────

section("2. OpenRouter — TTS endpoint test");

if (OR_KEY) {
	sub("POST /v1/audio/speech (OpenAI TTS format)");
	try {
		const res = await fetch(`${OR_BASE}/audio/speech`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${OR_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "openai/tts-1",
				input: "Hello world",
				voice: "alloy",
			}),
		});
		console.log(`Status: ${res.status}`);
		console.log(`Content-Type: ${res.headers.get("content-type")}`);
		if (!res.ok) {
			const text = await res.text();
			console.log(`Error: ${text.slice(0, 500)}`);
		} else {
			const buf = await res.arrayBuffer();
			console.log(`Response body size: ${buf.byteLength} bytes`);
			console.log("TTS appears to be SUPPORTED on OpenRouter!");
		}
		results.openRouterTTS = { status: res.status, supported: res.ok };
	} catch (err) {
		console.error("ERROR:", err.message);
		results.openRouterTTS = { error: err.message };
	}

	sub("POST /v1/audio/speech with openai/tts-1-hd");
	try {
		const res = await fetch(`${OR_BASE}/audio/speech`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${OR_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "openai/tts-1-hd",
				input: "Testing TTS HD",
				voice: "nova",
			}),
		});
		console.log(`Status: ${res.status}`);
		if (!res.ok) {
			const text = await res.text();
			console.log(`Error: ${text.slice(0, 500)}`);
		} else {
			const buf = await res.arrayBuffer();
			console.log(`Response body size: ${buf.byteLength} bytes`);
		}
		results.openRouterTTSHD = { status: res.status };
	} catch (err) {
		console.error("ERROR:", err.message);
	}

	sub("TTS via chat/completions with audio output model");
	if (results.audioOutputModels?.length > 0) {
		const audioModel = results.audioOutputModels[0];
		console.log(`Testing model: ${audioModel}`);
		try {
			const res = await fetch(`${OR_BASE}/chat/completions`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${OR_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: audioModel,
					messages: [{ role: "user", content: "Say hello" }],
					modalities: ["audio", "text"],
					audio: { voice: "alloy", format: "mp3" },
				}),
			});
			console.log(`Status: ${res.status}`);
			console.log(`Content-Type: ${res.headers.get("content-type")}`);
			if (res.ok) {
				const json = await res.json();
				const msg = json.choices?.[0]?.message;
				console.log(`message keys: ${Object.keys(msg || {})}`);
				if (msg?.audio) {
					console.log(
						`audio keys: ${Object.keys(msg.audio)}`,
					);
					console.log(
						`audio.data length: ${msg.audio.data?.length || 0}`,
					);
				}
			} else {
				const text = await res.text();
				console.log(`Error: ${text.slice(0, 500)}`);
			}
			results.audioViaChatCompletions = { status: res.status };
		} catch (err) {
			console.error("ERROR:", err.message);
		}
	}
} else {
	console.log("Skipping — OR_KEY not found");
}

// ─── 3. Check OpenRouter STT endpoint ───────────────────────

section("3. OpenRouter — STT endpoint test");

if (OR_KEY) {
	sub("POST /v1/audio/transcriptions");
	try {
		const formData = new FormData();
		formData.append("model", "openai/whisper-1");
		const silentWav = createSilentWav(0.5);
		formData.append("file", new Blob([silentWav], { type: "audio/wav" }), "test.wav");

		const res = await fetch(`${OR_BASE}/audio/transcriptions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${OR_KEY}`,
			},
			body: formData,
		});
		console.log(`Status: ${res.status}`);
		console.log(`Content-Type: ${res.headers.get("content-type")}`);
		if (!res.ok) {
			const text = await res.text();
			console.log(`Error: ${text.slice(0, 500)}`);
		} else {
			const json = await res.json();
			console.log(`Response: ${JSON.stringify(json)}`);
			console.log("STT appears to be SUPPORTED on OpenRouter!");
		}
		results.openRouterSTT = { status: res.status, supported: res.ok };
	} catch (err) {
		console.error("ERROR:", err.message);
		results.openRouterSTT = { error: err.message };
	}
} else {
	console.log("Skipping — OR_KEY not found");
}

// ─── 4. Image generation features gap: image_config ─────────

section("4. Image generation — image_config support");

if (KEYAOS_KEY) {
	sub("image_config.aspect_ratio via Keyaos");
	try {
		const res = await fetch(`${KEYAOS_BASE}/chat/completions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${KEYAOS_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "google/gemini-2.5-flash-image",
				messages: [
					{
						role: "user",
						content: "Draw a simple green triangle",
					},
				],
				modalities: ["image", "text"],
				image_config: {
					aspect_ratio: "16:9",
				},
				max_tokens: 4096,
			}),
		});
		console.log(`Status: ${res.status}`);
		if (res.ok) {
			const json = await res.json();
			const imgs = json.choices?.[0]?.message?.images;
			console.log(`Has images: ${!!imgs}, count: ${imgs?.length || 0}`);
			console.log(`image_config passed through successfully!`);
		} else {
			const text = await res.text();
			console.log(`Error: ${text.slice(0, 300)}`);
		}
		results.imageConfig = { status: res.status, supported: res.ok };
	} catch (err) {
		console.error("ERROR:", err.message);
	}
}

// ─── 5. Check Keyaos TTS endpoint ──────────────────────────

section("5. Keyaos — TTS endpoint test");

if (KEYAOS_KEY) {
	sub("POST /v1/audio/speech via Keyaos");
	try {
		const res = await fetch(`${KEYAOS_BASE}/audio/speech`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${KEYAOS_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "openai/tts-1",
				input: "Hello world",
				voice: "alloy",
			}),
		});
		console.log(`Status: ${res.status}`);
		console.log(`Content-Type: ${res.headers.get("content-type")}`);
		if (!res.ok) {
			const text = await res.text();
			console.log(`Error: ${text.slice(0, 300)}`);
		} else {
			console.log("Keyaos TTS is SUPPORTED!");
		}
		results.keyaosTTS = { status: res.status };
	} catch (err) {
		console.error("ERROR:", err.message);
		results.keyaosTTS = { error: err.message };
	}
}

// ─── 6. Check Keyaos STT endpoint ──────────────────────────

section("6. Keyaos — STT endpoint test");

if (KEYAOS_KEY) {
	sub("POST /v1/audio/transcriptions via Keyaos");
	try {
		const formData = new FormData();
		formData.append("model", "openai/whisper-1");
		const silentWav = createSilentWav(0.5);
		formData.append("file", new Blob([silentWav], { type: "audio/wav" }), "test.wav");

		const res = await fetch(`${KEYAOS_BASE}/audio/transcriptions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${KEYAOS_KEY}`,
			},
			body: formData,
		});
		console.log(`Status: ${res.status}`);
		console.log(`Content-Type: ${res.headers.get("content-type")}`);
		if (!res.ok) {
			const text = await res.text();
			console.log(`Error: ${text.slice(0, 300)}`);
		} else {
			console.log("Keyaos STT is SUPPORTED!");
		}
		results.keyaosSTT = { status: res.status };
	} catch (err) {
		console.error("ERROR:", err.message);
		results.keyaosSTT = { error: err.message };
	}
}

// ─── 7. Check OpenRouter /v1/images/generations ─────────────

section("7. OpenRouter — /v1/images/generations endpoint");

if (OR_KEY) {
	sub("POST /v1/images/generations");
	try {
		const res = await fetch(`${OR_BASE}/images/generations`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${OR_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "openai/gpt-5-image-mini",
				prompt: "A red circle",
				n: 1,
				size: "1024x1024",
			}),
		});
		console.log(`Status: ${res.status}`);
		if (!res.ok) {
			const text = await res.text();
			console.log(`Error: ${text.slice(0, 500)}`);
			console.log(
				"OpenRouter does NOT support /v1/images/generations endpoint",
			);
		} else {
			const json = await res.json();
			console.log(`Response: ${JSON.stringify(json).slice(0, 500)}`);
			console.log("OpenRouter SUPPORTS /v1/images/generations!");
		}
		results.openRouterImagesEndpoint = { status: res.status };
	} catch (err) {
		console.error("ERROR:", err.message);
	}
}

// ─── Helper: create minimal WAV ─────────────────────────────

function createSilentWav(durationSec) {
	const sampleRate = 16000;
	const numSamples = Math.floor(sampleRate * durationSec);
	const dataSize = numSamples * 2;
	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);

	const writeString = (offset, str) => {
		for (let i = 0; i < str.length; i++)
			view.setUint8(offset + i, str.charCodeAt(i));
	};

	writeString(0, "RIFF");
	view.setUint32(4, 36 + dataSize, true);
	writeString(8, "WAVE");
	writeString(12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	writeString(36, "data");
	view.setUint32(40, dataSize, true);

	return new Uint8Array(buffer);
}

// ─── Summary ────────────────────────────────────────────────

section("SUMMARY");
console.log(JSON.stringify(results, null, 2));

writeFileSync(
	"scripts/verify/openrouter-multimodal-audit.json",
	JSON.stringify(results, null, 2),
);
console.log("\nResults saved to scripts/verify/openrouter-multimodal-audit.json");

/**
 * Embeddings endpoint e2e tests
 *
 * Covers: single input, batch input, model type filtering,
 * provider routing, error handling, response format validation.
 *
 * Prerequisites: local dev server running, credentials configured, KEYAOS_API_KEY set.
 */

import assert from "node:assert";
import test from "node:test";
import { API_BASE, KEYAOS_KEY } from "./utils.ts";

const EMBEDDING_MODEL = "qwen/qwen3-embedding-4b";
const HEADERS = {
	"Content-Type": "application/json",
	Authorization: `Bearer ${KEYAOS_KEY}`,
};

// ─── Basic embedding creation ───────────────────────────

test("Embeddings: single text input", async () => {
	const res = await fetch(`${API_BASE}/v1/embeddings`, {
		method: "POST",
		headers: HEADERS,
		body: JSON.stringify({
			model: EMBEDDING_MODEL,
			input: "The quick brown fox jumps over the lazy dog",
		}),
	});

	assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);

	const data = await res.json();
	assert.strictEqual(data.object, "list");
	assert.strictEqual(data.data.length, 1);
	assert.strictEqual(data.data[0].object, "embedding");
	assert.strictEqual(data.data[0].index, 0);
	assert.ok(
		Array.isArray(data.data[0].embedding),
		"embedding should be an array",
	);
	assert.ok(data.data[0].embedding.length > 0, "embedding should not be empty");
	assert.ok(data.usage.prompt_tokens > 0, "Should have prompt_tokens");
	assert.ok(data.usage.total_tokens > 0, "Should have total_tokens");

	assert.ok(res.headers.get("x-request-id"), "Missing x-request-id");
	assert.ok(res.headers.get("x-provider"), "Missing x-provider");
	assert.ok(res.headers.get("x-credential-id"), "Missing x-credential-id");

	console.log(
		`  Model: ${data.model}, Dims: ${data.data[0].embedding.length}, Tokens: ${data.usage.prompt_tokens}`,
	);
});

test("Embeddings: batch text input", async () => {
	const inputs = ["Hello world", "Goodbye world", "Testing embeddings"];
	const res = await fetch(`${API_BASE}/v1/embeddings`, {
		method: "POST",
		headers: HEADERS,
		body: JSON.stringify({ model: EMBEDDING_MODEL, input: inputs }),
	});

	assert.strictEqual(res.status, 200);

	const data = await res.json();
	assert.strictEqual(data.data.length, inputs.length, "Should return one embedding per input");
	for (let i = 0; i < inputs.length; i++) {
		assert.strictEqual(data.data[i].index, i, `Index mismatch at position ${i}`);
		assert.ok(data.data[i].embedding.length > 0);
	}
	console.log(
		`  Batch: ${data.data.length} embeddings, Dims: ${data.data[0].embedding.length}`,
	);
});

// ─── Provider routing ───────────────────────────────────

test("Embeddings: explicit provider=openrouter", async () => {
	const res = await fetch(`${API_BASE}/v1/embeddings`, {
		method: "POST",
		headers: HEADERS,
		body: JSON.stringify({
			model: EMBEDDING_MODEL,
			input: "Provider routing test",
			provider: "openrouter",
		}),
	});

	assert.strictEqual(res.status, 200);
	assert.strictEqual(res.headers.get("x-provider"), "openrouter");

	const data = await res.json();
	assert.ok(data.data[0].embedding.length > 0);
	console.log(`  Provider: ${res.headers.get("x-provider")}`);
});

test("Embeddings: nonexistent provider returns error", async () => {
	const res = await fetch(`${API_BASE}/v1/embeddings`, {
		method: "POST",
		headers: HEADERS,
		body: JSON.stringify({
			model: EMBEDDING_MODEL,
			input: "Should fail",
			provider: "nonexistent-provider",
		}),
	});

	assert.ok(res.status >= 400, `Expected error status, got ${res.status}`);
	const data = await res.json();
	assert.ok(data.error, "Should have error object");
	console.log(`  Error: ${data.error.message}`);
});

// ─── Error handling ─────────────────────────────────────

test("Embeddings: missing model returns 400", async () => {
	const res = await fetch(`${API_BASE}/v1/embeddings`, {
		method: "POST",
		headers: HEADERS,
		body: JSON.stringify({ input: "no model" }),
	});

	assert.strictEqual(res.status, 400);
	const data = await res.json();
	assert.ok(data.error.message.includes("model"), "Error should mention model");
});

test("Embeddings: missing input returns 400", async () => {
	const res = await fetch(`${API_BASE}/v1/embeddings`, {
		method: "POST",
		headers: HEADERS,
		body: JSON.stringify({ model: EMBEDDING_MODEL }),
	});

	assert.strictEqual(res.status, 400);
	const data = await res.json();
	assert.ok(data.error.message.includes("input"), "Error should mention input");
});

test("Embeddings: invalid JSON body returns 400", async () => {
	const res = await fetch(`${API_BASE}/v1/embeddings`, {
		method: "POST",
		headers: { ...HEADERS, "Content-Type": "application/json" },
		body: "not json",
	});

	assert.strictEqual(res.status, 400);
});

test("Embeddings: nonexistent model returns error", async () => {
	const res = await fetch(`${API_BASE}/v1/embeddings`, {
		method: "POST",
		headers: HEADERS,
		body: JSON.stringify({
			model: "nonexistent/fake-embedding-model",
			input: "test",
		}),
	});

	assert.ok(res.status >= 400, `Expected error, got ${res.status}`);
	const data = await res.json();
	assert.ok(data.error);
	console.log(`  Error: ${data.error.code}`);
});

test("Embeddings: no auth returns 401", async () => {
	const res = await fetch(`${API_BASE}/v1/embeddings`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ model: EMBEDDING_MODEL, input: "test" }),
	});

	assert.strictEqual(res.status, 401);
});

// ─── Models endpoint: type filtering ────────────────────

test("Models: list includes type field", async () => {
	const res = await fetch(`${API_BASE}/v1/models`, {
		headers: { Authorization: `Bearer ${KEYAOS_KEY}` },
	});

	assert.strictEqual(res.status, 200);
	const data = await res.json();

	const types = new Set(data.data.map((m: { type: string }) => m.type));
	assert.ok(types.has("chat"), "Should have chat models");
	assert.ok(types.has("embedding"), "Should have embedding models");

	const embeddings = data.data.filter(
		(m: { type: string }) => m.type === "embedding",
	);
	assert.ok(embeddings.length > 0, "Should have embedding models");
	console.log(
		`  Chat: ${data.data.length - embeddings.length}, Embedding: ${embeddings.length}`,
	);
});

test("Models: embedding model has expected fields", async () => {
	const res = await fetch(`${API_BASE}/v1/models`, {
		headers: { Authorization: `Bearer ${KEYAOS_KEY}` },
	});

	const data = await res.json();
	const emb = data.data.find(
		(m: { id: string }) => m.id === EMBEDDING_MODEL,
	);

	assert.ok(emb, `Should find ${EMBEDDING_MODEL} in models list`);
	assert.strictEqual(emb.type, "embedding");
	assert.ok(emb.name, "Should have name");
	assert.ok(emb.pricing, "Should have pricing");
	assert.ok(emb.context_length > 0, "Should have context_length");
	console.log(
		`  ${emb.id}: ctx=${emb.context_length}, prompt=$${emb.pricing.prompt}/tok`,
	);
});

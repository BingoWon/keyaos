import { log } from "./logger";

const TELEGRAM_API = "https://api.telegram.org/bot";

/**
 * Send a message to a Telegram chat via bot.
 * Fires and forgets — never throws.
 */
export async function notifyTelegram(
	botToken: string,
	chatId: string,
	text: string,
): Promise<void> {
	try {
		const res = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				chat_id: chatId,
				text,
				parse_mode: "Markdown",
				disable_web_page_preview: true,
			}),
		});
		if (!res.ok) {
			log.warn("telegram", `Send failed: ${res.status}`);
		}
	} catch (err) {
		log.warn(
			"telegram",
			`Send error: ${err instanceof Error ? err.message : String(err)}`,
		);
	}
}

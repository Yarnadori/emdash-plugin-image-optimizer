import { describe, expect, it } from "vitest";

import { getMessages, matchLocale, resolveLocale } from "../src/i18n.js";

const req = (headers: Record<string, string>) => new Request("http://localhost/", { headers });

describe("matchLocale", () => {
	it.each([
		["ja", "ja"],
		["ja-JP", "ja"],
		["en-GB", "en"],
		["es-419", "es"],
		["es-ES", "es"],
		["pt-PT", "pt-br"],
		["pt-BR", "pt-br"],
		["zh", "zh-cn"],
		["zh-CN", "zh-cn"],
		["zh-Hans-CN", "zh-cn"],
		["zh-Hant-TW", "zh-tw"],
		["zh-HK", "zh-tw"],
		["ko_KR", "ko"],
	])("%s → %s", (tag, expected) => {
		expect(matchLocale(tag)).toBe(expected);
	});

	it("returns null for unsupported languages", () => {
		expect(matchLocale("ar")).toBeNull();
		expect(matchLocale("")).toBeNull();
	});
});

describe("resolveLocale", () => {
	it("prefers the host UI locale, then the admin cookie, then Accept-Language", () => {
		const request = req({ cookie: "a=1; emdash-locale=de", "accept-language": "fr-FR,fr;q=0.9" });
		expect(resolveLocale({ ui: { locale: "ko" }, request })).toBe("ko");
		expect(resolveLocale({ request })).toBe("de");
		expect(resolveLocale({ request: req({ "accept-language": "ar, fr-CA;q=0.8" }) })).toBe("fr");
	});

	it("skips an unsupported cookie and falls back to English", () => {
		expect(resolveLocale({ request: req({ cookie: "emdash-locale=ar" }) })).toBe("en");
		expect(resolveLocale({})).toBe("en");
	});

	it("falls back to English messages", () => {
		expect(getMessages("xx").title).toBe(getMessages("en").title);
		expect(getMessages("ja").title).toBe("画像変換（WebP / AVIF）");
	});
});

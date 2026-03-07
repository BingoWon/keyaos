import { type AppLocale, defaultLocale } from "./config";
import en from "./messages/en.json";
import zh from "./messages/zh.json";

export type AppMessages = typeof zh;

export const messagesByLocale: Record<AppLocale, AppMessages> = { zh, en };

export const getMessages = (locale: AppLocale): AppMessages => {
	return messagesByLocale[locale] ?? messagesByLocale[defaultLocale];
};

import { cookies } from 'next/headers';
import { LANG_COOKIE } from './cookie';
import { isLanguage, lookupMessage, type Language, type MessageVars } from './translate';
import { messages } from './messages';

export async function getLanguage(): Promise<Language> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLanguage(value) ? value : 'de';
}

export async function getTranslator(): Promise<(key: string, vars?: MessageVars) => string> {
  const language = await getLanguage();
  return (key: string, vars?: MessageVars) => lookupMessage(messages, language, key, vars);
}

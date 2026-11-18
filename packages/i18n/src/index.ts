import { en } from './en.js';
import { kn } from './kn.js';

export { en, kn };
export type Locale = 'en' | 'kn';

export function getDictionary(locale: Locale) {
  return locale === 'kn' ? kn : en;
}

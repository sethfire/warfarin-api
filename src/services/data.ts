import { DATA_URL, DATA_VERSION } from "../config"

export async function fetchData(filename: string) {
  const response: Response = await fetch(`${DATA_URL}/${DATA_VERSION}/${filename}`)
  if (!response.ok) return null

  const data: any = await response.json()
  if (!data) return null

  return data
}

export async function fetchI18nTextTable(lang: string) {
  switch (lang) {
    case 'en': return fetchData('I18nTextTable_EN.json');
    case 'cn': return fetchData('I18nTextTable_CN.json');
    case 'tc': return fetchData('I18nTextTable_TC.json');
    case 'jp': return fetchData('I18nTextTable_JP.json');
    case 'kr': return fetchData('I18nTextTable_KR.json');
    default: return null;
  }
}

export function resolveI18n(node: any, dict: Record<string, string>): any {
  if (node == null) return node

  if (Array.isArray(node)) {
    return node.map(item => resolveI18n(item, dict));
  }

  if (typeof node === 'object') {
    if (
      Object.keys(node).length === 2 &&
      Object.hasOwn(node, 'id') &&
      Object.hasOwn(node, 'text')
    ) {
      return dict[node.id] || '';
    }

    const result: Record<string, any> = {};
    for (const key of Object.keys(node)) {
      result[key] = resolveI18n(node[key], dict);
    }
    return result;
  }

  return node;
}
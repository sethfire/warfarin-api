import { Hono } from 'hono'
import { API_VERSION, Bindings, CACHE_TTL, GAME_VERSION, SUPPORTED_LANGUAGES } from '../config'
import { fetchData, fetchI18nTextTable, resolveI18n } from '../services/data'

const app = new Hono<{ Bindings: Bindings }>()

app.get(`/v1/:lang/facilities`, async (c) => {
  const lang: string = c.req.param('lang')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${API_VERSION}/${GAME_VERSION}/${lang}/facilities`, 'json')
  if (cache) return c.json(cache)

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)

  const factoryBuildingTable: any = await fetchData('FactoryBuildingTable.json')
  if (!factoryBuildingTable) return c.json({ error: 'Internal Server Error' }, 500)

  const factoryBuildingItemReverseTable: any = await fetchData('FactoryBuildingItemReverseTable.json')
  if (!factoryBuildingItemReverseTable) return c.json({ error: 'Internal Server Error' }, 500)

  const itemTable: any = await fetchData('ItemTable.json')
  if (!itemTable) return c.json({ error: 'Internal Server Error' }, 500)

  const facilities = Object.entries(factoryBuildingTable).map(([key, value]: [string, any]) => {
    const item = itemTable[factoryBuildingItemReverseTable[value.id]?.itemId];
    const icon = item ? item.iconId : null;
    const rarity = item ? item.rarity : null;

    return {
      slug: value.id,
      id: value.id,
      name: resolveI18n(value.name, i18nDict),
      icon: icon,
      quickBarType: value.quickBarType,
      type: value.type,
      rarity: rarity,
    };
  });

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${API_VERSION}/${GAME_VERSION}/${lang}/facilities`, JSON.stringify(facilities), { expirationTtl: CACHE_TTL })
  )

  return c.json(facilities)
})

app.get(`/v1/:lang/facilities/:slug`, async (c) => {
  const lang: string = c.req.param('lang')
  const slug: string = c.req.param('slug')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${API_VERSION}/${GAME_VERSION}/${lang}/facilities/${slug}`, 'json')
  if (cache) return c.json(cache)

  const factoryBuildingTable: any = await fetchData('FactoryBuildingTable.json')
  if (!factoryBuildingTable) return c.json({ error: 'Internal Server Error' }, 500)

  const facility = factoryBuildingTable[slug]
  if (!facility) return c.notFound()

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)

  const factoryMachineCraftTable: any = await fetchData('FactoryMachineCraftTable.json')
  if (!factoryMachineCraftTable) return c.json({ error: 'Internal Server Error' }, 500)
  const recipes = Object.values(factoryMachineCraftTable).filter(
    (recipe: any) => recipe.machineId === facility.id
  );

  const payload = {
    summary: {
      slug: slug,
      id: facility.id,
      name: resolveI18n(facility.name, i18nDict),
      lang: lang,
      type: 'facility',
      version: GAME_VERSION,
    },
    'factoryBuildingTable': resolveI18n(facility, i18nDict),
    'factoryMachineCraftTable': resolveI18n(recipes, i18nDict),
  }

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${API_VERSION}/${GAME_VERSION}/${lang}/facilities/${slug}`, JSON.stringify(payload), { expirationTtl: CACHE_TTL })
  )

  return c.json(payload)
})

export default app
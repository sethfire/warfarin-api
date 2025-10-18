import { Hono } from 'hono'
import { API_VERSION, Bindings, GAME_VERSION, SUPPORTED_LANGUAGES } from '../config'
import { fetchData, fetchI18nTextTable, resolveI18n } from '../services/data'

const app = new Hono<{ Bindings: Bindings }>()

app.get(`/v1/:lang/items`, async (c) => {
  const lang: string = c.req.param('lang')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${API_VERSION}/${GAME_VERSION}/${lang}/items`, 'json')
  if (cache) return c.json(cache)

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)

  const itemTable: any = await fetchData('ItemTable.json')
  if (!itemTable) return c.json({ error: 'Internal Server Error' }, 500)

  const itemTypeTable: any = await fetchData('ItemTypeTable.json')
  if (!itemTypeTable) return c.json({ error: 'Internal Server Error' }, 500)

  const items = Object.values(itemTable).map((value: any) => ({
    slug: value.id,
    id: value.id,
    name: resolveI18n(value.name, i18nDict),
    iconId: value.iconId,
    rarity: value.rarity,
    type: value.type,
    typeName: resolveI18n(itemTypeTable[value.type].name, i18nDict),
  }))

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${API_VERSION}/${GAME_VERSION}/${lang}/items`, JSON.stringify(items), { expirationTtl: 24 * 60 * 60 * 30 })
  )

  return c.json(items)
})

app.get(`/v1/:lang/items/:slug`, async (c) => {
  const lang: string = c.req.param('lang')
  const slug: string = c.req.param('slug')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${API_VERSION}/${GAME_VERSION}/${lang}/items/${slug}`, 'json')
  if (cache) return c.json(cache)

  const itemTable: any = await fetchData('ItemTable.json')
  if (!itemTable) return c.json({ error: 'Internal Server Error' }, 500)

  const item = itemTable[slug]
  if (!item) return c.notFound()

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)

  const itemTypeTable: any = await fetchData('ItemTypeTable.json')
  if (!itemTypeTable) return c.json({ error: 'Internal Server Error' }, 500)

  const itemType = itemTypeTable[item.type]

  const factoryItemAsMachineCrafterIncomeTable: any = await fetchData('FactoryItemAsMachineCrafterIncomeTable.json')
  if (!factoryItemAsMachineCrafterIncomeTable) return c.json({ error: 'Internal Server Error' }, 500)

  const factoryItemAsMachineCrafterOutcomeTable: any = await fetchData('FactoryItemAsMachineCrafterOutcomeTable.json')
  if (!factoryItemAsMachineCrafterOutcomeTable) return c.json({ error: 'Internal Server Error' }, 500)

  const factoryMachineCraftTable: any = await fetchData('FactoryMachineCraftTable.json')
  if (!factoryMachineCraftTable) return c.json({ error: 'Internal Server Error' }, 500)

  const listOfIncomes = factoryItemAsMachineCrafterIncomeTable[slug]?.list
  const listOfOutcomes = factoryItemAsMachineCrafterOutcomeTable[slug]?.list

  const inFactoryMachineCraftTable = listOfIncomes ? listOfIncomes.map((craftId: string) => factoryMachineCraftTable[craftId]) || [] : []
  const outFactoryMachineCraftTable = listOfOutcomes ? listOfOutcomes.map((craftId: string) => factoryMachineCraftTable[craftId]) || [] : []

  const payload = {
    summary: {
      slug: slug,
      id: item.id,
      name: resolveI18n(item.name, i18nDict),
      lang: lang,
      type: 'item',
      version: GAME_VERSION,
    },
    'itemTable': resolveI18n(item, i18nDict),
    'itemTypeTable': resolveI18n(itemType, i18nDict),
    'inFactoryMachineCraftTable': resolveI18n(inFactoryMachineCraftTable, i18nDict),
    'outFactoryMachineCraftTable': resolveI18n(outFactoryMachineCraftTable, i18nDict),
  }

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${API_VERSION}/${GAME_VERSION}/${lang}/items/${slug}`, JSON.stringify(payload), { expirationTtl: 24 * 60 * 60 * 30 })
  )

  return c.json(payload)
})

export default app
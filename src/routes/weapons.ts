import { Hono } from 'hono'
import { API_VERSION, Bindings, CACHE_TTL, GAME_VERSION, SUPPORTED_LANGUAGES, TEMP_WEAPON_LIST } from '../config'
import { fetchData, fetchI18nTextTable, resolveI18n } from '../services/data'
import slugify from 'slugify'

const app = new Hono<{ Bindings: Bindings }>()

app.get(`/v1/:lang/weapons`, async (c) => {
  const lang: string = c.req.param('lang')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${API_VERSION}/${GAME_VERSION}/${lang}/weapons`, 'json')
  if (cache) return c.json(cache)

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)
    
  const weaponBasicTable: any = await fetchData('WeaponBasicTable.json')
  if (!weaponBasicTable) return c.json({ error: 'Internal Server Error' }, 500)

  const itemTable: any = await fetchData('ItemTable.json')
  if (!itemTable) return c.json({ error: 'Internal Server Error' }, 500)

  const weapons = Object.values(weaponBasicTable).map((value: any) => ({
    slug: slugify(resolveI18n(value.engName, i18nDict), { lower: true, strict: true }),
    id: value.weaponId,
    name: resolveI18n(itemTable[value.weaponId].name, i18nDict),
    rarity: itemTable[value.weaponId].rarity,
    iconId: itemTable[value.weaponId].iconId,
    weaponType: value.weaponType,
  }))

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${API_VERSION}/${GAME_VERSION}/${lang}/weapons`, JSON.stringify(weapons), { expirationTtl: CACHE_TTL })
  )

  return c.json(weapons)
})

app.get(`/v1/:lang/weapons/:slug`, async (c) => {
  const lang: string = c.req.param('lang')
  const slug: string = c.req.param('slug')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${API_VERSION}/${GAME_VERSION}/${lang}/weapons/${slug}`, 'json')
  if (cache) return c.json(cache)

  if (!(slug in TEMP_WEAPON_LIST)) return c.notFound()
  const weaponId = TEMP_WEAPON_LIST[slug]

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)
    
  const weaponBasicTable: any = await fetchData('WeaponBasicTable.json')
  if (!weaponBasicTable) return c.json({ error: 'Internal Server Error' }, 500)
    
  const itemTable: any = await fetchData('ItemTable.json')
  if (!itemTable) return c.json({ error: 'Internal Server Error' }, 500)

  const weapon = weaponBasicTable[weaponId]
  if (!weapon) return c.notFound()

  const item = itemTable[weaponId]
  if (!item) return c.notFound()

  const payload = {
    summary: {
      slug: slug,
      id: weapon.weaponId,
      name: resolveI18n(item.name, i18nDict),
      lang: lang,
      type: 'weapon',
      version: GAME_VERSION,
    },
    'weaponBasicTable': resolveI18n(weapon, i18nDict),
    'itemTable': resolveI18n(item, i18nDict),
  }

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${API_VERSION}/${GAME_VERSION}/${lang}/weapons/${slug}`, JSON.stringify(payload), { expirationTtl: CACHE_TTL })
  )

  return c.json(payload)
})

export default app
import { Hono } from 'hono'
import { API_VERSION, Bindings, CACHE_TTL, GAME_VERSION, SUPPORTED_LANGUAGES } from '../config'
import { fetchData, fetchI18nTextTable, resolveI18n } from '../services/data'

const app = new Hono<{ Bindings: Bindings }>()

app.get(`/v1/:lang/lore`, async (c) => {
  const lang: string = c.req.param('lang')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${API_VERSION}/${GAME_VERSION}/${lang}/lore`, 'json')
  if (cache) return c.json(cache)

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)
    
  const richContentTable: any = await fetchData('RichContentTable.json')
  if (!richContentTable) return c.json({ error: 'Internal Server Error' }, 500)

  const lore = Object.entries(richContentTable).map(([key, value]: [string, any]) => ({
    slug: key,
    id: key,
    name: resolveI18n(value.title, i18nDict),
  }))

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${API_VERSION}/${GAME_VERSION}/${lang}/lore`, JSON.stringify(lore), { expirationTtl: CACHE_TTL })
  )

  return c.json(lore)
})

app.get(`/v1/:lang/lore/:slug`, async (c) => {
  const lang: string = c.req.param('lang')
  const slug: string = c.req.param('slug')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${API_VERSION}/${GAME_VERSION}/${lang}/lore/${slug}`, 'json')
  if (cache) return c.json(cache)

  const richContentTable: any = await fetchData('RichContentTable.json')
  if (!richContentTable) return c.json({ error: 'Internal Server Error' }, 500)

  const lore = richContentTable[slug]
  if (!lore) return c.notFound()

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)

  const payload = {
    summary: {
      slug: slug,
      id: slug,
      name: resolveI18n(lore.title, i18nDict),
      lang: lang,
      type: 'lore',
      version: GAME_VERSION,
    },
    'richContentTable': resolveI18n(lore, i18nDict),
  }

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${API_VERSION}/${GAME_VERSION}/${lang}/lore/${slug}`, JSON.stringify(payload), { expirationTtl: CACHE_TTL })
  )

  return c.json(payload)
})

export default app
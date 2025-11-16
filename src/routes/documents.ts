import { Hono } from 'hono'
import { API_VERSION, Bindings, CACHE_TTL, GAME_VERSION, SUPPORTED_LANGUAGES } from '../config'
import { fetchData, fetchI18nTextTable, resolveI18n } from '../services/data'

const app = new Hono<{ Bindings: Bindings }>()

app.get(`/v1/:lang/documents`, async (c) => {
  const lang: string = c.req.param('lang')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${API_VERSION}/${GAME_VERSION}/${lang}/documents`, 'json')
  if (cache) return c.json(cache)

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)

  const prtsDocument: any = await fetchData('PrtsDocument.json')
  if (!prtsDocument) return c.json({ error: 'Internal Server Error' }, 500)

  const documents = Object.entries(prtsDocument).map(([key, value]: [string, any]) => ({
    slug: key,
    id: key,
    name: resolveI18n(value.name, i18nDict),
  }))

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${API_VERSION}/${GAME_VERSION}/${lang}/documents`, JSON.stringify(documents), { expirationTtl: CACHE_TTL })
  )

  return c.json(documents)
})

app.get(`/v1/:lang/documents/:slug`, async (c) => {
  const lang: string = c.req.param('lang')
  const slug: string = c.req.param('slug')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${API_VERSION}/${GAME_VERSION}/${lang}/documents/${slug}`, 'json')
  if (cache) return c.json(cache)

  const prtsDocument: any = await fetchData('PrtsDocument.json')
  if (!prtsDocument) return c.json({ error: 'Internal Server Error' }, 500)

  const richContentTable: any = await fetchData('RichContentTable.json')
  if (!richContentTable) return c.json({ error: 'Internal Server Error' }, 500)

  const document = prtsDocument[slug]
  if (!document) return c.notFound()

  const lore = richContentTable[document.contentId]
  if (!lore) return c.notFound()

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)

  const payload = {
    summary: {
      slug: slug,
      id: slug,
      name: resolveI18n(lore.title, i18nDict),
      lang: lang,
      type: 'document',
      version: GAME_VERSION,
    },
    'prtsDocument': resolveI18n(document, i18nDict),
    'richContentTable': resolveI18n(lore, i18nDict),
  }

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${API_VERSION}/${GAME_VERSION}/${lang}/documents/${slug}`, JSON.stringify(payload), { expirationTtl: CACHE_TTL })
  )

  return c.json(payload)
})

export default app
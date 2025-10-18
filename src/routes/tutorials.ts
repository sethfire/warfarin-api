import { Hono } from 'hono'
import { API_VERSION, Bindings, CACHE_TTL, GAME_VERSION, SUPPORTED_LANGUAGES } from '../config'
import { fetchData, fetchI18nTextTable, resolveI18n } from '../services/data'

const app = new Hono<{ Bindings: Bindings }>()

app.get(`/v1/:lang/tutorials`, async (c) => {
  const lang: string = c.req.param('lang')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache_key = `${API_VERSION}/${GAME_VERSION}/${lang}/tutorials`
  const cache = await c.env.WARFARIN_EFDATA.get(cache_key, 'json')
  if (cache) return c.json(cache)

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)

  const wikiTutorialPageByEntryTable: any = await fetchData('WikiTutorialPageByEntryTable.json')
  if (!wikiTutorialPageByEntryTable) return c.json({ error: 'Internal Server Error' }, 500)

  const wikiTutorialPageTable: any = await fetchData('WikiTutorialPageTable.json')
  if (!wikiTutorialPageTable) return c.json({ error: 'Internal Server Error' }, 500)

  const tutorials: any[] = []
  Object.entries(wikiTutorialPageByEntryTable).forEach(([key, value]: [string, any]) => {
    try {
      const firstPageId = value.pageIds[0]
      const firstPage = wikiTutorialPageTable[firstPageId]
      let name = resolveI18n(firstPage.title, i18nDict)
      name = name.replace(/ \(1\)$/,'')
      tutorials.push({
        slug: key,
        id: key,
        name: name,
        order: firstPage.order
      })
    } catch (e) {
      console.error(`Error processing tutorial entry ${key}:`, e)
      return
    }
  })

  c.executionCtx.waitUntil(c.env.WARFARIN_EFDATA.put(cache_key, JSON.stringify(tutorials), { expirationTtl: CACHE_TTL }))

  return c.json(tutorials)
})

app.get(`/v1/:lang/tutorials/:slug`, async (c) => {
  const lang: string = c.req.param('lang')
  const slug: string = c.req.param('slug')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache_key = `${API_VERSION}/${GAME_VERSION}/${lang}/tutorials/${slug}`
  const cache = await c.env.WARFARIN_EFDATA.get(cache_key, 'json')
  if (cache) return c.json(cache)

  const wikiTutorialPageByEntryTable: any = await fetchData('WikiTutorialPageByEntryTable.json')
  if (!wikiTutorialPageByEntryTable) return c.json({ error: 'Internal Server Error' }, 500)

  const tutorial = wikiTutorialPageByEntryTable[slug]
  if (!tutorial) return c.notFound()

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)

  const wikiTutorialPageTable: any = await fetchData('WikiTutorialPageTable.json')
  if (!wikiTutorialPageTable) return c.json({ error: 'Internal Server Error' }, 500)

  const tutorialPages = tutorial.pageIds.reduce((acc: Record<string, any>, pageId: string) => {
    const page = wikiTutorialPageTable[pageId]
    if (page) acc[pageId] = resolveI18n(page, i18nDict)
    return acc
  }, {})

  const firstPageId = tutorial.pageIds[0]
  const firstPage = wikiTutorialPageTable[firstPageId]
  let name = resolveI18n(firstPage.title, i18nDict)
  name = name.replace(/ \(1\)$/,'')

  const payload = {
    summary: {
      slug: slug,
      id: slug,
      name: name,
      lang: lang,
      type: 'tutorial',
      version: GAME_VERSION,
    },
    'WikiTutorialPageByEntryTable': resolveI18n(tutorial, i18nDict),
    'wikiTutorialPageTable': resolveI18n(tutorialPages, i18nDict),
  }

  c.executionCtx.waitUntil(c.env.WARFARIN_EFDATA.put(cache_key, JSON.stringify(payload), { expirationTtl: CACHE_TTL }))
  return c.json(payload)
})

export default app
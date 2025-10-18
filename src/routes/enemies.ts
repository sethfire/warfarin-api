import { Hono } from 'hono'
import { API_VERSION, Bindings, GAME_VERSION, SUPPORTED_LANGUAGES } from '../config'
import { fetchData, fetchI18nTextTable, resolveI18n } from '../services/data'

const app = new Hono<{ Bindings: Bindings }>()

app.get(`/v1/:lang/enemies`, async (c) => {
  const lang: string = c.req.param('lang')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${API_VERSION}/${GAME_VERSION}/${lang}/enemies`, 'json')
  if (cache) return c.json(cache)

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)
    
  const enemyTemplateDisplayInfoTable: any = await fetchData('EnemyTemplateDisplayInfoTable.json')
  if (!enemyTemplateDisplayInfoTable) return c.json({ error: 'Internal Server Error' }, 500)

  const enemies = Object.values(enemyTemplateDisplayInfoTable).map((value: any) => ({
    slug: value.templateId,
    id: value.templateId,
    name: resolveI18n(value.name, i18nDict),
    displayType: value.displayType,
  }))

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${API_VERSION}/${GAME_VERSION}/${lang}/enemies`, JSON.stringify(enemies), { expirationTtl: 24 * 60 * 60 * 30 })
  )

  return c.json(enemies)
})

app.get(`/v1/:lang/enemies/:slug`, async (c) => {
  const lang: string = c.req.param('lang')
  const slug: string = c.req.param('slug')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${API_VERSION}/${GAME_VERSION}/${lang}/enemies/${slug}`, 'json')
  if (cache) return c.json(cache)

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)
    
  const enemyTemplateDisplayInfoTable: any = await fetchData('EnemyTemplateDisplayInfoTable.json')
  if (!enemyTemplateDisplayInfoTable) return c.json({ error: 'Internal Server Error' }, 500)

  const enemy = enemyTemplateDisplayInfoTable[slug]
  if (!enemy) return c.notFound()

  const enemyAttributeTemplateTable: any = await fetchData('EnemyAttributeTemplateTable.json')
  if (!enemyAttributeTemplateTable) return c.json({ error: 'Internal Server Error' }, 500)
    
  const enemyStats = enemyAttributeTemplateTable[slug]
  if (!enemyStats) return c.notFound()
    
  const enemyAbilityDescTable: any = await fetchData('EnemyAbilityDescTable.json')
  if (!enemyAbilityDescTable) return c.json({ error: 'Internal Server Error' }, 500)

  const abilities = enemy.abilityDescIds.reduce((acc: Record<string, any>, id: string) => {
    const desc = enemyAbilityDescTable[id]
    if (desc) acc[id] = resolveI18n(desc, i18nDict)
    return acc
  }, {})

  const payload = {
    summary: {
      slug: slug,
      id: enemy.templateId,
      name: resolveI18n(enemy.name, i18nDict),
      lang: lang,
      type: 'enemy',
      version: GAME_VERSION,
    },
    'enemyTemplateDisplayInfoTable': resolveI18n(enemy, i18nDict),
    'enemyAttributeTemplateTable': resolveI18n(enemyStats, i18nDict),
    'enemyAbilityDescTable': abilities,
  }

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${API_VERSION}/${GAME_VERSION}/${lang}/enemies/${slug}`, JSON.stringify(payload), { expirationTtl: 24 * 60 * 60 * 30 })
  )

  return c.json(payload)
})

export default app
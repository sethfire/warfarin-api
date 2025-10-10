import { Hono } from 'hono'
import slugify from 'slugify'
import { fetchData, resolveI18n, fetchI18nTextTable } from './util'

type Bindings = {
  WARFARIN_EFDATA: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

const SUPPORTED_LANGUAGES = ['en', 'cn', 'jp', 'kr', 'tc']
const CURRENT_VERSION = 'cbt2'

const TEMP_CHARACTER_LIST: Record<string, string> = {
  "endministrator": "chr_0003_endminf",
  "perlica": "chr_0004_pelica",
  "chen-qianyu": "chr_0005_chen",
  "wulfgard": "chr_0006_wolfgd",
  "arclight": "chr_0007_ikut",
  "ember": "chr_0009_azrila",
  "xaihi": "chr_0011_seraph",
  "avywenna": "chr_0012_avywen",
  "gilberta": "chr_0013_aglina",
  "snowshine": "chr_0014_aurora",
  "lifeng": "chr_0015_lifeng",
  "laevatain": "chr_0016_laevat",
  "yvonne": "chr_0017_yvonne",
  "da-pan": "chr_0018_dapan",
}

const TEMP_WEAPON_LIST: Record<string, string> = {
  "industry-01": "wpn_claym_0003",
  "exemplar": "wpn_claym_0004",
  "former-finery": "wpn_claym_0006",
  "thunderberge": "wpn_claym_0007",
  "abraxas": "wpn_claym_0008",
  "oathborn": "wpn_claym_0009",
  "darhoff-7": "wpn_claym_0010",
  "never-dull": "wpn_claym_0011",
  "finishing-call": "wpn_claym_0012",
  "hypernova-auto": "wpn_funnel_0001",
  "jiminy-12": "wpn_funnel_0002",
  "florescent-roc": "wpn_funnel_0003",
  "wild-wanderer": "wpn_funnel_0004",
  "stanza-of-memorials": "wpn_funnel_0005",
  "opus-etch-figure": "wpn_funnel_0006",
  "monaihe": "wpn_funnel_0007",
  "chivalric-virtues": "wpn_funnel_0008",
  "oblivion": "wpn_funnel_0009",
  "detonation-unit": "wpn_funnel_0010",
  "pathfinders-beacon": "wpn_lance_0003",
  "chimeric-justice": "wpn_lance_0004",
  "vortex-of-talos": "wpn_lance_0006",
  "rock-auger": "wpn_lance_0007",
  "aggeloslayer": "wpn_lance_0008",
  "opero-77": "wpn_lance_0009",
  "valiant": "wpn_lance_0010",
  "jet": "wpn_lance_0011",
  "mountain-bearer": "wpn_lance_0012",
  "peco-5": "wpn_pistol_0001",
  "howling-guard": "wpn_pistol_0002",
  "long-road": "wpn_pistol_0003",
  "rational-farewell": "wpn_pistol_0004",
  "sculptor-of-time": "wpn_pistol_0005",
  "opus-stress": "wpn_pistol_0006",
  "home-longing": "wpn_pistol_0007",
  "wedge": "wpn_pistol_0008",
  "clannibal": "wpn_pistol_0009",
  "tarr-11": "wpn_sword_0003",
  "sundering-steel": "wpn_sword_0005",
  "the-fifth-heirloom": "wpn_sword_0006",
  "fortmaker": "wpn_sword_0007",
  "contingent-measure": "wpn_sword_0008",
  "grand-finale": "wpn_sword_0009",
  "umbral-torch": "wpn_sword_0010",
  "cerulean-resonance": "wpn_sword_0011",
  "thermite-cutter": "wpn_sword_0012",
  "torrent": "wpn_sword_0013",
  "hearts-content": "wpn_sword_0014"
}

app.get('/', (c) => {
  return c.text('OK')
})

app.get(`/v1/:lang/enemies`, async (c) => {
  const lang: string = c.req.param('lang')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${CURRENT_VERSION}/${lang}/enemies`, 'json')
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
    c.env.WARFARIN_EFDATA.put(`${CURRENT_VERSION}/${lang}/enemies`, JSON.stringify(enemies), { expirationTtl: 24 * 60 * 60 * 30 })
  )

  return c.json(enemies)
})

app.get(`/v1/:lang/enemies/:slug`, async (c) => {
  const lang: string = c.req.param('lang')
  const slug: string = c.req.param('slug')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${CURRENT_VERSION}/${lang}/enemies/${slug}`, 'json')
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
      version: CURRENT_VERSION,
    },
    'enemyTemplateDisplayInfoTable': resolveI18n(enemy, i18nDict),
    'enemyAttributeTemplateTable': resolveI18n(enemyStats, i18nDict),
    'enemyAbilityDescTable': abilities,
  }

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${CURRENT_VERSION}/${lang}/enemies/${slug}`, JSON.stringify(payload), { expirationTtl: 24 * 60 * 60 * 30 })
  )

  return c.json(payload)
})

app.get(`/v1/:lang/weapons`, async (c) => {
  const lang: string = c.req.param('lang')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${CURRENT_VERSION}/${lang}/weapons`, 'json')
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
    c.env.WARFARIN_EFDATA.put(`${CURRENT_VERSION}/${lang}/weapons`, JSON.stringify(weapons), { expirationTtl: 24 * 60 * 60 * 30 })
  )

  return c.json(weapons)
})

app.get(`/v1/:lang/weapons/:slug`, async (c) => {
  const lang: string = c.req.param('lang')
  const slug: string = c.req.param('slug')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${CURRENT_VERSION}/${lang}/weapons/${slug}`, 'json')
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
      version: CURRENT_VERSION,
    },
    'weaponBasicTable': resolveI18n(weapon, i18nDict),
    'itemTable': resolveI18n(item, i18nDict),
  }

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${CURRENT_VERSION}/${lang}/weapons/${slug}`, JSON.stringify(payload), { expirationTtl: 24 * 60 * 60 * 30 })
  )

  return c.json(payload)
})

app.get(`/v1/:lang/operators`, async (c) => {
  const lang: string = c.req.param('lang')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${CURRENT_VERSION}/${lang}/operators`, 'json')
  if (cache) return c.json(cache)

  const i18nDictEN: any = await fetchI18nTextTable('en')
  if (!i18nDictEN) return c.json({ error: 'Internal Server Error' }, 500)

  const i18nDict: any = await fetchI18nTextTable(lang)
  if (!i18nDict) return c.json({ error: 'Internal Server Error' }, 500)

  const rawCharacterTable: any = await fetchData('CharacterTable.json')
  if (!rawCharacterTable) return c.json({ error: 'Internal Server Error' }, 500)

  const characters = Object.values(rawCharacterTable)
    .filter((char: any) => char.charId !== 'chr_0002_endminm')
    .map((char: any) => ({
      slug: slugify(resolveI18n(char.name, i18nDictEN), { lower: true, strict: true }),
      id: char.charId,
      name: resolveI18n(char.name, i18nDict),
      rarity: char.rarity,
      charTypeId: char.charTypeId,
      profession: char.profession,
      weaponType: char.weaponType,
    }))

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${CURRENT_VERSION}/${lang}/operators`, JSON.stringify(characters), { expirationTtl: 24 * 60 * 60 * 30 })
  )

  return c.json(characters)
})

app.get(`/v1/:lang/operators/:slug`, async (c) => {
  const lang: string = c.req.param('lang')
  const slug: string = c.req.param('slug')
  if (!SUPPORTED_LANGUAGES.includes(lang)) return c.notFound()

  const cache = await c.env.WARFARIN_EFDATA.get(`${CURRENT_VERSION}/${lang}/operators/${slug}`, 'json')
  if (cache) return c.json(cache)

  if (!(slug in TEMP_CHARACTER_LIST)) return c.notFound()
  const charId = TEMP_CHARACTER_LIST[slug]

  const [
    i18nDict,
    rawCharacterTable,
    rawCharGrowthTable,
    rawItemTable,
    rawCharacterPotentialTable,
    rawPotentialTalentEffectTable,
    rawCharacterTagDesTable,
    rawCharTypeTable,
    rawCharProfessionTable,
    rawSpaceshipCharSkillTable,
    rawSpaceshipSkillTable,
    rawSkillPatchTable,
  ] = await Promise.all([
    fetchI18nTextTable(lang),
    fetchData('CharacterTable.json'),
    fetchData('CharGrowthTable.json'),
    fetchData('ItemTable.json'),
    fetchData('CharacterPotentialTable.json'),
    fetchData('PotentialTalentEffectTable.json'),
    fetchData('CharacterTagDesTable.json'),
    fetchData('CharTypeTable.json'),
    fetchData('CharProfessionTable.json'),
    fetchData('SpaceshipCharSkillTable.json'),
    fetchData('SpaceshipSkillTable.json'),
    fetchData('SkillPatchTable.json'),
  ])

  if (!i18nDict || !rawCharacterTable) {
    return c.json({ error: 'Internal Server Error' }, 500)
  }

  const char: any = rawCharacterTable[charId]
  if (!char) return c.notFound()

  const resolvedChar = resolveI18n(char, i18nDict)

  const charGrowth = rawCharGrowthTable?.[charId] ? resolveI18n(rawCharGrowthTable[charId], i18nDict) : null
  const item = rawItemTable?.[charId] ? resolveI18n(rawItemTable[charId], i18nDict): null
  const charPotential = rawCharacterPotentialTable?.[charId] ? resolveI18n(rawCharacterPotentialTable[charId], i18nDict) : null
  const charTagDesc = rawCharacterTagDesTable?.[charId]? resolveI18n(rawCharacterTagDesTable[charId], i18nDict) : null
  const charType = rawCharTypeTable?.[char.charTypeId] ? resolveI18n(rawCharTypeTable[char.charTypeId], i18nDict) : null
  const charProfession = rawCharProfessionTable?.[char.profession] ? resolveI18n(rawCharProfessionTable[char.profession], i18nDict) : null
  const charSpaceshipSkills = rawSpaceshipCharSkillTable?.[char.charId] ? resolveI18n(rawSpaceshipCharSkillTable[char.charId], i18nDict) : null

  const potentials: Record<string, any> = {}
  if (char.charId === 'chr_0003_endminf') {
    Object.entries(rawPotentialTalentEffectTable)
      .filter(([key]) => key.startsWith('chr_0003_endminf') || key.startsWith('chr_0002_endminm'))
      .forEach(([key, value]) => potentials[key] = resolveI18n(value, i18nDict))
  } else {
    Object.entries(rawPotentialTalentEffectTable)
      .filter(([key]) => key.startsWith(char.charId))
      .forEach(([key, value]) => potentials[key] = resolveI18n(value, i18nDict))
  }

  const skillPatchTable: Record<string, any> = {}
  Object.entries(rawSkillPatchTable)
    .filter(([key]) => key.startsWith(char.charId))
    .forEach(([key, value]) => skillPatchTable[key] = resolveI18n(value, i18nDict))

  const spaceshipskilltable: Record<string, any> = {}
  if (charSpaceshipSkills && Array.isArray(charSpaceshipSkills.skillList)) {
    charSpaceshipSkills.skillList.forEach((skill: any) => {
      spaceshipskilltable[skill.skillId] = resolveI18n(rawSpaceshipSkillTable[skill.skillId], i18nDict)
    })
  }

  const payload = {
    summary: {
      slug,
      id: charId,
      name: resolveI18n(char.name, i18nDict),
      lang,
      type: 'operator',
      version: CURRENT_VERSION,
    },
    characterTable: resolvedChar,
    charGrowthTable: charGrowth,
    itemTable: item,
    characterPotentialTable: charPotential,
    potentialTalentEffectTable: potentials,
    charTagDesTable: charTagDesc,
    charTypeTable: charType,
    charProfessionTable: charProfession,
    skillPatchTable,
    spaceshipCharSkillTable: charSpaceshipSkills,
    spaceshipSkillTable: spaceshipskilltable,
  }

  c.executionCtx.waitUntil(
    c.env.WARFARIN_EFDATA.put(`${CURRENT_VERSION}/${lang}/operators/${slug}`, JSON.stringify(payload), { expirationTtl: 24 * 60 * 60 * 30 })
  )

  return c.json(payload)
})

export default app

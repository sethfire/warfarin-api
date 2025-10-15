import { Hono } from 'hono'
import { Bindings, CURRENT_VERSION, SUPPORTED_LANGUAGES, TEMP_CHARACTER_LIST } from '../config'
import { fetchData, fetchI18nTextTable, resolveI18n } from '../services/data'
import slugify from 'slugify'

const app = new Hono<{ Bindings: Bindings }>()

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
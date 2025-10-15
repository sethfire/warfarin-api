export type Bindings = {
  WARFARIN_EFDATA: KVNamespace
}

export const DATA_URL = 'https://data.warfarin.wiki'
export const DATA_VERSION = 'v1'

export const SUPPORTED_LANGUAGES = ['en', 'cn', 'jp', 'kr', 'tc']
export const CURRENT_VERSION = 'cbt2'

// Cache TTL: 30 days
export const CACHE_TTL = 24 * 60 * 60 * 30

export const TEMP_CHARACTER_LIST: Record<string, string> = {
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

export const TEMP_WEAPON_LIST: Record<string, string> = {
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
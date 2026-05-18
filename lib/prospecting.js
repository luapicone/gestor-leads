import { JSDOM } from 'jsdom'
import seedProspects from '../data/prospects-seed.json' with { type: 'json' }

export const DEFAULT_COUNTRIES = [
  'España',
  'México',
  'Argentina',
  'Chile',
  'Perú',
  'Colombia'
]

export const ALL_COUNTRIES = [
  'España',
  'México',
  'Argentina',
  'Chile',
  'Perú',
  'Colombia',
  'Uruguay',
  'Paraguay',
  'Ecuador',
  'Panamá',
  'Estados Unidos',
  'Reino Unido',
  'Canadá',
  'Australia',
  'Nueva Zelanda',
  'Irlanda',
  'Sudáfrica',
  'Singapur'
]

const COUNTRY_META = {
  España: { searchLabel: 'Spain', locale: 'es-ES,es;q=0.9,en;q=0.7', preferredMarket: true },
  México: { searchLabel: 'Mexico', locale: 'es-MX,es;q=0.9,en;q=0.7', preferredMarket: true },
  Argentina: { searchLabel: 'Argentina', locale: 'es-AR,es;q=0.9,en;q=0.7', preferredMarket: true },
  Chile: { searchLabel: 'Chile', locale: 'es-CL,es;q=0.9,en;q=0.7', preferredMarket: true },
  Perú: { searchLabel: 'Peru', locale: 'es-PE,es;q=0.9,en;q=0.7', preferredMarket: true },
  Colombia: { searchLabel: 'Colombia', locale: 'es-CO,es;q=0.9,en;q=0.7', preferredMarket: true },
  Uruguay: { searchLabel: 'Uruguay', locale: 'es-UY,es;q=0.9,en;q=0.7', preferredMarket: true },
  Paraguay: { searchLabel: 'Paraguay', locale: 'es-PY,es;q=0.9,en;q=0.7', preferredMarket: true },
  Ecuador: { searchLabel: 'Ecuador', locale: 'es-EC,es;q=0.9,en;q=0.7', preferredMarket: true },
  Panamá: { searchLabel: 'Panama', locale: 'es-PA,es;q=0.9,en;q=0.7', preferredMarket: true },
  'Estados Unidos': { searchLabel: 'United States', locale: 'en-US,en;q=0.9,es;q=0.5', preferredMarket: true },
  'Reino Unido': { searchLabel: 'United Kingdom', locale: 'en-GB,en;q=0.9,es;q=0.5', preferredMarket: true },
  'Canadá': { searchLabel: 'Canada', locale: 'en-CA,en;q=0.9,fr;q=0.4,es;q=0.3', preferredMarket: true },
  Australia: { searchLabel: 'Australia', locale: 'en-AU,en;q=0.9,es;q=0.4', preferredMarket: true },
  'Nueva Zelanda': { searchLabel: 'New Zealand', locale: 'en-NZ,en;q=0.9,es;q=0.4', preferredMarket: true },
  Irlanda: { searchLabel: 'Ireland', locale: 'en-IE,en;q=0.9,es;q=0.4', preferredMarket: true },
  'Sudáfrica': { searchLabel: 'South Africa', locale: 'en-ZA,en;q=0.9,es;q=0.4', preferredMarket: true },
  Singapur: { searchLabel: 'Singapore', locale: 'en-SG,en;q=0.9,es;q=0.4', preferredMarket: true }
}

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const stopHosts = [
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'youtube.com',
  'x.com',
  'twitter.com',
  'wikipedia.org',
  'wikidata.org',
  'clutch.co',
  'goodfirms.co',
  'sortlist.com',
  'yelp.',
  'tripadvisor.',
  'justdial.com',
  'yellowpages.',
  'mapquest.com',
  'f6s.com',
  'builtin',
  'crunchbase.com',
  'glassdoor.',
  'indeed.',
  'zoominfo.com',
  'dnb.com',
  'kompass.com'
]

function getCountryMeta(country) {
  return COUNTRY_META[country] || {
    searchLabel: country,
    locale: 'en-US,en;q=0.9,es;q=0.5',
    preferredMarket: false
  }
}

function tokenize(text = '') {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
}

function buildIndustryTokens(industry = '') {
  return [...new Set(tokenize(industry))]
}

function hasIndustryMatch(text, industryTokens) {
  if (!industryTokens.length) return true
  const haystack = tokenize(text)
  return industryTokens.some((token) => haystack.includes(token))
}

function clampLimit(limit) {
  return Math.max(1, Math.min(Number(limit) || 12, 30))
}

export async function fetchText(url, extraHeaders = {}) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'cache-control': 'no-cache',
      ...extraHeaders
    }
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

export function normalizeWhitespace(text = '') {
  return text.replace(/\s+/g, ' ').trim()
}

export function dedupeByUrl(items) {
  const seen = new Set()
  return items.filter((item) => {
    const key = item.website || item.url
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function searchSeed(country, city = '', industry = '') {
  const cityFilter = city.trim().toLowerCase()
  const industryTokens = buildIndustryTokens(industry)

  return seedProspects
    .filter((item) => item.country === country)
    .filter((item) => !cityFilter || `${item.city || ''} ${item.name} ${item.snippet || ''}`.toLowerCase().includes(cityFilter))
    .filter((item) => hasIndustryMatch(`${item.name} ${item.snippet || ''}`, industryTokens))
    .map((item) => ({
      title: item.name,
      url: item.website,
      snippet: item.snippet || '',
      city: item.city || '',
      source: 'seed'
    }))
}

function buildSearchQuery(country, city = '', industry = '') {
  const { searchLabel } = getCountryMeta(country)
  const industryLabel = industry.trim() || 'business'
  return [industryLabel, city.trim(), searchLabel, 'official website company']
    .filter(Boolean)
    .join(' ')
}

export async function searchDuckDuckGo(country, city = '', industry = '') {
  const { locale } = getCountryMeta(country)
  const query = buildSearchQuery(country, city, industry)
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  const html = await fetchText(url, { 'accept-language': locale })
  const dom = new JSDOM(html)

  return [...dom.window.document.querySelectorAll('.result')]
    .map((node) => {
      const title = normalizeWhitespace(node.querySelector('.result__title')?.textContent || '')
      const rawUrl = node.querySelector('.result__title a')?.href || ''
      const snippet = normalizeWhitespace(node.querySelector('.result__snippet')?.textContent || '')
      return {
        title,
        url: rawUrl,
        snippet,
        city,
        source: 'duckduckgo'
      }
    })
    .filter((item) => item.title && item.url)
}

export async function searchWeb(country, city = '', industry = '') {
  const [seedResults, webResults] = await Promise.allSettled([
    searchSeed(country, city, industry),
    searchDuckDuckGo(country, city, industry)
  ])

  const merged = []
  if (seedResults.status === 'fulfilled') merged.push(...seedResults.value)
  if (webResults.status === 'fulfilled') merged.push(...webResults.value)

  if (!merged.length) {
    const firstError = [seedResults, webResults].find((result) => result.status === 'rejected')
    if (firstError?.status === 'rejected') throw firstError.reason
  }

  return merged
}

export function extractWebsite(rawUrl) {
  try {
    const parsed = new URL(rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl)
    const redirected = parsed.searchParams.get('uddg')
    if (redirected) return extractWebsite(decodeURIComponent(redirected))
    if (stopHosts.some((host) => parsed.hostname.includes(host))) return null
    return `${parsed.protocol}//${parsed.hostname}`
  } catch {
    return null
  }
}

export function buildSignals(analysis) {
  const signals = []
  if (!analysis.hasWhatsapp) signals.push('No se detectó WhatsApp visible')
  if (!analysis.hasContactForm) signals.push('No se detectó formulario de contacto')
  if (!analysis.hasProjectGallery) signals.push('No se ve una galería o portfolio fuerte')
  if (!analysis.hasBrochure) signals.push('No ofrece brochure, dossier o PDF visible')
  if (!analysis.hasMap) signals.push('No se detecta mapa o ubicación clara')
  if (analysis.isLikelyOldWebsite) signals.push('La web parece visualmente simple o antigua')
  return signals
}

export function scoreAnalysis(analysis) {
  let score = 0
  if (!analysis.hasWhatsapp) score += 2
  if (!analysis.hasContactForm) score += 2
  if (!analysis.hasProjectGallery) score += 2
  if (!analysis.hasBrochure) score += 1
  if (!analysis.hasMap) score += 1
  if (analysis.isLikelyOldWebsite) score += 3
  if (analysis.isPreferredMarket) score += 1
  const tier = score >= 8 ? 'A' : score >= 5 ? 'B' : 'C'
  return { score, tier }
}

export function draftMessage(prospect, industry = '') {
  const featureList = [
    'diseño premium y moderno',
    'presentación clara de servicios',
    'portfolio o casos reales',
    'brochure descargable',
    'WhatsApp y contacto directo',
    'estructura enfocada en captar leads'
  ]

  const reasons = prospect.signals.slice(0, 3).join(', ').toLowerCase()
  const industryLine = industry
    ? `para empresas de ${industry}`
    : 'para empresas de su rubro'

  return `Hola ${prospect.name || ''}, estuve viendo la web de ${prospect.name || 'su empresa'} y noté una oportunidad clara de mejora: ${reasons || 'la presentación digital hoy quedó bastante básica para el nivel del servicio que ofrecen'}. Nosotros desarrollamos sitios ${industryLine} con una experiencia mucho más premium, con ${featureList.join(', ')}. Si les interesa, les puedo mostrar una propuesta visual adaptada a su marca y a lo que venden.`
}

export function isRelevantToIndustry(prospect, industry = '') {
  const industryTokens = buildIndustryTokens(industry)
  if (!industryTokens.length) return true

  const haystack = [
    prospect.name,
    prospect.snippet,
    prospect.analysis?.title,
    prospect.analysis?.metaDescription,
    prospect.analysis?.pagePreview
  ]
    .filter(Boolean)
    .join(' ')

  const host = (() => {
    try {
      return new URL(prospect.website).hostname.toLowerCase()
    } catch {
      return ''
    }
  })()

  if (/(\.gob\.|\.gov$|museum|wikipedia|wikidata)/.test(`${host} ${haystack.toLowerCase()}`)) return false

  return hasIndustryMatch(haystack, industryTokens)
}

export async function analyzeWebsite(website, country) {
  try {
    const html = await fetchText(website, { 'accept-language': getCountryMeta(country).locale })
    const dom = new JSDOM(html)
    const text = normalizeWhitespace(dom.window.document.body?.textContent || '')
    const lower = text.toLowerCase()
    const forms = dom.window.document.querySelectorAll('form').length
    const images = dom.window.document.querySelectorAll('img').length
    const navLinks = [...dom.window.document.querySelectorAll('a')].map((a) => normalizeWhitespace(a.textContent || '').toLowerCase())
    const hasContactForm =
      forms > 0 || ['contacto', 'contact', 'enviar', 'send', 'message'].some((term) => lower.includes(term))
    const hasWhatsapp = html.toLowerCase().includes('whatsapp') || html.toLowerCase().includes('wa.me')
    const hasProjectGallery =
      images >= 12 || ['proyectos', 'galería', 'obras', 'portfolio', 'projects', 'case studies', 'work'].some((term) => lower.includes(term))
    const hasBrochure =
      html.toLowerCase().includes('.pdf') || ['brochure', 'descargar', 'download', 'company profile'].some((term) => lower.includes(term))
    const hasMap =
      html.toLowerCase().includes('google.com/maps') ||
      ['ubicación', 'mapa', 'location', 'find us', 'dirección', 'address'].some((term) => lower.includes(term))
    const isLikelyOldWebsite = !html.toLowerCase().includes('viewport') || navLinks.length < 4 || text.length < 1200
    const title = normalizeWhitespace(dom.window.document.title || '')
    const metaDescription = normalizeWhitespace(
      dom.window.document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
    )

    return {
      title,
      metaDescription,
      hasContactForm,
      hasWhatsapp,
      hasProjectGallery,
      hasBrochure,
      hasMap,
      isLikelyOldWebsite,
      isPreferredMarket: getCountryMeta(country).preferredMarket,
      pagePreview: text.slice(0, 320)
    }
  } catch (error) {
    return {
      title: '',
      metaDescription: '',
      hasContactForm: false,
      hasWhatsapp: false,
      hasProjectGallery: false,
      hasBrochure: false,
      hasMap: false,
      isLikelyOldWebsite: true,
      isPreferredMarket: getCountryMeta(country).preferredMarket,
      pagePreview: `No se pudo analizar la web: ${error.message}`,
      failed: true
    }
  }
}

export async function searchProspects({ countries = DEFAULT_COUNTRIES, city = '', industry = '', limit = 12 } = {}) {
  const safeCountries = countries.filter((country) => ALL_COUNTRIES.includes(country))
  const selectedCountries = safeCountries.length ? safeCountries : DEFAULT_COUNTRIES
  const safeLimit = clampLimit(limit)
  const trimmedIndustry = industry.trim()

  const searches = selectedCountries.map(async (country) => {
    const results = await searchWeb(country, city, trimmedIndustry)
    return results.map((item) => ({ ...item, detectedCountry: country }))
  })

  const settled = await Promise.allSettled(searches)
  const searchResults = settled
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value)

  if (!searchResults.length) {
    const firstError = settled.find((result) => result.status === 'rejected')
    if (firstError) throw firstError.reason
    return { generatedAt: new Date().toISOString(), total: 0, items: [] }
  }

  const prospects = dedupeByUrl(
    searchResults
      .map((item) => {
        const website = extractWebsite(item.url)
        if (!website) return null
        return {
          name: item.title.split('|')[0].split('-')[0].trim(),
          website,
          sourceUrl: item.url,
          snippet: item.snippet,
          country: item.detectedCountry || selectedCountries[0],
          city: item.city || city || '',
          industry: trimmedIndustry
        }
      })
      .filter(Boolean)
  ).slice(0, safeLimit * 3)

  const enriched = []
  for (const prospect of prospects) {
    const analysis = await analyzeWebsite(prospect.website, prospect.country)
    const { score, tier } = scoreAnalysis(analysis)
    const signals = buildSignals(analysis)
    const enrichedProspect = {
      ...prospect,
      analysis,
      score,
      tier,
      signals,
      draftedMessage: draftMessage({ ...prospect, signals }, trimmedIndustry)
    }

    if (isRelevantToIndustry(enrichedProspect, trimmedIndustry)) {
      enriched.push(enrichedProspect)
    }

    if (enriched.length >= safeLimit) break
  }

  return {
    generatedAt: new Date().toISOString(),
    total: enriched.length,
    items: enriched.sort((a, b) => b.score - a.score)
  }
}

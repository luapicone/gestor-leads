import { JSDOM } from 'jsdom'

export const DEFAULT_COUNTRIES = [
  'España',
  'México',
  'Argentina',
  'Chile',
  'Perú',
  'Colombia'
]

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const stopHosts = ['facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'x.com', 'twitter.com']

export async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      'accept-language': 'es-ES,es;q=0.9,en;q=0.7'
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

export async function searchDuckDuckGo(query) {
  const html = await fetchText(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`)
  const dom = new JSDOM(html)
  const { document } = dom.window
  const nodes = [...document.querySelectorAll('.result')]

  return nodes
    .map((node) => {
      const titleNode = node.querySelector('.result__title a')
      const snippetNode = node.querySelector('.result__snippet')
      const href = titleNode?.href || ''
      const cleanUrl = href.startsWith('//') ? `https:${href}` : href
      return {
        title: normalizeWhitespace(titleNode?.textContent || ''),
        url: cleanUrl,
        snippet: normalizeWhitespace(snippetNode?.textContent || '')
      }
    })
    .filter((item) => item.title && item.url)
}

export function extractWebsite(rawUrl) {
  try {
    const url = new URL(rawUrl)
    const redirected = url.searchParams.get('uddg')
    if (redirected) return extractWebsite(decodeURIComponent(redirected))
    if (stopHosts.some((host) => url.hostname.includes(host))) return null
    return `${url.protocol}//${url.hostname}`
  } catch {
    return null
  }
}

export function buildSignals(analysis) {
  const signals = []
  if (!analysis.hasWhatsapp) signals.push('No se detectó WhatsApp visible')
  if (!analysis.hasContactForm) signals.push('No se detectó formulario de contacto')
  if (!analysis.hasProjectGallery) signals.push('No se ve una galería/proyectos fuerte')
  if (!analysis.hasBrochure) signals.push('No ofrece brochure o PDF visible')
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
  if (analysis.isSpanishMarket) score += 1
  const tier = score >= 8 ? 'A' : score >= 5 ? 'B' : 'C'
  return { score, tier }
}

export function draftMessage(prospect) {
  const featureList = [
    'diseño premium y moderno',
    'galería visual de proyectos',
    'brochure descargable',
    'mapa/ubicación',
    'WhatsApp y contacto directo',
    'estructura enfocada en captar leads'
  ]

  const reasons = prospect.signals.slice(0, 3).join(', ').toLowerCase()
  return `Hola ${prospect.name || ''}, estuve viendo la web de ${prospect.name || 'su constructora'} y noté una oportunidad clara de mejora: ${reasons || 'la presentación digital hoy quedó bastante básica para el nivel del servicio que ofrecen'}. Nosotros desarrollamos sitios para constructoras y desarrolladoras con una experiencia mucho más premium, en la línea de una landing de alto impacto, con ${featureList.join(', ')}. Si les interesa, les puedo mostrar una propuesta visual adaptada a su marca y sus proyectos.`
}

export async function analyzeWebsite(website, country) {
  try {
    const html = await fetchText(website)
    const dom = new JSDOM(html)
    const text = normalizeWhitespace(dom.window.document.body?.textContent || '')
    const lower = text.toLowerCase()
    const forms = dom.window.document.querySelectorAll('form').length
    const images = dom.window.document.querySelectorAll('img').length
    const navLinks = [...dom.window.document.querySelectorAll('a')].map((a) => normalizeWhitespace(a.textContent || '').toLowerCase())
    const hasContactForm = forms > 0 || (lower.includes('contacto') && lower.includes('enviar'))
    const hasWhatsapp = html.toLowerCase().includes('whatsapp') || html.toLowerCase().includes('wa.me')
    const hasProjectGallery = images >= 12 || ['proyectos', 'galería', 'obras', 'portfolio'].some((term) => lower.includes(term))
    const hasBrochure = html.toLowerCase().includes('.pdf') || ['brochure', 'descargar'].some((term) => lower.includes(term))
    const hasMap = html.toLowerCase().includes('google.com/maps') || lower.includes('ubicación') || lower.includes('mapa')
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
      isSpanishMarket: DEFAULT_COUNTRIES.includes(country),
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
      isSpanishMarket: DEFAULT_COUNTRIES.includes(country),
      pagePreview: `No se pudo analizar la web: ${error.message}`,
      failed: true
    }
  }
}

export async function searchProspects({ countries = DEFAULT_COUNTRIES, city = '', limit = 12 } = {}) {
  const searches = countries.map((country) => {
    const query = `constructora ${city ? `${city} ` : ''}${country} sitio web contacto proyectos`
    return searchDuckDuckGo(query)
  })

  const searchResults = (await Promise.all(searches)).flat()
  const prospects = dedupeByUrl(
    searchResults
      .map((item) => {
        const website = extractWebsite(item.url)
        if (!website) return null
        const country = countries.find((c) => item.title.includes(c) || item.snippet.includes(c)) || countries[0]
        return {
          name: item.title.split('|')[0].split('-')[0].trim(),
          website,
          sourceUrl: item.url,
          snippet: item.snippet,
          country
        }
      })
      .filter(Boolean)
  ).slice(0, limit)

  const enriched = []
  for (const prospect of prospects) {
    const analysis = await analyzeWebsite(prospect.website, prospect.country)
    const { score, tier } = scoreAnalysis(analysis)
    const signals = buildSignals(analysis)
    enriched.push({
      ...prospect,
      analysis,
      score,
      tier,
      signals,
      draftedMessage: draftMessage({ ...prospect, signals })
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    total: enriched.length,
    items: enriched.sort((a, b) => b.score - a.score)
  }
}

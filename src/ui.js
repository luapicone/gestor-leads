const ALL_COUNTRIES = [
  'Global',
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

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '4174'
  ? 'http://localhost:4174'
  : ''

const state = {
  loading: false,
  items: [],
  error: '',
  selectedWebsite: '',
  copiedIndex: null,
  filters: {
    industry: '',
    city: '',
    countries: ['Global'],
    limit: 12
  }
}

function el(tag, className, content) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (typeof content === 'string') node.textContent = content
  return node
}

function formatSignals(signals = []) {
  return signals.map((signal) => `<li>${signal}</li>`).join('')
}

async function parseApiResponse(response) {
  const raw = await response.text()

  try {
    const data = JSON.parse(raw)
    if (!response.ok) throw new Error(data.error || 'No se pudo buscar prospectos')
    return data
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`La API devolvió una respuesta inválida: ${raw.slice(0, 160)}`)
    }
    throw error
  }
}

async function searchProspects() {
  state.loading = true
  state.error = ''
  state.copiedIndex = null
  render()

  try {
    const response = await fetch(`${API_BASE}/api/prospects/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.filters)
    })
    const data = await parseApiResponse(response)
    state.items = data.items
    state.selectedWebsite = data.items[0]?.website || ''
  } catch (error) {
    state.error = error.message
  } finally {
    state.loading = false
    render()
  }
}

function renderHeader(root) {
  const hero = el('section', 'hero')
  hero.innerHTML = `
    <div class="hero-copy">
      <span class="eyebrow">Prospección asistida</span>
      <h1>Empresas por rubro, detectadas y listas para ofertar.</h1>
      <p>Elegís rubro, búsqueda global o países puntuales, y ciudad si querés afinar. El sistema busca empresas, analiza su sitio, marca oportunidades comerciales y redacta un mensaje sugerido. No envía nada: vos revisás todo desde acá.</p>
    </div>
    <div class="hero-panel">
      <div class="stat"><strong>${state.items.length}</strong><span>prospectos en tablero</span></div>
      <div class="stat"><strong>${state.items.filter((item) => item.tier === 'A').length}</strong><span>prioridad alta</span></div>
      <div class="stat"><strong>multi-rubro</strong><span>búsqueda flexible</span></div>
    </div>
  `
  root.append(hero)
}

function renderFilters(root) {
  const panel = el('section', 'filters')
  panel.innerHTML = `
    <div class="filters-grid">
      <label>
        <span>Rubro</span>
        <input id="industryInput" type="text" placeholder="Ej: constructoras, estudios contables, clínicas dentales, software" value="${state.filters.industry}" />
      </label>
      <label>
        <span>Ciudad objetivo</span>
        <input id="cityInput" type="text" placeholder="Ej: Madrid, Santiago, Córdoba" value="${state.filters.city}" />
      </label>
      <label>
        <span>Cantidad máxima</span>
        <input id="limitInput" type="number" min="4" max="30" value="${state.filters.limit}" />
      </label>
      <button id="searchButton" class="search-button">${state.loading ? 'Buscando...' : 'Buscar oportunidades'}</button>
    </div>
    <div class="country-pills">
      ${ALL_COUNTRIES
        .map(
          (country) => `
            <button class="pill ${state.filters.countries.includes(country) ? 'is-active' : ''}" data-country="${country}">${country}</button>
          `
        )
        .join('')}
    </div>
  `

  panel.querySelector('#industryInput').addEventListener('input', (event) => {
    state.filters.industry = event.target.value
  })
  panel.querySelector('#cityInput').addEventListener('input', (event) => {
    state.filters.city = event.target.value
  })
  panel.querySelector('#limitInput').addEventListener('input', (event) => {
    state.filters.limit = Number(event.target.value)
  })
  panel.querySelector('#searchButton').addEventListener('click', searchProspects)
  panel.querySelectorAll('.pill').forEach((button) => {
    button.addEventListener('click', () => {
      const country = button.dataset.country
      if (country === 'Global') {
        state.filters.countries = ['Global']
        render()
        return
      }
      if (state.filters.countries.includes(country)) {
        state.filters.countries = state.filters.countries.filter((item) => item !== country)
      } else {
        state.filters.countries = [...state.filters.countries.filter((item) => item !== 'Global'), country]
      }
      if (!state.filters.countries.length) {
        state.filters.countries = ['Global']
      }
      render()
    })
  })
  root.append(panel)
}

function renderError(root) {
  if (!state.error) return
  const error = el('div', 'error')
  error.textContent = state.error
  root.append(error)
}

function renderGrid(root) {
  const grid = el('section', 'prospect-layout')

  if (!state.items.length && !state.loading) {
    const empty = el('div', 'empty-state')
    empty.innerHTML = `
      <h2>Sin resultados todavía</h2>
      <p>Elegí un rubro, dejá <strong>Global</strong> o sumá países, agregá una ciudad si querés afinar la búsqueda y tocá <strong>Buscar oportunidades</strong>.</p>
    `
    grid.append(empty)
    root.append(grid)
    return
  }

  if (state.loading) {
    const loading = el('div', 'empty-state')
    loading.innerHTML = '<h2>Buscando y auditando webs...</h2><p>Esto puede tardar un poco porque analiza cada sitio.</p>'
    grid.append(loading)
    root.append(grid)
    return
  }

  const preview = el('aside', 'site-preview-panel')
  preview.innerHTML = `
    <div class="preview-panel-head">
      <div>
        <span class="eyebrow">Preview del sitio</span>
        <h2>${state.selectedWebsite || 'Seleccioná un prospecto'}</h2>
      </div>
      ${state.selectedWebsite ? `<a href="${state.selectedWebsite}" target="_blank" rel="noreferrer">Abrir ↗</a>` : ''}
    </div>
    ${state.selectedWebsite ? `<iframe class="site-frame" src="${state.selectedWebsite}" loading="lazy"></iframe>` : '<div class="frame-fallback">No hay sitio seleccionado.</div>'}
    <p class="frame-note">Algunas webs bloquean iframes. Si eso pasa, usá el botón “Abrir”.</p>
  `

  const list = el('div', 'prospect-grid')

  state.items.forEach((item, index) => {
    const card = el('article', 'prospect-card')
    card.innerHTML = `
      <div class="card-top">
        <div>
          <span class="tier tier-${item.tier}">Prioridad ${item.tier}</span>
          <h3>${item.name}</h3>
          <p class="meta">${item.country}${item.city ? ` · ${item.city}` : ''}${item.industry ? ` · ${item.industry}` : ''} · score ${item.score}</p>
        </div>
        <div class="card-actions">
          <button class="ghost-button" data-preview="${item.website}">Ver web</button>
          <a href="${item.website}" target="_blank" rel="noreferrer">Abrir sitio ↗</a>
        </div>
      </div>
      <p class="snippet">${item.snippet || item.analysis.metaDescription || 'Sin descripción visible.'}</p>
      <div class="preview-box">
        <strong>Página detectada</strong>
        <p>${item.analysis.title || item.website}</p>
        <small>${item.analysis.pagePreview}</small>
      </div>
      <div class="signals-box">
        <strong>Señales encontradas</strong>
        <ul>${formatSignals(item.signals)}</ul>
      </div>
      <div class="message-box">
        <div class="message-head">
          <strong>Mensaje sugerido</strong>
          <button class="ghost-button" data-copy="${index}">${state.copiedIndex === index ? 'Copiado' : 'Copiar mensaje'}</button>
        </div>
        <textarea readonly>${item.draftedMessage}</textarea>
      </div>
    `
    list.append(card)
  })

  list.querySelectorAll('[data-preview]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedWebsite = button.dataset.preview
      render()
    })
  })

  list.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const index = Number(button.dataset.copy)
      await navigator.clipboard.writeText(state.items[index].draftedMessage)
      state.copiedIndex = index
      render()
    })
  })

  grid.append(preview, list)
  root.append(grid)
}

function render() {
  const root = document.querySelector('#app')
  root.innerHTML = ''
  const shell = el('main', 'shell')
  renderHeader(shell)
  renderFilters(shell)
  renderError(shell)
  renderGrid(shell)
  root.append(shell)
}

export function createApp(root) {
  if (!root) return
  render()
}

import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { DEFAULT_COUNTRIES, searchProspects } from '../lib/prospecting.js'

const app = express()
const PORT = process.env.PORT || 4174
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../dist')

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/prospects/search', async (req, res) => {
  const { countries = DEFAULT_COUNTRIES, city = '', industry = '', limit = 12 } = req.body || {}

  try {
    const result = await searchProspects({ countries, city, industry, limit })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error buscando prospectos' })
  }
})

if (process.env.NODE_ENV === 'production' || process.env.SERVE_DIST === 'true') {
  app.use(express.static(distPath))

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Prospecting server running on http://localhost:${PORT}`)
})

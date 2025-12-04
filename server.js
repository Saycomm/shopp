const express = require('express')
const cors = require('cors')
const fs = require('fs-extra')
const path = require('path')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.static(path.join(__dirname, 'public')))

const FILE = path.join(__dirname, 'products.json')

async function read() {
  if (!await fs.pathExists(FILE)) await fs.writeJson(FILE, [])
  return await fs.readJson(FILE)
}

async function write(data) {
  await fs.writeJson(FILE, data, { spaces: 2 })
}

// API
app.get('/api/products', async (req, res) => {
  res.json(await read())
})

app.post('/api/products', async (req, res) => {
  const data = await read()
  const product = {
    id: Date.now(),
    ...req.body
  }
  data.push(product)
  await write(data)
  res.status(201).json(product)
})

app.put('/api/products/:id', async (req, res) => {
  const data = await read()
  const i = data.findIndex(p => p.id == req.params.id)
  if (i === -1) return res.status(404).json({error: 'topilmadi'})
  data[i] = { ...data[i], ...req.body, id: data[i].id }
  await write(data)
  res.json(data[i])
})

app.delete('/api/products/:id', async (req, res) => {
  let data = await read()
  const len = data.length
  data = data.filter(p => p.id != req.params.id)
  if (data.length === len) return res.status(404).json({error: 'topilmadi'})
  await write(data)
  res.json({ok: true})
})

app.listen(PORT, () => {
  console.log(`Server ishlamoqda: http://localhost:${PORT}`)
  console.log(`Bosh sahifa:   http://localhost:${PORT}/index.html`)
  console.log(`Admin panel:   http://localhost:${PORT}/account.html`)
})
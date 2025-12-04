const express = require('express')
const cors = require('cors')
const fs = require('fs-extra')
const path = require('path')

const app = express()
const PORT = 3000

// JSON body o‘qish
app.use(express.json({ limit: '10mb' })) // rasm base64 uchun limit biroz katta

// CORS – agar keyinchalik boshqa domenlardan ishlatsang
app.use(cors())

// public papkadan statik fayllar (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')))

const PRODUCTS_FILE = path.join(__dirname, 'products.json')

// Fayldan mahsulotlarni o‘qish
async function readProducts() {
  try {
    const exists = await fs.pathExists(PRODUCTS_FILE)
    if (!exists) {
      await fs.writeJson(PRODUCTS_FILE, [])
      return []
    }
    const data = await fs.readJson(PRODUCTS_FILE)
    if (Array.isArray(data)) return data
    return []
  } catch (err) {
    console.error('readProducts error:', err)
    return []
  }
}

// Mahsulotlarni faylga yozish
async function writeProducts(products) {
  await fs.writeJson(PRODUCTS_FILE, products, { spaces: 2 })
}

// ====== API ======

// Barcha mahsulotlar
app.get('/api/products', async (req, res) => {
  const products = await readProducts()
  res.json(products)
})

// Yangi mahsulot qo‘shish
app.post('/api/products', async (req, res) => {
  const { name, category, barcode, price, imageData } = req.body

  if (!name || !category || !barcode || price == null) {
    return res.status(400).json({ error: 'Majburiy maydonlar to‘ldirilmagan' })
  }

  const products = await readProducts()
  const newProduct = {
    id: Date.now(), // oddiy id
    name,
    category,
    barcode,
    price,
    imageData: imageData || ''
  }

  products.push(newProduct)
  await writeProducts(products)

  res.status(201).json(newProduct)
})

// Mahsulotni tahrirlash (update)
app.put('/api/products/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { name, category, barcode, price, imageData } = req.body

  const products = await readProducts()
  const index = products.findIndex(p => p.id === id)
  if (index === -1) {
    return res.status(404).json({ error: 'Mahsulot topilmadi' })
  }

  products[index] = {
    ...products[index],
    name,
    category,
    barcode,
    price,
    imageData: imageData ?? products[index].imageData
  }

  await writeProducts(products)
  res.json(products[index])
})

// Mahsulotni o‘chirish
app.delete('/api/products/:id', async (req, res) => {
  const id = Number(req.params.id)

  const products = await readProducts()
  const filtered = products.filter(p => p.id !== id)

  if (filtered.length === products.length) {
    return res.status(404).json({ error: 'Mahsulot topilmadi' })
  }

  await writeProducts(filtered)
  res.json({ success: true })
})

// Serverni ishga tushirish
app.listen(PORT, () => {
  console.log(`Server ishga tushdi: http://localhost:${PORT}`)
  console.log(`Account sahifa: http://localhost:${PORT}/account.html`)
})

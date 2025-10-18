import { Hono } from 'hono'

import operators from './routes/operators'
import weapons from './routes/weapons'
import enemies from './routes/enemies'
import items from './routes/items'
import lore from './routes/lore'
import tutorials from './routes/tutorials'
import facilities from './routes/facilities'

const app = new Hono()

app.get('/', (c) => {
  return c.text('OK')
})

app.route('/', operators)
app.route('/', weapons)
app.route('/', enemies)
app.route('/', items)
app.route('/', lore)
app.route('/', tutorials)
app.route('/', facilities)

export default app
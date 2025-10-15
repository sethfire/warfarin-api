import { Hono } from 'hono'
import operators from './routes/operators'
import weapons from './routes/weapons'
import enemies from './routes/enemies'
import items from './routes/items'

const app = new Hono()

app.get('/', (c) => {
  return c.text('OK')
})

app.route('/', operators)
app.route('/', weapons)
app.route('/', enemies)
app.route('/', items)

export default app
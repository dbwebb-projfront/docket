import express from 'express'
import bodyParser from 'body-parser'
import path from 'path'
import cors from 'cors'

import database from './db/database.mjs'

const app = express()

app.disable('x-powered-by')

app.set("view engine", "ejs")
app.use(cors())

const port = process.env.PORT || 8666


app.use(bodyParser.json({limit: '50mb'})) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' })) // for parsing application/x-www-form-urlencoded

app.use(express.static(path.join(process.cwd(), "public")))

app.get('/', (req, res) => res.redirect('/documentation.html'))

app.listen(port, () => console.log('Order api listening on port ' + port))
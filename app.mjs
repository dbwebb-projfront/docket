import 'dotenv/config'

import express from 'express'
import { createServer } from 'node:http'
import bodyParser from 'body-parser'
import path from 'path'
import cors from 'cors'
import morgan from 'morgan'
import { Server } from 'socket.io'

import projects from './routes/projects.mjs'
import files from './routes/files.mjs'

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*",
    }
})

app.disable('x-powered-by')

app.set("view engine", "ejs")
app.use(cors())

const port = process.env.PORT || 8166


app.use(bodyParser.json({limit: '50mb'})) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' })) // for parsing application/x-www-form-urlencoded

app.use(express.static(path.join(process.cwd(), "public")))


// don't show the log when it is test
if (process.env.NODE_ENV !== 'test') {
    // use morgan to log at command line
    app.use(morgan('combined')) // 'combined' outputs the Apache style LOGs
}

app.use("/projects", projects)
app.use("/files", files)

app.get('/', (req, res) => res.redirect('/documentation.html'))

// Socket handling
io.on('connection', (socket) => {
  socket.on("open file", (uid) => {
    socket.join(uid)
  })

  socket.on("new content", (data) => {
    io.to(data.uid).emit("new content", data)
  })
})

server.listen(port, () => console.log('Order api listening on port ' + port))
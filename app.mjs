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

import filesModel from './models/files.mjs'

import { verifyToken } from './models/auth.mjs'

let throttleTimeout = null

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

let fileUsers = {}


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
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  
  if (verifyToken(token)) {
    next()
  }
})


io.on('connection', (socket) => {
  socket.on("open file", async (uid) => {
    const decoded = verifyToken(socket.handshake.auth.token)

    const hasAccess = await filesModel.checkFileAccess(uid, decoded.email, decoded.api_key)

    if (hasAccess) {
      socket.join(uid)
      io.to(uid).emit("file loaded", uid)

      // handle adding users
      if (!fileUsers[uid]) {
        fileUsers[uid] = []
      }

      fileUsers[uid].push(decoded.email)

      io.to(uid).emit("users", fileUsers[uid])
    }      
  })

  socket.on("disconnect", () => {
    const decoded = verifyToken(socket.handshake.auth.token)
     
    for(let file in fileUsers) {
      fileUsers[file] = fileUsers[file].filter((item) => item !== decoded.email)
    }
  })

  socket.on("close file", (uid) => {
    const decoded = verifyToken(socket.handshake.auth.token)

    fileUsers[uid] = fileUsers[uid].filter((item) => item !== decoded.email)
  })

  socket.on("content", (data) => {
    io.to(data.uid).emit("content", data)

    clearTimeout(throttleTimeout)
    throttleTimeout = setTimeout(async () => {
      
    }, 2000)
  })

  socket.on("selection", (data) => {
    io.to(data.uid).emit("selection", data)
  })
})

server.listen(port, () => console.log('Order api listening on port ' + port))
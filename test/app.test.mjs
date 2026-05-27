import test, { after, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import jwt from 'jsonwebtoken'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { io as createClient } from 'socket.io-client'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const dbPath = resolve(rootDir, 'db/test.sqlite')
const sqlFiles = [
  'db/migrate.sql',
  'db/add_create_by_and_last_changed_to_files.sql',
  'db/seed.sql',
]

const primaryUser = {
  email: 'efo@bth.se',
  apiKey: 'b07226d9fdf3c66c3ee1d6f0dbfb8409',
}

const secondaryUser = {
  email: 'efo@bth.se',
  apiKey: 'fb5a74ef51f39e0df0f928d7cd98445b',
}

const seededProjectUid = 'fb5a74fe51f39e0df0f928d7cd98445b'
const seededFileUid = 'ab5a74fe51f39e0df0f928d7cd98445b'

const { server } = await import('../app.mjs')

let baseUrl = ''

before(async () => {
  await resetTestDb()
  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })

  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

beforeEach(async () => {
  await resetTestDb()
})

after(async () => {
  if (server.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

  await rm(dbPath, { force: true })
})

test('GET /projects requires an auth token', async () => {
  const { response, body } = await requestJson('/projects')

  assert.equal(response.status, 401)
  assert.equal(body.errors.title, 'No token')
  assert.equal(body.errors.detail, 'No token provided in request headers')
})

test('GET /projects returns the authenticated user projects', async () => {
  const { response, body } = await requestJson('/projects', {
    headers: authHeaders(createToken(primaryUser)),
  })

  assert.equal(response.status, 200)
  assert.deepEqual(body.data, [
    {
      uid: seededProjectUid,
      name: 'Starter project',
    },
  ])
})

test('GET /projects/:uid returns project details with files and users', async () => {
  const { response, body } = await requestJson(`/projects/${seededProjectUid}`, {
    headers: authHeaders(createToken(primaryUser)),
  })

  assert.equal(response.status, 200)
  assert.equal(body.data.uid, seededProjectUid)
  assert.equal(body.data.name, 'Starter project')
  assert.equal(body.data.files.length, 2)
  assert.deepEqual(body.data.users, [{ email: primaryUser.email }])
})

test('project lifecycle endpoints create, add user, remove user, and delete', async () => {
  const ownerToken = createToken(primaryUser)

  const created = await requestJson('/projects', {
    method: 'POST',
    headers: jsonHeaders(ownerToken),
    body: JSON.stringify({ name: 'Integration test project' }),
  })

  assert.equal(created.response.status, 201)
  assert.equal(created.body.data.name, 'Integration test project')
  assert.match(created.body.data.uid, /^[a-f0-9]+$/)

  const projectUid = created.body.data.uid

  const addedUser = await requestJson('/projects/add_user', {
    method: 'POST',
    headers: jsonHeaders(ownerToken),
    body: JSON.stringify({
      uid: projectUid,
      email: 'mos@bth.se',
    }),
  })

  assert.equal(addedUser.response.status, 201)
  assert.deepEqual(addedUser.body.data, {
    uid: projectUid,
    email: 'mos@bth.se',
  })

  const projectWithUser = await requestJson(`/projects/${projectUid}`, {
    headers: authHeaders(ownerToken),
  })

  assert.equal(projectWithUser.response.status, 200)
  assert.deepEqual(projectWithUser.body.data.users, [
    { email: primaryUser.email },
    { email: 'mos@bth.se' },
  ])

  const removedUser = await requestJson('/projects/remove_user', {
    method: 'DELETE',
    headers: jsonHeaders(ownerToken),
    body: JSON.stringify({
      uid: projectUid,
      email: 'mos@bth.se',
    }),
  })

  assert.equal(removedUser.response.status, 200)
  assert.deepEqual(removedUser.body.data, {
    message: 'User mos@bth.se removed from project',
    removed: true,
  })

  const projectWithoutUser = await requestJson(`/projects/${projectUid}`, {
    headers: authHeaders(ownerToken),
  })

  assert.deepEqual(projectWithoutUser.body.data.users, [{ email: primaryUser.email }])

  const missingUserRemoval = await requestJson('/projects/remove_user', {
    method: 'DELETE',
    headers: jsonHeaders(ownerToken),
    body: JSON.stringify({
      uid: projectUid,
      email: 'mos@bth.se',
    }),
  })

  assert.equal(missingUserRemoval.response.status, 200)
  assert.deepEqual(missingUserRemoval.body.data, {
    message: 'User mos@bth.se not part of project',
    removed: false,
    status: 200,
  })

  const deletedProject = await fetch(`${baseUrl}/projects`, {
    method: 'DELETE',
    headers: jsonHeaders(ownerToken),
    body: JSON.stringify({ uid: projectUid }),
  })

  assert.equal(deletedProject.status, 204)

  const afterDelete = await requestJson(`/projects/${projectUid}`, {
    headers: authHeaders(ownerToken),
  })

  assert.equal(afterDelete.response.status, 401)
  assert.equal(afterDelete.body.data.errors.title, 'No Access')
})

test('file lifecycle endpoints create, fetch, and delete', async () => {
  const token = createToken(primaryUser)

  const created = await requestJson('/files', {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({
      filename: 'style.css',
      project_uid: seededProjectUid,
      parent_file: null,
    }),
  })

  assert.equal(created.response.status, 201)
  assert.equal(created.body.data.filename, 'style.css')
  assert.equal(created.body.data.project_uid, seededProjectUid)
  assert.equal(created.body.data.parent_file, null)
  assert.equal(created.body.data.created_by, primaryUser.email)
  assert.equal(created.body.data.content, '')
  assert.match(created.body.data.last_changed, /^\d{4}-\d{2}-\d{2}T/)

  const fileUid = created.body.data.uid

  const fetched = await requestJson(`/files/${fileUid}`, {
    headers: authHeaders(token),
  })

  assert.equal(fetched.response.status, 200)
  assert.equal(fetched.body.data.uid, fileUid)
  assert.equal(fetched.body.data.filename, 'style.css')

  const deleted = await fetch(`${baseUrl}/files`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
    body: JSON.stringify({ uid: fileUid }),
  })

  assert.equal(deleted.status, 204)

  const afterDelete = await requestJson(`/files/${fileUid}`, {
    headers: authHeaders(token),
  })

  assert.equal(afterDelete.response.status, 401)
})

test('DELETE /files rejects access for a different project token', async () => {
  const unauthorizedDelete = await requestJson('/files', {
    method: 'DELETE',
    headers: jsonHeaders(createToken(secondaryUser)),
    body: JSON.stringify({ uid: seededFileUid }),
  })

  assert.equal(unauthorizedDelete.response.status, 401)
  assert.equal(unauthorizedDelete.body.data.errors.message, 'You do not have access to this file.')

  const fileStillExists = await requestJson(`/files/${seededFileUid}`, {
    headers: authHeaders(createToken(primaryUser)),
  })

  assert.equal(fileStillExists.response.status, 200)
  assert.equal(fileStillExists.body.data.uid, seededFileUid)
})

test('socket connections keep working after the token expires mid-session', async () => {
  const socket = await connectSocket(createToken(primaryUser, { expiresIn: '1s' }))

  try {
    await delay(1200)

    const loadedPromise = waitForSocketEvent(socket, 'file loaded')
    const usersPromise = waitForSocketEvent(socket, 'users')

    socket.emit('open file', seededFileUid)

    const [loadedUid] = await loadedPromise
    const [users] = await usersPromise

    assert.equal(loadedUid, seededFileUid)
    assert.deepEqual(users, [primaryUser.email])

    const savedPromise = waitForSocketEvent(socket, 'content saved', 5000)
    const content = 'updated after token expiry'

    socket.emit('content', {
      uid: seededFileUid,
      content,
    })

    const [savedPayload] = await savedPromise
    assert.equal(savedPayload.uid, seededFileUid)
    assert.equal(savedPayload.content, content)

    const db = await openTestDb()
    const savedFile = await db.get('SELECT content FROM files WHERE uid = ?', seededFileUid)
    await db.close()

    assert.equal(savedFile.content, content)
  } finally {
    socket.close()
  }
})

async function requestJson(pathname, init = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, init)
  const text = await response.text()

  return {
    response,
    body: text ? JSON.parse(text) : null,
  }
}

function authHeaders(token) {
  return {
    'x-access-token': token,
  }
}

function jsonHeaders(token) {
  return {
    'content-type': 'application/json',
    ...authHeaders(token),
  }
}

function createToken(user, options = {}) {
  return jwt.sign({
    email: user.email,
    api_key: user.apiKey,
  }, process.env.JWT_SECRET, options)
}

async function resetTestDb() {
  await rm(dbPath, { force: true })

  const db = await openTestDb()

  for (const relativePath of sqlFiles) {
    const sql = await readFile(resolve(rootDir, relativePath), 'utf8')
    await db.exec(sql)
  }

  await db.close()
}

function openTestDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  })
}

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const socket = createClient(baseUrl, {
      auth: { token },
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    })

    const timeout = setTimeout(() => {
      cleanup()
      socket.close()
      reject(new Error('Socket connection timed out'))
    }, 2000)

    const handleConnect = () => {
      cleanup()
      resolve(socket)
    }

    const handleError = (error) => {
      cleanup()
      socket.close()
      reject(error)
    }

    function cleanup() {
      clearTimeout(timeout)
      socket.off('connect', handleConnect)
      socket.off('connect_error', handleError)
    }

    socket.on('connect', handleConnect)
    socket.on('connect_error', handleError)
  })
}

function waitForSocketEvent(socket, eventName, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(eventName, handleEvent)
      reject(new Error(`Timed out waiting for ${eventName}`))
    }, timeoutMs)

    const handleEvent = (...args) => {
      clearTimeout(timeout)
      resolve(args)
    }

    socket.once(eventName, handleEvent)
  })
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

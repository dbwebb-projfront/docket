import sqlite3 from "sqlite3"
import { open } from "sqlite"

const database = {
  openDb: async function openDb() {
    let dbFilename = `./db/docs.sqlite`

    if (process.env.NODE_ENV === "test") {
      dbFilename = "./db/test.sqlite"
    }

    return await open({
      filename: dbFilename,
      driver: sqlite3.Database,
    })
  },
}

export default database

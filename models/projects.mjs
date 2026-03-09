import database from "../db/database.mjs"
import hat from "hat"

export default {
  getProjects: async function getProjects(email, apiKey) {
    const db = await database.openDb()

    try {
      return await db.all(
        `SELECT p.* FROM projects p 
        INNER JOIN user_projects up ON p.uid = up.uid 
        WHERE up.email = ? AND up.api_key = ?`,
        email,
        apiKey,
      )
    } catch (error) {
      return { errors: {
        title: "Database error",
        message: error.message,
      }}
    }
  },

  createProject: async function createProject(name, email, apiKey) {
    const db = await database.openDb()

    try {
      const uid = hat()
      await db.run(
        `INSERT INTO projects (uid, name) VALUES (?, ?)`,
        uid,
        name,
      )

      await db.run(
        `INSERT INTO user_projects (uid, email, api_key) VALUES (?, ?, ?)`,
        uid,
        email,
        apiKey,
      )
      
      return {
        uid: uid,
        name: name,
      }
    } catch (error) {
      return { errors: {
        title: "Database error",
        message: error.message,
      }}
    }
  }
}
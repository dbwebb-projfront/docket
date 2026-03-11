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

  getProject: async function getProject(email, apiKey, uid) {
    const db = await database.openDb()

    try {
      const project = await db.get(
        `SELECT p.* FROM projects p 
        INNER JOIN user_projects up ON p.uid = up.uid 
        WHERE up.email = ? AND up.api_key = ? AND p.uid = ?`,
        email,
        apiKey,
        uid,
      )

      if (project === undefined) {
        return { errors: {
          title: "No Access",
          message: "You do not have access to the project.",
          status: 401,
        }}
      }

      const projectFiles = await db.all(
        `SELECT * FROM files WHERE uid = ?`,
        uid,
      )

      project.files = projectFiles

      return project
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
  },

  addUserToProject: async function addUserToProject(uid, newEmail, email, apiKey) {
    const db = await database.openDb()

    try {
      const project = await db.get(
        `SELECT up.* FROM projects p 
        INNER JOIN user_projects up ON p.uid = up.uid 
        WHERE up.email = ? AND up.api_key = ? AND p.uid = ?`,
        email,
        apiKey,
        uid,
      )

      if (project === undefined) {
        return {
          errors: {
            status: 401,
            title: "Not Authorized",
            message: "You do not have access to this project.",
          }
        }
      }

      const user = await db.get(
        `SELECT * FROM user_projects
        WHERE email = ? AND api_key = ? AND uid = ?`,
        newEmail,
        apiKey,
        uid,
      )

      if (user) {
        return {
          message: "User already part of project.",
          status: 200,
        }
      }

      await db.run(
        `INSERT INTO user_projects (uid, email, api_key) VALUES (?, ?, ?)`,
        uid,
        newEmail,
        apiKey,
      )
      
      return {
        uid: uid,
        email: newEmail,   
      }      
    } catch (error) {
      return { errors: {
        title: "Database error",
        message: error.message,
      }}
    }
  },
}
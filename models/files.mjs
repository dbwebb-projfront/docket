import database from "../db/database.mjs"
import hat from "hat"

export default {
  getFile: async function getFile(uid, email, apiKey) {
    const db = await database.openDb()

    try {
      const file = await db.get(
        `SELECT f.* FROM files f
        INNER JOIN projects p ON p.uid = f.project_uid
        INNER JOIN user_projects up ON up.uid = p.uid
        WHERE f.uid = ? AND up.email = ? AND up.api_key = ?`,
        uid,
        email,
        apiKey,
      )

      if (file === undefined) {
        return { errors: {
          status: 401,
          message: "You do not have access to this file"
        }}
      }

      return file
    } catch (error) {
      return { errors: {
        status: 500,
        message: error.message,
      }}
    }
  },

  createFile: async function createFile(filename, projectUID, parent=null, email, apiKey) {
    const db = await database.openDb()

    try {
      const project = await db.get(
        `SELECT p.* FROM projects p 
        INNER JOIN user_projects up ON p.uid = up.uid 
        WHERE up.email = ? AND up.api_key = ? AND p.uid = ?`,
        email,
        apiKey,
        projectUID,
      )

      if (project === undefined) {
        return { errors: {
          title: "No Access",
          message: "You do not have access to the project.",
          status: 401,
        }}
      }

      const fileObject = {
        filename: filename,
        parent_file: parent,
        uid: hat(),
        project_uid: projectUID,
        content: "",
      }

      await db.run(
        `INSERT INTO files (filename, parent_file, uid, project_uid)
        VALUES (?, ?, ?, ?)`,
        fileObject.filename,
        fileObject.parent_file,
        fileObject.uid,
        fileObject.project_uid,
      )

      return fileObject
    } catch (error) {
      return { errors: {
        title: "Database error",
        message: error.message,
      }}
    }
  },

  checkFileAccess: async function checkFileAccess(fileUID, email, apiKey) {
    const db = await database.openDb()

    try {
      const user = await db.get(
        `SELECT up.email FROM user_projects up 
          INNER JOIN files f ON f.project_uid = up.uid
          WHERE up.email = ? AND up.api_key = ? AND f.uid = ?`,
        email,
        apiKey,
        fileUID,
      )

      if (user) {
        return true
      }

      return false
    } catch (error) {
      console.error(error)
      return false
    }
  },

  updateFileContent: async function updateFileContent(fileUID, content) {
    if (this.checkFileAccess) {
      const db = await database.openDb()

      try {
        const result = await db.run(
          `UPDATE files SET content = ? WHERE uid = ?`,
          content,
          fileUID, 
        )

        return result.changes
      } catch (error) {
        console.error(error)

        return false
      }
    }    
  }
}
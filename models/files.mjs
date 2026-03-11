import database from "../db/database.mjs"
import hat from "hat"

export default {
  createFile: async function createFile(filename, project_uid, email, apiKey) {
        const db = await database.openDb()

    try {
      const project = await db.get(
        `SELECT p.* FROM projects p 
        INNER JOIN user_projects up ON p.uid = up.uid 
        WHERE up.email = ? AND up.api_key = ? AND p.uid = ?`,
        email,
        apiKey,
        project_uid,
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
        uid: hat(),
        project_uid: project_uid,
        content: "",
      }

      await db.run(
        `INSERT INTO files (filename, uid, project_uid)
        VALUES (?, ?, ?)`,
        fileObject.filename,
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
  }
}
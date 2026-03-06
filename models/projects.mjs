import database from "../db/database.mjs"

export default {
  getProjects: async function getProjects(email) {
    const db = await database.openDb()

    return await db.all(
      `SELECT * FROM projects p 
      INNER JOIN user_projects up ON p.uid = up.uid 
      WHERE up.email = ?`,
      email
    )
  }
}
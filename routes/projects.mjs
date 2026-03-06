import express from "express"
const router = express.Router()

import auth from '../models/auth.mjs'
import projectsModel from "../models/projects.mjs"


router.get("/", 
  (req, res, next) => auth.checkToken(req, res, next),
  async (req, res) => {
    const projects = await projectsModel.getProjects(req.user.email)

    return res.json({ data: projects })
  }
)

export default router

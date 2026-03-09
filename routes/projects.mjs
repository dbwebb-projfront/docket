import express from "express"
const router = express.Router()

import auth from '../models/auth.mjs'
import projectsModel from "../models/projects.mjs"


router.get("/", 
  (req, res, next) => auth.checkToken(req, res, next),
  async (req, res) => {
    const results = await projectsModel.getProjects(req.user.email, req.user.api_key)

    if ("errors" in results) {
      return res.status(500).json({ data: results })
    }

    return res.json({ data: results })
  }
)

router.post("/", 
  (req, res, next) => auth.checkToken(req, res, next),
  async (req, res) => {
    const results = await projectsModel.createProject(req.body.name, req.user.email, req.user.api_key)

    if ("errors" in results) {
      return res.status(500).json({ data: results })
    }

    return res.json({ data: results })
  }
)

export default router

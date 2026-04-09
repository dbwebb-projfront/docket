import express from "express"
const router = express.Router()

import { checkToken } from '../models/auth.mjs'
import projectsModel from "../models/projects.mjs"


router.get("/",
  (req, res, next) => checkToken(req, res, next),
  async (req, res) => {
    const results = await projectsModel.getProjects(req.user.email, req.user.api_key)

    if ("errors" in results) {
      return res.status(500).json({ data: results })
    }

    return res.json({ data: results })
  }
)

router.get("/:uid",
  (req, res, next) => checkToken(req, res, next),
  async (req, res) => {
    const result = await projectsModel.getProject(req.user.email, req.user.api_key, req.params.uid)

    if ("errors" in result) {
      return res.status(result.errors.status || 500).json({ data: result })
    }

    return res.json({ data: result })
  }
)

router.post("/",
  (req, res, next) => checkToken(req, res, next),
  async (req, res) => {
    const results = await projectsModel.createProject(req.body.name, req.user.email, req.user.api_key)

    if ("errors" in results) {
      return res.status(500).json({ data: results })
    }

    return res.status(201).json({ data: results })
  }
)

router.post("/add_user",
  (req, res, next) => checkToken(req, res, next),
  async (req, res) => {
    const results = await projectsModel.addUserToProject(req.body.uid, req.body.email, req.user.email, req.user.api_key)

    if ("errors" in results) {
      return res.status(results.errors.status || 500).json({ data: results })
    }

    return res.status(results.status || 201).json({ data: results })
  }
)

export default router

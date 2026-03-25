import express from "express"
const router = express.Router()

import { checkToken } from '../models/auth.mjs'
import filesModel from "../models/files.mjs"

router.post("/",
  (req, res, next) => checkToken(req, res, next),
  async (req, res) => {
    const results = await filesModel.createFile(req.body.filename, req.body.project_uid, req.user.email, req.user.api_key)

    if ("errors" in results) {
      return res.status(results.errors.status || 500).json({ data: results })
    }

    return res.status(201).json({ data: results })
  }
)

export default router

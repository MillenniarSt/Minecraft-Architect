import express from 'express'
import { success } from './util.js'
import { loader } from '../elements/loader.js'

export const projectRouter = express.Router()

projectRouter.post('/open', (req, res) => {
    loader.load()
    success(res)
})
import express, { Response } from 'express'
import { success, error } from './util.js'
import { Schematic } from '../data/schematic.js'
import { Pos3D } from '../world/world3D.js'
import { Location } from '../elements/element.js'

export const dataPackRouter = express.Router()

let openSchematics: Map<string, Schematic> = new Map()

dataPackRouter.get('/schematics/new', (req, res) => {
    success(res, new Schematic([
        {
            pos: new Pos3D(0, 0, 0),
            location: Location.minecraft('grass_block'),
            properties: {
                snowy: 'false'
            }
        },
        {
            pos: new Pos3D(0, 0, 0),
            location: Location.minecraft('oak_log'),
            properties: {
                axis: 'x'
            }
        },
        {
            pos: new Pos3D(0, 1, 0),
            location: Location.minecraft('oak_planks'),
            properties: {}
        }
    ]).toJson())
})

dataPackRouter.post('/schematics/open', (req, res) => {
    const schamtic = Schematic.fromJson(req.body.data)
    openSchematics.set(req.body.path as string, schamtic)
    success(res, schamtic.build())
})

dataPackRouter.get('/schematics/render', (req, res) => {
    ensureSchematic(res, req.query.path as string, (schematic) => schematic.build())
})

dataPackRouter.get('/schematics/close', (req, res) => {
    openSchematics.delete(req.query.path as string)
    success(res)
})

dataPackRouter.get('/schematics/select-data', (req, res) => {
    ensureSchematic(
        res, req.query.path as string, 
        (schematic) => schematic.getBlockProperties(req.query.selection as string)
    )
})

dataPackRouter.post('/schematics/edit-selection', (req, res) => {
    ensureSchematic(
        res, req.body.path as string, 
        (schematic) => schematic.updateBlock(req.body.selection as string, req.body.changes)
    )
})

function ensureSchematic(res: Response, path: string, get: (schematic: Schematic) => {}) {
    const schematic = openSchematics.get(path)
    if (schematic) {
        success(res, get(schematic))
    } else {
        error(res, new Error(`Fail to render schamtic ad '${path}', it does not exists or it is not opened`))
    }
}
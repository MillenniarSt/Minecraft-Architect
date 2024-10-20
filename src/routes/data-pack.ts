import express from 'express'
import { success } from './util.js'
import { Schematic } from '../data/schematic.js'
import { Pos3D } from '../world/world3D.js'
import { Location } from '../elements/element.js'

export const dataPackRouter = express.Router()

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
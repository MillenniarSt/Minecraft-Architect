import express from 'express'
import fs from 'fs'
import path from 'path'
import { success } from './util.js'
import { renderDir } from '../paths.js'
import { version } from '../elements/loader.js'
import { Schematic } from '../data/schematic.js'

export const renderRouter = express.Router()

renderRouter.get('/textures', (req, res) => {
    let entries: [PropertyKey, any][] = []

    fs.readdirSync(path.join(renderDir, version, 'textures')).forEach((pack) => {
        const pathDir = path.join(renderDir, version, 'textures', pack)
        recursiveReadDir(pathDir).forEach((texture) => {
            entries.push([`${pack}:${texture.substring(pathDir.length +1, texture.lastIndexOf('.'))}`, texture])
        })
    })

    success(res, Object.fromEntries(entries))
})

function recursiveReadDir(dir: string): string[] {
    const files: string[] = []

    fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file)
        if(fs.lstatSync(filePath).isDirectory()) {
            files.push(...recursiveReadDir(filePath))
        } else {
            files.push(filePath)
        }
    })

    return files
}

renderRouter.get('/objects', (req, res) => {
    let entries: [PropertyKey, any][] = []

    fs.readdirSync(path.join(renderDir, version, 'blocks')).forEach((pack) => {
        const packDir = path.join(renderDir, version, 'blocks', pack)
        fs.readdirSync(packDir).forEach((render) => {
            entries.push([`${pack}:${render.substring(0, render.lastIndexOf('.'))}`, JSON.parse(fs.readFileSync(path.join(packDir, render), 'utf8'))])
        })
    })

    success(res, Object.fromEntries(entries))
})
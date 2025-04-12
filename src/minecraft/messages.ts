//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/
//

import fs from 'fs'
import path from 'path'
import { OnMessage } from '../connection/socket.js'
import { getProject } from '../project.js'

export function registerRenderMessages(messages: OnMessage) {
    messages.set('render/textures', (data, side, id) => {
        let entries: [PropertyKey, any][] = []

        fs.readdirSync(path.join(getProject().renderDir, 'textures')).forEach((pack) => {
            const pathDir = path.join(getProject().renderDir, 'textures', pack)
            recursiveReadDir(pathDir).forEach((texture) => {
                entries.push([`${pack}:${texture.substring(pathDir.length + 1, texture.lastIndexOf('.'))}`, texture])
            })
        })

        side.respond(id, Object.fromEntries(entries))
    })

    messages.set('render/objects', (data, side, id) => {
        let entries: [PropertyKey, any][] = []

        fs.readdirSync(path.join(getProject().renderDir, 'blocks')).forEach((pack) => {
            const packDir = path.join(getProject().renderDir, 'blocks', pack)
            fs.readdirSync(packDir).forEach((render) => {
                entries.push([`${pack}:${render.substring(0, render.lastIndexOf('.'))}`, JSON.parse(fs.readFileSync(path.join(packDir, render), 'utf8'))])
            })
        })

        side.respond(id, Object.fromEntries(entries))
    })
}

function recursiveReadDir(dir: string): string[] {
    const files: string[] = []

    fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file)
        if (fs.lstatSync(filePath).isDirectory()) {
            files.push(...recursiveReadDir(filePath))
        } else {
            files.push(filePath)
        }
    })

    return files
}
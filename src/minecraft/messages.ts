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
import { renderDir } from '../paths.js'
import { version } from './loader.js'
import { OnMessage } from '../socket.js'

export function registerRenderMessages(messages: OnMessage) {
    messages.set('render/textures', (data, ws) => {
        let entries: [PropertyKey, any][] = []

        fs.readdirSync(path.join(renderDir, version, 'textures')).forEach((pack) => {
            const pathDir = path.join(renderDir, version, 'textures', pack)
            recursiveReadDir(pathDir).forEach((texture) => {
                entries.push([`${pack}:${texture.substring(pathDir.length + 1, texture.lastIndexOf('.'))}`, texture])
            })
        })

        ws.respond(Object.fromEntries(entries))
    })

    messages.set('render/objects', (data, ws) => {
        let entries: [PropertyKey, any][] = []

        fs.readdirSync(path.join(renderDir, version, 'blocks')).forEach((pack) => {
            const packDir = path.join(renderDir, version, 'blocks', pack)
            fs.readdirSync(packDir).forEach((render) => {
                entries.push([`${pack}:${render.substring(0, render.lastIndexOf('.'))}`, JSON.parse(fs.readFileSync(path.join(packDir, render), 'utf8'))])
            })
        })

        ws.respond(Object.fromEntries(entries))
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
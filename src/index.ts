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

import { OnMessage } from './connection/socket.js'
import { loader } from './minecraft/loader.js'
import { registerRenderMessages } from './minecraft/messages.js'
import { getProject, Project, registerProjectMessages, setProject } from './project.js'
import { registerMaterialMessages } from './config/material.js'
import { Exporter } from './exporter/exporter.js'
import fs from 'fs'

/**
 * Import all Builders here
 * so you make sure they are registered
 */
import './materials/simple/base.js'
import { registerRandomMessages } from './exporter/random.js'
import { registerbuilderMessages } from './exporter/builder.js'
import path from 'path'

const log = console.log
console.log = (...args) => {
    log('\x1b[90m[   Minecraft    ]', ...args, '\x1b[0m')
}

const info = console.info
console.info = (...args) => {
    info('[   Minecraft    ]', ...args)
}

const warn = console.warn
console.warn = (...args) => {
    warn('\x1b[33m[   Minecraft    ] | WARN |', ...args, '\x1b[0m')
}

const error = console.error
console.error = (...args) => {
    error('\x1b[31m[   Minecraft    ] | ERROR |', ...args, '\x1b[0m')
}

async function shutdown() {
    console.warn('Closing Minecraft Architect...')
    const project = getProject()
    if(project) {
        await project.server.close()
        process.exit()
    }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('uncaughtException', (err) => {
    console.error(err)
    shutdown()
})

const identifier: string = process.argv[2]!
const port: number = process.argv[3] ? Number(process.argv[3]) : 8225
const isClientSide: boolean = process.argv[4] === 'true'

console.log(`Starting Minecraft Architect for project ${identifier} on port ${port} [${isClientSide ? 'client' : 'server'}]`)

setProject(new Project(identifier, port, isClientSide))

if(!fs.existsSync(getProject().buildDir)) {
    fs.mkdirSync(getProject().buildDir)
    fs.mkdirSync(path.join(getProject().buildDir, 'schematics'))
}

// Test Export
const socketMessages: OnMessage = new Map([
    ['open-channel', (data, side, id) => {
        if (data.id.startsWith('export')) {
            const exporter = Exporter.fromJson(data.data)
            const schematic = exporter.build()
            schematic.print()
            fs.writeFileSync(path.join(getProject().buildDir, 'schematics', 'test.schem'), schematic.toSchem())
            console.info(`Created Schematic on ${path.join(getProject().buildDir, 'schematics', 'test.schem')}`)
        }
        side.respond(id)
    }]
])

loader.load()

registerProjectMessages(socketMessages)
registerRandomMessages(socketMessages)
registerbuilderMessages(socketMessages)
registerRenderMessages(socketMessages)
registerMaterialMessages(socketMessages)

getProject().server.open(socketMessages)

console.log(`Architect started: [${isClientSide ? 'client' : 'server'}]`)
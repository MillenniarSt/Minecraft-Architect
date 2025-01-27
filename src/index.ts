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

import { OnMessage } from './socket.js'
import { loader } from './minecraft/loader.js'
import { registerRenderMessages } from './minecraft/messages.js'
import { project, Project, setProject } from './project.js'
import { registerMaterialMessages } from './config/material.js'

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

const debug = console.debug
console.debug = (...args) => {
    debug('[   Minecraft    ] | DEBUG |', ...args)
}

console.log('Minecraft Starting, waiting for server data...')

process.on('message', async (message) => {
    const data = JSON.parse(message as string)

    const socketMessages: OnMessage = new Map([
        ['load/configs', async (data, ws) => {
            loader.load()
            await project.loadConfigs()
            ws.respond()
        }],
        ['load/project', async (data, ws) => {
            ws.respond()
        }],
        ['open-channel', (data, ws) => {
            if(data.id.startsWith('export')) {
                
            }
            ws.respond() 
        }]
    ])

    setProject(new Project(data.identifier, data.port))

    registerRenderMessages(socketMessages)
    registerMaterialMessages(socketMessages)

    project.server.open(socketMessages)

    console.log('Architect started')
    process.send!('done')
})
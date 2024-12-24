import { OnMessage } from './socket.js'
import { loader } from './minecraft/loader.js'
import { registerRenderMessages } from './minecraft/messages.js'
import { registerElementsMessages } from './elements/messages.js'
import { project, Project, setProject } from './project.js'
import { registerMaterialMessages } from './config/material.js'

const log = console.log
console.log = (...args) => {
    log('\x1b[90m[     Server     ]', ...args, '\x1b[0m')
}

const info = console.info
console.info = (...args) => {
    info('[     Server     ] ', ...args)
}

const warn = console.warn
console.warn = (...args) => {
    warn('\x1b[33m[     Server     ] | WARN |', ...args, '\x1b[0m')
}

const error = console.error
console.error = (...args) => {
    error('\x1b[31m[     Server     ] | ERROR |', ...args, '\x1b[0m')
}

const debug = console.debug
console.debug = (...args) => {
    debug('[     Server     ] | DEBUG |', ...args)
}

console.log('Minecraft Starting, waiting for server data...')

process.on('message', async (message) => {
    const data = JSON.parse(message as string)

    const socketMessages: OnMessage = new Map([
        ['open-project', async (data, ws) => {
            loader.load()
            await project.loadConfigs()
            ws.respond({})
        }]
    ])

    setProject(new Project(data.identifier, data.port))

    registerRenderMessages(socketMessages)
    registerElementsMessages(socketMessages)
    registerMaterialMessages(socketMessages)

    project.server.open(socketMessages)

    console.log('Architect started')
    process.send!('done')
})
import { OnMessage } from './socket.js'
import { loader } from './minecraft/loader.js'
import { registerRenderMessages } from './minecraft/messages.js'
import { registerElementsMessages } from './elements/messages.js'
import { project, Project, setProject } from './project.js'
import { registerMaterialMessages } from './config/material.js'
import chalk from 'chalk'

const log = console.log
console.log = (...args) => {
    log(chalk.gray('[   Minecraft    ]', ...args))
}

const info = console.info
console.info = (...args) => {
    info('[   Minecraft    ] ', ...args)
}

const warn = console.warn
console.warn = (...args) => {
    warn(chalk.yellow('[   Minecraft    ] | WARN |', ...args))
}

const error = console.error
console.error = (...args) => {
    error(chalk.red('[   Minecraft    ] | ERROR |', ...args))
}

const debug = console.debug
console.debug = (...args) => {
    debug('[   Minecraft    ] | DEBUG |', ...args)
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
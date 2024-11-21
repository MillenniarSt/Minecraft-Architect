import { OnMessage } from './socket.js'
import { loader } from './minecraft/loader.js'
import { registerRenderMessages } from './minecraft/messages.js'
import { registerSchematicMessages } from './builder/data-pack/schematic.js'
import { registerElementsMessages } from './elements/messages.js'
import { Project, setProject } from './project.js'

const log = console.log
console.log = (...args) => {
    log('[   Minecraft    ] ', ...args)
}

console.log('Minecraft Starting, waiting for server data...')

process.on('message', async (message) => {
    const data = JSON.parse(message as string)

    const socketMessages: OnMessage = new Map([
        ['open-project', (data, ws) => {
            loader.load()
            ws.respond({})
        }]
    ])

    registerRenderMessages(socketMessages)
    registerSchematicMessages(socketMessages)
    registerElementsMessages(socketMessages)

    setProject(new Project(data.identifier, data.port, socketMessages))

    console.log('Architect started')
    process.send!('done')
})
import { OnMessage, openSocketServer } from './socket.js'
import { loader } from './elements/loader.js'
import { registerRenderMessages } from './elements/render.js'
import { registerSchematicMessages } from './builder/data-pack/schematic.js'

const log = console.log
console.log = (...args) => {
    log('[   Minecraft    ] ', ...args)
}

console.log('Minecraft Starting...')

const port = 8990

// Send Architect Data

if (process.send) {
    process.send({
        identifier: 'minecraft',
        name: 'Minecraft',
        port: port
    })
}

// Socket

const socketMessages: OnMessage = new Map([
    ['open-project', (data, ws) => {
        loader.load()
        ws.respond({})
    }]
])

registerRenderMessages(socketMessages)
registerSchematicMessages(socketMessages)

openSocketServer(port, socketMessages)
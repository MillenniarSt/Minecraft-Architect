import { OnMessage } from "../connection/socket"

export function registerbuilderMessages(messages: OnMessage) {
    messages.set('builder/get-types', async (data, side, id) => {
        side.respond(id, [
            { id: 'material', options: { block: 'block' } }
        ])
    })
}
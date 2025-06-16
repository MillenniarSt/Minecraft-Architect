//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { v4 } from "uuid"
import { WebSocket } from 'ws'
import { WebSocketError } from "./server.js"

export abstract class SocketSide {

    protected waitingRequests: Map<string, (data: any) => void> = new Map()
    protected channels: Map<string, (data: {} | null) => void> = new Map()

    constructor(readonly socket: WebSocket) { }

    abstract get isClientSide(): boolean

    send(path: string, data?: {} | null) {
        this.socket.send(JSON.stringify({ path, data: data ?? {} }))
    }

    sendChannel(channel: string, data?: {} | null) {
        this.socket.send(JSON.stringify({ channel, data: data ?? {} }))
    }

    request(path: string, data?: {} | null): Promise<any> {
        return new Promise((resolve) => {
            const id = v4()
            this.waitingRequests.set(id, resolve)
            this.socket.send(JSON.stringify({ path: path, id: id, data: data ?? {} }))
        })
    }

    respond(id: string | undefined | null, data?: {}, err?: WebSocketError) {
        if (id === undefined) {
            console.error(`[ Socket ] |  RES   | Trying to respond without a response id`)
        } else {
            this.socket.send(JSON.stringify({ id: id, data: data, err: err }))
        }
    }

    onResponse(res: any) {
        if (res.channel) {
            const f = this.channels.get(res.channel)
            if (f) {
                f(res.data)
            } else {
                console.error(`Invalid Channel ID: ${res.channel}`)
            }
        } else if (res.id) {
            const f = this.waitingRequests.get(res.id)
            if (f) {
                f(res.data)
                this.waitingRequests.delete(res.id)
            } else {
                console.error(`Invalid Response ID: ${res.id}`)
            }
        } else {
            console.warn(`Message is not a Response: ${res}`)
        }
    }

    async openChannel<T extends {} | null>(id: string, data: any, onMessage: (data: T) => void): Promise<(data: {} | null) => void> {
        await this.request('open-channel', { id, data })
        this.channels.set(id, onMessage as (data: {} | null) => void)
        return (data) => {
            this.sendChannel(id, data)
        }
    }

    isRunningChannel(id: string): boolean {
        return this.channels.has(id)
    }

    closeChannel(id: string): void {
        this.send('close-channel', id)
        this.channels.delete(id)
    }
}

export class ServerSide extends SocketSide {

    readonly isClientSide = false
}

export class ClientSide extends SocketSide {
    
    readonly isClientSide = true
}
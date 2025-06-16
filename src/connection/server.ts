//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { WebSocketServer, WebSocket } from 'ws'
import { ClientSide, ServerSide, SocketSide } from './side.js'
import { ServerProblem } from './errors.js'
import { getProject } from '../project.js'

export type WebSocketMessage = {
    path: string,
    id?: string,
    data: {}
}

export type WebSocketResponse = {
    id: string,
    data?: {},
    err?: WebSocketError
}

export type WebSocketError = {
    severity: 'warn' | 'error' | 'fatal',
    name: string,
    message: string,
    stack?: string,
    errno?: string,
    syscall?: string
}

export type MessageFunction<D = any> = (data: D, sender: SocketSide, id?: string) => void

export type OnMessage = Map<string, MessageFunction>

export class ArchitectServer {

    private _wss: WebSocketServer | null = null

    private _side: SocketSide | null = null

    constructor(readonly port: number) { }

    open(onMessage: OnMessage) {
        this._wss = new WebSocketServer({ port: this.port })

        console.log(`[ Socket ] |  OPEN  | WebSocketServer open on port ${this.port}`)

        this.wss.on('connection', (ws) => {
            console.log(`[ Socket ] |  JOIN  | Client Connected on port ${this.port}`)

            if (this._side) {
                console.log(`[ Socket ] | CLOSE  | Disconnected old client: ${this._side.socket.url}`)
                this._side.socket.close()
            }
            this._side = getProject().isClientSide ? new ClientSide(ws) : new ServerSide(ws)

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString())

                    if (message.path) {
                        try {
                            const f = onMessage.get(message.path)
                            if (f) {
                                f(message.data, this.side, message.id)
                            } else {
                                console.error(`[ Socket ] |  GET   | Invalid Message Path : ${message.path}`)
                            }
                        } catch (error) {
                            const socketError = error instanceof ServerProblem ? error.toSocketError() : toSocketError(error)
                            this.side.respond(message.id ?? null, { path: message.path, data: message.data }, socketError)
                        }
                    } else {
                        if (message.err) {
                            console.error(`[ Socket ] |  GET   | Response Error : ${message.err.stack}`)
                        }
                        this.side.onResponse(message)
                    }
                } catch (error) {
                    console.error(`[ Socket ] |  GET   | Invalid Message`)
                    this.side.send('error', toSocketError(error))
                }
            })

            ws.on('error', (err) => {
                console.error(err)
            })
        })
    }

    close(): Promise<void> {
        return new Promise((resolve) => {
            if(this._wss) {
                this._wss.close(() => {
                    console.warn('[ Socket ] | CLOSE  | Closed Minecraft WebSocket Server')
                    resolve()
                })
            } else {
                resolve()
            }
        })
    }

    get wss(): WebSocketServer {
        return this._wss!
    }

    get side(): SocketSide {
        return this._side!
    }
}

export function toSocketError(err: any): WebSocketError {
    return {
        severity: 'error',
        name: err.name,
        message: err.message,
        stack: err.stack,
        errno: err.errno,
        syscall: err.syscall
    }
}
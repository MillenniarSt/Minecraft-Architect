import { WebSocketServer, WebSocket } from 'ws'
import chalk from 'chalk'
import { v4 } from 'uuid'

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
    name: string,
    message: string,
    stack: string,
    errno: string,
    syscall: string
}

export type OnMessage = Map<string, (data: any, ws: WsActions) => void>

export type WsActions = {
    respond: (data: {}, err?: WebSocketError) => void,
    sendToServer: (path: string, data?: {}) => void
    sendToClient: (path: string, data?: {}) => void
    webSocket: WebSocket
}

export class ArchitectServer {

    private _wss: WebSocketServer | null = null

    private _client: WebSocket | null = null
    private _server: WebSocket | null = null

    private waitingRequests: Map<string, (data: any) => void> = new Map()

    constructor( readonly port: number ) { }

    open(onMessage: OnMessage) {
        onMessage.set('define', (data, ws) => {
            switch(data.side) {
                case 'server': this._server = ws.webSocket; break
                case 'client': this._client = ws.webSocket; break
                default: console.log(`Invalid WebSocket side: ${data.side}`); ws.respond({}); return
            }
            console.log(`Defined connection to Beaver ${data.side} side`)
            ws.respond({})
        })

        this._wss = new WebSocketServer({ port: this.port })

        console.log(`[ Socket ] |  OPEN  | WebSocketServer open on port ${this.port}`)

        this.wss.on('connection', (ws) => {
            console.log(`[ Socket ] |  JOIN  | Client Connected on port ${this.port}`)

            const respond = (id: string | undefined | null, data?: {}, err?: WebSocketError) => {
                if (id === undefined) {
                    console.log(chalk.red(`[ Socket ] |  RES   | ERR | Trying to respond without a response id`))
                } else {
                    ws.send(JSON.stringify({ id: id, data: data ?? {}, err: err }))
                }
            }

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString())

                    if (message.path) {
                        try {
                            const f = onMessage.get(message.path)
                            if (f) {
                                f(message.data, {
                                    respond: (data, err) => respond(message.id, data, err),
                                    sendToClient: this.sendToClient,
                                    sendToServer: this.sendToServer,
                                    webSocket: ws
                                })
                            } else {
                                console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Invalid Message Path : ${message.path}`))
                            }
                        } catch (error) {
                            respond(message.id ?? null, { path: message.path, data: message.data }, toSocketError(error))
                        }
                    } else {
                        if (message.err) {
                            console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Response Error : ${message.err.stack}`))
                        }
                        this.onResponse(message)
                    }
                } catch (error) {
                    console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Invalid Message`))
                    respond(null, {}, toSocketError(error))
                }
            })
        })
    }

    sendToClient(path: string, data?: {}) {
        this.client.send(JSON.stringify({ path, data: data ?? {} }))
    }

    sendToServer(path: string, data?: {}) {
        this.server.send(JSON.stringify({ path, data: data ?? {} }))
    }

    requestToClient(path: string, data?: {}): Promise<any> {
        return new Promise((resolve) => {
            const id = v4()
            this.waitingRequests.set(id, resolve)
            this.client.send(JSON.stringify({ path: path, id: id, data: data ?? {} }))
        })
    }

    requestToServer(path: string, data?: {}): Promise<any> {
        return new Promise((resolve) => {
            const id = v4()
            this.waitingRequests.set(id, resolve)
            this.server.send(JSON.stringify({ path: path, id: id, data: data ?? {} }))
        })
    }

    private onResponse(res: WebSocketResponse) {
        const f = this.waitingRequests.get(res.id)
        if (f) {
            f(res.data)
            this.waitingRequests.delete(res.id)
        } else {
            console.debug('[ Socket ] |  GET   | Invalid Response ID:', res.id)
        }
    }

    get wss(): WebSocketServer {
        return this._wss!
    }

    get client(): WebSocket {
        return this._client!
    }

    get server(): WebSocket {
        return this._server!
    }
}

export function toSocketError(err: any): WebSocketError {
    return {
        name: err.name,
        message: err.message,
        stack: err.stack,
        errno: err.errno,
        syscall: err.syscall
    }
}
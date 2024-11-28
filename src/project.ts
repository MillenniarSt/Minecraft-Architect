import { WebSocketServer, WebSocket } from "ws";
import { ProjectConfig } from "./config/config.js";
import { OnMessage, openSocketServer, WebSocketMessage, WebSocketResponse } from "./socket.js";
import chalk from "chalk";
import { v4 } from "uuid";
import { MaterialConfig } from "./config/material.js";

export let project: Project

export function setProject(pj: Project) {
    project = pj
}

export class Project {

    readonly identifier: string

    readonly configs: {
        material: MaterialConfig
    } = {
        material: new MaterialConfig('materials.json')
    }

    private readonly server: WebSocketServer
    private beaverServer: WebSocket | undefined

    constructor(
        identifier: string,
        port: number
    ) {
        this.identifier = identifier
        this.server = new WebSocketServer({ port })
    }

    open(socketMessages: OnMessage) {
        openSocketServer(this.server, socketMessages, this.onResponse, (ws) => this.beaverServer = ws)
    }

    async generateConfigs() {
        const entries = Object.entries(this.configs)
        for(let i = 0; i < entries.length; i++) {
            await entries[i][1].generate()
        }
    }

    async loadConfigs() {
        const entries = Object.entries(this.configs)
        for(let i = 0; i < entries.length; i++) {
            entries[i][1].clear()
            await entries[i][1].load()
        }
    }

    async buildConfigs() {
        const entries = Object.entries(this.configs)
        for(let i = 0; i < entries.length; i++) {
            entries[i][1].clear()
            await entries[i][1].build()
        }
    }

    sendToServer(path: string, data?: {}) {
        this.messageToServer({path: path, data: data ?? {}})
    }

    requestToServer(path: string, data?: {}): Promise<any> {
        return new Promise((resolve) => {
            const id = v4()
            this.waitingRequests.set(id, resolve)
            this.messageToServer({path: path, data: data ?? {}, id: id})
        })
    }

    messageToServer(message: WebSocketMessage) {
        if(this.beaverServer) {
            this.beaverServer.send(JSON.stringify(message))
        } else {
            console.log(chalk.redBright('[ Socket ] |  SEND  | ERR | Cannot send data: Beaver Architect Server is not yet connected'))
        }
    }

    waitingRequests: Map<string, (data: any) => void> = new Map()

    private onResponse(res: WebSocketResponse) {
        const f = this.waitingRequests.get(res.id)
        if(f) {
            f(res.data)
            this.waitingRequests.delete(res.id)
        } else {
            console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Invalid Response ID: ${res.id}`))
        }
    }
}
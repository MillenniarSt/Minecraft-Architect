import { WebSocketServer } from "ws";
import { ProjectConfig } from "./config/config.js";
import { OnMessage, openSocketServer } from "./socket.js";

export let project: Project

export function setProject(pj: Project) {
    project = pj
}

export class Project {

    readonly identifier: string

    readonly config: ProjectConfig

    readonly server: WebSocketServer

    constructor(
        identifier: string,

        port: number,
        socketMessages: OnMessage
    ) {
        this.identifier = identifier
        this.config = new ProjectConfig()
        this.server = new WebSocketServer({ port })

        openSocketServer(this.server, port, socketMessages)
    }
}
//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/
//

import { ArchitectServer } from "./socket.js";
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

    readonly server: ArchitectServer

    constructor(
        identifier: string,
        port: number
    ) {
        this.identifier = identifier
        this.server = new ArchitectServer(port)
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
}
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

import { ArchitectServer, OnMessage } from "./connection/socket.js";
import { MaterialConfig } from "./config/material.js";
import { loader } from "./minecraft/loader.js";
import path from 'path'
import getAppDataPath from "appdata-path";
import { Location } from "./minecraft/location.js";

let project: Project | undefined

export function setProject(pj: Project) {
    project = pj
}

export function getProject(): Project {
    return project!
}

export const minecraftDir = getAppDataPath('.minecraft')

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
        port: number,
        readonly isClientSide: boolean
    ) {
        this.identifier = identifier
        this.server = new ArchitectServer(port)
    }

    readonly dir: string = path.dirname(process.execPath)
    readonly buildDir: string = path.join(this.dir, 'build')
    readonly resourceDir: string = path.join(this.dir, 'resources')

    readonly configDir: string = path.join(this.resourceDir, 'config')
    readonly dataDir: string = path.join(this.resourceDir, 'data')
    readonly renderDir: string = path.join(this.resourceDir, 'render')

    iconPath(location: Location): string {
        return path.join(this.resourceDir, 'render', 'icons', `${location.toDir()}.png`)
    }

    private loadedConfigs = false

    async loadConfigs() {
        if (!this.loadedConfigs) {
            this.loadedConfigs = true
            const entries = Object.entries(this.configs)
            for (let i = 0; i < entries.length; i++) {
                const config = entries[i][1]
                if (await config.shouldGenerate()) {
                    await config.generate()
                } else {
                    await config.load()
                }
            }
        }
    }

    async buildConfigs() {
        const entries = Object.entries(this.configs)
        for (let i = 0; i < entries.length; i++) {
            entries[i][1].clear()
            await entries[i][1].build()
        }
    }
}

export function registerProjectMessages(messages: OnMessage) {
    messages.set('load/configs', async (data, side, id) => {
        loader.load()
        await getProject().loadConfigs()
        side.respond(id)
    })
    messages.set('load/project', async (data, side, id) => {
        side.respond(id)
    })
}
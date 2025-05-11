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
import { GenerationData, MinecraftLoader } from "./minecraft/loader.js";
import path from 'path'
import getAppDataPath from "appdata-path";
import { Location } from "./minecraft/location.js";

export const VERSION = '1.0.0'

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
        readonly dir: string,
        readonly mcVersion: string,
        identifier: string,
        port: number,
        readonly isClientSide: boolean,

        readonly loader: MinecraftLoader = new MinecraftLoader(new GenerationData(VERSION, isClientSide ? 'client' : 'server', mcVersion), 3465),

        readonly buildDir: string = path.join(dir, 'build'),
        readonly resourceDir: string = path.join(dir, 'resources'),
    
        readonly assetsDir: string = path.join(resourceDir, 'assets'),
        readonly configDir: string = path.join(resourceDir, 'config'),
        readonly dataDir: string = path.join(resourceDir, 'data'),
        readonly renderDir: string = path.join(resourceDir, 'render'),

        readonly internalResourceDir: string = path.join(__dirname, '..', 'resources')
    ) {
        this.identifier = identifier
        this.server = new ArchitectServer(port)
    }

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
        getProject().loader.load()
        await getProject().loadConfigs()
        side.respond(id)
    })
    messages.set('load/project', async (data, side, id) => {
        side.respond(id)
    })
}
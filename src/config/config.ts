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

import path from "path"
import fs from "fs"
import { getProject } from "../project.js"

export abstract class ProjectConfig {

    abstract shouldGenerate(): Promise<boolean>

    abstract clear(): void

    abstract load(): Promise<void>

    abstract build(): Promise<void>

    abstract generate(): Promise<void>

    existsConfig(file: string): Promise<boolean> {
        return getProject().server.side.request('file/exists', { path: path.join('architect', file) })
    }

    readConfig(file: string): Promise<any> {
        return getProject().server.side.request('file/read-json', { path: path.join('architect', file) })
    }

    async readDataPackConfig(file: string, onRead: (data: any) => void) {
        onRead(await getProject().server.side.request('file/read-json', { path: path.join('data_pack', 'architect_config', file) }))

        const dataPacks = await getProject().server.side.request('file/read-dir', { path: path.join('dependencies', 'data_packs') })
        for(let i = 0; i < dataPacks.length; i++) {
            onRead(await getProject().server.side.request('file/read-json', { path: path.join('dependencies', 'data_packs', dataPacks[i], 'architect_config', file) }))
        } 
    }

    writeConfig(file: string, data: {}) {
        return getProject().server.side.request('file/write-json', { path: path.join('architect', file), data: data })
    }
}

export abstract class ProjectConfigFile extends ProjectConfig {

    constructor(readonly file: string) {
        super()
    }

    abstract loadData(data: any): void

    abstract data(): {}

    shouldGenerate(): Promise<boolean> {
        return this.existsConfig(this.file)
    }

    async load(): Promise<void> {
        this.loadData(await this.readConfig(this.file))
    }

    async build() {        
        await this.readDataPackConfig(this.file, this.loadData)

        this.writeConfig(this.file, this.data())
    }

    async generate() {
        const data = fs.readFileSync(path.join(getProject().configDir, this.file))
        this.loadData(data)
        this.writeConfig(this.file, data)
    }
}
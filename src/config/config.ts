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
import { project } from "../project.js"
import { configDir } from "../paths.js"

export abstract class ProjectConfig {

    abstract clear(): void

    abstract load(): Promise<void>

    abstract build(): Promise<void>

    abstract generate(): Promise<void>

    async readConfig(file: string): Promise<any> {
        //return JSON.parse(fs.readFileSync('C:\\Users\\Angelo\\AppData\\Roaming\\Beaver Architect\\projects\\millenniar.test\\architect\\materials.json', 'utf8'))
        return await project.server.requestToServer('file/read-json', { path: path.join('architect', file) })
    }

    async readDataPackConfig(file: string, onRead: (data: any) => void) {
        onRead(await project.server.requestToServer('file/read-json', { path: path.join('data_pack', 'architect_config', file) }))

        const dataPacks = await project.server.requestToServer('file/read-dir', { path: path.join('dependencies', 'data_packs') })
        for(let i = 0; i < dataPacks.length; i++) {
            onRead(await project.server.requestToServer('file/read-json', { path: path.join('dependencies', 'data_packs', dataPacks[i], 'architect_config', file) }))
        } 
    }

    writeConfig(file: string, data: {}) {
        return project.server.sendToServer('file/write-json', { path: path.join('architect', file), data: data })
    }
}

export abstract class ProjectConfigFile extends ProjectConfig {

    constructor(readonly file: string) {
        super()
    }

    abstract loadData(data: any): void

    abstract data(): {}

    async load(): Promise<void> {
        this.loadData(await this.readConfig(this.file))
    }

    async build() {        
        await this.readDataPackConfig('materials.json', this.loadData)

        this.writeConfig('materials.json', this.data())
    }

    async generate() {
        this.writeConfig(this.file, fs.readFileSync(path.join(configDir, this.file)))
    }
}
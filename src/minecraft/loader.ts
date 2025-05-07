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

import fs from 'fs'
import { Item } from "./register/item.js"
import AdmZip from "adm-zip"
import path from "path"
import { BlockType } from "./register/block.js"
import { getProject, minecraftDir } from '../project.js'
import { Location } from './location.js'
import { IdNotExists } from '../connection/errors.js'

export class MinecraftLoader {

    private _generation: GenerationData

    readonly dataVersion: number
    private archive: AdmZip

    protected blocks: Map<string, BlockType> = new Map()
    protected items: Map<string, Item> = new Map()

    constructor(generation: GenerationData, dataVersion: number) {
        this.dataVersion = dataVersion
        this._generation = generation
        this.archive = new AdmZip(this.resourceJar)
    }

    hasBlock(location: Location | string): boolean {
        return this.blocks.has(location instanceof Location ? location.toString() : location )
    }

    getBlock(location: Location | string): BlockType {
        const id = location instanceof Location ? location.toString() : location
        const block = getProject().loader.blocks.get(id)
        if (!block)
            throw new IdNotExists(id, 'Blocks')
        return block
    }

    getAllBlocks(): BlockType[] {
        return [...this.blocks.values()]
    }

    hasItem(location: Location | string): boolean {
        return this.items.has(location instanceof Location ? location.toString() : location )
    }

    getItem(location: Location | string): Item {
        const id = location instanceof Location ? location.toString() : location
        const block = getProject().loader.items.get(id)
        if (!block)
            throw new IdNotExists(id, 'Items')
        return block
    }

    getAllItems(): Item[] {
        return [...this.items.values()]
    }

    load() {
        console.log('Loading Minecraft Resource')

        const lastGeneration = GenerationData.lastGeneration()

        if (lastGeneration.shouldUpdate(this.generation)) {
            if (fs.existsSync(getProject().resourceDir)) {
                fs.rmSync(getProject().resourceDir, { recursive: true })
            }
            this.generate()
            this._generation = lastGeneration.override(this.generation)
            this.generation.saveAsLastGeneration()
        } else {
            this.blocks = new Map()
            this.items = new Map()

            fs.readdirSync(getProject().dataDir).forEach((pack) => {
                fs.readdirSync(path.join(getProject().dataDir, pack, 'block')).forEach((block) => {
                    const location = new Location(pack, block.substring(0, block.lastIndexOf('.')))
                    try {
                        this.blocks.set(location.toString(), BlockType.fromJson(location, JSON.parse(fs.readFileSync(path.join(getProject().dataDir, pack, 'block', block), 'utf8'))))
                    } catch (error) {
                        console.error(`Error while loading block ${location.toString()}`, error)
                    }
                })
            })

            fs.readdirSync(getProject().dataDir).forEach((pack) => {
                fs.readdirSync(path.join(getProject().dataDir, pack, 'item')).forEach((item) => {
                    const location = new Location(pack, item.substring(0, item.lastIndexOf('.')))
                    try {
                        this.items.set(location.toString(), Item.fromJson(location, JSON.parse(fs.readFileSync(path.join(getProject().dataDir, pack, 'item', item), 'utf8'))))
                    } catch (error) {
                        console.error(`Error while loading item ${location.toString()}`, error)
                    }
                })
            })

            console.log('Loaded all Minecraft Resource')
        }
    }

    generate() {
        console.log('Generating Minecraft Resource')

        this.blocks = new Map()
        this.items = new Map()

        const savedNames = new Map<string, string>()

        console.log(`Parsing lang: ${this.generation.language}`)
        this.archive.getEntries().forEach(file => {
            const dirs = file.entryName.split('/')

            if (!file.isDirectory && dirs[0] === 'assets') {
                if (dirs[2] === 'lang' && dirs[3] === `${this.generation.language}.json`) {
                    const lang = JSON.parse(file.getData().toString())

                    Object.keys(lang).forEach(key => {
                        const args = key.split(".")

                        if (args.length === 3) {
                            if (args[0] === 'block') {
                                savedNames.set(new Location(args[1], args[2]).toString(), lang[key])
                            } else if (args[0] === 'item') {
                                const location = new Location(args[1], args[2])
                                const json = this.resourceJson('models/item', location)
                                if (json) {
                                    const item = Item.resource(location, lang[key], json)
                                    item.save()
                                    this.items.set(location.toString(), item)
                                }
                            }
                        }
                    })
                }
            }
        })

        console.log('Parsing blockstates')
        this.archive.getEntries().forEach(file => {
            const dirs = file.entryName.split('/')

            if (!file.isDirectory && dirs[0] === 'assets') {
                if (dirs[2] === 'blockstates') {
                    const location = new Location(dirs[1], dirs[3].substring(0, dirs[3].lastIndexOf('.')))
                    const json = this.resourceJson('blockstates', location)
                    if (json) {
                        const block = BlockType.resource(location, savedNames.get(location.toString()) ?? 'Block', json)
                        block.save()
                        this.blocks.set(location.toString(), block)
                    }
                }
            }
        })

        console.log('Generated All Resources')
    }

    resourcePath(dir: string, location: Location, extension: string): string {
        return `${location.mod}/${dir}/${location.id}.${extension}`.replace(/\\/g, '/')
    }

    dataFile(dir: string, location: Location, extension: string): string {
        return path.join(getProject().dataDir, this.resourcePath(dir, location, extension))
    }

    renderFile(dir: string, location: Location, extension: string): string {
        return path.join(getProject().renderDir, dir, `${location.toDir()}.${extension}`)
    }

    resource(dir: string, location: Location, extension: string): Buffer | null {
        const filePath = `assets/${this.resourcePath(dir, location, extension)}`
        const entry = this.archive.getEntry(filePath)
        return entry ? entry.getData() : null
    }

    resourceJson(dir: string, location: Location): any | null {
        const content = this.resource(dir, location, 'json')
        return content ? JSON.parse(content.toString()) : null
    }

    get resourceJar(): string {
        return path.join(minecraftDir, 'versions', this.generation.mcVersion, `${this.generation.mcVersion}.jar`)
    }

    get generation(): GenerationData {
        return this._generation
    }
}

export class GenerationData {

    constructor(
        readonly version: string,
        readonly side: 'client' | 'server' | 'common',
        readonly mcVersion: string,
        readonly language: string = 'en_us',
    ) { }

    static fromJson(json: any): GenerationData {
        return new GenerationData(json.version, json.side, json.mcVersion, json.language)
    }

    static lastGeneration(): GenerationData {
        const filePath = path.join(getProject().resourceDir, 'generation_data.json')
        if (fs.existsSync(filePath)) {
            return GenerationData.fromJson(JSON.parse(fs.readFileSync(filePath, 'utf8')))
        }
        return new GenerationData('0.0.0', getProject().isClientSide ? 'client' : 'server', getProject().mcVersion)
    }

    get isClient(): boolean {
        return this.side === 'client' || this.side === 'common'
    }

    get isServer(): boolean {
        return this.side === 'server' || this.side === 'common'
    }

    override(generation: GenerationData): GenerationData {
        return new GenerationData(
            generation.version,
            this.side !== generation.side ? 'common' : generation.side,
            generation.mcVersion,
            generation.language
        )
    }

    shouldUpdate(generation: GenerationData) {
        return this.version !== generation.version || this.isClient !== generation.isClient || this.isServer !== generation.isServer || this.mcVersion !== generation.mcVersion || this.language !== generation.language
    }

    toJson() {
        return {
            version: this.version,
            side: this.side,
            mcVersion: this.mcVersion,
            language: this.language
        }
    }

    saveAsLastGeneration() {
        fs.writeFileSync(path.join(getProject().resourceDir, 'generation_data.json'), JSON.stringify(this.toJson()))
    }
}
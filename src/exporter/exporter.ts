//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Schematic } from "../minecraft/schematic/schematic.js"
import { OBJECT3_MATERIAL, Seed } from "./random.js"
import { Line3 } from "../world/geo/line.js"
import { Object3 } from "../world/geo/object.js"
import { Surface } from "../world/geo/surface.js"
import { OnMessage } from "../connection/server.js"
import { SimpleSchematic } from "../minecraft/schematic/simple.js"
import { BufferKeyScheme, BufferListScheme, BufferObjectScheme, BufferStringScheme } from "../util/buffer.js"
import { PaletteSchematic } from "../minecraft/schematic/palette.js"
import { SocketClient } from "../connection/socket.js"

export class BuilderExporter {

    static readonly resultsBufferScheme = new BufferListScheme(new BufferObjectScheme([
        ['geo', new BufferKeyScheme<any>({
            'line3': Line3.BUFFER_SCHEME,
            'surface': Surface.BUFFER_SCHEME,
            'object': Object3.BUFFER_SCHEME
        })],
        ['random', new BufferStringScheme()],
        ['data', new BufferStringScheme()]
    ]))

    protected constructor(
        readonly seed: Seed,
        readonly results: BuilderMaterialResult[]
    ) { }

    static fromJson(json: any): BuilderExporter {
        return new BuilderExporter(new Seed(json.seed), json.result.map((material: any) => BuilderMaterialResult.fromJson(material)))
    }

    static fromBuffer(seed: Seed, buffer: Buffer, offset: number): BuilderExporter {
        return new BuilderExporter(seed, BuilderExporter.resultsBufferScheme.read(buffer, offset).value.map((material: any) => BuilderMaterialResult.fromBufferJson(material)))
    }

    build(schematic: Schematic) {
        this.results.forEach((result) => result.build(schematic, this.seed))
    }
}

export class BuilderMaterialResult {

    constructor(
        readonly geo: Line3 | Surface | Object3,
        readonly random: string,
        readonly data: any
    ) { }

    static fromJson(json: any): BuilderMaterialResult {
        let geo
        if (json.geo.form === 'line3') {
            geo = Line3.fromJson(json.geo.data)
        } else if (json.geo.form === 'surface') {
            geo = Surface.fromJson(json.geo.data)
        } else if (json.geo.form === 'object') {
            geo = Object3.fromJson(json.geo.data)
        } else {
            throw new Error('Invalid Object type in BuilderResult')
        }
        return new BuilderMaterialResult(geo, json.random, json.data)
    }

    static fromBufferJson(json: any): BuilderMaterialResult {
        let geo
        if (json.geo.key === 'line3') {
            geo = Line3.fromJson(json.geo.value)
        } else if (json.geo.key === 'surface') {
            geo = Surface.fromJson(json.geo.value)
        } else if (json.geo.key === 'object') {
            geo = Object3.fromJson(json.geo.value)
        } else {
            throw new Error('Invalid Object type in BuilderResult')
        }
        return new BuilderMaterialResult(geo, json.random, JSON.parse(json.data))
    }

    build(schematic: Schematic, seed: Seed) {
        if (this.geo instanceof Object3) {
            OBJECT3_MATERIAL.build(schematic, this.geo, this.random, this.data, seed)
        }
    }
}

export function registerExporterMessages(messages: OnMessage) {
    messages.set('exporter/get', async (data, side, id) => {
        console.log(`Terrain Chunk result got: took ${(new Date().getTime() - data.time)} ms`)
        const exporter = BuilderExporter.fromJson(data)
        const schematic = new SimpleSchematic()
        exporter.build(schematic)
        console.log(`Terrain Chunk result built: took ${(new Date().getTime() - data.time)} ms`)
        side.respond(id, schematic.toLinearJson())
    })
    messages.set('exporter/tcp', async (data, side, id) => {
        console.log(`Connecting to TPC Exporter on port ${data.port}`)

        const seed = new Seed(data.seed)
        const client = await SocketClient.connect(data.port, 1, {
            1: (data, id) => {
                let startTime = new Date().getTime()
                const exporter = BuilderExporter.fromBuffer(seed, data, 0)
                const schematic = new PaletteSchematic()
                exporter.build(schematic)
                console.log(`Terrain Chunk result built: took ${(new Date().getTime() - startTime)} ms`)
                client.respond(id, PaletteSchematic.BUFFER_SCHEME.writeAll(schematic.toBufferFormat()))
                console.log(`Terrain Chunk sent: took ${(new Date().getTime() - startTime)} ms`)
            }
        })
        side.respond(id, undefined)
    })
}
import { encode, Int, Short } from "nbt-ts";
import { Vec3 } from "../world/vector.js";
import { Block } from "./elements/block.js";
import { BlockState } from "./register/block.js";
import * as zlib from 'zlib';
import { getProject } from "../project.js";

export class Schematic {

    blocks: Map<number, Map<number, Map<number, Block>>> = new Map()

    setBlock(pos: Vec3, block: Block) {
        if (!this.blocks.has(pos.x)) {
            this.blocks.set(pos.x, new Map())
        }
        if (!this.blocks.get(pos.x)!.has(pos.y)) {
            this.blocks.get(pos.x)!.set(pos.y, new Map())
        }
        this.blocks.get(pos.x)!.get(pos.y)!.set(pos.z, block)
    }

    getBlock(pos: Vec3): Block | undefined {
        return this.blocks.get(pos.x)?.get(pos.y)?.get(pos.z)
    }

    removeBlock(pos: Vec3) {
        this.blocks.get(pos.x)?.get(pos.y)?.delete(pos.z)
        if (!this.blocks.get(pos.x)?.get(pos.y)?.size) {
            this.blocks.get(pos.x)?.delete(pos.y)
        }
        if (!this.blocks.get(pos.x)?.size) {
            this.blocks.delete(pos.x)
        }
    }

    join(schematic: Schematic) {
        schematic.blocks.forEach((row, x) => {
            if (!this.blocks.has(x)) {
                this.blocks.set(x, new Map())
            }
            row.forEach((column, y) => {
                if (!this.blocks.get(x)!.has(y)) {
                    this.blocks.get(x)!.set(y, new Map())
                }
                column.forEach((block, z) => this.blocks.get(x)!.get(y)!.set(z, block))
            })
        })
    }

    clear() {
        this.blocks = new Map()
    }

    getSize(): [Vec3, Vec3] {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

        for (const [x, yMap] of this.blocks) {
            for (const [y, zMap] of yMap) {
                for (const z of zMap.keys()) {
                    minX = Math.min(minX, x)
                    minY = Math.min(minY, y)
                    minZ = Math.min(minZ, z)
                    maxX = Math.max(maxX, x)
                    maxY = Math.max(maxY, y)
                    maxZ = Math.max(maxZ, z)
                }
            }
        }
        return [new Vec3(minX, minY, minZ), new Vec3(maxX - minX +1, maxY - minY +1, maxZ - minZ +1)]
    }

    toNbt(): Buffer {
        const [offset, size] = this.getSize()
        const palette: BlockState[] = []
        const blocks: { pos: [number, number, number], state: number }[] = []

        for (const [x, yMap] of this.blocks) {
            for (const [y, zMap] of yMap) {
                for (const [z, block] of zMap) {
                    let index = palette.indexOf(block.state)
                    if(index < 0) {
                        palette.push(block.state)
                        index = palette.length -1
                    }
                    blocks.push({ pos: [x + offset.x, y + offset.y, z + offset.z], state: index})
                }
            }
        }

        return zlib.gzipSync(encode('', {
            size: [new Int(size.x), new Int(size.y), new Int(size.z)],
            entities: [],
            blocks: blocks.map((block) => {
                return {
                    pos: [new Int(block.pos[0]), new Int(block.pos[1]), new Int(block.pos[2])],
                    state: new Int(block.state)
                }
            }),
            palette: palette.map((state) => {
                return {
                    Name: state.block.toString()
                }
            }),
            DataVersion: new Int(getProject().loader.dataVersion)
        }))
    }

    toSchem(): Buffer {
        const [offset, size] = this.getSize()
        const palette: BlockState[] = [getProject().loader.getBlock('minecraft:air')!.blockstates[0]]
        const blocks: number[] = []

        for (let y = offset.y; y < offset.y + size.y; y++) {
            for (let z = offset.z; z < offset.z + size.z; z++) {
                for (let x = offset.x; x < offset.x + size.x; x++) {
                    const block = this.blocks.get(x)?.get(y)?.get(z)
                    if(block) {
                        let index = palette.indexOf(block.state)
                        if(index < 0) {
                            palette.push(block.state)
                            index = palette.length -1
                        }
                        blocks.push(index)
                    } else {
                        blocks.push(0)
                    }
                }
            }
        }

        return zlib.gzipSync(encode('Schematic', {
            Version: new Int(2),
            Width: new Short(size.x),
            Height: new Short(size.y),
            Length: new Short(size.z),
            PaletteMax: new Int(palette.length),
            Palette: Object.fromEntries(palette.map((state, i) => [state.block.toString(), new Int(i)])),
            BlockData: Buffer.from(blocks.map((block) => block)),
            BlockEntities: [],
            Metadata: {
                WEOffsetX: new Int(offset.x),
                WEOffsetY: new Int(offset.y),
                WEOffsetZ: new Int(offset.z)
            },
            DataVersion: new Int(getProject().loader.dataVersion),
            Offset: new Int32Array([0, 0, 0])
        }))
    }

    print() {
        const [offset, size] = this.getSize()
        console.log(`Schematic: [offset: ${offset.toJson()}, size: ${size.toJson()}]`)

        for (let z = offset.z; z < offset.z + size.z; z++) {
            console.log(`  z: ${z}`)
            for (let y = offset.y + size.y -1; y >= offset.y; y--) {
                let line: string = ''
                for (let x = offset.x; x < offset.x + size.x; x++) {
                    line += this.blocks.get(x)?.get(y)?.get(z) !== undefined ? '#' : ' '
                }
                console.log(line)
            }
        }
    }
}
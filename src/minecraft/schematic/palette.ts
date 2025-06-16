//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { encode, Int, Short } from "nbt-ts";
import { Vec3 } from "../../world/vector.js";
import { Block } from "../elements/block.js";
import { BlockState } from "../register/block.js";
import * as zlib from 'zlib';
import { getProject } from "../../project.js";
import { BufferFixedListScheme, BufferIntScheme, BufferListScheme, BufferObjectScheme, BufferShortScheme, BufferStringScheme } from "../../util/buffer.js";
import { Schematic } from "./schematic.js";
import { mapToEntries } from "../../util/util.js";

//  x: 2^11, y: 2^10, x: 2^11
const xzMask = (1 << 11) - 1
const yMask = (1 << 10) - 1

function numberToVec(n: number): Vec3 {
    return new Vec3((n >> 21) & xzMask, (n >> 11) & yMask, n & xzMask)
}

function vecToNumber(vec: Vec3): number {
    return (vec.x << 21) | (vec.y << 11) | vec.z
}

export class PaletteSchematic extends Schematic {

    static readonly BUFFER_SCHEME = new BufferObjectScheme([
        ['palette', new BufferListScheme(new BufferStringScheme())],
        ['blocks', new BufferListScheme(new BufferFixedListScheme(new BufferShortScheme(), 4))]
    ])

    protected palette: Block[] = []
    protected paletteInverted: Map<string, number> = new Map()
    protected blocks: Map<number, number> = new Map()

    getAllBlocks(): { pos: Vec3, block: Block }[] {
        return Array.from(this.blocks.entries()).map(([pos, blockId]) => {
            return {
                pos: numberToVec(pos),
                block: this.palette[blockId]
            }
        })
    }

    getBlock(pos: Vec3): Block | undefined {
        let blockId = this.blocks.get(vecToNumber(pos))
        return blockId ? this.palette[blockId] : undefined
    }

    setBlock(pos: Vec3, block: Block) {
        let blockId = this.paletteInverted.get(block.toString())
        if (!blockId) {
            blockId = this.palette.length
            this.palette.push(block)
            this.paletteInverted.set(block.toString(), blockId)
        }
        this.blocks.set(vecToNumber(pos), blockId)
    }

    removeBlock(pos: Vec3) {
        this.blocks.delete(vecToNumber(pos))
    }

    clear() {
        this.palette = []
        this.paletteInverted = new Map()
        this.blocks = new Map()
    }

    getSize(): [Vec3, Vec3] {
        let min = new Vec3(Infinity, Infinity, Infinity)
        let max = new Vec3(-Infinity, -Infinity, -Infinity)

        this.blocks.forEach((block, nPos) => {
            let pos = numberToVec(nPos)
            min = min.min(pos)
            max = max.max(pos)
        })

        return [min, max.subtract(min).add(Vec3.UNIT)]
    }

    toBufferFormat() {
        return {
            palette: this.palette.map((block) => block.toString()),
            blocks: mapToEntries(this.blocks).map(([nPos, blockId]) => [(nPos >> 21) & xzMask, (nPos >> 11) & yMask, nPos & xzMask, blockId])
        }
    }

    toNbt(): Buffer {
        const [offset, size] = this.getSize()

        return zlib.gzipSync(encode('', {
            size: [new Int(size.x), new Int(size.y), new Int(size.z)],
            entities: [],
            palette: this.palette.map((state) => {
                return {
                    Name: state.toString()
                }
            }),
            blocks: mapToEntries(this.blocks).map(([nPos, blockId]) => {
                let pos = numberToVec(nPos)
                return {
                    pos: [new Int(pos.x - offset.x), new Int(pos.y - offset.y), new Int(pos.z - offset.z)],
                    state: new Int(blockId)
                }
            }),
            DataVersion: new Int(getProject().loader.dataVersion)
        }))
    }
}
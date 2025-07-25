//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Vec3 } from "../../world/vector.js";
import { Block } from "../elements/block.js";
import { getProject } from "../../project.js";
import { BufferFixedListScheme, BufferIntScheme, BufferListScheme, BufferObjectScheme, BufferShortScheme, BufferStringScheme } from "../../util/buffer.js";
import { Schematic } from "./schematic.js";

export class SizedPaletteSchematic extends Schematic {

    static readonly BUFFER_SCHEME = new BufferObjectScheme([
        ['pos', new BufferFixedListScheme(new BufferIntScheme(), 3)],
        ['size', new BufferFixedListScheme(new BufferIntScheme(), 3)],
        ['palette', new BufferListScheme(new BufferStringScheme())],
        ['blocks', new BufferListScheme(new BufferShortScheme())]
    ])

    readonly AIR: Block = new Block(getProject().loader.airBlockState)

    public pos: Vec3
    readonly size: Vec3

    protected palette: Block[] = [this.AIR]
    protected paletteInverted: Map<string, number> = new Map([[this.AIR.toString(), 0]])
    protected blocks: Array<number>

    constructor(pos: Vec3, size: Vec3) {
        super()
        this.pos = pos
        this.size = size
        this.blocks = new Array(this.length)
    }

    get length(): number {
        return (this.size.x * this.size.y * this.size.z) - 1
    }

    indexToPos(index: number): Vec3 {
        return new Vec3(
            index % this.size.z,
            Math.floor(index / (this.size.y * this.size.z)),
            Math.floor((index % (this.size.y * this.size.z)) / this.size.z)
        ).add(this.pos)
    }

    posToIndex(pos: Vec3): number {
        pos = pos.subtract(this.pos)
        return (pos.y * this.size.z * this.size.x) + (pos.z * this.size.x) + pos.x
    }

    getAllBlocks(): { pos: Vec3, block: Block }[] {
        return this.blocks
            .map((blockId, i) => { return { pos: this.indexToPos(i), block: this.palette[blockId] } })
            .filter((block) => block.block !== this.AIR)
    }

    getBlock(pos: Vec3): Block | undefined {
        return this.palette[this.blocks[this.posToIndex(pos)]]
    }

    setBlock(pos: Vec3, block: Block) {
        let blockId = this.paletteInverted.get(block.toString())
        if (!blockId) {
            blockId = this.palette.length
            this.palette.push(block)
            this.paletteInverted.set(block.toString(), blockId)
        }
        this.blocks[this.posToIndex(pos)] = blockId
    }

    removeBlock(pos: Vec3) {
        this.blocks[this.posToIndex(pos)] = 0
    }

    clear() {
        this.palette = [this.AIR]
        this.paletteInverted = new Map([[this.AIR.toString(), 0]])
        this.blocks = new Array(this.length)
    }

    getSize(): [Vec3, Vec3] {
        return [this.pos, this.size]
    }

    toBufferFormat() {
        return {
            pos: this.pos.toJson(),
            size: this.size.toJson(),
            palette: this.palette.map((block) => block.toString()),
            blocks: this.blocks
        }
    }
}
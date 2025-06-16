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

export abstract class Schematic {

    abstract getBlock(pos: Vec3): Block | undefined

    abstract getAllBlocks(): { pos: Vec3, block: Block }[]

    abstract setBlock(pos: Vec3, block: Block): void

    abstract removeBlock(pos: Vec3): void

    abstract clear(): void

    abstract getSize(): [Vec3, Vec3]

    join(schematic: Schematic): void {
        schematic.getAllBlocks().forEach((entry) => this.setBlock(entry.pos, entry.block))
    }

    print() {
        const [offset, size] = this.getSize()
        console.log(`Schematic: [offset: ${offset.toJson()}, size: ${size.toJson()}]`)

        for (let z = offset.z; z < offset.z + size.z; z++) {
            console.log(`  z: ${z}`)
            for (let y = offset.y + size.y - 1; y >= offset.y; y--) {
                let line: string = ''
                for (let x = offset.x; x < offset.x + size.x; x++) {
                    line += this.getBlock(new Vec3(x, y, z)) !== undefined ? '#' : ' '
                }
                console.log(line)
            }
        }
    }

    toLinearJson() {
        return {
            blocks: this.getAllBlocks().map((entry) => { return { pos: entry.pos.toJson(), block: entry.block.toString() } })
        }
    }
}
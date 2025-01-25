import { Vec3 } from "../world/vector.js";
import { Block } from "./elements/block.js";

export class Schematic {

    blocks: Map<number, Map<number, Map<number, Block>>> = new Map()

    setBlock(pos: Vec3, block: Block) {
        if (!this.blocks.has(pos.x)) {
            this.blocks.set(pos.x, new Map())
        }
        if (!this.blocks.get(pos.x)?.has(pos.y)) {
            this.blocks.get(pos.x)?.set(pos.y, new Map())
        }
        this.blocks.get(pos.x)?.get(pos.y)?.set(pos.z, block)
    }

    getBlock(x: number, y: number, z: number): Block | undefined {
        return this.blocks.get(x)?.get(y)?.get(z)
    }

    join(schematic: Schematic) {
        schematic.blocks.forEach((row, x) => {
            if (!this.blocks.has(x)) {
                this.blocks.set(x, new Map())
            }
            row.forEach((column, y) => {
                if (!this.blocks.get(x)?.has(y)) {
                    this.blocks.get(x)?.set(y, new Map())
                }
                column.forEach((block, z) => this.blocks.get(x)?.get(y)?.set(z, block))
            })
        })
    }
}
import { Vec3 } from "../world/vector.js";
import { Block } from "./elements/block.js";

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

    toNbt() {
        // TODO
    }

    toSchem() {
        // TODO
    }
}
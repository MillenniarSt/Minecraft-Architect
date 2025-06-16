//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Schematic } from "../../minecraft/schematic/schematic.js";
import { BLOCK_RANDOM, RandomEnumValue, Seed } from "../../exporter/random.js";
import { Ray } from "../ray.js";
import { Vec3 } from "../vector.js";
import { BlockType } from "../../minecraft/register/block.js";
import { Block } from "../../minecraft/elements/block.js";
import { BufferFixedListScheme, BufferIntScheme, BufferListScheme, BufferObjectScheme } from "../../util/buffer.js";

export class Object3 {

    static readonly BUFFER_SCHEME = new BufferObjectScheme([
        ['vertices', new BufferListScheme(new BufferFixedListScheme(new BufferIntScheme(), 3))],
        ['triangles', new BufferListScheme(new BufferFixedListScheme(new BufferIntScheme(), 3))]
    ])

    constructor(
        public vertices: Vec3[],
        public triangles: number[][]
    ) { }

    static fromJson(json: any): Object3 {
        return new Object3(json.vertices.map(Vec3.fromJson), json.triangles)
    }

    buildBlock(schematic: Schematic, material: BlockType) {
        this.getBlocks().forEach((vec) => {
            schematic.setBlock(vec, new Block(material.blockstates[0]))
        })
    }

    buildBlocks(schematic: Schematic, material: RandomEnumValue[], seed: Seed) {
        this.getBlocks().forEach((vec) => {
            schematic.setBlock(vec, new Block(BLOCK_RANDOM.seeded(material, seed).blockstates[0]))
        })
    }

    getBlocks(): Vec3[] {
        const blocks: Vec3[] = []

        const min = this.vertices.reduce((acc, v) => acc.min(v), this.vertices[0])
        const max = this.vertices.reduce((acc, v) => acc.max(v), this.vertices[0])

        for (let x = Math.floor(min.x); x < Math.ceil(max.x); x++) {
            for (let y = Math.floor(min.y); y < Math.ceil(max.y); y++) {
                for (let z = Math.floor(min.z); z < Math.ceil(max.z); z++) {
                    if (this.contains(new Vec3(x + 0.5, y + 0.5, z + 0.5))) {
                        blocks.push(new Vec3(x, y, z))
                    }
                }
            }
        }

        return blocks;
    }

    contains(point: Vec3): boolean {
        const ray = new Ray(point, new Vec3(0, 1, 0));

        for (const triangle of this.triangles) {
            const v0 = this.vertices[triangle[0]];
            const v1 = this.vertices[triangle[1]];
            const v2 = this.vertices[triangle[2]];

            if (ray.intersectsTriangle(v0, v1, v2)) {
                return true
            }
        }

        return false
    }

    toJson() {
        return {
            vertices: this.vertices.map(v => v.toJson()),
            triangles: this.triangles
        }
    }
}
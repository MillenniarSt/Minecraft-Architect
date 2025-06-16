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
import { Seed } from "../../exporter/random.js";
import { Vec3 } from "../vector.js";
import { BlockType } from "../../minecraft/register/block.js";
import { SimpleSchematic } from "../../minecraft/schematic/simple.js";
import { BufferFixedListScheme, BufferIntScheme, BufferListScheme, BufferObjectScheme } from "../../util/buffer.js";

export class Surface {

    static readonly BUFFER_SCHEME = new BufferObjectScheme([
        ['vertices', new BufferListScheme(new BufferFixedListScheme(new BufferIntScheme(), 3))],
        ['triangles', new BufferListScheme(new BufferFixedListScheme(new BufferIntScheme(), 3))]
    ])

    constructor(
        public vertices: Vec3[] = [],
        public triangles: number[][] = []
    ) { }

    static fromJson(json: any): Surface {
        return new Surface(json.vertices.map((v: any) => Vec3.fromJson(v)), json.triangles)
    }

    buildMaterial(material: BlockType, seed: Seed): Schematic {
        return new SimpleSchematic()
    }

    toJson(): {} {
        return {
            vertices: this.vertices.map((v) => v.toJson()),
            triangles: this.triangles
        }
    }
}
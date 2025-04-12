import { Schematic } from "../../minecraft/schematic.js";
import { Seed } from "../../exporter/random.js";
import { Vec3 } from "../vector.js";
import { BlockType } from "../../minecraft/register/block.js";

export class Surface {

    constructor(
        public vertices: Vec3[] = [],
        public triangles: number[][] = []
    ) { }

    static fromJson(json: any): Surface {
        return new Surface(json.vertices.map((v: any) => Vec3.fromJson(v)), json.triangles)
    }

    buildMaterial(material: BlockType, seed: Seed): Schematic {
        return new Schematic()
    }

    toJson(): {} {
        return {
            vertices: this.vertices.map((v) => v.toJson()),
            triangles: this.triangles
        }
    }
}
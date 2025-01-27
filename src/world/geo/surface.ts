import { Material } from "../../materials/material.js";
import { Schematic } from "../../minecraft/schematic.js";
import { Seed } from "../../util/random.js";
import { Vec3 } from "../vector.js";

export class Surface {

    constructor(
        public vertices: Vec3[] = [],
        public triangles: number[][] = []
    ) { }

    static fromJson(json: any): Surface {
        return new Surface(json.vertices.map((v: any) => Vec3.fromJson(v)), json.triangles)
    }

    buildMaterial(material: Material, seed: Seed): Schematic {
        return material.applySurface(this, seed)
    }

    toJson(): {} {
        return {
            vertices: this.vertices.map((v) => v.toJson()),
            triangles: this.triangles
        }
    }
}
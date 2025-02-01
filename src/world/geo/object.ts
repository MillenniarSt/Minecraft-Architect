import { Material } from "../../materials/material.js";
import { Schematic } from "../../minecraft/schematic.js";
import { Seed } from "../../util/random.js";
import { Quaternion } from "../quaternion.js";
import { Ray } from "../ray.js";
import { Vec3 } from "../vector.js";

export class Object3 {

    constructor(
        public vertices: Vec3[],
        public triangles: number[][],
        public pos: Vec3,
        public rotation: Quaternion = Quaternion.NORTH,
        public scale: Vec3 = Vec3.UNIT
    ) { }

    static fromJson(json: any): Object3 {
        return new Object3(json.vertices.map(Vec3.fromJson), json.triangles, Vec3.fromJson(json.pos), Quaternion.fromJson(json.rotation), Vec3.fromJson(json.scale))
    }

    buildMaterial(material: Material, seed: Seed): Schematic {
        return material.applyObject(this, seed)
    }

    getBlocks(): Vec3[] {
        const blocks: Vec3[] = []

        const min = this.vertices.reduce((acc, v) => acc.min(v), this.vertices[0])
        const max = this.vertices.reduce((acc, v) => acc.max(v), this.vertices[0])
        console.debug('Prism', min.toJson(), max.toJson())

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
            triangles: this.triangles,
            pos: this.pos,
            rotation: this.rotation,
            scale: this.scale
        }
    }
}
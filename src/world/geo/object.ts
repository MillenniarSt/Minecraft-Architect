import { Material } from "../../materials/material.js";
import { Schematic } from "../../minecraft/schematic.js";
import { Seed } from "../../util/random.js";
import { Quaternion } from "../quaternion.js";
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
        return new Object3(json.vertices.map(Vec3.fromJson), json.triangles, Vec3.fromJson(json.position), Quaternion.fromJson(json.rotation), Vec3.fromJson(json.scale))
    }

    buildMaterial(material: Material, seed: Seed): Schematic {
        return material.applyObject(this, seed)
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
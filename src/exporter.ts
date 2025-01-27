import { Material } from "./materials/material.js"
import { Schematic } from "./minecraft/schematic.js"
import { Seed } from "./util/random.js"
import { Line3 } from "./world/geo/line.js"
import { Object3 } from "./world/geo/object.js"
import { Surface } from "./world/geo/surface.js"

export class Exporter {

    protected constructor(
        readonly seed: Seed,
        readonly builderResult: BuilderResult,
        readonly materials: Record<string, Material>
    ) { }

    static fromJson(json: any): Exporter {
        const materials = Object.fromEntries(json.materials.map((material: any) => [material.id, Material.fromJson(material.data)]))
        return new Exporter(new Seed(json.seed), BuilderResult.fromJson(json.result), materials)
    }

    build(): Schematic {
        return this.builderResult.build(this.materials, this.seed)
    }
}

export class BuilderResult {

    constructor(
        readonly object: Line3 | Surface | Object3,
        readonly material: MaterialReference | undefined,
        readonly children: BuilderResult[],
    ) { }

    static fromJson(json: any): BuilderResult {
        let object
        if(json.type === 'line') {
            object = Line3.fromJson(json.object)
        } else if(json.type === 'surface') {
            object = Surface.fromJson(json.object)
        } else if(json.type === 'object') {
            object = Object3.fromJson(json.object)
        } else {
            throw new Error('Invalid Object type in BuilderResult')
        }
        return new BuilderResult(object, json.material ? MaterialReference.fromJson(json.material) : undefined, json.children.map((child: any) => BuilderResult.fromJson(child)))
    }

    build(materials: Record<string, Material>, seed: Seed): Schematic {
        let schematic
        if(this.material) {
            schematic = this.object.buildMaterial(this.material.get(materials), seed)
        } else {
            schematic = new Schematic()
        }
        this.children.forEach((child) => schematic.join(child.build(materials, seed)))
        return schematic
    }
}

export class MaterialReference {

    protected constructor(
        readonly defined: Material | undefined,
        readonly ref: string | undefined,
        readonly attributes: Record<string, string | number | boolean> = {}
    ) { }

    static defined(material: Material, attributes: Record<string, string | number | boolean> = {}): MaterialReference {
        return new MaterialReference(material, undefined, attributes)
    }

    static ref(ref: string, attributes: Record<string, string | number | boolean> = {}): MaterialReference {
        return new MaterialReference(undefined, ref, attributes)
    }

    static fromJson(json: any): MaterialReference {
        return new MaterialReference(json.defined ? Material.fromJson(json.material) : undefined, json.ref, json.attributes)
    }

    get(materials: Record<string, Material>): Material {
        return this.defined ?? materials[this.ref!]
    }
}
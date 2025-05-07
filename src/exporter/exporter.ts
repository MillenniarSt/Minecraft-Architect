import { Schematic } from "../minecraft/schematic.js"
import { BLOCK_RANDOM, Seed } from "./random.js"
import { Line3 } from "../world/geo/line.js"
import { Object3 } from "../world/geo/object.js"
import { Surface } from "../world/geo/surface.js"

export class Exporter {

    protected constructor(
        readonly seed: Seed,
        readonly builderResult: BuilderResult
    ) { }

    static fromJson(json: any): Exporter {
        return new Exporter(new Seed(json.seed), BuilderResult.fromJson(json.result))
    }

    build(): Schematic {
        return this.builderResult.build(this.seed)
    }
}

export class BuilderResult {

    constructor(
        readonly object: Line3 | Surface | Object3,
        readonly options: Record<string, string>,
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
        return new BuilderResult(object, json.architectOpt, json.children.map((child: any) => BuilderResult.fromJson(child)))
    }

    build(seed: Seed): Schematic {
        let schematic = new Schematic()
        if(this.options.block) {
            schematic = this.object.buildMaterial(BLOCK_RANDOM.get(this.options.block), seed)
        }
        this.children.forEach((child) => schematic.join(child.build(seed)))
        return schematic
    }
}
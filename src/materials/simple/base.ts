import { Schematic } from "../../minecraft/schematic.js";
import { Seed } from "../../util/random.js";
import { Line3 } from "../../world/geo/line.js";
import { Object3 } from "../../world/geo/object.js";
import { Surface } from "../../world/geo/surface.js";
import { Vec2 } from "../../world/vector.js";
import { TypedMaterial } from "../collective.js";
import { Material, Paint } from "../material.js";

@TypedMaterial()
export class BaseMaterial extends Material {

    previewNotEmpty(size: Vec2): Paint<{}>[][] {
        let preview: Paint<{}>[][] = []
        for(let i = 0; i < size.x; i++) {
            preview.push([])
            for(let j = 0; j < size.y; j++) {
                preview[i].push(this.paints.random()!)
            }
        }
        return preview
    }

    applyLineNotEmpty(line: Line3, seed: Seed): Schematic {
        // TODO
        return new Schematic()
    }

    applySurfaceNotEmpty(surface: Surface, seed: Seed): Schematic {
        console.debug('surface', surface)
        return new Schematic()
    }

    applyObjectNotEmpty(object: Object3, seed: Seed): Schematic {
        console.debug('object', object)
        return new Schematic()
    }
}
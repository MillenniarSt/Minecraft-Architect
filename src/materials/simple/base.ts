import { Vec2 } from "../../world/vector.js";
import { TypedMaterial } from "../collective.js";
import { Material, Paint } from "../material.js";

@TypedMaterial()
export class BaseMaterial extends Material {

    previewNonEmpty(size: Vec2): Paint<{}>[][] {
        let preview: Paint<{}>[][] = []
        for(let i = 0; i < size.x; i++) {
            preview.push([])
            for(let j = 0; j < size.y; j++) {
                preview[i].push(this.paints.random()!)
            }
        }
        return preview
    }
}
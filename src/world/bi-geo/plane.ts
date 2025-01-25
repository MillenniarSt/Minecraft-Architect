import { Vec2 } from "../vector.js"
import { CloseLine2 } from "./line.js"

export class Plane2 {

    constructor(readonly edge: CloseLine2) { }

    containsPoint(point: Vec2): boolean {
        return this.edge.containsPoint(point) || this.rayCastingAlgorithm(point)
    }

    private rayCastingAlgorithm(point: Vec2): boolean {
        let crossings = 0

        this.edge.parts.forEach((part) => {
            if (part.intersectsRay(point)) {
                crossings++
            }
        })

        return crossings % 2 !== 0
    }

    static fromJson(json: any): Plane2 {
        return new Plane2(CloseLine2.fromJson(json))
    }

    toJson(): {} {
        return this.edge.toJson()
    }
}
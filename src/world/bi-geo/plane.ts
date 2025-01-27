import { CloseLine2 } from "./line.js"

export class Plane2 {

    constructor(public edge: CloseLine2) { }

    static fromJson(json: any): Plane2 {
        return new Plane2(CloseLine2.fromJson(json))
    }

    toJson(): {} {
        return {
            edge: this.edge.toJson()
        }
    }
}
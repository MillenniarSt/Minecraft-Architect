import { Plane3 } from "./plane.js";

export class Object3 {

    constructor(
        readonly faces: Plane3[]
    ) { }

    toJson() {
        return {
            faces: this.faces.map((face) => face.toJson())
        }
    }
}
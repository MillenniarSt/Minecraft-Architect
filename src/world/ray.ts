//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Vec3 } from "./vector.js"

export class Ray {

    constructor(
        public origin: Vec3, 
        public direction: Vec3
    ) {
        this.direction = this.direction.normalize()
    }

    intersectsTriangle(v0: Vec3, v1: Vec3, v2: Vec3): boolean {
        const edge1 = v1.subtract(v0);
        const edge2 = v2.subtract(v0);
        const h = this.direction.cross(edge2);
        const a = edge1.dot(h);

        if (Math.abs(a) < 1e-6) return false;

        const f = 1 / a;
        const s = this.origin.subtract(v0);
        const u = f * s.dot(h);

        if (u < 0 || u > 1) return false;

        const q = s.cross(edge1);
        const v = f * this.direction.dot(q);

        if (v < 0 || u + v > 1) return false;

        const t = f * edge2.dot(q);
        return t > 1e-6;
    }
}
//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/
//

import fs from "fs"
import path from "path"
import { PNG } from "pngjs"
import { getAxis, Quaternion, toGrades, toRadiants } from "../world/quaternion.js"
import { Vec3 } from "../world/vector.js"
import { Location } from "./location.js"
import { getProject } from "../project.js"

export class RenderObject {

    cubes: Cube[]

    constructor(cubes: Cube[] = []) {
        this.cubes = cubes
    }

    static fromFile(file: string): RenderObject {
        return RenderObject.fromJson(JSON.parse(fs.readFileSync(file, 'utf8')))
    }

    static fromJson(json: any): RenderObject {
        return new RenderObject(json.cubes.map((cube: any) => Cube.fromJson(cube)))
    }

    toJson(): {} {
        return {
            cubes: this.cubes.map((cube) => cube.toJson())
        }
    }

    save(file: string) {
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, JSON.stringify(this.toJson(), null, 4).replace(
            /\[\s*([\d.,\s]+)\s*\]/g,
            (_, match) => `[${match.replace(/\s+/g, ' ').trim()}]`
        ))
    }

    toIcon(ifVoid?: RenderObject): Buffer {
        const icon = new PNG({ width: 16, height: 16 })
        let isVoid = true

        this.cubes.forEach((cube) => {
            let textureVoid = true
            if (cube.rotation.y === 0) {
                let texture = cube.faces[0]
                if (texture) {
                    const pos: [number, number] = [16 - (((cube.size.y / 2) + cube.pos.y) * 16), 16 - (((cube.size.x / 2) + cube.pos.x) * 16)]
                    textureVoid = this.writeIconTexture(texture, icon, pos)
                }
            } else {
                const texture = cube.faces[5]
                if (texture) {
                    const pos: [number, number] = [16 - (((cube.size.y / 2) + cube.pos.y) * 16), 16 - (((cube.size.z / 2) + cube.pos.z) * 16)]
                    textureVoid = this.writeIconTexture(texture, icon, pos)
                }
            }
            if(textureVoid = false) {
                isVoid = false
            }
        })

        if (isVoid && ifVoid) {
            return ifVoid.toIcon()
        }

        return PNG.sync.write(icon)
    }

    writeIconTexture(texture: Texture, icon: PNG, pos: [number, number]): boolean {
        let isVoid = true

        const resource = PNG.sync.read(fs.readFileSync(getProject().loader.renderFile('textures', texture.location, 'png')))

        for (let j = 0; j < texture.uv[3] * 16; j++) {       // columns - height
            for (let i = 0; i < texture.uv[2] * 16; i++) {   // rows - width
                const column = j + pos[0]
                const row = i + pos[1]

                if (column >= 0 && column <= 16 && row >= 0 && row <= 16) {
                    const idxOriginal = ((j + (texture.uv[1] * 16)) * resource.width + (texture.uv[0] * 16) + i) << 2
                    const idxNew = (column * icon.width + row) << 2

                    if (resource.data[idxOriginal + 3] !== 0) {
                        icon.data[idxNew] = resource.data[idxOriginal]
                        icon.data[idxNew + 1] = resource.data[idxOriginal + 1]
                        icon.data[idxNew + 2] = resource.data[idxOriginal + 2]
                        icon.data[idxNew + 3] = resource.data[idxOriginal + 3]

                        isVoid = false
                    }
                }
            }
        }

        return isVoid
    }
}

export function getFaceIndex(face: string): number {
    switch (face) {
        case 'north': return 0
        case 'south': return 1
        case 'up': return 2
        case 'down': return 3
        case 'west': return 4
        case 'east': return 5
        default: return -1
    }
}

export class Cube {

    rotation: Quaternion = Quaternion.NORTH
    pos: Vec3
    size: Vec3
    faces: [Texture?, Texture?, Texture?, Texture?, Texture?, Texture?]

    constructor(pos: Vec3, size: Vec3, faces: [Texture?, Texture?, Texture?, Texture?, Texture?, Texture?] = []) {
        this.pos = pos
        this.size = size
        this.faces = faces
    }

    static resource(json: any, textures: any): Cube {
        const size = new Vec3(json.to[0] - json.from[0], json.to[1] - json.from[1], json.to[2] - json.from[2]).multiplyScalar(0.0625)
        let cube = new Cube(new Vec3((json.from[0] / 16) + (size.x / 2), (json.from[1] / 16) + (size.y / 2), (json.from[2] / 16) + (size.z / 2)), size)

        if (json.rotation) {
            cube.rotate(Quaternion.fromAxisAngle(getAxis(json.rotation.axis), toRadiants(json.rotation.angle)), Vec3.fromJson(json.rotation.origin))
        }
        Object.keys(json.faces).forEach((face) => {
            const i = getFaceIndex(face)
            if (i != -1) {
                cube.faces[i] = Texture.resource(json.faces[face], textures)
            }
        })

        return cube
    }

    static fromJson(json: any): Cube {
        let cube = new Cube(json.pos, json.size)

        if (json.rotation) {
            cube.rotation = Quaternion.fromJson(json.rotation)
        }
        Object.keys(json.faces).forEach((face) => {
            const i = getFaceIndex(face)
            if (i != -1) {
                cube.faces[i] = Texture.fromJson(json.faces[face])
            }
        })

        return cube
    }

    rotate(rotation: Quaternion, pivot: Vec3 = new Vec3(0.5, 0.5, 0.5)) {
        let [cx, cy, cz] = this.pos.toJson()

        cx -= pivot.x
        cy -= pivot.y
        cz -= pivot.z

        const rotX = toGrades(rotation.x)
        if (rotX !== 0) {
            const newY = cy * Math.cos(rotX) - cz * Math.sin(rotX)
            const newZ = cy * Math.sin(rotX) + cz * Math.cos(rotX)
            cy = newY
            cz = newZ
        }

        const rotY = toGrades(rotation.y)
        if (rotY !== 0) {
            const newX = cx * Math.cos(rotY) + cz * Math.sin(rotY)
            const newZ = -cx * Math.sin(rotY) + cz * Math.cos(rotY)
            cx = newX
            cz = newZ
        }

        const rotZ = toGrades(rotation.z)
        if (rotZ !== 0) {
            const newX = cx * Math.cos(rotZ) - cy * Math.sin(rotZ)
            const newY = cx * Math.sin(rotZ) + cy * Math.cos(rotZ)
            cx = newX
            cy = newY
        }

        this.pos = new Vec3(cx + pivot.x, cy + pivot.y, cz + pivot.z)
        this.rotation = this.rotation.add(rotation)
    }

    toJson() {
        return {
            rotation: this.rotation.toJson(),
            pos: this.pos.toJson(),
            size: this.size.toJson(),
            faces: [
                ...this.faces.map((face) => face?.toJson())
            ]
        }
    }
}

export class Texture {

    readonly location: Location
    readonly uv: [number, number, number, number]
    readonly color?: number

    constructor(file: Location, uv: [number, number, number, number] = [0, 0, 1, 1], color?: number) {
        this.location = file
        this.uv = uv
        this.color = color
    }

    static fromJson(json: any): Texture {
        return new Texture(
            Location.fromJson(json.location),
            [json.uv[4], json.uv[5], json.uv[2], json.uv[3]],
            json.color
        )
    }

    static resource(json: any, textures: any): Texture {
        let location = Location.fromJson(textures[json.texture.substring(1)] ?? textures.particle!)
        location = new Location(location.mod, location.id.replace('/', '\\'))

        const texture = new Texture(
            location,
            json.uv ? [json.uv[0] / 16, json.uv[1] / 16, json.uv[2] / 16, json.uv[3] / 16] : [0, 0, 1, 1],
            json.tintindex === 0 ? 0x36b90f : 0xffffff
        )

        const file = getProject().loader.renderFile('textures', location, 'png')

        if (!fs.existsSync(file)) {
            texture.save(file, getProject().loader.resource('textures', Location.fromJson(textures[json.texture.substring(1)] ?? textures.particle!), 'png')!)
        }

        return texture
    }

    save(file: string, buffer: Buffer) {
        const resource = PNG.sync.read(buffer)

        const texture = new PNG({ width: resource.width, height: resource.width })

        for (let j = 0; j < texture.height; j++) {
            for (let i = 0; i < texture.width; i++) {
                const idxOriginal = (j * resource.width + i) << 2
                const idxNew = (j * texture.width + i) << 2

                texture.data[idxNew] = resource.data[idxOriginal]
                texture.data[idxNew + 1] = resource.data[idxOriginal + 1]
                texture.data[idxNew + 2] = resource.data[idxOriginal + 2]
                texture.data[idxNew + 3] = resource.data[idxOriginal + 3]
            }
        }

        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, PNG.sync.write(texture))
    }

    toJson() {
        return {
            texture: this.location.toJson(),
            uv: [
                this.uv[0], this.uv[3],
                this.uv[2], this.uv[3],
                this.uv[0], this.uv[1],
                this.uv[2], this.uv[1]
            ],
            color: this.color
        }
    }
}
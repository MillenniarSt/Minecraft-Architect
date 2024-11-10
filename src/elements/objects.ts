import fs from "fs-extra"
import path from "path"
import { Dimension3D, Pos3D, Rotation3D, Size3D } from "../world/world3D.js"
import { Location } from "./element.js"
import { loader } from "./loader.js"
import { PNG } from "pngjs"
import { toGrades, toRadiants } from "../world/world2D.js"

export class RenderObject {

    cubes: Cube[]

    constructor(cubes: Cube[] = []) {
        this.cubes = cubes
    }

    toJson(): {} {
        return {
            cubes: this.cubes.map((cube) => cube.toJson())
        }
    }

    save(file: string) {
        fs.mkdirsSync(path.dirname(file))
        fs.writeFileSync(file, JSON.stringify(this.toJson(), null, 4).replace(
            /\[\s*([\d.,\s]+)\s*\]/g,
            (_, match) => `[${match.replace(/\s+/g, ' ').trim()}]`
        ))
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

    rotation: Rotation3D = Rotation3D.north()
    dimension: Dimension3D
    faces: [Texture?, Texture?, Texture?, Texture?, Texture?, Texture?]

    constructor(dimension: Dimension3D, faces: [Texture?, Texture?, Texture?, Texture?, Texture?, Texture?] = []) {
        this.dimension = dimension
        this.faces = faces
    }

    static resource(json: any, textures: any): Cube {
        let dimension16 = Dimension3D.fromPoss(Pos3D.fromJson(json.from), Pos3D.fromJson(json.to))
        let cube = new Cube(new Dimension3D(
            new Pos3D(dimension16.pos.x / 16 + 0.5, dimension16.pos.y / 16 + 0.5, dimension16.pos.z / 16 + 0.5),
            new Size3D(dimension16.size.width / 16, dimension16.size.height / 16, dimension16.size.length / 16)
        ))

        if (json.rotation) {
            cube.rotate(Rotation3D.axis(json.rotation.axis, toRadiants(json.rotation.angle)), Pos3D.fromJson(json.rotation.origin))
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
        let cube = new Cube(json.dimension)

        if (json.rotation) {
            cube.rotation = Rotation3D.fromJson(json.rotation)
        }
        Object.keys(json.faces).forEach((face) => {
            const i = getFaceIndex(face)
            if (i != -1) {
                cube.faces[i] = Texture.fromJson(json.faces[face])
            }
        })

        return cube
    }

    rotate(rotation: Rotation3D, pivot: Pos3D = new Pos3D(0.5, 0.5, 0.5)) {
        let [cx, cy, cz] = this.dimension.pos.toJSON();

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

        this.dimension = new Dimension3D(new Pos3D(cx + pivot.x, cy + pivot.y, cz + pivot.z), this.dimension.size)
        this.rotation = this.rotation.plus(rotation)
    }

    toJson() {
        return {
            rotation: this.rotation.toJSON(),
            dimension: this.dimension.toJSON(),
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

    constructor(file: Location, uv: [number, number, number, number] = [0, 0, 16, 16], color?: number) {
        this.location = file
        this.uv = uv
        this.color = color
    }

    static fromJson(json: any): Texture {
        return new Texture(
            Location.fromJson(json.location),
            json.uv,
            json.color
        )
    }

    static resource(json: any, textures: any): Texture {
        let location = Location.fromJson(textures[json.texture.substring(1)] ?? textures.particle!)
        location = new Location(location.mod, location.id.replace('/', '\\'))

        const texture = new Texture(
            location,
            json.uv ?? [0, 0, 16, 16],
            json.tintindex === 0 ? 0x36b90f : 0xffffff
        )

        const file = loader.renderFile('textures', location, 'png')

        if (!fs.existsSync(file)) {
            texture.save(file, loader.resource('textures', Location.fromJson(textures[json.texture.substring(1)] ?? textures.particle!), 'png')!)
        }

        return texture
    }

    save(file: string, buffer: Buffer) {
        const resource = PNG.sync.read(buffer);

        const texture = new PNG({ width: resource.width, height: resource.width });

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

        fs.createFileSync(file)
        fs.writeFileSync(file, PNG.sync.write(texture))
    }

    toJson() {
        return {
            texture: this.location.toJson(),
            uv: this.uv,
            color: this.color
        }
    }
}
import { Location } from "../minecraft/loader.js"
import { Schematic } from "../minecraft/schematic.js"
import { iconPath } from "../paths.js"
import { RandomList, Seed } from "../util/random.js"
import { Line3 } from "../world/geo/line.js"
import { Object3 } from "../world/geo/object.js"
import { Surface } from "../world/geo/surface.js"
import { Vec2 } from "../world/vector.js"
import { materialFromJson } from "./collective.js"

export type Paint<T extends {} = {}> = {
    id: string
    additional?: T
}

export abstract class Material<T extends {} = {}> {

    paints: RandomList<Paint<T>>

    constructor(json: any) {
        this.paints = json.paints ? RandomList.fromJson(json.paints) : new RandomList()
        this.loadSettings(json.data)
    }

    static fromJson(json: any): Material {
        return materialFromJson(json)
    }

    loadSettings(data: any): void { }

    getSettings(): {} {
        return {}
    }

    preview(size: Vec2): string[][] | null {
        if(this.paints.list.length === 0) {
            return null
        }

        return this.previewNotEmpty(size).map((row) => row.map((paint) => iconPath(Location.fromJson(paint.id))))
    }

    abstract previewNotEmpty(size: Vec2): Paint<T>[][]

    applyLine(line: Line3, seed: Seed): Schematic {
        if(this.paints.list.length === 0) {
            console.warn('Can not apply material to a line: paints is empty')
            return new Schematic()
        }

        return this.applyLineNotEmpty(line, seed)
    }

    protected abstract applyLineNotEmpty(line: Line3, seed: Seed): Schematic

    applySurface(surface: Surface, seed: Seed): Schematic {
        if(this.paints.list.length === 0) {
            console.warn('Can not apply material to a plane: paints is empty')
            return new Schematic()
        }

        return this.applySurfaceNotEmpty(surface, seed)
    }

    protected abstract applySurfaceNotEmpty(plane: Surface, seed: Seed): Schematic

    applyObject(object: Object3, seed: Seed): Schematic {
        if(this.paints.list.length === 0) {
            console.warn('Can not apply material to an object: paints is empty')
            return new Schematic()
        }

        return this.applyObjectNotEmpty(object, seed)
    }

    protected abstract applyObjectNotEmpty(object: Object3, seed: Seed): Schematic

    toJson(): {} {
        return {
            paints: this.paints.toJson(),
            type: this.constructor.name,
            settings: this.getSettings()
        }
    }
}

export class RandomBlockType {
    
    random(): string {
        return ''
    }

    seeded(seed: Seed): string {
        return ''
    }
}
import { Location } from "../minecraft/loader.js"
import { iconPath } from "../paths.js"
import { RandomList, Seed } from "../util/random.js"
import { Line3 } from "../world/geo/line.js"
import { Vec2 } from "../world/vector.js"

export type Paint<T extends {} = {}> = {
    location: Location
    additional?: T
}

export abstract class Material<T extends {} = {}> {

    paints: RandomList<Paint<T>>

    constructor(json: any) {
        this.paints = json.paints ? RandomList.fromJson(json.paints, (paint) => { 
            return { id: paint.location.toString(), additional: paint.additional } 
        }, (json) => {
            return { location: json.id, additional: json.additional }
        }) : new RandomList()
        this.loadSettings(json.data)
    }

    loadSettings(data: any): void { }

    getSettings(): {} {
        return {}
    }

    preview(size: Vec2): string[][] | null {
        if(this.paints.list.length === 0) {
            return null
        }

        return this.previewNonEmpty(size).map((row) => row.map((paint) => iconPath(paint.location)))
    }

    abstract previewNonEmpty(size: Vec2): Paint<T>[][]

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
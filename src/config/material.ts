import { loader } from "../minecraft/loader.js"
import { Location } from "../minecraft/objects/object.js"
import { project } from "../project.js"
import { displayName } from "../util.js"

export class Variation {

    constructor(
        readonly modifiers: (string | null)[]
    ) { }

    static fromJson(json: any): Variation {
        return new Variation(json)
    }

    apply(block: Location): Location | null | undefined {
        for(let i = 0; i < this.modifiers.length; i++) {
            if(this.modifiers[i]) {
                const rBlock = new Location(block.mod, this.modifiers[i]!.replace('#', block.id))
                if(loader.blocks.has(rBlock.toString())) {
                    return rBlock
                }
            } else {
                return null
            }
        }
        return undefined
    }

    toJson(): {} {
        return this.modifiers
    }
}

export class Material {

    constructor(
        readonly location: Location,

        readonly icon: Location,
        readonly base: Location,
        readonly name: string
    ) { }

    static fromJson(json: any): Material {
        const location = Location.fromJson(json.location)
        return new Material(location, Location.fromJson(json.icon) ?? location, Location.fromJson(json.base) ?? location, json.name ?? displayName(location.id))
    }

    toJson(): {} {
        return {
            location: this.location.toJson(),
            icon: this.icon.toJson(),
            base: this.base.toJson(),
            name: this.name
        }
    }
}

export class MaterialGroup {
    
    constructor(
        readonly name: string,
        readonly icon: Location,
        readonly materials: Material[]
    ) { }

    static fromJson(json: any): MaterialGroup {
        return new MaterialGroup(json.name, Location.fromJson(json.icon), json.materials.map((material: string) => project.config.materials.get(Location.fromJson(material).toString())))
    }

    toJson(): {} {
        return {
            name: this.name,
            icon: this.icon.toJson(),
            materials: this.materials.map((material) => material.location.toJson())
        }
    }
}
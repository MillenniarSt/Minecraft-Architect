import { loader, Location } from "../minecraft/loader.js"
import { project } from "../project.js"
import { displayName } from "../util.js"
import { ProjectConfigFile } from "./config.js"
import { OnMessage } from "../socket.js"
import { iconPath } from "../paths.js"

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

    static readonly UNDEFINED = new Material(Location.UNDEFINED, Location.UNDEFINED, Location.UNDEFINED, 'Undefined')

    constructor(
        readonly location: Location,

        readonly icon: Location,
        readonly base: Location,
        readonly name: string
    ) { }

    static fromJson(json: any): Material {
        const location = Location.fromJson(json.location)
        return new Material(
            location, 
            json.icon ? Location.fromJson(json.icon) : location, 
            json.base ? Location.fromJson(json.base) : location, 
            json.name ?? displayName(location.id)
        )
    }

    toJson(): {} {
        return {
            location: this.location.toJson(),
            icon: this.icon.toJson(),
            base: this.base.toJson(),
            name: this.name
        }
    }

    toClient(): {} {
        return {
            id: this.location.toString(),
            label: this.name,
            icon: iconPath(this.icon)
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
        return new MaterialGroup(json.name, Location.fromJson(json.icon), json.materials.map((material: string) => project.configs.material.materials[Location.fromJson(material).toString()] ?? Material.UNDEFINED))
    }

    toJson(): {} {
        return {
            name: this.name,
            icon: this.icon.toJson(),
            materials: this.materials.map((material) => material.location.toJson())
        }
    }
}

export class MaterialConfig extends ProjectConfigFile {

    variations: {
        shapes: Record<string, Variation>,
        attributes: Record<string, Variation>,
        colors: Record<string, Variation>
    } = {
        shapes: {},
        attributes: {},
        colors: {}
    }
    materials: Record<string, Material> = {}

    groups: MaterialGroup[] = []

    default: Material = Material.UNDEFINED

    clear() {
        this.variations = {
            shapes: {},
            attributes: {},
            colors: {}
        }
        this.materials = {}
        this.groups = []
        this.default = Material.UNDEFINED
    }

    loadData(data: any) {
        this.variations = {
            shapes: Object.fromEntries(Object.entries(data.variations.shapes).map((entry) => [entry[0], Variation.fromJson(entry[1])])),
            attributes: Object.fromEntries(Object.entries(data.variations.attributes).map((entry) => [entry[0], Variation.fromJson(entry[1])])),
            colors: Object.fromEntries(Object.entries(data.variations.colors).map((entry) => [entry[0], Variation.fromJson(entry[1])]))
        }
        this.materials = Object.fromEntries(data.materials.map((material: any) => [Location.fromJson(material.location).toString(), Material.fromJson(material)]))
        this.groups = data.groups.map((group: any) => MaterialGroup.fromJson(group))
        this.default = this.materials[Location.fromJson(data.default).toString()] ?? Material.UNDEFINED
    }

    data(): {} {
        return {
            default: this.default.location.toString(),
            variations: {
                shapes: Object.fromEntries(Object.entries(this.variations.shapes).map((entry) => [entry[0], entry[1].toJson()])),
                attributes: Object.fromEntries(Object.entries(this.variations.attributes).map((entry) => [entry[0], entry[1].toJson()])),
                colors: Object.fromEntries(Object.entries(this.variations.colors).map((entry) => [entry[0], entry[1].toJson()]))
            },
            materials: Object.entries(this.variations.colors).map((entry) => entry[1].toJson()),
            groups: this.groups.map((group: any) => group.toJson())
        }
    }
}

export function registerMaterialMessages(messages: OnMessage) {
    const config = project.configs.material

    messages.set('data-pack/materials/default', (data, ws) => ws.respond({ id: config.default.location.toString() }))
    messages.set('data-pack/materials/get', (data, ws) => {
        ws.respond({
            groups: config.groups.map((group) => {
                return {
                    label: group.name,
                    icon: iconPath(group.icon),
                    materials: group.materials.map((material) => material.toClient())
                }
            }),
            materials: Object.entries(config.materials).map((entry) => entry[1].toClient())
        })
    })
}
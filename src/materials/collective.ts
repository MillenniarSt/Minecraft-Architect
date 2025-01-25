import { Material } from "./material.js"

export const typedMaterials: Map<string, (json: any) => Material> = new Map()

export function TypedMaterial() {
    return function (constructor: { new (data: any): Material }) {
        typedMaterials.set(constructor.name, (json: any) => new constructor(json))
    }
}

export function materialFromJson(json: any): Material {
    const factory = typedMaterials.get(json.type)
    if(!factory) {
        throw Error(`No Material registered for name: ${json.type}`)
    }
    return factory(json)
}
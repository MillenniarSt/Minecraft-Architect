import { Material, MaterialGroup, Variation } from "./material.js"

export class ProjectConfig {

    materialVariations: {
        shapes: Map<string, Variation>,
        attributes: Map<string, Variation>,
        colors: Map<string, Variation>
    } = {
        shapes: new Map(),
        attributes: new Map(),
        colors: new Map()
    }

    groups: MaterialGroup[] = []

    materials: Map<string, Material> = new Map()

    async load() {
        
    }
}
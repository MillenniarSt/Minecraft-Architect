import path from "path"
import { OnMessage } from "../connection/socket"
import { getProject } from "../project"
import { ToJson } from "../util/util"
import fs from 'fs'

export abstract class Resource implements ToJson {

    constructor(
        public map: Record<string, any>
    ) { }

    set(key: string, value: any) {
        this.map[key] = value
    }

    join(lang: Resource) {
        this.map = { ...this.map, ...lang.map }
    }

    load(json: any) {
        this.map = { ...this.map, ...json }
    }

    toJson() {
        return this.map
    }
}

export class Lang extends Resource {

    constructor(
        readonly language: string,
        map: Record<string, string> = {}
    ) {
        super(map)
    }
}

export type Icon = { image: string, pi: undefined } | { image: undefined, pi: string }

export class Icons extends Resource {

    constructor(
        map: Record<string, string> = {}
    ) {
        super(map)
    }
}

export function registerResourcesMessages(messages: OnMessage) {
    messages.set('resources/get-lang', async (data, side, id) => {
        const lang = new Lang(data.language)
        lang.join(getProject().loader.lang)
        lang.load(JSON.parse(fs.readFileSync(path.join(getProject().internalResourceDir, 'assets', 'lang', `${data.language}.json`), 'utf-8')))
        side.respond(id, lang.toJson())
    })
    messages.set('resources/get-icons', async (data, side, id) => {
        const icons = new Icons()
        icons.join(getProject().loader.icons)
        icons.load(JSON.parse(fs.readFileSync(path.join(getProject().internalResourceDir, 'assets', 'icons.json'), 'utf-8')))
        side.respond(id, icons.toJson())
    })
}
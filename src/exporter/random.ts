//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { KeyNotRegistered, ListEmptyError } from "../connection/errors"
import { OnMessage } from "../connection/server"
import { BlockType } from "../minecraft/register/block"
import { Item } from "../minecraft/register/item"
import { Schematic } from "../minecraft/schematic/schematic"
import { SimpleSchematic } from "../minecraft/schematic/simple"
import { getProject } from "../project"
import { Line3 } from "../world/geo/line"
import { Object3 } from "../world/geo/object"
import { Surface } from "../world/geo/surface"

export class Seed {

    public seed: number

    constructor(seed: number = Math.floor(Math.random() * 2147483647)) {
        this.seed = seed % 2147483647
        if (this.seed <= 0) {
            this.seed += 2147483646
        }
    }

    next(): number {
        this.seed = (this.seed * 16807) % 2147483647
        return (this.seed - 1) / 2147483646
    }
}

const RANDOMS: Record<string, Random> = {}
const RANDOM_TYPES: Record<string, RandomType> = {}

export abstract class Random<T = any, R = any> {

    abstract get template(): string

    constructor(
        readonly id: string,
        readonly clientData: string
    ) { }

    static get(id: string): Random {
        return RANDOMS[id]
    }

    static register<T = any>(random: Random<T>): Random<T> {
        RANDOMS[random.id] = random
        return random
    }

    abstract seeded(data: T, seed: Seed): R

    abstract getData(): Record<string, any>
}

export class ConstantEnum<R = any> extends Random<string, R> {

    get template(): string {
        return 'c_enum'
    }

    constructor(
        id: string,
        clientData: string,
        readonly defaultValue: string,
        readonly allowed: string[],
        readonly transform: (string: string) => R
    ) {
        super(id, clientData)
    }

    seeded(data: string, seed: Seed): R {
        return this.transform(data)
    }

    getData(): Record<string, any> {
        return {
            defaultValue: this.defaultValue,
            allowed: this.allowed
        }
    }
}

export type RandomEnumValue = { id: string, weight: number }

export class RandomEnum<R = any> extends Random<RandomEnumValue[], R> {

    get template(): string {
        return 'enum'
    }

    constructor(
        id: string,
        clientData: string,
        readonly defaultValue: string,
        readonly allowed: string[],
        readonly transform: (string: string) => R
    ) {
        super(id, clientData)
    }

    seeded(data: RandomEnumValue[], seed: Seed): R {
        const randomWeight = seed.next() * data.reduce((acc, choice) => acc + choice.weight, 0)
        let cumulative = 0
        for (const choice of data) {
            cumulative += choice.weight
            if (randomWeight < cumulative) {
                return this.transform(choice.id)
            }
        }

        throw new ListEmptyError('RandomEnum/choices')
    }

    getData(): Record<string, any> {
        return {
            defaultValue: this.defaultValue,
            allowed: this.allowed
        }
    }
}

export class RandomType<T = any, R = any> {

    constructor(
        readonly id: string,
        readonly constant: string,
        readonly randoms: string[],
        readonly get: (value: T, seed: Seed) => R
    ) { }

    static get(id: string): RandomType {
        return RANDOM_TYPES[id]
    }

    static register<T = any, R = any>(type: RandomType<T, R>): RandomType<T, R> {
        RANDOM_TYPES[type.id] = type
        return type
    }
}

export class MaterialType<Geo extends Line3 | Surface | Object3> extends RandomType<{ geo: Geo, random: string, data: any }, Schematic> {

    constructor(
        id: string,
        constant: string,
        randoms: string[],
        readonly builders: Record<string, (schematic: Schematic, geo: Geo, data: any, seed: Seed) => void>
    ) {
        super(id, constant, randoms, (value, seed) => {
            let schematic = new SimpleSchematic()
            this.build(schematic, value.geo, value.random, value.data, seed)
            return schematic
        })
    }

    build(schematic: Schematic, geo: Geo, random: string, data: any, seed: Seed) {
        const builder = this.builders[random]
        if(!builder) {
            throw new KeyNotRegistered(random, 'Material', 'builders')
        }
        builder(schematic, geo, data, seed)
    }
}

export let C_BLOCK_RANDOM: Random<string, BlockType>
export let BLOCK_RANDOM: Random<RandomEnumValue[], BlockType>
export let C_ITEM_RANDOM: Random<string, Item>
export let ITEM_RANDOM: Random<RandomEnumValue[], Item>

export let BLOCK_RANDOM_TYPE: RandomType<string, BlockType>
export let ITEM_RANDOM_TYPE: RandomType<string, Item>

export let OBJECT3_MATERIAL: MaterialType<Object3>

export function registerRandoms() {
    C_BLOCK_RANDOM = Random.register(new ConstantEnum('c_block', 'c_enum', 'minecraft:stone_bricks', getProject().loader.getAllBlocks().map((block) => block.location.toString()), getProject().loader.getBlock))
    BLOCK_RANDOM = Random.register(new RandomEnum('block', 'enum', 'minecraft:stone_bricks', getProject().loader.getAllBlocks().map((block) => block.location.toString()), getProject().loader.getBlock))
    C_ITEM_RANDOM = Random.register(new ConstantEnum('c_item', 'c_enum', 'minecraft:diamond', getProject().loader.getAllItems().map((item) => item.location.toString()), getProject().loader.getItem))
    ITEM_RANDOM = Random.register(new RandomEnum('item', 'enum', 'minecraft:diamond', getProject().loader.getAllItems().map((item) => item.location.toString()), getProject().loader.getItem))

    BLOCK_RANDOM_TYPE = RandomType.register(new RandomType('block', 'c_block', ['block'], getProject().loader.getBlock))
    ITEM_RANDOM_TYPE = RandomType.register(new RandomType('item', 'c_item', ['item'], getProject().loader.getItem))

    OBJECT3_MATERIAL = new MaterialType('object_material', 'c_block', ['block'], {
        'c_block': (schematic, geo, data: string, seed) => geo.buildBlock(schematic, C_BLOCK_RANDOM.seeded(data, seed)),
        'block': (schematic, geo, data: RandomEnumValue[], seed) => geo.buildBlocks(schematic, data, seed)
    })
}

export function registerRandomMessages(messages: OnMessage) {
    messages.set('random/get', async (data, side, id) => {
        side.respond(id, Object.values(RANDOMS).map((random) => {
            return { id: random.id, template: random.template, data: random.getData() }
        }))
    })
    messages.set('random/get-client-data', async (data, side, id) => {
        side.respond(id, Object.fromEntries(Object.values(RANDOMS).map((random) => [random.id, random.clientData])))
    })

    messages.set('random/get-types', async (data, side, id) => {
        side.respond(id, Object.values(RANDOM_TYPES).map((type) => {
            return { id: type.id, constant: type.constant, randoms: type.randoms }
        }))
    })
}
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

import fs from 'fs'
import { Item } from "./register/item.js"
import AdmZip from "adm-zip"
import path from "path"
import getAppDataPath from 'appdata-path'
import { BlockType } from "./register/block.js"
import { getProject, minecraftDir } from '../project.js'
import { Location } from './location.js'

export const MC_VERSION = '1.20.1'

export class MinecraftLoader {

  readonly dataVersion: number
  private archive: AdmZip

  language: string

  blocks: Map<string, BlockType> = new Map()
  items: Map<string, Item> = new Map()

  constructor(dataVersion: number, language?: string) {
    this.dataVersion = dataVersion
    this.language = language ?? 'en_us'
    this.archive = new AdmZip(path.join(minecraftDir, 'versions', MC_VERSION, `${MC_VERSION}.jar`))
  }

  load() {
    console.log('Loading Minecraft Resource')

    if(!fs.existsSync(getProject().dataDir) || !fs.existsSync(getProject().renderDir)) {
      this.generate()
    } else {
      this.blocks = new Map()
      this.items = new Map()

      fs.readdirSync(getProject().dataDir).forEach((pack) => {
        fs.readdirSync(path.join(getProject().dataDir, pack, 'block')).forEach((block) => {
          const location = new Location(pack, block.substring(0, block.lastIndexOf('.')))
          this.blocks.set(location.toString(), BlockType.fromJson(location, JSON.parse(fs.readFileSync(path.join(getProject().dataDir, pack, 'block', block), 'utf8'))))
        })
      })

      console.log('Loaded all Minecraft Resource')
    }
  }

  generate() {
    console.log('Generating Minecraft Resource')

    this.blocks = new Map()
    this.items = new Map()

    const savedNames = new Map<string, string>()

    console.log(`Parsing lang: ${this.language}`)
    this.archive.getEntries().forEach(file => {
      const dirs = file.entryName.split('/')

      if (!file.isDirectory && dirs[0] === 'assets') {
        if (dirs[2] === 'lang' && dirs[3] === `${this.language}.json`) {
          const lang = JSON.parse(file.getData().toString())

          Object.keys(lang).forEach(key => {
            const args = key.split(".")

            if (args.length === 3) {
              if (args[0] === 'block') {
                savedNames.set(new Location(args[1], args[2]).toString(), lang[key])
              } else if (args[0] === 'item') {
                const location = new Location(args[1], args[2])
                const json = this.resourceJson('models/item', location)
                if (json) {
                  const item = Item.resource(location, lang[key], json)
                  item.save()
                  this.items.set(location.toString(), item)
                }
              }
            }
          })
        }
      }
    })

    console.log('Parsing blockstates')
    this.archive.getEntries().forEach(file => {
      const dirs = file.entryName.split('/')

      if (!file.isDirectory && dirs[0] === 'assets') {
        if (dirs[2] === 'blockstates') {
          const location = new Location(dirs[1], dirs[3].substring(0, dirs[3].lastIndexOf('.')))
          const json = this.resourceJson('blockstates', location)
          if(json) {
            const block = BlockType.resource(location, savedNames.get(location.toString()) ?? 'Block', json)
            block.save()
            this.blocks.set(location.toString(), block)
          }
        }
      }
    })

    console.log('Generated All Resources')
  }

  resourcePath(dir: string, location: Location, extension: string): string {
    return `${location.mod}/${dir}/${location.id}.${extension}`.replace(/\\/g, '/')
  }

  dataFile(dir: string, location: Location, extension: string): string {
    return path.join(getProject().dataDir, this.resourcePath(dir, location, extension))
  }

  renderFile(dir: string, location: Location, extension: string): string {
    return path.join(getProject().renderDir, dir, `${location.toDir()}.${extension}`)
  }

  resource(dir: string, location: Location, extension: string): Buffer | null {
    const filePath = `assets/${this.resourcePath(dir, location, extension)}`
    const entry = this.archive.getEntry(filePath)
    return entry ? entry.getData() : null
  }

  resourceJson(dir: string, location: Location): any | null {
    const content = this.resource(dir, location, 'json')
    return content ? JSON.parse(content.toString()) : null
  }

  get resourceJar(): string {
    return path.join(minecraftDir, 'versions', MC_VERSION, `${MC_VERSION}.jar`)
  }
}

export const loader: MinecraftLoader = new MinecraftLoader(3465)
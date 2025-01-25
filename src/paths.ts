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

import getAppDataPath from 'appdata-path'
import path from 'path'
import { loader, Location } from './minecraft/loader.js'

export const dir: string = getAppDataPath.default('Beaver Architect')

export const resourceDir: string = path.join(dir, 'architects\\minecraft\\resources')

export const configDir: string = path.join(resourceDir, 'config')
export const dataDir: string = path.join(resourceDir, 'data')
export const renderDir: string = path.join(resourceDir, 'render')

export const minecraftDir = getAppDataPath.default('.minecraft')

export function iconPath(location: Location): string {
    return path.join(resourceDir, 'render', loader.version, 'icons', `${location.toDir()}.png`)
}
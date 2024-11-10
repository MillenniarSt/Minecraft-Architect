//          _____
//      ___/     \___
//    |/  _.- _.-    \|
//   ||\\=_  '    _=//||
//   ||   \\\===///   ||
//   ||       |       ||
//   ||       |       ||
//   ||\___   |   ___/||
//         \__|__/
//
//      By Millenniar
//

import getAppDataPath from 'appdata-path'
import path from 'path'

export const dir: string = getAppDataPath.default('Beaver Architect')

export const resourceDir: string = path.join(dir, 'architects\\minecraft\\resources')

export const dataDir: string = path.join(resourceDir, 'data')
export const renderDir: string = path.join(resourceDir, 'render')

export const minecraftDir = getAppDataPath.default('.minecraft')
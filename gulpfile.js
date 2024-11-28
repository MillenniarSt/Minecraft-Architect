import gulp from 'gulp'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import getAppDataPath from 'appdata-path'

export const __dirname = path.dirname(fileURLToPath(import.meta.url))

gulp.task('install-src', async () => {
    try {
        await fs.copy(path.join(__dirname, 'dist'), path.join(getAppDataPath.default('Beaver Architect'), 'architects', 'minecraft', 'src'))
        console.log('Architect src Installed')
    } catch (err) {
        console.error('Error while copying plugin src', err)
    }
})

gulp.task('install-resources', async () => {
    try {
        await fs.remove(path.join(getAppDataPath.default('Beaver Architect'), 'architects', 'minecraft', 'resources'))
        console.log('Architect previous resources Deleted')
        await fs.copy(path.join(__dirname, 'resources'), path.join(getAppDataPath.default('Beaver Architect'), 'architects', 'minecraft', 'resources'))
        await fs.copy(path.join(__dirname, 'architect.json'), path.join(getAppDataPath.default('Beaver Architect'), 'architects', 'minecraft', 'architect.json'))
        console.log('Architect resources Installed')
    } catch (err) {
        console.error('Error while copying plugin resources', err)
    }
})

gulp.task('install-dependences', async () => {
    try {
        await fs.copy(path.join(__dirname, 'package.json'), path.join(getAppDataPath.default('Beaver Architect'), 'architects', 'minecraft', 'package.json'))
        await fs.copy(path.join(__dirname, 'node_modules'), path.join(getAppDataPath.default('Beaver Architect'), 'architects', 'minecraft', 'node_modules'))
        console.log('Architect dependences Installed')
    } catch (err) {
        console.error('Error while copying plugin dependences', err)
    }
})

gulp.task('compress', async () => {
    try {
        await fs.remove(path.join(__dirname, 'dist'))
        console.log('Delete dist folder')
        await fs.remove(path.join(__dirname, 'node_modules'))
        console.log('Delete node_modules folder')
    } catch (err) {
        console.error('Error while removing dist folder', err)
    }
})

gulp.task('uninstall', async () => {
    try {
        await fs.remove(path.join(getAppDataPath.default('Beaver Architect'), 'architects', 'minecraft'))
        console.log('Uninstall Architect')
    } catch (err) {
        console.error('Error while removing dist folder', err)
    }
})

gulp.task('install', gulp.series('install-src', 'install-resources', 'install-dependences'))
gulp.task('install-src', gulp.series('install-src'))
gulp.task('install-resources', gulp.series('install-resources'))
gulp.task('install-modules', gulp.series('install-dependences'))

gulp.task('uninstall', gulp.series('uninstall'))

gulp.task('compress', gulp.series('compress'))
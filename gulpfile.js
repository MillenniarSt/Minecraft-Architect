import gulp from 'gulp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import getAppDataPath from 'appdata-path'

export const __dirname = path.dirname(fileURLToPath(import.meta.url))

const architect = JSON.parse(fs.readFileSync(path.join(__dirname, 'architect.json'), 'utf-8'))

// Change this path based on your project folder
const projectDir = 'C:\\Users\\Ange\\Desktop\\Developing\\JavaScript\\Beaver Architect\\server\\run'
const installDir = path.join(getAppDataPath.default('io.github.MillenniarSt.Beaver-Architect'), 'architects', 'minecraft')

gulp.task('install-project', async () => {
    try {
        fs.cpSync(path.join(__dirname, 'build', 'architect.exe'), path.join(projectDir, 'architect', 'architect.exe'), { recursive: true })
        console.log('Architect Installed in the set Project')
    } catch (err) {
        console.error('Error while installing architect in project', err)
    }
})

gulp.task('install-client', async () => {
    try {
        fs.cpSync(path.join(__dirname, 'build', 'architect.exe'), path.join(installDir, 'architect.exe'), { recursive: true })
        console.log('Architect Installed in the set Client')
    } catch (err) {
        console.error('Error while installing architect in client', err)
    }
})

gulp.task('install-src', async () => {
    try {
        fs.cpSync(path.join(__dirname, 'dist'), path.join(installDir, 'src'), { recursive: true })
        console.log('Architect src Installed')
    } catch (err) {
        console.error('Error while copying plugin src', err)
    }
})

gulp.task('install-resources', async () => {
    try {
        if (fs.existsSync(path.join(installDir, 'resources'))) {
            fs.rmSync(path.join(installDir, 'resources'), { recursive: true })
            console.log('Architect previous resources Deleted')
        }
        fs.mkdirSync(path.join(installDir, 'resources'))
        fs.cpSync(path.join(__dirname, 'resources'), path.join(installDir, 'resources'), { recursive: true })
        fs.cpSync(path.join(__dirname, 'architect.json'), path.join(installDir, 'architect.json'), { recursive: true })
        console.log('Architect resources Installed')
    } catch (err) {
        console.error('Error while copying plugin resources', err)
    }
})

gulp.task('install-dependences', async () => {
    try {
        fs.cpSync(path.join(__dirname, 'package.json'), path.join(installDir, 'package.json'), { recursive: true })
        fs.cpSync(path.join(__dirname, 'node_modules'), path.join(installDir, 'node_modules'), { recursive: true })
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
        await fs.remove(path.join(installDir))
        console.log('Uninstall Architect')
    } catch (err) {
        console.error('Error while removing dist folder', err)
    }
})

gulp.task('install-project', gulp.series('install-project'))
gulp.task('install-client', gulp.series('install-client'))

gulp.task('install', gulp.series('install-src', 'install-resources', 'install-dependences'))
gulp.task('install-src', gulp.series('install-src'))
gulp.task('install-resources', gulp.series('install-resources'))
gulp.task('install-modules', gulp.series('install-dependences'))

gulp.task('uninstall', gulp.series('uninstall'))

gulp.task('compress', gulp.series('compress'))
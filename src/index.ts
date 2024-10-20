import express, { NextFunction, Request, Response } from 'express'
import { error, notFound } from './routes/util.js'
import { renderRouter } from './routes/render.js'
import { dataPackRouter } from './routes/data-pack.js'
import { projectRouter } from './routes/project.js'

const log = console.log
console.log = (...args) => {
    log('[   Minecraft    ] ', ...args)
}

console.log('Minecraft Starting...')

// Send Plugin Data

if (process.send) {
    process.send({
        identifier: 'minecraft',
        name: 'Minecraft',
        port: 8990
    })
}

// Express

const app = express()

app.use(express.json())

app.use('/project', projectRouter)
app.use('/render', renderRouter)
app.use('/data-pack', dataPackRouter)

app.get('*', (req, res) => notFound(res))
app.post('*', (req, res) => notFound(res))
app.put('*', (req, res) => notFound(res))
app.delete('*', (req, res) => notFound(res))

app.use((err: any, req: Request, res: Response, next: NextFunction) => error(res, err))

const server = app.listen(8990, () => console.log('Minecraft Express open on http://localhost:8990/'))

server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
        console.log('Server already open on port 8990')
    } else {
        console.error(`Error: ${error.message}`)
    }
})
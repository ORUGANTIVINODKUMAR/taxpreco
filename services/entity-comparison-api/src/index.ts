import { createApp } from './app.js'
import { readConfig } from './config.js'

const config = readConfig({
  ...process.env,
  NODE_ENV: process.env.NODE_ENV ?? (process.argv.includes('--development') ? 'development' : 'production'),
})
const server = createApp(config).listen(config.port, config.host, () => {
  console.log(`taxpreco-tools listening at http://${config.host}:${config.port}`)
  console.log(config.authMode === 'mock'
    ? 'DEVELOPMENT MOCK AUTH: fake Demo Advisor identity; loopback only; never production authentication.'
    : 'JWT mode: protected requests fail closed until Alpha verification is implemented.')
})
server.on('error', (error) => { console.error(error.message); process.exitCode = 1 })
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => { server.close(() => process.exit(0)) })
}

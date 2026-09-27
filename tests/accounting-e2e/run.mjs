// Testele e2e ale contabilității (spec B9) pe API-ul real:
//   1. recreează baza e2e (Postgres din Docker),
//   2. pornește backend-ul pe ea (migrează la pornire),
//   3. rulează seed-ul fixtures (AccountingE2ESeed),
//   4. rulează Playwright (frontend-ul `--mode e2e` pe 5175),
//   5. oprește backend-ul.
// Validatorul ANAF (backend-anaf, http://localhost:8090) trebuie să fie pornit pentru validare.
//
//   npm run test:accounting:e2e
//
// Variabile: E2E_PG_CONTAINER (ridelance-accounting-test), E2E_PG_PORT (55432), E2E_PG_PASSWORD (test).

import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const container = process.env.E2E_PG_CONTAINER ?? 'ridelance-accounting-test'
const port = process.env.E2E_PG_PORT ?? '55432'
const password = process.env.E2E_PG_PASSWORD ?? 'test'
const database = 'ridelance_e2e'
const connection = `Host=localhost;Port=${port};Database=${database};Username=postgres;Password=${password}`
const uploads = resolve(root, '.e2e/uploads')
const api = 'http://localhost:5080'

function run(command, args, options = {}) {
  // Fără shell: argumentele (SQL, șirul de conexiune) ajung neinterpretate.
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', ...options })
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} a eșuat (${result.status}).`)
}

async function waitFor(url, seconds) {
  for (let attempt = 0; attempt < seconds; attempt++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // încă pornește
    }
    await new Promise((done) => setTimeout(done, 1000))
  }
  throw new Error(`${url} nu a răspuns în ${seconds} s.`)
}

console.log('› baza e2e')
run('docker', ['exec', container, 'psql', '-U', 'postgres', '-c', `DROP DATABASE IF EXISTS ${database} WITH (FORCE)`, '-c', `CREATE DATABASE ${database}`])
rmSync(uploads, { recursive: true, force: true })
mkdirSync(uploads, { recursive: true })

console.log('› backend')
const backend = spawn(
  'dotnet',
  [
    'run', '--project', 'backend/src/Web.Api', '--no-launch-profile', '--',
    '--environment', 'Development',
    '--urls', api,
    `--ConnectionStrings:Database=${connection}`,
    `--FileStorage:BasePath=${uploads}`,
    '--App:BaseUrl=http://localhost:5175',
    // Fără citire AI în e2e: nicio cerere către OpenRouter, niciun credit consumat.
    '--OpenRouter:ApiKey=',
  ],
  { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] },
)

let exitCode = 1
try {
  await waitFor(`${api}/health`, 240)

  console.log('› seed')
  run('dotnet', ['test', 'backend/tests/UnitTests', '--filter', 'FullyQualifiedName~AccountingE2ESeed', '--nologo'], {
    env: { ...process.env, RIDELANCE_SEED_DATABASE: connection, RIDELANCE_SEED_UPLOADS: uploads },
  })

  console.log('› playwright')
  const tests = spawnSync('npx', ['playwright', 'test', '-c', 'tests/accounting-e2e/playwright.config.ts', ...process.argv.slice(2)], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  exitCode = tests.status ?? 1
} finally {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(backend.pid), '/t', '/f'], { stdio: 'ignore' })
  } else {
    backend.kill('SIGTERM')
  }
}

process.exit(exitCode)

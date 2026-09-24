#!/usr/bin/env node
// Spiegelt site-dist/ per SFTP in den Webroot von brand.inforent.com
// (INFORENT-Webspace). Dieselbe Logik wie im Repo INFORENT-Website.
//
// Node statt lftp/rsync: die self-hosted Runner der Orga haben weder das eine
// noch sudo, um es nachzuinstallieren.
//
// Ablauf: erst alle Dateien hochladen (HTML zuletzt), dann entfernte Dateien
// löschen, die im Build nicht mehr vorkommen. Nie angefasst: die Ordner /_logs
// und /_backups des Webspace und /.well-known.
//
// Umgebung:
//   SFTP_HOST, SFTP_USER, SFTP_PASSWORD   Pflicht
//   SFTP_PORT                             Standard 2022
//   DRY_RUN=1                             nur anzeigen, nichts schreiben/löschen

import { readdirSync } from 'node:fs'
import { join, relative, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import SftpClient from 'ssh2-sftp-client'

const DIST = fileURLToPath(new URL('../site-dist', import.meta.url))
const KEEP = [/^_logs(\/|$)/, /^_backups(\/|$)/, /^\.well-known(\/|$)/]
const { SFTP_HOST, SFTP_USER, SFTP_PASSWORD } = process.env
const PORT = Number(process.env.SFTP_PORT || 2022)
const DRY = process.env.DRY_RUN === '1'

if (!SFTP_HOST || !SFTP_USER || !SFTP_PASSWORD) {
  console.error('SFTP_HOST, SFTP_USER und SFTP_PASSWORD müssen gesetzt sein.')
  process.exit(1)
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, e.name)
    if (e.isDirectory()) walk(abs, out)
    else out.push(relative(DIST, abs).split('\\').join('/'))
  }
  return out
}

const local = walk(DIST)
if (!local.includes('index.html')) {
  console.error('site-dist/index.html fehlt — erst `npm run site`.')
  process.exit(1)
}
local.sort((a, b) => (a.endsWith('.html') - b.endsWith('.html')) || a.localeCompare(b))

const sftp = new SftpClient()
await sftp.connect({
  host: SFTP_HOST,
  port: PORT,
  username: SFTP_USER,
  password: SFTP_PASSWORD,
  readyTimeout: 20000,
  // Host-Key wird bewusst nicht geprüft (Entscheidung 23.09.2026, wie die Website).
})

try {
  const root = (await sftp.cwd()).replace(/\/$/, '')
  const remotePath = rel => posix.join(root, rel)

  async function remoteFiles(rel = '') {
    const out = []
    for (const e of await sftp.list(remotePath(rel) || '/')) {
      const r = rel ? `${rel}/${e.name}` : e.name
      if (KEEP.some(re => re.test(r))) continue
      if (e.type === 'd') out.push(...(await remoteFiles(r)))
      else out.push(r)
    }
    return out
  }

  const made = new Set()
  for (const rel of local) {
    const dir = posix.dirname(rel)
    if (dir !== '.' && !made.has(dir)) {
      if (!DRY) await sftp.mkdir(remotePath(dir), true)
      made.add(dir)
    }
    if (!DRY) await sftp.fastPut(join(DIST, rel), remotePath(rel))
  }

  const keep = new Set(local)
  const stale = (await remoteFiles()).filter(r => !keep.has(r))
  for (const r of stale) if (!DRY) await sftp.delete(remotePath(r))

  console.log(`${DRY ? '[dry-run] ' : ''}sftp-deploy: ${local.length} hochgeladen, ${stale.length} gelöscht → ${SFTP_USER}@${SFTP_HOST}:${PORT}${root || '/'}`)
} finally {
  await sftp.end()
}

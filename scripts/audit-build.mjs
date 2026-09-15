#!/usr/bin/env node

/**
 * Standing Build Gate: Package & Permission Audit
 *
 * Enforces five security and platform invariants over the built production bundle:
 * 1. Minimal permissions: within the ['storage', 'alarms'] allow-list, zero host_permissions.
 * 2. Scoped web-accessible resources: strictly x.com / twitter.com, zero wildcard origins.
 * 3. Exactly one content script (dev probes mechanically excluded).
 * 4. Zero CSP overrides.
 * 5. Zero dynamic code execution (eval, new Function) in any bundled script.
 */

import fs from 'node:fs'
import path from 'node:path'

const OUTPUT_ROOT = '.output'

if (!fs.existsSync(OUTPUT_ROOT)) {
  console.error(`[audit-build] FAILED: Output directory '${OUTPUT_ROOT}' does not exist. Run 'wxt build' first.`)
  process.exit(1)
}

// Locate production output directory (e.g. chrome-mv3, avoiding chrome-mv3-dev)
const candidateDirs = fs
  .readdirSync(OUTPUT_ROOT)
  .filter((d) => d.startsWith('chrome-mv3') && !d.endsWith('-dev'))

if (candidateDirs.length === 0) {
  console.error('[audit-build] FAILED: No production build directory found under .output/ (expected chrome-mv3).')
  process.exit(1)
}

const targetDir = path.join(OUTPUT_ROOT, candidateDirs[0])
const manifestPath = path.join(targetDir, 'manifest.json')

if (!fs.existsSync(manifestPath)) {
  console.error(`[audit-build] FAILED: manifest.json not found in ${targetDir}`)
  process.exit(1)
}

const manifestRaw = fs.readFileSync(manifestPath, 'utf8')
let manifest
try {
  manifest = JSON.parse(manifestRaw)
} catch (err) {
  console.error(`[audit-build] FAILED: Failed to parse manifest.json: ${err.message}`)
  process.exit(1)
}

let errors = []

// Assertion 1: Permissions within the reviewed allow-list, and no host_permissions
const ALLOWED_PERMISSIONS = ['storage', 'alarms']
const permissions = manifest.permissions || []
const unexpected = permissions.filter((p) => !ALLOWED_PERMISSIONS.includes(p))
if (unexpected.length > 0) {
  errors.push(`Assertion 1 failed: unreviewed permission(s) ${JSON.stringify(unexpected)}; allowed: ${JSON.stringify(ALLOWED_PERMISSIONS)}`)
}
const duplicates = permissions.filter((p, i) => permissions.indexOf(p) !== i)
if (duplicates.length > 0) {
  errors.push(`Assertion 1 failed: duplicate permission(s) ${JSON.stringify(duplicates)}`)
}
if ('host_permissions' in manifest && manifest.host_permissions !== undefined) {
  errors.push(`Assertion 1 failed: host_permissions must not exist, got ${JSON.stringify(manifest.host_permissions)}`)
}

// Assertion 2: Scoped web_accessible_resources, no wildcard origins
if (manifestRaw.includes('<all_urls>') || manifestRaw.includes('*://*/*')) {
  errors.push("Assertion 2 failed: wildcard origin ('<all_urls>' or '*://*/*') detected in manifest.")
}
const warList = manifest.web_accessible_resources || []
for (let i = 0; i < warList.length; i++) {
  const war = warList[i]
  const matches = war.matches || []
  for (const m of matches) {
    const isScoped =
      m.startsWith('*://x.com/') ||
      m.startsWith('*://twitter.com/') ||
      m.startsWith('https://x.com/') ||
      m.startsWith('https://twitter.com/')
    if (!isScoped) {
      errors.push(`Assertion 2 failed: web_accessible_resources[${i}] has unscoped match: '${m}'`)
    }
  }
}

// Assertion 3: Exactly one content script
const contentScripts = manifest.content_scripts || []
if (contentScripts.length !== 1) {
  errors.push(`Assertion 3 failed: production manifest must declare exactly 1 content script, found ${contentScripts.length}`)
}

// Assertion 4: No manifest content_security_policy override
if ('content_security_policy' in manifest) {
  errors.push(`Assertion 4 failed: manifest contains content_security_policy override: ${JSON.stringify(manifest.content_security_policy)}`)
}

// Assertion 5: No dynamic code execution in any bundled JS file
function scanFiles(dir) {
  let jsFiles = []
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      jsFiles = jsFiles.concat(scanFiles(fullPath))
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.mjs')) {
      jsFiles.push(fullPath)
    }
  }
  return jsFiles
}

const jsFiles = scanFiles(targetDir)
const dynamicCodePatterns = [
  { name: 'eval()', regex: /\beval\s*\(/ },
  { name: 'new Function()', regex: /\bnew\s+Function\s*\(/ },
]

for (const file of jsFiles) {
  const content = fs.readFileSync(file, 'utf8')
  const lines = content.split('\n')
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    for (const pattern of dynamicCodePatterns) {
      const match = pattern.regex.exec(line)
      if (match) {
        errors.push(
          `Assertion 5 failed: Dynamic code execution construct '${pattern.name}' found in ${file}:${lineIndex + 1}\n` +
          `    Snippet: ${line.trim().slice(0, 120)}`
        )
      }
    }
  }
}

if (errors.length > 0) {
  console.error('[audit-build] AUDIT FAILED with the following errors:')
  for (const err of errors) {
    console.error(`  - ${err}`)
  }
  process.exit(1)
}

console.log(`[audit-build] PASSED: All 5 assertions passed on ${targetDir} (manifest and ${jsFiles.length} scripts clean).`)

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '..')

describe('Smoke Tests', () => {
  it('key project files exist', () => {
    const requiredFiles = [
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'next.config.ts',
      'tsconfig.json',
      'package.json',
    ]
    for (const file of requiredFiles) {
      expect(fs.existsSync(path.join(ROOT, file)), `${file} should exist`).toBe(true)
    }
  })

  it('package.json is valid and has required fields', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'))
    expect(pkg.name).toBe('canvas')
    expect(pkg.scripts).toBeDefined()
    expect(pkg.scripts.dev).toContain('3002')
    expect(pkg.dependencies).toBeDefined()
  })

  it('tsconfig.json is valid JSON', () => {
    const raw = fs.readFileSync(path.join(ROOT, 'tsconfig.json'), 'utf-8')
    expect(() => JSON.parse(raw)).not.toThrow()
  })
})

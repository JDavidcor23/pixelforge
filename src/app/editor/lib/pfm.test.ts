import { describe, it, expect } from 'vitest'
import { parsePfm } from './pfm'

describe('parsePfm', () => {
  it('should parse a valid PFM string with hex colors', () => {
    const pfm = `
      SIZE: 3x2
      PALETTE:
        . : transparent
        X : #FF0000
        O : #0000FF
      GRID:
        X . O
        . X .
    `
    const result = parsePfm(pfm)
    expect(result.width).toBe(3)
    expect(result.height).toBe(2)
    expect(result.pixels).toHaveLength(2)
    expect(result.pixels[0]).toHaveLength(3)
    
    // Row 0: X . O
    expect(result.pixels[0][0]).toEqual({ r: 255, g: 0, b: 0, a: 255 })
    expect(result.pixels[0][1]).toEqual({ r: 0, g: 0, b: 0, a: 0 })
    expect(result.pixels[0][2]).toEqual({ r: 0, g: 0, b: 255, a: 255 })
    
    // Row 1: . X .
    expect(result.pixels[1][0]).toEqual({ r: 0, g: 0, b: 0, a: 0 })
    expect(result.pixels[1][1]).toEqual({ r: 255, g: 0, b: 0, a: 255 })
    expect(result.pixels[1][2]).toEqual({ r: 0, g: 0, b: 0, a: 0 })
  })

  it('should ignore comments and empty lines', () => {
    const pfm = `
      # This is a comment
      SIZE: 1x1
      
      PALETTE:
        X : #000000
        
      GRID:
        X
    `
    const result = parsePfm(pfm)
    expect(result.width).toBe(1)
    expect(result.height).toBe(1)
    expect(result.pixels[0][0]).toEqual({ r: 0, g: 0, b: 0, a: 255 })
  })

  it('should throw error if SIZE is missing', () => {
    const pfm = `
      PALETTE:
        X : #000000
      GRID:
        X
    `
    expect(() => parsePfm(pfm)).toThrow(/SIZE section missing/)
  })

  it('should throw error if PALETTE is missing', () => {
    const pfm = `
      SIZE: 1x1
      GRID:
        X
    `
    expect(() => parsePfm(pfm)).toThrow(/PALETTE section missing/)
  })

  it('should throw error if GRID is missing', () => {
    const pfm = `
      SIZE: 1x1
      PALETTE:
        X : #000000
    `
    expect(() => parsePfm(pfm)).toThrow(/GRID section missing/)
  })

  it('should throw error if grid dimensions do not match SIZE', () => {
    const pfm = `
      SIZE: 2x2
      PALETTE:
        X : #000000
      GRID:
        X X
        X
    `
    expect(() => parsePfm(pfm)).toThrow(/Grid dimensions do not match SIZE/)
  })

  it('should throw error if a character in GRID is not in PALETTE', () => {
    const pfm = `
      SIZE: 1x1
      PALETTE:
        X : #000000
      GRID:
        O
    `
    expect(() => parsePfm(pfm)).toThrow(/Character 'O' not found in palette/)
  })
})

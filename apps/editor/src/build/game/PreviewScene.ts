import Phaser from 'phaser'

import { BUILD_GAME, PREVIEW_SCENE } from '@/constants/build-game'

const MS_PER_SECOND = 1000

/** Placeholder scene for phase 1 — replaced by the level scene in phase 2. */
export class PreviewScene extends Phaser.Scene {
  private block!: Phaser.GameObjects.Rectangle
  private velocity = { x: PREVIEW_SCENE.BLOCK_SPEED, y: PREVIEW_SCENE.BLOCK_SPEED }

  constructor() {
    super(PREVIEW_SCENE.KEY)
  }

  create() {
    this.velocity = { x: PREVIEW_SCENE.BLOCK_SPEED, y: PREVIEW_SCENE.BLOCK_SPEED }
    this.block = this.add.rectangle(
      BUILD_GAME.WIDTH / 2,
      BUILD_GAME.HEIGHT / 2,
      PREVIEW_SCENE.BLOCK_SIZE,
      PREVIEW_SCENE.BLOCK_SIZE,
      Phaser.Display.Color.HexStringToColor(PREVIEW_SCENE.BLOCK_COLOR).color,
    )
  }

  update(_time: number, delta: number) {
    const step = delta / MS_PER_SECOND
    const half = PREVIEW_SCENE.BLOCK_SIZE / 2
    this.block.x += this.velocity.x * step
    this.block.y += this.velocity.y * step

    if (this.block.x < half || this.block.x > BUILD_GAME.WIDTH - half) this.velocity.x *= -1
    if (this.block.y < half || this.block.y > BUILD_GAME.HEIGHT - half) this.velocity.y *= -1
  }
}

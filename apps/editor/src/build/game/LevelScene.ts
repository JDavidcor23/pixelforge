import Phaser from 'phaser'

import { LEVEL_KEYS, LEVEL_SCENE, PLATFORMER } from '@/constants/build-game'
import { gameBus } from './event-bus'
import { createLevelRules, type LevelRules } from './level-rules'
import { createPlatformerController, type PlatformerController } from './platformer-controller'
import type { Level, LevelRect, LevelSceneData } from '../types'

type Body = Phaser.Physics.Arcade.Body
type KeyGroup = Phaser.Input.Keyboard.Key[]

function toColor(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color
}

function isAnyDown(keys: KeyGroup): boolean {
  return keys.some((key) => key.isDown)
}

/**
 * Plays one hand-made level. Started (and restarted) with `{ level }` by
 * `createGame`; movement feel and win/lose rules come from the pure
 * controller and rules modules, this class only wires them to Phaser.
 */
export class LevelScene extends Phaser.Scene {
  private level!: Level
  private player!: Phaser.GameObjects.Rectangle
  private controller!: PlatformerController
  private rules!: LevelRules
  private keys!: { left: KeyGroup; right: KeyGroup; jump: KeyGroup }
  /** Set once the run is won or lost; the scene instance is reused on restart, so `create` clears it. */
  private isOver = false

  constructor() {
    super(LEVEL_SCENE.KEY)
  }

  init(data: LevelSceneData) {
    this.level = data.level
  }

  create() {
    const { level } = this
    this.isOver = false
    this.controller = createPlatformerController(PLATFORMER)
    this.rules = createLevelRules(level, gameBus.events)

    const platforms = this.physics.add.staticGroup()
    level.platforms.forEach((rect) => platforms.add(this.drawRect(rect, LEVEL_SCENE.PLATFORM_COLOR)))
    level.hazards.forEach((rect) => this.drawRect(rect, LEVEL_SCENE.HAZARD_COLOR))
    this.drawRect(level.goal, LEVEL_SCENE.GOAL_COLOR)

    this.player = this.add.rectangle(
      level.spawn.x,
      level.spawn.y,
      LEVEL_SCENE.PLAYER_WIDTH,
      LEVEL_SCENE.PLAYER_HEIGHT,
      toColor(LEVEL_SCENE.PLAYER_COLOR),
    )
    this.physics.add.existing(this.player)
    const body = this.player.body as Body
    body.setCollideWorldBounds(true)
    body.setMaxVelocityY(LEVEL_SCENE.MAX_FALL_SPEED)
    this.physics.add.collider(this.player, platforms)

    // Walls on the sides and top only: the player can fall out of the bottom.
    this.physics.world.setBounds(0, 0, level.width, level.height, true, true, true, false)
    this.cameras.main.setBounds(0, 0, level.width, level.height)
    this.cameras.main.startFollow(this.player, true)

    this.keys = {
      left: this.addKeys(LEVEL_KEYS.LEFT),
      right: this.addKeys(LEVEL_KEYS.RIGHT),
      jump: this.addKeys(LEVEL_KEYS.JUMP),
    }
  }

  update(_time: number, delta: number) {
    if (this.isOver) return
    const body = this.player.body as Body
    const velocity = this.controller.step({
      deltaMs: delta,
      left: isAnyDown(this.keys.left),
      right: isAnyDown(this.keys.right),
      jumpHeld: isAnyDown(this.keys.jump),
      grounded: body.blocked.down || body.touching.down,
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
    })
    body.setVelocity(velocity.velocityX, velocity.velocityY)

    const outcome = this.rules.step({ x: body.x, y: body.y, width: body.width, height: body.height })
    if (outcome === 'playing') return

    this.isOver = true
    body.stop()
    body.setAllowGravity(false)
    if (outcome === 'died') {
      this.time.delayedCall(LEVEL_SCENE.RESPAWN_DELAY_MS, () => this.scene.restart({ level: this.level }))
    } else {
      this.showMessage(LEVEL_SCENE.COMPLETE_MESSAGE)
    }
  }

  private drawRect(rect: LevelRect, color: string) {
    return this.add.rectangle(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width, rect.height, toColor(color))
  }

  /** `enableCapture: false` so Phaser does not swallow these keys for the rest of the page. */
  private addKeys(names: readonly string[]): KeyGroup {
    const keyboard = this.input.keyboard
    if (!keyboard) return []
    return names.map((name) => keyboard.addKey(name, false))
  }

  private showMessage(text: string) {
    const camera = this.cameras.main
    this.add
      .text(camera.width / 2, camera.height / 2, text, {
        font: LEVEL_SCENE.MESSAGE_FONT,
        color: LEVEL_SCENE.MESSAGE_COLOR,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
  }
}

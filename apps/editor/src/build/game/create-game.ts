import Phaser from 'phaser'

import { BUILD_GAME, LEVEL_SCENE } from '@/constants/build-game'
import { LevelScene } from './LevelScene'
import type { ControllableGame, Level, LevelSceneData, MountedGame } from '../types'

export type BuildGame = ControllableGame & MountedGame

/** Builds the Phaser game inside `parent` and adapts it to the narrow interfaces the bus and mounter use. */
export function createGame(parent: HTMLElement): BuildGame {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: BUILD_GAME.WIDTH,
    height: BUILD_GAME.HEIGHT,
    backgroundColor: BUILD_GAME.BACKGROUND,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: LEVEL_SCENE.GRAVITY } },
    },
  })
  // Added without starting: the level scene needs a level, which arrives with `load-level`.
  game.scene.add(LEVEL_SCENE.KEY, LevelScene, false)

  let currentLevel: Level | null = null
  const startLevel = (level: Level) => {
    const data: LevelSceneData = { level }
    game.scene.start(LEVEL_SCENE.KEY, data)
  }

  return {
    loadLevel: (level) => {
      currentLevel = level
      startLevel(level)
    },
    pause: () => game.pause(),
    resume: () => game.resume(),
    // Starting a running scene shuts it down and starts it again from the loaded level.
    restartActiveScene: () => {
      if (currentLevel) startLevel(currentLevel)
    },
    toggleFullscreen: () => game.scale.toggleFullscreen(),
    destroy: () => game.destroy(true),
    onceDestroyed: (callback) => {
      game.events.once(Phaser.Core.Events.DESTROY, callback)
    },
  }
}

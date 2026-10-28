import Phaser from 'phaser'

import { BUILD_GAME, PREVIEW_SCENE } from '@/constants/build-game'
import { PreviewScene } from './PreviewScene'
import type { ControllableGame, MountedGame } from '../types'

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
    scene: [PreviewScene],
  })

  return {
    pause: () => game.pause(),
    resume: () => game.resume(),
    restartActiveScene: () => game.scene.getScene(PREVIEW_SCENE.KEY)?.scene.restart(),
    toggleFullscreen: () => game.scale.toggleFullscreen(),
    destroy: () => game.destroy(true),
    onceDestroyed: (callback) => {
      game.events.once(Phaser.Core.Events.DESTROY, callback)
    },
  }
}

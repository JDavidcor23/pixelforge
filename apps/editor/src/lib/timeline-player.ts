import type { TimelineTrack } from '@/types/timeline'
import type { MixInput } from '@/types/timeline-view'
import { GAIN_SMOOTHING_S, MIX_EXPORT, PLAYBACK_SCHEDULE_LEAD_S } from '@/constants/timeline-view'
import { audioEngine } from './audio-engine'
import { effectiveGain, hasSoloTrack } from './timeline-ops'
import { mixLength, scheduleClips } from './timeline-schedule'

// Web Audio graph for the timeline mix, shared by live playback and export:
//   source(playbackRate = speed) → clip gain (dB + fades) → track gain
//   (volume, mute/solo) → master gain → destination

interface MixGraph {
  master: GainNode
  trackGains: Map<string, GainNode>
  sources: AudioBufferSourceNode[]
  clipGains: GainNode[]
}

function buildMixGraph(
  context: BaseAudioContext,
  destination: AudioNode,
  input: MixInput,
  fromTime: number,
  startAt: number
): MixGraph {
  const master = context.createGain()
  master.gain.setValueAtTime(input.masterVolume, startAt)
  master.connect(destination)

  const anySolo = hasSoloTrack(input.tracks)
  const trackGains = new Map<string, GainNode>()
  for (const track of input.tracks) {
    const gain = context.createGain()
    gain.gain.setValueAtTime(effectiveGain(track, anySolo), startAt)
    gain.connect(master)
    trackGains.set(track.id, gain)
  }

  const sources: AudioBufferSourceNode[] = []
  const clipGains: GainNode[] = []
  for (const entry of scheduleClips(input.clips, fromTime)) {
    const buffer = input.buffers.get(entry.assetId)
    const trackGain = trackGains.get(entry.trackId)
    if (!buffer || !trackGain || entry.offset >= buffer.duration) continue

    const begin = startAt + entry.when
    const clipGain = context.createGain()
    const [first, ...rest] = entry.envelope
    clipGain.gain.setValueAtTime(first.value, begin)
    for (const point of rest) clipGain.gain.linearRampToValueAtTime(point.value, begin + point.time)
    clipGain.connect(trackGain)

    const source = context.createBufferSource()
    source.buffer = buffer
    source.playbackRate.setValueAtTime(entry.speed, begin)
    source.connect(clipGain)
    source.start(begin, entry.offset)
    source.stop(begin + entry.playFor)

    sources.push(source)
    clipGains.push(clipGain)
  }

  return { master, trackGains, sources, clipGains }
}

function disposeMixGraph(graph: MixGraph): void {
  for (const source of graph.sources) {
    try {
      source.stop()
    } catch {
      // Never started or already stopped.
    }
    source.disconnect()
  }
  for (const gain of graph.clipGains) gain.disconnect()
  for (const gain of graph.trackGains.values()) gain.disconnect()
  graph.master.disconnect()
}

/** Renders the whole timeline offline (for "Export mix"). */
export async function renderMix(input: MixInput, sampleRate: number): Promise<AudioBuffer> {
  const length = Math.ceil(mixLength(input.clips) * sampleRate)
  if (length <= 0) throw new Error('Cannot render an empty timeline')
  const context = new OfflineAudioContext(MIX_EXPORT.CHANNELS, length, sampleRate)
  buildMixGraph(context, context.destination, input, 0, 0)
  return context.startRendering()
}

/**
 * Live playback. One graph at a time: every (re)start tears the previous
 * graph down and schedules all clips again from the requested time.
 */
export class TimelinePlayer {
  private graph: MixGraph | null = null
  private startedAt = 0
  private fromTime = 0

  constructor(
    private readonly getContext: () => AudioContext,
    private readonly getDestination: () => AudioNode
  ) {}

  play(input: MixInput, fromTime: number): void {
    this.stop()
    const context = this.getContext()
    const startAt = context.currentTime + PLAYBACK_SCHEDULE_LEAD_S
    this.graph = buildMixGraph(context, this.getDestination(), input, fromTime, startAt)
    this.startedAt = startAt
    this.fromTime = fromTime
  }

  /** Playhead position in timeline seconds (only meaningful while playing). */
  position(): number {
    const elapsed = this.getContext().currentTime - this.startedAt
    return this.fromTime + Math.max(0, elapsed)
  }

  /** Applies volume / mute / solo changes without rescheduling the clips. */
  setMix(tracks: readonly TimelineTrack[], masterVolume: number): void {
    const graph = this.graph
    if (!graph) return
    const now = this.getContext().currentTime
    graph.master.gain.setTargetAtTime(masterVolume, now, GAIN_SMOOTHING_S)
    const anySolo = hasSoloTrack(tracks)
    for (const track of tracks) {
      graph.trackGains.get(track.id)?.gain.setTargetAtTime(effectiveGain(track, anySolo), now, GAIN_SMOOTHING_S)
    }
  }

  stop(): void {
    if (this.graph) disposeMixGraph(this.graph)
    this.graph = null
  }
}

export const timelinePlayer = new TimelinePlayer(
  () => audioEngine.getContext(),
  () => audioEngine.getAnalyserNode()
)

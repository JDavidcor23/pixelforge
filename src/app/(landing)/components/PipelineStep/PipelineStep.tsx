import type { PipelineStepProps } from '../../types'

export const PipelineStep = ({ stepNumber, title, description }: PipelineStepProps) => {
  return (
    <div className="group relative flex gap-8">
      <div className="flex flex-col items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-lg font-bold text-accent shadow-[0_0_20px_rgba(0,251,251,0.1)] transition-transform duration-300 group-hover:scale-110">
          {stepNumber}
        </div>
        <div className="mt-4 h-full w-px bg-gradient-to-b from-accent/30 to-transparent group-last:hidden" />
      </div>

      <div className="pb-16 group-last:pb-0">
        <h3 className="mb-3 text-2xl font-bold tracking-wide text-white">
          {title}
        </h3>
        <p className="max-w-lg text-base leading-relaxed text-zinc-400">
          {description}
        </p>
        <div className="mt-6 h-40 w-full max-w-lg rounded-xl border border-white/5 bg-zinc-900/60" />
      </div>
    </div>
  )
}

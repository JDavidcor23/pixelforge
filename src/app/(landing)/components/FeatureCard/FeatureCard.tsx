import type { FeatureCardProps } from '../../types'

export const FeatureCard = ({ icon, title, description, moduleId, tags }: FeatureCardProps) => {
  return (
    <div className="group relative flex flex-col rounded-sm border border-white/5 bg-[#121214] p-8 transition-all hover:border-accent/20 hover:bg-[#161618]">
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 text-accent transition-transform duration-300 group-hover:scale-110">
          { icon }
        </div>
        { moduleId && (
          <span className="font-mono text-[10px] tracking-tighter text-accent/30">
            { moduleId }
          </span>
        ) }
      </div>

      <h3 className="mt-8 text-2xl font-black tracking-tight text-white transition-colors group-hover:text-accent">
        { title }
      </h3>

      <p className="mt-4 flex-grow text-[15px] leading-relaxed text-zinc-400">
        { description }
      </p>

      { tags && tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          { tags.map( ( tag ) => (
            <span
              key={ tag }
              className="bg-white/5 px-3 py-1 text-[10px] font-bold tracking-widest text-zinc-500 transition-colors group-hover:bg-white/10 group-hover:text-zinc-400"
            >
              { tag }
            </span>
          ) ) }
        </div>
      ) }
    </div>
  )
}

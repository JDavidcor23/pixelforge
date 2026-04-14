import type { FeatureCardProps } from '../../types'

export const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="group rounded-2xl border border-white/10 bg-zinc-900 p-6 transition-all hover:border-accent/30 hover:shadow-[0_0_30px_rgba(0,251,251,0.1)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 p-2.5 text-accent transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold tracking-wide text-white">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-zinc-400">
        {description}
      </p>
    </div>
  )
}

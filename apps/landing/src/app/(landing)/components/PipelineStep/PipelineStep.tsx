import type { PipelineStepProps } from '../../types'

export const PipelineStep = ({ stepNumber, title, description }: PipelineStepProps) => {
  return (
    <div className="group flex items-start gap-12">
      { /* Number Box and Vertical Line Column */ }
      <div className="flex flex-col items-center">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center border border-accent/40 bg-accent/5 font-mono text-xl font-bold text-accent shadow-[0_0_20px_rgba(0,251,251,0.05)] transition-all group-hover:border-accent group-hover:bg-accent/10">
          { stepNumber }
          { /* Vertical Line connecting to next step */ }
          <div className="absolute top-full h-32 w-px bg-gradient-to-b from-accent/40 to-transparent group-last:hidden" />
        </div>
      </div>

      { /* Content Column */ }
      <div className="flex-grow pt-2">
        <h3 className="text-2xl font-black tracking-tight text-white uppercase group-hover:text-accent transition-colors">
          { title }
        </h3>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-zinc-400">
          { description }
        </p>
      </div>

      { /* Image/Screenshot Column */ }
      <div className="hidden lg:block shrink-0 pt-2">
        <div className="h-28 w-48 rounded bg-[#161618] border border-white/5 relative overflow-hidden group-hover:border-accent/20 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
          { /* Abstract "Technical UI" decoration inside the placeholder */ }
          <div className="absolute bottom-2 left-2 right-2 h-1 bg-white/5" />
          <div className="absolute top-2 left-2 w-4 h-4 rounded-full border border-white/10" />
        </div>
      </div>
      
      { /* Spacer for bottom vertical line */ }
      <div className="h-48 group-last:h-24 w-0" />
    </div>
  )
}

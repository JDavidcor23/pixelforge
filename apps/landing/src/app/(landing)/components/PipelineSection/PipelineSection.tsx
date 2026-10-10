import { PipelineStep } from '../PipelineStep/PipelineStep'

import { LANDING_PIPELINE, LANDING_PIPELINE_STEPS } from '../../constants'

export const PipelineSection = () =>
{
  return (
    <section id="pipeline" className="relative overflow-hidden bg-[#0A0A0C] py-32">
      { /* Technical Grid Background */ }
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-24 text-center">
          <h2 className="text-4xl font-black tracking-tight sm:text-6xl uppercase">
            <span className="text-white">{ LANDING_PIPELINE.TITLE_WHITE } </span>
            <span className="text-accent">{ LANDING_PIPELINE.TITLE_ACCENT }</span>
          </h2>
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-0">
          { LANDING_PIPELINE_STEPS.map( ( step ) => (
            <PipelineStep
              key={ step.stepNumber }
              stepNumber={ step.stepNumber }
              title={ step.title }
              description={ step.description }
            />
          ) ) }
        </div>
      </div>
    </section>
  )
}

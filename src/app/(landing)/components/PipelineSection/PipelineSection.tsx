import { PipelineStep } from '../PipelineStep/PipelineStep'

import { LANDING_PIPELINE, LANDING_PIPELINE_STEPS } from '../../constants'

export const PipelineSection = () =>
{
  return (
    <section id="pipeline" className="bg-[#121419] py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="text-white">{ LANDING_PIPELINE.TITLE_WHITE } </span>
            <span className="text-accent">{ LANDING_PIPELINE.TITLE_ACCENT }</span>
          </h2>
        </div>

        <div className="mx-auto max-w-2xl">
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

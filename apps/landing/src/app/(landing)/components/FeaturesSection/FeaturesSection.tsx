import { FeatureCard } from '../FeatureCard/FeatureCard'

import { LANDING_FEATURES, LANDING_FEATURE_CARDS } from '../../constants'

export const FeaturesSection = () =>
{
  return (
    <section id="features" className="bg-[#121419] py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="text-white">{ LANDING_FEATURES.TITLE_WHITE } </span>
            <span className="text-accent">{ LANDING_FEATURES.TITLE_ACCENT }</span>
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            { LANDING_FEATURES.SUBTITLE }
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          { LANDING_FEATURE_CARDS.map( ( feature ) => (
            <FeatureCard
              key={ feature.title }
              moduleId={ feature.moduleId }
              icon={ feature.icon }
              title={ feature.title }
              description={ feature.description }
              tags={ feature.tags }
            />
          ) ) }
        </div>
      </div>
    </section>
  )
}

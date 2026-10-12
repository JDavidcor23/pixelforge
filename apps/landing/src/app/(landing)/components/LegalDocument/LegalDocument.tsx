import type { LegalDocumentProps } from '../../types'

export const LegalDocument = ({ title, lastUpdated, intro, sections }: LegalDocumentProps) =>
{
  return (
    <article className="mx-auto max-w-[720px] px-6 pb-24 pt-32">
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        { title }
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        { `Last updated: ${lastUpdated}` }
      </p>

      { intro && (
        <p className="mt-8 text-[15px] leading-relaxed text-zinc-400">
          { intro }
        </p>
      ) }

      <div className="mt-8 space-y-10">
        { sections.map( ( section ) => (
          <section key={ section.heading }>
            <h2 className="text-xl font-semibold text-white">
              { section.heading }
            </h2>

            { section.paragraphs?.map( ( paragraph, index ) => (
              <p key={ index } className="mt-3 text-[15px] leading-relaxed text-zinc-400">
                { paragraph }
              </p>
            ) ) }

            { section.list && (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-zinc-400">
                { section.list.map( ( item, index ) => (
                  <li key={ index }>{ item }</li>
                ) ) }
              </ul>
            ) }
          </section>
        ) ) }
      </div>
    </article>
  )
}

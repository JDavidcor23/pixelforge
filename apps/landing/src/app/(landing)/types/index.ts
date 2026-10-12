import type { ReactNode } from 'react'

export interface FeatureCardProps {
  readonly icon: ReactNode
  readonly title: string
  readonly description: string
  readonly moduleId?: string
  readonly tags?: readonly string[]
}

export interface PipelineStepProps {
  readonly stepNumber: string
  readonly title: string
  readonly description: string
}

export interface NavLink {
  readonly label: string
  readonly href: string
}

export interface FooterLink {
  readonly label: string
  readonly href: string
  readonly isExternal: boolean
}

export interface WordmarkProps {
  readonly className?: string
}

export interface LegalSection {
  readonly heading: string
  readonly paragraphs?: readonly string[]
  readonly list?: readonly string[]
}

export interface LegalDocumentProps {
  readonly title: string
  readonly lastUpdated: string
  readonly intro?: string
  readonly sections: readonly LegalSection[]
}

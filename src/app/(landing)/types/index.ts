export interface FeatureCardProps {
  readonly icon: string
  readonly title: string
  readonly description: string
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

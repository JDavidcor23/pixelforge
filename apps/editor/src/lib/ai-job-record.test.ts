import { describe, expect, it } from 'vitest'

import { buildAiJobInsertRow, readBearerToken, serverJobOwnerToken } from './ai-job-record'
import { AI_JOB_LABEL_MAX_LENGTH } from '@/constants/ai-jobs'

describe('readBearerToken', () => {
  it('reads the token of a Bearer header', () => {
    expect(readBearerToken('Bearer abc.def')).toBe('abc.def')
    expect(readBearerToken('bearer   xyz ')).toBe('xyz')
  })

  it('returns null for a missing, empty or non-Bearer header', () => {
    expect(readBearerToken(null)).toBeNull()
    expect(readBearerToken('')).toBeNull()
    expect(readBearerToken('Bearer ')).toBeNull()
    expect(readBearerToken('Basic abc')).toBeNull()
  })
})

describe('serverJobOwnerToken', () => {
  it('records only server-billed jobs of a signed-in user', () => {
    expect(serverJobOwnerToken('Bearer jwt', false)).toBe('jwt')
    expect(serverJobOwnerToken('Bearer jwt', true)).toBeNull()
    expect(serverJobOwnerToken(null, false)).toBeNull()
  })
})

describe('buildAiJobInsertRow', () => {
  const base = { jobId: 'job-1', frameCount: 8, width: 128, height: 128, params: { action: 'walk' } }

  it('maps the job to an ai_jobs row without owner or status (DB defaults + RLS own those)', () => {
    const row = buildAiJobInsertRow({ ...base, job: { label: 'Walk', assetType: 'character' } })
    expect(row).toEqual({
      provider: 'pixellab',
      provider_job_id: 'job-1',
      kind: 'animation',
      label: 'Walk',
      asset_type: 'character',
      frame_count: 8,
      width: 128,
      height: 128,
      params: { action: 'walk' },
    })
    expect(row).not.toHaveProperty('owner_id')
    expect(row).not.toHaveProperty('status')
  })

  it('clips the label to the column limit and nulls missing metadata', () => {
    const long = 'x'.repeat(AI_JOB_LABEL_MAX_LENGTH + 30)
    expect(buildAiJobInsertRow({ ...base, job: { label: long, assetType: 'object' } }).label).toHaveLength(
      AI_JOB_LABEL_MAX_LENGTH,
    )
    const bare = buildAiJobInsertRow({ ...base, job: undefined })
    expect(bare.label).toBeNull()
    expect(bare.asset_type).toBeNull()
  })
})

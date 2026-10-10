import { supabase } from '@/lib/supabase'
import type { AudioAsset } from '@/types/audio'
import { AUDIO_STORAGE_BUCKET } from '@/constants/audio'

interface UploadResult {
  url: string
  path: string
}

interface StorageError {
  message: string
  code: string
}

function buildFilePath(userId: string, fileId: string): string {
  return `${userId}/sounds/${fileId}.wav`
}

function generateId(): string {
  return crypto.randomUUID()
}

export async function uploadAudio(
  userId: string,
  name: string,
  blob: Blob,
  metadata: Omit<AudioAsset, 'id' | 'supabaseUrl' | 'localObjectUrl' | 'createdAt'>
): Promise<UploadResult> {
  const id = generateId()
  const filePath = buildFilePath(userId, id)

  const { error: uploadError } = await supabase.storage
    .from(AUDIO_STORAGE_BUCKET)
    .upload(filePath, blob, {
      contentType: 'audio/wav',
      upsert: false,
    })

  if (uploadError) {
    const storageError: StorageError = {
      message: uploadError.message,
      code: 'UPLOAD_FAILED',
    }
    throw storageError
  }

  const { data: urlData } = supabase.storage
    .from(AUDIO_STORAGE_BUCKET)
    .getPublicUrl(filePath)

  return {
    url: urlData.publicUrl,
    path: filePath,
  }
}

export async function listAudioAssets(userId: string): Promise<AudioAsset[]> {
  const folderPath = `${userId}/sounds`

  const { data: files, error } = await supabase.storage
    .from(AUDIO_STORAGE_BUCKET)
    .list(folderPath)

  if (error) {
    const storageError: StorageError = {
      message: error.message,
      code: 'LIST_FAILED',
    }
    throw storageError
  }

  if (!files || files.length === 0) {
    return []
  }

  const assets: AudioAsset[] = files.map((file) => {
    const { data: urlData } = supabase.storage
      .from(AUDIO_STORAGE_BUCKET)
      .getPublicUrl(`${folderPath}/${file.name}`)

    const id = file.name.replace('.wav', '')
    const fileSize = (file.metadata as Record<string, unknown>)?.size
    const numericSize = typeof fileSize === 'number' ? fileSize : 0

    return {
      id,
      name: file.name.replace('.wav', ''),
      tags: [] as string[],
      duration: 0,
      format: 'audio/wav',
      fileSize: numericSize,
      supabaseUrl: urlData.publicUrl,
      associatedSpriteIds: [] as string[],
      createdAt: file.created_at ?? new Date().toISOString(),
    }
  })

  return assets
}

export async function deleteAudioAsset(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(AUDIO_STORAGE_BUCKET)
    .remove([path])

  if (error) {
    const storageError: StorageError = {
      message: error.message,
      code: 'DELETE_FAILED',
    }
    throw storageError
  }
}

export async function downloadAudioAsset(url: string): Promise<Blob> {
  const response = await fetch(url)

  if (!response.ok) {
    const storageError: StorageError = {
      message: `Download failed with status ${response.status}`,
      code: 'DOWNLOAD_FAILED',
    }
    throw storageError
  }

  return response.blob()
}

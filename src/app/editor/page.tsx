import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/ROUTES'

export default function EditorPage() {
  redirect(ROUTES.EDITOR_SPRITES)
}

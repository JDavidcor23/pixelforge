import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { EditorLayout } from './components/EditorLayout/EditorLayout'
import { SpriteEditorLayout } from './sprites/components/SpriteEditorLayout/SpriteEditorLayout'
import { SoundEditorLayout } from './sounds/components/SoundEditorLayout/SoundEditorLayout'
import { LoginPage } from './auth/pages/LoginPage/LoginPage'
import { ResetPasswordPage } from './auth/pages/ResetPasswordPage/ResetPasswordPage'
import { useAuthSession } from './hooks/useAuthSession.hook'
import { EDITOR_ROUTES } from './constants/routes'

export function App() {
  // Session listener lives at the root so it's active on every route,
  // including /login and /reset-password which sit outside EditorLayout.
  useAuthSession()

  return (
    <BrowserRouter>
      <Routes>
        {/* Full-screen, outside the editor shell — no app rail (optional accounts). */}
        <Route path={EDITOR_ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={EDITOR_ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

        <Route element={<EditorLayout />}>
          <Route index element={<Navigate to={EDITOR_ROUTES.SPRITES} replace />} />
          <Route path="sprites" element={<SpriteEditorLayout />} />
          <Route path="sounds" element={<SoundEditorLayout />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

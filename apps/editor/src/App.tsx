import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { EditorLayout } from './components/EditorLayout/EditorLayout'
import { SpriteEditorLayout } from './sprites/components/SpriteEditorLayout/SpriteEditorLayout'
import { SoundEditorLayout } from './sounds/components/SoundEditorLayout/SoundEditorLayout'
import { EDITOR_ROUTES } from './constants/routes'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<EditorLayout />}>
          <Route index element={<Navigate to={EDITOR_ROUTES.SPRITES} replace />} />
          <Route path="sprites" element={<SpriteEditorLayout />} />
          <Route path="sounds" element={<SoundEditorLayout />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

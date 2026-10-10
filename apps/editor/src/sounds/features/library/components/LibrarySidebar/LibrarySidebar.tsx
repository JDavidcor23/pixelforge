import { Plus } from 'lucide-react'

import { LibraryFilters } from '../LibraryFilters/LibraryFilters'
import { LibrarySearch } from '../LibrarySearch/LibrarySearch'
import { NewSoundPopover } from '../NewSoundPopover/NewSoundPopover'
import { SoundList } from '../SoundList/SoundList'
import { useLibrarySidebar } from './useLibrarySidebar.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

export function LibrarySidebar() {
  const { triggerRef, isNewSoundOpen, handleToggleNewSound } = useLibrarySidebar()

  return (
    <aside
      aria-label="Sound library"
      className="relative flex w-80 shrink-0 flex-col border-r border-line bg-surface"
    >
      <header className="flex flex-col gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-ink">Sounds</h1>
          <div className="relative">
            <button
              ref={triggerRef}
              type="button"
              onClick={handleToggleNewSound}
              aria-haspopup="dialog"
              aria-expanded={isNewSoundOpen}
              className={`flex items-center gap-1.5 rounded bg-accent px-3 py-1.75 text-ui font-semibold text-on-accent hover:bg-white active:bg-accent-strong aria-expanded:bg-white ${MOTION.PRESS} ${FOCUS_RING.SURFACE}`}
            >
              <Plus className="size-3.5" aria-hidden />
              New sound
            </button>
            {isNewSoundOpen && <NewSoundPopover triggerRef={triggerRef} />}
          </div>
        </div>
        <LibrarySearch />
        <LibraryFilters />
      </header>

      <SoundList />
    </aside>
  )
}

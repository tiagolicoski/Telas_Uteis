import { useState } from 'react'
import { X } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { blocksToRestore } from '../../utils/sheetBlocks'
import { ConfirmDialog } from './ConfirmDialog'

export function SheetBlocksToolbar() {
  const { state, dispatch } = useFinance()
  const [title, setTitle] = useState('')
  const [dismissId, setDismissId] = useState<string | null>(null)
  const monthKey = state.activeSheetMonthKey
  const restore = blocksToRestore(state, monthKey)
  const dismissTitle = restore.find((block) => block.id === dismissId)?.title

  function addBlock() {
    if (!title.trim()) return
    dispatch({ type: 'ADD_SHEET_BLOCK', monthKey, title })
    setTitle('')
  }

  return (
    <div className="sheet-blocks-toolbar">
      <div className="sheet-blocks-add">
        <input
          type="text"
          placeholder="Nome do novo bloco"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addBlock()}
        />
        <button type="button" className="sheet-toolbar-btn primary" onClick={addBlock}>
          + Bloco
        </button>
      </div>
      {restore.length > 0 && (
        <div className="sheet-blocks-restore">
          <span className="sheet-restore-label">Trazer de volta:</span>
          {restore.map((block) => (
            <span key={block.id} className="sheet-restore-chip">
              <button
                type="button"
                className="sheet-toolbar-btn"
                onClick={() =>
                  dispatch({ type: 'RESTORE_SHEET_BLOCK', monthKey, categoryId: block.id })
                }
              >
                {block.title}
              </button>
              <button
                type="button"
                className="sheet-restore-dismiss"
                title="Tirar da lista para sempre"
                aria-label={`Tirar ${block.title} de trazer de volta`}
                onClick={() => setDismissId(block.id)}
              >
                <X size={12} strokeWidth={1.75} />
              </button>
            </span>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={dismissId != null}
        title="Tirar da lista"
        message={`Tirar "${dismissTitle ?? 'este bloco'}" de Trazer de volta? Ele não volta a aparecer nessa lista.`}
        confirmLabel="Tirar"
        danger
        onCancel={() => setDismissId(null)}
        onConfirm={() => {
          if (!dismissId) return
          dispatch({ type: 'DISMISS_RESTORE_BLOCK', categoryId: dismissId })
          setDismissId(null)
        }}
      />
    </div>
  )
}

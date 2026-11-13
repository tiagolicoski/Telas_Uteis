import { useState } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { missingBuiltinPresets } from '../../utils/sheetBlocks'

export function SheetBlocksToolbar() {
  const { state, dispatch } = useFinance()
  const [title, setTitle] = useState('')
  const restore = missingBuiltinPresets(state)

  function addBlock() {
    if (!title.trim()) return
    dispatch({ type: 'ADD_SHEET_BLOCK', title })
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
          {restore.map((p) => (
            <button
              key={p.id}
              type="button"
              className="sheet-toolbar-btn"
              onClick={() => dispatch({ type: 'RESTORE_SHEET_BLOCK', presetId: p.id })}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

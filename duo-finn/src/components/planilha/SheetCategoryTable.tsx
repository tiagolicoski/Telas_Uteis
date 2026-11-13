import { ChevronLeft, ChevronRight, Circle, CircleDot, X } from 'lucide-react'
import { memo } from 'react'
import type { SheetCategory } from '../../data/types'
import { useFinance } from '../../context/FinanceContext'
import { categoryTotal } from '../../utils/sheet'
import { MoneyInput } from './MoneyInput'
import { SheetDayInput } from './SheetDayInput'
import { SheetTextInput } from './SheetTextInput'
import './Planilha.css'

type Props = {
  monthKey: string
  category: SheetCategory
  canMoveLeft: boolean
  canMoveRight: boolean
  canRemove: boolean
}

export const SheetCategoryTable = memo(function SheetCategoryTable({
  monthKey,
  category,
  canMoveLeft,
  canMoveRight,
  canRemove,
}: Props) {
  const { formatBRL, dispatch, state } = useFinance()
  const total = categoryTotal(category)
  const inOverview = state.overviewBlockIds.includes(category.id)

  return (
    <div className="sheet-table-wrap">
      <div className="sheet-block-actions" aria-label={`Ações do bloco ${category.title}`}>
        <button
          type="button"
          className="sheet-block-btn"
          disabled={!canMoveLeft}
          aria-label="Mover bloco para a esquerda"
          onClick={() =>
            dispatch({
              type: 'MOVE_SHEET_BLOCK',
              categoryId: category.id,
              direction: 'left',
            })
          }
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="sheet-block-btn"
          disabled={!canMoveRight}
          aria-label="Mover bloco para a direita"
          onClick={() =>
            dispatch({
              type: 'MOVE_SHEET_BLOCK',
              categoryId: category.id,
              direction: 'right',
            })
          }
        >
          <ChevronRight size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className={`sheet-block-btn overview ${inOverview ? 'on' : ''}`}
          title={
            inOverview
              ? 'No saldo da visão geral — clique para descer'
              : 'Fora do saldo — clique para subir'
          }
          onClick={() =>
            dispatch({ type: 'TOGGLE_OVERVIEW_BLOCK', categoryId: category.id })
          }
        >
          {inOverview ? (
            <CircleDot size={16} strokeWidth={1.75} />
          ) : (
            <Circle size={16} strokeWidth={1.75} />
          )}
        </button>
        <button
          type="button"
          className="sheet-block-btn danger"
          disabled={!canRemove}
          aria-label="Remover bloco"
          title="Remover bloco (todos os meses)"
          onClick={() => {
            if (window.confirm(`Remover o bloco "${category.title}"?`)) {
              dispatch({ type: 'REMOVE_SHEET_BLOCK', categoryId: category.id })
            }
          }}
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>
      <table className="sheet-table">
        <thead>
          <tr>
            <th colSpan={3}>
              <SheetTextInput
                className="sheet-title-input"
                value={category.title}
                aria-label="Nome do bloco"
                onCommit={(title) =>
                  dispatch({
                    type: 'UPDATE_SHEET_CATEGORY_TITLE',
                    categoryId: category.id,
                    title,
                  })
                }
              />
            </th>
          </tr>
          <tr className="sheet-subhead">
            <th>ITEM</th>
            <th>DIA</th>
            <th>VALOR</th>
          </tr>
        </thead>
        <tbody>
          {category.lines.map((line) => (
            <tr key={line.id}>
              <td>
                <SheetTextInput
                  className="sheet-text-input"
                  value={line.label}
                  onCommit={(label) =>
                    dispatch({
                      type: 'UPDATE_SHEET_LINE',
                      monthKey,
                      categoryId: category.id,
                      lineId: line.id,
                      label,
                    })
                  }
                />
              </td>
              <td className="sheet-dia">
                <SheetDayInput
                  className="sheet-day-input"
                  value={line.dueDay ?? null}
                  onCommit={(dueDay) =>
                    dispatch({
                      type: 'UPDATE_SHEET_LINE',
                      monthKey,
                      categoryId: category.id,
                      lineId: line.id,
                      dueDay,
                    })
                  }
                />
              </td>
              <td className="sheet-valor">
                <MoneyInput
                  className="sheet-money-input"
                  value={line.amount}
                  onCommit={(amount) =>
                    dispatch({
                      type: 'UPDATE_SHEET_LINE',
                      monthKey,
                      categoryId: category.id,
                      lineId: line.id,
                      amount,
                    })
                  }
                />
                <button
                  type="button"
                  className="sheet-remove"
                  title="Remover linha"
                  onClick={() =>
                    dispatch({
                      type: 'REMOVE_SHEET_LINE',
                      monthKey,
                      categoryId: category.id,
                      lineId: line.id,
                    })
                  }
                >
                  <X size={12} strokeWidth={1.75} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="sheet-total-row">
            <td>TOTAL</td>
            <td />
            <td>{formatBRL(total)}</td>
          </tr>
        </tfoot>
      </table>
      <button
        type="button"
        className="sheet-add-line"
        onClick={() =>
          dispatch({
            type: 'ADD_SHEET_LINE',
            monthKey,
            categoryId: category.id,
            label: 'Novo item',
          })
        }
      >
        + linha
      </button>
    </div>
  )
})

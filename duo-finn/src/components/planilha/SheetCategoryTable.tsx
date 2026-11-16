import { ChevronLeft, ChevronRight, Circle, CircleDot, Receipt, X } from 'lucide-react'
import { memo, useState } from 'react'
import type { SheetCategory, SheetLine } from '../../data/types'
import { useFinance } from '../../context/FinanceContext'
import { categoryTotal } from '../../utils/sheet'
import { blockShowsInBills, formatBlockTitle } from '../../utils/sheetBlocks'
import { ConfirmDialog } from './ConfirmDialog'
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
  const [pendingDelete, setPendingDelete] = useState<
    { kind: 'line'; line: SheetLine } | { kind: 'block' } | null
  >(null)
  const monthLabel =
    state.sheetMonths.find((month) => month.key === monthKey)?.label ?? 'deste mês'
  const total = categoryTotal(category)
  const inOverview = state.overviewBlockIds.includes(category.id)
  const inBills = blockShowsInBills(category, state.overviewBlockIds)

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
              monthKey,
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
              monthKey,
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
          className={`sheet-block-btn bills ${inBills ? 'on' : ''}`}
          aria-pressed={inBills}
          title={
            inBills
              ? 'Aparece em Contas a pagar — clique para tirar deste mês'
              : 'Fora de Contas a pagar — clique para incluir neste mês'
          }
          onClick={() =>
            dispatch({ type: 'TOGGLE_BILLS_BLOCK', monthKey, categoryId: category.id })
          }
        >
          <Receipt size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="sheet-block-btn danger"
          disabled={!canRemove}
          aria-label="Remover bloco deste mês"
          title="Remover bloco só deste mês"
          onClick={() => setPendingDelete({ kind: 'block' })}
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>
      <table className="sheet-table">
        <colgroup>
          <col />
          <col className="col-dia" />
          <col className="col-valor" />
          <col className="col-remove" />
        </colgroup>
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
                    monthKey,
                    categoryId: category.id,
                    title,
                  })
                }
              />
            </th>
            <th className="sheet-remove-head" />
          </tr>
          <tr className="sheet-subhead">
            <th>ITEM</th>
            <th>DIA</th>
            <th>VALOR</th>
            <th className="sheet-remove-head" />
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
              </td>
              <td className="sheet-remove-cell">
                <button
                  type="button"
                  className="sheet-remove"
                  title="Remover linha"
                  aria-label={`Remover a linha ${line.label || 'sem nome'}`}
                  onClick={() => setPendingDelete({ kind: 'line', line })}
                >
                  <X size={14} strokeWidth={1.75} />
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
            <td className="sheet-remove-cell" />
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
      <ConfirmDialog
        open={pendingDelete != null}
        title={pendingDelete?.kind === 'block' ? 'Excluir bloco' : 'Excluir linha'}
        message={
          pendingDelete?.kind === 'block'
            ? `Excluir o bloco "${formatBlockTitle(category.title) || category.title}" só de ${monthLabel}? Os outros meses continuam com ele.`
            : pendingDelete?.kind === 'line'
              ? `Excluir a linha "${pendingDelete.line.label.trim() || 'sem nome'}" deste bloco?`
              : ''
        }
        confirmLabel="Excluir"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete?.kind === 'line') {
            dispatch({
              type: 'REMOVE_SHEET_LINE',
              monthKey,
              categoryId: category.id,
              lineId: pendingDelete.line.id,
            })
          }
          if (pendingDelete?.kind === 'block') {
            dispatch({ type: 'REMOVE_SHEET_BLOCK', monthKey, categoryId: category.id })
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
})

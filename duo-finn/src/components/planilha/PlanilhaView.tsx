import { useState } from 'react'
import { X } from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { ConfirmDialog } from './ConfirmDialog'
import {
  getSheetMonth,
  monthCoreBalance,
  monthCoreExpensesTotal,
  monthDetailExpensesTotal,
} from '../../utils/sheet'
import { MoneyInput } from './MoneyInput'
import { SheetDayInput } from './SheetDayInput'
import { SheetTextInput } from './SheetTextInput'
import { SheetBlocksToolbar } from './SheetBlocksToolbar'
import { SheetCategoryTable } from './SheetCategoryTable'
import './Planilha.css'

export function PlanilhaView() {
  const { state, formatBRL, dispatch } = useFinance()
  const [removeMonthOpen, setRemoveMonthOpen] = useState(false)
  const sheet = getSheetMonth(state.sheetMonths, state.activeSheetMonthKey)

  if (!sheet) {
    return (
      <section className="card planilha">
        <p className="empty-hint">Nenhum mês selecionado.</p>
      </section>
    )
  }

  const coreIds = state.overviewBlockIds
  const coreExpenses = monthCoreExpensesTotal(sheet, coreIds)
  const detailExpenses = monthDetailExpensesTotal(sheet, coreIds)
  const balance = monthCoreBalance(sheet, coreIds)

  function confirmRemoveMonth() {
    if (!sheet) return
    dispatch({ type: 'REMOVE_SHEET_MONTH', key: sheet.key })
    setRemoveMonthOpen(false)
  }

  return (
    <section className="card planilha">
      <ConfirmDialog
        open={removeMonthOpen}
        title="Remover este mês?"
        message={`Tem certeza que deseja remover "${sheet.label}"? Todos os lançamentos desse mês serão apagados e não dá para desfazer.`}
        confirmLabel="Sim, remover"
        cancelLabel="Cancelar"
        danger
        onConfirm={confirmRemoveMonth}
        onCancel={() => setRemoveMonthOpen(false)}
      />
      <div className="sheet-top">
        <div className="sheet-top-field">
          <span className="sheet-field-label">Salário líquido</span>
          <div className="sheet-money-day">
            <MoneyInput
              className="sheet-salary-amount"
              value={sheet.netSalary}
              onCommit={(netSalary) =>
                dispatch({
                  type: 'UPDATE_SHEET_HEADER',
                  monthKey: sheet.key,
                  field: 'netSalary',
                  value: netSalary,
                })
              }
            />
            <SheetDayInput
              className="sheet-payday"
              value={sheet.salaryDay ?? null}
              aria-label="Dia em que o salário entra"
              onCommit={(salaryDay) =>
                dispatch({
                  type: 'UPDATE_SHEET_HEADER',
                  monthKey: sheet.key,
                  field: 'salaryDay',
                  value: salaryDay,
                })
              }
            />
          </div>
        </div>

        <div className="sheet-top-field sheet-top-extra">
          <span className="sheet-field-label">Entrada extra</span>
          {(sheet.extraIncomes ?? []).map((extra) => (
            <div key={extra.id} className="sheet-extra-row">
              <SheetTextInput
                value={extra.label}
                placeholder="Freela, aluguel…"
                aria-label="Descrição da entrada extra"
                onCommit={(label) =>
                  dispatch({
                    type: 'UPDATE_EXTRA_INCOME',
                    monthKey: sheet.key,
                    id: extra.id,
                    field: 'label',
                    value: label,
                  })
                }
              />
              <MoneyInput
                className="sheet-extra-amount"
                value={extra.amount}
                onCommit={(amount) =>
                  dispatch({
                    type: 'UPDATE_EXTRA_INCOME',
                    monthKey: sheet.key,
                    id: extra.id,
                    field: 'amount',
                    value: amount,
                  })
                }
              />
              <SheetDayInput
                className="sheet-payday"
                value={extra.day ?? null}
                aria-label="Dia em que a entrada extra entra"
                onCommit={(day) =>
                  dispatch({
                    type: 'UPDATE_EXTRA_INCOME',
                    monthKey: sheet.key,
                    id: extra.id,
                    field: 'day',
                    value: day,
                  })
                }
              />
              <button
                type="button"
                className="sheet-extra-remove"
                title="Remover entrada extra"
                aria-label="Remover entrada extra"
                onClick={() =>
                  dispatch({
                    type: 'REMOVE_EXTRA_INCOME',
                    monthKey: sheet.key,
                    id: extra.id,
                  })
                }
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="sheet-extra-add"
            onClick={() => dispatch({ type: 'ADD_EXTRA_INCOME', monthKey: sheet.key })}
          >
            + Entrada
          </button>
        </div>
      </div>

      <SheetBlocksToolbar />

      <div className="sheet-groups">
        {(
          [
            {
              id: 'in',
              label: 'No saldo',
              items: sheet.categories.filter((c) => coreIds.includes(c.id)),
            },
            {
              id: 'out',
              label: 'Fora do saldo',
              items: sheet.categories.filter((c) => !coreIds.includes(c.id)),
            },
          ] as const
        ).map((group) =>
          group.items.length === 0 ? null : (
            <section
              key={group.id}
              className={`sheet-group ${group.id === 'in' ? 'in-saldo' : 'out-saldo'}`}
              aria-label={group.label}
            >
              <p className="sheet-group-label">{group.label}</p>
              <div className="sheet-grid">
                {group.items.map((cat, index) => (
                  <SheetCategoryTable
                    key={cat.id}
                    monthKey={sheet.key}
                    category={cat}
                    canMoveLeft={index > 0}
                    canMoveRight={index < group.items.length - 1}
                    canRemove={sheet.categories.length > 1}
                  />
                ))}
              </div>
            </section>
          ),
        )}
      </div>

      <div className="sheet-footer">
        <p>
          Blocos no saldo: <strong>{formatBRL(coreExpenses)}</strong>
        </p>
        <p className="sheet-footer-muted">
          Detalhes (fora do saldo): {formatBRL(detailExpenses)}
        </p>
        <p className="sheet-summary">
          Sobra do mês:{' '}
          <strong className={balance >= 0 ? 'positive' : 'negative'}>
            {formatBRL(balance)}
          </strong>
        </p>
      </div>

      <div className="sheet-tabs" role="tablist">
        <button
          type="button"
          className="sheet-tab add"
          onClick={() => dispatch({ type: 'ADD_PREV_SHEET_MONTH' })}
          title="Cria o mês anterior ao mais antigo, com os dados do mês atual"
        >
          + Mês anterior
        </button>
        {state.sheetMonths
          .slice()
          .sort((a, b) => a.key.localeCompare(b.key))
          .map((m) => (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={m.key === state.activeSheetMonthKey}
              className={`sheet-tab ${m.key === state.activeSheetMonthKey ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_SHEET_MONTH', key: m.key })}
            >
              {m.label}
            </button>
          ))}
        <button
          type="button"
          className="sheet-tab add"
          onClick={() => dispatch({ type: 'ADD_SHEET_MONTH' })}
          title="Cria o próximo mês com os dados do mês atual"
        >
          + Mês
        </button>
        {state.sheetMonths.length > 1 && (
          <button
            type="button"
            className="sheet-tab remove"
            onClick={() => setRemoveMonthOpen(true)}
            title="Excluir o mês ativo"
          >
            Remover mês
          </button>
        )}
      </div>
    </section>
  )
}

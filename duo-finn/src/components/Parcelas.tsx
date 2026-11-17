import { useRef, useState, type ChangeEvent } from 'react'
import { useFinance } from '../context/FinanceContext'
import type { InstallmentPurchase } from '../data/types'
import { currentMonthKey } from '../utils/overviewFromSheet'
import { agendaByMonth, installmentProgress, purchaseTotal } from '../utils/installments'
import {
  formatMoneyField,
  formatPurchaseTyping,
  newId,
  parseAmount,
  purchaseTypingCaret,
} from '../utils/format'
import { ConfirmDialog } from './planilha/ConfirmDialog'
import { MonthGridPicker } from './MonthPicker'
import './Parcelas.css'

function moneyField(value: number): string {
  return formatMoneyField(value)
}

const emptyDraft = (startKey: string) => ({
  id: '',
  label: '',
  purchaseAmount: '',
  count: '10',
  startKey,
  cardLabel: '',
})

export function Parcelas() {
  const { state, dispatch, formatBRL } = useFinance()
  const purchases = state.installmentPurchases ?? []
  const [draft, setDraft] = useState(() => emptyDraft(currentMonthKey()))
  const [removeId, setRemoveId] = useState<string | null>(null)
  const editing = purchases.find((item) => item.id === draft.id)
  const removeTarget = purchases.find((item) => item.id === removeId)
  const agenda = agendaByMonth(purchases)
  const todayKey = currentMonthKey()
  const amountRef = useRef<HTMLInputElement>(null)

  function onPurchaseAmount(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const caret = input.selectionStart ?? input.value.length
    const next = formatPurchaseTyping(input.value)
    const pos = purchaseTypingCaret(input.value, caret, next)
    setDraft({ ...draft, purchaseAmount: next })
    requestAnimationFrame(() => {
      amountRef.current?.setSelectionRange(pos, pos)
    })
  }

  function savePurchase() {
    const amount = parseAmount(draft.purchaseAmount)
    const count = Number(draft.count)
    if (!draft.label.trim() || !Number.isFinite(amount) || amount < 0) return
    if (!Number.isFinite(count) || count < 1 || count > 48) return
    const purchase: InstallmentPurchase = {
      id: draft.id || newId(),
      label: draft.label,
      purchaseAmount: amount,
      installmentAmount: 0,
      count,
      startKey: draft.startKey,
      cardLabel: draft.cardLabel,
    }
    dispatch({ type: 'SAVE_INSTALLMENT', purchase })
    setDraft(emptyDraft(draft.startKey))
  }

  function editPurchase(purchase: InstallmentPurchase) {
    setDraft({
      id: purchase.id,
      label: purchase.label,
      purchaseAmount: moneyField(purchaseTotal(purchase)),
      count: String(purchase.count),
      startKey: purchase.startKey,
      cardLabel: purchase.cardLabel,
    })
  }

  return (
    <section className="parcelas">
      <header className="parcelas-intro">
        <div>
          <h2>Parcelas</h2>
          <p>
            A compra fica aqui. O valor cheio do cartão continua o que você digita no bloco.
          </p>
        </div>
      </header>

      <form
        className="card parcelas-form"
        onSubmit={(event) => {
          event.preventDefault()
          savePurchase()
        }}
      >
        <label>
          Compra
          <input
            value={draft.label}
            onChange={(event) => setDraft({ ...draft, label: event.target.value })}
          />
        </label>
        <label>
          Valor da compra
          <input
            ref={amountRef}
            inputMode="decimal"
            value={draft.purchaseAmount}
            onChange={onPurchaseAmount}
            onBlur={(event) => {
              const amount = parseAmount(event.target.value)
              setDraft((current) => ({
                ...current,
                purchaseAmount: formatMoneyField(amount),
              }))
            }}
          />
        </label>
        <label>
          Quantidade
          <input
            inputMode="numeric"
            value={draft.count}
            onChange={(event) => setDraft({ ...draft, count: event.target.value })}
          />
        </label>
        <div className="parcelas-field">
          <span>Primeira parcela</span>
          <MonthGridPicker
            value={draft.startKey}
            onChange={(startKey) => setDraft({ ...draft, startKey })}
          />
        </div>
        <label>
          Cartão
          <input
            value={draft.cardLabel}
            onChange={(event) => setDraft({ ...draft, cardLabel: event.target.value })}
          />
        </label>
        <div className="parcelas-form-actions">
          {editing ? (
            <button type="button" className="parcelas-btn" onClick={() => setDraft(emptyDraft(draft.startKey))}>
              Cancelar
            </button>
          ) : null}
          <button type="submit" className="parcelas-btn primary">
            {editing ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </form>

      <div className="card parcelas-list">
        <p className="card-title">Compras</p>
        {purchases.length === 0 ? (
          <p className="parcelas-note">Nenhuma compra parcelada.</p>
        ) : (
          <ul>
            {purchases.map((purchase) => {
              const progress = installmentProgress(purchase)
              return (
                <li key={purchase.id}>
                  <div>
                    <strong>{purchase.label}</strong>
                    <p>
                      {purchase.count}x de {formatBRL(purchase.installmentAmount)}
                      {purchase.cardLabel ? ` · ${purchase.cardLabel}` : ''}
                    </p>
                    <p>
                      {progress.passed} já passaram · {progress.remaining} faltam · total{' '}
                      {formatBRL(progress.total)}
                    </p>
                  </div>
                  <div className="parcelas-remaining">
                    <span>Falta pagar</span>
                    <strong>{formatBRL(progress.remainingAmount)}</strong>
                  </div>
                  <div className="parcelas-row-actions">
                    <button type="button" className="parcelas-btn" onClick={() => editPurchase(purchase)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="parcelas-btn danger"
                      onClick={() => setRemoveId(purchase.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="parcelas-agenda">
        {agenda.length === 0 ? (
          <p className="parcelas-note">A agenda aparece quando houver uma compra.</p>
        ) : (
          agenda.map((month) => {
            const cardNames = [
              ...new Set(month.slots.map((slot) => slot.cardLabel.trim()).filter(Boolean)),
            ]
            return (
            <section
              key={month.key}
              className={`card parcelas-month${
                month.key === todayKey ? ' is-current' : month.key < todayKey ? ' is-past' : ''
              }`}
            >
              <header>
                <p>
                  {month.label}
                  {cardNames.length === 1 ? <em> · {cardNames[0]}</em> : null}
                </p>
                <strong>{formatBRL(month.total)}</strong>
              </header>
              <ul>
                {month.slots.map((slot) => (
                  <li key={`${slot.purchaseId}-${slot.number}`}>
                    <span>
                      {slot.label}{' '}
                      <em>
                        {slot.number}/{slot.count}
                        {cardNames.length === 1 || !slot.cardLabel ? '' : ` · ${slot.cardLabel}`}
                      </em>
                    </span>
                    <strong>{formatBRL(slot.amount)}</strong>
                  </li>
                ))}
              </ul>
            </section>
            )
          })
        )}
      </div>

      <ConfirmDialog
        open={removeId != null}
        title="Excluir compra"
        message={`Excluir "${removeTarget?.label ?? 'esta compra'}" e todas as parcelas dela? O valor do cartão na planilha não muda.`}
        confirmLabel="Excluir"
        danger
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return
          dispatch({ type: 'REMOVE_INSTALLMENT', id: removeId })
          if (draft.id === removeId) setDraft(emptyDraft(draft.startKey))
          setRemoveId(null)
        }}
      />
    </section>
  )
}

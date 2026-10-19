import { useEffect, useState } from 'react';
import { Modal } from '../ui/Overlay';
import { Button } from '../ui/Button';
import { Field, Input, Textarea } from '../ui/Field';
import { formatPrice } from '../../lib/format';

/**
 * Closing a deal needs one more fact: the final value (won) or the reason (lost).
 * Shared by the lead drawer and the pipeline board.
 */
export function StageDialog({ lead, stage, onCancel, onConfirm, pending }) {
  const [dealValue, setDealValue] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!stage) return;
    setDealValue(lead?.dealValue ? String(lead.dealValue) : lead?.property?.price ? String(lead.property.price) : '');
    setLostReason('');
    setError('');
  }, [stage, lead]);

  const won = stage === 'won';
  const submit = (e) => {
    e.preventDefault();
    if (won && !(Number(dealValue) > 0)) return setError('Enter the final deal value');
    if (!won && lostReason.trim().length < 2) return setError('Add a short reason so the team can learn from it');
    onConfirm(won ? { stage, dealValue: Number(dealValue) } : { stage, lostReason: lostReason.trim() });
  };

  return (
    <Modal
      open={Boolean(stage)}
      onClose={onCancel}
      title={won ? 'Mark as won' : 'Mark as lost'}
      description={lead ? `${lead.name}${lead.property?.title ? ` · ${lead.property.title}` : ''}` : undefined}
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        {won ? (
          <Field label="Final deal value (USD)" error={error} hint={lead?.property?.price ? `Listed at ${formatPrice(lead.property.price)}` : undefined}>
            {(a11y) => <Input {...a11y} type="number" min="1" inputMode="numeric" value={dealValue} onChange={(e) => setDealValue(e.target.value)} data-autofocus />}
          </Field>
        ) : (
          <Field label="Why was it lost?" error={error}>
            {(a11y) => <Textarea {...a11y} rows={3} value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder="For example: chose another property" data-autofocus />}
          </Field>
        )}
        {won && <p className="text-sm text-slate-500">The buyer gets a customer profile with this deal, and the property is marked as sold or rented.</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant={won ? 'dark' : 'danger'} loading={pending}>
            {won ? 'Mark as won' : 'Mark as lost'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

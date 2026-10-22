import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'motion/react';
import { CircleCheck } from '../ui/icons';
import { useSession } from '../../auth/AuthContext';
import { useSendInquiry } from '../../hooks/usePublic';
import { Button } from '../ui/Button';
import { Field, Input, Textarea, TextField } from '../ui/Field';
import { Segmented } from './Filters';
import { ease, spring } from '../../lib/motion';

// Same rules as the API's inquiryBody schema, so most errors show before a round trip
const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email: z.string().trim().email('Enter a valid email'),
  phone: z
    .string()
    .trim()
    .regex(/^$|^[+\d][\d\s().-]{6,19}$/, 'Enter a valid phone number'),
  intent: z.enum(['buy', 'rent', 'visit', 'general']),
  preferredDate: z.string().optional(),
  message: z.string().trim().max(2000, 'Keep it under 2,000 characters').optional(),
  website: z.string().max(0).optional(), // honeypot
});

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Inquiry form used on property pages (with `property`) and the contact page.
 * Prefills from the signed-in account; server-side field errors are mapped
 * back onto the matching inputs.
 */
export function InquiryForm({ property, agentName, defaultIntent, compact = false }) {
  const { me } = useSession();
  const send = useSendInquiry();
  const intentDefault = defaultIntent ?? (property ? (property.purpose === 'rent' ? 'rent' : 'visit') : 'general');

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      intent: intentDefault,
      preferredDate: '',
      message: property ? `I'm interested in ${property.title}. Is it still available?` : '',
      website: '',
    },
  });

  useEffect(() => {
    if (me) reset((v) => ({ ...v, name: v.name || me.name, email: v.email || me.email, phone: v.phone || me.phone || '' }));
  }, [me, reset]);

  const intent = watch('intent');

  const onSubmit = (values) =>
    send.mutate(
      {
        ...values,
        property: property?._id,
        preferredDate: values.preferredDate || undefined,
        phone: values.phone || undefined,
        message: values.message || undefined,
      },
      {
        onError: (err) => {
          for (const [field, messages] of Object.entries(err.details ?? {})) setError(field, { message: messages[0] });
        },
      },
    );

  return (
    <AnimatePresence mode="wait" initial={false}>
      {send.isSuccess ? (
        <motion.div
          key="done"
          className="flex flex-col items-center py-10 text-center"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: ease.out }}
          role="status"
        >
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring.ui, delay: 0.1 }}>
            <CircleCheck className="size-12 text-success" strokeWidth={1.25} />
          </motion.span>
          <h3 className="mt-4 font-display text-h3">Inquiry sent</h3>
          <p className="mt-2 max-w-xs text-sm text-slate-500">
            {agentName ? `${agentName.split(' ')[0]} will` : 'An agent will'} get back to you within one working day, usually much sooner.
          </p>
          <Button variant="secondary" size="sm" className="mt-6" onClick={() => send.reset()}>
            Send another message
          </Button>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4" exit={{ opacity: 0 }}>
          <Controller
            control={control}
            name="intent"
            render={({ field }) => (
              <Segmented
                label="I would like to"
                value={field.value}
                onChange={field.onChange}
                options={
                  property
                    ? [
                        { value: property.purpose === 'rent' ? 'rent' : 'buy', label: property.purpose === 'rent' ? 'Rent' : 'Buy' },
                        { value: 'visit', label: 'Visit' },
                        { value: 'general', label: 'Ask' },
                      ]
                    : [
                        { value: 'buy', label: 'Buy' },
                        { value: 'rent', label: 'Rent' },
                        { value: 'general', label: 'Something else' },
                      ]
                }
              />
            )}
          />
          <div className={compact ? 'flex flex-col gap-4' : 'grid gap-4 sm:grid-cols-2'}>
            <TextField label="Full name" autoComplete="name" required error={errors.name?.message} {...register('name')} />
            <TextField label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
          </div>
          <div className={compact ? 'flex flex-col gap-4' : 'grid gap-4 sm:grid-cols-2'}>
            <TextField label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
            <AnimatePresence initial={false}>
              {intent === 'visit' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: ease.out }}>
                  <Field label="Preferred date">{(a11y) => <Input type="date" min={today()} {...a11y} {...register('preferredDate')} />}</Field>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Field label="Message" error={errors.message?.message}>
            {(a11y) => <Textarea rows={compact ? 3 : 4} {...a11y} {...register('message')} />}
          </Field>
          {/* Honeypot: hidden from people and screen readers, bots fill it in */}
          <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden {...register('website')} />

          {send.isError && !send.error.details && (
            <p className="text-sm text-danger" role="alert">
              {send.error.message}
            </p>
          )}
          <Button type="submit" variant="dark" size="lg" loading={send.isPending} className="w-full">
            Send inquiry
          </Button>
          <p className="text-center text-xs text-slate-500">We only use your details to reply to this inquiry.</p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPrice, humanize } from '../../lib/format';
import { LEAD_SOURCES, labelOf } from '../../lib/constants';

/*
 * Chart rules (dataviz skill + DESIGN.md):
 *  - identity comes from axis labels, so every chart is one hue: navy (>10:1 on white)
 *  - thin bars, 4px rounded data-ends, recessive horizontal grid, no dual axes
 *  - hover tooltip on every mark; values in text ink, never series colour
 *  - a visually hidden table mirrors each chart for screen readers
 */
const INK = '#0c1a3b';
const BAR = '#1e2e57';
const MUTED = '#8a92a3';
const GRID = '#e3e5ea';
const axis = { tick: { fill: MUTED, fontSize: 12 }, tickLine: false, axisLine: false };

function ChartTooltip({ active, payload, label, format }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] border border-line bg-paper px-3 py-2 text-sm shadow-float">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold tabular text-navy-900">{format(payload[0].value, payload[0].payload)}</p>
    </div>
  );
}

function SrTable({ caption, rows, columns }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>{columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r[0]}>{r.map((v, i) => <td key={i}>{v}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

const monthLabel = (ym) => new Date(`${ym}-01T00:00:00`).toLocaleString('en', { month: 'short' });

export function SalesChart({ data }) {
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.month) }));
  const last = rows.length - 1;
  return (
    <>
      <div className="h-64" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 24, right: 4, left: 4, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" {...axis} />
            <YAxis {...axis} width={56} tickFormatter={(v) => formatPrice(v, { compact: true })} />
            <Tooltip
              cursor={{ fill: '#f2f3f5' }}
              content={<ChartTooltip format={(v, p) => `${formatPrice(v)} · ${p.count} ${p.count === 1 ? 'deal' : 'deals'}`} />}
            />
            <Bar dataKey="value" fill={BAR} radius={[4, 4, 0, 0]} maxBarSize={36}>
              {/* Selective direct label: only the current month */}
              <LabelList
                dataKey="value"
                position="top"
                content={({ x, y, width, value, index }) =>
                  index === last && value > 0 ? (
                    <text x={x + width / 2} y={y - 8} textAnchor="middle" fill={INK} fontSize={12} fontWeight={600}>
                      {formatPrice(value, { compact: true })}
                    </text>
                  ) : null
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <SrTable caption="Closed sales value by month" columns={['Month', 'Sales value', 'Deals']} rows={rows.map((r) => [r.month, formatPrice(r.value), r.count])} />
    </>
  );
}

/** Horizontal bars: category names on the axis carry identity, so one colour is enough. */
export function HorizontalBars({ data, caption, valueLabel = 'Count', formatValue = (v) => v, height }) {
  return (
    <>
      <div style={{ height: height ?? Math.max(160, data.length * 40) }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap="30%">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="label" {...axis} tick={{ fill: '#5d6678', fontSize: 13 }} width={96} />
            <Tooltip cursor={{ fill: '#f2f3f5' }} content={<ChartTooltip format={(v) => `${formatValue(v)} ${valueLabel.toLowerCase()}`} />} />
            <Bar dataKey="value" fill={BAR} radius={[0, 4, 4, 0]} maxBarSize={18}>
              <LabelList dataKey="value" position="right" fill={INK} fontSize={12} fontWeight={600} formatter={formatValue} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <SrTable caption={caption} columns={['Category', valueLabel]} rows={data.map((d) => [d.label, formatValue(d.value)])} />
    </>
  );
}

export const sourceRows = (sources) => sources.map((s) => ({ label: labelOf(LEAD_SOURCES, s.source), value: s.count }));
export const stageRows = (pipeline) => pipeline.map((p) => ({ label: humanize(p.stage), value: p.count }));

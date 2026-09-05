'use client'

import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Shared colors (amber/orange family + slate fallbacks)                     */
/* -------------------------------------------------------------------------- */

const PALETTE = [
  '#f59e0b', // amber-500
  '#f97316', // orange-500
  '#fb923c', // orange-400
  '#fcd34d', // amber-300
  '#fbbf24', // amber-400
  '#ea580c', // orange-600
  '#fdba74', // orange-300
  '#fde68a', // amber-200
  '#94a3b8', // slate-400
  '#64748b', // slate-500
]

/* -------------------------------------------------------------------------- */
/*  Monthly articles published chart (AreaChart, 12 months)                   */
/* -------------------------------------------------------------------------- */

export interface MonthlyPoint {
  month: string
  count: number
}

interface MonthlyArticlesChartProps {
  data: MonthlyPoint[]
  className?: string
}

export function MonthlyArticlesChart({
  data,
  className,
}: MonthlyArticlesChartProps) {
  const hasData = data.some((d) => d.count > 0)

  return (
    <div className={cn('h-64 w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="monthlyAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'currentColor' }}
            stroke="currentColor"
            strokeOpacity={0.2}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: 'currentColor' }}
            stroke="currentColor"
            strokeOpacity={0.2}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ stroke: '#f59e0b', strokeOpacity: 0.3 }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              boxShadow: '0 6px 18px -6px rgba(0,0,0,0.2)',
            }}
            labelStyle={{ color: 'var(--muted-foreground)', fontWeight: 500 }}
            formatter={(value: number) => [`${value} artikel`, 'Dipublikasi']}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Dipublikasi"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#monthlyAreaFill)"
            dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      {!hasData && (
        <div className="pointer-events-none -mt-64 flex h-64 items-center justify-center">
          <p className="text-xs text-muted-foreground">
            Belum ada artikel yang dipublikasi dalam 12 bulan terakhir.
          </p>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Views per category (PieChart / Donut)                                     */
/* -------------------------------------------------------------------------- */

export interface CategorySlice {
  name: string
  views: number
}

interface CategoryViewsPieProps {
  data: CategorySlice[]
  className?: string
}

export function CategoryViewsPie({ data, className }: CategoryViewsPieProps) {
  const total = data.reduce((sum, d) => sum + d.views, 0)
  const hasData = total > 0

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={hasData ? data : [{ name: 'Tanpa data', views: 1 }]}
              dataKey="views"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={2}
              stroke="var(--background)"
              strokeWidth={2}
            >
              {(hasData ? data : [{ name: 'Tanpa data', views: 1 }]).map(
                (entry, i) => (
                  <Cell
                    key={entry.name + i}
                    fill={hasData ? PALETTE[i % PALETTE.length] : '#cbd5e1'}
                  />
                ),
              )}
            </Pie>
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
                boxShadow: '0 6px 18px -6px rgba(0,0,0,0.2)',
              }}
              formatter={(value: number, _name, entry) => {
                const name = (entry?.payload as { name?: string })?.name ?? ''
                const pct = total > 0 ? Math.round((value / total) * 100) : 0
                return [`${value.toLocaleString('id-ID')} views (${pct}%)`, name]
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Donut center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-foreground">
            {total.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-muted-foreground">Total views</span>
        </div>
      </div>

      {/* Legend (custom, lebih compact) */}
      <ul className="grid w-full grid-cols-1 gap-1.5 sm:grid-cols-2">
        {(hasData ? data : []).map((slice, i) => (
          <li
            key={slice.name}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: PALETTE[i % PALETTE.length] }}
                aria-hidden
              />
              <span className="truncate text-muted-foreground">{slice.name}</span>
            </span>
            <span className="font-medium text-foreground tabular-nums">
              {slice.views.toLocaleString('id-ID')}
            </span>
          </li>
        ))}
        {!hasData && (
          <li className="text-xs text-muted-foreground">Belum ada data views.</li>
        )}
      </ul>
    </div>
  )
}

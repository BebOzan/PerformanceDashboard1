import { useEffect, useMemo, useRef, useState } from "react"
import {
  AuditLog,
  BusinessUnit,
  DashboardData,
  LEAF_IDS,
  RevenueSnapshot,
  calculateMetrics,
  copyPipelineRecordsForDate,
  copyRecoveryActionsForDate,
  formatAmount,
  formatDate,
  formatIdAmount,
  formatIdPercent,
  formatPercent,
  formatSigned,
  initialData,
  loadData,
  loadDataUpdatedAt,
  normalizeData,
  persistData,
} from "./data"
import { loadCloudData, saveCloudData } from "./cloudData"
import OperationalRecovery from "./OperationalRecovery"
import {
  BaseComponentEditor,
  OperationalRevenueEditor,
  PipelineEditor,
  RecoveryActionsEditor,
} from "./OperationalEditors"

type Page = "executive-overview" | "operational-recovery"
const PAGES: [Page, string][] = [
  ["executive-overview", "Executive Overview"],
  ["operational-recovery", "Operational Recovery"],
]
const pageFromHash = (): Page =>
  window.location.hash.includes("operational-recovery")
    ? "operational-recovery"
    : "executive-overview"

type IconName = "settings" | "refresh" | "calendar" | "download" | "expand" | "arrow-left" | "save" | "upload" | "print" | "database" | "trend-up" | "trend-down" | "check" | "plus" | "x" | "bars" | "tri-up" | "tri-down" | "target" | "file" | "bulb" | "tower" | "bolt" | "users"

const iconPaths: Record<IconName, React.ReactNode> = {
  settings: (
    <>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.1h-4v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3v-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 6v5h-5" />
      <path d="M18.5 15a7 7 0 1 1-.4-6.4L20 11" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" />
    </>
  ),
  expand: (
    <>
      <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
    </>
  ),
  "arrow-left": (
    <>
      <path d="m15 18-6-6 6-6M9 12h12" />
    </>
  ),
  save: (
    <>
      <path d="M5 3h12l3 3v15H4V3h1Z" />
      <path d="M8 3v6h8V3M8 21v-7h8v7" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4m0 0L8 8m4-4 4 4M4 20h16" />
    </>
  ),
  print: (
    <>
      <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v7H6z" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" />
    </>
  ),
  "trend-up": (
    <>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  "trend-down": (
    <>
      <path d="m3 7 6 6 4-4 8 8" />
      <path d="M15 17h6v-6" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  bars: <path d="M5 20V13M10 20V8M15 20v-9M20 20V4" strokeWidth="3" />,
  "tri-up": <path d="M12 5 21 19H3Z" fill="currentColor" />,
  "tri-down": <path d="M12 19 3 5h18Z" fill="currentColor" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="m12 12 8-8M17 4h3v3" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8l4 4v14H6Z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
    </>
  ),
  tower: <path d="M12 3v2M9 21l3-16 3 16M10 13h4M9.5 17h5M6 6a8 8 0 0 0 0 6M18 6a8 8 0 0 1 0 6" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7Z" fill="currentColor" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
    </>
  ),
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  )
}

function Button({
  children,
  variant = "secondary",
  icon,
  onClick,
  type = "button",
  disabled,
  className = "",
  labelClassName = "",
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger"
  icon?: IconName
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
  labelClassName?: string
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`button button-${variant} ${className}`}
    >
      {icon && <Icon name={icon} size={16} />}
      <span className={labelClassName}>{children}</span>
    </button>
  )
}

function Select({
  value,
  onChange,
  children,
  ariaLabel,
  className = "",
}: {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  ariaLabel: string
  className?: string
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`field select-field ${className}`}
    >
      {children}
    </select>
  )
}

function Input({
  value,
  onChange,
  type = "text",
  disabled,
  placeholder,
  className = "",
  min,
}: {
  value: string | number
  onChange: (value: string) => void
  type?: string
  disabled?: boolean
  placeholder?: string
  className?: string
  min?: string
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      type={type}
      disabled={disabled}
      placeholder={placeholder}
      className={`field ${className}`}
      min={min}
    />
  )
}

function DateSelector({
  value,
  dates,
  onChange,
  className = "",
}: {
  value: string
  dates: string[]
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <Select
      value={value}
      onChange={onChange}
      ariaLabel="Pilih tanggal pelaporan"
      className={className}
    >
      {dates.map((date) => (
        <option key={date} value={date}>
          {formatDate(date)}
        </option>
      ))}
    </Select>
  )
}

function RevenueInput({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <Input
      type="number"
      min="0"
      value={value}
      onChange={(next) => onChange(Number(next))}
      disabled={disabled}
      className="number-input"
    />
  )
}

function SectionTitle({
  eyebrow,
  title,
  action,
  icon,
}: {
  icon?: IconName
  eyebrow?: string
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="section-title">
      <h2 aria-label={eyebrow ? `${eyebrow} — ${title}` : undefined}>
        {icon && <Icon name={icon} size={24} />}
        {title}
      </h2>
      {action}
    </div>
  )
}

function StatusIndicator({ value, label }: { value: number; label?: string }) {
  const positive = value >= 0
  return (
    <span className={`status ${positive ? "positive" : "negative"}`}>
      <Icon name={positive ? "trend-up" : "trend-down"} size={16} />
      {label || `${positive ? "+" : "−"}${formatPercent(Math.abs(value))}`}
    </span>
  )
}

const shortDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  })

function DashboardHeader({
  data,
  dates,
  selectedDate,
  presenting,
  onDate,
  onEditor,
  onRefresh,
  onPrint,
  onExport,
  onPresent,
  page,
  onPage,
}: {
  page: Page
  onPage: (page: Page) => void
  data: DashboardData
  dates: string[]
  selectedDate: string
  presenting: boolean
  onDate: (date: string) => void
  onEditor: () => void
  onRefresh: () => void
  onPrint: () => void
  onExport: () => void
  onPresent: () => void
}) {
  return (
    <header className="dashboard-header">
      {data.dashboard_settings.logo_asset_url && (
        <div className="brand-lockup">
          <img
            src={data.dashboard_settings.logo_asset_url}
            alt="Logo MITRATEL"
            className="brand-logo-image"
          />
        </div>
      )}
      <div className="report-heading">
        <h1 title={data.dashboard_settings.report_title}>
          {data.dashboard_settings.report_title}
        </h1>
        <p>
          <span className="live-dot"></span>
          {page === "operational-recovery" && (
            <>
              Operational Progress &amp; Recovery Action
              <b>•</b>
            </>
          )}
          Posisi {formatDate(selectedDate)}
          <b>•</b>
          {data.dashboard_settings.currency_unit}
        </p>
      </div>
      <nav className="page-nav" aria-label="Halaman dashboard">
        {PAGES.map(([key, label]) => (
          <a
            key={key}
            href={`#/${key}`}
            className={page === key ? "active" : ""}
            aria-current={page === key ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault()
              onPage(key)
            }}
          >
            {label}
          </a>
        ))}
      </nav>
      <div className="header-visual" aria-hidden="true"></div>
      <div className="header-actions">
        <div className="header-actions-row">
          <div className="mode-badge">
            <Icon name="database" size={15} /> Local Data
          </div>
          <DateSelector
            value={selectedDate}
            onChange={onDate}
            dates={dates}
            className="date-select"
          />
        </div>
        <div className="header-actions-row">
          {!presenting && (
            <>
              <button
                className="icon-button"
                onClick={onRefresh}
                title="Muat ulang data"
              >
                <Icon name="refresh" />
              </button>
              <button
                className="icon-button"
                onClick={onExport}
                title="Ekspor dashboard ke PNG"
              >
                <Icon name="download" />
              </button>
              <button
                className="icon-button"
                onClick={onPrint}
                title="Cetak dashboard"
              >
                <Icon name="print" />
              </button>
            </>
          )}
          <button
            className={`icon-button ${presenting ? "with-label" : ""}`}
            onClick={onPresent}
            title={presenting ? "Keluar mode presentasi" : "Mode presentasi"}
          >
            <Icon name={presenting ? "x" : "expand"} />
            {presenting && <span>Keluar Presentasi</span>}
          </button>
          {!presenting && (
            <button className="manage-button" onClick={onEditor}>
              <Icon name="settings" size={17} /> Kelola Data
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function KPICard({
  label,
  value,
  subtitle,
  variance,
  tone = "blue",
  hero = false,
  icon,
}: {
  label: string
  value: number
  subtitle: string
  variance?: number
  tone?: "blue" | "red" | "green"
  hero?: boolean
  icon?: IconName
}) {
  return (
    <article className={`kpi-card tone-${tone} ${hero ? "hero-kpi" : ""}`}>
      <div className="kpi-tile">
        <Icon name={icon || (hero ? "bars" : value < 0 ? "tri-down" : "tri-up")} size={34} />
      </div>
      <div className="kpi-body">
        <span className="kpi-label">{label}</span>
        <strong className="kpi-value">{formatAmount(hero ? value : Math.abs(value))}</strong>
        {variance !== undefined ? (
          <span className="kpi-variance">
            ({variance >= 0 ? "+" : "−"}
            {formatPercent(Math.abs(variance))})
          </span>
        ) : null}
        <span className="kpi-subtitle">{subtitle}</span>
      </div>
      <svg className="kpi-deco" viewBox="0 0 160 90" preserveAspectRatio="none" aria-hidden="true">
        <path className="kpi-wave" d="M0 70 C30 52 52 78 84 60 S130 40 160 46 V90 H0 Z" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={88 + i * 18} y={56 - i * 14} width="11" height={34 + i * 14} rx="2" />
        ))}
      </svg>
    </article>
  )
}

function RevenueBenchmarkChart({
  metrics,
  selectedDate,
}: {
  metrics: ReturnType<typeof calculateMetrics>
  selectedDate: string
}) {
  const prev = shortDate(metrics.previousDate)
  const latest = shortDate(selectedDate)
  const hasPreviousDate = metrics.previousDate < selectedDate
  // The earliest reporting date has no prior snapshot, so it starts directly from RADIR.
  const steps = hasPreviousDate
    ? [
        { kind: "full", label: "RADIR", value: metrics.radir, tone: "radir" },
        { kind: "step", from: metrics.radir, to: metrics.previous, good: metrics.previous >= metrics.radir },
        { kind: "full", label: prev, value: metrics.previous, tone: "prev" },
        { kind: "step", from: metrics.previous, to: metrics.actual, good: metrics.growth >= 0 },
        { kind: "full", label: latest, value: metrics.actual, tone: "latest" },
        { kind: "step", from: metrics.actual, to: metrics.rkap, good: metrics.gapRkap >= 0 },
        { kind: "full", label: "RKAP", value: metrics.rkap, tone: "rkap" },
      ] as const
    : [
        { kind: "full", label: "RADIR", value: metrics.radir, tone: "radir" },
        { kind: "step", from: metrics.radir, to: metrics.actual, good: metrics.actual >= metrics.radir },
        { kind: "full", label: latest, value: metrics.actual, tone: "latest" },
        { kind: "step", from: metrics.actual, to: metrics.rkap, good: metrics.gapRkap >= 0 },
        { kind: "full", label: "RKAP", value: metrics.rkap, tone: "rkap" },
      ] as const
  const values = hasPreviousDate
    ? [metrics.radir, metrics.previous, metrics.actual, metrics.rkap]
    : [metrics.radir, metrics.actual, metrics.rkap]
  const high = Math.max(...values)
  const low = Math.min(...values)
  const spread = Math.max(high - low, 1000)
  // Truncated baseline so the bridging deltas stay legible
  const min = low - spread * 1.6
  const max = high + spread * 0.32
  const y = (value: number) => ((value - min) / (max - min)) * 100
  const widths = steps.map((step) => (step.kind === "full" ? 3 : 2))
  const totalWidth = widths.reduce((sum, w) => sum + w, 0)
  const centers = widths.map(
    (w, i) => ((widths.slice(0, i).reduce((s, v) => s + v, 0) + w / 2) / totalWidth) * 100,
  )
  const levels = hasPreviousDate
    ? [metrics.radir, metrics.previous, metrics.previous, metrics.actual, metrics.actual, metrics.rkap]
    : [metrics.radir, metrics.actual, metrics.actual, metrics.rkap]

  return (
    <section className="panel chart-panel">
      <SectionTitle
        icon="bars"
        title="Pergerakan OL Revenue YTD"
        action={<span className="scale-note">(dalam juta Rupiah · sumbu dipotong)</span>}
      />
      <div className="wf-plot">
        <div className="wf-bars" style={{ gridTemplateColumns: widths.map((w) => `${w}fr`).join(" ") }}>
          <svg className="wf-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {levels.map((level, i) => (
              <line key={i} x1={centers[i]} x2={centers[i + 1]} y1={100 - y(level)} y2={100 - y(level)} />
            ))}
          </svg>
          {steps.map((step, i) => {
            if (step.kind === "full")
              return (
                <div className={`wf-col wf-${step.tone}`} key={i}>
                  <span className="wf-bar" style={{ height: `${y(step.value)}%` }}>
                    <b>{formatAmount(step.value)}</b>
                  </span>
                </div>
              )
            const top = Math.max(step.from, step.to)
            const bottom = Math.min(step.from, step.to)
            const delta = step.to - step.from
            return (
              <div className={`wf-col wf-step ${step.good ? "good" : "bad"}`} key={i}>
                <span
                  className={`wf-float ${delta >= 0 ? "up" : "down"}`}
                  style={{ bottom: `${y(bottom)}%`, height: `max(6px, ${y(top) - y(bottom)}%)` }}
                  title={`${formatSigned(delta)} juta Rupiah`}
                >
                  <b>{formatAmount(Math.abs(delta))}</b>
                </span>
              </div>
            )
          })}
        </div>
        <div className="wf-axis" style={{ gridTemplateColumns: widths.map((w) => `${w}fr`).join(" ") }}>
          {steps.map((step, i) => (
            <span key={i}>{step.kind === "full" ? step.label : ""}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

const UNIT_META: Record<string, { icon: IconName; note?: string }> = {
  "bu-msa": { icon: "tower" },
  "bu-power": { icon: "bolt" },
  "bu-diropbang": { icon: "settings", note: "Managed Service" },
  "bu-diraset": { icon: "file", note: "Project Solution" },
  "bu-ditbis": { icon: "users", note: "MSA + Power Service" },
}

function DeltaMark({ value }: { value: number }) {
  const kind = value > 0 ? "up" : value < 0 ? "down" : "flat"
  return (
    <span className={`delta-mark ${kind}`}>
      <i aria-hidden="true" />
      {value === 0 ? "0" : formatAmount(Math.abs(value))}
    </span>
  )
}

function BusinessUnitPerformance({
  data,
  selectedDate,
  previousDate,
  actualFor,
}: {
  data: DashboardData
  selectedDate: string
  previousDate: string
  actualFor: (date: string, unitId?: string) => number
}) {
  const unit = (id: string) => data.business_units.find((item) => item.id === id)
  const rows = ["bu-ditbis", "bu-msa", "bu-power", "bu-diropbang", "bu-diraset"]
    .map(unit)
    .filter(Boolean) as BusinessUnit[]
  const valueFor = (id: string, date: string) =>
    id === "bu-ditbis"
      ? actualFor(date, "bu-msa") + actualFor(date, "bu-power")
      : actualFor(date, id)
  const total = actualFor(selectedDate)

  return (
    <section className="panel performance-panel">
      <SectionTitle
        icon="users"
        title="Kinerja per Business Unit"
        action={<span className="scale-note">Realisasi YTD · dalam juta Rupiah</span>}
      />
      <div className="performance-head">
        <span>Business Unit</span>
        <span>Realisasi</span>
        <span>vs {shortDate(previousDate)}</span>
      </div>
      <div className="performance-list">
        {rows.map((item) => {
          const value = valueFor(item.id, selectedDate)
          const delta = value - valueFor(item.id, previousDate)
          const share = total ? (value / total) * 100 : 0
          const meta = UNIT_META[item.id] || { icon: "database" }
          return (
            <div className={`performance-row ${item.id === "bu-ditbis" ? "level-subtotal" : item.parent_id === "bu-ditbis" ? "level-child" : ""}`} key={item.id}>
              <span className="unit-icon">
                <Icon name={meta.icon} size={20} />
              </span>
              <div className="unit-info">
                <strong>{item.name}</strong>
                {meta.note && <small>({meta.note})</small>}
              </div>
              <div className="bar-wrap" title={`${share.toFixed(1)}% dari total`}>
                <span style={{ width: `${Math.max(1.5, share)}%` }}></span>
              </div>
              <strong className="unit-value">{formatAmount(value)}</strong>
              <DeltaMark value={delta} />
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Gauge({
  label,
  percentage,
  amount,
  caption,
  attainment,
}: {
  label: string
  percentage: number
  amount: number
  caption: string
  attainment?: number
}) {
  const radius = 50
  const circumference = 2 * Math.PI * radius
  // Ring spans ±1% so small daily movements remain visible
  const visual = Math.max(2, Math.min(100, Math.abs(percentage) * 100))
  const tone = amount >= 0 ? "green" : "red"
  return (
    <div className={`gauge-item gauge-${tone}`}>
      <span className="gauge-label">{label}</span>
      <div className="gauge" title={attainment ? `Capaian ${formatPercent(attainment)}` : undefined}>
        <svg viewBox="0 0 128 128" aria-hidden="true">
          <circle cx="64" cy="64" r={radius} className="gauge-track" />
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="gauge-progress"
            strokeDasharray={`${(visual / 100) * circumference} ${circumference}`}
          />
        </svg>
        <strong>
          {percentage >= 0 ? "+" : "−"}
          {formatPercent(Math.abs(percentage))}
        </strong>
      </div>
      <div className="gauge-pill">
        <strong>{formatAmount(Math.abs(amount))}</strong>
        <span>{caption}</span>
      </div>
    </div>
  )
}

function TargetAttainment({
  metrics,
}: {
  metrics: ReturnType<typeof calculateMetrics>
  selectedDate: string
}) {
  const prev = shortDate(metrics.previousDate)
  return (
    <section className="panel attainment-panel">
      <SectionTitle icon="target" title="Pencapaian Target" />
      <div className="gauges">
        <Gauge
          label="vs RADIR"
          percentage={metrics.gapRadirPercent}
          amount={metrics.gapRadir}
          attainment={metrics.radirAttainment}
          caption={metrics.gapRadir >= 0 ? "di atas RADIR" : "di bawah RADIR"}
        />
        <Gauge
          label="vs RKAP"
          percentage={metrics.gapRkapPercent}
          amount={metrics.gapRkap}
          attainment={metrics.rkapAttainment}
          caption={metrics.gapRkap >= 0 ? "di atas RKAP" : "di bawah RKAP"}
        />
        <Gauge
          label={`Growth vs ${prev}`}
          percentage={metrics.growthPercent}
          amount={metrics.growth}
          caption={metrics.growth >= 0 ? "pertumbuhan" : "koreksi"}
        />
      </div>
    </section>
  )
}

function RevenueDetailTable({
  data,
  selectedDate,
  metrics,
}: {
  data: DashboardData
  selectedDate: string
  metrics: ReturnType<typeof calculateMetrics>
}) {
  const units = data.business_units
    .filter((unit) => unit.active)
    .sort((a, b) => a.display_order - b.display_order)
  // DITBIS subtotal leads, with MSA and Power Service nested beneath it
  const ditbisIndex = units.findIndex((unit) => unit.id === "bu-ditbis")
  if (ditbisIndex > 0) {
    const [ditbis] = units.splice(ditbisIndex, 1)
    const firstChild = units.findIndex((unit) => unit.parent_id === "bu-ditbis")
    units.splice(firstChild >= 0 ? firstChild : ditbisIndex, 0, ditbis)
  }
  const subtotalValue = (date: string) =>
    metrics.actualFor(date, "bu-msa") + metrics.actualFor(date, "bu-power")
  const rowValue = (unit: BusinessUnit, date: string) =>
    unit.id === "bu-ditbis"
      ? subtotalValue(date)
      : unit.id === "bu-total"
        ? metrics.actualFor(date)
        : metrics.actualFor(date, unit.id)
  const rowTarget = (unit: BusinessUnit) =>
    unit.id === "bu-ditbis"
      ? metrics.targetFor("RADIR", "bu-msa") +
        metrics.targetFor("RADIR", "bu-power")
      : unit.id === "bu-total"
        ? metrics.radir
        : metrics.targetFor("RADIR", unit.id)

  return (
    <section className="panel detail-panel">
      <SectionTitle
        icon="file"
        title="Detail Revenue per Direktorat"
        action={<span className="scale-note">(dalam juta Rupiah)</span>}
      />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Direktorat</th>
              <th>RADIR</th>
              <th>{shortDate(metrics.previousDate)}</th>
              <th>{shortDate(selectedDate)}</th>
              <th>Delta</th>
              <th>% Change</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => {
              const current = rowValue(unit, selectedDate)
              const previous = rowValue(unit, metrics.previousDate)
              const delta = current - previous
              const pct = previous ? (delta / previous) * 100 : 0
              const note = UNIT_META[unit.id]?.note
              return (
                <tr
                  key={unit.id}
                  className={
                    unit.id === "bu-total"
                      ? "total-table-row"
                      : unit.is_subtotal
                        ? "subtotal-table-row"
                        : unit.parent_id === "bu-ditbis"
                          ? "child-table-row"
                          : ""
                  }
                >
                  <td>
                    <strong>{unit.id === "bu-total" ? "Total OL Revenue" : unit.name}</strong>
                    {note && unit.id !== "bu-ditbis" && <small>({note})</small>}
                  </td>
                  <td>{formatAmount(rowTarget(unit))}</td>
                  <td>{formatAmount(previous)}</td>
                  <td className="current-cell">{formatAmount(current)}</td>
                  <td>
                    <DeltaMark value={delta} />
                  </td>
                  <td className={pct > 0 ? "text-positive" : pct < 0 ? "text-negative" : "text-flat"}>
                    {pct >= 0 ? "" : "−"}
                    {formatPercent(Math.abs(pct))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ExecutiveInsights({
  data,
  metrics,
  selectedDate,
}: {
  data: DashboardData
  metrics: ReturnType<typeof calculateMetrics>
  selectedDate: string
}) {
  const recovery = data.recovery_actions.find(
    (action) =>
      action.reporting_date === selectedDate &&
      action.action_status !== "Done",
  )
  const prev = shortDate(metrics.previousDate)
  const insights: { tone: string; icon: IconName; text: React.ReactNode }[] = [
    {
      tone: metrics.gapRadir >= 0 ? "green" : "red",
      icon: "bars",
      text: (
        <>
          Realisasi {metrics.gapRadir >= 0 ? "melampaui" : "masih di bawah"} RADIR sebesar{" "}
          <b>{formatAmount(Math.abs(metrics.gapRadir))}</b>.
        </>
      ),
    },
    {
      tone: metrics.gapRkap >= 0 ? "green" : "red",
      icon: "target",
      text: (
        <>
          Dibanding RKAP, revenue berada {metrics.gapRkap >= 0 ? "di atas" : "di bawah"} target sebesar{" "}
          <b>{formatAmount(Math.abs(metrics.gapRkap))}</b>.
        </>
      ),
    },
    {
      tone: metrics.growth >= 0 ? "green" : "red",
      icon: metrics.growth >= 0 ? "trend-up" : "trend-down",
      text: (
        <>
          {metrics.growth >= 0 ? "Pertumbuhan" : "Koreksi"} harian vs {prev} sebesar{" "}
          <b>{formatAmount(Math.abs(metrics.growth))}</b>.
        </>
      ),
    },
    {
      tone: "blue",
      icon: "settings",
      text: recovery ? (
        <>
          <strong>Fokus utama:</strong>{" "}
          {recovery.issue_title || recovery.description}
        </>
      ) : (
        "Seluruh recovery action telah selesai."
      ),
    },
  ]
  return (
    <section className="panel insight-panel">
      <SectionTitle icon="bulb" title="Key Takeaways" />
      <div className="insight-list">
        {insights.map((item, index) => (
          <div className={`insight insight-${item.tone}`} key={index}>
            <span className="insight-num">{index + 1}</span>
            <span className="insight-icon">
              <Icon name={item.icon} size={20} />
            </span>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const editorTabs = [
  "Executive Revenue",
  "Operational Revenue",
  "RADIR & RKAP",
  "Business Units",
  "Revenue Base Components",
  "Recovery Actions",
  "PDD Pipeline",
  "PYMHD Pipeline",
  "Import / Export",
  "Dashboard Appearance",
]

function DataEditor({
  data,
  selectedDate,
  onSave,
  onAutoSave,
  onClose,
}: {
  data: DashboardData
  selectedDate: string
  onSave: (
    data: DashboardData,
    message: string,
    activeDate?: string,
  ) => boolean
  onAutoSave: (data: DashboardData, activeDate?: string) => boolean
  onClose: () => void
}) {
  const [draft, setDraft] = useState<DashboardData>(() => structuredClone(data))
  const [tab, setTab] = useState(editorTabs[0])
  const [date, setDate] = useState(selectedDate)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const updateDraft = (next: DashboardData, activeDate = date) => {
    setDraft(next)
    const saved = onAutoSave(next, activeDate)
    setDirty(!saved)
    setNotice(
      saved
        ? "Perubahan tersimpan otomatis."
        : "Autosave gagal. Klik Simpan Perubahan sebelum menutup editor.",
    )
  }
  const dates = [
    ...new Set(draft.revenue_snapshots.map((item) => item.reporting_date)),
  ].sort()
  useEffect(() => {
    if (dirty) return
    setDraft(structuredClone(data))
    if (
      !data.revenue_snapshots.some(
        (snapshot) => snapshot.reporting_date === date,
      )
    )
      setDate(data.dashboard_settings.reporting_date)
  }, [data, date, dirty])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault()
        event.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const close = () => {
    if (!dirty || window.confirm("Perubahan belum disimpan. Tutup editor?"))
      onClose()
  }
  const save = () => {
    if (
      onSave(
        draft,
        "Perubahan data berhasil disimpan di perangkat ini.",
        date,
      )
    ) {
      setDirty(false)
      setNotice("Data tersimpan dan dashboard telah diperbarui.")
    }
  }
  const updateSnapshot = (unitId: string, amount: number) => {
    const existing = draft.revenue_snapshots.find(
      (item) =>
        item.reporting_date === date && item.business_unit_id === unitId,
    )
    const next = structuredClone(draft)
    if (existing) {
      const target = next.revenue_snapshots.find(
        (item) => item.id === existing.id,
      )!
      target.actual_revenue = Math.max(0, amount || 0)
      target.updated_at = new Date().toISOString()
      target.updated_by = "Local Editor"
    }
    updateDraft(next)
  }
  const addDate = () => {
    const input = window.prompt("Masukkan tanggal pelaporan baru (YYYY-MM-DD):")
    if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return
    if (dates.includes(input)) {
      setDate(input)
      return
    }
    const sourceDate = dates[dates.length - 1]
    const source = draft.revenue_snapshots.filter(
      (item) => item.reporting_date === sourceDate,
    )
    const next = structuredClone(draft)
    next.revenue_snapshots.push(
      ...source.map((item) => ({
        ...item,
        id: `snap-${crypto.randomUUID()}`,
        reporting_date: input,
        updated_at: new Date().toISOString(),
        updated_by: "Local Editor",
      })),
    )
    next.base_components.push(
      ...draft.base_components
        .filter((item) => item.reporting_date === sourceDate)
        .map((item) => ({ ...item, id: `base-${crypto.randomUUID()}`, reporting_date: input })),
    )
    // Operational lines keep stable IDs per date so parent links stay intact
    next.operational_lines.push(
      ...draft.operational_lines
        .filter((line) => line.reporting_date === sourceDate)
        .map((line) => ({ ...line, reporting_date: input })),
    )
    next.recovery_actions.push(
      ...copyRecoveryActionsForDate(
        draft.recovery_actions,
        sourceDate,
        input,
      ),
    )
    next.pipeline_records.push(
      ...copyPipelineRecordsForDate(
        draft.pipeline_records,
        sourceDate,
        input,
      ),
    )
    next.pipeline_meta.pymhd_reported_pid_total_by_date ??= {}
    next.pipeline_meta.pymhd_reported_pid_total_by_date[input] =
      next.pipeline_meta.pymhd_reported_pid_total_by_date[sourceDate] ??
      next.pipeline_meta.pymhd_reported_pid_total
    next.dashboard_settings.reporting_date = input
    updateDraft(next, input)
    setDate(input)
  }
  const exportJson = () =>
    downloadFile(
      JSON.stringify(draft, null, 2),
      "mitratel-complete-dataset.json",
      "application/json",
    )
  const exportCsv = () => {
    const header = "id,reporting_date,business_unit_id,actual_revenue,remarks\n"
    const rows = draft.revenue_snapshots
      .map((item) =>
        [
          item.id,
          item.reporting_date,
          item.business_unit_id,
          item.actual_revenue,
          JSON.stringify(item.remarks),
        ].join(","),
      )
      .join("\n")
    downloadFile(header + rows, "mitratel-revenue-snapshots.csv", "text/csv")
  }
  const importJson = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (
          !Array.isArray(parsed.revenue_snapshots) ||
          !Array.isArray(parsed.business_units)
        )
          throw new Error()
        if (
          window.confirm(
            `Pratinjau valid: ${parsed.revenue_snapshots.length} snapshot dan ${parsed.business_units.length} unit bisnis. Terapkan impor?`,
          )
        )
          updateDraft(normalizeData(parsed))
      } catch {
        setNotice("File tidak valid. Gunakan ekspor JSON dari aplikasi ini.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <main className="editor-shell">
      <header className="editor-header">
        <div className="editor-heading">
          <button className="icon-button" onClick={close}>
            <Icon name="arrow-left" />
          </button>
          <div>
            <span>MITRATEL REVENUE COMMAND CENTER</span>
            <h1>Kelola Data Dashboard</h1>
            <p>
              Perubahan tervalidasi akan langsung memutakhirkan seluruh
              perhitungan.
            </p>
          </div>
        </div>
        <div className="editor-actions">
          <Button variant="ghost" onClick={close}>
            Batal
          </Button>
          <Button
            variant="primary"
            icon="save"
            onClick={save}
            disabled={!dirty}
          >
            Simpan Perubahan
          </Button>
        </div>
      </header>
      <div className="editor-layout">
        <nav className="editor-nav">
          <div className="nav-label">DATA MANAGEMENT</div>
          {editorTabs.map((item, index) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={tab === item ? "active" : ""}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item}
            </button>
          ))}
          <div className="editor-help">
            <Icon name="database" size={20} />
            <strong>Penyimpanan lokal</strong>
            <p>Data tersimpan di browser ini, bukan basis data bersama.</p>
          </div>
        </nav>
        <section className="editor-content">
          {notice && (
            <div
              className={`notice ${
                notice.includes("berhasil") || notice.includes("tersimpan")
                  ? "notice-success"
                  : ""
              }`}
            >
              <Icon name="check" />
              {notice}
            </div>
          )}
          {tab === "Executive Revenue" && (
            <RevenueEditor
              draft={draft}
              date={date}
              dates={dates}
              setDate={setDate}
              updateSnapshot={updateSnapshot}
              addDate={addDate}
            />
          )}
          {tab === "Operational Revenue" && (
            <OperationalRevenueEditor draft={draft} updateDraft={updateDraft} />
          )}
          {tab === "Revenue Base Components" && (
            <BaseComponentEditor draft={draft} updateDraft={updateDraft} />
          )}
          {tab === "PDD Pipeline" && (
            <PipelineEditor
              draft={draft}
              updateDraft={updateDraft}
              pipeline="PDD"
              date={date}
              setDate={setDate}
            />
          )}
          {tab === "PYMHD Pipeline" && (
            <PipelineEditor
              draft={draft}
              updateDraft={updateDraft}
              pipeline="PYMHD"
              date={date}
              setDate={setDate}
            />
          )}
          {tab === "RADIR & RKAP" && (
            <TargetEditor draft={draft} updateDraft={updateDraft} />
          )}
          {tab === "Business Units" && (
            <BusinessMaster draft={draft} updateDraft={updateDraft} />
          )}
          {tab === "Recovery Actions" && (
            <RecoveryActionsEditor
              draft={draft}
              updateDraft={updateDraft}
              date={date}
              setDate={setDate}
            />
          )}
          {tab === "Import / Export" && (
            <div>
              <EditorTitle
                title="Import & Export"
                subtitle="Pindahkan data dengan ID stabil dan validasi sebelum diterapkan."
              />
              <div className="import-grid">
                <article>
                  <Icon name="upload" size={28} />
                  <h3>Impor dataset JSON</h3>
                  <p>
                    Unggah dataset lengkap. Aplikasi akan memvalidasi koleksi
                    utama dan menampilkan jumlah record sebelum impor.
                  </p>
                  <input
                    ref={fileRef}
                    hidden
                    type="file"
                    accept=".json"
                    onChange={(event) => importJson(event.target.files?.[0])}
                  />
                  <Button
                    icon="upload"
                    onClick={() => fileRef.current?.click()}
                  >
                    Pilih File JSON
                  </Button>
                </article>
                <article>
                  <Icon name="download" size={28} />
                  <h3>Ekspor data</h3>
                  <p>
                    Unduh snapshot revenue sebagai CSV atau seluruh entitas,
                    relasi, pengaturan, dan audit log sebagai JSON.
                  </p>
                  <div className="button-row">
                    <Button icon="download" onClick={exportCsv}>
                      Revenue CSV
                    </Button>
                    <Button
                      variant="primary"
                      icon="download"
                      onClick={exportJson}
                    >
                      Dataset JSON
                    </Button>
                  </div>
                </article>
              </div>
              <div className="schema-card">
                <strong>Format CSV yang didukung</strong>
                <code>
                  id, reporting_date, business_unit_id, actual_revenue, remarks
                </code>
                <p>
                  Gunakan stable ID untuk memperbarui record yang sudah ada.
                  Nilai revenue harus berupa angka non-negatif.
                </p>
              </div>
            </div>
          )}
          {tab === "Dashboard Appearance" && (
            <AppearanceEditor draft={draft} updateDraft={updateDraft} />
          )}
        </section>
      </div>
    </main>
  )
}

function EditorTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle: string
  action?: React.ReactNode
}) {
  return (
    <div className="editor-title">
      <div>
        <span>ADMINISTRASI</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

function RevenueEditor({
  draft,
  date,
  dates,
  setDate,
  updateSnapshot,
  addDate,
}: {
  draft: DashboardData
  date: string
  dates: string[]
  setDate: (date: string) => void
  updateSnapshot: (id: string, amount: number) => void
  addDate: () => void
}) {
  const metrics = calculateMetrics(draft, date)
  const units = draft.business_units.filter((unit) =>
    LEAF_IDS.includes(unit.id),
  )
  const derived = (unitId: string) =>
    draft.base_components.some(
      (item) => item.reporting_date === date && item.business_unit_id === unitId,
    )
  return (
    <div>
      <EditorTitle
        title="Revenue Actual"
        subtitle="Edit unit leaf; subtotal dan total dikalkulasi otomatis."
        action={
          <Button
            variant="primary"
            icon="plus"
            onClick={addDate}
            labelClassName="add-date-button-label"
          >
            Tambah Tanggal
          </Button>
        }
      />
      <div className="editor-toolbar">
        <label>
          Tanggal pelaporan
          <Select value={date} onChange={setDate} ariaLabel="Tanggal editor">
            {dates.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </label>
        <div className="summary-chip">
          <span>Total otomatis</span>
          <strong>{formatAmount(metrics.actual)}</strong>
          <small>juta Rupiah</small>
        </div>
      </div>
      <div className="editor-table-card">
        <table className="editor-table">
          <thead>
            <tr>
              <th>BUSINESS UNIT</th>
              <th>HIERARKI</th>
              <th>REVENUE ACTUAL</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id}>
                <td>
                  <strong>{unit.name}</strong>
                  <small>{unit.code}</small>
                </td>
                <td className={unit.id === "bu-msa" ? "revenue-hierarchy-emphasis" : undefined}>
                  {unit.id === "bu-msa" ? (
                    <span className="fg-inline-italic" data-fge-id="fge-2373">
                      DITBIS
                    </span>
                  ) : unit.parent_id === "bu-ditbis" ? (
                    "DITBIS"
                  ) : (
                    "TOTAL MITRATEL"
                  )}
                </td>
                <td>
                  <RevenueInput
                    value={metrics.actualFor(date, unit.id)}
                    onChange={(value) => updateSnapshot(unit.id, value)}
                    disabled={derived(unit.id)}
                  />
                </td>
                <td>
                  {derived(unit.id) ? (
                    <span className="lock-pill">Base + Operasional</span>
                  ) : (
                    <span className="edit-pill">Dapat diedit</span>
                  )}
                </td>
              </tr>
            ))}
            <tr className="locked-row">
              <td>
                <strong>DITBIS</strong>
                <small>SUBTOTAL</small>
              </td>
              <td>MSA + Power Service</td>
              <td>
                <RevenueInput
                  value={
                    metrics.actualFor(date, "bu-msa") +
                    metrics.actualFor(date, "bu-power")
                  }
                  onChange={() => undefined}
                  disabled
                />
              </td>
              <td>
                <span className="lock-pill">Dihitung otomatis</span>
              </td>
            </tr>
            <tr className="total-edit-row">
              <td>
                <strong>TOTAL MITRATEL</strong>
              </td>
              <td>Seluruh unit leaf</td>
              <td>{formatAmount(metrics.actual)}</td>
              <td>
                <span className="lock-pill">Dihitung otomatis</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TargetEditor({
  draft,
  updateDraft,
}: {
  draft: DashboardData
  updateDraft: (data: DashboardData) => void
}) {
  const units = draft.business_units.filter((unit) =>
    LEAF_IDS.includes(unit.id),
  )
  const changeTarget = (id: string, value: number) => {
    const next = structuredClone(draft)
    const target = next.revenue_targets.find((item) => item.id === id)
    if (target) {
      target.target_amount = Math.max(0, value || 0)
      target.updated_at = new Date().toISOString()
    }
    updateDraft(next)
  }
  const rkap = draft.revenue_targets.find(
    (item) => item.target_type === "RKAP",
  )!
  return (
    <div>
      <EditorTitle
        title="Target Management"
        subtitle="Kelola benchmark RADIR dan RKAP secara independen untuk FY 2026 • Q3."
      />
      <div className="target-cards">
        <article className="target-card">
          <span>RADIR YTD Q3</span>
          <strong>
            {formatAmount(
              draft.revenue_targets
                .filter((item) => item.target_type === "RADIR")
                .reduce((sum, item) => sum + item.target_amount, 0),
            )}
          </strong>
          <small>Agregat unit leaf</small>
        </article>
        <article className="target-card green">
          <span>RKAP YTD Q3</span>
          <strong>{formatAmount(rkap.target_amount)}</strong>
          <small>Benchmark korporat</small>
        </article>
      </div>
      <div className="editor-table-card">
        <table className="editor-table">
          <thead>
            <tr>
              <th>TIPE TARGET</th>
              <th>BUSINESS UNIT</th>
              <th>TAHUN / KUARTAL</th>
              <th>NILAI TARGET</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => {
              const target = draft.revenue_targets.find(
                (item) =>
                  item.target_type === "RADIR" &&
                  item.business_unit_id === unit.id,
              )!
              return (
                <tr key={unit.id}>
                  <td>
                    <span className="target-type">RADIR</span>
                  </td>
                  <td>
                    <strong>{unit.name}</strong>
                  </td>
                  <td>2026 / Q3</td>
                  <td>
                    <Input
                      type="number"
                      value={target.target_amount}
                      onChange={(value) =>
                        changeTarget(target.id, Number(value))
                      }
                      className="number-input"
                    />
                  </td>
                </tr>
              )
            })}
            <tr>
              <td>
                <span className="target-type rkap-type">RKAP</span>
              </td>
              <td>
                <strong>TOTAL MITRATEL</strong>
              </td>
              <td>2026 / Q3</td>
              <td>
                <Input
                  type="number"
                  value={rkap.target_amount}
                  onChange={(value) => changeTarget(rkap.id, Number(value))}
                  className="number-input"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BusinessMaster({
  draft,
  updateDraft,
}: {
  draft: DashboardData
  updateDraft: (data: DashboardData) => void
}) {
  const toggle = (id: string) => {
    const next = structuredClone(draft)
    const unit = next.business_units.find((item) => item.id === id)!
    unit.active = !unit.active
    updateDraft(next)
  }
  return (
    <div>
      <EditorTitle
        title="Business Unit Master"
        subtitle="Struktur hierarki dan roll-up yang digunakan mesin perhitungan."
      />
      <div className="editor-table-card">
        <table className="editor-table">
          <thead>
            <tr>
              <th>URUTAN</th>
              <th>KODE / NAMA</th>
              <th>PARENT</th>
              <th>KATEGORI</th>
              <th>TIPE</th>
              <th>AKTIF</th>
            </tr>
          </thead>
          <tbody>
            {draft.business_units
              .sort((a, b) => a.display_order - b.display_order)
              .map((unit) => (
                <tr key={unit.id}>
                  <td>{unit.display_order}</td>
                  <td>
                    <strong>{unit.code}</strong>
                    <small>{unit.name}</small>
                  </td>
                  <td>
                    {draft.business_units.find(
                      (item) => item.id === unit.parent_id,
                    )?.code || "—"}
                  </td>
                  <td>{unit.category}</td>
                  <td>
                    <span
                      className={unit.is_subtotal ? "lock-pill" : "edit-pill"}
                    >
                      {unit.is_subtotal ? "Roll-up" : "Leaf"}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`switch ${unit.active ? "on" : ""}`}
                      onClick={() => toggle(unit.id)}
                      aria-label={`Ubah status ${unit.name}`}
                    >
                      <i></i>
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="info-callout">
        <strong>Aturan integritas</strong>
        <p>
          Unit roll-up tidak dapat menerima revenue actual secara langsung.
          DITBIS dihitung dari MSA + Power Service; TOTAL MITRATEL dihitung dari
          seluruh unit leaf.
        </p>
      </div>
    </div>
  )
}

function AppearanceEditor({
  draft,
  updateDraft,
}: {
  draft: DashboardData
  updateDraft: (data: DashboardData) => void
}) {
  const update = (
    key: keyof DashboardData["dashboard_settings"],
    value: string | string[],
  ) => {
    const next = structuredClone(draft)
    ;(next.dashboard_settings as unknown as Record<string, string | string[]>)[
      key
    ] = value
    updateDraft(next)
  }
  const logoRef = useRef<HTMLInputElement>(null)
  const uploadLogo = (file?: File) => {
    if (!file) return
    if (file.size > 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => update("logo_asset_url", String(reader.result))
    reader.readAsDataURL(file)
  }
  return (
    <div>
      <EditorTitle
        title="Dashboard Appearance"
        subtitle="Atur identitas laporan, tanggal aktif, warna status, dan visibilitas KPI."
      />
      <div className="form-card">
        <div className="form-grid">
          <label className="wide-label">
            Judul laporan
            <Input
              value={draft.dashboard_settings.report_title}
              onChange={(v) => update("report_title", v)}
            />
          </label>
          <label>
            Nama perusahaan
            <Input
              value={draft.dashboard_settings.company_name}
              onChange={(v) => update("company_name", v)}
            />
          </label>
          <label>
            Tanggal aktif
            <Input
              type="date"
              value={draft.dashboard_settings.reporting_date}
              onChange={(v) => update("reporting_date", v)}
            />
          </label>
          <label>
            Warna positif
            <Input
              type="color"
              value={draft.dashboard_settings.positive_color}
              onChange={(v) => update("positive_color", v)}
              className="color-input"
            />
          </label>
          <label>
            Warna negatif
            <Input
              type="color"
              value={draft.dashboard_settings.negative_color}
              onChange={(v) => update("negative_color", v)}
              className="color-input"
            />
          </label>
        </div>
        <div className="logo-upload">
          <div className="logo-preview">
            {draft.dashboard_settings.logo_asset_url ? (
              <img
                src={draft.dashboard_settings.logo_asset_url}
                alt="Logo preview"
              />
            ) : (
              <div className="brand-mark">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
          <div>
            <strong>Logo perusahaan</strong>
            <p>
              PNG atau SVG, maksimal 1 MB. Logo tersimpan lokal sebagai data
              URL.
            </p>
            <input
              ref={logoRef}
              hidden
              type="file"
              accept=".png,.svg"
              onChange={(e) => uploadLogo(e.target.files?.[0])}
            />
            <Button icon="upload" onClick={() => logoRef.current?.click()}>
              Unggah Logo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function downloadFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [data, setData] = useState<DashboardData>(loadData)
  const latestDataRef = useRef(data)
  const cloudSaveQueue = useRef(Promise.resolve())
  // Apply directorate renames to data already held in memory or storage
  useEffect(() => {
    if (data.business_units.some((unit) => /DIROPBANG|DIRASET/.test(unit.name + unit.code + unit.directorate))) {
      const next = normalizeData(data)
      persistData(next)
      setData(next)
    }
  }, [data])
  const [view, setView] = useState<"dashboard" | "editor">("dashboard")
  const [selectedDate, setSelectedDate] = useState(
    data.dashboard_settings.reporting_date,
  )
  const [toast, setToast] = useState("")
  const [presenting, setPresenting] = useState(false)
  const [scale, setScale] = useState(1)
  const [page, setPageState] = useState<Page>(pageFromHash)
  const setPage = (next: Page) => {
    window.location.hash = `/${next}`
    setPageState(next)
  }
  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, "", `#/${page}`)
    const onHash = () => setPageState(pageFromHash())
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])
  useEffect(() => {
    const fit = () =>
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    const onFullscreen = () => {
      if (!document.fullscreenElement) setPresenting(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPresenting(false)
    }
    fit()
    window.addEventListener("resize", fit)
    window.addEventListener("keydown", onKey)
    document.addEventListener("fullscreenchange", onFullscreen)
    return () => {
      window.removeEventListener("resize", fit)
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("fullscreenchange", onFullscreen)
    }
  }, [])
  const dashboardRef = useRef<HTMLDivElement>(null)
  const metrics = useMemo(
    () => calculateMetrics(data, selectedDate),
    [data, selectedDate],
  )
  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(""), 2600)
  }
  const queueCloudSave = (next: DashboardData, updatedAt: number) => {
    cloudSaveQueue.current = cloudSaveQueue.current
      .catch(() => undefined)
      .then(() => saveCloudData(next, updatedAt))
      .catch(() => {
        showToast("Data tersimpan lokal; sinkronisasi cloud gagal.")
      })
  }
  const syncCloudData = async (notify = false) => {
    try {
      const cloud = await loadCloudData()
      const localUpdatedAt = loadDataUpdatedAt()
      if (!cloud) {
        const updatedAt = localUpdatedAt || Date.now()
        persistData(latestDataRef.current, updatedAt)
        queueCloudSave(latestDataRef.current, updatedAt)
        if (notify) showToast("Data lokal sedang dikirim ke cloud.")
        return true
      }
      if (localUpdatedAt > cloud.updatedAt) {
        queueCloudSave(latestDataRef.current, localUpdatedAt)
        if (notify) showToast("Data lokal terbaru sedang disinkronkan.")
        return true
      }
      if (cloud.updatedAt > localUpdatedAt) {
        const synced = normalizeData(cloud.data)
        persistData(synced, cloud.updatedAt)
        latestDataRef.current = synced
        setData(synced)
        setSelectedDate(synced.dashboard_settings.reporting_date)
        showToast("Data terbaru dari cloud berhasil dimuat.")
      } else if (notify) {
        showToast("Data sudah paling baru.")
      }
      return true
    } catch {
      if (notify)
        showToast("Cloud tidak tersedia; data lokal tetap aman.")
      return false
    }
  }
  useEffect(() => {
    let active = true
    const sync = async () => {
      if (active) await syncCloudData()
    }
    void sync()
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void sync()
    }, 10000)
    const onVisibility = () => {
      if (document.visibilityState === "visible") void sync()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])
  const saveData = (
    next: DashboardData,
    message: string,
    activeDate?: string,
  ) => {
    try {
      const audit: AuditLog = {
        id: `audit-${crypto.randomUUID()}`,
        entity_name: "dashboard_dataset",
        record_id: next.dashboard_settings.id,
        action: "UPDATE",
        previous_value: {
          reporting_date: data.dashboard_settings.reporting_date,
        },
        new_value: { reporting_date: next.dashboard_settings.reporting_date },
        changed_by: "Local Editor",
        changed_at: new Date().toISOString(),
      }
      const saved = { ...normalizeData(next), audit_logs: [...next.audit_logs, audit] }
      const updatedAt = Date.now()
      persistData(saved, updatedAt)
      latestDataRef.current = saved
      queueCloudSave(saved, updatedAt)
      setData(saved)
      setSelectedDate(activeDate || selectedDate)
      showToast(message)
      return true
    } catch {
      showToast("Penyimpanan gagal. Periksa kapasitas browser.")
      return false
    }
  }
  const autoSaveData = (next: DashboardData, activeDate?: string) => {
    try {
      const saved = normalizeData(next)
      const updatedAt = Date.now()
      persistData(saved, updatedAt)
      latestDataRef.current = saved
      queueCloudSave(saved, updatedAt)
      setData(saved)
      setSelectedDate(activeDate || selectedDate)
      return true
    } catch {
      showToast("Autosave gagal. Periksa kapasitas browser.")
      return false
    }
  }
  const refresh = async () => {
    const synced = await syncCloudData(true)
    if (synced) return
    const local = loadData()
    latestDataRef.current = local
    setData(local)
    setSelectedDate(local.dashboard_settings.reporting_date)
  }
  const present = async () => {
    if (presenting) {
      setPresenting(false)
      if (document.fullscreenElement) await document.exitFullscreen()
      return
    }
    setPresenting(true)
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      showToast("Layar penuh tidak tersedia — tekan Esc untuk keluar.")
    }
  }
  const exportPng = async () => {
    const node = dashboardRef.current
    if (!node) return
    try {
      const clone = node.cloneNode(true) as HTMLElement
      clone.querySelector(".header-visual")?.remove()
      clone.querySelector(".drawer-scrim")?.remove()
      const style = [...document.styleSheets]
        .map((sheet) => {
          try {
            return [...sheet.cssRules].map((r) => r.cssText).join("\n")
          } catch {
            return ""
          }
        })
        .join("\n")
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>${style}</style>${clone.outerHTML}</div></foreignObject></svg>`
      const image = new Image()
      const url = URL.createObjectURL(
        new Blob([svg], { type: "image/svg+xml" }),
      )
      image.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = 1920
        canvas.height = 1080
        canvas.getContext("2d")?.drawImage(image, 0, 0, 1920, 1080)
        canvas.toBlob((blob) => {
          if (blob) {
            const png = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = png
            a.download = `mitratel-${page}-${selectedDate}.png`
            a.click()
            URL.revokeObjectURL(png)
          }
        })
        URL.revokeObjectURL(url)
      }
      image.onerror = () => {
        URL.revokeObjectURL(url)
        window.print()
      }
      image.src = url
    } catch {
      window.print()
    }
  }

  if (view === "editor")
    return (
      <DataEditor
        data={data}
        selectedDate={selectedDate}
        onSave={saveData}
        onAutoSave={autoSaveData}
        onClose={() => setView("dashboard")}
      />
    )
  return (
    <div className={`app-shell page-${page} ${presenting ? "presenting" : ""}`}>
      <div
        className="dashboard-canvas"
        ref={dashboardRef}
        style={
          presenting
            ? ({ "--scale": scale } as React.CSSProperties)
            : undefined
        }
      >
        <DashboardHeader
          data={data}
          dates={metrics.dates}
          selectedDate={selectedDate}
          presenting={presenting}
          onDate={setSelectedDate}
          onEditor={() => setView("editor")}
          onRefresh={refresh}
          onPrint={() => window.print()}
          onExport={exportPng}
          onPresent={present}
          page={page}
          onPage={setPage}
        />
        {page === "operational-recovery" ? (
          <OperationalRecovery
            data={data}
            metrics={metrics}
            selectedDate={selectedDate}
            onUpdate={saveData}
          />
        ) : (
        <main className="dashboard-content">
          <section className="kpi-grid">
            <KPICard
              label="Total OL Revenue YTD"
              value={metrics.actual}
              subtitle="dalam juta Rupiah"
              hero
            />
            <KPICard
              label={`${metrics.gapRadir >= 0 ? "Surplus" : "Gap"} vs RADIR`}
              value={metrics.gapRadir}
              subtitle={`RADIR ${formatAmount(metrics.radir)}`}
              variance={metrics.gapRadirPercent}
              tone={metrics.gapRadir >= 0 ? "green" : "red"}
            />
            <KPICard
              label={`${metrics.gapRkap >= 0 ? "Surplus" : "Gap"} vs RKAP`}
              value={metrics.gapRkap}
              subtitle={`RKAP ${formatAmount(metrics.rkap)}`}
              variance={metrics.gapRkapPercent}
              tone={metrics.gapRkap >= 0 ? "green" : "red"}
            />
            <KPICard
              label={`${metrics.growth >= 0 ? "Growth" : "Koreksi"} vs ${shortDate(metrics.previousDate)}`}
              value={metrics.growth}
              subtitle={`Posisi ${formatDate(selectedDate)}`}
              variance={metrics.growthPercent}
              tone={metrics.growth >= 0 ? "green" : "red"}
              icon={metrics.growth >= 0 ? "trend-up" : "trend-down"}
            />
          </section>
          <section className="middle-grid">
            <RevenueBenchmarkChart metrics={metrics} selectedDate={selectedDate} />
            <BusinessUnitPerformance
              data={data}
              selectedDate={selectedDate}
              previousDate={metrics.previousDate}
              actualFor={metrics.actualFor}
            />
          </section>
          <section className="bottom-grid">
            <TargetAttainment metrics={metrics} selectedDate={selectedDate} />
            <RevenueDetailTable
              data={data}
              selectedDate={selectedDate}
              metrics={metrics}
            />
            <ExecutiveInsights
              data={data}
              metrics={metrics}
              selectedDate={selectedDate}
            />
          </section>
        </main>
        )}
        <footer className="dashboard-footer">
          <span>CONFIDENTIAL • INTERNAL USE ONLY</span>
          <span>PT Dayamitra Telekomunikasi Tbk</span>
        </footer>
      </div>
      {toast && (
        <div className="toast">
          <Icon name="check" />
          {toast}
        </div>
      )}
    </div>
  )
}

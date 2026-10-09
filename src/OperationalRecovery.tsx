import { Fragment, useState } from "react"
import {
  EMPTY_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  STREAM_META,
  calculateMetrics,
  formatAmount,
  formatDate,
  formatPercent,
  formatSigned,
  lineValue,
  operationalDateFor,
  streamTotals,
  type ActionStatus,
  type DashboardData,
  type OperationalLine,
  type RecoveryAction,
  type StreamId,
} from "./data"

type Metrics = ReturnType<typeof calculateMetrics>
type Update = (next: DashboardData, message: string) => boolean

const STREAMS: StreamId[] = ["tower", "project", "managed"]
const OWNER_LABEL: Record<StreamId, string> = {
  tower: "DITBIS",
  project: "DITASET",
  managed: "DITOPBANG",
}
const LARGE_LINE_LABELS = new Set([
  "MSA Operasional",
  "Power Operasional",
  "TRB Telkom",
  "TRB Others",
  "MS Telkom",
  "MS Mitra Addwork",
])
const SMALL_LINE_LABELS = new Set([
  "MTEL (Tower, Fiber, Reseller)",
  "ex-PST (Tower Only)",
  "ex-UMT (Fiber)",
  "BAKTI",
  "Sarpen Telkomsel",
  "IPLH Cada",
  "FITT",
  "IPLH Tower",
  "FOC IOH",
  "CN IOH",
  "NDE",
])
const nextStatus = (status: ActionStatus) =>
  STATUS_ORDER[(STATUS_ORDER.indexOf(status) + 1) % STATUS_ORDER.length]
const tone = (value: number) => (value >= 0 ? "pos" : "neg")
const pct = (value: number) => `${value >= 0 ? "+" : "−"}${formatPercent(Math.abs(value))}`
const actionText = (action: RecoveryAction) => {
  const update = action.latest_update || action.notes
  return update ? `${action.issue_title} — ${update}` : action.issue_title
}

function StatusChip({
  status,
  onClick,
  compact,
}: {
  status: ActionStatus
  onClick?: () => void
  compact?: boolean
}) {
  const className = `status-chip chip-${status.replace(" ", "-").toLowerCase()} ${compact ? "compact" : ""}`
  if (!onClick) return <span className={className}>{STATUS_LABEL[status]}</span>
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      title="Klik untuk mengganti status"
    >
      {STATUS_LABEL[status]}
    </button>
  )
}

function DetailDrawer({
  data,
  date,
  stream,
  onClose,
  onUpdate,
}: {
  data: DashboardData
  date: string
  stream: StreamId
  onClose: () => void
  onUpdate: Update
}) {
  const meta = STREAM_META[stream]
  const lines = data.operational_lines
    .filter((line) => line.stream === stream && line.reporting_date === date)
    .sort((a, b) => a.display_order - b.display_order)
  const [collapsed, setCollapsed] = useState<string[]>([])
  const actions = data.recovery_actions.filter(
    (action) =>
      action.reporting_date === date &&
      action.kind === "task" &&
      action.stream === stream,
  )
  const patchLine = (id: string, patch: Partial<OperationalLine>) => {
    const next = structuredClone(data)
    Object.assign(next.operational_lines.find((line) => line.id === id)!, patch)
    onUpdate(next, "Detail operasional diperbarui.")
  }
  const patchAction = (id: string, patch: Partial<RecoveryAction>) => {
    const next = structuredClone(data)
    Object.assign(next.recovery_actions.find((action) => action.id === id)!, patch)
    onUpdate(next, "Action tracker diperbarui.")
  }
  const hidden = (line: OperationalLine): boolean => {
    const parent = lines.find((item) => item.id === line.parent_id)
    return Boolean(parent && (collapsed.includes(parent.id) || hidden(parent)))
  }
  const depth = (line: OperationalLine): number => {
    const parent = lines.find((item) => item.id === line.parent_id)
    return parent ? depth(parent) + 1 : 0
  }
  // Depth-first so every child renders beneath its own group
  const ordered: OperationalLine[] = []
  const walk = (parent: string | null) =>
    lines.filter((line) => line.parent_id === parent).forEach((line) => {
      ordered.push(line)
      walk(line.id)
    })
  walk(null)
  const totals = streamTotals(data, date, stream)
  const groups = lines.filter((line) => line.is_group).map((line) => line.id)
  return (
    <div className="drawer-scrim" onClick={onClose}>
      <aside className="drawer" onClick={(event) => event.stopPropagation()} aria-label={`Detail ${meta.title}`}>
        <header className="drawer-head">
          <div>
            <span>{meta.owner} · Posisi {formatDate(date)}</span>
            <h2>{meta.title}</h2>
            <p>
              RADIR {formatAmount(totals.radir)} · Aktual {formatAmount(totals.actual)} ·{" "}
              <b className={tone(totals.gap)}>
                {formatSigned(totals.gap)} ({pct(totals.gapPercent)})
              </b>
            </p>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Tutup detail">
            ×
          </button>
        </header>
        <div className="drawer-body">
          <div className="drawer-section-head">
            <h3>Rincian lengkap</h3>
            <div className="drawer-tools">
              <button type="button" onClick={() => setCollapsed([])}>Buka semua</button>
              <button type="button" onClick={() => setCollapsed(groups)}>Tutup semua</button>
            </div>
          </div>
          <table className="drawer-table">
            <thead>
              <tr>
                <th>Komponen</th>
                <th>RADIR</th>
                <th>Aktual</th>
                <th>Gap</th>
                <th>Status</th>
                <th>PIC</th>
                <th>Deadline</th>
                <th>Komentar</th>
              </tr>
            </thead>
            <tbody>
              {ordered.filter((line) => !hidden(line)).map((line) => {
                const radir = lineValue(lines, line, "radir")
                const actual = lineValue(lines, line, "actual")
                const gap = actual - radir
                return (
                  <tr key={line.id} className={line.is_group ? "group" : ""}>
                    <td style={{ paddingLeft: 14 + depth(line) * 18 }}>
                      {line.is_group ? (
                        <button
                          type="button"
                          className="tree-toggle"
                          onClick={() =>
                            setCollapsed((list) =>
                              list.includes(line.id) ? list.filter((id) => id !== line.id) : [...list, line.id],
                            )
                          }
                          aria-expanded={!collapsed.includes(line.id)}
                        >
                          <span>{collapsed.includes(line.id) ? "▸" : "▾"}</span>
                          {line.label}
                        </button>
                      ) : (
                        line.label
                      )}
                    </td>
                    <td>{formatAmount(radir)}</td>
                    <td>{formatAmount(actual)}</td>
                    <td className={gap === 0 ? "zero" : tone(gap)}>{gap === 0 ? "0" : formatSigned(gap)}</td>
                    <td>
                      <StatusChip status={line.status} onClick={() => patchLine(line.id, { status: nextStatus(line.status) })} compact />
                    </td>
                    <td>
                      <input className="cell-input" defaultValue={line.pic} placeholder={EMPTY_LABEL} onBlur={(event) => event.target.value !== line.pic && patchLine(line.id, { pic: event.target.value })} />
                    </td>
                    <td>
                      <input className="cell-input" type="date" defaultValue={line.deadline} onBlur={(event) => event.target.value !== line.deadline && patchLine(line.id, { deadline: event.target.value })} />
                    </td>
                    <td>
                      <input className="cell-input" defaultValue={line.comment} placeholder="—" onBlur={(event) => event.target.value !== line.comment && patchLine(line.id, { comment: event.target.value })} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="drawer-note">Subtotal grup dihitung otomatis dari item turunan. Nilai RADIR/Aktual diedit di Kelola Data → Operational Revenue.</p>
          <div className="drawer-section-head">
            <h3>Action tracker</h3>
          </div>
          <table className="drawer-table actions">
            <thead>
              <tr>
                <th>Aksi</th>
                <th>Status</th>
                <th>PIC</th>
                <th>Deadline</th>
                <th>Komentar</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id}>
                  <td>{action.issue_title}</td>
                  <td>
                    <StatusChip status={action.action_status} onClick={() => patchAction(action.id, { action_status: nextStatus(action.action_status) })} compact />
                  </td>
                  <td>
                    <input className="cell-input" defaultValue={action.responsible_pic} placeholder={EMPTY_LABEL} onBlur={(event) => event.target.value !== action.responsible_pic && patchAction(action.id, { responsible_pic: event.target.value })} />
                  </td>
                  <td>
                    <input className="cell-input" type="date" defaultValue={action.target_date} onBlur={(event) => event.target.value !== action.target_date && patchAction(action.id, { target_date: event.target.value })} />
                  </td>
                  <td>
                    <input className="cell-input" defaultValue={action.latest_update} placeholder="—" onBlur={(event) => event.target.value !== action.latest_update && patchAction(action.id, { latest_update: event.target.value })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>
    </div>
  )
}

type GlyphName = "tower" | "file" | "users" | "gear" | "target" | "tri-up" | "tri-down" | "bars"

const glyphs: Record<GlyphName, React.ReactNode> = {
  tower: <path d="M12 3v2M9 21l3-16 3 16M10 13h4M9.5 17h5M6 6a8 8 0 0 0 0 6M18 6a8 8 0 0 1 0 6" />,
  file: (
    <>
      <path d="M6 3h8l4 4v14H6Z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" strokeWidth="2.6" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="m12 12 8-8M17 4h3v3" />
    </>
  ),
  "tri-up": <path d="M12 5 21 19H3Z" fill="currentColor" />,
  "tri-down": <path d="M12 19 3 5h18Z" fill="currentColor" />,
  bars: <path d="M5 20V13M10 20V8M15 20v-9M20 20V4" strokeWidth="3" />,
}

function Glyph({ name, size = 20 }: { name: GlyphName; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {glyphs[name]}
    </svg>
  )
}

const STREAM_ICON: Record<StreamId, GlyphName> = { tower: "tower", project: "file", managed: "users" }
const statusClass = (status: ActionStatus) => `chip-${status.replace(" ", "-").toLowerCase()}`

function OpsKpiCard({ label, value, percent, icon }: { label: string; value: number; percent: number; icon?: GlyphName }) {
  const kind = value >= 0 ? "green" : "red"
  return (
    <article className={`ops2-kpi tone-${kind}`}>
      <div className="ops2-kpi-tile">
        <Glyph name={icon || (value >= 0 ? "tri-up" : "tri-down")} size={34} />
      </div>
      <div className="ops2-kpi-body">
        <span>{label}</span>
        <div>
          <strong>{formatAmount(Math.abs(value))}</strong>
          <em>({pct(percent)})</em>
        </div>
      </div>
      <svg className="ops2-kpi-deco" viewBox="0 0 160 90" preserveAspectRatio="none" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={70 + i * 18} y={60 - i * 13} width="11" height={30 + i * 13} rx="2" />
        ))}
      </svg>
    </article>
  )
}

function PanelBand({ icon, title, note, children }: { icon: GlyphName; title: React.ReactNode; note?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="ops2-band">
      <Glyph name={icon} size={26} />
      <h2>{title}</h2>
      {children}
      {note && <span className="ops2-band-note">{note}</span>}
    </header>
  )
}

function DeltaCell({ delta }: { delta: number }) {
  return (
    <td className={`ops2-delta ${delta > 0 ? "up" : delta < 0 ? "down" : "flat"}`}>
      <span className="ops2-delta-in">
        {delta !== 0 && <Glyph name={delta > 0 ? "tri-up" : "tri-down"} size={11} />}
        <span>{delta === 0 ? "0" : formatAmount(Math.abs(delta))}</span>
      </span>
    </td>
  )
}

function PctCell({ delta, base }: { delta: number; base: number }) {
  if (!base) return <td className="ops2-pct flat">N/A</td>
  const value = (delta / Math.abs(base)) * 100
  return (
    <td className={`ops2-pct ${value > 0 ? "up" : value < 0 ? "down" : "flat"}`}>
      {value < 0 ? "−" : ""}
      {formatPercent(Math.abs(value))}
    </td>
  )
}

// Depth-first walk so children always follow their parent
function treeRows(lines: OperationalLine[]) {
  const rows: { line: OperationalLine; depth: number }[] = []
  const walk = (parent: string | null, depth: number) =>
    lines
      .filter((line) => line.parent_id === parent)
      .sort((a, b) => a.display_order - b.display_order)
      .forEach((line) => {
        rows.push({ line, depth })
        walk(line.id, depth + 1)
      })
  walk(null, 0)
  return rows
}

function StreamPanel({
  data,
  date,
  stream,
  onDetail,
  onCycle,
}: {
  data: DashboardData
  date: string
  stream: StreamId
  onDetail: () => void
  onCycle: (action: RecoveryAction) => void
}) {
  const meta = STREAM_META[stream]
  const totals = streamTotals(data, date, stream)
  const lines = data.operational_lines.filter((line) => line.stream === stream && line.reporting_date === date)
  const actions = data.recovery_actions.filter(
    (action) =>
      action.reporting_date === date &&
      action.kind === "task" &&
      action.stream === stream,
  )
  return (
    <article className={`panel ops2-stream stream-${stream}`}>
      <PanelBand
        icon={STREAM_ICON[stream]}
        title={meta.title}
        note={
          <>
            Realisasi YTD Q3 2026
            <br />
            (dalam juta Rupiah)
          </>
        }
      >
        <button type="button" className="ops2-detail" onClick={onDetail} title="Lihat & ubah detail">
          Detail →
        </button>
      </PanelBand>
      <div className="ops2-table-wrap">
        <table className="ops2-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>RADIR</th>
              <th>{shortDay(date)}</th>
              <th>Delta</th>
              <th>% Change</th>
            </tr>
          </thead>
          <tbody>
            <tr className="ops2-total">
              <td className={`ops2-owner ops2-owner-${stream}`}>{OWNER_LABEL[stream]}</td>
              <td>{formatAmount(totals.radir)}</td>
              <td>{formatAmount(totals.actual)}</td>
              <DeltaCell delta={totals.gap} />
              <PctCell delta={totals.gap} base={totals.radir} />
            </tr>
            {treeRows(lines).map(({ line, depth }) => {
              const radir = lineValue(lines, line, "radir")
              const actual = lineValue(lines, line, "actual")
              const bullet = !line.is_group && depth > 0
              const progress = actions.filter(
                (action) => action.operational_line_id === line.id,
              )
              return (
                <Fragment key={line.id}>
                  <tr className={`${bullet ? "ops2-leaf" : "ops2-group"} ${progress.length ? "has-progress" : ""}`}>
                    <td
                      className={
                        LARGE_LINE_LABELS.has(line.label)
                          ? `ops2-line-large${line.label === "TRB Others" ? " ops2-line-trb-others" : ""}`
                          : SMALL_LINE_LABELS.has(line.label)
                            ? "ops2-line-small"
                            : undefined
                      }
                      title={line.label}
                    >
                      {line.label}
                    </td>
                    <td>{radir === 0 && bullet ? "-" : formatAmount(radir)}</td>
                    <td>{actual === 0 && bullet ? "-" : formatAmount(actual)}</td>
                    <DeltaCell delta={actual - radir} />
                    <PctCell delta={actual - radir} base={radir} />
                  </tr>
                  {progress.map((action, index) => (
                    <tr
                      className={`ops2-progress-row ${index === 0 ? "is-first" : ""} ${index === progress.length - 1 ? "is-last" : ""}`}
                      key={action.id}
                    >
                      <td colSpan={5}>
                        <div className="ops2-progress-note">
                          <button
                            type="button"
                            className={`ops2-pill ${statusClass(action.action_status)}`}
                            onClick={() => onCycle(action)}
                            title="Klik untuk mengganti status"
                          >
                            {action.action_status}
                          </button>
                          <span>{actionText(action)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </article>
  )
}

const shortDay = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short" })

function PddPanel({ data, date }: { data: DashboardData; date: string }) {
  const records = data.pipeline_records.filter(
    (record) =>
      record.pipeline === "PDD" && record.reporting_date === date,
  )
  const total = records.reduce((sum, record) => sum + record.potential, 0)
  return (
    <section className="panel ops2-bottom">
      <PanelBand icon="file" title="PDD Pipeline" note="(dalam juta Rupiah)" />
      <table className="ops2-mini">
        <thead>
          <tr>
            <th>Kategori PDD</th>
            <th>Potensi</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.label}</td>
              <td>{formatAmount(record.potential)}</td>
              <td title={record.notes}>{record.notes || "-"}</td>
            </tr>
          ))}
          <tr className="ops2-mini-total">
            <td>Total</td>
            <td>{formatAmount(total)}</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}

function PymhdPanel({ data, date, onCycleAction }: { data: DashboardData; date: string; onCycleAction: (action: RecoveryAction) => void }) {
  const records = data.pipeline_records.filter(
    (record) =>
      record.pipeline === "PYMHD" && record.reporting_date === date,
  )
  const value = records.reduce((sum, record) => sum + record.potential, 0)
  const pid = records.reduce((sum, record) => sum + record.pid_count, 0)
  const reported =
    data.pipeline_meta.pymhd_reported_pid_total_by_date?.[date] ??
    data.pipeline_meta.pymhd_reported_pid_total
  const progress = data.recovery_actions.filter(
    (action) =>
      action.reporting_date === date && action.kind === "progress",
  )
  return (
    <section className="panel ops2-bottom">
      <PanelBand icon="file" title="PYMHD Pipeline" note="(dalam juta Rupiah)" />
      <table className="ops2-mini">
        <thead>
          <tr>
            <th>Sales</th>
            <th>PID</th>
            <th>PYMHD NDE</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.label}</td>
              <td>{formatAmount(record.pid_count)}</td>
              <td>{formatAmount(record.potential)}</td>
              <td title={record.notes}>{record.notes || "-"}</td>
            </tr>
          ))}
          <tr className="ops2-mini-total">
            <td>Total</td>
            <td>
              {formatAmount(pid)}
              {pid !== reported && (
                <span className="ops2-pid-flag" title={`Laporan sumber mencatat total PID ${formatAmount(reported)}, sedangkan penjumlahan Sales 1–3 = ${formatAmount(pid)}`}>
                  ⚠ lapor {formatAmount(reported)}
                </span>
              )}
            </td>
            <td>{formatAmount(value)}</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
      <div className="ops2-inline-progress">
        <Glyph name="gear" size={20} />
        <b>Progress</b>
        <span>
          {progress.map((action, index) => (
            <button key={action.id} type="button" className={statusClass(action.action_status)} onClick={() => onCycleAction(action)} title={`${action.action_status} — klik untuk mengganti status`}>
              {index > 0 && " · "}
              {actionText(action)}
            </button>
          ))}
          {!progress.length && EMPTY_LABEL}
        </span>
      </div>
    </section>
  )
}

function KeyRecoveryPanel({ data, date, metrics }: { data: DashboardData; date: string; metrics: Metrics }) {
  const actions = data.recovery_actions.filter(
    (action) => action.reporting_date === date,
  )
  const priority = (code: string) =>
    actions.find(
      (action) => action.kind === "priority" && action.priority === code,
    )
  const follow = (code: string) => {
    const action = priority(code)
    return action
      ? actionText(action)
      : `${code}: tindak lanjut ${EMPTY_LABEL.toLowerCase()}.`
  }
  const net = STREAMS.reduce((sum, stream) => sum + streamTotals(data, date, stream).gap, 0)
  const focus = actions.find(
    (action) => !action.kind && action.action_status !== "Done",
  )
  const items: { tone: string; head: React.ReactNode; sub: string }[] = [
    {
      tone: tone(metrics.gapRadir),
      head: (
        <>
          Realisasi {metrics.gapRadir >= 0 ? "melampaui" : "masih di bawah"} RADIR sebesar <b>{formatAmount(Math.abs(metrics.gapRadir))}</b>.
        </>
      ),
      sub: follow("P1"),
    },
    {
      tone: tone(metrics.gapRkap),
      head: (
        <>
          Dibanding RKAP, revenue {metrics.gapRkap >= 0 ? "sudah di atas" : "masih di bawah"} target sebesar <b>{formatAmount(Math.abs(metrics.gapRkap))}</b>.
        </>
      ),
      sub: follow("P2"),
    },
    {
      tone: tone(metrics.growth),
      head: (
        <>
          {metrics.growth >= 0 ? "Pertumbuhan" : "Koreksi"} harian vs {shortDay(metrics.previousDate)} sebesar <b>{formatAmount(Math.abs(metrics.growth))}</b>.
        </>
      ),
      sub: follow("P3"),
    },
    {
      tone: "focus",
      head: (
        <>
          <strong>Fokus utama:</strong>{" "}
          {focus ? actionText(focus) || focus.description : EMPTY_LABEL}
        </>
      ),
      sub: net === metrics.gapRadir ? `NET gap stream ${formatSigned(net)} selaras dengan Executive Overview.` : `NET gap stream ${formatSigned(net)} ≠ Executive Overview ${formatSigned(metrics.gapRadir)}.`,
    },
  ]
  return (
    <section className="panel ops2-bottom ops2-key">
      <PanelBand
        icon="target"
        title={
          <>
            Key Recovery Actions <small>(Next 1–2 Weeks)</small>
          </>
        }
      />
      <ol>
        {items.map((item, index) => (
          <li key={index} className={`key-${item.tone}`}>
            <i>{index + 1}</i>
            <div>
              <p>{item.head}</p>
              <small title={item.sub}>{item.sub}</small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function OperationalRecovery({
  data,
  metrics,
  selectedDate,
  onUpdate,
}: {
  data: DashboardData
  metrics: Metrics
  selectedDate: string
  onUpdate: Update
}) {
  const [detail, setDetail] = useState<StreamId | null>(null)
  const date = operationalDateFor(data, selectedDate)
  const cycleAction = (action: RecoveryAction) => {
    const next = structuredClone(data)
    const target = next.recovery_actions.find((item) => item.id === action.id)!
    target.action_status = nextStatus(target.action_status)
    onUpdate(next, `Status "${action.issue_title}" → ${STATUS_LABEL[target.action_status]}`)
  }
  return (
    <main className="ops-content ops2">
      <section className="ops2-kpis">
        <OpsKpiCard label={`${metrics.gapRadir >= 0 ? "Surplus" : "Gap"} vs RADIR`} value={metrics.gapRadir} percent={metrics.gapRadirPercent} />
        <OpsKpiCard label={`${metrics.gapRkap >= 0 ? "Surplus" : "Gap"} vs RKAP`} value={metrics.gapRkap} percent={metrics.gapRkapPercent} />
        <OpsKpiCard label={`${metrics.growth >= 0 ? "Growth" : "Koreksi"} vs ${shortDay(metrics.previousDate)}`} value={metrics.growth} percent={metrics.growthPercent} icon="bars" />
      </section>
      <section className="ops2-streams">
        {STREAMS.map((stream) => (
          <StreamPanel key={stream} data={data} date={date} stream={stream} onDetail={() => setDetail(stream)} onCycle={cycleAction} />
        ))}
      </section>
      <section className="ops2-bottoms">
        <PddPanel data={data} date={date} />
        <PymhdPanel data={data} date={date} onCycleAction={cycleAction} />
        <KeyRecoveryPanel data={data} date={date} metrics={metrics} />
      </section>
      {detail && <DetailDrawer data={data} date={date} stream={detail} onClose={() => setDetail(null)} onUpdate={onUpdate} />}
    </main>
  )
}

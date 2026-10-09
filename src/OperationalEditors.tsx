import { useState } from "react"
import {
  EMPTY_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  STREAM_META,
  calculateMetrics,
  formatAmount,
  lineValue,
  operationalDates,
  type DashboardData,
  type OperationalLine,
  type PipelineRecord,
  type RecoveryAction,
  type StreamId,
} from "./data"

type EditorProps = {
  draft: DashboardData
  updateDraft: (data: DashboardData) => void
}

const STREAMS = Object.keys(STREAM_META) as StreamId[]
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`

function Title({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
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

function NumberCell({ value, onChange, allowNegative }: { value: number; onChange: (value: number) => void; allowNegative?: boolean }) {
  const [text, setText] = useState(String(value))
  const invalid = text.trim() === "" || !Number.isFinite(Number(text)) || (!allowNegative && Number(text) < 0)
  return (
    <input
      className={`field number-input ${invalid ? "invalid" : ""}`}
      type="number"
      value={text}
      aria-invalid={invalid}
      title={invalid ? (allowNegative ? "Masukkan angka" : "Masukkan angka non-negatif") : undefined}
      onChange={(event) => {
        setText(event.target.value)
        const next = Number(event.target.value)
        if (event.target.value.trim() !== "" && Number.isFinite(next) && (allowNegative || next >= 0)) onChange(next)
      }}
    />
  )
}

function StatusSelect({ value, onChange }: { value: RecoveryAction["action_status"]; onChange: (value: RecoveryAction["action_status"]) => void }) {
  return (
    <select className="field" value={value} onChange={(event) => onChange(event.target.value as RecoveryAction["action_status"])} aria-label="Status">
      {STATUS_ORDER.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABEL[status]}
        </option>
      ))}
    </select>
  )
}

export function OperationalRevenueEditor({ draft, updateDraft }: EditorProps) {
  const dates = operationalDates(draft)
  const [date, setDate] = useState(dates[dates.length - 1] || draft.dashboard_settings.reporting_date)
  const [stream, setStream] = useState<StreamId>("tower")
  const lines = draft.operational_lines
    .filter((line) => line.reporting_date === date && line.stream === stream)
    .sort((a, b) => a.display_order - b.display_order)
  const depth = (line: OperationalLine): number => {
    const parent = lines.find((item) => item.id === line.parent_id)
    return parent ? depth(parent) + 1 : 0
  }
  // Depth-first order so children render beneath their group
  const ordered: OperationalLine[] = []
  const walk = (parent: string | null) =>
    lines.filter((line) => line.parent_id === parent).forEach((line) => {
      ordered.push(line)
      walk(line.id)
    })
  walk(null)
  const patch = (id: string, values: Partial<OperationalLine>) => {
    const next = structuredClone(draft)
    Object.assign(
      next.operational_lines.find(
        (line) => line.id === id && line.reporting_date === date,
      )!,
      values,
    )
    updateDraft(next)
  }
  const addItem = (group: OperationalLine) => {
    const label = window.prompt(`Nama item baru di bawah "${group.label}":`)
    if (!label?.trim()) return
    const next = structuredClone(draft)
    next.operational_lines.push({
      ...group,
      id: uid("op"),
      parent_id: group.id,
      label: label.trim(),
      is_group: false,
      radir: 0,
      actual: 0,
      display_order: Math.max(...draft.operational_lines.map((line) => line.display_order)) + 1,
      status: "Not Started",
      pic: "",
      deadline: "",
      comment: "",
    })
    updateDraft(next)
  }
  const remove = (line: OperationalLine) => {
    if (!window.confirm(`Hapus item "${line.label}"? Total stream dan unit akan berubah.`)) return
    const next = structuredClone(draft)
    next.operational_lines = next.operational_lines.filter(
      (item) =>
        item.id !== line.id || item.reporting_date !== line.reporting_date,
    )
    updateDraft(next)
  }
  const leafSum = (field: "radir" | "actual") => lines.filter((line) => !line.is_group).reduce((sum, line) => sum + line[field], 0)
  const allowNegative = (line: OperationalLine) => {
    const parent = lines.find((item) => item.id === line.parent_id)
    return Boolean(parent?.label.toLowerCase().includes("adjustment"))
  }
  return (
    <div>
      <Title title="Operational Revenue" subtitle="Edit item leaf per stream. Subtotal grup dan total stream terkunci dan dihitung otomatis." />
      <div className="editor-toolbar">
        <div className="toolbar-fields">
          <label>
            Tanggal operasional
            <select className="field" value={date} onChange={(event) => setDate(event.target.value)}>
              {dates.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Stream
            <select className="field" value={stream} onChange={(event) => setStream(event.target.value as StreamId)}>
              {STREAMS.map((item) => (
                <option key={item} value={item}>
                  {STREAM_META[item].title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="summary-chip">
          <span>RADIR / Aktual</span>
          <strong>
            {formatAmount(leafSum("radir"))} / {formatAmount(leafSum("actual"))}
          </strong>
        </div>
      </div>
      <div className="editor-table-card">
        <table className="editor-table">
          <thead>
            <tr>
              <th>KOMPONEN</th>
              <th>RADIR</th>
              <th>AKTUAL</th>
              <th>STATUS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((line) => (
              <tr key={`${line.id}-${date}`} className={line.is_group ? "locked-row" : ""}>
                <td style={{ paddingLeft: 16 + depth(line) * 20 }}>
                  <input className="field" value={line.label} onChange={(event) => patch(line.id, { label: event.target.value })} aria-label="Nama komponen" />
                  <small>{line.id}</small>
                </td>
                {line.is_group ? (
                  <>
                    <td>{formatAmount(lineValue(lines, line, "radir"))}</td>
                    <td>{formatAmount(lineValue(lines, line, "actual"))}</td>
                    <td>
                      <span className="lock-pill">Subtotal otomatis</span>
                    </td>
                    <td>
                      <button type="button" className="button button-secondary" onClick={() => addItem(line)}>
                        + Item
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>
                      <NumberCell value={line.radir} allowNegative={allowNegative(line)} onChange={(value) => patch(line.id, { radir: value })} />
                    </td>
                    <td>
                      <NumberCell value={line.actual} allowNegative={allowNegative(line)} onChange={(value) => patch(line.id, { actual: value })} />
                    </td>
                    <td>
                      <StatusSelect value={line.status} onChange={(value) => patch(line.id, { status: value })} />
                    </td>
                    <td>
                      <button type="button" className="button button-ghost" onClick={() => remove(line)}>
                        Hapus
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function BaseComponentEditor({ draft, updateDraft }: EditorProps) {
  const dates = [...new Set(draft.base_components.map((item) => item.reporting_date))].sort()
  const [date, setDate] = useState(dates[dates.length - 1] || "")
  const metrics = calculateMetrics(draft, date)
  const rows = draft.base_components.filter((item) => item.reporting_date === date)
  const unitName = (id: string) => draft.business_units.find((unit) => unit.id === id)?.name || id
  const opFor = (unitId: string) =>
    draft.operational_lines
      .filter((line) => !line.is_group && line.reporting_date === date && line.business_unit_id === unitId)
      .reduce((sum, line) => sum + line.actual, 0)
  const patch = (id: string, amount: number) => {
    const next = structuredClone(draft)
    next.base_components.find((item) => item.id === id)!.amount = amount
    updateDraft(next)
  }
  return (
    <div>
      <Title title="Revenue Base Components" subtitle="Unit penuh = Base + Operasional. Hanya Base yang dapat diedit — agregat tidak pernah disimpan." />
      <div className="editor-toolbar">
        <label>
          Tanggal pelaporan
          <select className="field" value={date} onChange={(event) => setDate(event.target.value)}>
            {dates.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="summary-chip">
          <span>Total MITRATEL</span>
          <strong>{formatAmount(metrics.actual)}</strong>
        </div>
      </div>
      <div className="editor-table-card">
        <table className="editor-table">
          <thead>
            <tr>
              <th>UNIT</th>
              <th>BASE REVENUE</th>
              <th>OPERASIONAL</th>
              <th>UNIT PENUH</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{unitName(row.business_unit_id)}</strong>
                  <small>{row.label}</small>
                </td>
                <td>
                  <NumberCell value={row.amount} onChange={(value) => patch(row.id, value)} />
                </td>
                <td>{formatAmount(opFor(row.business_unit_id))}</td>
                <td>
                  <strong>{formatAmount(metrics.actualFor(date, row.business_unit_id))}</strong>
                </td>
              </tr>
            ))}
            <tr className="locked-row">
              <td>
                <strong>DITBIS</strong>
                <small>MSA + Power Service</small>
              </td>
              <td colSpan={2}>
                <span className="lock-pill">Dihitung otomatis</span>
              </td>
              <td>
                <strong>{formatAmount(metrics.actualFor(date, "bu-ditbis"))}</strong>
              </td>
            </tr>
            <tr className="total-edit-row">
              <td>
                <strong>TOTAL MITRATEL</strong>
              </td>
              <td colSpan={2}>
                <span className="lock-pill">Dihitung otomatis</span>
              </td>
              <td>
                <strong>{formatAmount(metrics.actual)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

const KIND_LABEL: Record<string, string> = {
  task: "Action tracker stream",
  priority: "Key Recovery Actions",
  progress: "Progress PYMHD",
  summary: "Highlight Executive Overview",
}

export function RecoveryActionsEditor({
  draft,
  updateDraft,
  date,
  setDate,
}: EditorProps & {
  date: string
  setDate: (date: string) => void
}) {
  const groups = ["priority", "task", "progress", "summary"]
  const dates = [
    ...new Set(
      draft.revenue_snapshots.map((snapshot) => snapshot.reporting_date),
    ),
  ].sort()
  const kindOf = (action: RecoveryAction) => action.kind || "summary"
  const patch = (id: string, values: Partial<RecoveryAction>) => {
    const next = structuredClone(draft)
    Object.assign(next.recovery_actions.find((action) => action.id === id)!, values)
    updateDraft(next)
  }
  const add = (kind: string) => {
    const next = structuredClone(draft)
    next.recovery_actions.push({
      id: uid("action"),
      reporting_date: date,
      business_unit_id: "bu-msa",
      issue_title: "Aksi baru",
      description: "",
      responsible_pic: "",
      action_status: "Not Started",
      target_date: "",
      estimated_revenue_impact: 0,
      latest_update: "",
      notes: "",
      kind: kind === "summary" ? undefined : (kind as RecoveryAction["kind"]),
      stream: kind === "progress" ? "pymhd" : "tower",
      operational_line_id:
        kind === "task"
          ? draft.operational_lines.find(
              (line) =>
                line.stream === "tower" &&
                line.reporting_date === date,
            )?.id
          : undefined,
      priority:
        kind === "priority"
          ? `P${
              draft.recovery_actions.filter(
                (action) =>
                  action.reporting_date === date &&
                  action.kind === "priority",
              ).length + 1
            }`
          : undefined,
    })
    updateDraft(next)
  }
  const remove = (action: RecoveryAction) => {
    if (draft.recovery_actions.length <= 1) return
    if (!window.confirm(`Hapus aksi "${action.issue_title}"?`)) return
    const next = structuredClone(draft)
    next.recovery_actions = next.recovery_actions.filter((item) => item.id !== action.id)
    updateDraft(next)
  }
  return (
    <div>
      <Title title="Recovery Actions" subtitle={`PIC, target, status, estimasi recovery, update, dan catatan. Kosong ditampilkan sebagai "${EMPTY_LABEL}".`} />
      <div className="editor-toolbar">
        <label>
          Tanggal pelaporan
          <select
            className="field"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          >
            {dates.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      {groups.map((kind) => {
        const actions = draft.recovery_actions.filter(
          (action) =>
            action.reporting_date === date && kindOf(action) === kind,
        )
        return (
          <div className="editor-group" key={kind}>
            <div className="editor-group-head">
              <h3>{KIND_LABEL[kind]}</h3>
              {(kind !== "summary" || actions.length === 0) && (
                <button type="button" className="button button-secondary" onClick={() => add(kind)}>
                  + Tambah
                </button>
              )}
            </div>
            <div className="editor-table-card">
              <table className="editor-table compact">
                <thead>
                  <tr>
                    {kind === "priority" && <th>PRIO</th>}
                    <th>AKSI</th>
                    {kind !== "progress" && <th>STREAM</th>}
                    {kind === "task" && <th>ITEM TERKAIT</th>}
                    <th>PIC</th>
                    <th>STATUS</th>
                    <th>TARGET</th>
                    {kind !== "task" && kind !== "progress" && <th>EST. RECOVERY</th>}
                    <th>UPDATE / CATATAN</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((action) => (
                    <tr key={action.id}>
                      {kind === "priority" && (
                        <td>
                          <input className="field short" value={action.priority || ""} onChange={(event) => patch(action.id, { priority: event.target.value })} aria-label="Prioritas" />
                        </td>
                      )}
                      <td>
                        <input className="field" value={action.issue_title} onChange={(event) => patch(action.id, { issue_title: event.target.value })} aria-label="Judul aksi" />
                      </td>
                      {kind !== "progress" && (
                        <td>
                          <select
                            className="field"
                            value={action.stream || ""}
                            onChange={(event) => {
                              const stream = event.target.value as StreamId
                              const firstLine = draft.operational_lines.find(
                                (line) =>
                                  line.stream === stream &&
                                  line.reporting_date === date,
                              )
                              patch(action.id, {
                                stream,
                                ...(kind === "task"
                                  ? { operational_line_id: firstLine?.id }
                                  : {}),
                              })
                            }}
                            aria-label="Stream"
                          >
                            {kind === "summary" && <option value="">—</option>}
                            {STREAMS.map((item) => (
                              <option key={item} value={item}>
                                {STREAM_META[item].owner}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                      {kind === "task" && (
                        <td>
                          <select
                            className="field"
                            value={action.operational_line_id || ""}
                            onChange={(event) =>
                              patch(action.id, {
                                operational_line_id: event.target.value,
                              })
                            }
                            aria-label="Item terkait"
                          >
                            <option value="">Pilih item</option>
                            {draft.operational_lines
                              .filter(
                                (line) =>
                                  line.stream === action.stream &&
                                  line.reporting_date === date,
                              )
                              .sort(
                                (a, b) => a.display_order - b.display_order,
                              )
                              .map((line) => (
                                <option key={line.id} value={line.id}>
                                  {line.label}
                                </option>
                              ))}
                          </select>
                        </td>
                      )}
                      <td>
                        <input className="field" value={action.responsible_pic} placeholder={EMPTY_LABEL} onChange={(event) => patch(action.id, { responsible_pic: event.target.value })} aria-label="PIC" />
                      </td>
                      <td>
                        <StatusSelect value={action.action_status} onChange={(value) => patch(action.id, { action_status: value })} />
                      </td>
                      <td>
                        <input className="field" type="date" value={action.target_date} onChange={(event) => patch(action.id, { target_date: event.target.value })} aria-label="Target" />
                      </td>
                      {kind !== "task" && kind !== "progress" && (
                        <td>
                          <NumberCell value={action.estimated_revenue_impact} onChange={(value) => patch(action.id, { estimated_revenue_impact: value })} />
                        </td>
                      )}
                      <td>
                        <input className="field" value={action.latest_update} placeholder="Update terakhir" onChange={(event) => patch(action.id, { latest_update: event.target.value })} aria-label="Update terakhir" />
                        <input className="field note-field" value={action.notes || ""} placeholder="Catatan" onChange={(event) => patch(action.id, { notes: event.target.value })} aria-label="Catatan" />
                      </td>
                      <td>
                        {kind !== "summary" && (
                          <button type="button" className="button button-ghost" onClick={() => remove(action)}>
                            Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function PipelineEditor({
  draft,
  updateDraft,
  pipeline,
  date,
  setDate,
}: EditorProps & {
  pipeline: PipelineRecord["pipeline"]
  date: string
  setDate: (date: string) => void
}) {
  const dates = [
    ...new Set(
      draft.revenue_snapshots.map((snapshot) => snapshot.reporting_date),
    ),
  ].sort()
  const records = draft.pipeline_records.filter(
    (record) =>
      record.pipeline === pipeline && record.reporting_date === date,
  )
  const value = records.reduce((sum, record) => sum + record.potential, 0)
  const pid = records.reduce((sum, record) => sum + record.pid_count, 0)
  const reported =
    draft.pipeline_meta.pymhd_reported_pid_total_by_date?.[date] ??
    draft.pipeline_meta.pymhd_reported_pid_total
  const isPymhd = pipeline === "PYMHD"
  const patch = (id: string, values: Partial<PipelineRecord>) => {
    const next = structuredClone(draft)
    Object.assign(next.pipeline_records.find((record) => record.id === id)!, values)
    updateDraft(next)
  }
  const add = () => {
    const next = structuredClone(draft)
    next.pipeline_records.push({
      id: uid(pipeline.toLowerCase()),
      reporting_date: date,
      pipeline,
      label: isPymhd ? `Sales ${records.length + 1}` : `P${records.length + 1}`,
      category: isPymhd ? "Sales" : `Prioritas ${records.length + 1}`,
      potential: 0,
      pid_count: 0,
      status: "Not Started",
      pic: "",
      expected_date: "",
      notes: "",
    })
    updateDraft(next)
  }
  const remove = (record: PipelineRecord) => {
    if (!window.confirm(`Hapus record pipeline "${record.label}"?`)) return
    const next = structuredClone(draft)
    next.pipeline_records = next.pipeline_records.filter((item) => item.id !== record.id)
    updateDraft(next)
  }
  return (
    <div>
      <Title
        title={`${pipeline} Pipeline`}
        subtitle="Pipeline adalah potensi revenue — tidak pernah dibukukan sebagai aktual."
        action={
          <button type="button" className="button button-primary" onClick={add}>
            + Tambah Record
          </button>
        }
      />
      {isPymhd && (
        <div className={`pid-check ${pid === reported ? "ok" : ""}`}>
          <div>
            <strong>{pid === reported ? "Total PID konsisten" : "Inkonsistensi data sumber"}</strong>
            <p>
              Total PID terhitung dari baris Sales: <b>{formatAmount(pid)}</b> · Total PID dilaporkan sumber: <b>{formatAmount(reported)}</b>
              {pid !== reported && ` · selisih ${formatAmount(reported - pid)} PID. Kedua angka ditampilkan terpisah; tidak ada yang ditimpa.`}
            </p>
          </div>
          <label>
            Total PID dilaporkan
            <NumberCell
              value={reported}
              onChange={(next) => {
                const copy = structuredClone(draft)
                copy.pipeline_meta.pymhd_reported_pid_total_by_date ??= {}
                copy.pipeline_meta.pymhd_reported_pid_total_by_date[date] =
                  next
                updateDraft(copy)
              }}
            />
          </label>
        </div>
      )}
      <div className="editor-toolbar">
        <label>
          Tanggal pelaporan
          <select
            className="field"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          >
            {dates.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="summary-chip">
          <span>Total potensi</span>
          <strong>{formatAmount(value)}</strong>
        </div>
      </div>
      <div className="editor-table-card">
        <table className="editor-table compact">
          <thead>
            <tr>
              <th>LABEL</th>
              <th>KATEGORI</th>
              {isPymhd && <th>PID</th>}
              <th>POTENSI</th>
              <th>STATUS</th>
              <th>PIC</th>
              <th>EXPECTED</th>
              <th>CATATAN</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>
                  <input className="field short" value={record.label} onChange={(event) => patch(record.id, { label: event.target.value })} aria-label="Label" />
                </td>
                <td>
                  <input className="field" value={record.category} onChange={(event) => patch(record.id, { category: event.target.value })} aria-label="Kategori" />
                </td>
                {isPymhd && (
                  <td>
                    <NumberCell value={record.pid_count} onChange={(next) => patch(record.id, { pid_count: next })} />
                  </td>
                )}
                <td>
                  <NumberCell value={record.potential} onChange={(next) => patch(record.id, { potential: next })} />
                </td>
                <td>
                  <StatusSelect value={record.status} onChange={(next) => patch(record.id, { status: next })} />
                </td>
                <td>
                  <input className="field" value={record.pic} placeholder={EMPTY_LABEL} onChange={(event) => patch(record.id, { pic: event.target.value })} aria-label="PIC" />
                </td>
                <td>
                  <input className="field" type="date" value={record.expected_date} onChange={(event) => patch(record.id, { expected_date: event.target.value })} aria-label="Expected date" />
                </td>
                <td>
                  <input className="field" value={record.notes} placeholder="—" onChange={(event) => patch(record.id, { notes: event.target.value })} aria-label="Catatan" />
                </td>
                <td>
                  <button type="button" className="button button-ghost" onClick={() => remove(record)}>
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

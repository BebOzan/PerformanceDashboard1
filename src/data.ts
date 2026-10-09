export type BusinessUnit = {
  id: string
  code: string
  name: string
  directorate: string
  parent_id: string | null
  category: string
  display_order: number
  is_subtotal: boolean
  active: boolean
}

export type RevenueSnapshot = {
  id: string
  reporting_date: string
  fiscal_year: number
  quarter: string
  period_type: string
  business_unit_id: string
  actual_revenue: number
  remarks: string
  updated_at: string
  updated_by: string
}

export type RevenueTarget = {
  id: string
  fiscal_year: number
  quarter: string
  reporting_period: string
  reporting_date: string
  business_unit_id: string
  target_type: "RADIR" | "RKAP"
  target_amount: number
  updated_at: string
}

export type RecoveryAction = {
  id: string
  reporting_date: string
  business_unit_id: string
  issue_title: string
  description: string
  responsible_pic: string
  action_status: "Not Started" | "On Progress" | "Done" | "Blocked"
  target_date: string
  estimated_revenue_impact: number
  latest_update: string
  // Slide 2 extensions — "task" rows belong to a stream card, "priority" rows to Key Recovery Actions
  kind?: "task" | "priority" | "progress"
  stream?: StreamId | "pymhd"
  operational_line_id?: string
  priority?: string
  notes?: string
}

export type StreamId = "tower" | "project" | "managed"

// Operational revenue line. Values live only on leaves; groups are always derived.
export type OperationalLine = {
  id: string
  reporting_date: string
  stream: StreamId
  business_unit_id: string
  parent_id: string | null
  label: string
  is_group: boolean
  radir: number
  actual: number
  display_order: number
  status: "Not Started" | "On Progress" | "Done" | "Blocked"
  pic: string
  deadline: string
  comment: string
}

// Non-operational base revenue per unit. Full unit = base + operational leaves.
export type BaseComponent = {
  id: string
  reporting_date: string
  business_unit_id: string
  label: string
  amount: number
}

export type PipelineRecord = {
  id: string
  reporting_date: string
  pipeline: "PDD" | "PYMHD"
  label: string
  category: string
  potential: number
  pid_count: number
  status: "Not Started" | "On Progress" | "Done" | "Blocked"
  pic: string
  expected_date: string
  notes: string
}

export type DashboardSettings = {
  id: string
  company_name: string
  report_title: string
  reporting_date: string
  currency_unit: string
  decimal_precision: number
  positive_color: string
  negative_color: string
  logo_asset_url: string
  theme: string
  visible_kpis: string[]
}

export type AuditLog = {
  id: string
  entity_name: string
  record_id: string
  action: string
  previous_value: unknown
  new_value: unknown
  changed_by: string
  changed_at: string
}

export type DashboardData = {
  data_version?: number
  business_units: BusinessUnit[]
  revenue_snapshots: RevenueSnapshot[]
  revenue_targets: RevenueTarget[]
  recovery_actions: RecoveryAction[]
  operational_lines: OperationalLine[]
  base_components: BaseComponent[]
  pipeline_records: PipelineRecord[]
  pipeline_meta: {
    pymhd_reported_pid_total: number
    pymhd_reported_pid_total_by_date?: Record<string, number>
  }
  dashboard_settings: DashboardSettings
  audit_logs: AuditLog[]
}

const updatedAt = "2026-10-07T09:00:00.000Z"

type LineSeed = [string, string | null, string, number, number, boolean?]
const lineSeeds: Record<StreamId, { unit: string; rows: LineSeed[] }[]> = {
  tower: [
    {
      unit: "bu-msa",
      rows: [
        ["op-msa", null, "MSA Operasional", 0, 0, true],
        ["op-msa-recurring", "op-msa", "Recurring", 0, 0, true],
        ["op-recurring-mtel", "op-msa-recurring", "MTEL (Tower, Fiber, Reseller)", 630777, 630777],
        ["op-recurring-pst", "op-msa-recurring", "ex-PST (Tower Only)", 19736, 19736],
        ["op-recurring-umt", "op-msa-recurring", "ex-UMT (Fiber)", 10389, 10389],
        ["op-msa-netadd", "op-msa", "Net Add", 0, 0, true],
        ["op-na-bakti", "op-msa-netadd", "BAKTI", 7000, 6916],
        ["op-na-sarpen", "op-msa-netadd", "Sarpen Telkomsel", 8637, 8637],
        ["op-na-iplh-cada", "op-msa-netadd", "IPLH Cada", 5000, 5584],
        ["op-na-fitt", "op-msa-netadd", "FITT", 10500, 10189],
        ["op-na-iplh-tower", "op-msa-netadd", "IPLH Tower", 0, 2300],
        ["op-msa-adj", "op-msa", "Adjustment", 0, 0, true],
        ["op-adj-cn-ioh", "op-msa-adj", "CN IOH", -6000, -9148],
        ["op-adj-foc-ioh", "op-msa-adj", "FOC IOH", -2000, -1600],
        ["op-adj-nde", "op-msa-adj", "NDE", -17000, -22019],
      ],
    },
    { unit: "bu-power", rows: [["op-power", null, "Power Operasional", 8518, 8518]] },
  ],
  project: [
    {
      unit: "bu-diraset",
      rows: [
        ["op-trb-telkom", null, "TRB Telkom", 0, 0, true],
        ["op-pj-khs-nodeb", "op-trb-telkom", "Project KHS Node B TIF", 2030, 2640],
        ["op-pj-radioip-tif-a", "op-trb-telkom", "Redeployment Radio IP TIF (A)", 4517, 1800],
        ["op-pj-radioip-tif-b", "op-trb-telkom", "Redeployment Radio IP TIF (B)", 636, 0],
        ["op-pj-assessment", "op-trb-telkom", "Project Assessment TLT & TSO", 197, 198],
        ["op-trb-others", null, "TRB Others", 0, 0, true],
        ["op-pj-peruri", "op-trb-others", "Project Peruri", 1219, 1219],
        ["op-pj-genset", "op-trb-others", "Overhaul Genset Huawei", 1330, 1330],
        ["op-pj-huawei-te", "op-trb-others", "Huawei TE", 2231, 2231],
        ["op-pj-converter-pal", "op-trb-others", "Pengadaan Converter PT PAL", 3000, 0],
        ["op-pj-radioip-amnt", "op-trb-others", "Redeployment Radio IP PT AMNT", 297, 297],
      ],
    },
  ],
  managed: [
    {
      unit: "bu-diropbang",
      rows: [
        ["op-ms-telkom", null, "MS Telkom", 0, 0, true],
        ["op-ms-bravo", "op-ms-telkom", "MS Bravo", 14410, 14410],
        ["op-ms-romeo-a", "op-ms-telkom", "MS Romeo (Item A)", 3668, 3668],
        ["op-ms-romeo-b", "op-ms-telkom", "MS Romeo (Item B)", 3267, 3267],
        ["op-ms-spms", "op-ms-telkom", "MS SPMS", 1855, 1855],
        ["op-ms-addwork", null, "MS Mitra Addwork", 0, 0, true],
        ["op-aw-romeo", "op-ms-addwork", "Addwork Romeo", 4036, 3351],
        ["op-aw-spms-nodeb", "op-ms-addwork", "Addwork SPMS Node-B", 6110, 7228],
        ["op-aw-tsa", "op-ms-addwork", "Addwork TSA", 10268, 10268],
      ],
    },
  ],
}

const seedLinesForDate = (reportingDate: string): OperationalLine[] =>
  (Object.keys(lineSeeds) as StreamId[])
    .flatMap((stream) =>
      lineSeeds[stream].flatMap(({ unit, rows }) =>
        rows.map(([id, parent, label, radir, actual, group], index) => ({
          id,
          reporting_date: reportingDate,
          stream,
          business_unit_id: unit,
          parent_id: parent,
          label,
          is_group: Boolean(group),
          radir,
          actual,
          display_order: index + 1,
          status: (group ? "On Progress" : actual >= radir ? "Done" : "On Progress") as OperationalLine["status"],
          pic: "",
          deadline: "",
          comment: "",
        })),
      ),
    )
    .map((line, index) => ({ ...line, display_order: index + 1 }))

const seedLines: OperationalLine[] = [
  ...seedLinesForDate("2026-10-05"),
  ...seedLinesForDate("2026-10-06"),
  ...seedLinesForDate("2026-10-07"),
]

const seedBase: BaseComponent[] = [
  ["2026-10-05", "bu-msa", 5824306],
  ["2026-10-05", "bu-power", 67457],
  ["2026-10-05", "bu-diraset", 88992],
  ["2026-10-05", "bu-diropbang", 200282],
  ["2026-10-06", "bu-msa", 5824306],
  ["2026-10-06", "bu-power", 67457],
  ["2026-10-06", "bu-diraset", 88992],
  ["2026-10-06", "bu-diropbang", 200282],
  ["2026-10-07", "bu-msa", 5824890],
  ["2026-10-07", "bu-power", 67457],
  ["2026-10-07", "bu-diraset", 88992],
  ["2026-10-07", "bu-diropbang", 200282],
].map(([date, unit, amount]) => ({
  id: `base-${String(unit).replace("bu-", "")}-${date}`,
  reporting_date: String(date),
  business_unit_id: String(unit),
  label: "Base Revenue / Reconciliation Component",
  amount: Number(amount),
}))

const taskSeeds: [
  string,
  StreamId,
  string,
  string,
  RecoveryAction["action_status"],
][] = [
  ["task-tower-1", "tower", "Proses konfirmasi by Sales untuk recurring.", "op-msa-recurring", "Done"],
  ["task-tower-2", "tower", "Sudah di SD: sirkulir BA internal.", "op-na-bakti", "On Progress"],
  ["task-tower-3", "tower", "On going rekon dengan TIF.", "op-na-fitt", "On Progress"],
  ["task-tower-4", "tower", "BA sirkulir di DMS.", "op-adj-nde", "Done"],
  ["task-tower-5", "tower", "Sudah di SD (blok request biliset untuk revisi nilai).", "op-adj-nde", "On Progress"],
  ["task-project-6", "project", "Penyusunan BAUT & BAST.", "op-pj-khs-nodeb", "Done"],
  ["task-project-7", "project", "BAUT approved, next koordinasi dengan SBD.", "op-pj-radioip-tif-a", "On Progress"],
  ["task-project-8", "project", "Review BAPP oleh TLT.", "op-pj-radioip-tif-b", "On Progress"],
  ["task-project-9", "project", "Revisi BA, ada perubahan pejabat Peruri.", "op-pj-peruri", "On Progress"],
  ["task-project-10", "project", "Proses account invoicing.", "op-pj-converter-pal", "On Progress"],
  ["task-project-assessment", "project", "Revisi dokumen BAST, BAUT, dan BAPP.", "op-pj-assessment", "On Progress"],
  ["task-managed-11", "managed", "Recurring di SD.", "op-ms-telkom", "Done"],
  ["task-managed-12", "managed", "Done email pengajuan pencatatan manual ke SBD.", "op-aw-romeo", "On Progress"],
  ["task-managed-13", "managed", "Proses upload SD.", "op-aw-spms-nodeb", "On Progress"],
  ["task-managed-14", "managed", "Done email pengajuan pencatatan manual ke SBD.", "op-aw-tsa", "On Progress"],
]
const streamUnit: Record<StreamId, string> = {
  tower: "bu-msa",
  project: "bu-diraset",
  managed: "bu-diropbang",
}
const blankAction = {
  reporting_date: "2026-10-07",
  description: "",
  responsible_pic: "",
  action_status: "On Progress" as const,
  target_date: "",
  estimated_revenue_impact: 0,
  latest_update: "",
  notes: "",
}
const seedActions: RecoveryAction[] = [
  ...taskSeeds.map(([id, stream, title, operationalLineId, status]) => ({
    ...blankAction,
    id,
    business_unit_id: streamUnit[stream],
    issue_title: title,
    action_status: status,
    kind: "task" as const,
    stream,
    operational_line_id: operationalLineId,
  })),
  ...(
    [
      ["P1", "tower", "Tower & Recurring"],
      ["P2", "project", "Project Solution"],
      ["P3", "managed", "Managed Services"],
    ] as [string, StreamId, string][]
  ).map(([priority, stream, title]) => ({
    ...blankAction,
    id: `priority-${priority.toLowerCase()}`,
    business_unit_id: streamUnit[stream],
    issue_title: title,
    kind: "priority" as const,
    stream,
    priority,
  })),
  ...["On check to billset", "Coordination with Sales", "Revenue recognition monitoring"].map(
    (title, index) => ({
      ...blankAction,
      id: `pymhd-progress-${index + 1}`,
      business_unit_id: "bu-msa",
      issue_title: title,
      kind: "progress" as const,
      stream: "pymhd" as const,
    }),
  ),
]

const executiveActionSeed: RecoveryAction = {
  id: "action-1",
  reporting_date: "2026-10-07",
  business_unit_id: "bu-diraset",
  issue_title: "Percepatan Project Solution",
  description:
    "Prioritaskan recurring, project pipeline, dan administrasi revenue.",
  responsible_pic: "VP Asset",
  action_status: "On Progress",
  target_date: "2026-10-15",
  estimated_revenue_impact: 6000,
  latest_update: "Koordinasi lintas fungsi berjalan.",
}

export function copyRecoveryActionsForDate(
  actions: RecoveryAction[],
  sourceDate: string,
  targetDate: string,
) {
  return actions
    .filter((action) => action.reporting_date === sourceDate)
    .map((action, index) => ({
      ...action,
      id: `${action.id}-copy-${targetDate}-${index + 1}`,
      reporting_date: targetDate,
    }))
}

const recoveryActionSeeds = [executiveActionSeed, ...seedActions]

const pipelineBlank = {
  reporting_date: "2026-10-07",
  status: "On Progress" as const,
  pic: "",
  expected_date: "",
  notes: "",
}
const seedPipelineForLatestDate: PipelineRecord[] = [
  { ...pipelineBlank, id: "pdd-p1", pipeline: "PDD", label: "P1", category: "Prioritas 1", potential: 2851, pid_count: 0 },
  { ...pipelineBlank, id: "pdd-p2", pipeline: "PDD", label: "P2", category: "Prioritas 2", potential: 11578, pid_count: 0 },
  { ...pipelineBlank, id: "pdd-p3", pipeline: "PDD", label: "P3", category: "Prioritas 3", potential: 33465, pid_count: 0 },
  { ...pipelineBlank, id: "pymhd-sales-1", pipeline: "PYMHD", label: "Sales 1", category: "Sales", potential: 3233, pid_count: 35 },
  { ...pipelineBlank, id: "pymhd-sales-2", pipeline: "PYMHD", label: "Sales 2", category: "Sales", potential: 17947, pid_count: 57 },
  { ...pipelineBlank, id: "pymhd-sales-3", pipeline: "PYMHD", label: "Sales 3", category: "Sales", potential: 1607, pid_count: 64 },
]

export function copyPipelineRecordsForDate(
  records: PipelineRecord[],
  sourceDate: string,
  targetDate: string,
) {
  return records
    .filter((record) => record.reporting_date === sourceDate)
    .map((record, index) => ({
      ...record,
      id: `${record.id}-copy-${targetDate}-${index + 1}`,
      reporting_date: targetDate,
    }))
}

const seedPipeline = [
  ...seedPipelineForLatestDate,
  ...copyPipelineRecordsForDate(
    seedPipelineForLatestDate,
    "2026-10-07",
    "2026-10-05",
  ),
  ...copyPipelineRecordsForDate(
    seedPipelineForLatestDate,
    "2026-10-07",
    "2026-10-06",
  ),
]

export const initialData: DashboardData = {
  data_version: 8,
  business_units: [
    {
      id: "bu-msa",
      code: "MSA",
      name: "MSA",
      directorate: "DITBIS",
      parent_id: "bu-ditbis",
      category: "Recurring",
      display_order: 1,
      is_subtotal: false,
      active: true,
    },
    {
      id: "bu-power",
      code: "POWER",
      name: "Power Service",
      directorate: "DITBIS",
      parent_id: "bu-ditbis",
      category: "Service",
      display_order: 2,
      is_subtotal: false,
      active: true,
    },
    {
      id: "bu-ditbis",
      code: "DITBIS",
      name: "DITBIS",
      directorate: "DITBIS",
      parent_id: "bu-total",
      category: "Subtotal",
      display_order: 3,
      is_subtotal: true,
      active: true,
    },
    {
      id: "bu-diropbang",
      code: "DITOPBANG",
      name: "DITOPBANG",
      directorate: "DITOPBANG",
      parent_id: "bu-total",
      category: "Managed Service",
      display_order: 4,
      is_subtotal: false,
      active: true,
    },
    {
      id: "bu-diraset",
      code: "DITASET",
      name: "DITASET",
      directorate: "DITASET",
      parent_id: "bu-total",
      category: "Project Solution",
      display_order: 5,
      is_subtotal: false,
      active: true,
    },
    {
      id: "bu-total",
      code: "TOTAL",
      name: "TOTAL MITRATEL",
      directorate: "MITRATEL",
      parent_id: null,
      category: "Total",
      display_order: 6,
      is_subtotal: true,
      active: true,
    },
  ],
  revenue_snapshots: [
    ["2026-10-05", "bu-msa", 6486067],
    ["2026-10-05", "bu-power", 75975],
    ["2026-10-05", "bu-diropbang", 244329],
    ["2026-10-05", "bu-diraset", 98707],
    ["2026-10-06", "bu-msa", 6486067],
    ["2026-10-06", "bu-power", 75975],
    ["2026-10-06", "bu-diropbang", 244329],
    ["2026-10-06", "bu-diraset", 98707],
    ["2026-10-07", "bu-msa", 6486651],
    ["2026-10-07", "bu-power", 75975],
    ["2026-10-07", "bu-diropbang", 244329],
    ["2026-10-07", "bu-diraset", 98707],
  ].map(([date, unit, amount], index) => ({
    id: `snap-${index + 1}`,
    reporting_date: String(date),
    fiscal_year: 2026,
    quarter: "Q3",
    period_type: "YTD",
    business_unit_id: String(unit),
    actual_revenue: Number(amount),
    remarks: "",
    updated_at: updatedAt,
    updated_by: "System Seed",
  })),
  revenue_targets: [
    ["bu-msa", "RADIR", 6491929],
    ["bu-power", "RADIR", 75975],
    ["bu-diropbang", "RADIR", 243896],
    ["bu-diraset", "RADIR", 104449],
    ["bu-total", "RKAP", 6915026],
  ].map(([unit, type, amount], index) => ({
    id: `target-${index + 1}`,
    fiscal_year: 2026,
    quarter: "Q3",
    reporting_period: "YTD",
    reporting_date: "2026-10-07",
    business_unit_id: String(unit),
    target_type: type as "RADIR" | "RKAP",
    target_amount: Number(amount),
    updated_at: updatedAt,
  })),
  recovery_actions: [
    ...recoveryActionSeeds,
    ...copyRecoveryActionsForDate(
      recoveryActionSeeds,
      "2026-10-07",
      "2026-10-05",
    ),
    ...copyRecoveryActionsForDate(
      recoveryActionSeeds,
      "2026-10-07",
      "2026-10-06",
    ),
  ],
  operational_lines: seedLines,
  base_components: seedBase,
  pipeline_records: seedPipeline,
  pipeline_meta: {
    pymhd_reported_pid_total: 676,
    pymhd_reported_pid_total_by_date: {
      "2026-10-05": 676,
      "2026-10-06": 676,
      "2026-10-07": 676,
    },
  },
  dashboard_settings: {
    id: "settings-main",
    company_name: "PT Dayamitra Telekomunikasi Tbk",
    report_title: "UPDATE PROGRESS OL REVENUE YTD Q3 2026",
    reporting_date: "2026-10-07",
    currency_unit: "Juta Rupiah",
    decimal_precision: 0,
    positive_color: "#13A66A",
    negative_color: "#E54855",
    logo_asset_url: "",
    theme: "corporate-blue",
    visible_kpis: ["actual", "radir", "rkap", "growth"],
  },
  audit_logs: [],
}

export const LEAF_IDS = ["bu-msa", "bu-power", "bu-diropbang", "bu-diraset"]

export const formatAmount = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.round(value || 0),
  )

export const formatSigned = (value: number) =>
  `${value >= 0 ? "+" : "−"}${formatAmount(Math.abs(value))}`

export const formatIdAmount = (value: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    Math.round(Math.abs(value || 0)),
  )

export const formatIdPercent = (value: number) =>
  `${(Number.isFinite(value) ? value : 0).toFixed(2).replace(".", ",")}%`

export const formatPercent = (value: number) =>
  `${Number.isFinite(value) ? value.toFixed(2) : "0.00"}%`

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`))

export function calculateMetrics(data: DashboardData, selectedDate: string) {
  const dates = [
    ...new Set(data.revenue_snapshots.map((item) => item.reporting_date)),
  ].sort()
  const selectedIndex = dates.indexOf(selectedDate)
  const previousDate =
    selectedIndex > 0
      ? dates[selectedIndex - 1]
      : dates[Math.max(0, dates.length - 2)]
  // Units with a base component on a date are derived as base + operational leaves;
  // otherwise the stored snapshot is used. Aggregates are always summed from leaves.
  const leafActual = (date: string, unitId: string) => {
    const base = data.base_components.filter(
      (item) => item.reporting_date === date && item.business_unit_id === unitId,
    )
    if (base.length)
      return (
        base.reduce((sum, item) => sum + item.amount, 0) +
        operationalLeaves(data, date, { unitId }).reduce((sum, line) => sum + line.actual, 0)
      )
    return data.revenue_snapshots
      .filter((item) => item.reporting_date === date && item.business_unit_id === unitId)
      .reduce((sum, item) => sum + item.actual_revenue, 0)
  }
  const actualFor = (date: string, unitId?: string): number => {
    if (!unitId) return LEAF_IDS.reduce((sum, id) => sum + leafActual(date, id), 0)
    if (unitId === "bu-ditbis") return leafActual(date, "bu-msa") + leafActual(date, "bu-power")
    if (unitId === "bu-total") return actualFor(date)
    return leafActual(date, unitId)
  }
  const targetFor = (type: "RADIR" | "RKAP", unitId?: string) => {
    if (type === "RADIR" && !unitId) {
      return data.revenue_targets
        .filter(
          (item) =>
            item.target_type === type &&
            LEAF_IDS.includes(item.business_unit_id),
        )
        .reduce((sum, item) => sum + item.target_amount, 0)
    }
    return (
      data.revenue_targets.find(
        (item) =>
          item.target_type === type &&
          (!unitId || item.business_unit_id === unitId),
      )?.target_amount || 0
    )
  }
  const actual = actualFor(selectedDate)
  const previous = actualFor(previousDate)
  const radir = targetFor("RADIR")
  const rkap = targetFor("RKAP", "bu-total")
  const gapRadir = actual - radir
  const gapRkap = actual - rkap
  const growth = actual - previous
  const percent = (difference: number, benchmark: number) =>
    benchmark ? (difference / benchmark) * 100 : 0

  return {
    dates,
    previousDate,
    actual,
    previous,
    radir,
    rkap,
    gapRadir,
    gapRkap,
    growth,
    gapRadirPercent: percent(gapRadir, radir),
    gapRkapPercent: percent(gapRkap, rkap),
    growthPercent: percent(growth, previous),
    radirAttainment: radir ? (actual / radir) * 100 : 0,
    rkapAttainment: rkap ? (actual / rkap) * 100 : 0,
    actualFor,
    targetFor,
  }
}

export function operationalLeaves(
  data: DashboardData,
  date: string,
  filter: { unitId?: string; stream?: StreamId } = {},
) {
  return data.operational_lines.filter(
    (line) =>
      !line.is_group &&
      line.reporting_date === date &&
      (!filter.unitId || line.business_unit_id === filter.unitId) &&
      (!filter.stream || line.stream === filter.stream),
  )
}

// Derived value of any line: leaves return their own value, groups sum descendants
export function lineValue(
  lines: OperationalLine[],
  line: OperationalLine,
  field: "radir" | "actual",
): number {
  if (!line.is_group) return line[field]
  return lines
    .filter((child) => child.parent_id === line.id)
    .reduce((sum, child) => sum + lineValue(lines, child, field), 0)
}

export function operationalDates(data: DashboardData) {
  return [...new Set(data.operational_lines.map((line) => line.reporting_date))].sort()
}

// Operational data falls back to the latest date on or before the selected one
export function operationalDateFor(data: DashboardData, date: string) {
  const dates = operationalDates(data).filter((item) => item <= date)
  return dates[dates.length - 1] || operationalDates(data)[0] || date
}

export function streamTotals(data: DashboardData, date: string, stream: StreamId) {
  const leaves = operationalLeaves(data, date, { stream })
  const radir = leaves.reduce((sum, line) => sum + line.radir, 0)
  const actual = leaves.reduce((sum, line) => sum + line.actual, 0)
  const gap = actual - radir
  return { radir, actual, gap, gapPercent: radir ? (gap / radir) * 100 : 0 }
}

const STORAGE_KEY = "mitratel-revenue-dashboard-v1"
const STORAGE_UPDATED_AT_KEY = `${STORAGE_KEY}-updated-at`

// Add Slide 2 collections to datasets saved or exported before the operational page existed
export function normalizeData(data: DashboardData): DashboardData {
  const next = { ...data }
  next.operational_lines ??= initialData.operational_lines
  const recurring = next.operational_lines.find(
    (line) =>
      line.id === "op-msa-recurring" &&
      line.reporting_date === "2026-10-07" &&
      line.stream === "tower",
  )
  if (
    recurring &&
    !next.operational_lines.some(
      (line) =>
        line.parent_id === recurring.id &&
        line.reporting_date === recurring.reporting_date,
    )
  ) {
    next.operational_lines = next.operational_lines.map((line) =>
      line === recurring
        ? { ...line, is_group: true, radir: 0, actual: 0 }
        : line,
    )
    next.operational_lines.push(
      {
        ...recurring,
        id: "op-recurring-mtel",
        parent_id: recurring.id,
        label: "MTEL (Tower, Fiber, Reseller)",
        is_group: false,
        radir: 630777,
        actual: 630777,
        display_order: recurring.display_order + 0.1,
      },
      {
        ...recurring,
        id: "op-recurring-pst",
        parent_id: recurring.id,
        label: "ex-PST (Tower Only)",
        is_group: false,
        radir: 19736,
        actual: 19736,
        display_order: recurring.display_order + 0.2,
      },
      {
        ...recurring,
        id: "op-recurring-umt",
        parent_id: recurring.id,
        label: "ex-UMT (Fiber)",
        is_group: false,
        radir: 10389,
        actual: 10389,
        display_order: recurring.display_order + 0.3,
      },
    )
  }
  next.base_components ??= initialData.base_components
  next.pipeline_records ??= initialData.pipeline_records
  next.pipeline_meta ??= initialData.pipeline_meta
  next.recovery_actions ??= []
  // Directorate renames: DIROPBANG → DITOPBANG, DIRASET → DITASET
  const rename = (text: string) => text.replace(/DIROPBANG/g, "DITOPBANG").replace(/DIRASET/g, "DITASET")
  next.business_units = (next.business_units ?? []).map((unit) => ({
    ...unit,
    code: rename(unit.code),
    name: rename(unit.name),
    directorate: rename(unit.directorate),
  }))
  if (!next.recovery_actions.some((action) => action.kind))
    next.recovery_actions = [...next.recovery_actions, ...seedActions]
  if ((next.data_version ?? 0) < 2) {
    next.recovery_actions = [
      ...next.recovery_actions.filter(
        (action) =>
          action.kind !== "task" ||
          !/^task-(tower|project|managed)-/.test(action.id),
      ),
      ...seedActions.filter((action) => action.kind === "task"),
    ]
    next.data_version = 2
  }
  if ((next.data_version ?? 0) < 3) {
    const source = next.revenue_snapshots.filter(
      (snapshot) => snapshot.reporting_date === "2026-10-06",
    )
    if (
      source.length &&
      !next.revenue_snapshots.some(
        (snapshot) => snapshot.reporting_date === "2026-10-05",
      )
    )
      next.revenue_snapshots = [
        ...next.revenue_snapshots,
        ...source.map((snapshot) => ({
          ...snapshot,
          id: `snap-2026-10-05-${snapshot.business_unit_id}`,
          reporting_date: "2026-10-05",
          updated_by: "System Migration",
        })),
      ]
    next.data_version = 3
  }
  if ((next.data_version ?? 0) < 4) {
    const sourceDate = "2026-10-07"
    const targetDate = "2026-10-06"
    const sourceLines = next.operational_lines.filter(
      (line) => line.reporting_date === sourceDate,
    )
    if (
      sourceLines.length &&
      !next.operational_lines.some((line) => line.reporting_date === targetDate)
    )
      next.operational_lines = [
        ...next.operational_lines,
        ...sourceLines.map((line) => ({ ...line, reporting_date: targetDate })),
      ]

    const targetLines = next.operational_lines.filter(
      (line) => line.reporting_date === targetDate && !line.is_group,
    )
    const units = ["bu-msa", "bu-power", "bu-diraset", "bu-diropbang"]
    for (const unitId of units) {
      const snapshot = next.revenue_snapshots.find(
        (item) =>
          item.reporting_date === targetDate &&
          item.business_unit_id === unitId,
      )
      const hasBase = next.base_components.some(
        (item) =>
          item.reporting_date === targetDate &&
          item.business_unit_id === unitId,
      )
      if (!snapshot || hasBase) continue
      const operational = targetLines
        .filter((line) => line.business_unit_id === unitId)
        .reduce((sum, line) => sum + line.actual, 0)
      next.base_components.push({
        id: `base-${unitId.replace("bu-", "")}-${targetDate}`,
        reporting_date: targetDate,
        business_unit_id: unitId,
        label: "Base Revenue / Reconciliation Component",
        amount: snapshot.actual_revenue - operational,
      })
    }
    next.data_version = 4
  }
  if ((next.data_version ?? 0) < 5) {
    const sourceDate = "2026-10-06"
    const targetDate = "2026-10-05"
    const sourceLines = next.operational_lines.filter(
      (line) => line.reporting_date === sourceDate,
    )
    if (
      sourceLines.length &&
      !next.operational_lines.some((line) => line.reporting_date === targetDate)
    )
      next.operational_lines = [
        ...next.operational_lines,
        ...sourceLines.map((line) => ({ ...line, reporting_date: targetDate })),
      ]

    const units = ["bu-msa", "bu-power", "bu-diraset", "bu-diropbang"]
    for (const unitId of units) {
      if (
        next.base_components.some(
          (item) =>
            item.reporting_date === targetDate &&
            item.business_unit_id === unitId,
        )
      )
        continue
      const sourceBase = next.base_components.find(
        (item) =>
          item.reporting_date === sourceDate &&
          item.business_unit_id === unitId,
      )
      const snapshot = next.revenue_snapshots.find(
        (item) =>
          item.reporting_date === targetDate &&
          item.business_unit_id === unitId,
      )
      const operational = next.operational_lines
        .filter(
          (line) =>
            !line.is_group &&
            line.reporting_date === targetDate &&
            line.business_unit_id === unitId,
        )
        .reduce((sum, line) => sum + line.actual, 0)
      const amount =
        sourceBase?.amount ??
        (snapshot ? snapshot.actual_revenue - operational : undefined)
      if (amount === undefined) continue
      next.base_components.push({
        id: `base-${unitId.replace("bu-", "")}-${targetDate}`,
        reporting_date: targetDate,
        business_unit_id: unitId,
        label: "Base Revenue / Reconciliation Component",
        amount,
      })
    }
    next.data_version = 5
  }
  if ((next.data_version ?? 0) < 6) {
    next.recovery_actions = next.recovery_actions.map((action) => ({
      ...action,
      reporting_date:
        action.reporting_date || next.dashboard_settings.reporting_date,
    }))
    next.data_version = 6
  }
  if ((next.data_version ?? 0) < 7) {
    const reportingDates = [
      ...new Set(
        next.revenue_snapshots.map((snapshot) => snapshot.reporting_date),
      ),
    ].sort()
    const actionDates = [
      ...new Set(
        next.recovery_actions.map((action) => action.reporting_date),
      ),
    ].sort()
    const sourceDate = actionDates.includes("2026-10-07")
      ? "2026-10-07"
      : actionDates[actionDates.length - 1]
    if (sourceDate) {
      const sourceActions = next.recovery_actions.filter(
        (action) => action.reporting_date === sourceDate,
      )
      for (const targetDate of reportingDates) {
        if (targetDate === sourceDate) continue
        const targetActions = next.recovery_actions.filter(
          (action) => action.reporting_date === targetDate,
        )
        const missingActions = sourceActions.filter(
          (source) =>
            !targetActions.some((target) => {
              if (target.kind !== source.kind) return false
              if (source.kind === "priority")
                return target.priority === source.priority
              if (source.kind === "task" || source.kind === "progress")
                return (
                  target.issue_title === source.issue_title &&
                  target.stream === source.stream
                )
              return true
            }),
        )
        next.recovery_actions.push(
          ...copyRecoveryActionsForDate(
            missingActions,
            sourceDate,
            targetDate,
          ),
        )
      }
    }
    next.data_version = 7
  }
  if ((next.data_version ?? 0) < 8) {
    next.pipeline_records = next.pipeline_records.map((record) => ({
      ...record,
      reporting_date:
        record.reporting_date || next.dashboard_settings.reporting_date,
    }))
    next.data_version = 8
  }
  // Preserve every existing pipeline row and only backfill missing rows per date.
  const pipelineReportingDates = [
    ...new Set(
      next.revenue_snapshots.map((snapshot) => snapshot.reporting_date),
    ),
  ].sort()
  const pipelineDates = [
    ...new Set(
      next.pipeline_records
        .map((record) => record.reporting_date)
        .filter(Boolean),
    ),
  ].sort()
  const pipelineSourceDate = pipelineDates.includes("2026-10-07")
    ? "2026-10-07"
    : pipelineDates.includes(next.dashboard_settings.reporting_date)
      ? next.dashboard_settings.reporting_date
      : pipelineDates[pipelineDates.length - 1]
  if (pipelineSourceDate) {
    const sourceRecords = next.pipeline_records.filter(
      (record) => record.reporting_date === pipelineSourceDate,
    )
    for (const targetDate of pipelineReportingDates) {
      if (targetDate === pipelineSourceDate) continue
      const targetRecords = next.pipeline_records.filter(
        (record) => record.reporting_date === targetDate,
      )
      const missingRecords = sourceRecords.filter(
        (source) =>
          !targetRecords.some(
            (target) =>
              target.pipeline === source.pipeline &&
              target.label === source.label,
          ),
      )
      next.pipeline_records.push(
        ...copyPipelineRecordsForDate(
          missingRecords,
          pipelineSourceDate,
          targetDate,
        ),
      )
    }
  }
  const reportedPidByDate =
    (next.pipeline_meta.pymhd_reported_pid_total_by_date ??= {})
  for (const date of pipelineReportingDates)
    reportedPidByDate[date] ??=
      next.pipeline_meta.pymhd_reported_pid_total
  next.recovery_actions = next.recovery_actions.map((action) => {
    if (action.kind !== "task") return action
    const seed = seedActions.find(
      (item) =>
        item.kind === "task" &&
        (item.id === action.id ||
          (item.stream === action.stream && item.issue_title === action.issue_title)),
    )
    if (action.operational_line_id) return action
    const fallback = next.operational_lines
      .filter((line) => line.stream === action.stream)
      .sort((a, b) => a.display_order - b.display_order)[0]
    const operationalLineId = seed?.operational_line_id || fallback?.id
    return operationalLineId
      ? { ...action, operational_line_id: operationalLineId }
      : action
  })
  return next
}

export function loadData(): DashboardData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialData
    const parsed: DashboardData = JSON.parse(saved)
    // Migrate the outdated demo RKAP benchmark to the source report value
    parsed.revenue_targets = parsed.revenue_targets.map((target) =>
      target.target_type === "RKAP" &&
      target.business_unit_id === "bu-total" &&
      target.target_amount === 6890003
        ? { ...target, target_amount: 6915026 }
        : target,
    )
    // Shorten the previous seed recovery copy so it fits the highlight row
    parsed.recovery_actions = parsed.recovery_actions.map((action) =>
      action.description ===
      "Prioritaskan penyelesaian isu recurring, project pipeline, dan administrasi revenue."
        ? { ...action, description: "Prioritaskan recurring, project pipeline, dan administrasi revenue." }
        : action,
    )
    return normalizeData(parsed)
  } catch {
    return initialData
  }
}

export function loadDataUpdatedAt() {
  const value = Number(localStorage.getItem(STORAGE_UPDATED_AT_KEY))
  return Number.isFinite(value) ? value : 0
}

export function persistData(data: DashboardData, updatedAt = Date.now()) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  localStorage.setItem(STORAGE_UPDATED_AT_KEY, String(updatedAt))
}

export type ActionStatus = RecoveryAction["action_status"]
export const STATUS_ORDER: ActionStatus[] = ["Not Started", "On Progress", "Done", "Blocked"]
export const STATUS_LABEL: Record<ActionStatus, string> = {
  "Not Started": "Belum Mulai",
  "On Progress": "Proses",
  Done: "Selesai",
  Blocked: "Terkendala",
}
export const STREAM_META: Record<StreamId, { title: string; owner: string; units: string[] }> = {
  tower: { title: "Tower, FO & Power Service", owner: "DITBIS", units: ["bu-msa", "bu-power"] },
  project: { title: "Project Solution", owner: "DITASET", units: ["bu-diraset"] },
  managed: { title: "Managed Services", owner: "DITOPBANG", units: ["bu-diropbang"] },
}
export const EMPTY_LABEL = "Belum ditetapkan"

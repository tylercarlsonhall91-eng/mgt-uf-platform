# MGT User Fee Platform Starter - Data Mapping

This starter maps client-facing screens to the current MGT user fee workbook structure.

## Workbook Tables Identified

| Platform section | Workbook target | Key fields |
|---|---|---|
| Project Setup | `Svc Def!C1:C3` and linked headers | Agency, Department, Fiscal Year |
| Service Definition | `tblSvcDef` on `Svc Def` | I, Ord, Service Name, Annual Volume, Volume Billed, Current Fee, Fee Descr, Group, Subgroup, Include in Report, Notes |
| Personnel / PSA | `tblPSA` on `PSA` | Position Title, # FTE, Annual Wages, productive hour assumptions |
| ICRP | `ICRP` sections B/C | Total cost, Excluded, Allowable Indirect, Allowable Direct |
| Time Estimates | `tblTime` on `Time` | Service I, task, H/M/P time entries by staff position |
| Direct Costs | `tblTotalCost` on `Total Cost` | Materials & Supplies, Indirect Not Elsewhere Captured, annualized direct allocations |
| Recommendations | `tblExecSum` on `Exec Summary` | Recovery Level, Fee @ Policy Level / recommendation override |
| Reports | `Report` template and macro output | One-page service reports |

## Stable Keys

- `I` should be treated as the permanent service or position identifier.
- `Ord` should be treated as a sort/display field.
- The client UI should not allow manual row insertion/deletion inside Excel. The intake layer should add records in the web app and let the integration routine expand tables safely.

## Export Shape

The web app exports a JSON package with:

- `project`
- `data.services`
- `data.staff`
- `data.expenses`
- `data.time`
- `data.direct`
- `data.recommend`
- `preview`

The first production integration should read this JSON and write only into workbook input fields or named tables.

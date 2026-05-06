const STEPS = [
  { key: "project", title: "Project Setup", subtitle: "Agency, department, fiscal year, project contact", mapsTo: "Svc Def top rows / shared header" },
  { key: "services", title: "Service Definition", subtitle: "Service list, volumes, current fees, report inclusion", mapsTo: "tblSvcDef" },
  { key: "staff", title: "Personnel / PSA", subtitle: "Positions, FTE, salary/benefits, productive hours", mapsTo: "tblPSA" },
  { key: "expenses", title: "ICRP", subtitle: "Operating costs, excluded/indirect/direct allocation", mapsTo: "ICRP sections B/C" },
  { key: "time", title: "Time Estimates", subtitle: "Hours, minutes, or annual percentage by service and position", mapsTo: "tblTime" },
  { key: "direct", title: "Direct Costs", subtitle: "Materials, supplies, contractor, cross support, indirect not elsewhere captured", mapsTo: "tblTotalCost" },
  { key: "recommend", title: "Recommendations", subtitle: "Recovery policy and recommended fee review", mapsTo: "tblExecSum inputs" },
  { key: "review", title: "Review & Export", subtitle: "QC flags, preview cost recovery, export package", mapsTo: "Exec Summary / Report" }
];

const defaultState = () => ({
  project: { agency: "", department: "", fiscalYear: new Date().getFullYear(), projectLead: "", clientContact: "", notes: "" },
  services: [],
  staff: [],
  expenses: [],
  time: [],
  direct: [],
  recommend: []
});

let state = loadState();
let activeStep = localStorage.getItem("mgtUfActiveStep") || "project";

const schemas = {
  services: [
    ["id", "I", "number"], ["ord", "Ord", "number"], ["serviceName", "Service Name", "text"], ["annualVolume", "Annual Volume", "number"],
    ["volumeBilled", "Volume Billed", "number"], ["currentFee", "Current Fee", "number"], ["feeDescr", "Fee Description", "text"],
    ["group", "Group", "text"], ["subgroup", "Subgroup", "text"], ["includeInReport", "Include in Report", "boolean"],
    ["notesReport", "Notes for Report", "textarea"], ["notesMgt", "MGT Notes", "textarea"]
  ],
  staff: [
    ["id", "I", "number"], ["ord", "Ord", "number"], ["positionTitle", "Position Title", "text"], ["fte", "# FTE", "number"],
    ["annualWages", "Annual Salary / Benefits", "number"], ["hoursPerFTE", "Hours per FTE", "number"], ["hoursPerDay", "Hours/Day", "number"],
    ["weeksPerYear", "Weeks/Year", "number"], ["vacationDays", "Vacation Days", "number"], ["holidayDays", "Holiday Days", "number"],
    ["sickDays", "Sick Days", "number"], ["mgmtLeaveDays", "Mgt Leave Days", "number"], ["floatingHolidayDays", "Floating Holiday Days", "number"],
    ["trainingDays", "Training Days", "number"], ["meetingHoursWeek", "Meeting Hrs/Wk", "number"], ["breakMinutesDay", "Break Min/Day", "number"],
    ["adminPercent", "Admin %", "number"]
  ],
  expenses: [
    ["id", "I", "number"], ["description", "Cost Description", "text"], ["totalCost", "Total Cost", "number"],
    ["excluded", "Excluded", "number"], ["allowableIndirect", "Allowable Indirect", "number"], ["allowableDirect", "Allowable Direct", "number"]
  ],
  time: [
    ["serviceId", "Service I", "service"], ["positionId", "Position I", "position"], ["task", "Task", "text"],
    ["hours", "Hours", "number"], ["minutes", "Minutes", "number"], ["percentage", "Annual %", "number"]
  ],
  direct: [
    ["serviceId", "Service I", "service"], ["costType", "Cost Type", "text"], ["allocationGroup", "Group", "directGroup"],
    ["amount", "Annual Cost", "number"], ["notes", "Notes", "textarea"]
  ],
  recommend: [
    ["serviceId", "Service I", "service"], ["recoveryLevel", "Recovery Level", "number"], ["recommendedFeeOverride", "Recommended Fee Override", "number"],
    ["policyNotes", "Policy Notes", "textarea"]
  ]
};

function loadState() {
  const raw = localStorage.getItem("mgtUfState");
  if (!raw) return defaultState();
  try { return { ...defaultState(), ...JSON.parse(raw) }; }
  catch { return defaultState(); }
}
function saveState() {
  localStorage.setItem("mgtUfState", JSON.stringify(state));
  localStorage.setItem("mgtUfActiveStep", activeStep);
  updateProgress();
}
function dollars(n) { return Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }); }
function pct(n) { return `${(Number(n || 0) * 100).toFixed(0)}%`; }
function nextId(items) { return (items.reduce((m, x) => Math.max(m, Number(x.id || x.serviceId || 0)), 0) || 0) + 1; }

function init() {
  renderNav();
  render();
  updateProgress();
  document.getElementById("exportBtn").addEventListener("click", exportJson);
  document.getElementById("importInput").addEventListener("change", importJson);
  document.getElementById("loadSampleBtn").addEventListener("click", loadSample);
}

function renderNav() {
  const nav = document.getElementById("tileNav");
  nav.innerHTML = STEPS.map(step => {
    const complete = stepComplete(step.key);
    return `<button class="tile ${activeStep === step.key ? "active" : ""} ${complete ? "complete" : ""}" data-step="${step.key}">
      <div class="tile-title"><span>${step.title}</span><span class="tile-status">${complete ? "✓" : "○"}</span></div>
      <div class="tile-subtitle">${step.subtitle}</div>
      <div class="tile-meta">Maps to: ${step.mapsTo}</div>
    </button>`;
  }).join("");
  nav.querySelectorAll(".tile").forEach(btn => btn.addEventListener("click", () => { activeStep = btn.dataset.step; saveState(); renderNav(); render(); }));
}

function stepComplete(key) {
  if (key === "project") return !!(state.project.agency && state.project.department && state.project.fiscalYear);
  if (key === "review") return state.services.length > 0 && state.staff.length > 0;
  return Array.isArray(state[key]) && state[key].length > 0;
}

function updateProgress() {
  const done = STEPS.filter(s => stepComplete(s.key)).length;
  const percent = Math.round(done / STEPS.length * 100);
  document.getElementById("progressText").textContent = `${percent}% complete`;
  document.getElementById("progressFill").style.width = `${percent}%`;
}

function render() {
  clearAlerts();
  if (activeStep === "project") renderProject();
  else if (activeStep === "review") renderReview();
  else renderTableStep(activeStep);
}

function panel(title, subtitle, body) {
  document.getElementById("view").innerHTML = `<article class="panel"><div class="panel-header"><h2>${title}</h2><p>${subtitle}</p></div><div class="panel-body">${body}</div></article>`;
}

function renderProject() {
  panel("Project Setup", "This is the common header information that should flow to every tab and exported intake file.", `
    <div class="form-grid">
      ${field("agency", "Agency / Client", "text", "e.g., County of Example", state.project.agency)}
      ${field("department", "Department", "text", "e.g., Planning", state.project.department)}
      ${field("fiscalYear", "Fiscal Year", "number", "e.g., 2026", state.project.fiscalYear)}
      ${field("projectLead", "MGT Project Lead", "text", "Name", state.project.projectLead)}
      ${field("clientContact", "Client Contact", "text", "Name / email", state.project.clientContact)}
      <div class="field"><label for="notes">Project Notes</label><textarea id="notes" data-project="notes">${escapeHtml(state.project.notes || "")}</textarea><small>Internal notes are included in the JSON export.</small></div>
    </div>
    <div class="callout" style="margin-top:18px;">Use this starter as an intake layer. The master Excel model remains the calculation source of truth until formulas and macros are formally ported.</div>
  `);
  document.querySelectorAll("[data-project]").forEach(el => el.addEventListener("input", e => { state.project[e.target.dataset.project] = coerce(e.target.value, e.target.type); saveState(); renderNav(); }));
}
function field(key, label, type, placeholder, value) {
  return `<div class="field"><label for="${key}">${label}</label><input id="${key}" data-project="${key}" type="${type}" placeholder="${placeholder}" value="${escapeAttr(value ?? "")}" /></div>`;
}

function renderTableStep(key) {
  const step = STEPS.find(s => s.key === key);
  const help = getStepHelp(key);
  const rows = state[key] || [];
  const body = `
    ${help}
    <div class="section-toolbar"><div><strong>${rows.length}</strong> record${rows.length === 1 ? "" : "s"}</div><button class="btn btn-outline" id="addRowBtn">Add row</button></div>
    ${rows.length ? renderEditorTable(key, rows, schemas[key]) : document.getElementById("emptyStateTemplate").innerHTML}
  `;
  panel(step.title, `${step.subtitle}. Excel mapping: ${step.mapsTo}.`, body);
  document.getElementById("addRowBtn").addEventListener("click", () => addRow(key));
  bindTableEvents(key);
}
function getStepHelp(key) {
  const copy = {
    services: "Service Definition is the base structure. Keep the I value stable and use Ord for sorting or presentation order.",
    staff: "PSA rows should usually be position titles with aggregate FTE and salary/benefit totals, not individual employees unless the project requires it.",
    expenses: "ICRP input is where budgeted operating and cost allocation items are sorted into excluded, allowable indirect, or allowable direct cost buckets.",
    time: "Use hours or minutes for per-unit time. Use annual percentage for program/category costing, not typical unit-cost fees.",
    direct: "Direct costs should be annualized before export. For per-unit materials, multiply by annual volume before loading into the workbook.",
    recommend: "Default recovery is 100%. Lower recovery levels document policy choices or phased implementation."
  };
  return `<div class="callout">${copy[key]}</div>`;
}
function renderEditorTable(key, rows, schema) {
  return `<div class="table-wrap"><table><thead><tr>${schema.map(c => `<th>${c[1]}</th>`).join("")}<th>Actions</th></tr></thead><tbody>${rows.map((row, i) => `<tr data-row="${i}">${schema.map(col => `<td>${cellInput(key, row, col, i)}</td>`).join("")}<td class="row-actions"><button class="btn btn-danger" data-delete="${i}">Delete</button></td></tr>`).join("")}</tbody></table></div>`;
}
function cellInput(key, row, col, rowIndex) {
  const [prop, label, type] = col;
  const val = row[prop] ?? "";
  if (type === "boolean") return `<select data-prop="${prop}" data-row="${rowIndex}"><option value="true" ${val !== false ? "selected" : ""}>TRUE</option><option value="false" ${val === false ? "selected" : ""}>FALSE</option></select>`;
  if (type === "textarea") return `<textarea data-prop="${prop}" data-row="${rowIndex}">${escapeHtml(val)}</textarea>`;
  if (type === "service") return `<select data-prop="${prop}" data-row="${rowIndex}">${state.services.map(s => `<option value="${s.id}" ${Number(val) === Number(s.id) ? "selected" : ""}>${s.id} - ${escapeHtml(s.serviceName || "Unnamed service")}</option>`).join("")}</select>`;
  if (type === "position") return `<select data-prop="${prop}" data-row="${rowIndex}">${state.staff.map(p => `<option value="${p.id}" ${Number(val) === Number(p.id) ? "selected" : ""}>${p.id} - ${escapeHtml(p.positionTitle || "Unnamed position")}</option>`).join("")}</select>`;
  if (type === "directGroup") return `<select data-prop="${prop}" data-row="${rowIndex}"><option value="materials" ${val === "materials" ? "selected" : ""}>Materials & Supplies</option><option value="indirect" ${val === "indirect" ? "selected" : ""}>Indirect Not Elsewhere</option></select>`;
  return `<input data-prop="${prop}" data-row="${rowIndex}" type="${type}" value="${escapeAttr(val)}" />`;
}
function bindTableEvents(key) {
  document.querySelectorAll("[data-prop]").forEach(input => input.addEventListener("input", e => {
    const row = Number(e.target.dataset.row);
    const prop = e.target.dataset.prop;
    const type = schemas[key].find(c => c[0] === prop)?.[2];
    state[key][row][prop] = coerceByType(e.target.value, type);
    saveState(); renderNav();
  }));
  document.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", e => {
    state[key].splice(Number(e.target.dataset.delete), 1);
    saveState(); renderNav(); render();
  }));
}
function addRow(key) {
  const templates = {
    services: () => ({ id: nextId(state.services), ord: nextId(state.services), serviceName: "", annualVolume: 1, volumeBilled: "", currentFee: 0, feeDescr: "Fee", group: "", subgroup: "", includeInReport: true, notesReport: "", notesMgt: "" }),
    staff: () => ({ id: nextId(state.staff), ord: nextId(state.staff), positionTitle: "", fte: 1, annualWages: 0, hoursPerFTE: 2080, hoursPerDay: 8, weeksPerYear: 52, vacationDays: 13, holidayDays: 11, sickDays: 9, mgmtLeaveDays: 0, floatingHolidayDays: 2, trainingDays: 0, meetingHoursWeek: 0, breakMinutesDay: 0, adminPercent: 0 }),
    expenses: () => ({ id: nextId(state.expenses), description: "", totalCost: 0, excluded: 0, allowableIndirect: 0, allowableDirect: 0 }),
    time: () => ({ serviceId: state.services[0]?.id || 1, positionId: state.staff[0]?.id || 1, task: "", hours: 0, minutes: 0, percentage: 0 }),
    direct: () => ({ serviceId: state.services[0]?.id || 1, costType: "", allocationGroup: "materials", amount: 0, notes: "" }),
    recommend: () => ({ serviceId: state.services[0]?.id || 1, recoveryLevel: 1, recommendedFeeOverride: "", policyNotes: "" })
  };
  state[key].push(templates[key]());
  saveState(); renderNav(); render();
}

function calculations() {
  const expenseTotals = state.expenses.reduce((a, e) => {
    a.excluded += Number(e.excluded || 0); a.indirect += Number(e.allowableIndirect || 0); a.direct += Number(e.allowableDirect || 0); a.total += Number(e.totalCost || 0); return a;
  }, { excluded: 0, indirect: 0, direct: 0, total: 0 });
  const staffCalc = state.staff.map(p => {
    const annualHours = Number(p.fte || 0) * Number(p.hoursPerFTE || 2080);
    const leaveHours = Number(p.fte || 0) * Number(p.hoursPerDay || 8) * (Number(p.vacationDays || 0) + Number(p.holidayDays || 0) + Number(p.sickDays || 0) + Number(p.mgmtLeaveDays || 0) + Number(p.floatingHolidayDays || 0) + Number(p.trainingDays || 0));
    const meetingHours = Number(p.fte || 0) * Number(p.weeksPerYear || 52) * Number(p.meetingHoursWeek || 0);
    const breakHours = (annualHours / Math.max(Number(p.hoursPerDay || 8), 1)) * Number(p.breakMinutesDay || 0) / 60;
    const adminHours = annualHours * Number(p.adminPercent || 0);
    const directHours = Math.max(annualHours - leaveHours - meetingHours - breakHours - adminHours, 0);
    const hourly = directHours ? Number(p.annualWages || 0) / directHours : 0;
    return { ...p, annualHours, directHours, hourly };
  });
  const serviceRows = state.services.map(s => {
    const volume = Number(s.annualVolume || 0) || 1;
    const timeCost = state.time.filter(t => Number(t.serviceId) === Number(s.id)).reduce((sum, t) => {
      const pos = staffCalc.find(p => Number(p.id) === Number(t.positionId));
      if (!pos) return sum;
      const annualUnitHours = (Number(t.hours || 0) + Number(t.minutes || 0) / 60) * volume;
      const annualPctHours = Number(t.percentage || 0) * pos.directHours;
      return sum + (annualUnitHours + annualPctHours) * pos.hourly;
    }, 0);
    const directCost = state.direct.filter(d => Number(d.serviceId) === Number(s.id)).reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const annualCost = timeCost + directCost;
    const fullCost = annualCost / volume;
    const currentFee = Number(s.currentFee || 0);
    const billed = Number(s.volumeBilled || s.annualVolume || 0);
    const rec = state.recommend.find(r => Number(r.serviceId) === Number(s.id));
    const recoveryLevel = rec ? Number(rec.recoveryLevel || 0) : 1;
    const feeAtPolicy = rec && rec.recommendedFeeOverride !== "" ? Number(rec.recommendedFeeOverride || 0) : fullCost * recoveryLevel;
    const annualRevenue = currentFee * billed;
    const policyRevenue = feeAtPolicy * billed;
    return { ...s, volume, billed, timeCost, directCost, annualCost, fullCost, currentRecovery: fullCost ? currentFee / fullCost : 0, annualRevenue, annualSubsidy: annualCost - annualRevenue, recoveryLevel, feeAtPolicy, increasedRevenue: policyRevenue - annualRevenue };
  });
  return { expenseTotals, staffCalc, serviceRows };
}

function renderReview() {
  const { expenseTotals, staffCalc, serviceRows } = calculations();
  const totals = serviceRows.reduce((a, s) => { a.cost += s.annualCost; a.rev += s.annualRevenue; a.increase += s.increasedRevenue; return a; }, { cost: 0, rev: 0, increase: 0 });
  const flags = qcFlags(expenseTotals, staffCalc, serviceRows);
  const body = `
    <div class="callout">These calculations are a lightweight preview. Final cost calculation should be performed by the controlled Excel model or a formally validated calculation engine.</div>
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Services</div><div class="kpi-value">${state.services.length}</div></div>
      <div class="kpi"><div class="kpi-label">Annual Cost Preview</div><div class="kpi-value">${dollars(totals.cost)}</div></div>
      <div class="kpi"><div class="kpi-label">Annual Revenue Preview</div><div class="kpi-value">${dollars(totals.rev)}</div></div>
      <div class="kpi"><div class="kpi-label">Potential Increase</div><div class="kpi-value">${dollars(totals.increase)}</div></div>
    </div>
    <h3>Quality Control Flags</h3>
    <ul class="qc-list">${flags.map(f => `<li class="${f.type}">${f.text}</li>`).join("")}</ul>
    <h3 style="margin-top:26px;">Executive Summary Preview</h3>
    <div class="table-wrap"><table><thead><tr><th>I</th><th>Service</th><th>Annual Volume</th><th>Current Fee</th><th>Full Cost Preview</th><th>Current Recovery</th><th>Annual Cost</th><th>Annual Revenue</th><th>Fee @ Policy</th></tr></thead><tbody>
    ${serviceRows.map(s => `<tr><td>${s.id}</td><td>${escapeHtml(s.serviceName || "")}</td><td>${s.annualVolume || 0}</td><td>${dollars(s.currentFee)}</td><td>${dollars(s.fullCost)}</td><td>${pct(s.currentRecovery)}</td><td>${dollars(s.annualCost)}</td><td>${dollars(s.annualRevenue)}</td><td>${dollars(s.feeAtPolicy)}</td></tr>`).join("")}
    </tbody></table></div>
    <h3 style="margin-top:26px;">Export Package Contents</h3>
    <pre class="code-block">${escapeHtml(JSON.stringify(exportPackage(), null, 2).slice(0, 3500))}${JSON.stringify(exportPackage()).length > 3500 ? "\n..." : ""}</pre>
  `;
  panel("Review & Export", "Review the intake data before sending it to the Excel integration process.", body);
}

function qcFlags(expenseTotals, staffCalc, serviceRows) {
  const flags = [];
  if (!state.project.agency || !state.project.department) flags.push({ type: "warn", text: "Project agency and department should be completed before export." });
  if (!state.services.length) flags.push({ type: "warn", text: "No services have been entered." });
  if (!state.staff.length) flags.push({ type: "warn", text: "No PSA/staff records have been entered." });
  serviceRows.filter(s => s.includeInReport !== false && !s.annualVolume).forEach(s => flags.push({ type: "warn", text: `Service ${s.id} is included in report but has no annual volume.` }));
  serviceRows.filter(s => s.includeInReport === false && s.timeCost > 0).forEach(s => flags.push({ type: "warn", text: `Service ${s.id} is marked FALSE but has time estimates. Confirm treatment.` }));
  staffCalc.filter(p => p.directHours <= 0).forEach(p => flags.push({ type: "warn", text: `Position ${p.id} has zero productive/direct hours.` }));
  if (Math.abs(expenseTotals.total - (expenseTotals.excluded + expenseTotals.indirect + expenseTotals.direct)) > 1) flags.push({ type: "warn", text: "ICRP costs do not reconcile: total cost should equal excluded + allowable indirect + allowable direct." });
  if (!flags.length) flags.push({ type: "ok", text: "No basic intake QC issues found." });
  return flags;
}

function exportPackage() {
  return {
    version: "0.1.0-starter",
    generatedAt: new Date().toISOString(),
    project: state.project,
    workbookMap: {
      project: "Svc Def!C1:C3 and linked headers",
      services: "tblSvcDef",
      staff: "tblPSA",
      expenses: "ICRP sections B/C",
      time: "tblTime",
      direct: "tblTotalCost",
      recommend: "tblExecSum Recovery Level / Fee @ Policy"
    },
    data: {
      services: state.services,
      staff: state.staff,
      expenses: state.expenses,
      time: state.time,
      direct: state.direct,
      recommend: state.recommend
    },
    preview: calculations()
  };
}
function exportJson() {
  const blob = new Blob([JSON.stringify(exportPackage(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dept = (state.project.department || "department").toString().replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  a.download = `mgt-uf-intake-${dept}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showAlert("Export created. Import this JSON into the Excel integration process.", "success");
}
function importJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const pkg = JSON.parse(reader.result);
      if (pkg.data) {
        state = { ...defaultState(), project: pkg.project || defaultState().project, ...pkg.data };
      } else {
        state = { ...defaultState(), ...pkg };
      }
      saveState(); renderNav(); render(); showAlert("JSON import complete.", "success");
    } catch (err) { showAlert("Could not import JSON. Check the file format.", "warning"); }
  };
  reader.readAsText(file);
}
async function loadSample() {
  try {
    const res = await fetch("sample-intake.json");
    const pkg = await res.json();
    state = { ...defaultState(), project: pkg.project, ...pkg.data };
    saveState(); renderNav(); render(); showAlert("Sample data loaded.", "success");
  } catch {
    showAlert("Sample data could not be loaded in this environment.", "warning");
  }
}
function clearAlerts() { document.getElementById("alerts").innerHTML = ""; }
function showAlert(text, type="warning") { document.getElementById("alerts").innerHTML = `<div class="alert ${type}">${text}</div>`; }
function coerce(value, type) { return type === "number" ? Number(value || 0) : value; }
function coerceByType(value, type) {
  if (["number", "service", "position"].includes(type)) return value === "" ? "" : Number(value);
  if (type === "boolean") return value === "true";
  return value;
}
function escapeHtml(v) { return String(v ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c])); }
function escapeAttr(v) { return escapeHtml(v).replace(/'/g, "&#039;"); }

init();

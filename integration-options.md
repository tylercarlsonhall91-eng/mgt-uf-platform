# Integration Options

## Option 1 - Static GitHub Pages Intake + Analyst Import

Use the GitHub Pages app as a client intake form. Client data stays in the browser and is exported as JSON. MGT imports the JSON into a controlled desktop Excel model.

Best for: proof of concept, no client login, minimal cost.

Limitations: no central database, no true multi-user editing, no automated workbook calculation unless paired with a backend or Microsoft automation.

## Option 2 - Microsoft 365 Intake Portal

Use Power Apps backed by Microsoft Lists, SharePoint, or Dataverse. Use Power Automate and Office Scripts or a controlled analyst process to load data into the model.

Best for: authenticated client access, audit history, permissions, document storage, internal Microsoft 365 adoption.

Limitations: licensing/guest access should be confirmed, and the existing VBA macros should not be assumed to run in Excel for the web.

## Option 3 - Full Web App + Excel/Calculation API

Use a React or similar front end with an authenticated backend in Azure. Store normalized project data in SQL/Dataverse. Either write to the workbook through Microsoft Graph or port the workbook formulas into a service-side calculation engine.

Best for: long-term SaaS platform.

Limitations: higher build cost, needs security review, formula parity testing, and formal QA against the Excel model.

## Recommended Pilot

Start with Option 1 or Option 2. Treat Excel as the calculation source of truth, and build a test harness that compares web-app preview outputs to the workbook's `Exec Summary` for a sample project before replacing any workbook formulas.

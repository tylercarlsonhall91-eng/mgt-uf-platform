# MGT User Fee Intake Platform Starter

This is a GitHub Pages-ready prototype for a client-facing user fee data intake workflow. It is intentionally lightweight and does not require a backend.

## What it does

- Presents a tile workflow that follows the MGT user fee model progression.
- Captures project setup, services, staffing, ICRP expenses, time entries, direct costs, and recommendations.
- Stores working data locally in the browser.
- Exports a JSON package for integration with the Excel model.
- Includes a simple preview calculation for review only.

## What it does not do yet

- It does not run the existing Excel VBA macros.
- It does not store client data on a server.
- It does not replace the controlled Excel calculation model.
- It does not include MGT logo image assets or font files.

## Deploy to GitHub Pages

1. Create a GitHub repository.
2. Copy the contents of this folder into the repository.
3. Commit and push to `main`.
4. In GitHub, open Settings > Pages.
5. Select the branch/source for GitHub Pages, or use a GitHub Actions workflow if preferred.
6. Open the published URL.

## Suggested production path

- MVP: keep this as a browser-only intake and export JSON to MGT.
- V1: connect the intake data to SharePoint/Dataverse and load the workbook through Office Scripts, Microsoft Graph, or a controlled desktop import.
- V2: port formulas into a validated calculation service and treat Excel as an audit/export format.

## Security note

A public GitHub Pages site is appropriate for non-confidential calculators or front-end-only intake. Client-specific budget, salary, and fee data should be handled through an authenticated environment before production use.

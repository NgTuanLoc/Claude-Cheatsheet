# Claude Cheatsheet

Self-contained HTML cheat sheets. Each file is a single page with its own styles and scripts — open it directly in a browser, no build step.

| File | What it covers |
| --- | --- |
| [`dotnet-cheatsheet.html`](dotnet-cheatsheet.html) | Copy-paste C#, ASP.NET Core and data-access patterns for .NET 10 LTS / C# 14, with an annotated `Program.cs`, a task finder and interactive DI / configuration / middleware widgets. |
| [`sql-server-cheatsheet.html`](sql-server-cheatsheet.html) | Copy-paste T-SQL for SQL Server 2025 and Azure SQL — queries, joins, window functions, locking and isolation, indexing and tuning — with an annotated script and interactive widgets. |
| [`react-javascript-cheatsheet.html`](react-javascript-cheatsheet.html) | JavaScript, TypeScript and React patterns for React 19.3, TypeScript 7 and ES2026, with an annotated `main.tsx` and event-loop, re-render and effect widgets. |
| [`angular-cheatsheet.html`](angular-cheatsheet.html) | Signal-first, zoneless, OnPush patterns for Angular 22.2, TypeScript 6, RxJS 7 and NgRx 22, with an annotated `order-page.ts` and change-detection, injector, flattening-operator and template-translator widgets. |
| [`docker-kubernetes-cheatsheet.html`](docker-kubernetes-cheatsheet.html) | Docker, Compose, kubectl and manifest patterns for shipping .NET 10 services to AKS on Kubernetes 1.37, with an annotated `ship.sh` and Docker-to-Kubernetes, rollout and resources widgets. |
| [`system-design-cheatsheet.html`](system-design-cheatsheet.html) | The components, workflows and resilience patterns of a backend system, with an annotated request trace and capacity, availability, rate-limiter and hash-ring widgets. |
| [`failure-modes-and-fixes.html`](failure-modes-and-fixes.html) | Production bugs as a lookup table: symptom, broken/fixed diagram, .NET / React / Azure fix, and how to detect it. |
| [`eighteen-shapes.html`](eighteen-shapes.html) | The eighteen underlying mechanisms behind the failure modes, with a review checklist of one question per shape. |

## Viewing

- **Online:** https://ngtuanloc.github.io/Claude-Cheatsheet/ — every push to `main` redeploys via the `Deploy to GitHub Pages` workflow. One-time setup: Settings → Pages → Source: **GitHub Actions**.
- **Locally:** open any `.html` file in a browser.

Fonts load from Google Fonts; everything else is inline. Light and dark themes follow the system setting and can be toggled on each page.

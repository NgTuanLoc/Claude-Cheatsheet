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
| [`coding-interview-cheatsheet.html`](coding-interview-cheatsheet.html) | What to reach for in a 45-minute coding round: the method, complexity budget, the C# 14 that saves minutes, data structures and the patterns behind most problems, each with a template, classic problems and traps. |
| [`english-fluency-cheatsheet.html`](english-fluency-cheatsheet.html) | Grammar, sounds and structures that turn what you understand into what you can say and write, built for Vietnamese speakers at upper-intermediate level heading for C1: each card shows a pattern, the typical mistake and the fix. |
| [`failure-modes-and-fixes.html`](failure-modes-and-fixes.html) | Production bugs as a lookup table: symptom, broken/fixed diagram, .NET / React / Azure fix, and how to detect it. |

## Viewing

- **Online:** https://ngtuanloc.github.io/Claude-Cheatsheet/ — every push to `main` redeploys via the `Deploy to GitHub Pages` workflow. One-time setup: Settings → Pages → Source: **GitHub Actions**.
- **Locally:** open any `.html` file in a browser.

Fonts load from Google Fonts; everything else is inline. Light and dark themes follow the system setting and can be toggled on each page.

## Building a cheat sheet

[`kit/`](kit/) is the template new sheets are built from; `dotnet-cheatsheet.html` is the first one built with it. It holds the page engine, the build and check tools, a reference for every card, diagram and widget type ([`kit/KIT.md`](kit/KIT.md)) and a small Git sample to copy ([`kit/starter/`](kit/starter/)). It needs Python 3 and Node; `shot.py` also needs Playwright with Chromium.

```bash
cp -r kit/starter sheets/my-topic                              # then replace the content
python3 kit/build.py sheets/my-topic -o my-topic-cheatsheet.html
python3 kit/shot.py my-topic-cheatsheet.html --shots shots      # must end with "no problems found"
python3 kit/split.py dotnet-cheatsheet.html sheets/dotnet       # a built page carries its own sources
```

[`skills/cheatsheet-template/SKILL.md`](skills/cheatsheet-template/SKILL.md) is the Claude skill that runs this workflow and publishes each sheet as a claude.ai artifact. It is a copy of the skill saved in the owner's claude.ai account, which fetches this same kit from the Cheatsheet Starter artifact.

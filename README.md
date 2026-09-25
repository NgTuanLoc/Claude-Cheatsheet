# Claude Cheatsheet

Self-contained HTML cheat sheets. Each file is a single page with its own styles and scripts — open it directly in a browser, no build step.

| File | What it covers |
| --- | --- |
| [`dotnet-cheatsheet.html`](dotnet-cheatsheet.html) | Copy-paste C#, ASP.NET Core and data-access patterns for .NET 10 LTS / C# 14, with an annotated `Program.cs`, a task finder and interactive DI / configuration / middleware widgets. |
| [`failure-modes-and-fixes.html`](failure-modes-and-fixes.html) | Production bugs as a lookup table: symptom, broken/fixed diagram, .NET / React / Azure fix, and how to detect it. |
| [`eighteen-shapes.html`](eighteen-shapes.html) | The eighteen underlying mechanisms behind the failure modes, with a review checklist of one question per shape. |

## Viewing

- **Online:** https://ngtuanloc.github.io/Claude-Cheatsheet/ — every push to `main` redeploys via the `Deploy to GitHub Pages` workflow. One-time setup: Settings → Pages → Source: **GitHub Actions**.
- **Locally:** open any `.html` file in a browser.

Fonts load from Google Fonts; everything else is inline. Light and dark themes follow the system setting and can be toggled on each page.

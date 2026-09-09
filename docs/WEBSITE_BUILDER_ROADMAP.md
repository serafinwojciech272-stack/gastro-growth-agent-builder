# Growth Advisor Website Builder

## Product boundary

The website builder is a Growth Advisor module. The product name is Growth Advisor. `Website Vision` is retired as a product label.

## Pipeline

1. Project
2. Brand Extraction
3. Content Intelligence
4. Page Architecture
5. Visual Direction
6. AI Layout Generation
7. Component Generation
8. Responsive Renderer
9. Preview
10. QA
11. Publish

## Current implementation

Project is implemented as a protected workspace at `/app/website-builder`.

Brand Extraction reuses the existing authenticated `gga-website-preview` server pipeline. It fetches public HTML, extracts readable content, runs the server website audit, applies the structured output quality gate, and stores a preview session when the organization mapping exists.

The remaining stages currently expose explicit artifact contracts and a responsive preview shell. They do not claim production generation until their server-side generation contracts exist.

## Next implementation order

Phase 1: persist Website Builder projects and stage state in Supabase.

Phase 2: add a server-side stage runner with typed JSON contracts for Brand Extraction and Content Intelligence.

Phase 3: add Page Architecture and Visual Direction generators with deterministic validation.

Phase 4: add AI Layout Generation and Component Generation with a constrained component schema.

Phase 5: build the renderer from the component schema rather than from AI-generated arbitrary JSX.

Phase 6: add browser QA, accessibility checks, broken-link checks, content validation and responsive screenshots.

Phase 7: add publish adapters for Render and Vercel with release gates and rollback metadata.

## Demonstration project

Metallica | Life Burns Faster

Source: https://www.metallica.com/

Vertical: Music / Concert

Primary objective: produce a high-end event website for Metallica's Sphere Las Vegas residency while keeping the generated content grounded in verified source data.

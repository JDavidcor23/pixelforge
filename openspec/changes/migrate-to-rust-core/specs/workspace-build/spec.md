# Delta for workspace-build

## ADDED Requirements

### Requirement: Independent App Deployment
The system MUST deploy `apps/landing` and `apps/editor` as independently deployable Vercel targets, with the editor retaining full feature parity with the pre-migration single app.

#### Scenario: Both apps deploy successfully
- GIVEN the monorepo workspace layout
- WHEN a deploy is triggered for each app
- THEN `apps/landing` and `apps/editor` each deploy successfully to Vercel

#### Scenario: Editor retains pre-migration features
- GIVEN the editor feature set available before the migration
- WHEN the same features are exercised in `apps/editor` after the migration
- THEN every pre-migration feature is still available and behaves the same

### Requirement: Server-Side Secrets Stay Server-Side
The system MUST NOT expose AI provider API keys (Retro Diffusion, ElevenLabs) to the client bundle after routes move to Vercel Functions.

#### Scenario: Client bundle contains no provider keys
- GIVEN the editor app built for production
- WHEN the client-shipped JavaScript is inspected
- THEN no Retro Diffusion or ElevenLabs API key value is present

#### Scenario: AI routes still function
- GIVEN a request to the sprite-generation or sound-generation endpoint
- WHEN the request reaches the corresponding Vercel Function
- THEN it completes using the server-side key with no client-side key exposure

### Requirement: Developer Experience Budgets
The system MUST keep editor dev-server cold start under 2 s and HMR updates under 200 ms.

#### Scenario: Cold start budget met
- GIVEN a clean dev-server start for `apps/editor`
- WHEN the dev server becomes ready to serve
- THEN elapsed time is under 2 s

#### Scenario: HMR budget met
- GIVEN a running dev server with the editor open
- WHEN a source file is saved
- THEN the HMR update is reflected in under 200 ms

### Requirement: Wasm Artifact Size Budget
The system MUST keep the committed `.wasm` artifact under 150 KB gzipped.

#### Scenario: Wasm size budget met
- GIVEN the built `packages/core` Wasm artifact
- WHEN its gzipped size is measured
- THEN it is under 150 KB

# System Log

## [2026-01-04] Refactored Map-Reduce Engine for Immutability

### Context
The previous "Map-Reduce" engine in `src/App.tsx` (index.tsx) was unstable due to React State Mutation in `mergeResults` and inconsistent JSON parsing from OpenRouter API responses.

### Changes Implemented
1.  **Robust Parser (`extractAndParseJSON`)**: 
    - Implemented a helper function to strictly parse JSON.
    - recursive handling of `{ response: ... }` wrappers.
    - Fallback cleaning for markdown fences.
2.  **Immutable Merge Logic**: 
    - Rewrote `mergeResults` to use deep spreading (`[...prev, ...new]`) instead of mutating `push()`.
    - Ensures React state updates trigger correctly.
3.  **Dynamic Schema Injection**: 
    - `startAnalysis` now injects the strict JSON schema into the system prompt for all providers (OpenRouter, Ollama, Gemini).
    - Enforces deterministic output structure.

### Status
- **Build**: Success (`npm run build`).
- **Verification**: Code refactor complete. Ready for runtime testing.

Advanced UI/UX & Architecture Implementation Plan
This plan introduces 5 key architecture and UI/UX improvements to make Petra School OS faster, resilient to runtime errors, visually animated, printable for administrative documents, and equipped with a toast notification feedback loop.

User Review Required
NOTE

All changes are non-breaking and preserve all existing route paths, state contexts, and API endpoints.

Proposed Changes
1. Performance & Route Code Splitting
[NEW] src/components/PageLoadingFallback/PageLoadingFallback.jsx & .css:
Branded Petra loading state with pulse glow, micro-spinner, and "Loading School OS..." typography.
[MODIFY] src/App.jsx:
Convert all statically imported pages to React.lazy() dynamic imports.
Wrap public layout and dashboard layout inside <Suspense fallback={<PageLoadingFallback />}>.
2. Error Resilience & Recovery
[NEW] src/components/ErrorBoundary/ErrorBoundary.jsx & .css:
Class component catching unhandled React render errors.
Renders a clean Petra-themed error recovery screen with a "Retry Component" button and "Return to Dashboard" link.
[MODIFY] src/App.jsx:
Wrap routes inside <ErrorBoundary>.
3. Unified Petra Toast System
[MODIFY] src/context/ToastContext.jsx:
Integrate Lucide icons (CheckCircle2, AlertTriangle, XCircle, Info) for each tone.
Add support for useToast() alias for standard ergonomics.
Add sound/visual progress bar or smooth slide-in animations with Petra tokens.
4. Print Engine (@media print)
[MODIFY] src/Styles/petra-theme.css:
Add comprehensive @media print rules:
Hide .dashboard-sidebar, .top-navbar, .toast-viewport, .command-palette-backdrop, action buttons, and .no-print elements.
Set .dashboard-main and .dashboard-content to 100% width with clean margins.
Style tables, receipts, admission passes, and report cards with clean borders and page-break rules.
5. Micro-Transitions & Visual Polish
[MODIFY] src/Styles/petra-theme.css:
Add @keyframes petraFadeUp and apply to .dashboard-content and major card containers for smooth view transitions.
Verification Plan
Automated Tests & Builds
Run npx vite build to confirm code splitting produces individual lazy chunk files and builds without errors.
Manual Verification
Test route switching to verify smooth lazy loading and transition animations.
Test Ctrl+K command palette and trigger sample toasts.
Verify print preview layout behavior.
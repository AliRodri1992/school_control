# School Control 2.0 — Implementation ledger

This file tracks the implementation of the attached product specification in [SCHOOL_CONTROL_2_0_MASTER.md](SCHOOL_CONTROL_2_0_MASTER.md). The specification is a target, not evidence that features are finished.

## Baseline (verified in \`feature/smart-dashboard\`)

- Rails JSON API, cookie sessions and CSRF protection.
- Four user profile values; one shared React application with a state-driven sidebar.
- Custom RBAC tables and \`SchoolAccess\` (Pundit is not installed).
- React Grid Layout with PostgreSQL user preferences.
- \`EmailTemplate\` stores basic activity templates; full template editor is not implemented.
- Rails locales exist for \`es\` and \`en\`; React interface does not yet fully consume translations.
- \`StudentContact\` belongs directly to \`Student\`; the polymorphic contact model is pending.
- Existing API routes are unversioned \`/api/*\`; comprehensive OpenAPI contracts are pending.

## Foundation changes in this delivery

- Master requirements checked into the repository.
- Theme tokens (Midnight Indigo) and accessible button/input interaction states.
- Original vector mascot resource \`auli-welcome.svg\`.
- Revised responsive login with consistent field-level validations.
- Backend field errors preserved in the frontend API client for display beside fields.

## Upcoming implementation dependencies

1. Shared shell, React Router and protected \`/admin\`, \`/teachers\`, \`/students\`, \`/tutors\` layouts.
2. Pundit policies calling existing RBAC, with request/record scope tests.
3. Person and association redesign; polymorphic \`addresses\`, \`phone_numbers\`, \`contacts\`, \`notes\`, retaining strict relational links for tutors.
4. Shared forms, dropdowns, breadcrumbs, table controls and wizard framework.
5. Saved widget presets and dashboard per portal; notification drawer and locale catalog.
6. Database-backed, versioned HTML/text email templates.
7. Step-by-step data importer with an explicit column mapping stage, validation and asynchronous execution.
8. Full OpenAPI contract covering currently implemented operations, tested alongside API requests.
9. Mobile/accessibility review and CI regression checks.

Do not remove pre-existing modules or confuse newly documented features with implemented functionality.

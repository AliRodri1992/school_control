# School Control 2.0 — Implementation ledger

This file tracks the implementation of the attached product specification in [SCHOOL_CONTROL_2_0_MASTER.md](SCHOOL_CONTROL_2_0_MASTER.md). The specification is a target, not evidence that features are finished.

## Historical baseline (before the 2.0 implementation)

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


## Work completed in the current follow-up

- Permission-filtered per-profile navigation under /admin, /teachers, /students and /tutors, with real browser history, breadcrumb context, account flyout, notification counter and live institutional clock. React Router remains a separate migration; current routing uses the History API.
- First production SVG mascot asset and context card in the import wizard.
- Initial Pundit student policies integrated with existing RBAC.
- Polymorphic tables and associations for addresses, phone numbers, contacts and notes, not yet migrated from legacy student_contacts UI.
- OpenAPI 3.1 initial contract with 95 existing operations, now expanded to import endpoints; detailed request/response schemas remain to be completed.
- Role-specific React Grid Layout widget presets.
- SweetAlert2 confirmation styling and input-level recovery validation.
- Versioned PostgreSQL email templates, new school-themed responsive notification email.
- CSV/XLSX import backend with explicit whitelist of student fields, map/validate/execute endpoints, background job and guided React interface.
- Automated tests added to the modified areas.

Outstanding acceptance items from the master document include the full portal-specific page migration, accessible combobox library, comprehensive translation publishing system, complete UI and API schema coverage, full person/contact migration and cross-device visual regression suite.


## Implemented through October 24, 2026

- Pundit is now integrated into student, grade, attendance, admission, student-document, family-contact and enrollment actions. Authorization remains based on the custom RBAC and SchoolAccess scopes. Additional controllers still require Pundit integration.
- React Router provides separate entry URLs for /admin, /teachers, /students and /tutors. Their landing experiences use role-specific copy, quick actions and saved draggable/resizable dashboards.
- The shared shell includes the real-time school clock, role-aware navigation with three levels, breadcrumbs, account and notification flyouts, locale picker, and persisted guardian child selection.
- Tables support basic client-side pagination, ordering, and status filters. Scalable server-side filtering/pagination is still pending.
- Shared field-level validations, searchable keyboard-accessible dropdowns, modal forms, Midnight Indigo visual tokens and custom Auli SVG poses are in place.
- A language catalog stores reviewed ES/EN translations and future languages. Localization across the entire app remains incomplete.
- Email templates are versioned, stored in PostgreSQL, visually editable and previewable. Automated mail workflows still need expansion.
- The CSV/XLSX wizard imports students, subjects, groups, teachers, guardians and draft grades. It supports validation, column mapping, user-owned reusable templates, per-row idempotency, error reports and protected retry.
- The admin OpenAPI explorer shows documented endpoints, security and selected typed request schemas. Full contract parity remains incomplete.
- Polymorphic addresses, phone numbers, contacts and notes are available in student records. A non-destructive backfill task and one-way legacy contact mirroring are integrated; full cutover remains outstanding.
- The account Help menu links to a role-aware guide with task-specific instructions.

## Remaining release criteria

1. Finish separate portal workflows and apply Pundit consistently to all privileged controllers and records.
2. Complete the component-library migration and responsive/accessibility regression tests.
3. Translate all modules, forms, alerts, reports and mail templates using the reviewed locale catalog.
4. Reconcile and migrate the remaining legacy contact, phone and address data before removal of any original columns.
5. Expand server-side pagination, full API request/response schemas, and contract tests.
6. Finish email event automations, notifications and contextual Auli guidance.
7. Raise SimpleCov line and branch coverage to the targets set in the master specification.

## Operational considerations

- Run Rails migrations after a database backup. For historic student contacts, execute the backend task named school:backfill_polymorphic. It is non-destructive and repeatable.
- Configure a working mail provider and background jobs before bulk inviting staff or guardians.
- Treat passing GitHub Actions as validation only of the existing tests for that commit, not proof that every feature is complete.

/**
 * Primitivele paginilor de admin. Fiecare e un strat subțire peste MUI — nu reimplementează
 * nimic din ce există deja — și niciuna nu conține culori: totul vine din `src/theme/adminTheme`.
 */
export { ActionMenu, type ActionMenuItem } from './ActionMenu'
export { DocumentRow } from './DocumentRow'
export { EmptyState } from './EmptyState'
export { Field, type FieldSpec } from './Field'
export { isEmptyValue } from './emptyValue'
export { FieldGrid } from './FieldGrid'
export { MetaBar, type MetaItem } from './MetaBar'
export { PageHeader } from './PageHeader'
export { usePageTabs, type PageTab } from './PageTabs'
export { Section } from './Section'
export { SectionSkeleton } from './SectionSkeleton'
export { StatusBadge, type StatusTone } from './StatusBadge'

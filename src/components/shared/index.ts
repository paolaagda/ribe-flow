/**
 * Componentes visuais reutilizáveis oficiais do Canal Parceiro.
 *
 * Esta é a base padronizada. Toda nova tela / refatoração deve preferir
 * estes componentes em vez de recriar estruturas tonais ad-hoc.
 *
 * Tons semânticos suportados (ver `./tone`):
 *   primary | info | warning | destructive | success | muted
 *
 * Lembrete oficial:
 *   - Visita      → Handshake + tone="info"
 *   - Prospecção  → UserPlus  + tone="warning"
 */

export { type Tone, getTone, toneMap } from './tone';

// Primitivos tonais
export { IconTile, type IconTileProps } from './IconTile';
export { ToneBar, type ToneBarProps } from './ToneBar';

// Blocos compostos
export { ToneBlock, type ToneBlockProps } from './ToneBlock';
export { ToneKpiCard, type ToneKpiCardProps } from './ToneKpiCard';
export { SurfaceCard, type SurfaceCardProps } from './SurfaceCard';
export { StatusPill, type StatusPillProps } from './StatusPill';
export { SectionHeader, type SectionHeaderProps } from './SectionHeader';

// Modal shells
export { ModalHeaderShell, type ModalHeaderShellProps } from './ModalHeaderShell';
export { ModalFooterShell, type ModalFooterShellProps } from './ModalFooterShell';

// Tabs tonais
export { ToneTabsList, ToneTabsTrigger } from './ToneTabs';

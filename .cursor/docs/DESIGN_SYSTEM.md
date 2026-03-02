# Design System Reference

Reference for `src/design-system` components. Use this doc in Cursor when building UI so the AI uses the correct imports and props.

**Base import path:** `@/design-system` or `src/design-system` (re-exported from root `index.ts`).

**Theme:** Wrap the app in `ThemeProvider` and use `useTheme()` for mode/toggle. Components use `styled-components` theme (colors, spacing, radii).

---

## 1. Theme & Setup

```tsx
import { ThemeProvider, useTheme, ThemeToggle } from '@/design-system'
import type { ThemeMode } from '@/design-system'

// App root
<ThemeProvider>
  <App />
</ThemeProvider>

// In components
const { mode, setMode, toggle, theme } = useTheme()
```

- **ThemeProvider** – Provides theme (light/dark) and persists to `localStorage` (`workbit-theme-mode`).
- **useTheme()** – Returns `{ mode, setMode, toggle, theme }`. Must be used inside `ThemeProvider`.
- **ThemeToggle** – UI control to toggle light/dark.
- **ThemeMode** – `'light' | 'dark'`.

---

## 2. Layout

**Path:** `src/design-system/layout`

| Component   | Props | Description |
|------------|-------|-------------|
| **Container** | `maxWidth?: string`, `children`, `className?` | Centered container; default `maxWidth: 1200px`, horizontal padding from theme. |
| **Flex**      | `direction?: 'row' \| 'column'`, `gap?: number`, `align?`, `justify?`, `wrap?: boolean`, `children`, `className?` | Flexbox layout; `gap` uses theme spacing index or raw px. |
| **Stack**     | `direction?: 'vertical' \| 'horizontal'`, `gap?: number`, `children`, `className?` | Flex column/row with gap. |
| **Grid**      | `columns?: number \| string`, `gap?: number`, `children`, `className?` | CSS Grid; `columns` can be number or template string (e.g. `'1fr 1fr'`). |

```tsx
import { Container, Flex, Stack, Grid } from '@/design-system'
```

---

## 3. Typography

**Path:** `src/design-system/typography`

| Component | Props | Description |
|-----------|-------|-------------|
| **Heading** | `level?: 1-6`, `as?: 'h1' \| ... \| 'h6'`, `children`, `className?` | Semantic heading; `level` controls size/weight. |
| **Text**    | `size?: 'xs' \| 'sm' \| 'md' \| 'lg'`, `muted?: boolean`, `as?: 'p' \| 'span' \| 'div'`, `children`, `className?` | Body text. |
| **Label**   | `htmlFor?`, `children`, `className?` | Form label. |

```tsx
import { Heading, Text, Label } from '@/design-system'
```

---

## 4. Colors & Spacing

**Path:** `src/design-system/colors`, `src/design-system/spacing`

- **Exports:** `colorsLight`, `colorsDark`, `lightTheme`, `darkTheme`, types `Colors`, `AppTheme`.
- **Spacing:** `spacing` (array), `spacingPx`, `getSpacing(index)`, type `SpacingScale`. Prefer theme: `theme.spacing[n]` in styled-components.

---

## 5. Buttons & Inputs

**Path:** `src/design-system/ui`

### Button

- **Props:** `variant?: 'primary' \| 'secondary' \| 'outline' \| 'ghost'`, `size?: 'sm' \| 'md'`, `type?`, `onClick?`, `disabled?`, `children`, `className?`.
- **Default:** `variant='primary'`, `size='md'`.

```tsx
import { Button } from '@/design-system'
<Button variant="primary" size="md" onClick={...}>Save</Button>
```

### IconButton

- **Props:** `aria-label` (required), `onClick?`, `disabled?`, `children` (icon), `className?`.
- Use for icon-only actions (e.g. close, menu).

```tsx
import { IconButton } from '@/design-system'
<IconButton aria-label="Close" onClick={onClose}><X size={16} /></IconButton>
```

### Input

- **Props:** Extends native `<input>` (no `size`). Plus `variant?: 'default' \| 'ghost'`, `className?`.
- **Default:** `variant='default'` (bordered). `ghost` = no border, transparent bg.

```tsx
import { Input } from '@/design-system'
<Input value={value} onChange={e => setValue(e.target.value)} placeholder="..." />
```

### Textarea

- **Path:** `ui/Textarea`. Standard textarea; accepts native props + `className?`.

### Search

- **Props:** `variant?: 'expandable' \| 'inline'`, `placeholder?`, `value?`, `onChange?: (value: string) => void`, `className?`. For `expandable`: `expandedWidth?: number`, `onBlur?`.
- **Expandable:** Icon button that expands to show input. **Inline:** Always-visible search input with icon.

```tsx
import { Search, type SearchVariant } from '@/design-system'
<Search variant="inline" placeholder="Search..." value={q} onChange={setQ} />
```

### Select

- **Props:** `value?`, `onChange?: (value: string) => void`, `options: { value: string; label: string }[]`, `placeholder?`, `className?`.

```tsx
import { Select } from '@/design-system'
<Select options={[{ value: 'a', label: 'Option A' }]} value={v} onChange={setV} placeholder="Choose..." />
```

### Dropdown

- **Props:** `options: DropdownOption[]`, `value?`, `onChange?`, `placeholder?`, `state?: 'default' \| 'error' \| 'success' \| 'disabled'`, `disabled?`, `className?`.
- **DropdownOption:** `{ value: string; label: string }`.

```tsx
import { Dropdown, type DropdownOption } from '@/design-system'
```

### Checkbox

- **Props:** `checked?`, `onChange?: (checked: boolean) => void`, `label?: React.ReactNode`, `className?`.

### Switch

- **Path:** `ui/Switch`. Toggle switch; check component for exact props (typically `checked`, `onChange`).

---

## 6. Overlays & Surfaces

### Modal

- **Props:** `open`, `onClose`, `title?`, `variant?: ModalVariant`, `icon?`, `primaryLabel?`, `onPrimary?`, `secondaryLabel?` (default `'Cancel'`), `onSecondary?`, `children`.
- **ModalVariant:** `'regular' \| 'destructive' \| 'message' \| 'success' \| 'form' \| 'promotional' \| 'blank'`.
- **Variants:** `message`/`success` = centered, optional icon; `destructive` = red primary; `promotional` = primary-colored panel; `blank` = no header/footer, only close button.

```tsx
import { Modal } from '@/design-system'
<Modal open={open} onClose={close} title="Confirm" primaryLabel="OK" onPrimary={handleOk} secondaryLabel="Cancel" onSecondary={close}>
  <p>Content</p>
</Modal>
```

### Popup

- **Props:** `trigger`, `children`, `placement?: 'top' \| 'bottom' \| 'left' \| 'right'`, `align?: 'start' \| 'center' \| 'end'`, `openOnHover?`, `openOnClick?` (default true), `className?`.
- Renders floating panel relative to trigger.

```tsx
import { Popup, type PopupPlacement, type PopupAlign } from '@/design-system'
```

### Tooltip

- **Props:** `title: string`, `variant?: 'light' \| 'dark'`, `position?: 'top' \| 'bottom' \| 'left' \| 'right'`, `children`.
- Shows on hover.

```tsx
import { Tooltip } from '@/design-system'
<Tooltip title="Help text" position="top"><span>Hover me</span></Tooltip>
```

### Card

- **Props:** `children`, `className?`. Themed surface with border and padding.

---

## 7. Menus & Lists

### Menu

- **Props:** `trigger`, `items: MenuEntry[]`, `className?`.
- **MenuEntry:** `MenuItem \| MenuDivider`.
- **MenuItem:** `{ id, label, icon?, right?, onClick? }`.
- **MenuDivider:** `{ type: 'divider' }`.

```tsx
import { Menu, type MenuItem, type MenuDivider, type MenuEntry } from '@/design-system'
```

---

## 8. Feedback & Status

### Alert

- **Path:** `ui/Alert`. Inline alert message.

### Banner

- **Path:** `ui/Banner`. Banner/announcement block.

### Badge

- **Props:** `variant?: 'light' \| 'solid' \| 'primary' \| 'default'`, `size?: 'medium' \| 'small'`, `color?: 'blue' \| 'grey' \| 'green' \| 'red' \| 'orange'`, `children`, `className?`.
- `primary` => solid blue; `default` => light grey.

### Notification

- **Path:** `ui/Notification`. Toast/notification UI.

---

## 9. Data Display

### Avatar

- **Path:** `ui/Avatar`. User avatar.

### TableHeader

- **Path:** `ui/TableHeader`. Table header row.

### Table

- **Path:** `ui/Table`. Headless data table built with TanStack Table. Accepts `columns: ColumnDef<T>[]`, `data: T[]`, optional `enableSorting`, `initialState?.sorting`. Use `meta: { flex?: number }` on column defs for relative column width. Renders themed header and body rows (borders, spacing, sort indicators).

### Divider

- **Path:** `ui/Divider`. Horizontal/vertical divider.

### Skeleton

- **Path:** `ui/Skeleton`. Loading skeleton.

### Tags

- **Path:** `ui/Tags`. Tag list/chips.

### StarRating

- **Path:** `ui/StarRating`. Star rating display/input.

---

## 10. Navigation

**Path:** `src/design-system/navigation`

| Component   | Description |
|------------|-------------|
| **Navbar** | Top navigation bar. |
| **Breadcrumb** | Breadcrumb trail; type `BreadcrumbItem` for items. |
| **Tabs**      | Tab list; type `TabItem` for items. |

```tsx
import { Navbar, Breadcrumb, Tabs } from '@/design-system'
import type { BreadcrumbItem, TabItem } from '@/design-system'
```

---

## 11. Sidebar

**Path:** `src/design-system/ui/Sidebar`

- **Sidebar** – Main sidebar container; supports collapsed state.
- **SidebarSection** – Group block (styled div).
- **SidebarSectionHeading** – Section title (uppercase, muted).
- **SidebarCollapsibleSection** – Collapsible section: `title`, `children`, `defaultOpen?`.
- **SidebarNavItem** – Nav link; use `$active` (styled prop) or equivalent for active state.

```tsx
import { Sidebar, SidebarSection, SidebarSectionHeading, SidebarCollapsibleSection, SidebarNavItem } from '@/design-system'
```

---

## 12. Pickers & Advanced Controls

### Calendar

- **Path:** `ui/Calendar`. Calendar grid.

### DatePicker

- **Path:** `ui/DatePicker`. Date input/picker.

### TimePicker

- **Path:** `ui/TimePicker`. Time input.

### Slider

- **Path:** `ui/Slider`. Range slider.

### Accordion

- **Props:** Uses `AccordionItem` type for items.
- **Path:** `ui/Accordion`.

### Selector

- **Props:** `SelectorOption` type for options.
- **Path:** `ui/Selector`.

### AdvancedToggle

- **Props:** `AdvancedToggleOption` type.
- **Path:** `ui/AdvancedToggle`.

### Pagination

- **Path:** `ui/Pagination`. Pagination controls.

### Steps

- **Path:** `ui/Steps`. Step indicator; type `StepItem` for steps.

### Tree

- **Path:** `ui/Tree`. Tree view; type `TreeNode` for nodes.

---

## Quick import summary

```tsx
// Single import for app usage
import {
  ThemeProvider,
  useTheme,
  ThemeToggle,
  Button,
  IconButton,
  Input,
  Search,
  Select,
  Dropdown,
  Modal,
  Popup,
  Tooltip,
  Menu,
  Card,
  Badge,
  Checkbox,
  Container,
  Flex,
  Stack,
  Grid,
  Heading,
  Text,
  Label,
  Sidebar,
  SidebarSection,
  SidebarSectionHeading,
  SidebarCollapsibleSection,
  SidebarNavItem,
  Navbar,
  Breadcrumb,
  Tabs,
} from '@/design-system'

import type {
  ThemeMode,
  SearchVariant,
  DropdownOption,
  PopupPlacement,
  PopupAlign,
  MenuItem,
  MenuDivider,
  MenuEntry,
  BreadcrumbItem,
  TabItem,
} from '@/design-system'
```

---

**When building UI:** Prefer these components and the props above so styling and behavior stay consistent. Use `ThemeProvider` at the root and theme-aware layout (Container, Flex, Stack, Grid) and typography (Heading, Text, Label) throughout.

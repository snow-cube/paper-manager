# CSS Structure

This directory contains the modular CSS structure for the Paper Manager application.

## Organization

- **base/** - Contains basic styling and design tokens
  - `variables.css` - Design system variables (colors, spacing, typography)
  - `reset.css` - Browser resets and base element styling

- **components/** - Component-specific styles
  - `buttons.css` - All button variations and states
  - `cards.css` - Card containers and variations
  - `forms.css` - Form controls and layouts
  - `lists-tables.css` - List and table styles
  - `modals.css` - Modal and dialog components
  - `navigation.css` - Navigation and tabs
  - `tree.css` - Tree component styles
  - `misc.css` - Miscellaneous components (badges, avatars, etc.)

- **utils/** - Utility classes and helpers
  - `utility.css` - Functional utility classes
  - `transitions.css` - Animation and transition definitions

- **layouts/** - Page layout styles (reserved for future use)

## Usage

All files are imported through the `main.css` entry point.

When adding new styles:

1. Identify the appropriate file based on component type
2. Follow existing patterns in that file
3. Use CSS variables for consistency

## Design Tokens

Always use CSS variables from `variables.css` for:

- Colors (`--color-*`, `--primary-*`, etc.)
- Spacing (`--space-*`)
- Typography (`--text-*`)
- Effects (`--shadow-*`)
- Timing (`--transition-*`)

## Maintenance

See `docs/css-architecture.md` for detailed maintenance guidelines and architecture documentation.

/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#2A1C13',
    tint: '#FF7626',

    // Core surfaces
    background: '#FFF8F2',
    foreground: '#2A1C13',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#2A1C13',

    // Primary action color (buttons, links, active states)
    primary: '#FF7626',
    primaryForeground: '#2A1C13',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#F5ECE4',
    secondaryForeground: '#4B3426',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#F4ECE6',
    mutedForeground: '#8B7668',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#FFE4D1',
    accentForeground: '#813B12',

    // Destructive actions (delete, error states)
    destructive: '#D94848',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#EBDDCF',
    input: '#E4D4C7',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;

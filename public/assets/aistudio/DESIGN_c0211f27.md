---
name: ELVI
colors:
  surface: '#fafaee'
  surface-dim: '#dadbcf'
  surface-bright: '#fafaee'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4e8'
  surface-container: '#efefe3'
  surface-container-high: '#e9e9dd'
  surface-container-highest: '#e3e3d7'
  on-surface: '#1a1c15'
  on-surface-variant: '#574147'
  inverse-surface: '#2f3129'
  inverse-on-surface: '#f1f1e5'
  outline: '#8a7177'
  outline-variant: '#ddbfc6'
  surface-tint: '#ad2863'
  primary: '#600032'
  on-primary: '#ffffff'
  primary-container: '#890149'
  on-primary-container: '#ff8fb6'
  inverse-primary: '#ffb0c9'
  secondary: '#7e5162'
  on-secondary: '#ffffff'
  secondary-container: '#ffc5d8'
  on-secondary-container: '#7b4e5f'
  tertiary: '#382a31'
  on-tertiary: '#ffffff'
  tertiary-container: '#4f4048'
  on-tertiary-container: '#c1acb5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e2'
  primary-fixed-dim: '#ffb0c9'
  on-primary-fixed: '#3e001e'
  on-primary-fixed-variant: '#8c054b'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#f0b7ca'
  on-secondary-fixed: '#32101f'
  on-secondary-fixed-variant: '#643a4a'
  tertiary-fixed: '#f3dde6'
  tertiary-fixed-dim: '#d6c1ca'
  on-tertiary-fixed: '#24181f'
  on-tertiary-fixed-variant: '#52434a'
  background: '#fafaee'
  on-background: '#1a1c15'
  surface-variant: '#e3e3d7'
  cherry: '#890149'
  alabaster: '#F3F3E7'
  dusty-rose: '#D9A2B5'
  warm-ink: '#30232A'
typography:
  headline-lg:
    fontFamily: DM Serif Display
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 44px
  headline-lg-mobile:
    fontFamily: DM Serif Display
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
  headline-md:
    fontFamily: DM Serif Display
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
  headline-sm:
    fontFamily: DM Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: DM Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

ELVI Design System
Overview
ELVI is a menstrual and related-health companion for women, with a dedicated PCOS/PCOD care mode. The experience must feel warm, trustworthy, calm, premium, private, and genuinely human—not like a generic AI dashboard, hospital admin tool, or stereotypical pink beauty app.
The design language combines editorial elegance with practical health-product clarity. Use clear information hierarchy, considered typography, generous whitespace, honest data visualisation, and supportive microcopy. A user may arrive feeling anxious, confused, embarrassed, or tired; never make her feel judged, blamed, or alarmed.
Design for a full menstrual journey, not only period days. Screens may include onboarding, cycle tracking, daily check-ins, a conversational AI companion, a unified health timeline, PCOS/PCOD care, reminders, reports, and privacy settings. The design system must work consistently across all of them.
The approved palette is intentionally strict: Cherry #890149, Alabaster #F3F3E7, Dusty Rose #D9A2B5, and Warm Ink #30232A. Do not introduce extra brand colours. If a state needs to be distinguished, pair colour with a clear label, icon, shape, or pattern rather than relying on colour alone.
Colors
The palette has four approved colours, each with a specific job. Do not invent additional blues, purples, greens, oranges, or unrelated accent colours.


Cherry — {colors.primary} (#890149): The signature brand colour. Use for primary actions, selected navigation, active calendar states, key highlights, important links, and restrained emphasis. Do not flood whole screens with Cherry.

Alabaster — {colors.neutral} (#F3F3E7): The main page and content-surface colour. It is the default canvas and should keep the product soft rather than stark white.

Dusty Rose — {colors.secondary} (#D9A2B5): A supporting colour for quiet highlights, soft badges with Warm Ink text, selected secondary surfaces, subtle dividers, and gentle data-series distinction. Never use Dusty Rose alone for small text on Alabaster; its contrast is too low.

Warm Ink — {colors.tertiary} (#30232A): The main text, heading, icon, chart-label, and high-contrast neutral colour. Prefer it over pure black.
Contrast and state rules


Use Warm Ink on Alabaster for body text and long reading. Use Cherry on Alabaster for links and high-priority text when appropriate.

On Cherry buttons, use Alabaster text. On Dusty Rose surfaces, use Warm Ink text.

Do not use low-contrast Dusty Rose for essential text, small icons, chart labels, or control outlines that must be seen clearly.

Do not express success, warning, error, or urgency through colour alone. Add explicit language and a clear icon or other visual cue. Stay within the approved palette; do not introduce a new semantic colour without approval.

Keep charts readable using labels, line styles, point markers, and legends—not extra unapproved colours.
Typography
Use DM Serif Display for large editorial headings and DM Sans for all functional interface text. This pairing gives OSFIC warmth and personality while keeping forms, numbers, navigation, and health information highly legible.


Display and page headings: DM Serif Display, regular weight. Keep headings calm and concise; avoid oversized hero text that overwhelms the task.

Section headings: DM Sans semibold or DM Serif Display when a softer editorial moment is useful. Maintain consistent hierarchy across screens.

Body and helper text: DM Sans, regular weight, generous line-height. Use plain language, short paragraphs, and sentence case.

Labels and metadata: DM Sans semibold. Labels may be compact, but never so small that a health detail, date, unit, or action becomes hard to read.

Measurements and dates: DM Sans semibold with numerals that align clearly. Always show units and relevant dates when presenting clinical or cycle data.

Avoid decorative scripts, excessive all-caps, ultra-light weights, overly tight line-height, and long passages in italic text.
Layout
Use an editorial, spacious, content-first layout. Alignment and whitespace—not nested cards—should create the hierarchy. Each screen should have one clear primary task and a calm visual rhythm.


Desktop: Use a centred content column or balanced two-column layout when useful. Keep long-form content at a readable width; reserve wider layouts for calendars, timelines, and charts. Do not stretch form fields across the full screen unnecessarily.

Mobile: Design for one-handed use, stacked content, thumb-friendly controls, readable charts, and safe-area spacing. Preserve the same information priority as desktop rather than simply shrinking it.

Spacing: Follow the defined 4/8/12/16/24/32/48/64 px rhythm. Use larger gaps between sections and smaller gaps only among strongly related elements.

Navigation: Keep the same logo treatment, type, active-state treatment, icon style, and spacing across all signed-in screens. Navigation must be easy to understand; do not rename the same destination across different screens.

Content hierarchy: Place the page title first, brief contextual guidance second, the primary action next, and supporting information after that. Avoid competing calls to action.

Cards: Use only when content is a genuinely distinct group, such as a cycle summary, next appointment, or a timeline entry. Prefer open sections and simple dividers over card-after-card dashboard layouts.

Forms and check-ins: Ask only the questions needed for the current step. Group related questions, show progress where helpful, explain optional fields, and make “skip for now” available for nonessential questions.

Data density: Show the most useful trend first. Give each chart or metric a plain-language title and a clear date range. Keep explanations close to the data they describe.

Responsive consistency: Maintain colour roles, type scale, spacing, components, and terminology on every screen and breakpoint.
Elevation & Depth
Use subtle tonal separation and fine borders, not heavy shadows, to define surfaces. The Alabaster canvas should do most of the work. Dusty Rose may provide a quiet edge or secondary surface when contrast remains clear.


Avoid glassmorphism, blurred panels, glossy gradients, glowing borders, dramatic drop shadows, and floating-card stacks.

Use elevation sparingly for menus, date pickers, dialogs, and temporary overlays only.

Separate content through whitespace, typography, a fine Dusty Rose divider, and deliberate grouping before adding another container.
Shapes
Shapes are softly structured rather than bubbly. Use restrained corner rounding: 4–8 px for buttons and inputs, around 12 px for cards and panels, and pill shapes only for compact tags or status badges.


Use consistent corner radii throughout the entire product. Do not mix sharp, pill-shaped, and oversized rounded corners arbitrarily.

Inputs should look clear and dependable, not like decorative capsules.

Icons should be simple, consistent in stroke weight, and recognisable at a glance. Use one coherent icon family. Do not mix emoji, hand-drawn illustrations, and unrelated icon styles in navigation or controls.
Components
Buttons and links


Primary button: Cherry fill, Alabaster text, restrained 4–8 px corner radius. Use for the single most important action on a screen.

Secondary button: Alabaster surface with Cherry text and a clear Dusty Rose outline when needed. It must remain visibly secondary.

Tertiary action: Text-style action in Cherry or Warm Ink for low-emphasis actions. It must still be easy to discover and tap.

Use action labels that state what happens, such as “Save check-in”, “Edit period dates”, or “Review report”. Avoid vague labels such as “Continue” when a more specific label fits.

Provide visible hover, pressed, disabled, loading, and keyboard-focus states. Disabled controls must remain legible.
Inputs and forms


Inputs use an Alabaster surface, Warm Ink text, visible labels, and a clean border. Placeholder text must never substitute for a label.

Required and optional fields must be clearly identified. Validation should be specific, respectful, and shown close to the relevant field.

Do not clear a user's entries after a validation error. Preserve entered information where possible.

For dates, menstrual flow, symptoms, food, hydration, and clinical records, use controls suited to the task rather than forcing every response into a free-text box.

Every chart, check-in, and form must support correction and review. Medical or symptom details inferred from conversation must not look saved until the user confirms them.
Navigation


Use clear text labels with simple icons. Selected destinations use Cherry with a clearly visible active marker; inactive elements use Warm Ink.

Keep the same navigation structure and component styling throughout the app. Do not let individual screens develop their own visual language.

For mobile, use a deliberate bottom-navigation or compact-menu pattern with large tap targets. Avoid tiny icon-only navigation without accessible names.
Health summary cards and timelines


Show the metric or event name, value or summary, date/range, and any relevant context together.

Distinguish user-reported information, calculated cycle statistics, AI-generated summaries, and clinician/lab records through explicit labels. Never present an AI interpretation as a confirmed medical fact.

For missing data, show “Not logged” or similar. Never invent a value to fill an empty chart.

Trends should include date ranges, units, legends, and a concise explanation. Do not imply that one food, mood, symptom, or behaviour caused another merely because they appear together.

Cycle predictions must be described as estimates when shown. Do not imply exact dates or certainty when cycle history is incomplete or irregular.
AI companion and conversational surfaces


Make the conversation feel supportive, grounded, and easy to read—not like a sci-fi assistant. Avoid glowing AI orbs, robot mascots, animated brain graphics, and decorative AI imagery.

Keep message bubbles restrained and aligned with the OSFIC palette. Prioritise readable text and useful message actions over decoration.

If the AI extracts health details from a message, present them as a reviewable proposal before saving them to the user's health timeline.

Include clear affordances to correct, dismiss, or edit a proposed record. Saved memory must have visible user controls to review, amend, or delete it.

Keep health disclaimers and seek-care guidance direct, calm, and proportionate. Do not style urgent safety information as a playful badge or gamified reward.
Calendars, reminders, and reports


Mark period days, estimated dates, logged symptoms, and appointments with clear labels or patterns—not colour alone.

Always distinguish a predicted period window from dates the user has confirmed. Provide edit/correction controls.

Reminders should be discreet, user-configurable, and respectful of privacy. Never expose sensitive menstrual or PCOS information in prominent notification previews by default.

Reports should use a clean print-friendly layout with dates, units, source labels, and missing-data context. Do not fabricate diagnoses, risk percentages, or precision scores.
Accessibility and responsive behaviour


Aim for WCAG AA contrast for text and essential controls. In particular, never use Dusty Rose text on Alabaster for small or essential copy.

Provide visible keyboard focus, semantic labels, accessible names for icon buttons, touch targets of at least 44 × 44 px, and support for zoom/text enlargement.

Do not encode meaning only in colour, location, animation, or icons. Pair visual states with text or accessible labels.

Respect reduced-motion preferences. Animation should be brief, purposeful, and never necessary to understand health information.

Design every screen for responsive desktop and mobile sizes. Avoid horizontal scrolling for primary flows.
Do's and Don'ts
Do


Do keep Cherry, Alabaster, Dusty Rose, and Warm Ink as the only approved brand palette.

Do make the product feel premium through composition, typography, detail, and restraint—not through visual effects.

Do use empathetic, plain, non-judgmental language about periods, food, weight, symptoms, fertility, and PCOS/PCOD.

Do make forms, calendars, cycle histories, timelines, reminders, and reports feel like parts of one coherent product.

Do prioritise privacy, consent, user control, and clarity when presenting sensitive health information.

Do show uncertainty honestly and label predictions, calculations, user reports, AI interpretations, and clinician records accurately.

Do use realistic interface content and believable empty, loading, error, success, and disabled states when designing screens.
Don't


Don't create a generic AI dashboard with a pile of identical rounded cards.

Don't introduce blue, purple, green, orange, neon accents, gradients, glows, glassmorphism, or extra brand colours.

Don't use pink overload, beauty-app clichés, cartoon organs, flowers, sparkles, robot mascots, or decorative AI artwork.

Don't shame users for food, weight, missed check-ins, irregular periods, symptoms, or inconsistent tracking.

Don't imply that the product diagnoses PCOS/PCOD, measures hormone levels from chat, replaces a clinician, or guarantees a period date.

Don't use unsupported “risk scores,” false precision, or causal claims in charts and summaries.

Don't hide labels inside placeholders, make essential text tiny, or rely on colour alone to communicate status.

Don't make every screen structurally different. Reuse the same spacing, navigation, buttons, inputs, cards, typography, and interaction patterns.
Final rule: When a screen-specific request conflicts with this design system, preserve the approved OSFIC palette, accessibility, calm visual hierarchy, and component consistency unless the user explicitly changes the design system.
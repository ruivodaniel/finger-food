// AUTO-GENERATED — do not edit by hand
// Run `pnpm theme:fixtures` to rebuild from _fixtures/html/**.html

import type { Fixture } from './types';

export const FIXTURES: Fixture[] = [
  {
    id: 'elements/control-groups/button-group',
    path: ["elements","control-groups","button-group"],
    label: 'Button Group',
    html: `<!-- label: Button Group -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">text group</p>
  <div role="group" element="control-group--button-group" class="inline-flex items-stretch">
    <button element="control--button" emphasis="secondary" scale="md"><span>Left</span></button>
    <button element="control--button" emphasis="secondary" scale="md" state="selected"><span>Center</span></button>
    <button element="control--button" emphasis="secondary" scale="md"><span>Right</span></button>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">icon group</p>
  <div role="group" element="control-group--button-group" class="inline-flex items-stretch">
    <button element="control--button" emphasis="secondary" scale="md">
      <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg></span>
    </button>
    <button element="control--button" emphasis="secondary" scale="md" state="selected">
      <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg></span>
    </button>
  </div>
</div>`,
  },
  {
    id: 'elements/control-groups/chip',
    path: ["elements","control-groups","chip"],
    label: 'Chip',
    html: `<!-- label: Chip -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">emphasis — scale="md"</p>
  <div class="flex gap-3 flex-wrap items-center">
    <span element="control--chip" emphasis="primary" scale="md"><span>Primary</span></span>
    <span element="control--chip" emphasis="secondary" scale="md"><span>Secondary</span></span>
    <span element="control--chip" emphasis="tertiary" scale="md"><span>Tertiary</span></span>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">state — emphasis="secondary"</p>
  <div class="flex gap-3 flex-wrap items-center">
    <span element="control--chip" emphasis="secondary" scale="md"><span>Default</span></span>
    <span element="control--chip" emphasis="secondary" scale="md" state="selected"><span>Selected</span></span>
    <span element="control--chip" emphasis="secondary" scale="md" state="disabled"><span>Disabled</span></span>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">with icon</p>
  <div class="flex gap-3 flex-wrap items-center">
    <span element="control--chip" emphasis="secondary" scale="md">
      <span data-part="start-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg></span>
      <span>Active</span>
    </span>
    <span element="control--chip" emphasis="secondary" scale="md" state="selected">
      <span>Closable</span>
      <button type="button" aria-label="Remove"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
    </span>
  </div>
</div>`,
  },
  {
    id: 'elements/control-groups/tabs',
    path: ["elements","control-groups","tabs"],
    label: 'Tabs',
    html: `<!-- label: Tabs -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">default — All / Active / Inactive / Disabled</p>
  <div element="control-group--tab-bar" class="flex">
    <button element="control--tab-trigger" emphasis="primary" scale="md" state="selected"><span>All</span></button>
    <button element="control--tab-trigger" emphasis="primary" scale="md"><span>Active</span></button>
    <button element="control--tab-trigger" emphasis="primary" scale="md"><span>Inactive</span></button>
    <button element="control--tab-trigger" emphasis="primary" scale="md" state="disabled" disabled><span>Disabled</span></button>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">scale</p>
  <div class="flex flex-col gap-2">
    <div element="control-group--tab-bar" class="flex">
      <button element="control--tab-trigger" emphasis="primary" scale="sm" state="selected"><span>SM Tab 1</span></button>
      <button element="control--tab-trigger" emphasis="primary" scale="sm"><span>SM Tab 2</span></button>
    </div>
    <div element="control-group--tab-bar" class="flex">
      <button element="control--tab-trigger" emphasis="primary" scale="md" state="selected"><span>MD Tab 1</span></button>
      <button element="control--tab-trigger" emphasis="primary" scale="md"><span>MD Tab 2</span></button>
    </div>
    <div element="control-group--tab-bar" class="flex">
      <button element="control--tab-trigger" emphasis="primary" scale="lg" state="selected"><span>LG Tab 1</span></button>
      <button element="control--tab-trigger" emphasis="primary" scale="lg"><span>LG Tab 2</span></button>
    </div>
  </div>
</div>`,
  },
  {
    id: 'elements/controls/button',
    path: ["elements","controls","button"],
    label: 'Button',
    html: `<!-- label: Button -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">emphasis — scale="md"</p>
  <div class="flex gap-3 flex-wrap items-center">
    <button element="control--button" emphasis="primary" scale="md"><span>Primary</span></button>
    <button element="control--button" emphasis="secondary" scale="md"><span>Secondary</span></button>
    <button element="control--button" emphasis="tertiary" scale="md"><span>Tertiary</span></button>
    <button element="control--button" emphasis="quiet" scale="md"><span>Quiet</span></button>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">scale — emphasis="primary"</p>
  <div class="flex gap-3 flex-wrap items-center">
    <button element="control--button" emphasis="primary" scale="xs"><span>XS</span></button>
    <button element="control--button" emphasis="primary" scale="sm"><span>SM</span></button>
    <button element="control--button" emphasis="primary" scale="md"><span>MD</span></button>
    <button element="control--button" emphasis="primary" scale="lg"><span>LG</span></button>
    <button element="control--button" emphasis="primary" scale="xl"><span>XL</span></button>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">status</p>
  <div class="flex gap-3 flex-wrap items-center">
    <button element="control--button" emphasis="primary" status="error" scale="md"><span>Error</span></button>
    <button element="control--button" emphasis="primary" status="warning" scale="md"><span>Warning</span></button>
    <button element="control--button" emphasis="primary" status="success" scale="md"><span>Success</span></button>
    <button element="control--button" emphasis="secondary" status="destructive" scale="md"><span>Destructive</span></button>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">state</p>
  <div class="flex gap-3 flex-wrap items-center">
    <button element="control--button" emphasis="primary" scale="md"><span>Default</span></button>
    <button element="control--button" emphasis="primary" scale="md" state="selected"><span>Selected</span></button>
    <button element="control--button" emphasis="primary" scale="md" state="disabled" disabled><span>Disabled</span></button>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">icon + text</p>
  <div class="flex gap-3 flex-wrap items-center">
    <button element="control--button" emphasis="primary" scale="md">
      <span data-part="start-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg></span>
      <span>Add</span>
    </button>
    <button element="control--button" emphasis="secondary" scale="md">
      <span>Continue</span>
      <span data-part="end-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
    </button>
    <button element="control--button" emphasis="primary" status="destructive" scale="md">
      <span data-part="start-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></span>
      <span>Delete</span>
    </button>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">icon only</p>
  <div class="flex gap-3 flex-wrap items-center">
    <button element="control--button" emphasis="primary" scale="md">
      <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg></span>
    </button>
    <button element="control--button" emphasis="secondary" scale="md">
      <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></span>
    </button>
    <button element="control--button" emphasis="tertiary" scale="md">
      <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
    </button>
    <button element="control--button" emphasis="quiet" scale="md">
      <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg></span>
    </button>
  </div>
</div>`,
  },
  {
    id: 'elements/controls/checkbox',
    path: ["elements","controls","checkbox"],
    label: 'Checkbox',
    html: `<!-- label: Checkbox -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">state — scale="md"</p>
  <div class="flex gap-4 flex-wrap items-center">
    <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" element="control--checkbox" emphasis="primary" scale="md"></button>
    <button type="button" role="checkbox" aria-checked="true" data-state="checked" state="selected" element="control--checkbox" emphasis="primary" scale="md"></button>
    <button type="button" role="checkbox" aria-checked="mixed" data-state="indeterminate" element="control--checkbox" emphasis="primary" scale="md"></button>
    <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" state="disabled" disabled element="control--checkbox" emphasis="primary" scale="md"></button>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">scale — all checked</p>
  <div class="flex gap-4 flex-wrap items-center">
    <button type="button" role="checkbox" aria-checked="true" data-state="checked" state="selected" element="control--checkbox" emphasis="primary" scale="sm"></button>
    <button type="button" role="checkbox" aria-checked="true" data-state="checked" state="selected" element="control--checkbox" emphasis="primary" scale="md"></button>
    <button type="button" role="checkbox" aria-checked="true" data-state="checked" state="selected" element="control--checkbox" emphasis="primary" scale="lg"></button>
  </div>
</div>`,
  },
  {
    id: 'elements/controls/radio',
    path: ["elements","controls","radio"],
    label: 'Radio',
    html: `<!-- label: Radio -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">state — scale="md"</p>
  <div class="flex gap-4 flex-wrap items-center">
    <button type="button" role="radio" aria-checked="false" data-state="unchecked" element="control--radio" emphasis="primary" scale="md"></button>
    <button type="button" role="radio" aria-checked="true" data-state="checked" state="selected" element="control--radio" emphasis="primary" scale="md"></button>
    <button type="button" role="radio" aria-checked="false" data-state="unchecked" state="disabled" disabled element="control--radio" emphasis="primary" scale="md"></button>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">scale — all checked</p>
  <div class="flex gap-4 flex-wrap items-center">
    <button type="button" role="radio" aria-checked="true" data-state="checked" state="selected" element="control--radio" emphasis="primary" scale="sm"></button>
    <button type="button" role="radio" aria-checked="true" data-state="checked" state="selected" element="control--radio" emphasis="primary" scale="md"></button>
    <button type="button" role="radio" aria-checked="true" data-state="checked" state="selected" element="control--radio" emphasis="primary" scale="lg"></button>
  </div>
</div>`,
  },
  {
    id: 'elements/controls/switch',
    path: ["elements","controls","switch"],
    label: 'Switch',
    html: `<!-- label: Switch -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">state — scale="md"</p>
  <div class="flex gap-6 flex-wrap items-center">
    <button type="button" role="switch" aria-checked="false" data-state="unchecked" element="control--switch" emphasis="primary" scale="md"><span data-part="thumb" data-state="unchecked"></span></button>
    <button type="button" role="switch" aria-checked="true" data-state="checked" state="selected" element="control--switch" emphasis="primary" scale="md"><span data-part="thumb" data-state="checked"></span></button>
    <button type="button" role="switch" aria-checked="false" data-state="unchecked" state="disabled" disabled element="control--switch" emphasis="primary" scale="md"><span data-part="thumb" data-state="unchecked"></span></button>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">scale — all checked</p>
  <div class="flex gap-6 flex-wrap items-center">
    <button type="button" role="switch" aria-checked="true" data-state="checked" state="selected" element="control--switch" emphasis="primary" scale="sm"><span data-part="thumb" data-state="checked"></span></button>
    <button type="button" role="switch" aria-checked="true" data-state="checked" state="selected" element="control--switch" emphasis="primary" scale="md"><span data-part="thumb" data-state="checked"></span></button>
    <button type="button" role="switch" aria-checked="true" data-state="checked" state="selected" element="control--switch" emphasis="primary" scale="lg"><span data-part="thumb" data-state="checked"></span></button>
  </div>
</div>`,
  },
  {
    id: 'elements/data/table',
    path: ["elements","data","table"],
    label: 'Table',
    html: `<!-- label: Table -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">header + body + footer</p>
  <table element="table--root" class="w-full">
    <thead element="table--header">
      <tr element="table--header-row">
        <th element="table--header-cell">Name</th>
        <th element="table--header-cell">Role</th>
        <th element="table--header-cell">Status</th>
        <th element="table--header-cell">Members</th>
        <th element="table--header-cell"></th>
      </tr>
    </thead>
    <tbody element="table--body">
      <tr element="table--row">
        <td element="table--cell"><div element="table--cell-content" class="flex items-center gap-2"><span element="surface--avatar" scale="sm" class="relative flex shrink-0 overflow-hidden rounded-full"><span class="flex h-full w-full items-center justify-center">PA</span></span><span element="type--body-small">Platform Admin</span></div></td>
        <td element="table--cell"><div element="table--cell-content"><span element="type--body-small">Owner</span></div></td>
        <td element="table--cell"><div element="table--cell-content"><span element="surface--badge" status="success" scale="sm">Active</span></div></td>
        <td element="table--cell"><div element="table--cell-content"><span element="surface--badge" concept="member-count" scale="xs">24</span></div></td>
        <td element="table--cell"><div element="table--cell-content"><button element="control--button" emphasis="secondary" scale="sm"><span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></button></div></td>
      </tr>
      <tr element="table--row">
        <td element="table--cell"><div element="table--cell-content" class="flex items-center gap-2"><span element="surface--avatar" scale="sm" class="relative flex shrink-0 overflow-hidden rounded-full"><span class="flex h-full w-full items-center justify-center">HC</span></span><span element="type--body-small">Health Co</span></div></td>
        <td element="table--cell"><div element="table--cell-content"><span element="type--body-small">Member</span></div></td>
        <td element="table--cell"><div element="table--cell-content"><span element="surface--badge" status="neutral" scale="sm">Inactive</span></div></td>
        <td element="table--cell"><div element="table--cell-content"><span element="surface--badge" concept="member-count" scale="xs">7</span></div></td>
        <td element="table--cell"><div element="table--cell-content"><button element="control--button" emphasis="secondary" scale="sm"><span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></button></div></td>
      </tr>
      <tr element="table--row">
        <td element="table--cell"><div element="table--cell-content" class="flex items-center gap-2"><span element="surface--avatar" scale="sm" class="relative flex shrink-0 overflow-hidden rounded-full"><span class="flex h-full w-full items-center justify-center">CN</span></span><span element="type--body-small">Organization</span></div></td>
        <td element="table--cell"><div element="table--cell-content"><span element="type--body-small">Admin</span></div></td>
        <td element="table--cell"><div element="table--cell-content"><span element="surface--badge" status="success" scale="sm">Active</span></div></td>
        <td element="table--cell"><div element="table--cell-content"><span element="surface--badge" concept="member-count" scale="xs">41</span></div></td>
        <td element="table--cell"><div element="table--cell-content"><button element="control--button" emphasis="secondary" scale="sm"><span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></button></div></td>
      </tr>
    </tbody>
    <tfoot element="table--footer">
      <tr element="table--footer-row">
        <td element="table--footer-cell" colspan="5"><div element="table--cell-content"><span element="type--body-small" emphasis="quiet">Showing 3 of 3</span></div></td>
      </tr>
    </tfoot>
  </table>
</div>`,
  },
  {
    id: 'elements/fields/input',
    path: ["elements","fields","input"],
    label: 'Input',
    html: `<!-- label: Input -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">scale</p>
  <div class="flex flex-col gap-2" style="max-width: 320px;">
    <input element="field--input" scale="sm" placeholder="Small input" class="flex" />
    <input element="field--input" scale="md" placeholder="Medium input" class="flex" />
    <input element="field--input" scale="lg" placeholder="Large input" class="flex" />
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">status</p>
  <div class="flex flex-col gap-2" style="max-width: 320px;">
    <input element="field--input" scale="md" placeholder="Default" class="flex" />
    <input element="field--input" scale="md" status="error" placeholder="Error state" class="flex" />
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">state</p>
  <div class="flex flex-col gap-2" style="max-width: 320px;">
    <input element="field--input" scale="md" placeholder="Default" class="flex" />
    <input element="field--input" scale="md" state="disabled" placeholder="Disabled" class="flex" disabled />
  </div>
</div>`,
  },
  {
    id: 'elements/fields/select',
    path: ["elements","fields","select"],
    label: 'Select',
    html: `<!-- label: Select -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">scale</p>
  <div class="flex flex-col gap-2" style="max-width: 320px;">
    <select element="field--select" scale="sm" class="flex"><option>Option A</option><option>Option B</option><option>Option C</option></select>
    <select element="field--select" scale="md" class="flex"><option>Option A</option><option>Option B</option><option>Option C</option></select>
    <select element="field--select" scale="lg" class="flex"><option>Option A</option><option>Option B</option><option>Option C</option></select>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">status + state</p>
  <div class="flex flex-col gap-2" style="max-width: 320px;">
    <select element="field--select" scale="md" class="flex"><option>Default</option></select>
    <select element="field--select" scale="md" status="error" class="flex"><option>Error state</option></select>
    <select element="field--select" scale="md" state="disabled" class="flex" disabled><option>Disabled</option></select>
  </div>
</div>`,
  },
  {
    id: 'elements/fields/textarea',
    path: ["elements","fields","textarea"],
    label: 'Textarea',
    html: `<!-- label: Textarea -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">status + state</p>
  <div class="flex flex-col gap-2" style="max-width: 320px;">
    <textarea element="field--textarea" scale="md" placeholder="Default" class="flex" rows="3"></textarea>
    <textarea element="field--textarea" scale="md" status="error" placeholder="Error state" class="flex" rows="3"></textarea>
    <textarea element="field--textarea" scale="md" state="disabled" placeholder="Disabled" class="flex" rows="3" disabled></textarea>
  </div>
</div>`,
  },
  {
    id: 'elements/foundation/separator',
    path: ["elements","foundation","separator"],
    label: 'Separator',
    html: `<!-- label: Separator -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">horizontal</p>
  <div element="surface--separator" class="w-full"></div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">vertical</p>
  <div class="flex items-center gap-3">
    <span element="type--body-small">Left</span>
    <div element="surface--separator" style="width: 1px; height: 32px; display: inline-block;"></div>
    <span element="type--body-small">Right</span>
  </div>
</div>`,
  },
  {
    id: 'elements/foundation/typography',
    path: ["elements","foundation","typography"],
    label: 'Typography',
    html: `<!-- label: Typography -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">headings</p>
  <div class="flex flex-col gap-3">
    <p element="type--heading1">Heading 1 — The quick brown fox</p>
    <p element="type--heading2">Heading 2 — The quick brown fox</p>
    <p element="type--heading3">Heading 3 — The quick brown fox</p>
    <p element="type--heading4">Heading 4 — The quick brown fox</p>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">body sizes</p>
  <div class="flex flex-col gap-3">
    <p element="type--body">Body — The quick brown fox jumps over the lazy dog</p>
    <p element="type--body-small">Body Small — The quick brown fox jumps over the lazy dog</p>
    <p element="type--body-extra-small">Body Extra Small — The quick brown fox jumps over the lazy dog</p>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">emphasis</p>
  <div class="flex flex-col gap-2">
    <p element="type--body">Default — The quick brown fox jumps over the lazy dog</p>
    <p element="type--body" emphasis="quiet">Quiet — The quick brown fox jumps over the lazy dog</p>
  </div>
</div>`,
  },
  {
    id: 'elements/indicators/avatar',
    path: ["elements","indicators","avatar"],
    label: 'Avatar',
    html: `<!-- label: Avatar -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">scale</p>
  <div class="flex gap-4 flex-wrap items-end">
    <span element="surface--avatar" scale="xs" class="relative flex shrink-0 overflow-hidden rounded-full"><span class="flex h-full w-full items-center justify-center">XS</span></span>
    <span element="surface--avatar" scale="sm" class="relative flex shrink-0 overflow-hidden rounded-full"><span class="flex h-full w-full items-center justify-center">SM</span></span>
    <span element="surface--avatar" scale="md" class="relative flex shrink-0 overflow-hidden rounded-full"><span class="flex h-full w-full items-center justify-center">MD</span></span>
    <span element="surface--avatar" scale="lg" class="relative flex shrink-0 overflow-hidden rounded-full"><span class="flex h-full w-full items-center justify-center">LG</span></span>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">fallback initials — scale="md"</p>
  <div class="flex gap-4 flex-wrap items-center">
    <span element="surface--avatar" scale="md" class="relative flex shrink-0 overflow-hidden rounded-full"><span class="flex h-full w-full items-center justify-center">JD</span></span>
    <span element="surface--avatar" scale="md" class="relative flex shrink-0 overflow-hidden rounded-full"><span class="flex h-full w-full items-center justify-center">PA</span></span>
    <span element="surface--avatar" scale="md" class="relative flex shrink-0 overflow-hidden rounded-full"><span class="flex h-full w-full items-center justify-center">AB</span></span>
  </div>
</div>`,
  },
  {
    id: 'elements/indicators/badge',
    path: ["elements","indicators","badge"],
    label: 'Badge',
    html: `<!-- label: Badge -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">status — scale="sm"</p>
  <div class="flex gap-3 flex-wrap items-center">
    <span element="surface--badge" scale="sm" status="neutral">Neutral</span>
    <span element="surface--badge" scale="sm" status="info">Info</span>
    <span element="surface--badge" scale="sm" status="success">Success</span>
    <span element="surface--badge" scale="sm" status="warning">Warning</span>
    <span element="surface--badge" scale="sm" status="error">Error</span>
    <span element="surface--badge" scale="sm" status="destructive">Destructive</span>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">scale — status="neutral"</p>
  <div class="flex gap-3 flex-wrap items-center">
    <span element="surface--badge" scale="xs" status="neutral">XS</span>
    <span element="surface--badge" scale="sm" status="neutral">SM</span>
    <span element="surface--badge" scale="md" status="neutral">MD</span>
    <span element="surface--badge" scale="lg" status="neutral">LG</span>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">concept="member-count"</p>
  <div class="flex gap-3 flex-wrap items-center">
    <span element="surface--badge" scale="xs" status="neutral" concept="member-count">0</span>
    <span element="surface--badge" scale="xs" status="neutral" concept="member-count">7</span>
    <span element="surface--badge" scale="xs" status="neutral" concept="member-count">42</span>
  </div>
</div>`,
  },
  {
    id: 'elements/indicators/skeleton',
    path: ["elements","indicators","skeleton"],
    label: 'Skeleton',
    html: `<!-- label: Skeleton -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">text lines</p>
  <div class="flex flex-col gap-2">
    <div element="surface--skeleton" class="h-4 rounded" style="width: 200px;"></div>
    <div element="surface--skeleton" class="h-4 rounded" style="width: 300px;"></div>
    <div element="surface--skeleton" class="h-4 rounded" style="width: 150px;"></div>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">avatar + text combo</p>
  <div class="flex gap-3 items-center">
    <div element="surface--skeleton" class="rounded-full shrink-0" style="width: 40px; height: 40px;"></div>
    <div class="flex flex-col gap-2">
      <div element="surface--skeleton" class="h-4 rounded" style="width: 160px;"></div>
      <div element="surface--skeleton" class="h-4 rounded" style="width: 100px;"></div>
    </div>
  </div>
</div>`,
  },
  {
    id: 'elements/indicators/spinner',
    path: ["elements","indicators","spinner"],
    label: 'Spinner',
    html: `<!-- label: Spinner -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">scale</p>
  <div class="flex gap-6 flex-wrap items-center">
    <span element="surface--spinner" scale="xs"></span>
    <span element="surface--spinner" scale="sm"></span>
    <span element="surface--spinner" scale="md"></span>
    <span element="surface--spinner" scale="lg"></span>
  </div>
</div>`,
  },
  {
    id: 'elements/lists/accordion',
    path: ["elements","lists","accordion"],
    label: 'Accordion',
    html: `<!-- label: Accordion -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">closed / open / closed</p>
  <div class="flex flex-col" style="max-width: 400px;">
    <div element="list--accordion" data-state="closed">
      <button element="control--button" emphasis="tertiary" scale="md" class="w-full justify-between">
        <span>What is Acme?</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
    </div>
    <div element="list--accordion" data-state="open">
      <button element="control--button" emphasis="tertiary" scale="md" class="w-full justify-between">
        <span>How do I manage my organization?</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>
      </button>
      <div class="px-4 pb-4">
        <p element="type--body-small" emphasis="quiet">Navigate to Settings → Organization to invite members, change roles, and configure access.</p>
      </div>
    </div>
    <div element="list--accordion" data-state="closed">
      <button element="control--button" emphasis="tertiary" scale="md" class="w-full justify-between">
        <span>What roles are available?</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
    </div>
  </div>
</div>`,
  },
  {
    id: 'elements/lists/list',
    path: ["elements","lists","list"],
    label: 'List',
    html: `<!-- label: List -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">basic</p>
  <ul element="list--list" class="flex flex-col" style="max-width: 400px;">
    <li element="list--item" class="flex items-center justify-between">
      <span element="type--body">Alice Johnson</span>
      <span element="surface--badge" status="success" scale="sm">Active</span>
    </li>
    <li element="list--item" class="flex items-center justify-between">
      <span element="type--body">Bob Smith</span>
      <span element="surface--badge" status="neutral" scale="sm">Invited</span>
    </li>
    <li element="list--item" class="flex items-center justify-between">
      <span element="type--body">Carol White</span>
      <span element="surface--badge" status="warning" scale="sm">Pending</span>
    </li>
  </ul>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">with avatar</p>
  <ul element="list--list" class="flex flex-col" style="max-width: 400px;">
    <li element="list--item" class="flex items-center gap-3">
      <span element="surface--avatar" scale="sm" class="relative flex shrink-0 overflow-hidden rounded-full"><span class="flex h-full w-full items-center justify-center">AJ</span></span>
      <div class="flex flex-col min-w-0">
        <span element="type--body">Alice Johnson</span>
        <span element="type--body-small" emphasis="quiet">alice@example.com</span>
      </div>
      <span element="surface--badge" status="success" scale="sm" class="ml-auto">Active</span>
    </li>
    <li element="list--item" class="flex items-center gap-3">
      <span element="surface--avatar" scale="sm" class="relative flex shrink-0 overflow-hidden rounded-full"><span class="flex h-full w-full items-center justify-center">BS</span></span>
      <div class="flex flex-col min-w-0">
        <span element="type--body">Bob Smith</span>
        <span element="type--body-small" emphasis="quiet">bob@example.com</span>
      </div>
      <span element="surface--badge" status="neutral" scale="sm" class="ml-auto">Invited</span>
    </li>
  </ul>
</div>`,
  },
  {
    id: 'elements/navigation/breadcrumb',
    path: ["elements","navigation","breadcrumb"],
    label: 'Breadcrumb',
    html: `<!-- label: Breadcrumb -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">Home / Organizations / Platform Admin</p>
  <nav element="control-group--breadcrumb">
    <ol class="flex items-center gap-2">
      <li><a href="#" element="control--nav-item" emphasis="tertiary" scale="sm">Home</a></li>
      <li><span element="type--body-small" emphasis="quiet">/</span></li>
      <li><a href="#" element="control--nav-item" emphasis="tertiary" scale="sm">Organizations</a></li>
      <li><span element="type--body-small" emphasis="quiet">/</span></li>
      <li><span element="type--body-small">Platform Admin</span></li>
    </ol>
  </nav>
</div>`,
  },
  {
    id: 'elements/navigation/pagination',
    path: ["elements","navigation","pagination"],
    label: 'Pagination',
    html: `<!-- label: Pagination -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">Previous (disabled) | 1 | 2 (selected) | 3 | … | 12 | Next</p>
  <nav element="control-group--pagination-bar" aria-label="Pagination">
    <ol class="flex items-center gap-1">
      <li>
        <button element="control--button" emphasis="tertiary" scale="sm" state="disabled" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          Previous
        </button>
      </li>
      <li><button element="control--button" emphasis="tertiary" scale="sm"><span>1</span></button></li>
      <li><button element="control--button" emphasis="tertiary" scale="sm" state="selected"><span>2</span></button></li>
      <li><button element="control--button" emphasis="tertiary" scale="sm"><span>3</span></button></li>
      <li><span element="type--body-small" class="px-1">…</span></li>
      <li><button element="control--button" emphasis="tertiary" scale="sm"><span>12</span></button></li>
      <li>
        <button element="control--button" emphasis="tertiary" scale="sm">
          Next
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </li>
    </ol>
  </nav>
</div>`,
  },
  {
    id: 'elements/surfaces/alert',
    path: ["elements","surfaces","alert"],
    label: 'Alert',
    html: `<!-- label: Alert -->
<div class="flex flex-col gap-3" style="max-width: 480px;">
  <p element="type--body-extra-small" emphasis="quiet">status</p>
  <div element="surface--alert" status="info" class="flex gap-3 items-start">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    <div><p element="type--body-small">An informational message.</p></div>
  </div>
  <div element="surface--alert" status="success" class="flex gap-3 items-start">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
    <div><p element="type--body-small">Action completed successfully.</p></div>
  </div>
  <div element="surface--alert" status="warning" class="flex gap-3 items-start">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
    <div><p element="type--body-small">Something needs your attention.</p></div>
  </div>
  <div element="surface--alert" status="error" class="flex gap-3 items-start">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" element="shape--icon" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
    <div><p element="type--body-small">Something went wrong.</p></div>
  </div>
</div>`,
  },
  {
    id: 'elements/surfaces/card',
    path: ["elements","surfaces","card"],
    label: 'Card',
    html: `<!-- label: Card -->
<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">default — header / content / footer</p>
  <div element="surface--card" class="flex flex-col" style="max-width: 400px;">
    <div element="surface--header">
      <h4 element="type--heading4">Card Title</h4>
      <p element="type--body-small" emphasis="quiet">A short description of this card.</p>
    </div>
    <div element="surface--content">
      <p element="type--body-small">Card body content goes here.</p>
    </div>
    <div element="surface--footer" class="flex gap-2 justify-end">
      <button element="control--button" emphasis="secondary" scale="sm"><span>Cancel</span></button>
      <button element="control--button" emphasis="primary" scale="sm"><span>Save</span></button>
    </div>
  </div>
</div>

<div class="flex flex-col gap-3">
  <p element="type--body-extra-small" emphasis="quiet">with badge in header</p>
  <div element="surface--card" class="flex flex-col" style="max-width: 400px;">
    <div element="surface--header" class="flex justify-between items-start">
      <h4 element="type--heading4">Organization Status</h4>
      <span element="surface--badge" status="success" scale="xs">Active</span>
    </div>
    <div element="surface--content">
      <p element="type--body-small">Platform Admin · 24 members</p>
    </div>
  </div>
</div>`,
  },
  {
    id: 'layout-01',
    path: ["layout-01"],
    label: 'Layout 01',
    html: `<div layout="shell" class="flex h-screen w-full overflow-hidden">
    <div layout="shell-side-nav" class="flex h-full flex-shrink-0 flex-col overflow-hidden">
        <div layout="left-sidebar" scale="md" class="group/sidebar-wrapper flex min-h-0 h-full">
            this is the sidebad
        </div>
    </div>
    <div layout="page" class="flex flex-1 flex-col min-h-0 overflow-hidden">
        this page
        <div layout="page-body">
            this page body
            <div layout="main">
                this is main
                <div layout="main-body" >
                    this is main body
                    <div layout="container" scale="md" >
                        this is the container
                        <div element="surface--card" class="flex flex-col p-10" style="height: 400px;">
                            <div class="" style="width: 100%; height: 100%; overflow-y: scroll;">
                                <h1>
                                    this is a card 
                                </h1>
                                Exhibit jurisdiction material covenant party jurisdiction licensor subcontractor approval law therein. Remedy settlement majeure payment intellectual invoice survival covenant annex nondisclosure notice void whereas governing execution. Assignment scope thereof statute binding litigation mutual termination agreement intellectual deliverable liability. Litigation remedy validity consent agreement pursuant damages modification warranty settlement licensee majeure right schedule modification. Payment disclosure annex indemnity authorization subcontractor annex unenforceable modification annex nondisclosure entirety compliance licensee confidentiality.
                                Term whereas governing recital consent nondisclosure liability right. Remedy confidentiality party statute delegation reimbursement affiliate settlement invoice survival duty. Mediation pursuant warranty remedy delegation claim default successor property modification party. Nondisclosure term proprietary therefore consent license property herein majeure fee indemnity nondisclosure clause consent delegation. Parties law confidentiality therefore appendix therein waiver recital regulation schedule annex damages successor signatory contract.
                                Exhibit jurisdiction material covenant party jurisdiction licensor subcontractor approval law therein. Remedy settlement majeure payment intellectual invoice survival covenant annex nondisclosure notice void whereas governing execution. Assignment scope thereof statute binding litigation mutual termination agreement intellectual deliverable liability. Litigation remedy validity consent agreement pursuant damages modification warranty settlement licensee majeure right schedule modification. Payment disclosure annex indemnity authorization subcontractor annex unenforceable modification annex nondisclosure entirety compliance licensee confidentiality.
                                Term whereas governing recital consent nondisclosure liability right. Remedy confidentiality party statute delegation reimbursement affiliate settlement invoice survival duty. Mediation pursuant warranty remedy delegation claim default successor property modification party. Nondisclosure term proprietary therefore consent license property herein majeure fee indemnity nondisclosure clause consent delegation. Parties law confidentiality therefore appendix therein waiver recital regulation schedule annex damages successor signatory contract.
                                Exhibit jurisdiction material covenant party jurisdiction licensor subcontractor approval law therein. Remedy settlement majeure payment intellectual invoice survival covenant annex nondisclosure notice void whereas governing execution. Assignment scope thereof statute binding litigation mutual termination agreement intellectual deliverable liability. Litigation remedy validity consent agreement pursuant damages modification warranty settlement licensee majeure right schedule modification. Payment disclosure annex indemnity authorization subcontractor annex unenforceable modification annex nondisclosure entirety compliance licensee confidentiality.
                                Term whereas governing recital consent nondisclosure liability right. Remedy confidentiality party statute delegation reimbursement affiliate settlement invoice survival duty. Mediation pursuant warranty remedy delegation claim default successor property modification party. Nondisclosure term proprietary therefore consent license property herein majeure fee indemnity nondisclosure clause consent delegation. Parties law confidentiality therefore appendix therein waiver recital regulation schedule annex damages successor signatory contract.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`,
  },
  {
    id: 'organizations',
    path: ["organizations"],
    label: 'Organizations',
    html: `<body cz-shortcut-listen="true" style="">
    <div id="root">
        <div layout="shell" class="flex h-screen w-full overflow-clip">
            <div layout="shell-side-nav" class="flex h-full flex-shrink-0 flex-col overflow-clip">
                <div class="group/sidebar-wrapper flex min-h-0 h-full">
                    <div element="control-group--sidebar-nav"
                        class="peer hidden md:flex shrink-0 flex-col overflow-hidden w-14" concept="collapsed"
                        collapsed="" data-testid="app-sidebar" style="transition: width 400ms ease-in-out;">
                        <div element="surface--header" class="flex w-full flex-col">
                            <ul class="flex w-full min-w-0 flex-col">
                                <li class="group/menu-item relative w-full"><button element="control--nav-item"
                                        emphasis="tertiary" scale="lg"
                                        class="peer/menu-button flex w-full items-center overflow-hidden disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed [&amp;&gt;span:last-child]:truncate [&amp;&gt;svg]:shrink-0"
                                        concept="org-switcher-nav" data-testid="org-switcher-trigger" type="button"
                                        id="radix-_r_0_" aria-haspopup="menu" aria-expanded="false"
                                        data-state="closed"><span element="surface--avatar" scale="md"
                                            class="relative flex shrink-0 overflow-hidden size-8"><span
                                                class="flex items-center justify-center">PS</span></span>
                                        <div class="grid flex-1"><span element="surface--org-name"
                                                class="truncate">PROWD System Admin</span></div><svg
                                            xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round"
                                            class="lucide lucide-ellipsis-vertical ms-auto" element="shape--icon"
                                            aria-hidden="true">
                                            <circle cx="12" cy="12" r="1"></circle>
                                            <circle cx="12" cy="5" r="1"></circle>
                                            <circle cx="12" cy="19" r="1"></circle>
                                        </svg>
                                    </button></li>
                            </ul>
                        </div>
                        <div element="surface--content" class="flex w-full min-h-0 flex-1 flex-col overflow-auto">
                            <div class="relative flex w-full min-w-0 flex-col">
                                <ul class="flex w-full min-w-0 flex-col">
                                    <li class="group/menu-item relative w-full"><button element="control--nav-item"
                                            emphasis="primary" scale="md"
                                            class="peer/menu-button flex w-full items-center overflow-hidden disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed [&amp;&gt;span:last-child]:truncate [&amp;&gt;svg]:shrink-0"
                                            concept="sidebar-toggle" data-state="closed"><svg
                                                xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round"
                                                class="lucide lucide-panel-left" element="shape--icon"
                                                aria-hidden="true">
                                                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                                                <path d="M9 3v18"></path>
                                            </svg><span element="surface--nav-item-title"
                                                class="flex-1 truncate">Expand</span></button></li>
                                </ul>
                            </div>
                            <div class="relative flex w-full min-w-0 flex-col">
                                <ul class="flex w-full min-w-0 flex-col">
                                    <li class="group/menu-item relative w-full"><a data-testid="nav-organizations"
                                            element="control--nav-item" emphasis="primary" scale="md"
                                            concept="main-nav-item" data-state="closed" state="selected"
                                            href="/organizations"
                                            class="peer/menu-button flex w-full items-center overflow-hidden disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed [&amp;&gt;span:last-child]:truncate [&amp;&gt;svg]:shrink-0"
                                            data-status="active" aria-current="page"><svg
                                                xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round"
                                                class="lucide lucide-network" aria-hidden="true"
                                                element="surface--nav-item-icon">
                                                <rect x="16" y="16" width="6" height="6" rx="1"></rect>
                                                <rect x="2" y="16" width="6" height="6" rx="1"></rect>
                                                <rect x="9" y="2" width="6" height="6" rx="1"></rect>
                                                <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
                                                <path d="M12 12V8"></path>
                                            </svg><span element="surface--nav-item-title"
                                                class="flex-1 truncate">Organizations</span></a></li>
                                </ul>
                            </div>
                        </div>
                        <div element="surface--footer" class="flex w-full flex-col">
                            <ul class="flex w-full min-w-0 flex-col">
                                <li class="group/menu-item relative w-full"><button element="control--nav-item"
                                        emphasis="tertiary" scale="lg"
                                        class="peer/menu-button flex w-full items-center overflow-hidden disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed [&amp;&gt;span:last-child]:truncate [&amp;&gt;svg]:shrink-0"
                                        concept="notifications-nav" data-testid="notifications-trigger" type="button"
                                        id="radix-_r_3_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
                                        <div class="relative"><svg xmlns="http://www.w3.org/2000/svg" width="24"
                                                height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                class="lucide lucide-bell" element="shape--icon" scale="md"
                                                aria-hidden="true">
                                                <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
                                                <path
                                                    d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326">
                                                </path>
                                            </svg></div><span>Notifications</span>
                                    </button></li>
                            </ul>
                            <ul class="flex w-full min-w-0 flex-col">
                                <li class="group/menu-item relative w-full"><button element="control--nav-item"
                                        emphasis="tertiary" scale="lg"
                                        class="peer/menu-button flex w-full items-center overflow-hidden disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed [&amp;&gt;span:last-child]:truncate [&amp;&gt;svg]:shrink-0"
                                        concept="user-account-nav" data-testid="user-menu-trigger" type="button"
                                        id="radix-_r_5_" aria-haspopup="menu" aria-expanded="false"
                                        data-state="closed"><span element="surface--avatar" scale="md"
                                            class="relative flex shrink-0 overflow-hidden size-8"><span
                                                class="flex items-center justify-center">DD</span></span>
                                        <div class="grid flex-1"><span class="truncate font-semibold">Daniel de Castro
                                                Ruivo</span><span class="truncate">danielcastroruivo@gmail.com</span>
                                        </div><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round"
                                            class="lucide lucide-ellipsis-vertical ms-auto" element="shape--icon"
                                            aria-hidden="true">
                                            <circle cx="12" cy="12" r="1"></circle>
                                            <circle cx="12" cy="5" r="1"></circle>
                                            <circle cx="12" cy="19" r="1"></circle>
                                        </svg>
                                    </button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div style="flex: 1 1 0%; height: 100%; overflow-y: auto;">
                <div layout="page" class="flex flex-1 flex-col min-h-0">
                    <div layout="page-body" class="" data-testid="organizations-list-page">
                        <div layout="main" class="">
                            <div layout="main-body" class="">
                                <div layout="container" scale="lg">
                                    <div layout="col-section">
                                        <div layout="row-section" concept="top-header">
                                            <div class="flex flex-1">
                                                <h2 element="type--heading2">All Organizations</h2>
                                            </div><button element="control--button" emphasis="primary" scale="md"
                                                class="" data-testid="org-create-btn"><span data-part="start-icon"><svg
                                                        xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                                                        class="lucide lucide-plus shrink-0" element="shape--icon"
                                                        aria-hidden="true">
                                                        <path d="M5 12h14"></path>
                                                        <path d="M12 5v14"></path>
                                                    </svg></span><span>Create Organization</span></button>
                                        </div>
                                        <div element="surface--card" class="flex flex-col">
                                            <div element="surface--header"
                                                class="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[1fr_auto]"
                                                layout="row-section" concept="card-header">
                                                <div layout="row-section" class="flex flex-wrap items-center w-full">
                                                    <div element="field--input" scale="sm"
                                                        class="flex items-center min-w-0 flex-1"><span
                                                            data-part="start-icon"><svg
                                                                xmlns="http://www.w3.org/2000/svg" width="24"
                                                                height="24" viewBox="0 0 24 24" fill="none"
                                                                stroke="currentColor" stroke-width="2"
                                                                stroke-linecap="round" stroke-linejoin="round"
                                                                class="lucide lucide-search" element="shape--icon"
                                                                aria-hidden="true">
                                                                <path d="m21 21-4.34-4.34"></path>
                                                                <circle cx="11" cy="11" r="8"></circle>
                                                            </svg></span><input class="min-w-0 flex-1"
                                                            placeholder="Search organizations..."
                                                            data-testid="org-filter-search" type="text" value=""></div>
                                                    <button type="button" role="combobox" aria-controls="radix-_r_7_"
                                                        aria-expanded="false" aria-autocomplete="none" dir="ltr"
                                                        data-state="closed" element="field--select" scale="md"
                                                        class="flex items-center justify-between disabled:pointer-events-none disabled:cursor-not-allowed [&amp;&gt;span]:line-clamp-1 w-44"><span
                                                            style="pointer-events: none;">All Status</span><svg
                                                            xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                            stroke-width="2" stroke-linecap="round"
                                                            stroke-linejoin="round"
                                                            class="lucide lucide-chevron-down size-4 shrink-0"
                                                            aria-hidden="true">
                                                            <path d="m6 9 6 6 6-6"></path>
                                                        </svg></button><button type="button" role="combobox"
                                                        aria-controls="radix-_r_8_" aria-expanded="false"
                                                        aria-autocomplete="none" dir="ltr" data-state="closed"
                                                        element="field--select" scale="md"
                                                        class="flex items-center justify-between disabled:pointer-events-none disabled:cursor-not-allowed [&amp;&gt;span]:line-clamp-1 w-44"><span
                                                            style="pointer-events: none;">All Types</span><svg
                                                            xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                            stroke-width="2" stroke-linecap="round"
                                                            stroke-linejoin="round"
                                                            class="lucide lucide-chevron-down size-4 shrink-0"
                                                            aria-hidden="true">
                                                            <path d="m6 9 6 6 6-6"></path>
                                                        </svg></button>
                                                </div>
                                            </div>
                                            <div element="surface--content" class="">
                                                <div layout="col-section" class="relative">
                                                    <div
                                                        class="absolute inset-0 z-10 items-center justify-center hidden">
                                                        <div element="surface--spinner" scale="md"
                                                            class="flex items-center justify-center">
                                                            <div class="animate-spin"></div>
                                                        </div>
                                                    </div>
                                                    <div class="relative overflow-x-auto">
                                                        <table element="table--root" class="w-full"
                                                            data-testid="org-list">
                                                            <thead element="table--header" class="">
                                                                <tr element="table--header-row" class="">
                                                                    <th element="table--header-cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        Name</th>
                                                                    <th element="table--header-cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        Type</th>
                                                                    <th element="table--header-cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        Contact Person</th>
                                                                    <th element="table--header-cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        Status</th>
                                                                    <th element="table--header-cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        Members</th>
                                                                    <th element="table--header-cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody element="table--body" class="">
                                                                <tr element="table--row" class="" layout="item"
                                                                    data-testid="org-card">
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--avatar" scale="md"
                                                                                class="relative flex shrink-0 overflow-hidden size-10"><span
                                                                                    class="flex items-center justify-center">AI</span></span><span
                                                                                element="type--heading4">ACME inc</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24" height="24"
                                                                                viewBox="0 0 24 24" fill="none"
                                                                                stroke="currentColor" stroke-width="2"
                                                                                stroke-linecap="round"
                                                                                stroke-linejoin="round"
                                                                                class="lucide lucide-building2 lucide-building-2"
                                                                                element="shape--icon" scale="sm"
                                                                                aria-label="Company"
                                                                                aria-hidden="false">
                                                                                <path
                                                                                    d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z">
                                                                                </path>
                                                                                <path
                                                                                    d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2">
                                                                                </path>
                                                                                <path
                                                                                    d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2">
                                                                                </path>
                                                                                <path d="M10 6h4"></path>
                                                                                <path d="M10 10h4"></path>
                                                                                <path d="M10 14h4"></path>
                                                                                <path d="M10 18h4"></path>
                                                                            </svg><span element="type--body-small"
                                                                                emphasis="quiet">Company</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center">-</div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" status="success"
                                                                                scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden">Active</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden"
                                                                                concept="member-count">1</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]"
                                                                        concept="row-actions">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><button
                                                                                element="control--button"
                                                                                emphasis="secondary" scale="sm"
                                                                                class=""><span><svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="24" height="24"
                                                                                        viewBox="0 0 24 24" fill="none"
                                                                                        stroke="currentColor"
                                                                                        stroke-width="2"
                                                                                        stroke-linecap="round"
                                                                                        stroke-linejoin="round"
                                                                                        class="lucide lucide-arrow-right shrink-0"
                                                                                        element="shape--icon"
                                                                                        aria-hidden="true">
                                                                                        <path d="M5 12h14"></path>
                                                                                        <path d="m12 5 7 7-7 7"></path>
                                                                                    </svg></span></button></div>
                                                                    </td>
                                                                </tr>
                                                                <tr element="table--row" class="" layout="item"
                                                                    data-testid="org-card">
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--avatar" scale="md"
                                                                                class="relative flex shrink-0 overflow-hidden size-10"><span
                                                                                    class="flex items-center justify-center">A</span></span><span
                                                                                element="type--heading4">Altar</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24" height="24"
                                                                                viewBox="0 0 24 24" fill="none"
                                                                                stroke="currentColor" stroke-width="2"
                                                                                stroke-linecap="round"
                                                                                stroke-linejoin="round"
                                                                                class="lucide lucide-building2 lucide-building-2"
                                                                                element="shape--icon" scale="sm"
                                                                                aria-label="Company"
                                                                                aria-hidden="false">
                                                                                <path
                                                                                    d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z">
                                                                                </path>
                                                                                <path
                                                                                    d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2">
                                                                                </path>
                                                                                <path
                                                                                    d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2">
                                                                                </path>
                                                                                <path d="M10 6h4"></path>
                                                                                <path d="M10 10h4"></path>
                                                                                <path d="M10 14h4"></path>
                                                                                <path d="M10 18h4"></path>
                                                                            </svg><span element="type--body-small"
                                                                                emphasis="quiet">Company</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center">-</div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" status="success"
                                                                                scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden">Active</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden"
                                                                                concept="member-count">2</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]"
                                                                        concept="row-actions">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><button
                                                                                element="control--button"
                                                                                emphasis="secondary" scale="sm"
                                                                                class=""><span><svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="24" height="24"
                                                                                        viewBox="0 0 24 24" fill="none"
                                                                                        stroke="currentColor"
                                                                                        stroke-width="2"
                                                                                        stroke-linecap="round"
                                                                                        stroke-linejoin="round"
                                                                                        class="lucide lucide-arrow-right shrink-0"
                                                                                        element="shape--icon"
                                                                                        aria-hidden="true">
                                                                                        <path d="M5 12h14"></path>
                                                                                        <path d="m12 5 7 7-7 7"></path>
                                                                                    </svg></span></button></div>
                                                                    </td>
                                                                </tr>
                                                                <tr element="table--row" class="" layout="item"
                                                                    data-testid="org-card">
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--avatar" scale="md"
                                                                                class="relative flex shrink-0 overflow-hidden size-10"><span
                                                                                    class="flex items-center justify-center">AE</span></span><span
                                                                                element="type--heading4">Avo
                                                                                Emilia</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24" height="24"
                                                                                viewBox="0 0 24 24" fill="none"
                                                                                stroke="currentColor" stroke-width="2"
                                                                                stroke-linecap="round"
                                                                                stroke-linejoin="round"
                                                                                class="lucide lucide-heart"
                                                                                element="shape--icon" scale="sm"
                                                                                aria-label="Organization"
                                                                                aria-hidden="false">
                                                                                <path
                                                                                    d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z">
                                                                                </path>
                                                                            </svg><span element="type--body-small"
                                                                                emphasis="quiet">Organization</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center">-</div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" status="success"
                                                                                scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden">Active</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden"
                                                                                concept="member-count">2</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]"
                                                                        concept="row-actions">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><button
                                                                                element="control--button"
                                                                                emphasis="secondary" scale="sm"
                                                                                class=""><span><svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="24" height="24"
                                                                                        viewBox="0 0 24 24" fill="none"
                                                                                        stroke="currentColor"
                                                                                        stroke-width="2"
                                                                                        stroke-linecap="round"
                                                                                        stroke-linejoin="round"
                                                                                        class="lucide lucide-arrow-right shrink-0"
                                                                                        element="shape--icon"
                                                                                        aria-hidden="true">
                                                                                        <path d="M5 12h14"></path>
                                                                                        <path d="m12 5 7 7-7 7"></path>
                                                                                    </svg></span></button></div>
                                                                    </td>
                                                                </tr>
                                                                <tr element="table--row" class="" layout="item"
                                                                    data-testid="org-card">
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--avatar" scale="md"
                                                                                class="relative flex shrink-0 overflow-hidden size-10"><span
                                                                                    class="flex items-center justify-center">AM</span></span><span
                                                                                element="type--heading4">avo
                                                                                maria</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24" height="24"
                                                                                viewBox="0 0 24 24" fill="none"
                                                                                stroke="currentColor" stroke-width="2"
                                                                                stroke-linecap="round"
                                                                                stroke-linejoin="round"
                                                                                class="lucide lucide-heart"
                                                                                element="shape--icon" scale="sm"
                                                                                aria-label="Organization"
                                                                                aria-hidden="false">
                                                                                <path
                                                                                    d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z">
                                                                                </path>
                                                                            </svg><span element="type--body-small"
                                                                                emphasis="quiet">Organization</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center">-</div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" status="success"
                                                                                scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden">Active</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden"
                                                                                concept="member-count">1</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]"
                                                                        concept="row-actions">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><button
                                                                                element="control--button"
                                                                                emphasis="secondary" scale="sm"
                                                                                class=""><span><svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="24" height="24"
                                                                                        viewBox="0 0 24 24" fill="none"
                                                                                        stroke="currentColor"
                                                                                        stroke-width="2"
                                                                                        stroke-linecap="round"
                                                                                        stroke-linejoin="round"
                                                                                        class="lucide lucide-arrow-right shrink-0"
                                                                                        element="shape--icon"
                                                                                        aria-hidden="true">
                                                                                        <path d="M5 12h14"></path>
                                                                                        <path d="m12 5 7 7-7 7"></path>
                                                                                    </svg></span></button></div>
                                                                    </td>
                                                                </tr>
                                                                <tr element="table--row" class="" layout="item"
                                                                    data-testid="org-card">
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--avatar" scale="md"
                                                                                class="relative flex shrink-0 overflow-hidden size-10"><span
                                                                                    class="flex items-center justify-center">AR</span></span><span
                                                                                element="type--heading4">Avo
                                                                                Rogerio</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24" height="24"
                                                                                viewBox="0 0 24 24" fill="none"
                                                                                stroke="currentColor" stroke-width="2"
                                                                                stroke-linecap="round"
                                                                                stroke-linejoin="round"
                                                                                class="lucide lucide-heart"
                                                                                element="shape--icon" scale="sm"
                                                                                aria-label="Organization"
                                                                                aria-hidden="false">
                                                                                <path
                                                                                    d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z">
                                                                                </path>
                                                                            </svg><span element="type--body-small"
                                                                                emphasis="quiet">Organization</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center">-</div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" status="success"
                                                                                scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden">Active</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden"
                                                                                concept="member-count">1</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]"
                                                                        concept="row-actions">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><button
                                                                                element="control--button"
                                                                                emphasis="secondary" scale="sm"
                                                                                class=""><span><svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="24" height="24"
                                                                                        viewBox="0 0 24 24" fill="none"
                                                                                        stroke="currentColor"
                                                                                        stroke-width="2"
                                                                                        stroke-linecap="round"
                                                                                        stroke-linejoin="round"
                                                                                        class="lucide lucide-arrow-right shrink-0"
                                                                                        element="shape--icon"
                                                                                        aria-hidden="true">
                                                                                        <path d="M5 12h14"></path>
                                                                                        <path d="m12 5 7 7-7 7"></path>
                                                                                    </svg></span></button></div>
                                                                    </td>
                                                                </tr>
                                                                <tr element="table--row" class="" layout="item"
                                                                    data-testid="org-card">
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--avatar" scale="md"
                                                                                class="relative flex shrink-0 overflow-hidden size-10"><span
                                                                                    class="flex items-center justify-center">DC</span></span><span
                                                                                element="type--heading4">Dorothy Team
                                                                                Network</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24" height="24"
                                                                                viewBox="0 0 24 24" fill="none"
                                                                                stroke="currentColor" stroke-width="2"
                                                                                stroke-linecap="round"
                                                                                stroke-linejoin="round"
                                                                                class="lucide lucide-heart"
                                                                                element="shape--icon" scale="sm"
                                                                                aria-label="Organization"
                                                                                aria-hidden="false">
                                                                                <path
                                                                                    d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z">
                                                                                </path>
                                                                            </svg><span element="type--body-small"
                                                                                emphasis="quiet">Organization</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center">-</div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" status="success"
                                                                                scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden">Active</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden"
                                                                                concept="member-count">4</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]"
                                                                        concept="row-actions">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><button
                                                                                element="control--button"
                                                                                emphasis="secondary" scale="sm"
                                                                                class=""><span><svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="24" height="24"
                                                                                        viewBox="0 0 24 24" fill="none"
                                                                                        stroke="currentColor"
                                                                                        stroke-width="2"
                                                                                        stroke-linecap="round"
                                                                                        stroke-linejoin="round"
                                                                                        class="lucide lucide-arrow-right shrink-0"
                                                                                        element="shape--icon"
                                                                                        aria-hidden="true">
                                                                                        <path d="M5 12h14"></path>
                                                                                        <path d="m12 5 7 7-7 7"></path>
                                                                                    </svg></span></button></div>
                                                                    </td>
                                                                </tr>
                                                                <tr element="table--row" class="" layout="item"
                                                                    data-testid="org-card">
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--avatar" scale="md"
                                                                                class="relative flex shrink-0 overflow-hidden size-10"><span
                                                                                    class="flex items-center justify-center">LC</span></span><span
                                                                                element="type--heading4">Linda Team
                                                                                Network</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24" height="24"
                                                                                viewBox="0 0 24 24" fill="none"
                                                                                stroke="currentColor" stroke-width="2"
                                                                                stroke-linecap="round"
                                                                                stroke-linejoin="round"
                                                                                class="lucide lucide-heart"
                                                                                element="shape--icon" scale="sm"
                                                                                aria-label="Organization"
                                                                                aria-hidden="false">
                                                                                <path
                                                                                    d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z">
                                                                                </path>
                                                                            </svg><span element="type--body-small"
                                                                                emphasis="quiet">Organization</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center">-</div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" status="success"
                                                                                scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden">Active</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden"
                                                                                concept="member-count">0</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]"
                                                                        concept="row-actions">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><button
                                                                                element="control--button"
                                                                                emphasis="secondary" scale="sm"
                                                                                class=""><span><svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="24" height="24"
                                                                                        viewBox="0 0 24 24" fill="none"
                                                                                        stroke="currentColor"
                                                                                        stroke-width="2"
                                                                                        stroke-linecap="round"
                                                                                        stroke-linejoin="round"
                                                                                        class="lucide lucide-arrow-right shrink-0"
                                                                                        element="shape--icon"
                                                                                        aria-hidden="true">
                                                                                        <path d="M5 12h14"></path>
                                                                                        <path d="m12 5 7 7-7 7"></path>
                                                                                    </svg></span></button></div>
                                                                    </td>
                                                                </tr>
                                                                <tr element="table--row" class="" layout="item"
                                                                    data-testid="org-card">
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--avatar" scale="md"
                                                                                class="relative flex shrink-0 overflow-hidden size-10"><span
                                                                                    class="flex items-center justify-center">ON</span></span><span
                                                                                element="type--heading4">Ops NYC</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24" height="24"
                                                                                viewBox="0 0 24 24" fill="none"
                                                                                stroke="currentColor" stroke-width="2"
                                                                                stroke-linecap="round"
                                                                                stroke-linejoin="round"
                                                                                class="lucide lucide-headphones"
                                                                                element="shape--icon" scale="sm"
                                                                                aria-label="Operations Center"
                                                                                aria-hidden="false">
                                                                                <path
                                                                                    d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3">
                                                                                </path>
                                                                            </svg><span element="type--body-small"
                                                                                emphasis="quiet">Operations
                                                                                Center</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center">-</div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" status="success"
                                                                                scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden">Active</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden"
                                                                                concept="member-count">2</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]"
                                                                        concept="row-actions">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><button
                                                                                element="control--button"
                                                                                emphasis="secondary" scale="sm"
                                                                                class=""><span><svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="24" height="24"
                                                                                        viewBox="0 0 24 24" fill="none"
                                                                                        stroke="currentColor"
                                                                                        stroke-width="2"
                                                                                        stroke-linecap="round"
                                                                                        stroke-linejoin="round"
                                                                                        class="lucide lucide-arrow-right shrink-0"
                                                                                        element="shape--icon"
                                                                                        aria-hidden="true">
                                                                                        <path d="M5 12h14"></path>
                                                                                        <path d="m12 5 7 7-7 7"></path>
                                                                                    </svg></span></button></div>
                                                                    </td>
                                                                </tr>
                                                                <tr element="table--row" class="" layout="item"
                                                                    data-testid="org-card">
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--avatar" scale="md"
                                                                                class="relative flex shrink-0 overflow-hidden size-10"><span
                                                                                    class="flex items-center justify-center">PA</span></span><span
                                                                                element="type--heading4">Platform
                                                                                Admin</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24" height="24"
                                                                                viewBox="0 0 24 24" fill="none"
                                                                                stroke="currentColor" stroke-width="2"
                                                                                stroke-linecap="round"
                                                                                stroke-linejoin="round"
                                                                                class="lucide lucide-cog"
                                                                                element="shape--icon" scale="sm"
                                                                                aria-label="Platform Admin"
                                                                                aria-hidden="false">
                                                                                <path
                                                                                    d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z">
                                                                                </path>
                                                                                <path
                                                                                    d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z">
                                                                                </path>
                                                                                <path d="M12 2v2"></path>
                                                                                <path d="M12 22v-2"></path>
                                                                                <path d="m17 20.66-1-1.73"></path>
                                                                                <path d="M11 10.27 7 3.34"></path>
                                                                                <path d="m20.66 17-1.73-1"></path>
                                                                                <path d="m3.34 7 1.73 1"></path>
                                                                                <path d="M14 12h8"></path>
                                                                                <path d="M2 12h2"></path>
                                                                                <path d="m20.66 7-1.73 1"></path>
                                                                                <path d="m3.34 17 1.73-1"></path>
                                                                                <path d="m17 3.34-1 1.73"></path>
                                                                                <path d="m11 13.73-4 6.93"></path>
                                                                            </svg><span element="type--body-small"
                                                                                emphasis="quiet">Platform Admin</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center">-</div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" status="success"
                                                                                scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden">Active</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden"
                                                                                concept="member-count">1</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]"
                                                                        concept="row-actions">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><button
                                                                                element="control--button"
                                                                                emphasis="secondary" scale="sm"
                                                                                class=""><span><svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="24" height="24"
                                                                                        viewBox="0 0 24 24" fill="none"
                                                                                        stroke="currentColor"
                                                                                        stroke-width="2"
                                                                                        stroke-linecap="round"
                                                                                        stroke-linejoin="round"
                                                                                        class="lucide lucide-arrow-right shrink-0"
                                                                                        element="shape--icon"
                                                                                        aria-hidden="true">
                                                                                        <path d="M5 12h14"></path>
                                                                                        <path d="m12 5 7 7-7 7"></path>
                                                                                    </svg></span></button></div>
                                                                    </td>
                                                                </tr>
                                                                <tr element="table--row" class="" layout="item"
                                                                    data-testid="org-card">
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--avatar" scale="md"
                                                                                class="relative flex shrink-0 overflow-hidden size-10"><span
                                                                                    class="flex items-center justify-center">PS</span></span><span
                                                                                element="type--heading4">PROWD System
                                                                                Admin</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24" height="24"
                                                                                viewBox="0 0 24 24" fill="none"
                                                                                stroke="currentColor" stroke-width="2"
                                                                                stroke-linecap="round"
                                                                                stroke-linejoin="round"
                                                                                class="lucide lucide-shield-x"
                                                                                element="shape--icon" scale="sm"
                                                                                aria-label="System Admin"
                                                                                aria-hidden="false">
                                                                                <path
                                                                                    d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z">
                                                                                </path>
                                                                                <path d="m14.5 9.5-5 5"></path>
                                                                                <path d="m9.5 9.5 5 5"></path>
                                                                            </svg><span element="type--body-small"
                                                                                emphasis="quiet">System Admin</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center">-</div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" status="success"
                                                                                scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden">Active</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden"
                                                                                concept="member-count">1</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]"
                                                                        concept="row-actions">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><button
                                                                                element="control--button"
                                                                                emphasis="secondary" scale="sm"
                                                                                class=""><span><svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="24" height="24"
                                                                                        viewBox="0 0 24 24" fill="none"
                                                                                        stroke="currentColor"
                                                                                        stroke-width="2"
                                                                                        stroke-linecap="round"
                                                                                        stroke-linejoin="round"
                                                                                        class="lucide lucide-arrow-right shrink-0"
                                                                                        element="shape--icon"
                                                                                        aria-hidden="true">
                                                                                        <path d="M5 12h14"></path>
                                                                                        <path d="m12 5 7 7-7 7"></path>
                                                                                    </svg></span></button></div>
                                                                    </td>
                                                                </tr>
                                                                <tr element="table--row" class="" layout="item"
                                                                    data-testid="org-card">
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--avatar" scale="md"
                                                                                class="relative flex shrink-0 overflow-hidden size-10"><span
                                                                                    class="flex items-center justify-center">RC</span></span><span
                                                                                element="type--heading4">Robert Team
                                                                                Network</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><svg
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                width="24" height="24"
                                                                                viewBox="0 0 24 24" fill="none"
                                                                                stroke="currentColor" stroke-width="2"
                                                                                stroke-linecap="round"
                                                                                stroke-linejoin="round"
                                                                                class="lucide lucide-heart"
                                                                                element="shape--icon" scale="sm"
                                                                                aria-label="Organization"
                                                                                aria-hidden="false">
                                                                                <path
                                                                                    d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z">
                                                                                </path>
                                                                            </svg><span element="type--body-small"
                                                                                emphasis="quiet">Organization</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center">-</div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" status="success"
                                                                                scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden">Active</span>
                                                                        </div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><span
                                                                                element="surface--badge"
                                                                                emphasis="primary" scale="xs"
                                                                                class="inline-flex items-center justify-center whitespace-nowrap shrink-0 [&amp;&gt;svg]:pointer-events-none overflow-hidden"
                                                                                concept="member-count">2</span></div>
                                                                    </td>
                                                                    <td element="table--cell"
                                                                        class="align-middle [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]"
                                                                        concept="row-actions">
                                                                        <div element="table--cell-content"
                                                                            class="flex items-center"><button
                                                                                element="control--button"
                                                                                emphasis="secondary" scale="sm"
                                                                                class=""><span><svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        width="24" height="24"
                                                                                        viewBox="0 0 24 24" fill="none"
                                                                                        stroke="currentColor"
                                                                                        stroke-width="2"
                                                                                        stroke-linecap="round"
                                                                                        stroke-linejoin="round"
                                                                                        class="lucide lucide-arrow-right shrink-0"
                                                                                        element="shape--icon"
                                                                                        aria-hidden="true">
                                                                                        <path d="M5 12h14"></path>
                                                                                        <path d="m12 5 7 7-7 7"></path>
                                                                                    </svg></span></button></div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                            <div element="surface--footer" class="flex items-center"
                                                layout="row-section" concept="pagination-card-footer">
                                                <div class="flex items-center justify-between gap-4 py-2"
                                                    data-testid="list-pagination">
                                                    <div class="text-sm text-muted-foreground">Showing
                                                        <strong>1</strong>–<strong>11</strong> of <strong>11</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div></div>
        <section aria-label="Notifications alt+T" tabindex="-1" aria-live="polite" aria-relevant="additions text"
            aria-atomic="false"></section>
    </div>
    <script type="module" src="/src/main.tsx?t=1778368069697"></script>


</body>`,
  },
  {
    id: 'settings-security',
    path: ["settings-security"],
    label: 'Settings / Security',
    html: `<!-- label: Settings / Security -->
<div layout="shell" class="flex h-full w-full overflow-hidden">
  <div layout="shell-side-nav" class="flex h-full flex-shrink-0 flex-col overflow-hidden">
    <div class="group/sidebar-wrapper flex min-h-0 h-full">
      <div element="control-group--sidebar-nav" class="flex flex-col" data-testid="app-sidebar">
        <div element="surface--header" class="flex w-full flex-col">
          <ul class="flex w-full min-w-0 flex-col">
            <li class="group/menu-item relative w-full"><button element="control--nav-item" emphasis="tertiary"
                scale="lg"
                class="peer/menu-button flex w-full items-center overflow-hidden disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed [&amp;&gt;span:last-child]:truncate [&amp;&gt;svg]:shrink-0"
                data-testid="org-switcher-trigger" type="button" id="radix-_r_0_" aria-haspopup="menu"
                aria-expanded="false" data-state="closed"><span element="surface--avatar" scale="md"
                  class="relative flex shrink-0 overflow-hidden size-8"><span
                    class="flex items-center justify-center">PA</span></span>
                <div class="grid flex-1"><span class="truncate">Platform Admin</span></div><svg
                  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  class="lucide lucide-ellipsis-vertical ms-auto" element="shape--icon" aria-hidden="true">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button></li>
          </ul>
        </div>
        <div class="flex w-full min-h-0 flex-1 flex-col overflow-auto">
          <div class="relative flex w-full min-w-0 flex-col">
            <ul class="flex w-full min-w-0 flex-col">
              <li class="group/menu-item relative w-full"><a data-testid="nav-legal-documents"
                  element="control--nav-item" emphasis="tertiary" scale="md" data-state="closed"
                  href="/manage-legal-documents"
                  class="peer/menu-button flex w-full items-center overflow-hidden disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed [&amp;&gt;span:last-child]:truncate [&amp;&gt;svg]:shrink-0"><svg
                    xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="lucide lucide-file-text" aria-hidden="true" element="surface--nav-item-icon">
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                    <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                    <path d="M10 9H8"></path>
                    <path d="M16 13H8"></path>
                    <path d="M16 17H8"></path>
                  </svg><span element="surface--nav-item-title" class="flex-1 truncate">Legal Documents</span></a></li>
            </ul>
          </div>
        </div>
        <div element="surface--footer" class="flex w-full flex-col">
          <ul class="flex w-full min-w-0 flex-col">
            <li class="group/menu-item relative w-full"><button element="control--nav-item" emphasis="tertiary"
                scale="lg"
                class="peer/menu-button flex w-full items-center overflow-hidden disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed [&amp;&gt;span:last-child]:truncate [&amp;&gt;svg]:shrink-0"
                data-testid="notifications-trigger" type="button" id="radix-_r_2_" aria-haspopup="menu"
                aria-expanded="false" data-state="closed">
                <div class="relative"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="lucide lucide-bell" element="shape--icon" scale="md" aria-hidden="true">
                    <path d="M10.268 21a2 2 0 0 0 3.464 0"></path>
                    <path
                      d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326">
                    </path>
                  </svg></div><span>Notifications</span>
              </button></li>
          </ul>
          <ul class="flex w-full min-w-0 flex-col">
            <li class="group/menu-item relative w-full"><button element="control--nav-item" emphasis="tertiary"
                scale="lg"
                class="peer/menu-button flex w-full items-center overflow-hidden disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed [&amp;&gt;span:last-child]:truncate [&amp;&gt;svg]:shrink-0"
                data-testid="user-menu-trigger" type="button" id="radix-_r_4_" aria-haspopup="menu"
                aria-expanded="false" data-state="closed"><span element="surface--avatar" scale="md"
                  class="relative flex shrink-0 overflow-hidden size-8"><span
                    class="flex items-center justify-center">DD</span></span>
                <div class="grid flex-1"><span class="truncate">Daniel de Castro Ruivo</span><span
                    class="truncate">danielcastroruivo@gmail.com</span></div><svg xmlns="http://www.w3.org/2000/svg"
                  width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-vertical ms-auto"
                  element="shape--icon" aria-hidden="true">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <div layout="page" class="flex flex-1 flex-col min-h-0 overflow-hidden">
    <div layout="page" class="flex flex-1 flex-col min-h-0 overflow-hidden">
      <div layout="page-header" scale="md" class="flex w-full flex-shrink-0 overflow-hidden">
        <div class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" class="lucide lucide-settings" element="shape--icon" aria-hidden="true">
            <path
              d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z">
            </path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <h1 element="type--heading2">Settings</h1>
        </div>
      </div>
      <div layout="page-body" class="flex flex-1 min-h-0 overflow-hidden">
        <div layout="left-sidebar" scale="md" class="flex h-full flex-shrink-0 flex-col overflow-hidden"><a
            data-testid="settings-account-link" element="control--button" emphasis="tertiary" scale="md"
            href="/settings/account">Account</a><a data-testid="settings-security-link" element="control--button"
            emphasis="secondary" scale="md" class="active" href="/settings/security" data-status="active"
            aria-current="page">Security</a><a data-testid="settings-legal-link" element="control--button"
            emphasis="tertiary" scale="md" href="/settings/legal">Legal Agreements</a><a
            data-testid="settings-preferences-link" element="control--button" emphasis="tertiary" scale="md"
            href="/settings/preferences">Preferences</a></div>
        <div layout="main" class="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
          <div layout="main-body" class="flex flex-1 min-h-0 overflow-y-auto">
            <div class="flex w-full flex-col" data-testid="security-settings-page">
              <div element="surface--card" class="flex flex-col" data-testid="totp-section">
                <div element="surface--header"
                  class="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[1fr_auto]">
                  <div class="">Two-Factor Authentication</div>
                  <div class="">Add an extra layer of security to your account.</div>
                </div>
                <div element="surface--content" class="">
                  <div class="flex items-center justify-between">
                    <p element="type--body-small" emphasis="quiet">Not enabled. Add an authenticator app for extra
                      security.</p><button element="control--button" emphasis="secondary" scale="sm"
                      class=""><span>Enable 2FA</span></button>
                  </div>
                </div>
              </div>
              <div element="surface--card" class="flex flex-col" data-testid="profile-settings-change-password">
                <div element="surface--header"
                  class="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[1fr_auto]">
                  <div class="">Change Password</div>
                  <div class="">Update your password to keep your account secure.</div>
                </div>
                <form>
                  <div element="surface--content" class="flex flex-col">
                    <div class="flex flex-col"><label
                        class="flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed"
                        for="current-password">Current Password</label>
                      <div element="field--input" scale="md" class="flex items-center"><input class="min-w-0 flex-1"
                          id="current-password" data-testid="current-password-input" type="password"
                          name="currentPassword"><button type="button" data-part="end-icon" aria-label="Show password"
                          class="inline-flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="24"
                            height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye size-4"
                            aria-hidden="true">
                            <path
                              d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0">
                            </path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg></button></div>
                    </div>
                    <div class="flex flex-col"><label
                        class="flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed"
                        for="new-password">New Password</label>
                      <div element="field--input" scale="md" class="flex items-center"><input class="min-w-0 flex-1"
                          id="new-password" data-testid="new-password-input" type="password" name="newPassword"><button
                          type="button" data-part="end-icon" aria-label="Show password"
                          class="inline-flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="24"
                            height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye size-4"
                            aria-hidden="true">
                            <path
                              d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0">
                            </path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg></button></div>
                    </div>
                    <div class="flex flex-col"><label
                        class="flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed"
                        for="confirm-password">Confirm New Password</label>
                      <div element="field--input" scale="md" class="flex items-center"><input class="min-w-0 flex-1"
                          id="confirm-password" data-testid="confirm-password-input" type="password"
                          name="confirmPassword"><button type="button" data-part="end-icon" aria-label="Show password"
                          class="inline-flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="24"
                            height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye size-4"
                            aria-hidden="true">
                            <path
                              d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0">
                            </path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg></button></div>
                    </div>
                  </div>
                  <div element="surface--footer" class="items-center flex justify-end"><button element="control--button"
                      emphasis="primary" scale="md" class="" type="submit"
                      data-testid="change-password-button"><span>Save</span></button></div>
                </form>
              </div>
              <div element="surface--card" class="flex flex-col" data-testid="profile-settings-delete-account">
                <div element="surface--header"
                  class="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[1fr_auto]">
                  <div class="">Delete Account</div>
                  <div class="">This will permanently delete your account.</div>
                </div>
                <div element="surface--footer" class="flex items-center justify-between">
                  <p element="type--body-small" status="destructive">This action cannot be undone.</p><button
                    element="control--button" emphasis="primary" status="destructive" scale="md" class=""
                    data-testid="delete-account-trigger" type="button" aria-haspopup="dialog" aria-expanded="false"
                    aria-controls="radix-_r_6_" data-state="closed"><span>Delete Account</span></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
  },
  {
    id: 'sign-in',
    path: ["sign-in"],
    label: 'Sign In',
    html: `<div layout="shell-none" class="flex h-screen w-full flex-col overflow-hidden"><div class="flex flex-1 items-center justify-center"><div class="flex flex-col" data-testid="login-page"><div class="auth-card-wrapper"><div element="surface--card" class="flex flex-col"><div element="surface--header" class="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[1fr_auto]"><div class="" element="type--heading2">Sign in</div><div class="">Enter your credentials to continue</div></div><div element="surface--content" class="flex flex-col"><form class="flex flex-col"><div element="control-group--toggle-group" class="flex overflow-hidden"><button type="button" element="control--toggle" state="selected" class="flex-1">Email</button><button type="button" element="control--toggle" class="flex-1">Phone</button></div><div class="grid"><label class="flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed" data-error="false" for="_r_0_-form-item">Email</label><input element="field--input" scale="md" class="flex disabled:pointer-events-none disabled:cursor-not-allowed" placeholder="you@example.com" data-testid="login-identifier-input" id="_r_0_-form-item" aria-describedby="_r_0_-form-item-description" aria-invalid="false" type="email" value="" name="identifier"></div><div class="grid"><div class="flex items-center justify-between"><label class="flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed" data-error="false" for="_r_1_-form-item">Password</label><button type="button" element="type--link" data-testid="login-forgot-password-link">Forgot password?</button></div><div element="field--input" scale="md" class="flex items-center"><input class="min-w-0 flex-1" data-testid="login-password-input" id="_r_1_-form-item" aria-describedby="_r_1_-form-item-description" aria-invalid="false" type="password" value="" name="password"><button type="button" data-part="end-icon" aria-label="Show password" class="inline-flex items-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye size-4" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg></button></div></div><button element="control--button" emphasis="primary" scale="md" state="disabled" class="w-full" disabled="" type="submit" data-testid="login-submit-btn"><span>Sign in</span></button></form><div class="relative"><div class="absolute inset-0 flex items-center"><span element="surface--separator" class="w-full"></span></div><div class="relative flex justify-center"><span element="type--body-extra-small" emphasis="quiet">Or continue with</span></div></div><div class="flex flex-col"><button element="control--button" emphasis="secondary" scale="md" class="w-full" type="button" data-testid="login-social-google-btn"><span>Google</span></button><button element="control--button" emphasis="secondary" scale="md" class="w-full" type="button" data-testid="login-social-github-btn"><span>GitHub</span></button></div><div element="type--body-small">Don't have an account? <button type="button" element="type--link" data-testid="login-register-link">Sign up</button></div></div></div></div></div></div></div>`,
  }
];

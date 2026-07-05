# UI Design & Wireframes

This project uses **Wireloom** for UI mockups and wireframes. 

## Setup
We maintain pure `.wireloom` files (an indentation-based DSL for UI wireframes) within this repository to easily version and update our designs.

- The raw wireframes are located in: `apps/frontend/docs/wireframes/`
- These files are saved with the `.wireloom` extension.

## Maintaining `.wireloom` Files
When updating a screen or designing a new one, you should edit or create a `.wireloom` file in the `docs/wireframes` folder. Do not wrap the wireloom DSL inside markdown blocks (````wireloom ... ````); instead, place the pure text directly into the `.wireloom` file.

Example of a `.wireloom` file:
```wireloom
window "Settings":
  section "Appearance":
    radio "Light" label-right
    radio "Dark" selected label-right
```

## Generating SVGs
To visualize these wireframes in standard markdown viewers or for export, we convert the `.wireloom` files to `.svg` images.

We have a built-in script that handles this conversion. 

**Command:**
```bash
pnpm run wireloom docs/wireframes/<filename>.wireloom
# or npm run wireloom docs/wireframes/<filename>.wireloom
```

*Note: You must run this command from the `apps/frontend` directory.*

This command reads the input `.wireloom` file and generates a corresponding `.svg` file in the exact same directory. The resulting SVG can be seamlessly embedded into GitHub READMEs, Obsidian, Notion, or other documentation tools.

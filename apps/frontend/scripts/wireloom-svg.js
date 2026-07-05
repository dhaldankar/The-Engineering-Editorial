import fs from 'fs/promises';
import wireloom from 'wireloom';
import path from 'path';

async function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: node wireloom-svg.js <input-file.wireloom>');
    process.exit(1);
  }

  try {
    const source = await fs.readFile(inputFile, 'utf-8');
    
    // The input source should be pure Wireloom DSL (not JS, not HTML).
    // e.g. "window: \n  text \"Hello\""
    const id = path.basename(inputFile, path.extname(inputFile));
    const { svg } = await wireloom.render(id, source);

    const outputFile = inputFile.replace(/\.[^/.]+$/, "") + ".svg";
    await fs.writeFile(outputFile, svg, 'utf-8');
    
    console.log(`Successfully rendered wireloom SVG to ${outputFile}`);
  } catch (error) {
    console.error('Failed to render wireloom SVG:');
    if (error.line !== undefined) {
      console.error(`Parse error at Line ${error.line}, Column ${error.column}: ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();

const fs = require('fs-extra');
const path = require('path');

const SOURCE_DIR = path.resolve(__dirname, '../data');
const OUTPUT_DIR = path.resolve(__dirname, '../public');

function isAllowedName(name) {
  return !name.startsWith('.') && !name.startsWith('_');
}

async function generateIndex(dirPath, relativePath = '') {
  const items = await fs.readdir(dirPath, { withFileTypes: true });

  const directories = items.filter(item => item.isDirectory());
  const files = items.filter(item => item.isFile());

  let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Index of /${relativePath}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { border-bottom: 1px solid #ccc; }
    ul { list-style-type: none; padding-left: 0; }
    li { margin: 5px 0; }
    a { text-decoration: none; color: #0366d6; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Index of /${relativePath}</h1>
  <ul>
`;

  if (relativePath !== '') {
    const parentPath = relativePath.split('/').slice(0, -1).join('/');
    htmlContent += `    <li><a href="../">../</a></li>\n`;
  }

  directories.sort((a, b) => a.name.localeCompare(b.name));
  for (const dir of directories) {
    const dirPathRelative = path.join(relativePath, dir.name);
    if(isAllowedName(dir.name)) {
      htmlContent += `    <li>📁 <a href="${encodeURIComponent(dir.name)}/">${dir.name}/</a></li>\n`;
    }
  }


  files.sort((a, b) => a.name.localeCompare(b.name));
  for (const file of files) {
    if (isAllowedName(file.name)) {
      htmlContent += `    <li>📄 <a href="${encodeURIComponent(file.name)}">${file.name}</a></li>\n`;
    }

    const srcFile = path.join(dirPath, file.name);
    const destFile = path.join(OUTPUT_DIR, relativePath, file.name);
    await fs.copy(srcFile, destFile); 
  }

  htmlContent += `
  </ul>
</body>
</html>
`;

  await fs.ensureDir(path.join(OUTPUT_DIR, relativePath));

  const outputFilePath = path.join(OUTPUT_DIR, relativePath, 'index.html');
  await fs.writeFile(outputFilePath, htmlContent, 'utf8');

  for (const dir of directories) {
    const subDirPath = path.join(dirPath, dir.name);
    const subRelativePath = path.join(relativePath, dir.name);
    await generateIndex(subDirPath, subRelativePath);
  }
}

async function main() {
  try {
    console.log('Cleaning output directory...');
    await fs.remove(OUTPUT_DIR); 

    console.log('Generating index.html files...');
    await generateIndex(SOURCE_DIR);

    console.log('Index generation completed successfully.');
  } catch (error) {
    console.error('Error generating index files:', error);
    process.exit(1);
  }
}

main();

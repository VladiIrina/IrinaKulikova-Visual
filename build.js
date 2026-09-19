const fs = require('fs');
const path = require('path');

const root = __dirname;
const contentDir = path.join(root, 'content', 'projects');
const outputDir = path.join(root, 'data');
const outputFile = path.join(outputDir, 'projects.json');

if (!fs.existsSync(contentDir)) {
  throw new Error('content/projects directory not found');
}

const files = fs.readdirSync(contentDir)
  .filter(name => name.toLowerCase().endsWith('.json'))
  .sort();

const projects = files.map(name => {
  const file = path.join(contentDir, name);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!data.title) throw new Error(`Project ${name} has no title`);
  if (!['interior','exterior','furniture','animation','tour'].includes(data.category)) {
    throw new Error(`Project ${name} has invalid category: ${data.category}`);
  }
  return {
    id: data.id || path.basename(name, '.json'),
    title: data.title,
    category: data.category,
    interior_type: data.interior_type || '',
    meta: data.meta || '',
    location: data.location || '',
    description: data.description || '',
    cover: data.cover || ((data.gallery || [])[0] || ''),
    gallery: data.category === 'animation' && data.animation_video
      ? [data.animation_video]
      : (Array.isArray(data.gallery) ? data.gallery : []),
    animation_video: data.animation_video || '',
    tour_url: data.tour_url || '',
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : 99
  };
}).sort((a,b) => a.order - b.order || a.title.localeCompare(b.title, 'ru'));

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(projects, null, 2) + '\n');
console.log(`Built ${projects.length} portfolio projects -> ${path.relative(root, outputFile)}`);

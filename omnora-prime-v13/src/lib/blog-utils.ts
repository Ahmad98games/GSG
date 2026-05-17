import fs from 'fs';
import path from 'path';

export interface BlogPost {
  title: string;
  date: string;
  slug: string;
  description: string;
  keywords: string[];
  content: string;
}

export function parseMarkdown(fileContent: string): { data: any; content: string } {
  const parts = fileContent.split('---');
  if (parts.length < 3) {
    return { data: {}, content: fileContent };
  }
  const frontmatterStr = parts[1];
  const content = parts.slice(2).join('---').trim();
  
  const data: any = {};
  const lines = frontmatterStr.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let valStr = line.slice(colonIdx + 1).trim();
    
    // Remove surrounding quotes if present
    if (valStr.startsWith('"') && valStr.endsWith('"')) {
      valStr = valStr.slice(1, -1);
    } else if (valStr.startsWith("'") && valStr.endsWith("'")) {
      valStr = valStr.slice(1, -1);
    }
    
    if (key === 'keywords') {
      try {
        if (valStr.startsWith('[') && valStr.endsWith(']')) {
          // Replace single quotes with double quotes for valid JSON parsing
          const formattedStr = valStr.replace(/'/g, '"');
          data[key] = JSON.parse(formattedStr);
        } else {
          data[key] = valStr.split(',').map(s => s.trim());
        }
      } catch (e) {
        data[key] = [];
      }
    } else {
      data[key] = valStr;
    }
  }
  return { data, content };
}

export function getBlogPosts(): BlogPost[] {
  const blogDir = path.join(process.cwd(), 'src/content/blog');
  if (!fs.existsSync(blogDir)) {
    return [];
  }
  const filenames = fs.readdirSync(blogDir);
  const posts: BlogPost[] = [];
  
  for (const filename of filenames) {
    if (!filename.endsWith('.md')) continue;
    const filePath = path.join(blogDir, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = parseMarkdown(fileContent);
    posts.push({
      title: data.title || 'Untitled',
      date: data.date || '',
      slug: data.slug || filename.replace('.md', ''),
      description: data.description || '',
      keywords: data.keywords || [],
      content: content,
    });
  }
  
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  const posts = getBlogPosts();
  return posts.find(p => p.slug === slug) || null;
}

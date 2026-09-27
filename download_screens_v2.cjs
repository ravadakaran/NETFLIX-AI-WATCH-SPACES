const fs = require('fs');
const path = require('path');
const https = require('https');

const screens = [
  { name: 'landing_page', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzczZDM5OGVhYWUwOTM0ZjI0NTQ0MWY1MjJhEgsSBxDi3Kn_nQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzk4NDg0MjU0Njc2MDczNDAyOQ&filename=&opi=89354086' },
  { name: 'sign_in', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzczZDFkZGQwNjQwMjJkN2VlMjMxMDZmNGUyEgsSBxDi3Kn_nQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzk4NDg0MjU0Njc2MDczNDAyOQ&filename=&opi=89354086' },
  { name: 'get_started', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzczZDFjOGIyODIwN2M0Y2FjY2FjMWYyODFlEgsSBxDi3Kn_nQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzk4NDg0MjU0Njc2MDczNDAyOQ&filename=&opi=89354086' },
  { name: 'home_nocturne', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzczZTU4NTVmMGQwNzNhY2MxMzdkMGM4YTZmEgsSBxDi3Kn_nQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzk4NDg0MjU0Njc2MDczNDAyOQ&filename=&opi=89354086' },
  { name: 'discover_nocturne', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzczZTZjZGViOGUwOTEwNGYwZjdkMTVjN2QzEgsSBxDi3Kn_nQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzk4NDg0MjU0Njc2MDczNDAyOQ&filename=&opi=89354086' },
  { name: 'my_spaces_nocturne', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzczZTUzZDY4MzYwMjA3YTkxNTI0MTFiODAxEgsSBxDi3Kn_nQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzk4NDg0MjU0Njc2MDczNDAyOQ&filename=&opi=89354086' },
  { name: 'live_theater_nocturne', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzczZTM0MTg0OGMwNTc2MzE1NWNiMzAwYTkwEgsSBxDi3Kn_nQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzk4NDg0MjU0Njc2MDczNDAyOQ&filename=&opi=89354086' }
];

const outDir = path.join(__dirname, 'stitch_screens_nocturne');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function download(item) {
  return new Promise((resolve, reject) => {
    const dest = path.join(outDir, item.name + '.html');
    const file = fs.createWriteStream(dest);
    https.get(item.url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, redirectRes => {
          redirectRes.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      } else {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }
    }).on('error', reject);
  });
}

(async () => {
  for (const s of screens) {
    console.log('Downloading ' + s.name + '...');
    await download(s);
    console.log('Done ' + s.name);
  }
})();

const fs = require('fs');
const path = require('path');
const https = require('https');

const screens = [
  { name: 'live_theater', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzYxYTJjNjZiMjYwN2M0ZWMxN2QxMzQzNDlhEgsSBxDi3Kn_nQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzk4NDg0MjU0Njc2MDczNDAyOQ&filename=&opi=89354086' },
  { name: 'cinema_platform', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzYxYmY2YmFlMjUwMmE5OTVmYmIzMDdiNTgzEgsSBxDi3Kn_nQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzk4NDg0MjU0Njc2MDczNDAyOQ&filename=&opi=89354086' },
  { name: 'my_spaces_hub', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzYxYTQ2MTQxYmQwMjA3YTkxNTI0MTFiODAxEgsSBxDi3Kn_nQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzk4NDg0MjU0Njc2MDczNDAyOQ&filename=&opi=89354086' },
  { name: 'discover', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzYxYTQ0ODU4OTcwMjA3OWEzMjIzMTM2Njk1EgsSBxDi3Kn_nQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzk4NDg0MjU0Njc2MDczNDAyOQ&filename=&opi=89354086' },
  { name: 'home_cinema_exp', url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1YzYxYzVhZGIzNTYwNTc2MzE1NWNiMzAwYTkwEgsSBxDi3Kn_nQwYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzk4NDg0MjU0Njc2MDczNDAyOQ&filename=&opi=89354086' }
];

const outDir = path.join(__dirname, 'stitch_screens');
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

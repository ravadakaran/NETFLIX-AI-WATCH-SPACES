const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.java')) results.push(file);
        }
    });
    return results;
}

const files = walk('./backend/src');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('@SuppressWarnings({"null"})')) {
        content = content.replace(/@SuppressWarnings\(\{"null"\}\)\r?\n/g, '');
        fs.writeFileSync(f, content);
        console.log('Removed from ' + f);
    }
});

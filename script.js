let currentZip = null;
let chapterFiles = [];
const readerDiv = document.getElementById('reader');
const select = document.getElementById('chapterSelect');

function setTheme(theme) { 
    // Remove any existing theme classes first
    document.body.classList.remove('day', 'sepia', 'night');
    // Add the new one
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
}

// Load saved theme
document.body.className = localStorage.getItem('theme') || 'sepia';

document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    currentZip = await JSZip.loadAsync(await file.arrayBuffer());
    chapterFiles = Object.keys(currentZip.files)
        .filter(f => f.endsWith('.html') || f.endsWith('.xhtml'))
        .sort();
    
    select.innerHTML = '';
    chapterFiles.forEach((f, i) => {
        let opt = document.createElement('option');
        opt.value = i; opt.innerHTML = f.split('/').pop();
        select.appendChild(opt);
    });
    loadChapter(0);
});

async function loadChapter(index) {
    if (index < 0 || index >= chapterFiles.length) return;
    select.value = index;
    const text = await currentZip.file(chapterFiles[index]).async("string");
    const doc = new DOMParser().parseFromString(text, 'text/html');
    
    // Resolve images
    for (let img of doc.querySelectorAll('img, image')) {
        let src = img.getAttribute('src') || img.getAttribute('xlink:href');
        if (!src) continue;
        let name = src.split('/').pop().split('#')[0];
        let path = Object.keys(currentZip.files).find(f => f.endsWith('/' + name) || f === name);
        if (path) img.setAttribute(img.hasAttribute('src') ? 'src' : 'xlink:href', URL.createObjectURL(await currentZip.file(path).async("blob")));
    }
    
    readerDiv.innerHTML = "";
    readerDiv.appendChild(doc.body);
    readerDiv.scrollTop = 0;
}

select.addEventListener('change', (e) => loadChapter(e.target.value));
document.getElementById('prevBtn').addEventListener('click', () => loadChapter(parseInt(select.value) - 1));
document.getElementById('nextBtn').addEventListener('click', () => loadChapter(parseInt(select.value) + 1));
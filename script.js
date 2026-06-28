let currentZip = null;
let chapterFiles = [];
let currentAudio = null;
let isPaused = false; 
const readerDiv = document.getElementById('reader');
const select = document.getElementById('chapterSelect');

async function getAudioBlob(chunkText) {
    // REPLACE THIS URL with your live Cloudflare Tunnel URL
    const response = await fetch('https://your-tunnel-url.trycloudflare.com/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunkText })
    });
    return URL.createObjectURL(await response.blob());
}

function splitTextIntoChunks(text, limit = 800) {
    const chunks = [];
    while (text.length > limit) {
        let chunk = text.substring(0, limit);
        let lastPeriod = chunk.lastIndexOf('.');
        if (lastPeriod > 200) chunk = chunk.substring(0, lastPeriod + 1);
        chunks.push(chunk);
        text = text.substring(chunk.length);
    }
    chunks.push(text);
    return chunks;
}

async function speakChapter(text) {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    const chunks = splitTextIntoChunks(text);
    let index = 0;
    isPaused = false;

    async function playNext() {
        if (index >= chunks.length || isPaused) return;
        const url = await getAudioBlob(chunks[index]);
        currentAudio = new Audio(url);
        
        currentAudio.onended = () => {
            index++;
            if (index >= chunks.length) {
                document.getElementById('speakBtn').innerText = "Speak";
            } else {
                playNext();
            }
        };
        await currentAudio.play();
    }
    playNext();
}

document.getElementById('speakBtn').addEventListener('click', () => {
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        isPaused = true;
        document.getElementById('speakBtn').innerText = "Resume";
    } else if (currentAudio && currentAudio.paused && isPaused) {
        currentAudio.play();
        isPaused = false;
        document.getElementById('speakBtn').innerText = "Pause";
    } else {
        if (window.currentChapterText) {
            speakChapter(window.currentChapterText);
            document.getElementById('speakBtn').innerText = "Pause";
        }
    }
});

// --- EPUB LOAD LOGIC ---
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
    window.currentChapterText = doc.body.textContent;
    readerDiv.innerHTML = "";
    readerDiv.appendChild(doc.body);
}

select.addEventListener('change', (e) => loadChapter(e.target.value));
document.getElementById('prevBtn').addEventListener('click', () => loadChapter(parseInt(select.value) - 1));
document.getElementById('nextBtn').addEventListener('click', () => loadChapter(parseInt(select.value) + 1));

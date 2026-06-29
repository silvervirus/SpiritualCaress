import { KokoroTTS } from './node_modules/kokoro-js/dist/index.js';

let ttsInstance = null;
let currentZip = null;
let chapterFiles = [];
let currentAudio = null;
let isPaused = false;

const readerDiv = document.getElementById('reader');
const select = document.getElementById('chapterSelect');

async function initTTS() {
    if (ttsInstance) return;
    try {
        ttsInstance = await KokoroTTS.from_pretrained('./assets/', { 
            dtype: "q8",
            model_file: "kokoro-v1.0.int8.onnx"
        });
        console.log("Local AI Ready");
    } catch (err) {
        console.error("Local TTS Error:", err);
    }
}

async function getAudioBlob(chunkText) {
    await initTTS();
    const audio = await ttsInstance.generate(chunkText, { voice: "af_heart" });
    return URL.createObjectURL(new Blob([audio.toWav()], { type: 'audio/wav' }));
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

// --- FIXED PLAYBACK LOGIC ---
async function speakChapter(text) {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    const chunks = splitTextIntoChunks(text);
    let index = 0;
    isPaused = false;

    async function playNext() {
        if (index >= chunks.length || isPaused) return;
        
        try {
            const url = await getAudioBlob(chunks[index]);
            currentAudio = new Audio(url);
            
            // Wait for audio to finish before moving to next chunk
            currentAudio.onended = () => {
                index++;
                playNext(); // This correctly triggers the next chunk
            };
            
            await currentAudio.play();
        } catch (err) {
            console.error("Playback error:", err);
        }
    }
    playNext();
}

// --- UI EVENT HANDLERS ---
document.getElementById('speakBtn').addEventListener('click', () => {
    const btn = document.getElementById('speakBtn');
    if (currentAudio && isPaused) {
        currentAudio.play();
        isPaused = false;
        btn.innerText = "Pause";
    } else if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        isPaused = true;
        btn.innerText = "Resume";
    } else if (window.currentChapterText) {
        speakChapter(window.currentChapterText);
        btn.innerText = "Pause";
    }
});

select.addEventListener('change', (e) => loadChapter(e.target.value));
document.getElementById('prevBtn').addEventListener('click', () => loadChapter(parseInt(select.value) - 1));
document.getElementById('nextBtn').addEventListener('click', () => loadChapter(parseInt(select.value) + 1));
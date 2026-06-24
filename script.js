function setTheme(theme) { document.body.className = theme; }

document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        JSZip.loadAsync(e.target.result).then(function(zip) {
            // This is the "Diving" part: looking for the first HTML file
            const files = Object.keys(zip.files).filter(f => f.endsWith('.html') || f.endsWith('.xhtml'));
            zip.file(files[0]).async("string").then(function(text) {
                // Show the text
                document.getElementById('reader').innerHTML = text;
            });
        });
    };
    reader.readAsArrayBuffer(file);
});

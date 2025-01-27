importScripts('dexie.min.js');

self.onmessage = function(e) {
  var document = e.data.doc;
  var output = '';
  var result;
  
  if (e.data.action == 'renderUserPhotos') {
    Array.from(e.data.data).forEach((val) => {
      output += '<li><span class="tool js-delete" title="Löschen"></span><span class="tool js-preview-thumb" title="Vorschau"></span><span class="tool js-is-used" title="Wird verwendet"></span><span draggable="true" class="img-wrap" data-id="'+val.id+'" data-file="'+(val.file || '')+'" data-is-used="0"><img class="thumb" src="'+val.img_data+'" ondragstart="collage_maker_2.dragElement(event)" /></span></li>';
    });
    result = output;
    postMessage(result);
  } else if (e.data.action === 'uploadUserPhotos') {
    var db = new Dexie('collage');
    db.version(1).stores({
      uploads: '++id',
      bg_uploads: '++id',
      canvas: '++id',
    });

    const files = e.data.data;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img_data = event.target.result;
        isBase64Image(img_data).then((result) => {
          resizeImageBase64(img_data, 2000, (resizedBase64) => { // limit upload file size and shrink image
            const blob = base64ToBlob(resizedBase64);
            const formData = new FormData();
            formData.append('file', blob, file.name);
            fetch('https://canvasprint.se/api/upload-file.php?sessid='+e.data.sess_id, {
                method: 'POST',
                body: formData
            }).then(response => response.json()).then(temp_data => {
              resizeImageBase64(resizedBase64, 400, (thumbnail) => { // create thumbnail
                db.uploads.add({ img_data: thumbnail, file: temp_data.result }).then((index) => {
                  postMessage({
                    img_data: thumbnail,
                    id: index,
                    file: temp_data.result
                  });
                });
              });
            })
          });
        })
        .catch((error) => {
          postMessage({
            error: true
          });
        });
      };
      reader.readAsDataURL(file);
    });
  }
};

function resizeImageBase64(base64, max_size = 2000, callback) {
  fetch(base64).then((res) => res.blob()).then((blob) => createImageBitmap(blob)).then((bitmap) => {
    const maxHeight = max_size;
    const maxWidth = max_size;
    const originalWidth = bitmap.width;
    const originalHeight = bitmap.height;

    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (originalWidth > maxWidth || originalHeight > maxHeight) {
      const widthRatio = maxWidth / originalWidth;
      const heightRatio = maxHeight / originalHeight;
      const scaleFactor = Math.min(widthRatio, heightRatio);

      newWidth = originalWidth * scaleFactor;
      newHeight = originalHeight * scaleFactor;
    }

    const canvas = new OffscreenCanvas(newWidth, newHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);

    canvas.convertToBlob().then((blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        const resizedBase64 = reader.result;
        callback(resizedBase64);
      };
      reader.readAsDataURL(blob);
    });
  });
}

function isBase64Image(base64) {
  const imageRegex = /^data:image\/(png|jpeg|jpg|gif|bmp|webp);base64,/;
  if (!imageRegex.test(base64)) {
    return Promise.reject(new Error("Der Base64-String ist kein Bild."));
  }

  return fetch(base64)
    .then((res) => {
      if (!res.ok) return Promise.reject(new Error("Base64-String konnte nicht dekodiert werden."));
      return res.blob();
    })
    .then((blob) => createImageBitmap(blob))
    .then(() => true) 
    .catch((error) => Promise.reject(new Error("Der Base64-String enthält kein gültiges Bild: " + error.message)));
}

function base64ToBlob(base64) {
  const byteString = atob(base64.split(',')[1]);
  const mimeString = base64.match(/^data:(.*);base64,/)[1];
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([byteArray], { type: mimeString });
}
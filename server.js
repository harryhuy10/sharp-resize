const { resizeSharp, resizeJimp } = require('./resize');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// in latest body-parser use like below.
app.use(bodyParser.urlencoded({ extended: true }));
const server = app.listen(8000, () => {
    console.log('Server started');
    const host = server.address().address === '::' ? 'localhost' : server.address().address;
    const port = server.address().port;
    console.log('Server is listening at http://%s:%s', host, port);
});

let fileName;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    fileName = file.originalname;
    cb(null, fileName);
  },
});

var upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (
      ext !== '.png' &&
      ext !== '.jpg' &&
      ext !== '.gif' &&
      ext !== '.jpeg' &&
      ext != '.bmp'
    ) {
      return callback(/*res.end('Only images are allowed')*/ null, false);
    }

    callback(null, true);
  },
});
const html = `<html>
<head>

    <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
    <script type="text/javascript">
    $(function() {
        console.warn('updaload');
        $('#button').on('click', function () {
        var files = $('#file')[0].files;
        var formData = new FormData();
        formData.append('file',files[0]);
        formData.append('widthString', '1920');
        formData.append('heightString', '1080');
        var requestOptions = {
            method: 'POST',
            body: formData,
            redirect: 'follow'
          };
          
        fetch("http://localhost:8000/resize", requestOptions)
        .then(response => response.text())
        .then(result => {
            //const image = document.querySelector('#img-upload');
            // image.src = getDataUrl(result);
            alert('Upload thanh cong');
        })
        .catch(error => console.log('error', error));
      });
    });
    </script>
</head>

<body>
    <p>Click on the "Choose File" button to upload a file:</p>
    <input type="file" id="file" name="file" accept="image/*" />
    <button id="button">Upload</button>
    <img id="img-upload" src="" />
</body>
</html>`;

app.get('/', (req, res, next) => {
  res.send(html);
});

app.post('/resize', upload.single('file'), (req, res, next) => {
  const file = req.file;
  console.log('[req.file]', file);
  const { widthString, heightString } = req.body;

  if (!file) {
    const error = new Error('Please upload a file');
    error.httpStatusCode = 400;
    return next(error);
  }

  if (!widthString || !heightString) {
    const error = new Error('Please specify the width and height');
    error.httpStatusCode = 400;
    return next(error);
  }

  const dimension = {
    width: +widthString,
    height: +heightString,
  };

  var imgPath = './uploads/' + fileName;
  var resizePath = './resized/' + fileName;

  var mime = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    bmp: 'image/bmp',
  };

  const type = mime[path.extname(resizePath).slice(1)] || 'text/plain';
  var resizeMethod;
  if (type === 'image/png' || type === 'image/bmp') {
    resizeMethod = resizeJimp;
    resizePath = resizePath.slice(0, -4) + '.jpg'; // Convert to JPEG for lighter image size
  } else {
    resizeMethod = resizeSharp;
  }

  resizeMethod(imgPath, resizePath, dimension, (err, result) => {
    const s = fs.createReadStream(resizePath);
    if (err) {
      res.set('Content-Type', 'text/plain');
      res.status(404).end('Not found');
    } else {
      s.on('open', function () {
        res.set('Content-Type', type);
        s.pipe(res);
      });
      s.on('error', function () {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
      });
    }
    clearImages('./resized');
    clearImages('./uploads');
  });
});

function clearImages(directory) {
  fs.readdir(directory, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      const ext = path.extname(file);
      if (ext === '.jpg' || ext === '.png') {
        fs.unlink(path.join(directory, file), (err) => {
          if (err) throw err;
        });
      }
    }
  });
}

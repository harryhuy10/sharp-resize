const { resizeSharp, resizeJimp } = require('./resize');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const slug = require('slug');
const sharp = require('sharp');
var cors = require('cors');
var engines = require('consolidate');
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`,
});

const app = express();

function makeid(length) {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    const fileName =
      slug(file.originalname, '-') +
      '-' +
      makeid(10) +
      '.' +
      path.extname(file.originalname).slice(1);
    cb(null, fileName);
  },
});

var upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    ext = ext.toLowerCase();
    if (
      ext !== '.png' &&
      ext !== '.jpg' &&
      ext !== '.jpeg' &&
      ext !== '.gif' &&
      ext !== '.bmp' &&
      ext !== '.tiff' &&
      ext !== '.webP'
    ) {
      return callback(
        /*res.end('Only images are allowed')*/ 'We only accept png, jpg, bmp, gif, jpeg, webp, tiff',
        false
      );
    }

    callback(null, true);
  },
});
console.log('=========================', path.join(__dirname, 'resized'));

app.use(express.static(path.join(__dirname, 'views')));
app.engine('html', engines.mustache);
app.get('/', function (req, res) {
  res.render('index.html');
});

app.use(cors());
app.use('/images', express.static(path.join(__dirname, 'resized')));
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
app.post('/resize', upload.single('file'), async (req, res, next) => {
  const file = req.file;
  console.log('===============file', file);
  if (!file) {
    const error = new Error('Please upload a file');
    error.httpStatusCode = 400;
    return next(error);
  }
  const fileName = req.file.filename;
  let image = sharp(path.join(__dirname, req.file.path));

  const meta = await image.metadata();

  const dimension = {
    width: +meta.width,
    height: +meta.height,
  };

  let resizePath = './resized/' + fileName;
  const imgPath = './uploads/' + fileName;

  resizePath = resizePath.slice(0, -4) + '.jpg'; // Convert to JPEG for lighter image size
  const resizeMethod = resizeSharp;

  console.log('imgPath', imgPath);
  console.log('resizePath', resizePath);
  console.log('dimension', dimension);

  resizeMethod(imgPath, resizePath, dimension, (err, result) => {
    if (err) {
      console.log(err);
      throw new Error('Resize image error');
    }
    console.log();
    return res.json({
      url: process.env.BASE_URL + '/images/' + path.basename(resizePath),
    });
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
const server = app.listen(8000, () => {
  console.log('Server started');
  const host =
    server.address().address === '::' ? 'localhost' : server.address().address;
  const port = server.address().port;
  console.log('Server is listening at http://%s:%s', host, port);
});

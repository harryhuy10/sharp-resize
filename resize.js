const sharp = require('sharp');
const Jimp = require('jimp');
const fs = require('fs');

// FOR ALL OTHER THAN BMP AND PNG
exports.resizeSharp = function resizeSharp(srcImage, destImage, dimension, callback) {
    const readableStream = fs.createReadStream(srcImage);
    const transform = sharp()
        .resize({
            width: dimension.width,
            height: dimension.height,
            fit: sharp.fit.cover,
            position: sharp.strategy.entropy
            // gravity: sharp.gravity.center
        }).toFile(destImage, (err) => {
            if (err) {
                return callback(err)
            }
            return callback(null, dimension);
        })
    readableStream.pipe(transform);
}

// FOR BMP AND PNG
exports.resizeJimp = function resizeJimp(srcImage, destImage, dimension, callback) {
    Jimp.read(srcImage, (err, image) => {
        if (err) {
            return callback(err)
        }
        image
          .resize(dimension.width, dimension.height)
          .quality(60)
          .write(destImage);
        return callback(null, dimension);
      });
}
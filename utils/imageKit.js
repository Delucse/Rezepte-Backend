const ImageKit = require('imagekit');

var imageKit = null;

if (process.env.IMAGEKIT_PUBLIC_KEY) {
    imageKit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: `https://ik.imagekit.io/${process.env.IMAGEKIT_ID}/`,
    });
}

module.exports = imageKit;

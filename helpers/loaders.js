const WebFont = require('webfontloader');

const loadList = (list) => {
  return Promise.all(list)
  .then((assets) => {
    return assets.reduce((collection, asset) => {
      // separate assets by type
      // add them to the collection

      const { type, key, value } = asset;

      const collectionIncludes = Object.keys(collection).includes(type);
      if (!collectionIncludes) { collection[type] = {} }

      collection[type][key] = value;
      return collection;
    }, {});
  })
}

const loadImage = (key, url) => {
  return new Promise((resolve, reject) => {
    let image = new Image;
    image.src = url;
    image.onload = () => {
      resolve({
        type: 'image',
        key: key,
        value: image
      });
    };
  });

}

const loadSound = (key, url) => {
  return new Promise((resolve, reject) => {
    let sound = new Audio(url);
    sound.oncanplaythrough = function() {
      resolve({
        type: 'sound',
        key: key,
        value: sound
      });
    }
  });
}

const loadFont = (key, fontName) => {
  return new Promise((resolve, reject) => {
    let font = {
      google: {
        families: [fontName]
      },
      fontactive: function (familyName) {
        resolve({
          type: 'font',
          key: key,
          value: familyName
        })
      }
    }
    WebFont.load(font);
  });
}

const xloadFont = (key, fontOrUrl) => {
  return new Promise((resolve, reject) => {
    // plan
    // build a url from the fontSrc string
    // if valid url, resolve the familyName or error out
    // if error, resolve the string
    try {
      let fontUrl = new URL(fontOrUrl);

      WebFont.load({
        custom: {
          families: [key],
          urls: [fontUrl.href],
          fontactive: (familyName) => {
            resolve({
              type: 'font',
              key: key,
              value: familyName
            });
          },
          fontinactive: (familyName) => {
            console.error('Error:', 'browser does not support', familyName);
            reject({
              type: 'font',
              key: key,
              value: 'Courier New'
            });
          }
        }
      });
    } catch (error) {
      console.log(error);
      // font is not a url string
      resolve({
        type: 'font',
        key: key,
        value: fontOrUrl
      });
    }

  });
}

export { loadList, loadImage, loadSound, loadFont };
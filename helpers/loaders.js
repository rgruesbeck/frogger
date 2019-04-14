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

const loadFont = (key, fontSrc) => {
  return new Promise((resolve, reject) => {

    if (fontSrc && !fontSrc.includes('http')) {
      resolve(fontSrc);
    }

    let link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = fontSrc;

    // Trick from https://stackoverflow.com/questions/2635814/
    let image = new Image;
    image.src = link.href;
    image.onerror = function () {
      let match = fontSrc.match(/family=(.*?)$/)[1];
      let fontName = `${match.replace('+', ' ')}`;
      let result = {
        type: 'font',
        key: key,
        value: fontName
      };

      console.log(result);

      resolve({
        type: 'font',
        key: key,
        value: fontName
      });
    };
  });
}

export { loadList, loadImage, loadSound, loadFont };
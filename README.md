
# Imagina

Imagina is a [node.js](http://nodejs.org) image library wrapper of [ImageMagick](http://www.imagemagick.org/). Its features include **resize**, **resizeBatch** and **convert**.

Imagina uses [async queue](https://github.com/caolan/async#queue) to assure server's resources wont get overloaded, spawning configurable maximum number of ImageMagick processes in parallel. Imagina keeps track of all running and queued resizes / converts, if user tries to resize the same file to the same destination using the same parameters and resolution Imagina will put the second call on hold and will automatically call its callback when the first one finishes. This is particulary useful when Imagina is used inside HTTP requests, avoiding concurrent users spawn lots of ImageMagick processes to do the same job.

Imagina requires knowledge of ImageMagick convert command line options, for more information check out [ImageMagick: Command-line Options](http://www.imagemagick.org/script/command-line-options.php).

## Install

Imagina is available on [npmjs](https://npmjs.org/package/imagina). To add Imagina to you application on a Terminal run:
```bash 
npm install --save imagina
```

Imagina requires ImageMagick convert command-line tool. It is also recommended to install libjpeg and libpng if you want to deal with these two image file formats.

### Mac OS X
The easiest way of installing ImageMagick with PNG and JPEG support is installing [brew](http://brew.sh/) and running on Terminal:
```bash
brew install libpng libjpeg imagemagick
```
The command above will install ImageMagick convert command-line tool with support to PNG and JPEG image formats.

## Examples

### resize
```js
var Imagina = require('imagina');

var im = new Imagina();

var src = '/path/to/myfile.png';
var dst = '/another/path/output.png';
var params = '-auto-orient -quality 70'.split(' ');

im.resize(src, dst, '800x600', params, function(err) {
  console.log('image resized');
});
```

### resizeBatch
```js
var Imagina = require('imagina');

var im = new Imagina({ workers: 4 });

// considering src = 'nodejs.png', resolution = '800x600', dst will 
// be: 'nodejs-800x600.jpg'
var filenameModifier = function(src, resolution, params) {
  return src.replace(/(.*)\.png$/, '$1-' + resolution + '.jpg');  
};

var params = '-auto-orient -quality 70'.split(' ');
var resolutions = ['800x500', '320x240', '800x600', '128x128', '1024x768'];

im.resizeBatch('nodejs.png', filenameModifier, resolutions, params, function(err) {
  console.log('resizeBatch finished');
});
```

### convert
```js
var Imagina = require('imagina');

var im = new Imagina();

im.convert('myfile.png', 'myfile.jpg', function(err) {
  console.log('conversion finished');
});
```

## API

### Imagina (constructor)
It is recommended to have only one Imagina instance per application instance. Creating only one instance of Imagina you get the following benefits:

* Optimized for the number of available cores on computer;
* Avoid parallel resize or convert of the same file / destination / resolution / params;

Although Imagina identifies the number of available cores on computer and sets it as the maximum number of processes in parallel the user can configure this number adding an object to Imagina constructor arguments like this:
```js
var im = new Imagina({ workers: 3 });
```
In case it is not informed, Imagina defaults to ```os.cpus().length```.

In addition to **workers** it is possible to add default **params**.
```js
var im = new Imagina({ params: '-quality 80'.split(' ') });
```

### resize
As its name says this method must be used to resize one image.
```js
  Imagina.prototype.resize = function(src, dst, resolution, params, cb) {};
```

* **src** (string) path to source file;
* **dst** (string or function) path to destination file. In case a function is defined this function ```function(src, resolution, params) {}``` must return the destination path;
* **resolution** (string) resolution defined by the following format **WIDTH**x**HEIGHT** e.g. ```'800x600'```;
* **params** (array, optional) ImageMagick additional params. In case ```null``` is defined Imagina will default to ```params``` defined on constructor or empty array in case it doesn't exist;
* **cb** (function, optional) callback to be called when resize finishes;

**params** has a special behavior on Imagina. Imagina tries to find ```{RESOLUTION}``` token in all elements of ```params``` array, in case it finds Imagina replaces ```{RESOLUTION}``` to the resolution given as argument.
```js
var params = '-quality 80 -crop {RESOLUTION}+0+0'.split(' ');
```
In the example above, considering resolution ```'800x600'``` Imagina will replace parameter ```'{RESOLUTION}+0+0'``` by ```'800x600+0+0'```, this feature is highly useful on ImageMagick.

If Imagina doesn't find a params element equals to ```'-resize'``` it will automatically add two arguments to ImageMagick convert command-line call: ```['-resize', '{RESOLUTION}']```. That's why you don't need to add ```'-resize'``` to **params**.
```js
var params = '-quality 90 -resize {RESOLUTION}>'.split(' ');
im.resize('myfile.png', 'myfile.jpg', '800x600', params);
```

### resizeBatch
resizeBatch works very similar to [resize](#resize), there are only two differences: 

* ```dst``` (function) must be a function, otherwise Imagina will resize ```src``` image to the same ```dst``` path having an  unpredictable behavior.
* ```resolutions``` (array) instead of beeing able to resize one image to only one resolution resizeBatch allows you to resize a ```src``` image to many ```resolutions```

### convert
As its name says this method converts image format using filename extensions.

* **src** (string) path to source file;
* **dst** (string) path to destination file;
* **cb** (function, optional) callback to be called when convert finishes;

```js
im.convert('myfile.png', 'myfile.jpg');
```

## TODO
* Add detailed error feedback;
* Add support to windows computer (at the moment due to use of **mv** command-line tool it is compatible only with UNIX based OS i.e. MacOSX, Linux, BSD, etc)

## Contributors
Would you like to contribute to this library? Don't be shy! [Contact me](mailto:esnunes@gmail.com) if you are interested on it.

## LICENSE

(MIT License)

Copyright (c) 2013 Eduardo Nunes <esnunes@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.



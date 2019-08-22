# Tiny Console

Example of a simple console with nodejs, you can run commands like: ls, ll, touch, mkdir, cat, cd, rm

## Installation

```shell
npm i @jtelesforoantonio/tiny-console
```

## Usage

Require TinyConsole.
```javascript
const tinyConsole = require('@jtelesforoantonio/tiny-console');
```

Basic init.
```javascript
tinyConsole.init();
```
 
You can set the path to init the console by passing the path as a parameter in the init method.
```javascript
tinyConsole.init('./my_custom/path');
```
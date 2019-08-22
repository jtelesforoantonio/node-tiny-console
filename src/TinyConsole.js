const os = require('os');
const fs = require('fs');
const moment = require('moment');
const colors = require('colors');
const readline = require('readline');

const availableCommands = ['ls ', 'll ', 'touch ', 'cat', 'mkdir ', 'rm ', 'cd '];
let availableItems = [];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: (line) => {
        let completions = availableItems.concat(availableCommands);
        const hits = completions.filter((c) => {
            if (line.includes(' ')) {
                line = line.substr(line.indexOf(' ') + 1);
            }
            return c.startsWith(line);
        });
        return [hits.length ? hits : completions, line];
    },
    prompt: `${os.hostname()}@/>`
}).on('line', (line) => {
    let command = line.trim();
    if (command !== '') {
        switch (command) {
            case 'll':
            case 'ls':
                tinyConsole.showItems();
                break;
            case command.match(/touch\s\w+/) ? command : '':
                tinyConsole.createFile(command.substr(6).trim());
                break;
            case command.match(/mkdir\s\w+/) ? command : '':
                tinyConsole.createDirectory(command.substr(6).trim());
                break;
            case command.match(/cd\s\w+/) ? command : '':
                tinyConsole.goToDirectory(command.substr(3).trim());
                break;
            case 'cd ..':
                tinyConsole.goBackDirectory();
                break;
            case command.match(/rm\s\w+/) ? command : '':
                tinyConsole.removeItem(command.substr(3).trim());
                break;
            case command.match(/cat\s\w+/) ? command : '':
                tinyConsole.showFileContent(command.substr(4).trim());
                break;
            case 'exit':
            case 'quit':
                rl.close();
                process.exit(0);
                break;
            default:
                console.log(`You can use the following commands: ls, ll, touch, cat, mkdir, rm, cd, cd ..`.cyan);
                break;
        }
    }
    rl.prompt();
}).pause();

const tinyConsole = {
    userDirectory: './',
    currentDirectory: null,
    currentDirectories: [],
    currentFiles: [],
    segments: [],
    setUserDirectory: (path) => {
        if(path !== '') {
            tinyConsole.userDirectory = path;
        }
    },
    clearItems: () => {
        availableItems = [];
        tinyConsole.currentDirectories = [];
        tinyConsole.currentFiles = [];
    },
    loadItems: () => {
        tinyConsole.clearItems();
        if (tinyConsole.currentDirectory == null) {
            tinyConsole.currentDirectory = tinyConsole.userDirectory;
        }
        let items = fs.readdirSync(tinyConsole.currentDirectory, {withFileTypes: true});
        for (let item of items) {
            availableItems.push(item.name);
            if (item.isDirectory()) {
                tinyConsole.currentDirectories.push(item);
            } else if (item.isFile()) {
                tinyConsole.currentFiles.push(item);
            }
        }
    },
    showItems: () => {
        tinyConsole.loadItems();
        if (tinyConsole.currentDirectories.length === 0 && tinyConsole.currentFiles.length === 0) {
            console.log('The directory is empty'.yellow);
        } else {
            console.log('Type Created at       Name'.cyan);
            let details = null;
            let fancyDate = null;
            for (let directory of tinyConsole.currentDirectories) {
                details = tinyConsole.getItemDetails(directory.name);
                fancyDate = moment(details.birthtime).format('YYYY-MM-DD HH:mm');
                console.log(`dir  ${fancyDate} ${directory.name}`.blue);
            }
            for (let file of tinyConsole.currentFiles) {
                details = tinyConsole.getItemDetails(file.name);
                fancyDate = moment(details.birthtime).format('YYYY-MM-DD HH:mm');
                console.log(`file ${fancyDate} ${file.name}`.green);
            }
        }
    },
    existsItem: (itemName) => {
        return fs.existsSync(`${tinyConsole.currentDirectory}/${itemName}`);
    },
    getItemDetails: (itemName) => {
        return fs.lstatSync(`${tinyConsole.currentDirectory}/${itemName}`);
    },
    createDirectory: (directory) => {
        try {
            fs.mkdirSync(`${tinyConsole.currentDirectory}/${directory}`);
            availableItems.push(directory);
            console.log('Directory created successfully'.green);
        } catch (err) {
            if (err.errno === -17) {
                console.log('Directory already exists'.red);
            }
        }
    },
    createFile: (file, forceCreate = false) => {
        try {
            if (!forceCreate && tinyConsole.currentFiles.includes(file)) {
                rl.question('File already exists, do you want continue? y/n: '.red, (answer) => {
                    if (answer === 'y') {
                        tinyConsole.createFile(file, true);
                    }
                    rl.prompt();
                });
            } else {
                fs.writeFileSync(`${tinyConsole.currentDirectory}/${file}`, '');
                availableItems.push(file);
                console.log('File created successfully'.green);
            }
        } catch (err) {
        }
    },
    removeItem: (item) => {
        try {
            if (tinyConsole.existsItem(item)) {
                let details = tinyConsole.getItemDetails(item);
                if (details.isDirectory()) {
                    fs.rmdirSync(`${tinyConsole.currentDirectory}/${item}`);
                } else if (details.isFile()) {
                    fs.unlinkSync(`${tinyConsole.currentDirectory}/${item}`);
                }
                tinyConsole.loadItems();
                console.log(`"${item}" deleted`.green);
            } else {
                console.log(`"${item}" not exists`.yellow);
            }
        } catch (err) {
            if (err.errno === -39) {
                console.log('Directory not empty'.red);
            }
        }
    },
    goToDirectory: (directory) => {
        if (tinyConsole.existsItem(directory)) {
            if (tinyConsole.getItemDetails(directory).isDirectory()) {
                tinyConsole.currentDirectory += `/${directory}`;
                if (directory.includes('/')) {
                    tinyConsole.segments = tinyConsole.segments.concat(directory.split('/'));
                } else {
                    tinyConsole.segments.push(directory);
                }
                tinyConsole.loadItems();
                let path = tinyConsole.segments.join('/');
                rl.setPrompt(`${os.hostname()}@${path}/>`);
            } else {
                console.log('It does not a directory'.red);
            }
        } else {
            console.log('Directory not exists'.red);
        }
    },
    goBackDirectory: () => {
        tinyConsole.segments.pop();
        let path = tinyConsole.segments.join('/');
        if (path !== '') {
            tinyConsole.currentDirectory = `${tinyConsole.userDirectory}/${path}`;
        } else {
            tinyConsole.currentDirectory = null;
        }
        tinyConsole.loadItems();
        rl.setPrompt(`${os.hostname()}@${path}/>`);
    },
    showFileContent: (file) => {
        if (tinyConsole.existsItem(file)) {
            if (tinyConsole.getItemDetails(file).isFile()) {
                console.log(fs.readFileSync(`${tinyConsole.currentDirectory}/${file}`, {encoding: 'utf8'}));
            } else {
                console.log(`"${file}" is not a file`.red);
            }
        } else {
            console.log(`"${file}" not exists`.red);
        }
    }
};

/**
 * Initialize the tiny console.
 *
 * @param path User Directory
 */
function init(path = '') {
    tinyConsole.setUserDirectory(path);
    tinyConsole.loadItems();
    rl.resume();
    rl.prompt();
}

module.exports.init = init;

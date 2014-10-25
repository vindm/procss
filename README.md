# Procss

Plugins-based CSS post-processor to modify CSS with JavaScript.

It uses `/* procss.<command_name>([<command_params>...]) */` CSS comments to
 to run processors `<command_name>` handlers in the relative context.

So, `Procss` allows you to use specific processors for specific cases.

It uses `PostCSS` to parse CSS and provide a usable JS API to edit CSS node trees.

## Usage

Install with [npm](https://npmjs.org/package/procss):
```
    $ [sudo] npm install procss --save
```

If you want to use `procss` on your cli install with:
```
    $ [sudo] npm install procss -g
```

### CLI

Usage:
```
    $ procss [OPTIONS]
```
Options:
```
    -h, --help : Help
    -v, --version : Version
    -i INPUT, --input=INPUT : Glob string(s) or file path(s) to process, "-" for STDIN
    -o OUTPUT, --output=OUTPUT : Output file, "-" for STDOUT, by default '?.pro.css'
    -p PLUGINS, --plugins=PLUGINS : Plugins to use.
```
Arguments:
```
    INPUT : Alias to --input
```
Example:
* with files:
```
    $ procss test.css -p pluginName

or
 
    $ procss test.css -o ?.processed.css -p pluginName
    
or
    
    $ procss test.css test2.css -o ?.processed.css -p pluginName
    
or
    
    $ procss '*test*.css' -o ?.processed.css -p pluginName
```
* with STDIN / STDOUT:
```
    $ cat test.css | procss -i - -o - -p pluginName > ?.processed.css
```

### JS API

Usage:
```
require('procss')
    .run(options)
    .then(cb);
```

Options:
* **input:** Glob string(s) or file path(s) to process, "-" for STDIN
* **output:** Output filepath mask  [?.pro.css]
* **plugins:** Plugins to use

Example:
```
require('procss')
    .run({
        input : '*test*.css',
        output : '?.processed.css',
        plugins : [ 'pluginName', 'pluginPath/pluginName' ]
    })
    .then(cb);
```
      
## Configuration

You can predefine options in `procss.json` config files like this:
```
{
    "output" : "changed_?.css",
    "plugins" : [ "some-plugin" ]
}
``` 
`'?'` in `output` is an input file name mask.

`Proccs` uses the nearest to input file config, so it will try to find `.procss.js` in each folder from input path to root.

If you want to define configs depending on the input file path, you can use wildcard patterns:
```
[
    {
        "file_paths" : "dirA/**/*.css",
        "config" : {
            "output" : "changed_?.css",
            "plugins" : [ "some-plugin" ]
        }
    },
    {
        "file_paths" : [ "dirA/a.css", "dirB/*.css" ],
        "config" : {
            "output" : "changed-once-more_?.css"
        }
    }
]
```
Each matched config will extend the previous one, so for `/dirA/a.css` input file it will be:
```
{
    "output" : "changed-once-more_?.css",
    "plugins" : [ "some-plugin" ]
}
```

Plugins can be defined by npm package name and/or by absolute or relative to config path:
```
{
    "plugins" : [ "some-plugin", "my-super-plugin/plugin.js" ]
}
```
Plugins are processed in order, so definition order is significant.

Plugins can also have their own configs:
```
[
    {
        "file_paths" : "dirA/**/*.css",
        "config" : {
            "plugins" : [
                {
                    "plugin" : "some-plugin",
                    "config" : { "some-prop" : "some-val" }
                }
            ]
        }
    },
    {
        "file_paths" : [ "dirA/a.css", "dirB/*.css" ],
        "config" : {
            "plugins" : [
                {
                    "plugin" : "some-plugin",
                    "config" : { "some-prop" : "some-another-val" }
                },
                {
                    "plugin" : "my-super-plugin/plugin.js",
                    "config" : { "some-another-prop" : "some-another-val" }
                }
            ]
        }
    }
]
```

## Plugins

### [List of plugins](https://github.com/vindm/procss/wiki/Plugins)

### Plugins development

Plugin is a simple Node.js module, which must export object with at least one API methods:

***before*** - will be called before start to process input files. 

***beforeEach*** - will be called before start to process commands in file.

***process*** - will be called to process each parsed command.

***afterEach*** - will be called after finish to process file.

***after*** - will be called after finish to process files.

> @todo

### [Plugin example](https://github.com/vindm/procss/blob/master/example/plugin.js)

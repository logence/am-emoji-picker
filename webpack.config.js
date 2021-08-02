const path = require('path');
const is_production = require('yargs').argv.mode === "production";

module.exports = {
    entry    : {
        EmojiPicker: './src/js/EmojiPicker.js'
    },
    cache    : true,
    output   : {
        path          : path.join(__dirname, './dist/'),
        filename      : '[name].js',
        libraryTarget : "umd",
        libraryExport : 'default',
        library       : 'EmojiPicker',
        globalObject  : "this",
        umdNamedDefine: true
    },
    //uncomment the devtool key for development so that webpack will provide a map to your source
    devtool  : is_production ? false : 'inline-source-map',
    module   : {
        rules : [
            {
                test : /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                options: {
                    presets : [
                        ['env', {
                            targets : {
                                ie : 9
                            }
                        }]
                    ]
                }
            },
            {
                test: /\.mustache|html$/,
                loader: 'mustache-loader'
            }
        ]
    },
    externals: {
        jquery: 'jQuery'
    }
};

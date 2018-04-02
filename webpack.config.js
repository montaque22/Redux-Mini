const path              = require('path');
const UglifyJSPlugin    = require('uglifyjs-webpack-plugin')

module.exports = {
    entry: ['babel-polyfill','./js/store.js'],
    output: {
        libraryTarget: "umd",
        filename: 'redux.min.js',
        path: path.resolve(__dirname,'dist')
    },
    devtool:'source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                }
            }
        ]
    },
    plugins: [ new UglifyJSPlugin() ]

};

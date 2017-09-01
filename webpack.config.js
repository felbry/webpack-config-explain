const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');

const ExtractTextPlugin = require("extract-text-webpack-plugin");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: {
        app: './src/main.js',
        vendor: ['vue', 'vue-router']
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[chunkhash].js'
    },
    // devServer: {
    //     contentBase: './dist',
    //     hot: true
    // },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader'
                })
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    // {
                    //     loader: 'file-loader',
                    //     options: {
                    //         name: '[path][name][hash].[ext]'
                    //     }  
                    // },
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 4000
                        }
                    }
                ]
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [
                    // {
                    //     loader: 'file-loader',
                    //     options: {
                    //         name: '[path][name][hash].[ext]'
                    //     }  
                    // },
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 4000
                        }
                    }
                ]
            },
            {
                test: /\.vue$/,
                use: [
                    {
                        loader: 'vue-loader',
                        options: {
                            extractCSS: true
                        }
                    }
                ]
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: '首页',
            // 可以配置 filename 重命名生成的文件，默认为index.html
            template: './index.html',
            inject: true
        }),
        new CleanWebpackPlugin(['dist']),
        // new webpack.HotModuleReplacementPlugin(),
        new ExtractTextPlugin({
            filename: '[name].[contenthash].css'
        }),
        new webpack.optimize.CommonsChunkPlugin({
            names: ['vendor', 'runtime']
        }),
        new webpack.HashedModuleIdsPlugin(),
        new UglifyJSPlugin(),
    ],
    resolve: {
        extensions: ['.js', '.vue'],
        alias: {
            'vue$': 'vue/dist/vue.common.js',
        }
    }
}
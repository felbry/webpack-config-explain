const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: './src/main.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'build.js'
    },
    devServer: {
        contentBase: './dist',
        hot: true
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
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
                use: ['vue-loader']
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
        new webpack.HotModuleReplacementPlugin()
    ],
    resolve: {
        extensions: ['.js', '.vue'],
        alias: {
            'vue$': 'vue/dist/vue.common.js',
        }
    }
}
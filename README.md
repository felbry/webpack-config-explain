# 一个vue项目的webpack配置过程

## Step1

1. **copy** `vue-cli`生成的项目下的`src`目录，即拿到一个最简单的`vue`项目

2. `npm init`，依赖安装
    - dependencies
        - vue
        - vue-router
    - devDependencies（主要用于打包）
        - webpack
        - **a. 样式**
        - style-loader
        - css-loader
        - **b. 文件（图片、字体等）**
        - file-loader
        - url-loader
        - **c. ES6 转 ES5**
        - babel-core
        - webpack-plugin-transform-runtime 附链接：[babel全家桶](https://github.com/brunoyang/blog/issues/20) [babel的使用](https://segmentfault.com/a/1190000008159877#articleHeader7)
        - babel-preset-stage-2（对应一个ES的标准）
        - babel-loader
        - **d. vue**
        - vue-loader
        - vue-template-compiler（编译vue文件需要此依赖，否则报错）
        - **e. 额外**
        - html-webpack-plugin（指定模板文件，动态插入script与link标签）
        - clean-webpack-plugin（避免多次打包，即chunkhash模式下产生冗余文件）
        - webpack-dev-server（直接在内存中编译文件，提升每次编译打包速度，同时具备热更新功能）

3. 配置`webpack.config.js`文件以及`babelrc`文件

4. 错误
    - 文件后缀省略，解析错误

    ```
    ERROR in ./src/router/index.js
    Module not found: Error: Can't resolve '../components/Hello' in 'c:\assets\vue-webpack\src\router'
    @ ./src/router/index.js 3:0-40
    @ ./src/main.js

    ERROR in ./src/main.js
    Module not found: Error: Can't resolve './App' in 'c:\assets\vue-webpack\src'
    @ ./src/main.js 4:0-24
    ```

    不能解析这种路径是因为找不到对应的`loader`。解决方案有两种：
    第一种就是加上`.vue`的后缀，第二种就是在`webpack`中增加`resolve`属性，配置如下：
    ```
    resolve: {
        extensions: ['.js', '.vue'],
    }
    ```

    - file-loader与url-loader并存的怪异现象（在vue-loader存在的前提下）

    起初配置如下

    ```
    {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
            {
                loader: 'file-loader',
                options: {
                    name: '[path][name][hash].[ext]'
                }  
            },
            {
                loader: 'url-loader',
                options: {
                    limit: 4000
                }
            }
        ]
    },
    ```
    最终生成的结果是不论`limit`怎么设置，都会造成一个`base64`编码文件和一个`png`图片文件产生，而且似乎是每次都引入了`base64`编码文件。具体细节可以自己实现重现。

    看`vue-loader`文档说：
    > url-loader 允许你有条件将文件转换为内联的 base-64 URL（当文件小于给定的阈值），这会减少小文件的 HTTP 请求。如果文件大于该阈值，会**自动**的交给 file-loader 处理。

    参考`vue-cli`生成的`webpack`配置文件，也并没有配置`file-loader`的参数，推断可能是在`vue-loader`的作用下，两者可以自动转换，只需配置`url-loader`即可。

    - `vue`不同构建版本的问题

    ```
    [Vue warn]: You are using the runtime-only build of Vue where the template compiler is not available. Either pre-compile the templates into render functions, or use the compiler-included build.
    ```

    这个错误是因为没有选用合适的**构建版本**，导致构建失败。错误原因大致意思就是你在使用运行时的构建版本，是不能进行模板编译的。要么将预编译模板注入`render`函数，要么就使用包含编译的版本进行构建。**各个版本之间的区别官方文档有很详细的解释，不作赘述**。

    解决方法就是使用包含编译的版本进行构建呗。
    具体方法就是配置`webpack`的别名
    ```
    resolve: {
        extensions: ['.js', '.vue'],
        alias: {
            'vue$': 'vue/dist/vue.common.js',
        }
    }
    ```
    在`resolve`下新增`alias`属性，指定你要使用的构建版本。注意在进行生产环境构建的时候，别忘了改换成只包含运行时的版本，体积能减少不小，相当于是一个优化细节。

    - 总结

    通过以上的配置，我们项目具备编译打包`vue`文件，还有一个`dev-server`可以运行“编译在内存”中的文件，具备热更新。可以愉快的开发了~
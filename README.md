# 一个vue项目的webpack配置过程

## Step 1

1. **copy** `vue-cli`生成的项目下的`src`目录，即拿到一个最简单的`vue`项目

2. `npm init`，依赖安装
    - dependencies
        - vue
        - vue-router
    - devDependencies（主要用于构建打包）
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

5. 总结

    通过以上的配置，我们项目具备编译打包`vue`文件，还有一个`dev-server`可以运行“编译在内存”中的文件，具备热更新。可以愉快的开发了~

## Step 2

1. 概述

    经历了项目的开发过程，然后就是构建打包。这时我们先停掉`webpack-dev-server`，因为需要观察一下打包后的文件（启动服务时文件是直接保存在内存中的）。
    再次运行`webpack`命令，得到dist文件夹如下：

    ```
    2017/09/01  11:22             6,849 82b9c7a5a3f405032b1db71a25f67021.png
    2017/09/01  11:22           362,649 build.js
    2017/09/01  11:22               397 index.html
                3 个文件        369,895 字节
                2 个目录 74,397,601,792 可用字节
    ```
    可以看到`build.js`文件大约有`363kb`的大小。显然这是非常大的。思考一下都是什么东西打包进去了：库文件、`css`文件内容以及小图片的`base64`编码等等。所以目前我们要做的首要任务就是抽离库文件和样式文件。

    抽离库文件与样式文件之后，还有三件事，分别是对文件版本进行控制（为后期做缓存准备）、避免不必要的文件频繁打包（比如库文件，一般是不变动的，但是目前每更新一些自己的代码，库文件也要重新打包一次，其实也是与缓存优化有关）、压缩代码。

    值得一提的是，在避免库文件重复打包的处理上，按照官网的文档解决方案：提供一个`name`为`runtime`（本质同之前的`manifast`文件）的`chunk`，然后加上`HashedModuleIdsPlugin`插件，详见配置文件中。

2. 依赖安装

    - devDependencies
        - extract-text-webpack-plugin（提取css文件）
        - uglifyjs-webpack-plugin
        - babel-preset-es2015（对babel-preset-stage-2标准的更新）

3. 配置`webpack.config.js`文件

4. 错误

    - 库文件 打包问题
        ```
        ERROR in chunk vendor [entry]
        build.js
        Conflict: Multiple assets emit to the same filename build.js
        ```
        原因如错误信息，命名冲突。需要在`webpack.optimize.CommonsChunkPlugin`插件配置选项中指定`filename`来命名生成的库文件。

        **注意：当后期将`output.filename`改为动态名称时，则不需要配置`filename`属性**

    - 配置好提取`css`的插件之后未生效
        原因：还需要在`vue-loader`中进行配置如下（参考`vue-loader`文档）：
        ```
        loader: 'vue-loader',
        options: {
            extractCSS: true
        }
        ```

    - `UglifyJs` 压缩代码时无法压缩`ES6`代码
        ```
        ERROR in app.e24692cc97d4610c09be.js from UglifyJs
        Unexpected token: punc (() [app.e24692cc97d4610c09be.js:288,5]
        ```
        这可能是`babel`没有转换成功的原因。我之前用的是`babel-preset-stage-2`的标准，后来改换为`babel-preset-es2015`，同时更改下`.babelrc`文件即解决问题。

5. 结果

    除了上述完成的五条优化建议外，还有`vue`模块引入时的懒加载也可以做进一步优化，详情查看`vue-router`文档即可。
    本次更改过后可实现：每次修改`js`内容，打包时仅更新`js`文件；每次修改`css`内容，打包时仅更新`css`文件。只要库文件没有变动，即不更新。

## 结尾

注意开发与生产构建的不同，开发需要`webpack-dev-server`结合热更新提升效率，但生产构建时的提取`css`插件不支持热更新，而且压缩代码在开发环节不宜使用。
所以在`Step2`中最终得到的配置文件按需使用。后期可进行分离。
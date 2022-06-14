# Webpack 使用

## 什么是 webpack

webpack 是前端项目工程化的具体解决方案。

webpack 提供了友好的前端模块化开发支持，以及代码压缩混淆、处理浏览器端 JavaScript 的兼容性、性能优化等强大的功能。

好处：让程序员把工作中心放到具体功能的实现上，提高了前端开发效率和项目的可维护性。目前 Vue、React 等前端项目，基本上都是基于 webpack 进行工程化开发的。

## webpack 实践

### 创建列表隔行变色项目

1. 新建项目空白目录，并运行 `npm init -y` 命令，初始化包管理配置文件 *package.json*;
2. 新建 src 源代码目录;
3. 新建 *src/index.html* 首页和 *src/index.js* 脚本文件;
4. 初始化首页基本的结构;
5. 运行 `npm install jquery -S` 命令，安装 jQuery，`-S` 是 `--save`;
6. 通过 ES6 模块化的方式导入 jQuery，实现列表隔行变色效果;

### 在项目中安装 webpack

命令：`npm install webpack@5.42.1 webpack-cli@4.7.2 -D`; `-D` 表示记录到 `devDependencies` 节点中，是 `--save-dev` 的简写，表示只在开发阶段用到。

### 在项目中配置 webpack

1. 在项目根目录中，创建名为 webpack.config.js 的 webpack 配置文件，并初始化如下的基本配置：
```javascript
module.exports = {
    mode: 'development'  // mode 用来指定构建模式，可选有 development 和 production
}
```
2. 在 package.json 的 script 节点下，新增 dev 脚本
```json
"scripts": {
    "dev": "webpack"  // script 节点下的脚本，可以通过 npm run 执行，例如 npm run dev
}
```
3. 在终端中运行 `npm run dev` 命令，启动 webpack 进行项目的打包构建

4. webpack 中的默认约定
    - 默认的打包入口文件为 src/index.js
    - 默认的输出文件路径为 dist/main.js
    - 可以在 webpack.config.js 中指定入口文件和输出文件
```js
const path = require("path")
module.exports = {
    mode: 'development',
    entry: path.join(__dirname, "src", "index1.js"),
    output: {
        path: path.join(__dirname, "dist"),
        filename: "bundle.js"
    }
}
```

### 实现修改源文件自动生成目标代码功能

- 安装插件: `npm install webpack-dev-server -D`
- 修改 package.json 中的命令: `"dev": "webpack serve"`


### 总结

webpack 插件的作用：
- webpack-dev-server: 每当修改了源代码，webpack 会自动进行项目的打包和构建
- html-webpack-plugin
    - webpack 中的 HTML 插件，类似于一个模板引擎插件
    - 可以通过此插件自定制 index.html 页面的内容


## 通过 vue-cli
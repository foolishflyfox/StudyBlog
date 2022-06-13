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

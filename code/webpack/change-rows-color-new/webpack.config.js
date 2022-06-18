const path = require("path")
const HtmlPlugin = require('html-webpack-plugin')
// 解构赋值
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); 

const htmlPlugin = new HtmlPlugin({
    template: './src/index.html',
    filename: './index.html'
})

module.exports = {
    mode: 'development',
    // 在开发调试阶段建议设置
    devtool: 'eval-source-map',
    // devtool: 'nosources-source-map',
    // devtool: 'source-map',
    entry: path.join(__dirname, "src", "index1.js"),
    output: {
        path: path.join(__dirname, "dist"),
        filename: "js/bundle.js"
    },
    plugins: [htmlPlugin, new CleanWebpackPlugin()],
    devServer: {
        // 启动 webpack-dev-server 后，自动打开浏览器
        open:  true,
        // 设置端口号
        port: 80
    },
    module: {  // 所有第三方模块的匹配规则
        rules: [
            // 定义不同模块的 loader
            {test: /\.css$/, use: ['style-loader', 'css-loader']},
            {test: /\.less$/, use: ['style-loader', 'css-loader', 'less-loader']},
            {test: /\.jpg|png|gif$/, use: 'url-loader?limit=500&outputPath=images'},
            {test: /\.js$/, use: 'babel-loader', exclude: /node-modules/}
        ]
    },
    resolve: {
        alias: {
            '@': path.join(__dirname, "src")
        }
    }
}

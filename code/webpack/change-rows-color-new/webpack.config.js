const path = require("path")
const HtmlPlugin = require('html-webpack-plugin')

const htmlPlugin = new HtmlPlugin({
    template: './src/index.html',
    filename: './index.html'
})

module.exports = {
    mode: 'development',
    entry: path.join(__dirname, "src", "index1.js"),
    output: {
        path: path.join(__dirname, "dist"),
        filename: "bundle.js"
    },
    plugins: [htmlPlugin],
    devServer: {
        // 启动 webpack-dev-server 后，自动打开浏览器
        open:  true,
        // 设置端口号
        port: 80
    },
    module: {  // 所有第三方模块的匹配规则
        rules: [
            // 定义不同模块的 loader
            {test: /\.css$/, use: ['style-loader', 'css-loader']}
        ]
    }
}

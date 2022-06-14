const HtmlPlugin = require('html-webpack-plugin')

const htmlPlugin = new HtmlPlugin({
    template: './src/index.html',
    filename: './index.html'
})

module.exports = {
    // mode 用来指定构建模式，可选有 development 和 production
    mode: 'development',
    plugins: [htmlPlugin],
}
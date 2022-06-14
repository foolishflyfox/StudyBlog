import $ from 'jquery'
// 导入样式
import './css/index.css'

$(function() {
    $('li:odd').css('color', 'blue')
    $('li:even').css('color', 'orange')
})


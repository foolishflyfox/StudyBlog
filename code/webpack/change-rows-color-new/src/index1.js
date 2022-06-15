import $ from 'jquery'
// 导入样式
import './css/index.css'
import './css/index.less'

// 导入图片文件
import logo from './images/note.png'

console.log(logo)
// 给 img 标签的 src 动态赋值
$('.box').attr('src', logo)

$(function() {
    $('li:odd').css('color', 'blue')
    $('li:even').css('color', 'orange')
})

function info(target) {
    target.firstName = 'Stave'
    target.lastName = 'Curry'
    target.age = 34
}
// 定义一个普通的类
@info
class Person {}

console.log(Person.age)
console.log(Person.firstName)
console.log(Person.lastName)
console.log(Person)


# Vue 使用指南

## Vue 是什么

Vue 是一套用于构建用户界面的渐进式框架。Todo: 什么是渐进式?

随着 Web 技术的发展，为了减轻服务器端的压力，会将一些与数据库无关的计算代码从服务器端向浏览器端迁移，这些迁移的代码块以 JavaScript 文件的形式嵌入到页面中，为了规范 JavaScript 的组织形式，我们会使用 JavaScript 框架。

Vue 就是一个 JavaScript 框架，另外两个常见的 JavaScript 框架是 Angular、React。

## 实践

### 一个简单的 Demo

下面的 demo 展示了数据如何绑定到 html 中的页面元素的。

```html
<div id="app">
    <h2>{{ product }} are in stock.</h2>
</div>

<!-- 引入 vue -->
<script src="https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js"></script>

<!-- 使用 vue -->
<script>
    // 创建一个 Vue 对象
    const app = new Vue({
        el: '#app', // el 表示 element，表示需要绑定的前端对象
        data: {
            product: 'Boots'  // 在 #app 中可以直接使用 {{product}} 获取数据
        }
    });
</script>
```
代码中 app 元素的 `{{product}}` 内容绑定到 `app.product` 对象上，执行 `app.product = 'Socks'` 修改了 `app.product` 对象的值，页面对应的内容也会被修改，这就是所谓的响应式(Reactive)，即 JavaScript 中元素对象数据的改变，Vue 框架会自动更新页面元素的内容。

### 指令

除了可以通过 `{{ name }}` 改变 HTML 的内容外，我们还可以通过指令进行内容绑定：
```html
<div id="app-2">
    <span v-bind:title="message">
        鼠标悬停几秒查看此处动态绑定的提示信息
    </span>
</div>

<script src="https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js"></script>
<script>
    var app2 = new Vue({
        el: "#app-2",
        data: {
            message: '页面加载于' + new Date().toLocaleString()
        }
    })
</script>
```
其中的 `v-bind` 属性就被称为指令。指令带有前缀 `v-`，以表示它们是 Vue 提供的特殊 attribute。

### 条件与循环

`v-if` 指令表示条件。例如：
```html
<div id="app-3">
    <p v-if="seen">现在你看到我了</p>
</div>

<script src="https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js"></script>
<script>
    var app3 = new Vue({
        el: '#app-3',
        data: {
            seen: true
        }
    })
</script>
```
通过指定 `app3.seen` 可以控制 p 对象是否可见。

`v-for` 指令表示循环，用于绑定数组的数据来渲染一个项目列表。
```html

```



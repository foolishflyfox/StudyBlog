# JavaScript 面向对象编程

JavaScript 通过原型模式实现类的定义，例如下面的例子 *PrototypeDemo.js*:

```javascript
// 定义类的构造函数
function Person (name, age) {
    // 构造函数赋值的都是类实例的成员变量
    this.name = name
    this.age = age
}
// 定义类的原型
Person.prototype = {
    constructor: Person,
    // 原型中的变量相当于成员变量
    type: "human",
    // 原型中的函数对于实例共用一套代码
    sayHello: function() {
        console.log("hello " + this.name + ", you are " + this.age + ".")
    }
}

var p1 = new Person("apple", 18)
var p2 = new Person("banana", 19)
p1.sayHello()
console.log(p1 instanceof Person)
console.log(p1.sayHello == p2.sayHello)
```

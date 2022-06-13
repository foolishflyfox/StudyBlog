function Person (name, age) {
    this.name = name
    this.age = age
}
Person.prototype = {
    constructor: Person,
    type: "human",
    sayHello: function() {
        console.log("hello " + this.name + ", you are " + this.age + ".")
    }
}

var p1 = new Person("apple", 18)
var p2 = new Person("banana", 19)
p1.sayHello()
console.log(p1 instanceof Person)
console.log(p1.sayHello == p2.sayHello)




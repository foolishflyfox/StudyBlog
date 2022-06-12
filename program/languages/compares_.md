#  编程语言差异对比
  
  
本文主要对 Java、C++、JavaScript、Python、Shell 语言编程做一个对比，按类比的方式学习其他语言效率更高。
  
##  输出
  
  
Hello World 通常是程序员的入门程序，下面是不同语言的版本。
  
###  Java
  
  
Java 所有的函数都必须在类中，不能单独存在，创建一个 *Hello.java*，内容如下：
```java
public class Hello {
    public static void main(String[] args) {
        System.out.printf("hello, world\n");
    }
}
```
编译与执行过程如下：
```sh
$ javac Hello.java
$ java Hello
hello, world
```
其中 javac 对 Hello.java 进行编译，生成 Hello.class 文件。`java Hello` 执行生成的字节码文件。
  
###  C++
  
  
C++ 可以直接定义函数，创建一个 *Hello.cpp*，内容如下：
```cpp
#include <iostream>
  
int main() {
    std::cout << "hello, world" << std::endl;
}
```
编译与执行过程如下：
```sh
$ g++  Hello.cpp
$ ./a.out
hello, world
```
其中 g++ 对 Hello.cpp 进行编译，生成 a.out 可执行文件。`./a.out` 执行生成的文件。
###  JavaScript
  
  
通过 node 可以直接执行 JavaScript 编写的脚本，创建一个 *Hello.js*，内容如下:
```javascript
console.log("hello, world")
```
因为是解释型语言，可以直接执行:
```shell
$ node Hello.js
hello, world
```
  
###  Python
  
  
与 JavaScript 类似，Python 也是解释型语言，直接执行即可。创建一个 *Hello.py*，内容如下:
```python
print("hello, world")
```
通过 Python3 执行该脚本:
```shel
$ python3 Hello.py
hello, world
```
  
###  Shell
  
  
Shell 也属于解释型语言，Shell 脚本是将命令进行组合，完成指定的功能。创建一个 *Hello.sh*，内容如下:
```shell
#/bin/bash
  
echo "hello,world"
```
为该文件添加可执行权限，并进行执行：
```sh
$ chmod u+x Hello.sh
$ ./Hello.sh
hello,world
```
其中 `chmod` 用于为文件添加可执行权限，`./Hello.sh` 用于执行 shell 脚本。
  
  
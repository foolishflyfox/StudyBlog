# 编程语言差异对比

本文主要对 Java、C++、JavaScript、Python、Shell 语言编程做一个对比，按类比的方式学习其他语言效率更高。

## 控制台输出

Hello World 通常是程序员的入门程序，下面是不同语言的版本。

### Java

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

### C++

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
### JavaScript

通过 node 可以直接执行 JavaScript 编写的脚本，创建一个 *Hello.js*，内容如下:
```javascript
console.log("hello, world")
```
因为是解释型语言，可以直接执行:
```shell
$ node Hello.js
hello, world
```

### Python

与 JavaScript 类似，Python 也是解释型语言，直接执行即可。创建一个 *Hello.py*，内容如下:
```python
print("hello, world")
```
通过 Python3 执行该脚本:
```shel
$ python3 Hello.py
hello, world
```

### Shell

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

## if 语句

- Java 版 (If.java)
```java
public class If {
    public static void main(String[] args) {
        int a = 10;
        // 演示 if
        if (a % 2 == 0) {
            System.out.println("a is times of 2");
        }
        // 演示 if-else
        if (a  < 0) {
            System.out.println("a < 0");
        } else if (a < 5) {
            System.out.println("a >= 0 && a < 5");
        } else {
            System.out.println("a >= 5");
        }
    }
}
```
- C++ 版(If.cpp)
```cpp
#include <iostream>
using namespace std;

int main() {
    int a = 0;
    // 演示 if
    if (a % 2 == 0) {
        cout << "a is times of 2" << endl;
    }
    // 演示 if-else
    if (a  < 0) {
        cout << "a < 0" << endl;
    } else if (a < 5) {
        cout << "a >= 0 && a < 5" << endl;
    } else {
        cout << "a >= 5" << endl;
    }
}
```
- JavaScript 版(If.js)
```java
var a = 10

// 演示 if
if (a % 2 == 0) {
    console.log("a is times of 2")
}
// 演示 if-else
if (a  < 0) {
    console.log("a < 0")
} else if (a < 5) {
    console.log("a >= 0 && a < 5")
} else {
    console.log("a >= 5")
}
```

- Python 版(If.py)
```python
a = 10

# 演示 if
if (a % 2 == 0):
    print("a is times of 2")

# 演示 if-else
if (a  < 0):
    print("a < 0")
elif (a < 5):
    print("a >= 0 && a < 5")
else:
    print("a >= 5")
```

- Shell 版(If.sh)
```shell
#!/bin/bash

a=10
((b=a%2))
# 演示 if
if [ $b -eq 0 ]; then
    echo "a is times of 2"
fi
# 演示 if-else
if [ $a -lt 0 ]; then
    echo "a < 0"
elif [ $a -lt 5 ]; then
    echo "a >= 0 && a < 5"
else
    echo "a >= 5"
fi
```
## 循环语句

### for

- Java 版(For.java)
```java
public class For {
    public static void main(String[] args) {
        for (int i = 0; i < 3; ++i) {
            System.out.println(i);
        }
    }
}
```

- C++  版(For.cpp)
```cpp
#include <iostream>

int main() {
    for (int i = 0; i < 3; ++i) {
        std::cout << i << std::endl;
    }
}
```

- JavaScript 版(For.js)
```javascript
for (i = 0; i<3; ++i) {
    console.log(i)
}
```

- Python 版本(For.py)
```python
# i从0开始，按1递增，小于3
for i in range(0, 3, 1):
    print(i)

```

- Shell 版本(For.sh)
```sh
#!/bin/bash

for ((i=0; i<3; ++i)); do
    echo $i
done
```

### while

- Java 版(While.java)
```java
public class While {
    public static void main(String[] args) {
        int i = 0;
        while (i < 3) {
            System.out.println(i);
            i++;
        }
    }
}
```

- C++ 版(While.cpp)
```cpp
#include <iostream>
using namespace std;

int main() {
    int i = 0;
    while (i < 3) {
        std::cout << i << std::endl;
        i++;
    }
}
```

- JavaScript 版(While.js)
```javascript
var i = 0
while (i < 3) {
    console.log(i)
    i++
}
```

- Python 版(While.py)
```python
i = 0
while i < 3:
    print(i)
    i += 1
```

- Shell 版(While.sh)
```sh
#!/bin/bash
i=0
while [ "$i" -lt 3 ]; do
    echo $i
    ((i = i+1))
done
```



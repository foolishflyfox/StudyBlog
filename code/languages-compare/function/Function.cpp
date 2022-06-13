#include <iostream>
using namespace std;

void hello(const char* name);

int main() {
    hello("fff");
}

void hello(const char* name) {
    cout << "hello, " << name << endl;
}

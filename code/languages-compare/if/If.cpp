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


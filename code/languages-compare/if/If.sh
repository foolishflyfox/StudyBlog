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

#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

if [ -n "$1" ] ;then
    msg="$1"
else
    msg='update'
fi

git init
git add -A
git commit -m $msg

git push origin master

cd -
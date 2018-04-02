#!/usr/bin/env bash
echo "Copy Intro Mark Down..."
cp -f intro.md ReadMe.md

echo "Building Documentation..."
documentation build ./js/Store.js -f md > documentation.txt
documentation build ./js/Store.js -f html -o documentation-html

echo "Append documentation to ReadMe.md"
tail -n +2 documentation.txt >> ReadMe.md

echo "Clean Up"
rm documentation.txt

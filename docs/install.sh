pushd ~/Desktop/mtn-view
curl -sL https://amazingandyyy.com/mtn-view-generator/index.js > ~/Desktop/mtn-view/index.js
rm -rf $(which mtn-view) && npm i -g . --force
which mtn-view
echo "前往: https://amazingandyyy.com/mtn-view-generator"
popd

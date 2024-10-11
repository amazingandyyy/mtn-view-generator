pushd ~/Desktop/mtn-view
curl -sL https://raw.githubusercontent.com/amazingandyyy/mtn-view-generator/refs/heads/main/docs/index.js > ~/Desktop/mtn-view/index.js
rm -rf $(which mtn-view) && npm i -g . --force
which mtn-view
echo "前往: https://amazingandyyy.com/mtn-view-generator"
popd

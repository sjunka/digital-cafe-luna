#!/bin/sh
# Publica dist/ (sitio y PDF) en la rama gh-pages. Uso: npm run deploy
set -e
npm test
npm run build
npm run pdf
cd dist
rm -rf .git
git init -q
git checkout -q -b gh-pages
touch .nojekyll
mkdir -p demos && cp index.html demos/index.html
git add -A
git commit -q -m "Publicar sitio y Brief"
git push -f "$(git -C .. remote get-url origin)" gh-pages
rm -rf .git

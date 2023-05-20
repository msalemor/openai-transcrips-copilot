cd ../frontend
npm run build
rm -rf ../server/public
mkdir ../server/public
cp -R dist/. ../server/public
cd ../server
docker build . -t am8850/summarizer:dev

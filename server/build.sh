cd ../frontend
npm run build
rm -rf ../server/public
mkdir ../server/public
cp -R dist/. ../server/public
cd ../server
podman build . -t am8850/summarizer:dev
podman push am8850/summarizer:dev
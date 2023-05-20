cd ../frontend
npm run build
rm -rf ../server/public
mkdir ../server/public
cp -R dist/. ../server/public
cd ../server
go run .

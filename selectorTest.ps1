echo `<html>
echo `<!DOCTYPE html>
echo `<html>
echo `<head>
 echo  `<link rel="stylesheet" type="text/css" href="state.css">
echo `</head>
echo `<body>

node   ./node_modules/tslint/bin/tslint --test -r dist/src "tests/selector-tests/"



echo `</body>
echo `</html>
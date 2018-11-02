'use strict';
let express = require('express'),
    path = require('path'),
    hbs = require('express-hbs'),
    fs = require('fs');

let argv = process.argv;
let rootPath = './';
if (argv.length > 2) {
    let path = argv[2];
    let rootExists = fs.existsSync(path);
    if (rootExists) {
        rootPath = path;
    }
}

let app = express();
app.engine('html', hbs.express4({
    extname: 'html'
}));
app.set('view engine', 'html');
app.set('views', path.resolve(__dirname));

app.route('/*').get(renderIndex);
app.listen(8080, '0.0.0.0', function () {
   console.log("start successfully");
});

function renderIndex(req, res) {
    let userAgent = req.headers["user-agent"];
    let isOpera = userAgent.indexOf("Opera") > -1;
    let isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera;
    let path = req.url;
    path = decodeURI(path);
    let hasParent = path != '/';
    let parent = path;
    if (parent.length > 0) {
        if (parent.charAt(parent.length - 1) == '/') {
            parent = parent.substring(0, parent.length - 1);
        }
        parent = parent.substring(0, parent.lastIndexOf('/'));
        if (parent == '') {
            parent = '/';
        }
    }
    let realPath = rootPath + path;
    let fileExists = fs.existsSync(realPath);
    if (fileExists) {
        let stat = fs.lstatSync(realPath);
        if (stat.isFile()) {
            let name = path.substring(path.lastIndexOf('/') + 1, path.length);
            res.sendFile(realPath, {headers: {'Content-Disposition': "attachment;filename*=UTF-8''" + encodeURI(name)}})
        } else {
            fs.readdir(realPath, function (err, files) {
                let fileList = [];
                files.forEach(function (file) {
                    if (file.charAt(0) != '.') {
                        let p = realPath + '/' + file;
                        p = p.replace(/\/\//g, '/');
                        try {
                            let stat = fs.lstatSync(p);
                            let webPath = path +'/'+ file;
                            webPath = webPath.replace(/\/\//g, '/');
                            let size = stat.isFile() ? renderSize(stat.size) : '';
                            let type = "";
                            if (!isIE) {
                                type = stat.isFile() ? 'file' : 'dir';
                            }
                            fileList.push({path:webPath, type:type, name: file, size: size, time: stat.ctime.getTime()});
                        } catch (err) {
                            console.log('err happen : ' + err);
                        }
                    }
                });
                res.render('main', {files: fileList, parent: parent, hasParent : hasParent, path: path, isNotIE: !isIE});
            });
        }
        return;
    }
    res.render('main');

}

function renderSize(value){
    if(null==value||value==''){
        return "0 Bytes";
    }
    var unitArr = new Array("bytes","KB","MB","GB","TB","PB","EB","ZB","YB");
    var index=0;
    var srcsize = parseInt(value);
    index = Math.floor(Math.log(srcsize) / Math.log(1000));
    var size = srcsize / Math.pow(1000,index);
    size = size.toFixed(1);
    var intValue = parseInt(size);
    if (size == intValue) {
        if (intValue == 1 && index == 0) {
            return intValue + " byte";
        }
        return intValue + " " + unitArr[index];
    }
    return size + " " + unitArr[index];
}
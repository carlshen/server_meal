// npm install express --save
// npm install ejs --save
// 加密解密
const crypto = require('crypto');
const WXBizDataCrypt = require('./WXBizDataCrypt')
const request = require('request')
var fs = require('fs');
var express = require("express");
var bodyParser = require('body-parser');
var http = require('http');
var https = require('https');
var os = require('os');
var app = express();
app.use(bodyParser.json());

const wx = {
    appid: 'wxa900f2e25c98acd6',
    secret: ''
};

var db = {
    session: {},
    user: {}
};

app.post('/api/login', (req, res) => {
    // 注意：小程序端的appid必须使用真实账号，如果使用测试账号，会出现login code错误
    console.log('login code: ' + req.body.code)
    var url = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + wx.appid + '&secret=' + wx.secret + '&js_code=' + req.body.code + '&grant_type=authorization_code'
    request(url, (err, response, body) => {
        console.log('session: ' + body)
        var session = JSON.parse(body)
        if(session.openid) {
            var token = 'token_' + new Date().getTime()
            db.session[token] = session
            if(!db.user[session.openid]) {
                db.user[session.openid] = {
                    credit: 100
                }
            }
        }
        res.json({
            token: token
        })
    })
});

app.get('/api/checklogin', (req, res) => {
    var session = db.session[req.query.token]
    console.log('checklogin: ', session)
    // 将用户是否已经登录的布尔值返回给客户端
    res.json({
        is_login: session !== undefined
    })
});

app.get('/api/credit', (req, res) => {
    var session = db.session[req.query.token]
    if(session && db.user[session.openid]) {
        res.json({
            credit: db.user[session.openid].credit
        })
    } else {
        res.json({
            err: '用户不存在，或未登录。'
        })
    }
});

app.post('/api/userinfo', (req, res) => {
    // 获取session值
    var session = db.session[req.query.token]
    console.log('session:' + session)
    if(session) {
        // 使用appid和session_key解密encryptedData
        var pc = new WXBizDataCrypt(wx.appid, session.session_key)
        var data = pc.decryptData(req.body.encryptedData, req.body.iv)
        console.log('解密后：', data)
        // 校验rawData是否正确通过
        var sha1 = crypto.createHash('sha1')
        sha1.update(req.body.rawData + session.session_key)
        var signature2 = sha1.digest('hex')
        console.log(signature2)
        console.log(req.body.signature)
        res.json({
            pass: signature2 === req.body.signature
        })
    } else {
        res.json({
            err: '用户不存在，或未登录。'
        })
    }
});

//get请求首页信息
app.get('/api/food/index',function (req,res) {
    console.log(req.query);
	fs.readFile('index.json', 'utf-8', function (err, data) {
	    if (err) {
	        console.log(err);
	    } else {
            res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});
	        //res.end(data);
	        res.end(data);
	    }
	});
});

//get请求菜单列表
app.get('/api/food/list',function (req,res) {
    console.log(req.query);
    var now = new Date();
    var day = now.getDay();
	fs.readFile('list' + day + '.json', 'utf-8', function (err, data) {
	    if (err) {
	        console.log(err);
	    } else {
            res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});
	        //res.end(data);
	        res.end(data);
	    }
	});
});
//get请求订单列表
app.get('/api/food/orderlist',function (req,res) {
    console.log(req.query);

	var filename = 'orderlist-0.json';

   if (req.query.last_id === "10")  {
    	// 10 : 11~20
		filename = 'orderlist-10.json';

    }else if (req.query.last_id === "20")  {
    	// 20: 21~30
		filename = 'orderlist-20.json';

    }

	fs.readFile(filename, 'utf-8', function (err, data) {
	    if (err) {
	        console.log(err);
	    } else {
            res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});
	        //res.end(data);
	        res.end(JSON.stringify(JSON.parse(data)));
	    }
	});
});

//订单请求post
app.post("/api/food/order",function(req,res){
	//console.log(req.query.body);
	var obj = JSON.parse(req.query.body);
    var now = new Date();
    var day = now.getDay();
	var directory = './namelist' + day;
	console.log(directory);
	fs.exists(directory, function(exist) {
		if (!exist) {
			fs.mkdirSync(directory, 0777);
		}
		var fileName = directory + '/' + obj.id;
		console.log(fileName);
		fs.writeFile(fileName, req.query.body, function(err) {
			if (err) {
			//throw err;
			console.log(err);
			}
		});
	});
   res.json({error:0,order_id:3})
});

app.get("/api/food/order",function(req,res){
	//console.log(req.query.body);
	var obj = JSON.parse(req.query.body);
    var now = new Date();
    var day = now.getDay();
	var directory = './namelist' + day;
	console.log(directory);
	fs.exists(directory, function(exist) {
		if (!exist) {
			fs.mkdirSync(directory, 0777);
		}
		var fileName = directory + '/' + obj.id;
		console.log(fileName);
		fs.writeFile(fileName, req.query.body, function(err) {
			if (err) {
			//throw err;
			console.log(err);
			}
		});
	});
    res.json({error:0, order_id:1})
});
// sum the files
app.get("/api/food/sum",function(req,res){
    var now = new Date();
    var day = now.getDay();
	var directory = './namelist' + day;
	console.log(directory);
	var files = fs.readdirSync(directory);
	console.log(files.length);
    res.json({error:0, order_id: files.length })
});

//支付post请求
app.post("/api/food/pay",function(req,res){
   res.json({error:0, order_id:3})
});

//get请求消费记录
app.get('/api/food/record',function (req,res) {
    console.log(req.query);
	fs.readFile('record.json', 'utf-8', function (err, data) {
	    if (err) {
	        console.log(err);
	    } else {
            res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});
	        //res.end(data);
	        res.end(data);
	    }
	});
});

//app.listen(8081);    
http.createServer(app).listen(80, '192.168.1.20');
const httpsOption = {
    key:  fs.readFileSync("./1shitang.tsinghuaic.com.key"),
    cert: fs.readFileSync("./1shitang.tsinghuaic.com.pem"),
    ca: [ fs.readFileSync("./1shitang.tsinghuaic.com.pem") ]
};
https.createServer(httpsOption, app).listen(443, '192.168.1.20');

/*

//模板引擎
app.set("view engine","ejs");

app.get("/",function(req,res){
     res.render("form");
});
/*
//bodyParser API
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/",function(req,res){
    console.log(req.body);
});

*/

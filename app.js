var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var crypto = require('crypto');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var moment = require('moment');


var models = require('./models/models');
var User = models.User;
var Note = models.Note;

var checkLogin = require('./checkLogin.js');

var app = express();

mongoose.connect('mongodb://localhost:27017/notes', { useMongoClient: true });
mongoose.connection.on('error', console.error.bind(console, '连接数据库失败'));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    key: 'session',
    secret: 'Keboard cat',
    cookie: {maxAge: 60000},
    store: new MongoStore({
        db: 'keys',
        mongooseConnection: mongoose.connection
    }),
    resave: false,
    saveUninitialized: true
}));

app.get('/', checkLogin.noLogin);
app.get('/', function(req, res) {
    Note.find({author: req.session.user.username})
        .exec(function(err, arts) {
            if(err) {
                console.log(err);
                return res.redirect('/');
            }
            res.render('index', {
                title: '笔记列表',
                user: req.session.user,
                arts: arts,
                moment: moment
            });        
        })
});

app.get('/reg', function(req, res) {
    res.render('register', {
        title: '注册',
        user: req.session.user,
        page: 'reg'
    });
});

app.post('/reg', function(req, res) {
    var username = req.body.username,
		password = req.body.password,
		passwordRepeat = req.body.passwordRepeat;

	if(password != passwordRepeat) {
		console.log('您两次输入的密码不一致！请重新输入！');
		return res.redirect('/reg');
	}

	User.findOne({username:username}, function(err, user) {
		if(err) {
			console.log(err);
			return res.redirect('/reg');
		}

		if(user) {
			console.log('用户名已存在');
			return res.redirect('/reg');
		}

		var md5 = crypto.createHash('md5'),
			md5password = md5.update(password).digest('hex');

		var newUser = new User({
			username: username,
			password: md5password
		});

		newUser.save(function(err, doc) {
			if(err) {
                console.log(err);
				return res.redirect('/reg');
			}
			console.log('注册成功！');
			newUser.password = null;
			delete newUser.password;
			req.session.user = newUser;
			return res.redirect('/');
		});
	});
});

app.get('/login', function(req, res) {
    res.render('login', {
       title: '登录',
       user: req.session.user,
       page: 'login'
    });
});

app.post('/login', function(req, res) {
    var username = req.body.username,
		password = req.body.password;

	User.findOne({username:username}, function(err, user) {
		if(err) {
			console.log(err);
			return next(err);
		}
		if(!user) {
			console.log('该用户不存在！');
			return res.redirect('/login');
		}
		var md5 = crypto.createHash('md5'),
			md5password = md5.update(password).digest('hex');
		if(user.password !== md5password) {
			console.log('密码错误！');
			return res.redirect('/login');	
		}
		console.log('登录成功！');
		user.password = null;
		delete user.password;
		req.session.user = user;
		return res.redirect('/');
	});
});

app.get('/quit', function(req, res) {
    req.session.user = null;
    console.log('退出登录成功！');
    return res.redirect('/login');
});

app.get('/post', function(req, res) {
    res.render('post', {
        title: '发布',
        user: req.session.user
    })
});

app.post('/post', function(req, res) {
    var data = new Note({
		title: req.body.title,
		author: req.session.user.username,
		tag: req.body.tag,
		content: req.body.content
	});

	data.save(function(err, doc) {
		if(err) {
		console.log(err);
			return res.redirect('/post');
		}
		console.log('笔记发表成功！')
		return res.redirect('/');
	});
});

app.get('/detail/:_id', function(req, res) {
    Note.findOne({_id: req.params._id})
        .exec(function(err, art) {
            if(err) {
                console.log(err);
                return res.redirect('/');
            }
            if(art) {
                res.render('detail', {
                    title: '笔记详情',
                    user: req.session.user,
                    art: art,
                    moment: moment
                });
            }
        });
});

app.listen(3000, function(req, res) {
    console.log(app.get('views'));
    console.log('页面正在localhost:3000运行');
});
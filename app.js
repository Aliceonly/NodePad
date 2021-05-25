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

app.post('/',function(req,res){
    var conditions = req.body.condition;
    Note.find({title:conditions})
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

app.get('/del/:_id', function (req, res,next) {
    Note.remove({_id:req.params._id},function(err) {
        if(err) {
            console.log(err);
            return res.redirect('/');
        }else {
            console.log('文章删除成功！');
            return res.redirect('/');}
        })
});

app.get('/edit/:_id', function(req, res, next) {
	Note.findOne({_id: req.params._id}, function(err, art) {
		if(err) {
			console.log(err);
			return res.redirect('/');
		}
		res.render('edit', {
			title: '修改笔记',
			user: req.session.user,
			moment: moment,
			art: art
		});
	});
});

app.post('/edit/:_id', function(req, res, next) {
	Note.update({_id: req.params._id},{
		title: req.body.title,
		tag: req.body.tag,
		content: req.body.content
	}, function(err, doc) {
		if(err) {
			return res.redirect('/');
		}
		console.log('笔记编辑成功！');
		return res.redirect('/');
	});
});

app.get('/quit', function(req, res) {
    req.session.user = null;
    console.log('退出登录成功！');
    return res.redirect('/login');
});

// app.get('/adminlogin', function(req, res) {
// 	User.find(function(err) {
// 	res.render('login', {
// 		title: '登录为管理员',
// 		user: req.session.user,
// 		page:login
// 		});
// 	});
// });

// app.post('/adminlogin', function(req, res) {
// 	var adminusername = req.body.username,
// 		adminpassword = req.body.password;
// 		if(adminusername !== 'kanya') {
// 			req.flash('error', '该管理员不存在！');
// 			return res.redirect('/adminlogin');
// 		}
// 		if(adminpassword !== 'kanya') {
// 			req.flash('error', '密码错误！');
// 			return res.redirect('/adminlogin');
// 		}
// 		req.flash('success', '登录成功！');
// 		return res.redirect('/admin');
// 	});

// app.get('/admin', function(req, res) {
// 	User.find(function(err, doc) {
// 	res.render('admin', {
// 		title: '账户信息管理',
// 		user: req.session.user,
// 		datas: doc
// 		});
// 	});
// });

app.listen(3000, function(req, res) {
    console.log(app.get('views'));
    console.log('项目:在线笔记本');
    console.log('作者:陈骏杰.');
    console.log('请在localhost:3000访问页面.');
});
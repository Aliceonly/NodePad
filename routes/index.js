var express = require('express');
var mongoose = require('mongoose');
//引入加密模块
var crypto = require('crypto');
var moment = require('moment');

var model = require('../models/model');
var checkIsLogin = require('./checkIsLogin');
const { title } = require('process');

//引入数据模型对象
var User = model.User;
var Article = model.Article;
var Admin = model.Admin;

var router = express.Router();

//传入默认页码
var page = 1;
//传入页面展示数据量
var pageSize = 5;
//传入管理员账户
var newAdmin = new Admin({
	username: 'kanya',
	password: 'kanya'
});
newAdmin.save();

router.get('/', function(req, res, next) {
	//上下页分页功能
	page = req.query.page ? parseInt(req.query.page) //parseInt()解析一个字符串，并返回一个整数
	: 1 ;//判断req.query.page是否为当前页,若page未指定则返回page=1
	Article
	.count(function(err, total) {
		Article
		.find()
		//skip 跳过指定数量的数据,从而实现跳到指定页数
		.skip((page - 1) * pageSize)
		//限制读取 pageSize 条数据,设置每页展示个数
		.limit(pageSize)
		//使用sort以 createTime 倒序排序
		.sort('-createTime')
		//执行回调方法
		.exec(function(err, arts) {
			if(err) {
				req.flash('error',err);
				return res.redirect('/');
			}
			res.render('index', { 
				title: '欢迎使用在线笔记板 , 尽情创作您的笔记吧 ~ ',
				user: req.session.user,
				//(flash)
				//参数一(字符串)标识信息类型，用 'success' 和 'error' 表示
				//参数二是信息的具体内容。
				success: req.flash('success').toString(),
				error: req.flash('error').toString(),
				//传入数据总量total
				total: total,
				//传入page
				page: page,
				//传入pagesize
				pageSize: pageSize,
				//传入首页参数
				isFirstPage: (page - 1) == 0,
				//计算数据总数total,传入末页参数
				isLastPage: ((page - 1) * pageSize + arts.length) == total,
				arts: arts,
				//传入当前操作时间
				moment: moment
			});
		});
	});
});


router.get('/reg', checkIsLogin.login);
router.get('/reg', function(req, res, next) {
	res.render('register', { 
		title: '注册为创作者',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});


router.post('/reg', function(req, res, next) {
	//req.body 处理 post 请求
	var username = req.body.username,
		password = req.body.password,
		passwordRepeat = req.body.passwordRepeat;

	//检查两次输入的密码是否一致
	if(password != passwordRepeat) {
		req.flash('error', '两次输入的密码不一致！');
		return res.redirect('/reg');
	}

	//检查用户名是否已经存在
	//mongoose findOne() 方法
	User.findOne({username:username}, function(err, user) {
		if(err) {
			req.flash('error', err);
			return res.redirect('/reg');
		}

		if(user) {
			req.flash('error', '用户名已经存在');
			return res.redirect('/reg');
		}

		//对密码进行md5加密
		var md5 = crypto.createHash('md5'),
			md5password = md5.update(password).digest('hex');

		var newUser = new User({
			username: username,
			password: md5password,
			email: req.body.email
		});

		//mongoose save()方法
		newUser.save(function(err, doc) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/reg');
			}
			req.flash('success', '注册成功！');
			newUser.password = null;
			delete newUser.password;
			req.session.user = newUser;
			return res.redirect('/');
		});
	});
});


router.get('/login', checkIsLogin.login);
router.get('/login', function(req, res, next) {
	User.find(function(err, doc) {
		res.render('login', {
			title: '登录为创作者',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString(),
			datas: doc
		});
	});
});


router.post('/login', function(req, res, next) {
	var username = req.body.username,
		password = req.body.password;

	User.findOne({username:username}, function(err, user) {
		if(err) {
			req.flash("err", err);
			return next(err);
		}
		if(!user) {
			req.flash('error', '用户不存在！');
			return res.redirect('/login');
		}
		//对密码进行md5加密
		var md5 = crypto.createHash('md5'),
			md5password = md5.update(password).digest('hex');
		if(user.password !== md5password) {
			req.flash('error', '密码错误！');
			return res.redirect('/login');	
		}
		req.flash('success', '登录成功！');
		user.password = null;
		delete user.password;
		req.session.user = user;
		return res.redirect('/');
	});
});



router.get('/detail/:author', function(req, res, next) {
	page = req.query.page ? parseInt(req.query.page) : 1;
	Article
	.count({author: req.params.author})
	.exec(function(err, total) {
		Article
		.find({author: req.params.author})
		.skip((page - 1) * pageSize) 
		.limit(pageSize)
		.sort('-createTime')
		.exec(function(err, arts) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('user', { 
				title: "早上好 ! "+req.params.author ,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString(),
				total: total,
				page: page,
				pageSize: pageSize,
				isFirstPage: (page - 1) == 0,
				isLastPage: ((page - 1) * pageSize + arts.length) == total,
				arts: arts,
				moment: moment
			});
		});
	});
});


router.get('/detail/:author/:_id', function(req, res, next) {
	Article.findOne({
		author: req.params.author,
		_id: req.params._id
	}, function(err, art) {
			if(err) {
				req.flash('error', '啊噢！笔记不见了~');
				return res.redirect('/');
			}
			if(art) {
				Article.update({
					_id: req.params._id
				},{
					//每次传入数据时,$inc方法使数据pv递增
					 $inc: {'pv': 1}
				}, function(err) {
					if(err) {
						return req.flash('error', err);
					}
				});
			}
			res.render('article', {
				title: '笔记内容',
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString(),
				moment: moment,
				art: art
			});
		});
});


router.get('/search', function(req, res, next) {
	//req.query 获取 get 请求的参数，构造query正则表达式对象
	var query = req.query.title,
	//通过传入query对象模糊查询
		title = new RegExp(query, 'i');//模糊查询参数
	page = req.query.page ? parseInt(req.query.page) : 1;
	//MongoDB的的模糊查询是通过正则表达式实现的
	Article
	.count({title: title})
	.exec(function(err, total) {
		Article
		.find({title: title})
		.skip((page - 1) * pageSize)
		.limit(pageSize)
		.sort('-createTime')
		.exec(function(err, arts) {
			if(err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('search', { 
				title: '查询结果',
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString(),
				search: query,
				total: total,
				page: page,
				pageSize: pageSize,
				isFirstPage: (page - 1) == 0,
				isLastPage: ((page - 1) * pageSize + arts.length) == total,
				arts: arts,
				moment: moment
			});
		});
	});
});


router.get('/post', checkIsLogin.notLogin);
router.get('/post', function(req, res, next) {
	res.render('post', { 
		title: '发表',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString()
	});
});


router.post('/post', function(req, res, next) {
	var data = new Article({
		title: req.body.title,
		//通过 session 获得 author 元素
		author: req.session.user.username,
		tag: req.body.tag,
		content: req.body.content
	});

	data.save(function(err, doc) {
		if(err) {
			req.flash('error', err);
			return res.redirect('/post');
		}
		req.flash('success', '笔记发表成功！')
		return res.redirect('/');
	});
});


router.get('/edit/:_id', function(req, res, next) {
	Article.findOne({_id: req.params._id}, function(err, art) {
		if(err) {
			req.flash('error', err);
			return res.redirect('back');
		}
		res.render('edit', {
			title: '修改笔记',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString(),
			moment: moment,
			art: art
		});
	});
});


router.post('/edit/:_id', function(req, res, next) {
	//mongoose 的 update() 方法,并返回修改结果
	Article.update({_id: req.params._id},{
		title: req.body.title,
		tag: req.body.tag,
		content: req.body.content,
		createTime: Date.now()
	}, function(err, art) {
		if(err) {
			req.flash('error', err);
			return res.redirect('back');
		}
		req.flash('success', '笔记编辑成功！');
		return res.redirect('/detail/' + req.session.user.username);
	});
});


router.get('/remove/:_id', function(req, res, next) {
	//mongoose 的 remove() 方法，通过传参直接删除检索结果
	//req.params 获取get或post的请求参数
	Article.remove({_id: req.params._id}, function(err) {
		if(err) {
			req.flash('error', err);
		} else {
			req.flash('success', '笔记删除成功！');
		}
		return res.redirect('back');
	})
});


router.get('/reviewer', function(req, res, next) {
	User.find(function(err, doc) {
	res.render('login', {
		title: '登录为管理员',
		user: req.session.user,
		success: req.flash('success').toString(),
		error: req.flash('error').toString(),
		datas: doc
		});
	});
});


router.post('/reviewer', function(req, res, next) {
	var adminusername = req.body.username,
		adminpassword = req.body.password;
		if(adminusername !== 'kanya') {
			req.flash('error', '该管理员不存在！');
			return res.redirect('/reviewer');
		}
		if(adminpassword !== 'kanya') {
			req.flash('error', '密码错误！');
			return res.redirect('/reviewer');
		}
		req.session.username = 'kanya';
		req.flash('success', '进入管理员界面成功！');
		return res.redirect('/review');
	});


router.get('/review', checkIsLogin.notAdmin);
router.get('/review', function(req, res) {
	User.find(function(err, doc) {
		if(err) {
			req.flash('error' , err);
			return res.redirect('back');
		}
		res.render('review', {
			title: '账户信息管理',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString(),
			datas: doc
			});
	});
});


// router.get('/adminedit/:_id',function(req,res) {
// 	User.findOne({_id: req.params._id}), function(err,doc){
// 		if(err) {
// 			req.flash('error' , err);
// 			return res.redirect('back');
// 		}
// 		res.render('adedit', {
// 			title: '更改用户信息',
// 			success: req.flash('success').toString(),
// 			error: req.flash('error').toString(),
// 			datas: doc
// 		});
// 	}
// });


// router.post('/adminedit/:_id', function(req, res) {
// 	User.update({_id: req.params._id},{
// 		username: req.body.username,
// 		email: req.body.email
// 	}, function(err, doc) {
// 		if(err) {
// 			req.flash('error', err);
// 			return res.redirect('back');
// 		}
// 		req.flash('success', '更改用户信息成功！');
// 		return res.redirect('/review');
// 	});
// });


router.get('/adminremove/:_id', function(req, res, next) {
	User.remove({_id: req.params._id}, function(err) {
		if(err) {
			req.flash('error', err);
		} else {
			req.flash('success', '移除用户成功！');
		}
		return res.redirect('back');
	})
});


router.get('/logout', function(req, res, next) {
	req.session.user = null;
	req.flash('success', '退出登录成功！');
	return res.redirect('/login');
});

module.exports = router;

function login(req, res, next) {
	if(req.session.user) {
		req.flash('error', '您已登录！');
		return res.redirect('back');
	}
	next();
}

function notLogin(req, res, next) {
	if(!req.session.user) {
		req.flash('error', '您还没有登录！');
		return res.redirect('/login');
	}
	next();
}

function notAdmin(req, res, next) {
	if(!req.session.username) {
		req.flash('error', '您还没有登录！');
		return res.redirect('/reviewer');
	}
	next();
}

exports.login = login;
exports.notLogin = notLogin;
exports.notAdmin = notAdmin;

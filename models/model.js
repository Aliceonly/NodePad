const { ObjectID } = require('bson');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	username: String,
	password: String,
	email: String,
	createTime: {
		type: Date,
		default: Date.now
	}
});

var adminSchema = new Schema({
	adminusername: String,
	adminpassword: String,
	createTime: {
		type: Date,
		default: Date.now
	}
});

var articleSchema = new Schema({
	//笔记标题
	title: String,
	//笔记隶属于
	author: String,
	//笔记标签
	tag: String,
	//笔记内容
	content: String,
	//浏览量
	pv: {
		type: Number,
		default: 0
	},
	//发表时间
	createTime: {
		type: Date,
		default: Date.now
	}
});

// var commentSchema = new Schema({
// 	_id: ObjectID, //评论ID
// 	userID: ObjectID, //用户ID
// 	username: String, //用户名 反常规化 增加数据文件的容量，但是连接User表查询，从而减少请求，提升速度。
// 	articleID: ObjectID, //文章ID
// 	parentID: ObjectID, //上级评论ID
// 	text: String, //内容
// 	//评论时间
// 	createTime: {
// 		type: Date,
// 		default: Date.now
// 	}
// });


exports.User = mongoose.model('User', userSchema);
exports.Article = mongoose.model('Article', articleSchema);
exports.Admin = mongoose.model('Admin', adminSchema);
// exports.Comment = mongoose.model('Comment', commentSchema);
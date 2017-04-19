var Agent = require('../proxy/mysql/agent');
var User = require('../proxy/mysql/user');

exports.save = function(req, res, next) {
    var name = req.body.name;
    var mobile = req.body.mobile;
    var rate = req.body.rate;
    var remark = req.body.remark || '';
    var pwd = req.body.pwd;

    //存储 agent
    Agent.save({
        name: name,
        mobile: mobile,
        rate: rate,
        remark: remark
    }, function(error, _agent) {
        if (error) {
            res.json({ result: 0, msg: '操作失败.', data: {} });
        } else {
            if (_agent) {
                //存储 user
                User.save(mobile, pwd, 'USER_TYPE_AGENT', function(_user) {
                    if (_user) {
                        res.json({ result: 1, msg: '操作成功.', data: {} });
                    } else {
                        res.json({ result: 0, msg: '操作失败.', data: {} });
                    }
                });
            } else {
                res.json({ result: 0, msg: '操作失败.', data: {} });
            }
        }
    });
};
//供应商的列表
exports.list = function(req, res, next) {
    var name = req.body.name;
    var pageNo = req.body.pageNo;
    var pageSize = req.body.pageSize;

    Agent.list(pageNo, pageSize, name, function(result) {
        var totalItems = result.count;
        var list = result.rows;
        res.json({ result: 1, msg: '', data: { totalItems: totalItems, list: list } });
    });

};
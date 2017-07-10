var Order = require('../proxy/mysql/order');
var Dev = require('../proxy/mysql/dev');
var Hotel = require('../proxy/mysql/hotel');

exports.save = function(req, res, next) {
    var agentId = '';
    var hotelId = '';

    var movieKey = req.body.movieKey;
    var realFee = req.body.realFee;
    var devCode = req.body.devCode;
    var movieName = req.body.movieName;


    /**
     * 验证是否该设备号有未完成的订单
     */

    Order.detailByDevCode(devCode, function(error, result) {
        if (error) {
            res.json({ result: 0, msg: '创建订单失败.\r\n' + error.message, data: {} });
        } else {
            var len = result.length;
            if (len > 0) {
                res.json({ result: 0, msg: '创建订单失败.\r\n 有未支付的订单,请扫描后重新下单。', data: {} });
            } else {
                Dev.detailByDevCode(devCode, function(error, result) {
                    if (error) {
                        res.json({ result: 0, msg: '创建订单失败.\r\n' + error.message, data: {} });
                    } else {
                        if (result) {

                            agentId = result.agentId;
                            hotelId = result.hotelId;

                            Hotel.detailById(hotelId, function(error, hotel) {
                                if (error) {
                                    res.json({ result: 0, msg: '创建订单失败.\r\n' + error.message, data: {} });
                                } else {
                                    if (hotel) {
                                        Order.save({
                                            movieName: movieName,
                                            agentId: agentId,
                                            hotelId: hotelId,
                                            movieKey: movieKey,
                                            realFee: realFee,
                                            devCode: devCode,
                                            addr: hotel.addr
                                        }, function(error, result) {
                                            if (error) {
                                                res.json({ result: 0, msg: '创建订单失败.', data: {} });
                                            } else {
                                                res.json({ result: 1, msg: '创建订单成功.', data: { result: result } });
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            res.json({ result: 0, msg: '创建订单失败.', data: {} });
                        }
                    }
                });
            }
        }
    });

}

exports.list = function(req, res, next) {
    var key = req.body.key || '';
    var pageNo = Number(req.body.pageNo);
    var pageSize = Number(req.body.pageSize);
    var st = req.body.st;
    var et = req.body.et;

    if (!/^[0-9]*$/.test(pageNo)) {
        res.json({ result: 0, msg: 'pageNo 参数格式不争取.', data: {} });
        return;
    }
    if (!/^[0-9]*$/.test(pageSize)) {
        res.json({ result: 0, msg: 'pageSize 参数格式不争取.', data: {} });
        return;
    }

    if (!st) {
        res.json({ result: 0, msg: '开始时间不可为空.', data: {} });
        return;
    }
    if (!et) {
        res.json({ result: 0, msg: '开始时间不可为空.', data: {} });
        return;
    }


    pageNo = Number(req.body.pageNo);
    pageSize = Number(req.body.pageSize);


    var agentId = req.body.agentId;
    var hotelId = req.body.hotelId;

    var session = req.session;
    if (!agentId && session && session.agentId) {
        agentId = [session.agentId];
    }
    if (!hotelId && session && session.hotelId) {
        hotelId = [session.hotelId];
    }
    Order.list(pageNo, pageSize, key, agentId, hotelId, st, et, function(error, result) {
        if (error) {
            res.json({ result: 0, msg: error.message, data: {} });
        } else {
            var totalItems = result.count;
            var list = result.rows;
            res.json({ result: 1, msg: '', data: { totalItems: totalItems, list: list } });
        }
    });
};

exports.tj = function(req, res, next) {
    var st = req.body.st;
    var et = req.body.et;

    var agentId = '';
    var hotelId = '';

    var session = req.session;
    if (session && session.agentId) {
        agentId = session.agentId;
    }
    if (session && session.hotelId) {
        hotelId = session.hotelId;
    }

    var agent = false;
    var hotel = false;
    var dev = false;

    if (!agentId && !hotelId) {
        agent = true;
        hotel = false;
        dev = false;
    }
    if (agentId) {
        agent = false;
        hotel = true;
        dev = false;
    }
    if (hotelId) {
        agent = false;
        hotel = false;
        dev = true;
    }

    Order.tj(agent, hotel, dev, st, et, agentId, hotelId, function(error, result) {
        if (error) {
            res.json({ result: 0, msg: error.message, data: {} });
        } else {
            res.json({ result: 1, msg: '', data: result });
        }
    });
};

exports.tjList = function(req, res, next) {
    var st = req.body.st;
    var et = req.body.et;

    var agentId = '';
    var hotelId = '';

    var session = req.session;
    if (session && session.agentId) {
        agentId = session.agentId;
    }
    if (session && session.hotelId) {
        hotelId = session.hotelId;
    }

    var agent = false;
    var hotel = false;
    var dev = false;

    if (!agentId && !hotelId) {
        agent = true;
        hotel = false;
        dev = false;
    }
    if (agentId) {
        agent = false;
        hotel = true;
        dev = false;
    }
    if (hotelId) {
        agent = false;
        hotel = false;
        dev = true;
    }

    Order.tjList(agent, hotel, dev, st, et, agentId, hotelId, function(error, result) {
        if (error) {
            res.json({ result: 0, msg: error.message, data: {} });
        } else {
            res.json({ result: 1, msg: '', data: result });
        }
    });
};

exports.detailByQrcode = function(req, res, next) {
    var qrcode = req.params.qrcode || '';
    if (qrcode) {
        Dev.detailByQrcode(qrcode, function(error, result) {
            if (error) {
                res.json({ result: 0, msg: '二维码无效', data: {} });
            } else {
                var len = result.length;
                if (len == 1) {
                    var devCode = result[0].devCode;
                    if (devCode) {
                        Order.detail(devCode, function(error, result) {
                            if (error) {
                                res.json({ result: 0, msg: error.message, data: {} });
                            } else {
                                if (result) {
                                    res.json({ result: 1, msg: '', data: result });
                                } else {
                                    res.json({ result: 0, msg: '', data: { } });
                                }
                            }
                        });
                    } else {
                        res.json({ result: 0, msg: '二维码无效', data: {} });
                    }
                } else {
                    res.json({ result: 0, msg: '二维码无效', data: {} });
                }
            }
        });
    } else {
        res.json({ result: 0, msg: '二维码无效', data: {} });
    }
};

exports.isplay = function(req, res, next) {
    var devcode = req.params.devcode || '';
    if (!devcode) {
        res.json({ result: 0, msg: '参数错误', data: {} });
    } else {
        Order.isplay(devcode, function(error, result) {
            if (error) {
                res.json({ result: 0, msg: error.message, data: {} });
            } else {
                var len = result.length;
                if (len == 0) {
                    res.json({ result: 1, msg: error.message, data: { isPlay: false } });
                } else {
                    res.json({ result: 1, msg: '', data: { isPlay: result.isplay } });
                }
            }
        });
    }
}
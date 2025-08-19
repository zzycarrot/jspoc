var express = require('express');
var redis = require('redis');
var router = express.Router();

// 创建Redis客户端
var client = redis.createClient();

function cacheUserProfile(username, profileData) {
    // SINK: 污染数据被直接存入缓存
    client.setex('user:' + username, 3600, JSON.stringify(profileData));
}

router.get('/profile', function(req, res) {
    var query = req.query;
    // SOURCE: 用户控制的输入
    var username = query.username;
    var profileData = query.profileData;
    
    // 将用户提供的数据直接存入缓存
    cacheUserProfile(username, profileData);
    
    client.get('user:' + username, function(err, reply) {
        if (err) {
            return res.status(500).send('Error');
        }
        res.send('Profile cached: ' + reply);
    });
});

// 另一个可能被污染的缓存示例
var memoryCache = {};

router.get('/config', function(req, res) {
    var query = req.query;
    // SOURCE: 用户控制的配置数据
    var configKey = query.key;
    var configValue = query.value;
    
    // SINK: 污染数据存入内存缓存
    memoryCache[configKey] = configValue;
    
    res.send('Config cached: ' + JSON.stringify(memoryCache));
});
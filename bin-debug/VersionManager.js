var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var VersionController = (function () {
    function VersionController() {
        var _this = this;
        // resource根路径
        this.resourceRoot = "resource/";
        // 版本控制的文件夹
        this.versionPath = "assets/";
        // 版本控制信息的所在路径,相对于resource文件夹
        this.versionConfigPath = "resource/version.json";
        //wxgame的当前版本号
        this.currentVersion = "1.0.7";
        /**
         * 处理wxgame里面的无效资源
         */
        this.versionCacheWxgame = function () {
            // 简单处理，通过localStorage获取当前游戏版本号resVersion，如果版本号不同，进行删除过期资源操作
            // 这里开发者可以自己控制版本号，不一定使用localStorage
            var localVersion = egret.localStorage.getItem("resVersion");
            if (localVersion != _this.currentVersion) {
                egret.localStorage.setItem("resVersion", _this.currentVersion);
                console.log("版本更新");
                //下面是wxgame提供的api，进行过期缓存资源的移除
                var fs_1 = wx.getFileSystemManager();
                // 如果是最新的微信支持库请修改file-util.js中localFileMap对应的存储路径，其他版本参照修改
                var dir_1 = wx.env.USER_DATA_PATH + "/cache_crc32/assets";
                fs_1.readdir({
                    dirPath: dir_1,
                    success: function (e) {
                        var result = _this.getRemoveList(e.files);
                        var length = result.length;
                        for (var i = 0; i < length; ++i) {
                            console.log("删除", dir_1 + "/" + result[i]);
                            fs_1.unlinkSync(dir_1 + "/" + result[i]);
                        }
                    },
                    fail: function (e) {
                        // console.log(e);
                    }
                });
            }
        };
        /**
        * 处理WebH5里面的更新，如果开发者有其他平台发布的版本控制，请参照这两种进行修改
        */
        this.versionCacheWeb = function () {
            // 简单处理，通过localStorage获取当前游戏版本号resVersion，如果版本号不同，进行删除过期资源操作
            // 这里开发者可以自己控制版本号，不一定使用localStorage
            var localVersion = egret.localStorage.getItem("resVersion");
            if (localVersion != _this.currentVersion) {
                egret.localStorage.setItem("resVersion", _this.currentVersion);
                console.log("Web版本更新");
            }
        };
    }
    // 在游戏开始加载资源的时候就会调用这个函数
    VersionController.prototype.init = function () {
        var _this = this;
        if (false) {
            return new Promise(function (resolve, reject) {
                //通过httpReques获得配置资源信息
                var request = new egret.HttpRequest();
                request.responseType = egret.HttpResponseType.TEXT;
                request.open(_this.versionConfigPath, egret.HttpMethod.GET);
                request.send();
                request.addEventListener(egret.Event.COMPLETE, function (event) {
                    var request = event.currentTarget;
                    egret.log("post data : ", request.response);
                    _this.versionConfig = JSON.parse(request.response);
                    //处理文件资源的缓存
                    // 下面主要是对各种运行时的版本控制，
                    if (egret.Capabilities.runtimeType == egret.RuntimeType.WXGAME) {
                        _this.versionCacheWxgame(); //微信小游戏
                    }
                    else if (egret.Capabilities.runtimeType == egret.RuntimeType.WEB) {
                        _this.versionCacheWeb(); //浏览器 H5
                    }
                    resolve();
                }, _this);
                request.addEventListener(egret.IOErrorEvent.IO_ERROR, function () {
                    egret.log("post error : " + event);
                    reject();
                }, _this);
            });
        }
        else {
            return Promise.resolve();
        }
    };
    /**
     * 获得上版本的过期资源列表，提高效率使用字符串的形式进行比对
     */
    VersionController.prototype.getRemoveList = function (files) {
        var result = [];
        var str = "";
        for (var key in this.versionConfig) {
            str += this.versionConfig[key] + ",";
        }
        var length = files.length;
        for (var i = 0; i < length; ++i) {
            var item = files[i];
            var crc32 = item.slice(0, item.indexOf("."));
            if (str.indexOf(crc32) == -1) {
                result.push(item);
            }
        }
        return result;
    };
    //在游戏运行时，每个资源加载url都要经过这个函数
    VersionController.prototype.getVirtualUrl = function (url) {
        // 在开发模式下，所有资源还是以原来的资源路径去加载，方便开发者替换资源
        if (false) {
            return this.getResUrlByVersion(url);
        }
        else {
            return url;
        }
    };
    /**
     * 获得版本控制之后的路径信息
     */
    VersionController.prototype.getResUrlByVersion = function (url) {
        //判断是否为版本控制的资源，其他域的资源，比如玩家头像，或是初始包体里面的资源以原始url加载
        if (url.indexOf(this.resourceRoot) == -1) {
            return url;
        }
        //将文件的resourceRoot路径抹去，进而判读文件是否经过版本管理
        url = url.replace(this.resourceRoot, "");
        if (this.versionConfig) {
            // 部分文件可能存在？v=加数字进行控制的形式，在引擎底层这里是不支持加v=的，只会以原始url加载路径，
            // 如果项目中存在类似的情况，将其还原成普通形式
            var index = url.indexOf("?v=");
            if (index != -1) {
                url = url.slice(0, index);
            }
            //取版本控制的的version
            var versionKey = url.replace(this.versionPath, "");
            if (this.versionConfig && this.versionConfig[versionKey]) {
                var version = this.versionConfig[versionKey];
                var ext = url.slice(url.lastIndexOf("."));
                // 原始的文件夹+crc32码+后缀扩展名
                url = this.versionPath + version + ext;
            }
        }
        url = this.resourceRoot + url;
        return url;
    };
    return VersionController;
}());
__reflect(VersionController.prototype, "VersionController", ["RES.IVersionController"]);
//在最开始将AssetsManager的默认版本控制替换掉
RES.registerVersionController(new VersionController());

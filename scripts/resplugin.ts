/**
 * 示例自定义插件，您可以查阅 http://developer.egret.com/cn/github/egret-docs/Engine2D/projectConfig/cmdExtensionPlugin/index.html
 * 了解如何开发一个自定义插件
 */
const crc32 = require("./crc32");
export class ResPlugin implements plugins.Command {

    // 版本控制信息
    private versionConfig = {};
    // 需要进行版本控制的文件夹
    private versionPath = "resource/assets/";
    // 版本信息保存路径,建议放入resource包里面，因为这个文件每次都需要加载，不需要放在cdn上。
    private versionConfigPath = "resource/version.json";
    constructor() {
    }

    async onFile(file: plugins.File) {
        //除去json可能存在的空格,如不需要，开发者可自行删除
        if (file.extname === ".json") {
            file.contents = new Buffer(JSON.stringify(JSON.parse(file.contents.toString())));
        }
        var path = file.origin;
        //对resource/assets下面的资源进行版本控制
        if (path.indexOf(this.versionPath) != -1 && (file.extname === ".mp3" || file.extname === ".fnt" || file.extname === ".json" || file.extname === ".png" || file.extname === ".jpg")) {
            path = path.replace(this.versionPath, "");
            this.versionConfig[path] = crc32(file.contents.toString());
            // 原始的文件夹+crc32码+后缀扩展名
            file.path = this.versionPath + this.versionConfig[path] + file.extname;
        }
        return file;
    }

    async onFinish(commandContext: plugins.CommandContext) {
        commandContext.createFile(this.versionConfigPath, new Buffer(JSON.stringify(this.versionConfig)));
    }
}

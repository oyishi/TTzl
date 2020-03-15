
//前置准备:
//1.你首先应该是知道如何防暂离，例如使用精华分解合成方法（通过鼠标宏或者其他软件）。
//2.在原来的循环流程上加入截图按键。
//3.重要！你需要把你的魔兽世界改成窗口显示，且分辨率设置成【800x600】，必须如此设置！！！！！
//4.配置好下面的内容之后，请保存退出，win用户可以双击start.bat来运行脚本。mac用户要使用终端，进入脚本目录输入"node index.js"来运行脚本。
//5.脚本发现掉线之后，会报警并停止运行，你需要重新运行本脚本。
//原理：
//本脚本的原理是自动扫描你魔兽世界截图文件夹最新的截图，如果发现截图里面有魔兽世界的LOGO，就证明掉线了，然后触发警报。
//报警就是打开一个网页开始播放音乐。或者给你手机发短信（需要你有阿里云服务，不适合一般用户）
//那么请配置下面两个内容


//请在下面填上你的魔兽世界的截图目录的地址，注意！是左斜杠 / 不是右斜杠
const wow_screenshot_dir = "G:/World of Warcraft/_classic_/Screenshots/"
//音乐的地址，如果你要换的话，请确保地址可以播放
const music_dir = "https://win-web-nf01-sycdn.kuwo.cn/5f726da35343691e4b9a87a06dbc6281/5e6ded3f/resource/n2/89/62/2995389531.mp3"


//如果你是小白用户，下面的两个内容千万不要乱填，就空着
//如果你有阿里云的短息您服务，在下面填上相应的KEY，可以实现给你自己指定的手机号发短信。
//如果你没有阿里云的短信服务，那么当游戏掉线的时候脚本会打开一个浏览器，播放一首海草海草给你。
//详情 https://help.aliyun.com/product/44282.html
const accessKeyId = ''
const secretAccessKey = ''




//如果你啥都不会下面的内容就不用看了。也别乱改

const Jimp = require("jimp");
const fs = require("fs");
const PNG = require("pngjs").PNG;
const SMSClient = require('@alicloud/sms-sdk');


let newest_pic_name = "";
function findNewestPic(){
	fs.readdir(wow_screenshot_dir, function(err, files){
		//对文件进行排序
		//console.log(files);
		let jpg_arr = [];
		for(var i=0;i<files.length;i++){
			if(files[i].indexOf(".jpg")>-1){
				jpg_arr.push(files[i]);
			}
		}
		jpg_arr.sort(function(val1, val2){
			//读取文件信息
			var stat1 = fs.statSync(wow_screenshot_dir + val1);
			var stat2 = fs.statSync(wow_screenshot_dir + val2);

		 	//根据时间从最新到最旧排序
		 	return stat2.mtime - stat1.mtime;
		});
		
		if(jpg_arr.length < 1){//如果截图文件夹下面没有图片,轮空等待下一次截图
			console.log("没有截图，等待截图");
			setTimeout(function(){
				findNewestPic();
			},2000);
		}else{
			newest_pic_name = jpg_arr[0];
		  	console.log("最新截图:" + newest_pic_name);
		  	cropPic();
		}
	});	
}


function cropPic(){
	Jimp.read(wow_screenshot_dir + newest_pic_name, function (err, image) {
	  	if (err) {
	    	console.log(err)
	  	} else {
	  		image.crop( 0, 0, 215, 103 ); 
	    	image.write("pics/target.png",function(){
				fs.unlinkSync(wow_screenshot_dir + newest_pic_name);
				console.log("裁剪完毕，删除截图");
	    		checkPic();
	    	});

	  	}
	})
}

function checkPic(){
	const pixelmatch = require('pixelmatch');
	const img1 = PNG.sync.read(fs.readFileSync('pics/logo.png'));
	const img2 = PNG.sync.read(fs.readFileSync('pics/target.png'));
	const {width, height} = img1;
	const diff = new PNG({width, height});
	const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, 215, 103, {threshold: 0.1});
	let sameprecent = 1-numDiffPixels/22145;
	console.log("一致率：" + (sameprecent)*100);
	if(sameprecent > 0.7){//一致率大于0.7证明掉线了
		console.log("发现掉线！");
		if(accessKeyId==''){
			playMusic();
		}else{
			sendMsg();
			sendMsg();
			sendMsg();
		}
	}else{//无事发生等待下一次检查
		setTimeout(function(){
			findNewestPic();
		},5000);
	}
}

function playMusic(){
	var c = require('child_process');
	c.exec('start ' + music_dir);
}

function sendMsg(text){
	text = "你号掉了！";
	let smsClient = new SMSClient({accessKeyId, secretAccessKey})
		smsClient.sendSMS({
		    PhoneNumbers: '18*********',
		    SignName: '*****',
		    TemplateCode: 'SMS_******',
		    TemplateParam: '{"status":"'+text+'"}'
		}).then(function (res) {
		    let {Code}=res
		    if (Code === 'OK') {
		        //处理返回参数
		        console.log("已发送通知短信！");
		    }
		}, function (err) {
		    console.log(err)
	})
}

findNewestPic();

return;

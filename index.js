/**
 * Created by jiulongchen on 2018/9/13 0013
 */
const cheerio = require('cheerio');
const http = require('https');

const iconv = require('iconv-lite');
const got = require('got');
const nodemailer = require('nodemailer');
const db = require('./connect');
const baseUrl = 'www.biquke.com/bq/0/990/';

let getInfoBySql = (title,url) =>{
    // console.log("response",title);
    if(title){
        let _sql = 'select * from chapterlist where title="'+title+'"';
        db.query(_sql,function (rows) {
            let _data = null;
            if(rows.length > 0){
                _data = rows[0];
                console.log(_data);
            }else {
                getNewestDetails(url);
                let _addSql = "insert into chapterlist (title,url) values ('"+title+"','"+url+"')";
                db.query(_addSql,(resp)=>{
                    // console.log("aaa");
                    console.log(resp);
                })
            }
        })
    }
};

function getDirectories() {

    (async () => {
        try {
            const response = await got(baseUrl);
            let $ = cheerio.load(response.body);
            let list = $("#list dl dd");
            let newest = list.eq(list.length-1).find("a");
            let _title = newest.text().trim();
            let _link = newest.attr("href");
            getInfoBySql(_title,_link);
        } catch (error) {
            console.log("err");
            console.log(error.response.body);
            //=> 'Internal server error ...'
        }
    })();
}
function getNewestDetails(url) {
    let _url = baseUrl+url;
    (async () => {
        try {
            const response = await got(_url);
            let $ = cheerio.load(response.body);
            let content = $("#content").text();
            let title = $(".bookname h1").text();
            sendEmail(title,content);

        } catch (error) {
            console.log("err");
            console.log(error.response.body);
            //=> 'Internal server error ...'
        }
    })();
}

function sendEmail(title,text) {
    console.log(title);
    let transporter = nodemailer.createTransport({
        host: 'smtp.163.email',
        service: '163', // 使用了内置传输发送邮件 查看支持列表：https://nodemailer.com/smtp/well-known/
        port: 465, // SMTP 端口
        secureConnection: true, // 使用了 SSL
        auth: {
            user: '15201934295@163.com',
            // 这里密码不是qq密码，是你设置的smtp授权码
            pass: 'xxxxxxxxxxx',
        }
    });

    let mailOptions = {
        from: '"凡人仙界篇" <15201934295@163.com>', // sender address
        to: '1038836483@qq.com', // list of receivers
        subject: title, // Subject line
        // 发送text或者html格式
        text: text, // plain text body
        // html: '<b>Hello world?</b>' // html body
    };

// send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Message sent: <04ec7731-cc68-1ef6-303c-61b0f796b78f@qq.com>
    });
}

let _time = 1000 * 60 *15; //每隔15分钟抓去一次
setInterval(getDirectories,_time);

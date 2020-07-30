//so luong tin
var amount = 5;
var wurl = {
    url: "https://api3.vnexpress.net/api/article?type=get_article_folder&cate_id=1003834&limit=" + amount + "&offset=0&option=video_autoplay,object,get_zone&app_id=9e304d",
};
$task.fetch(wurl).then(
    (response) => {
        var obj = JSON.parse(response.body);
        for (i = 0; i < amount; i++) {
            const updatetime = timeConverter(obj.data["1003834"][i].publish_time);
            const titled = obj.data["1003834"][i].title;
            const videoid = obj.data["1003834"][i].check_object.video;
            const data_lead = obj.data["1003834"][i].lead;
            const url_news = obj.data["1003834"][i].share_url;
            const notificationURL = {
                "open-url": url_news,
                "media-url": obj.data["1003834"][i].check_object.video_autoplay[videoid].size_format["240"]
            }
            if (needUpdate(url_news, updatetime)) {
                console.log(updatetime+"\n"+url_news);
                $notify("VN[E]XPRESS.NET" + "📆" + updatetime,
                    "📌" + titled, data_lead, notificationURL);
                $prefs.setValueForKey(updatetime, hash(url_news));
            }
        }
    },
    (reason) => {
        $notify("False!", "", reason.error);
    }
);
//xu ly time
function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}
function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + '/' + month + '/' + year + ' ' + addZero(hour) + ':' + addZero(min);
    return time;
}
//
function hash(str) {
    let h = 0,
        i,
        chr;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        h = (h << 5) - h + chr;
        h |= 0; // Convert to 32bit integer
    }
    return String(h);
}
//check new update
function needUpdate(url, timestamp) {
    const storedTimestamp = $prefs.valueForKey(hash(url));
    console.log(`Stored Timestamp for ${hash(url)}: ` + storedTimestamp);
    return storedTimestamp === undefined || storedTimestamp !== timestamp
        ? true
        : false;
}
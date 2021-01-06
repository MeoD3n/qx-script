// Whether to open the output
const verbose = true;
const url = $request.url;
let body = $response.body;

if (body.indexOf('$httpClient') !== -1 && body.indexOf('$task') !== -1) {
    // If already adapt for multi-platform, skip converting.
    $done({ body });
} else {
    const pattern = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/;
    const converter = "\/**** Start conversion script ****\/\r\nlet isQuantumultX=$task!=undefined;let isSurge=$httpClient!=undefined;let isLoon=isSurge&&typeof $loon!=undefined;var $task=isQuantumultX?$task:{};var $httpClient=isSurge?$httpClient:{};var $prefs=isQuantumultX?$prefs:{};var $persistentStore=isSurge?$persistentStore:{};var $notify=isQuantumultX?$notify:{};var $notification=isSurge?$notification:{};if(isQuantumultX){var errorInfo={error:\"\",};$httpClient={get:(url,cb)=>{var urlObj;if(typeof url==\"string\"){urlObj={url:url,}}else{urlObj=url}\r\n$task.fetch(urlObj).then((response)=>{cb(undefined,response,response.body)},(reason)=>{errorInfo.error=reason.error;cb(errorInfo,response,\"\")})},post:(url,cb)=>{var urlObj;if(typeof url==\"string\"){urlObj={url:url,}}else{urlObj=url}\r\nurl.method=\"POST\";$task.fetch(urlObj).then((response)=>{cb(undefined,response,response.body)},(reason)=>{errorInfo.error=reason.error;cb(errorInfo,response,\"\")})},}}\r\nif(isSurge){$task={fetch:(url)=>{return new Promise((resolve,reject)=>{if(url.method==\"POST\"){$httpClient.post(url,(error,response,data)=>{if(response){response.body=data;resolve(response,{error:error,})}else{resolve(null,{error:error,})}})}else{$httpClient.get(url,(error,response,data)=>{if(response){response.body=data;resolve(response,{error:error,})}else{resolve(null,{error:error,})}})}})},}}\r\nif(isQuantumultX){$persistentStore={read:(key)=>{return $prefs.valueForKey(key)},write:(val,key)=>{return $prefs.setValueForKey(val,key)},}}\r\nif(isSurge){$prefs={valueForKey:(key)=>{return $persistentStore.read(key)},setValueForKey:(val,key)=>{return $persistentStore.write(val,key)},}}\r\nif(isQuantumultX){$notify=((notify)=>{return function(title,subTitle,detail,url=undefined){detail=url===undefined?detail:`${detail}\\nClick the link to jump: ${url}`;notify(title,subTitle,detail)}})($notify);$notification={post:(title,subTitle,detail,url=undefined)=>{detail=url===undefined?detail:`${detail}\\nClick the link to jump: ${url}`;$notify(title,subTitle,detail)},}}\r\nif(isSurge&&!isLoon){$notification.post=((notify)=>{return function(title,subTitle,detail,url=undefined){detail=url===undefined?detail:`${detail}\\nClick the link to jump: ${url}`;notify.call($notification,title,subTitle,detail)}})($notification.post);$notify=(title,subTitle,detail,url=undefined)=>{detail=url===undefined?detail:`${detail}\\nClick the link to jump: ${url}`;$notification.post(title,subTitle,detail)}}\r\nif(isLoon){$notify=(title,subTitle,detail,url=undefined)=>{$notification.post(title,subTitle,detail,url)}}\r\n\/**** Conversion succeeded ****\/";

    let header = body.match(pattern)[0] + '\n\n' + converter;
    const converted = body.replace(pattern, header);

    $done({ body: converted });
    $notify("Script conversion successful! 🎉", "♻ Auto mode : Surge/Loon to Quantumult X", url)

}
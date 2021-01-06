﻿const token = "784a03feb07989d3339dfa41c7eb41777436cbfa";

const repositories = [
  {
    name: "nzw9314",
    url: "https://github.com/nzw9314/QuantumultX/tree/master",
  },
  {
    name: "Chavy",
    url: "https://github.com/chavyleung/scripts",
  },
  {
    name: "langkhach270389",
    url: "https://github.com/langkhach270389/Scripting/tree/master",
  },
  {
    name: "Peng-YM",
    url: "https://github.com/Peng-YM/QuanX",
  },
  {
    name: "Peng-YM",
    file_names: ["js-converter.js"],
    url: "https://github.com/Peng-YM/ScriptConverter/tree/master",
  },
  {
    name: "KOP-XIAO",
    file_names: ["Scripts/resource-parser.js"],
    url: "https://github.com/KOP-XIAO/QuantumultX",
  },
  {
    name: "phd051199",
    url: "https://github.com/phd91105/Scripts/tree/master",
  },
];

const $ = API("github", false);

const parser = {
  commits: new RegExp(
    /^https:\/\/github.com\/([\w|-]+)\/([\w|-]+)(\/tree\/([\w|-]+))?$/
  ),
  releases: new RegExp(/^https:\/\/github.com\/([\w|-]+)\/([\w|-]+)\/releases/),
};
const headers = {
  Authorization: `token ${token}`,
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.141 Safari/537.36",
};

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

function parserPath(path) {
  // console.log(path.split('/'))

  if (path.match(/\//) == undefined) {
    result = [];
    result.push(path);
    // console.log(result)
    return result;
  }
  return path.split("/");
}

function parseURL(url) {
  try {
    let repo = undefined;
    if (url.indexOf("releases") !== -1) {
      const results = url.match(parser.releases);
      repo = {
        type: "releases",
        owner: results[1],
        repo: results[2],
      };
    } else {
      const results = url.match(parser.commits);
      repo = {
        type: "commits",
        owner: results[1],
        repo: results[2],
        branch: results[3] === undefined ? "HEAD" : results[4],
      };
    }
    $.log(repo);
    return repo;
  } catch (error) {
    $.notify("Github monitor", "", `❌ URL ${url} Parsing error！`);
    throw error;
  }
}

function needUpdate(url, timestamp) {
  const storedTimestamp = $.read(hash(url));
  $.log(`Stored Timestamp for ${hash(url)}: ` + storedTimestamp);
  return storedTimestamp === undefined || storedTimestamp !== timestamp
    ? true
    : false;
}

async function checkUpdate(item) {
  const baseURL = "https://api.github.com";
  const { name, url } = item;
  try {
    const repository = parseURL(url);
    if (repository.type === "releases") {
      await $.get({
        url: `${baseURL}/repos/${repository.owner}/${repository.repo}/releases`,
        headers,
      })
        .then((response) => {
          const releases = JSON.parse(response.body);
          if (releases.length > 0) {
            // the first one is the latest release
            const release_name = releases[0].name;
            const author = releases[0].author.login;
            const { published_at, body } = releases[0];
            const notificationURL = {
              "open-url": `https://github.com/${repository.owner}/${repository.repo}/releases`,
              "media-url": `https://raw.githubusercontent.com/58xinian/icon/master/Github2.png`,
            };
            if (needUpdate(url, published_at)) {
              $.notify(
                `🎉🎉🎉 [${name}] New version released`,
                `📦 Version: ${release_name}`,
                `⏰ Posted on: ${formatTime(
                  published_at
                )}\n👨🏻‍💻 Publisher: ${author}\n📌 Release Notes: \n${body}`,
                notificationURL
              );
              $.write(published_at, hash(url));
            }
          }
        })
        .catch((e) => {
          $.error(e);
        });
    } else {
      const { author, body, published_at, file_url } = await $.get({
        url: `${baseURL}/repos/${repository.owner}/${repository.repo}/commits/${repository.branch}`,
        headers,
      })
        .then((response) => {
          const { commit } = JSON.parse(response.body);
          const author = commit.committer.name;
          const body = commit.message;
          const published_at = commit.committer.date;
          const file_url = commit.tree.url;
          return { author, body, published_at, file_url };
        })
        .catch((e) => {
          $.error(e);
        });
      $.log({ author, body, published_at, file_url });
      const notificationURL = {
        "open-url": `https://github.com/${repository.owner}/${repository.repo}/commits/${repository.branch}`,
        "media-url": `https://raw.githubusercontent.com/58xinian/icon/master/Github2.png`,
      };
      //Monitor the warehouse for updates
      if (!item.hasOwnProperty("file_names")) {
        if (needUpdate(url, published_at)) {
          $.notify(
            `🔰 [${name}] New commit`,
            "",
            `⏰ Submitted on: ${formatTime(
              published_at
            )}\n👨🏻‍💻 Publisher: ${author}\n📌 Release Notes: \n${body}`,
            notificationURL
          );
          // update stored timestamp
          $.write(published_at, hash(url));
        }
      }
      //Find out if specific files are updated
      else {
        const file_names = item.file_names;
        for (let i in file_names) {
          paths = parserPath(file_names[i]);
          $.log(paths);
          await findFile(name, file_url, paths, 0);
        }
      }
    }
  } catch (e) {
    $.error(`❌ Request error: ${e}`);
    return;
  }
  return;
}

function findFile(name, tree_url, paths, current_pos) {
  if (current_pos == paths.length) {
    $.notify(
      `🐬 [${name}]`,
      "",
      `🚫 There is no such file in the warehouse：${paths[paths.length - 1]}`
    );
  }
  $.get({
    url: tree_url,
    headers,
  }).then(
    (response) => {
      const file_detail = JSON.parse(response.body);
      // console.log(file_detail)
      const file_list = file_detail.tree;
      isFind = false;
      for (let i in file_list) {
        if (file_list[i].path == paths[current_pos]) {
          fileType = file_list[i].type;
          isDir = paths[current_pos].match(/\.js/) == null ? true : false;
          $.log(
            `🔍Judging：${paths[current_pos]} is a ${
            isDir ? "directory" : "file"
            }`
          );
          if (current_pos == paths.length - 1 && fileType == "blob" && !isDir) {
            isFind = true;
            let file_hash = file_list[i].sha;
            let last_sha = $.read(hash(name + paths[current_pos]));
            if (file_hash != last_sha) {
              $.notify(`🐬 [${name}]`, "", `📌 ${paths[current_pos]}Updated`);
              $.write(file_hash, hash(name + paths[current_pos]));
            }
            $.log(
              `🐬 ${
              paths[current_pos]
              }：\n\tlast sha: ${last_sha}\n\tlatest sha: ${file_hash}\n\t${
              file_hash == last_sha
                ? "✅Currently the latest"
                : "🔅need to be updated"
              }`
            );
          } else if (
            current_pos == paths.length - 1 &&
            fileType == "tree" &&
            isDir
          ) {
            isFind = true;
            let file_hash = file_list[i].sha;
            let last_sha = $.read(hash(name + paths[current_pos]));
            if (file_hash != last_sha) {
              $.notify(`🐬 [${name}]`, "", `📌 ${paths[current_pos]}Updated`);
              $.write(file_hash, hash(name + paths[current_pos]));
            }
            $.log(
              `🐬 ${
              paths[current_pos]
              }：\n\tlast sha: ${last_sha}\n\tlatest sha: ${file_hash}\n\t${
              file_hash == last_sha
                ? "✅Currently the latest"
                : "🔅need to be updated"
              }`
            );
          } else if (fileType == "tree") {
            isFind = true;
            tree_url = file_list[i].url;
            findFile(name, tree_url, paths, current_pos + 1);
          }
        }
      }
      if (isFind == false) {
        $.notify(
          `🐬 [${name}]`,
          "",
          `🚫 There is no such file in the warehouse：${
          paths[paths.length - 1]
          }\n🚫 Please check if your path is filled in correctly`
        );
      }
    },
    (error) => {
      console.log(error);
    }
  );
}

function addZero(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return `${date.getDate()}/${
    date.getMonth() + 1
    }/${date.getFullYear()} ${addZero(date.getHours())}:${addZero(
      date.getMinutes()
    )}`;
}

Promise.all(
  repositories.map(async (item) => await checkUpdate(item))
).finally(() => $.done());

// prettier-ignore
/*********************************** API *************************************/
function API(s = "untitled", t = !1) { return new class { constructor(s, t) { this.name = s, this.debug = t, this.isQX = "undefined" != typeof $task, this.isLoon = "undefined" != typeof $loon, this.isSurge = "undefined" != typeof $httpClient && !this.isLoon, this.isNode = "function" == typeof require, this.isJSBox = this.isNode && "undefined" != typeof $jsbox, this.node = (() => { if (this.isNode) { return { request: "undefined" != typeof $request ? void 0 : require("request"), fs: require("fs") } } return null })(), this.initCache(); Promise.prototype.delay = function (s) { return this.then(function (t) { return ((s, t) => new Promise(function (e) { setTimeout(e.bind(null, t), s) }))(s, t) }) } } get(s) { return this.isQX ? ("string" == typeof s && (s = { url: s, method: "GET" }), $task.fetch(s)) : new Promise((t, e) => { this.isLoon || this.isSurge ? $httpClient.get(s, (s, i, o) => { s ? e(s) : t({ status: i.status, headers: i.headers, body: o }) }) : this.node.request(s, (s, i, o) => { s ? e(s) : t({ ...i, status: i.statusCode, body: o }) }) }) } post(s) { return this.isQX ? ("string" == typeof s && (s = { url: s }), s.method = "POST", $task.fetch(s)) : new Promise((t, e) => { this.isLoon || this.isSurge ? $httpClient.post(s, (s, i, o) => { s ? e(s) : t({ status: i.status, headers: i.headers, body: o }) }) : this.node.request.post(s, (s, i, o) => { s ? e(s) : t({ ...i, status: i.statusCode, body: o }) }) }) } initCache() { if (this.isQX && (this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}")), (this.isLoon || this.isSurge) && (this.cache = JSON.parse($persistentStore.read(this.name) || "{}")), this.isNode) { let s = "root.json"; this.node.fs.existsSync(s) || this.node.fs.writeFileSync(s, JSON.stringify({}), { flag: "wx" }, s => console.log(s)), this.root = {}, s = `${this.name}.json`, this.node.fs.existsSync(s) ? this.cache = JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)) : (this.node.fs.writeFileSync(s, JSON.stringify({}), { flag: "wx" }, s => console.log(s)), this.cache = {}) } } persistCache() { const s = JSON.stringify(this.cache); this.isQX && $prefs.setValueForKey(s, this.name), (this.isLoon || this.isSurge) && $persistentStore.write(s, this.name), this.isNode && (this.node.fs.writeFileSync(`${this.name}.json`, s, { flag: "w" }, s => console.log(s)), this.node.fs.writeFileSync("root.json", JSON.stringify(this.root), { flag: "w" }, s => console.log(s))) } write(s, t) { this.log(`SET ${t}`), -1 !== t.indexOf("#") ? (t = t.substr(1), this.isSurge & this.isLoon && $persistentStore.write(s, t), this.isQX && $prefs.setValueForKey(s, t), this.isNode && (this.root[t] = s)) : this.cache[t] = s, this.persistCache() } read(s) { return this.log(`READ ${s}`), -1 === s.indexOf("#") ? this.cache[s] : (s = s.substr(1), this.isSurge & this.isLoon && $persistentStore.read(data, s), this.isQX ? $prefs.valueForKey(s) : this.isNode ? this.root[s] : void 0) } delete(s) { this.log(`DELETE ${s}`), delete this.cache[s], -1 !== s.indexOf("#") ? (s = s.substr(1), this.isSurge & this.isLoon && $persistentStore.write(null, s), this.isQX && $prefs.setValueForKey(null, s), this.isNode && delete this.root[s]) : this.cache[s] = data, this.persistCache() } notify(s, t = "", e = "", i = {}) { const o = i["open-url"], n = i["media-url"], r = e + (o ? `\n点击跳转: ${o}` : "") + (n ? `\n多媒体: ${n}` : ""); if (this.isQX && $notify(s, t, e, i), this.isSurge && $notification.post(s, t, r), this.isLoon && $notification.post(s, t, e, o), this.isNode) if (this.isJSBox) { require("push").schedule({ title: s, body: (t ? t + "\n" : "") + r }) } else console.log(`${s}\n${t}\n${r}\n\n`) } log(s) { this.debug && console.log(s) } info(s) { console.log(s) } error(s) { console.log("ERROR: " + s) } wait(s) { return new Promise(t => setTimeout(t, s)) } done(s = {}) { this.isQX || this.isLoon || this.isSurge ? $done(s) : this.isNode && !this.isJSBox && "undefined" != typeof $context && ($context.headers = s.headers, $context.statusCode = s.statusCode, $context.body = s.body) } }(s, t) }
/*****************************************************************************/

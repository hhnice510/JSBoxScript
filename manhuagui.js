/**
 * 漫画柜 (tw.manhuagui.com) JSBox 专属客户端 (全功能旗舰分类版)
 *
 * 核心功能：
 * 1. 首页发现：实时同步全网最新更新漫画，带封面、最新话数、更新时间
 * 2. 分类库（全新）：
 *    - 30+ 丰富题材：热血、冒险、魔幻、神鬼、搞笑、萌系、爱情、科幻、魔法、格斗、武侠、机战、竞技、体育、校园、生活、治愈、美食、推理、悬疑、恐怖、后宫、耽美、百合、黑道等
 *    - 多维复合筛选：地区（日本/港台/韩国/欧美/内地）、进度（连载/完结）、受众（少年/少女/青年）、排序（人气/更新/评分/最新）
 *    - 下拉刷新与触底无缝加载更多（无限滚动）
 * 3. 漫画详情页：卡片式封面、作者/年代/地区/状态/剧情分类、展开简介、正倒序排列章节、上次阅读标记
 * 4. 智能书架（我的收藏）：本地持久化收藏喜爱漫画，快速掌握最新进度，支持左滑管理
 * 5. 观看历史（阅读记录）：精确到“话”和“页码”，一键“继续阅读”，支持侧滑删除与清空
 * 6. 全能搜索：支持漫画名检索、纯数字 ID 直达、搜索历史快捷标签、分页上拉加载
 * 7. 原生旗舰阅读器：
 *    - 原生注入 Referer 防盗链请求头，彻底根治 403 阻断与黑屏
 *    - 【左右画廊翻页模式】（双指平滑无损放大缩放、双击缩放、页码跟随、历史页码恢复）
 *    - 【上下条漫滚动模式】（一键即时无缝切换）
 *    - “上一话 / 下一话” 自由切换、话末后台智能预载与末页自动无缝进入下一话
 */

const BASE_URL = "https://tw.manhuagui.com";
const IMG_HOST = "https://i.hamreus.com";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// ================= 分类常量字典 =================

const GENRES = [
  { name: "全部", key: "" },
  { name: "热血", key: "rexue" },
  { name: "冒险", key: "maoxian" },
  { name: "魔幻", key: "mohuan" },
  { name: "神鬼", key: "shengui" },
  { name: "搞笑", key: "gaoxiao" },
  { name: "萌系", key: "mengxi" },
  { name: "爱情", key: "aiqing" },
  { name: "科幻", key: "kehuan" },
  { name: "魔法", key: "mofa" },
  { name: "格斗", key: "gedou" },
  { name: "武侠", key: "wuxia" },
  { name: "机战", key: "jizhan" },
  { name: "战争", key: "zhanzheng" },
  { name: "竞技", key: "jingji" },
  { name: "体育", key: "tiyu" },
  { name: "校园", key: "xiaoyuan" },
  { name: "生活", key: "shenghuo" },
  { name: "励志", key: "lizhi" },
  { name: "历史", key: "lishi" },
  { name: "治愈", key: "zhiyu" },
  { name: "美食", key: "meishi" },
  { name: "推理", key: "tuili" },
  { name: "悬疑", key: "xuanyi" },
  { name: "恐怖", key: "kongbu" },
  { name: "四格", key: "sige" },
  { name: "职场", key: "zhichang" },
  { name: "侦探", key: "zhentan" },
  { name: "后宫", key: "hougong" },
  { name: "耽美", key: "danmei" },
  { name: "百合", key: "baihe" },
  { name: "黑道", key: "heidao" }
];

const REGIONS = [
  { name: "全部地区", key: "" },
  { name: "日本", key: "japan" },
  { name: "港台", key: "hongkong" },
  { name: "韩国", key: "korea" },
  { name: "欧美", key: "europe" },
  { name: "内地", key: "china" }
];

const STATUSES = [
  { name: "全部进度", key: "" },
  { name: "连载中", key: "lianzai" },
  { name: "已完结", key: "wanjie" }
];

const AUDIENCES = [
  { name: "全部受众", key: "" },
  { name: "少年", key: "shaonian" },
  { name: "少女", key: "shaonv" },
  { name: "青年", key: "qingnian" },
  { name: "通用", key: "tongyong" }
];

const SORTS = [
  { name: "人气最旺", key: "view" },
  { name: "最新更新", key: "update" },
  { name: "评分最高", key: "rate" },
  { name: "最新发布", key: "index" }
];

// ================= 数据持久化管理 =================

const Storage = {
  KEY_FAVORITES: "mh_favorites_v2",
  KEY_HISTORY: "mh_history_v2",
  KEY_SEARCH: "mh_search_keywords_v2",
  KEY_GENRE_EXPANDED: "mh_genre_expanded_v2",

  isGenreExpanded: function () {
    return $cache.get(this.KEY_GENRE_EXPANDED) || false;
  },

  setGenreExpanded: function (expanded) {
    $cache.set(this.KEY_GENRE_EXPANDED, expanded);
  },

  getFavorites: function () {
    return $cache.get(this.KEY_FAVORITES) || [];
  },

  isFavorite: function (comicUrl) {
    let list = this.getFavorites();
    return list.some(item => item.url === comicUrl);
  },

  toggleFavorite: function (comic) {
    let list = this.getFavorites();
    let idx = list.findIndex(item => item.url === comic.url);
    let isFav = false;
    if (idx !== -1) {
      list.splice(idx, 1);
      isFav = false;
    } else {
      list.unshift({
        url: comic.url,
        title: comic.title,
        cover: comic.cover,
        latest: comic.latest || "",
        updateTime: Date.now()
      });
      isFav = true;
    }
    $cache.set(this.KEY_FAVORITES, list);
    return isFav;
  },

  removeFavorite: function (comicUrl) {
    let list = this.getFavorites();
    list = list.filter(item => item.url !== comicUrl);
    $cache.set(this.KEY_FAVORITES, list);
  },

  getHistory: function () {
    return $cache.get(this.KEY_HISTORY) || [];
  },

  getComicHistory: function (comicUrl) {
    let list = this.getHistory();
    return list.find(item => item.comicUrl === comicUrl) || null;
  },

  saveHistory: function (entry) {
    let list = this.getHistory();
    let idx = list.findIndex(item => item.comicUrl === entry.comicUrl);
    if (idx !== -1) {
      list.splice(idx, 1);
    }
    list.unshift({
      comicUrl: entry.comicUrl,
      comicTitle: entry.comicTitle,
      comicCover: entry.comicCover,
      chapterTitle: entry.chapterTitle,
      chapterUrl: entry.chapterUrl,
      chapterIndex: entry.chapterIndex,
      page: entry.page || 1,
      totalPages: entry.totalPages || 1,
      timestamp: Date.now()
    });
    if (list.length > 80) list = list.slice(0, 80);
    $cache.set(this.KEY_HISTORY, list);
  },

  removeHistory: function (comicUrl) {
    let list = this.getHistory();
    list = list.filter(item => item.comicUrl !== comicUrl);
    $cache.set(this.KEY_HISTORY, list);
  },

  clearHistory: function () {
    $cache.remove(this.KEY_HISTORY);
  },

  getSearchHistory: function () {
    return $cache.get(this.KEY_SEARCH) || [];
  },

  addSearchHistory: function (kw) {
    if (!kw) return;
    let list = this.getSearchHistory().filter(item => item !== kw);
    list.unshift(kw);
    if (list.length > 20) list = list.slice(0, 20);
    $cache.set(this.KEY_SEARCH, list);
  },

  clearSearchHistory: function () {
    $cache.remove(this.KEY_SEARCH);
  }
};

function formatTime(timestamp) {
  if (!timestamp) return "";
  let diff = Date.now() - timestamp;
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return Math.floor(diff / 60000) + "分钟前";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "小时前";
  let d = new Date(timestamp);
  return `${d.getMonth() + 1}-${d.getDate()}`;
}

// ================= 内置 LZString 解密核心 =================

const LZString = (function () {
  var f = String.fromCharCode;
  var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var baseReverseDic = {};
  function getBaseValue(alphabet, character) {
    if (!baseReverseDic[alphabet]) {
      baseReverseDic[alphabet] = {};
      for (var i = 0; i < alphabet.length; i++) {
        baseReverseDic[alphabet][alphabet.charAt(i)] = i;
      }
    }
    return baseReverseDic[alphabet][character];
  }
  return {
    decompressFromBase64: function (input) {
      if (input == null) return "";
      if (input == "") return null;
      return this._decompress(input.length, 32, function (index) {
        return getBaseValue(keyStrBase64, input.charAt(index));
      });
    },
    _decompress: function (length, resetValue, getNextValue) {
      var dictionary = [], next, enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = [], i, w, bits, resb, maxpower, power, c, data = { val: getNextValue(0), position: resetValue, index: 1 };
      for (i = 0; i < 3; i += 1) dictionary[i] = i;
      bits = 0; maxpower = Math.pow(2, 2); power = 1;
      while (power != maxpower) {
        resb = data.val & data.position; data.position >>= 1;
        if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
        bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
      }
      switch (next = bits) {
        case 0: bits = 0; maxpower = Math.pow(2, 8); power = 1;
          while (power != maxpower) {
            resb = data.val & data.position; data.position >>= 1;
            if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
            bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
          }
          c = f(bits); break;
        case 1: bits = 0; maxpower = Math.pow(2, 16); power = 1;
          while (power != maxpower) {
            resb = data.val & data.position; data.position >>= 1;
            if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
            bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
          }
          c = f(bits); break;
        case 2: return "";
      }
      dictionary[3] = c; w = c; result.push(c);
      while (true) {
        if (data.index > length) return "";
        bits = 0; maxpower = Math.pow(2, numBits); power = 1;
        while (power != maxpower) {
          resb = data.val & data.position; data.position >>= 1;
          if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
          bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
        }
        switch (c = bits) {
          case 0: bits = 0; maxpower = Math.pow(2, 8); power = 1;
            while (power != maxpower) {
              resb = data.val & data.position; data.position >>= 1;
              if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
              bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
            }
            dictionary[dictSize++] = f(bits); c = dictSize - 1; enlargeIn--; break;
          case 1: bits = 0; maxpower = Math.pow(2, 16); power = 1;
            while (power != maxpower) {
              resb = data.val & data.position; data.position >>= 1;
              if (data.position == 0) { data.position = resetValue; data.val = getNextValue(data.index++); }
              bits |= (resb > 0 ? 1 : 0) * power; power <<= 1;
            }
            dictionary[dictSize++] = f(bits); c = dictSize - 1; enlargeIn--; break;
          case 2: return result.join('');
        }
        if (enlargeIn == 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
        if (dictionary[c]) { entry = dictionary[c]; } else { if (c === dictSize) { entry = w + w.charAt(0); } else { return null; } }
        result.push(entry);
        dictionary[dictSize++] = w + entry.charAt(0);
        enlargeIn--;
        w = entry;
        if (enlargeIn == 0) { enlargeIn = Math.pow(2, numBits); numBits++; }
      }
    }
  };
})();

String.prototype.splic = function (f) {
  return LZString.decompressFromBase64(this.toString()).split(f);
};

// ================= 网络数据解析模块 =================

function parseUpdatesHtml(html) {
  let items = [];
  let reg = /<li>\s*<a class="cover" href="(\/comic\/\d+\/)" title="([^"]+)">\s*<img (?:data-src|src)="([^"]+)"[^>]*>[\s\S]*?<span class="tt">([^<]+)<\/span>[\s\S]*?<span class="dt"><em>([^<]+)<\/em><\/span>\s*<\/li>/g;
  let m;
  while ((m = reg.exec(html)) !== null) {
    let cover = m[3];
    if (cover.startsWith("//")) cover = "https:" + cover;
    items.push({
      url: BASE_URL + m[1],
      title: m[2].trim(),
      cover: cover,
      latest: m[4].trim(),
      date: m[5].trim()
    });
  }
  return items;
}

function parseCategoryHtml(html) {
  let items = [];
  let reg = /<li>\s*<a class="bcover" href="(\/comic\/\d+\/)" title="([^"]+)">\s*<img (?:data-src|src)="([^"]+)"[^>]*>[\s\S]*?<span class="tt">([^<]+)<\/span>[\s\S]*?<p class="ell"><a[^>]*>[^<]+<\/a><\/p>\s*<span class="updateon">([^<]+)<em>([^<]+)<\/em><\/span>\s*<\/li>/g;
  let m;
  while ((m = reg.exec(html)) !== null) {
    let cover = m[3];
    if (cover.startsWith("//")) cover = "https:" + cover;
    items.push({
      url: BASE_URL + m[1],
      title: m[2].trim(),
      cover: cover,
      latest: m[4].trim(),
      updateon: m[5].replace("更新于：", "").trim(),
      score: m[6].trim()
    });
  }
  return items;
}

function parseSearchHtml(html) {
  let results = [];
  let blocks = html.split(/<li class="cf">|<div class="book-result[^>]*>/).slice(1);
  for (let block of blocks) {
    let aMatch = block.match(/<dt>\s*<a\s+[^>]*href="(\/comic\/\d+\/)"[^>]*>/i);
    let titleMatch = block.match(/<dt>\s*<a\s+[^>]*title="([^"]+)"[^>]*>/i);
    if (!aMatch || !titleMatch) continue;

    let imgMatch = block.match(/<img[^>]+(?:data-src|src)="([^"]+)"/i);
    let statusMatch = block.match(/<span class="tt">([^<]+)<\/span>/i);
    let authorMatch = block.match(/作者[：:][\s\S]*?<a[^>]*>([^<]+)<\/a>/i);

    let cover = imgMatch ? imgMatch[1] : "";
    if (cover.startsWith("//")) cover = "https:" + cover;

    results.push({
      title: titleMatch[1].trim(),
      url: BASE_URL + aMatch[1],
      cover: cover,
      sub: [
        statusMatch ? statusMatch[1].trim() : "",
        authorMatch ? `作者: ${authorMatch[1].trim()}` : ""
      ].filter(Boolean).join(" | ")
    });
  }
  return results;
}

function parseComicDetail(html, comicUrl) {
  let titleMatch = html.match(/<h1>([^<]+)<\/h1>/);
  let subTitleMatch = html.match(/class="book-title">[\s\S]*?<h2>([^<]+)<\/h2>/i);
  let coverMatch = html.match(/class="hcover">\s*<img\s+src="([^"]+)"/i) || html.match(/<div class="book-cover[^>]*>[\s\S]*?<img\s+src="([^"]+)"/i);
  let statusMatch = html.match(/漫畫狀態：<\/strong><span[^>]*>([^<]+)<\/span>/);
  let yearMatch = html.match(/出品年代：<\/strong><a[^>]*>([^<]+)<\/a>/);
  let regionMatch = html.match(/漫畫地區：<\/strong><a[^>]*>([^<]+)<\/a>/);
  let genreMatch = html.match(/漫畫劇情：<\/strong><a[^>]*>([^<]+)<\/a>/);
  let authorMatch = html.match(/漫畫作者：<\/strong><a[^>]*>([^<]+)<\/a>/);
  let latestMatch = html.match(/更新至\s*\[\s*<a[^>]*>([^<]+)<\/a>\s*\]/);
  let introMatch = html.match(/<div id="intro-all"[^>]*>([\s\S]*?)<\/div>/) || html.match(/<div id="intro-cut"[^>]*>([\s\S]*?)<\/div>/);

  let cover = coverMatch ? coverMatch[1] : "";
  if (cover.startsWith("//")) cover = "https:" + cover;

  let sections = parseChapters(html);

  return {
    url: comicUrl,
    title: titleMatch ? titleMatch[1].trim() : "未知漫画",
    subTitle: subTitleMatch ? subTitleMatch[1].trim() : "",
    cover: cover,
    status: statusMatch ? statusMatch[1].trim() : "连载中",
    year: yearMatch ? yearMatch[1].trim() : "",
    region: regionMatch ? regionMatch[1].trim() : "",
    genre: genreMatch ? genreMatch[1].trim() : "",
    author: authorMatch ? authorMatch[1].trim() : "佚名",
    latest: latestMatch ? latestMatch[1].trim() : "",
    intro: introMatch ? introMatch[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&hellip;/g, "…").trim() : "暂无简介",
    sections: sections
  };
}

function parseChapters(html) {
  let fullHtml = html;
  let vsMatch = fullHtml.match(/id="__VIEWSTATE"\s+value="([^"]+)"/);
  if (vsMatch && vsMatch[1]) {
    try {
      let decompressed = LZString.decompressFromBase64(vsMatch[1]);
      if (decompressed && (decompressed.includes("chapter-list") || decompressed.includes("href="))) {
        // 直接将解密后的章节内容替换到 __VIEWSTATE 隐藏域位置（位于 class="chapter" 内、id="Comment" 之前）
        fullHtml = fullHtml.replace(vsMatch[0], decompressed);
      }
    } catch (e) {
      console.error("解密 __VIEWSTATE 失败:", e);
    }
  }

  let startIdx = fullHtml.indexOf('class="chapter');
  let endIdx = fullHtml.indexOf('id="Comment"');
  let chapterArea = "";
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    chapterArea = fullHtml.substring(startIdx, endIdx);
  } else if (startIdx !== -1) {
    chapterArea = fullHtml.substring(startIdx);
  } else {
    chapterArea = fullHtml;
  }

  let sections = [];
  let h4Reg = /<h4><span>([^<]+)<\/span><\/h4>/g;
  let titles = [];
  let m;
  while ((m = h4Reg.exec(chapterArea)) !== null) {
    titles.push(m[1].trim());
  }

  let divParts = chapterArea.split(/<div class="chapter-list[^>]*>/).slice(1);

  divParts.forEach((part, idx) => {
    let sectionTitle = titles[idx] || (divParts.length === 1 ? "章节列表" : `章节分组 ${idx + 1}`);
    let divContent = part.split('</div>')[0];

    let ulReg = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
    let ulMatch;
    let chapters = [];

    while ((ulMatch = ulReg.exec(divContent)) !== null) {
      let ulHtml = ulMatch[1];
      let aReg = /<a\s+([^>]*href="\/comic\/\d+\/\d+\.html"[^>]*)>([\s\S]*?)<\/a>/gi;
      let aMatch;
      let group = [];
      while ((aMatch = aReg.exec(ulHtml)) !== null) {
        let attrs = aMatch[1];
        let inner = aMatch[2];
        let hrefMatch = attrs.match(/href="(\/comic\/\d+\/\d+\.html)"/);
        let titleMatch = attrs.match(/title="([^"]+)"/);
        let pageMatch = inner.match(/<i>([^<]+)<\/i>/);

        let href = hrefMatch ? hrefMatch[1] : "";
        let title = titleMatch ? titleMatch[1].trim() : "章节";
        let pageCount = pageMatch ? pageMatch[1].trim() : "";

        if (href) {
          group.push({
            title: title,
            pageCount: pageCount,
            displayTitle: pageCount ? `${title} (${pageCount})` : title,
            url: BASE_URL + href
          });
        }
      }
      group.reverse();
      chapters = chapters.concat(group);
    }

    if (chapters.length > 0) {
      sections.push({
        title: `${sectionTitle} (共 ${chapters.length} 话)`,
        rawTitle: sectionTitle,
        rows: chapters
      });
    }
  });

  return sections;
}

function decryptImgData(html) {
  let scriptMatch = html.match(/window\["\\x65\\x76\\x61\\x6c"\]\((function\(p,a,c,k,e,d\)[\s\S]*?)\)\s*<\/script>/);
  if (!scriptMatch) {
    scriptMatch = html.match(/eval\((function\(p,a,c,k,e,d\)[\s\S]*?)\)\s*<\/script>/);
  }
  if (!scriptMatch) return null;

  let capturedData = null;
  const SMH = {
    imgData: function (data) {
      capturedData = data;
      return { preInit: function () { } };
    }
  };

  try {
    let unpackedCode = eval("(" + scriptMatch[1] + ")");
    eval(unpackedCode);
  } catch (e) {
    console.error("解密失败:", e);
  }
  return capturedData;
}

// ================= 主界面架构 (Tab 导航系统) =================

let updateList = [];
let isFetchingUpdates = false;

// 分类库状态
let currentCategoryFilter = {
  genre: "",
  region: "",
  status: "",
  audience: "",
  sort: "view",
  page: 1
};
let categoryComics = [];
let isFetchingCategory = false;
let hasMoreCategory = true;
let isGenreExpanded = Storage.isGenreExpanded();

function buildCategoryUrl(filter) {
  let tags = [];
  if (filter.region) tags.push(filter.region);
  if (filter.genre) tags.push(filter.genre);
  if (filter.status) tags.push(filter.status);
  if (filter.audience) tags.push(filter.audience);

  let prefix = tags.length > 0 ? tags.join("_") : "";
  let sortKey = filter.sort || "view";
  let sortFile = sortKey;
  if (filter.page && filter.page > 1) {
    sortFile = `${sortKey}_p${filter.page}`;
  }
  sortFile = `${sortFile}.html`;

  if (prefix) {
    return `${BASE_URL}/list/${prefix}/${sortFile}`;
  } else {
    return `${BASE_URL}/list/${sortFile}`;
  }
}

function getGenreGridItemSize() {
  let screenWidth = ($device && $device.info && $device.info.screen && $device.info.screen.width) || 375;
  let availableWidth = screenWidth - 24;
  let cols = screenWidth > 500 ? Math.floor(availableWidth / 74) : 5;
  let itemWidth = Math.floor((availableWidth - (cols - 1) * 6) / cols);
  return $size(Math.max(itemWidth, 60), 30);
}

function renderMainUI() {
  $ui.render({
    props: {
      title: "漫画柜",
      navButtons: [
        {
          title: "搜索",
          symbol: "magnifyingglass",
          handler: () => openSearchPage()
        }
      ]
    },
    views: [
      {
        type: "tab",
        props: {
          id: "mainTab",
          items: ["最新更新", "分类库", "我的收藏", "阅读历史"],
          index: 0
        },
        layout: (make, view) => {
          make.top.inset(8);
          make.left.right.inset(16);
          make.height.equalTo(32);
        },
        events: {
          changed: sender => {
            switchMainTab(sender.index);
          }
        }
      },
      // 1. 最新更新列表视图
      {
        type: "list",
        props: {
          id: "listUpdates",
          rowHeight: 96,
          pullToRefresh: true,
          template: {
            views: [
              {
                type: "image",
                props: {
                  id: "imgCover",
                  radius: 6,
                  bgcolor: $color("#f0f0f0"),
                  contentMode: $contentMode.scaleAspectFill
                },
                layout: make => {
                  make.left.inset(14);
                  make.top.bottom.inset(8);
                  make.width.equalTo(60);
                }
              },
              {
                type: "label",
                props: {
                  id: "lblTitle",
                  font: $font("bold", 15),
                  textColor: $color("#111111"),
                  lines: 1
                },
                layout: (make, view) => {
                  make.left.equalTo($("imgCover").right).offset(12);
                  make.right.inset(14);
                  make.top.inset(16);
                }
              },
              {
                type: "label",
                props: {
                  id: "lblLatest",
                  font: $font(13),
                  textColor: $color("#e74c3c"),
                  lines: 1
                },
                layout: (make, view) => {
                  make.left.equalTo($("imgCover").right).offset(12);
                  make.right.inset(14);
                  make.top.equalTo($("lblTitle").bottom).offset(6);
                }
              },
              {
                type: "label",
                props: {
                  id: "lblDate",
                  font: $font(12),
                  textColor: $color("#888888"),
                  lines: 1
                },
                layout: (make, view) => {
                  make.left.equalTo($("imgCover").right).offset(12);
                  make.right.inset(14);
                  make.top.equalTo($("lblLatest").bottom).offset(6);
                }
              }
            ]
          }
        },
        layout: (make, view) => {
          make.top.equalTo($("mainTab").bottom).offset(8);
          make.left.right.bottom.equalTo(0);
        },
        events: {
          didSelect: (sender, indexPath) => {
            let item = updateList[indexPath.row];
            if (item) openComicDetail(item.url, item.title, item.cover);
          },
          pulled: sender => {
            fetchUpdates(() => sender.endRefreshing());
          },
          didPullRefresh: sender => {
            fetchUpdates(() => sender.endRefreshing());
          }
        }
      },
      // 2. 分类库容器视图
      {
        type: "view",
        props: {
          id: "viewCategory",
          hidden: true
        },
        layout: (make, view) => {
          make.top.equalTo($("mainTab").bottom).offset(8);
          make.left.right.bottom.equalTo(0);
        },
        views: [
          // 2.1 题材选择区域 (支持单行横滑胶囊与多行网格折叠展开)
          {
            type: "view",
            props: {
              id: "genreSection"
            },
            layout: make => {
              make.top.inset(0);
              make.left.right.inset(12);
              make.height.equalTo(isGenreExpanded ? 280 : 34);
            },
            views: [
              // 2.1.1 收起状态视图：横向滑动胶囊 + 展开按钮
              {
                type: "view",
                props: {
                  id: "genreCollapsedView",
                  hidden: isGenreExpanded
                },
                layout: $layout.fill,
                views: [
                  {
                    type: "matrix",
                    props: {
                      id: "matrixGenres",
                      direction: $scrollDirection.horizontal,
                      showsHorizontalScrollIndicator: false,
                      itemSize: $size(68, 30),
                      spacing: 8,
                      template: {
                        views: [
                          {
                            type: "label",
                            props: {
                              id: "lblGenre",
                              font: $font(13),
                              align: $align.center,
                              radius: 15
                            },
                            layout: $layout.fill
                          }
                        ]
                      }
                    },
                    layout: (make, view) => {
                      make.left.top.bottom.inset(0);
                      make.right.inset(56);
                    },
                    events: {
                      didSelect: (sender, indexPath) => {
                        onSelectGenre(indexPath.item);
                      }
                    }
                  },
                  {
                    type: "button",
                    props: {
                      id: "btnExpandGenre",
                      title: "展开 ▾",
                      font: $font(12),
                      titleColor: $color("#555555"),
                      bgcolor: $color("#f2f2f7"),
                      radius: 15
                    },
                    layout: make => {
                      make.right.inset(0);
                      make.top.inset(2);
                      make.width.equalTo(50);
                      make.height.equalTo(30);
                    },
                    events: {
                      tapped: () => toggleGenreExpand(true)
                    }
                  }
                ]
              },
              // 2.1.2 展开状态视图：顶部标题与收起按钮 + 5列多行自适应网格
              {
                type: "view",
                props: {
                  id: "genreExpandedView",
                  hidden: !isGenreExpanded
                },
                layout: $layout.fill,
                views: [
                  {
                    type: "view",
                    props: {
                      id: "genreExpandedHeader"
                    },
                    layout: make => {
                      make.top.left.right.inset(0);
                      make.height.equalTo(26);
                    },
                    views: [
                      {
                        type: "label",
                        props: {
                          id: "lblGenreExpandedTitle",
                          text: "全部题材分类 (32)",
                          font: $font("bold", 12),
                          textColor: $color("#888888")
                        },
                        layout: make => {
                          make.left.centerY.inset(0);
                        }
                      },
                      {
                        type: "button",
                        props: {
                          id: "btnCollapseGenre",
                          title: "收起 ▴",
                          font: $font(12),
                          titleColor: $color("#e74c3c"),
                          bgcolor: $color("#fdedec"),
                          radius: 13
                        },
                        layout: make => {
                          make.right.centerY.inset(0);
                          make.width.equalTo(52);
                          make.height.equalTo(26);
                        },
                        events: {
                          tapped: () => toggleGenreExpand(false)
                        }
                      }
                    ]
                  },
                  {
                    type: "matrix",
                    props: {
                      id: "matrixGenresGrid",
                      spacing: 6,
                      itemSize: getGenreGridItemSize(),
                      showsVerticalScrollIndicator: false,
                      template: {
                        views: [
                          {
                            type: "label",
                            props: {
                              id: "lblGenre",
                              font: $font(13),
                              align: $align.center,
                              radius: 15
                            },
                            layout: $layout.fill
                          }
                        ]
                      }
                    },
                    layout: (make, view) => {
                      make.top.equalTo($("genreExpandedHeader").bottom).offset(6);
                      make.left.right.bottom.inset(0);
                    },
                    events: {
                      didSelect: (sender, indexPath) => {
                        onSelectGenre(indexPath.item);
                      }
                    }
                  }
                ]
              }
            ]
          },
          // 2.2 维度筛选快捷栏 (地区/进度/受众/排序)
          {
            type: "view",
            props: {
              id: "categoryFilterBar"
            },
            layout: (make, view) => {
              make.top.equalTo($("genreSection").bottom).offset(6);
              make.left.right.inset(12);
              make.height.equalTo(30);
            },
            views: [
              {
                type: "button",
                props: {
                  id: "btnRegionFilter",
                  title: "全部地区 ▾",
                  font: $font(12),
                  titleColor: $color("#444444"),
                  bgcolor: $color("#f2f2f7"),
                  radius: 4
                },
                layout: (make, view) => {
                  make.left.top.bottom.inset(0);
                  make.width.equalTo(view.super).dividedBy(4).offset(-4);
                },
                events: {
                  tapped: () => selectRegionFilter()
                }
              },
              {
                type: "button",
                props: {
                  id: "btnStatusFilter",
                  title: "全部进度 ▾",
                  font: $font(12),
                  titleColor: $color("#444444"),
                  bgcolor: $color("#f2f2f7"),
                  radius: 4
                },
                layout: (make, view) => {
                  make.left.equalTo($("btnRegionFilter").right).offset(5);
                  make.top.bottom.inset(0);
                  make.width.equalTo(view.super).dividedBy(4).offset(-4);
                },
                events: {
                  tapped: () => selectStatusFilter()
                }
              },
              {
                type: "button",
                props: {
                  id: "btnAudienceFilter",
                  title: "全部受众 ▾",
                  font: $font(12),
                  titleColor: $color("#444444"),
                  bgcolor: $color("#f2f2f7"),
                  radius: 4
                },
                layout: (make, view) => {
                  make.left.equalTo($("btnStatusFilter").right).offset(5);
                  make.top.bottom.inset(0);
                  make.width.equalTo(view.super).dividedBy(4).offset(-4);
                },
                events: {
                  tapped: () => selectAudienceFilter()
                }
              },
              {
                type: "button",
                props: {
                  id: "btnSortFilter",
                  title: "人气最旺 ▾",
                  font: $font(12),
                  titleColor: $color("#e74c3c"),
                  bgcolor: $color("#f2f2f7"),
                  radius: 4
                },
                layout: (make, view) => {
                  make.left.equalTo($("btnAudienceFilter").right).offset(5);
                  make.top.bottom.inset(0);
                  make.right.inset(0);
                },
                events: {
                  tapped: () => selectSortFilter()
                }
              }
            ]
          },
          // 2.3 分类漫画列表
          {
            type: "list",
            props: {
              id: "listCategory",
              rowHeight: 96,
              pullToRefresh: true,
              template: {
                views: [
                  {
                    type: "image",
                    props: {
                      id: "imgCatCover",
                      radius: 6,
                      bgcolor: $color("#f0f0f0"),
                      contentMode: $contentMode.scaleAspectFill
                    },
                    layout: make => {
                      make.left.inset(14);
                      make.top.bottom.inset(8);
                      make.width.equalTo(60);
                    }
                  },
                  {
                    type: "label",
                    props: {
                      id: "lblCatTitle",
                      font: $font("bold", 15),
                      textColor: $color("#111111"),
                      lines: 1
                    },
                    layout: (make, view) => {
                      make.left.equalTo($("imgCatCover").right).offset(12);
                      make.right.inset(14);
                      make.top.inset(16);
                    }
                  },
                  {
                    type: "label",
                    props: {
                      id: "lblCatLatest",
                      font: $font(13),
                      textColor: $color("#e74c3c"),
                      lines: 1
                    },
                    layout: (make, view) => {
                      make.left.equalTo($("imgCatCover").right).offset(12);
                      make.right.inset(14);
                      make.top.equalTo($("lblCatTitle").bottom).offset(6);
                    }
                  },
                  {
                    type: "label",
                    props: {
                      id: "lblCatInfo",
                      font: $font(12),
                      textColor: $color("#888888"),
                      lines: 1
                    },
                    layout: (make, view) => {
                      make.left.equalTo($("imgCatCover").right).offset(12);
                      make.right.inset(14);
                      make.top.equalTo($("lblCatLatest").bottom).offset(6);
                    }
                  }
                ]
              }
            },
            layout: (make, view) => {
              make.top.equalTo($("categoryFilterBar").bottom).offset(6);
              make.left.right.bottom.equalTo(0);
            },
            events: {
              didSelect: (sender, indexPath) => {
                let item = categoryComics[indexPath.row];
                if (item) openComicDetail(item.url, item.title, item.cover);
              },
              pulled: sender => {
                fetchCategoryComics(false, () => sender.endRefreshing());
              },
              didPullRefresh: sender => {
                fetchCategoryComics(false, () => sender.endRefreshing());
              },
              didReachBottom: sender => {
                sender.endFetchingMore();
                fetchCategoryComics(true);
              }
            }
          }
        ]
      },
      // 3. 我的收藏列表视图
      {
        type: "list",
        props: {
          id: "listFavorites",
          hidden: true,
          rowHeight: 90,
          pullToRefresh: true,
          template: {
            views: [
              {
                type: "image",
                props: {
                  id: "imgFavCover",
                  radius: 6,
                  bgcolor: $color("#f0f0f0"),
                  contentMode: $contentMode.scaleAspectFill
                },
                layout: make => {
                  make.left.inset(14);
                  make.top.bottom.inset(8);
                  make.width.equalTo(56);
                }
              },
              {
                type: "label",
                props: {
                  id: "lblFavTitle",
                  font: $font("bold", 15),
                  lines: 1
                },
                layout: (make, view) => {
                  make.left.equalTo($("imgFavCover").right).offset(12);
                  make.right.inset(14);
                  make.top.inset(18);
                }
              },
              {
                type: "label",
                props: {
                  id: "lblFavSub",
                  font: $font(13),
                  textColor: $color("#666666"),
                  lines: 1
                },
                layout: (make, view) => {
                  make.left.equalTo($("imgFavCover").right).offset(12);
                  make.right.inset(14);
                  make.top.equalTo($("lblFavTitle").bottom).offset(8);
                }
              }
            ]
          },
          actions: [
            {
              title: "取消收藏",
              color: $color("#e74c3c"),
              handler: (sender, indexPath) => {
                let favs = Storage.getFavorites();
                let item = favs[indexPath.row];
                if (item) {
                  Storage.removeFavorite(item.url);
                  $ui.toast("已取消收藏");
                  refreshFavoritesUI();
                }
              }
            }
          ]
        },
        layout: (make, view) => {
          make.top.equalTo($("mainTab").bottom).offset(8);
          make.left.right.bottom.equalTo(0);
        },
        events: {
          didSelect: (sender, indexPath) => {
            let favs = Storage.getFavorites();
            let item = favs[indexPath.row];
            if (item) openComicDetail(item.url, item.title, item.cover);
          },
          pulled: sender => {
            refreshFavoritesUI();
            sender.endRefreshing();
          },
          didPullRefresh: sender => {
            refreshFavoritesUI();
            sender.endRefreshing();
          }
        }
      },
      // 4. 观看历史列表视图
      {
        type: "list",
        props: {
          id: "listHistory",
          hidden: true,
          rowHeight: 92,
          pullToRefresh: true,
          template: {
            views: [
              {
                type: "image",
                props: {
                  id: "imgHistCover",
                  radius: 6,
                  bgcolor: $color("#f0f0f0"),
                  contentMode: $contentMode.scaleAspectFill
                },
                layout: make => {
                  make.left.inset(14);
                  make.top.bottom.inset(8);
                  make.width.equalTo(56);
                }
              },
              {
                type: "label",
                props: {
                  id: "lblHistTitle",
                  font: $font("bold", 15),
                  lines: 1
                },
                layout: (make, view) => {
                  make.left.equalTo($("imgHistCover").right).offset(12);
                  make.right.inset(80);
                  make.top.inset(16);
                }
              },
              {
                type: "label",
                props: {
                  id: "lblHistTime",
                  font: $font(12),
                  textColor: $color("#999999"),
                  align: $align.right
                },
                layout: (make, view) => {
                  make.right.inset(14);
                  make.top.inset(18);
                  make.width.equalTo(70);
                }
              },
              {
                type: "label",
                props: {
                  id: "lblHistProgress",
                  font: $font(13),
                  textColor: $color("#2980b9"),
                  lines: 1
                },
                layout: (make, view) => {
                  make.left.equalTo($("imgHistCover").right).offset(12);
                  make.right.inset(14);
                  make.top.equalTo($("lblHistTitle").bottom).offset(8);
                }
              }
            ]
          },
          actions: [
            {
              title: "删除",
              color: $color("#e74c3c"),
              handler: (sender, indexPath) => {
                let hists = Storage.getHistory();
                let item = hists[indexPath.row];
                if (item) {
                  Storage.removeHistory(item.comicUrl);
                  refreshHistoryUI();
                }
              }
            }
          ]
        },
        layout: (make, view) => {
          make.top.equalTo($("mainTab").bottom).offset(8);
          make.left.right.bottom.equalTo(0);
        },
        events: {
          didSelect: (sender, indexPath) => {
            let hists = Storage.getHistory();
            let item = hists[indexPath.row];
            if (!item) return;

            $ui.action({
              title: item.comicTitle,
              message: `上次读到：${item.chapterTitle} (第 ${item.page}/${item.totalPages} 页)`,
              actions: [
                {
                  title: "继续阅读",
                  handler: () => {
                    openReaderDirectly(item);
                  }
                },
                {
                  title: "漫画详情",
                  handler: () => {
                    openComicDetail(item.comicUrl, item.comicTitle, item.comicCover);
                  }
                },
                {
                  title: "取消",
                  style: "Cancel"
                }
              ]
            });
          },
          pulled: sender => {
            refreshHistoryUI();
            sender.endRefreshing();
          },
          didPullRefresh: sender => {
            refreshHistoryUI();
            sender.endRefreshing();
          }
        }
      }
    ]
  });

  fetchUpdates();
}

function switchMainTab(index) {
  $("listUpdates").hidden = index !== 0;
  $("viewCategory").hidden = index !== 1;
  $("listFavorites").hidden = index !== 2;
  $("listHistory").hidden = index !== 3;

  if (index === 0 && updateList.length === 0) {
    fetchUpdates();
  } else if (index === 1) {
    renderGenreMatrix();
    renderGenreGrid();
    if (!isGenreExpanded) {
      scrollGenreMatrixToSelected();
    }
    if (categoryComics.length === 0) {
      fetchCategoryComics(false);
    }
  } else if (index === 2) {
    refreshFavoritesUI();
  } else if (index === 3) {
    refreshHistoryUI();
  }
}

// ================= 更新列表数据流 =================

function fetchUpdates(finishCallback) {
  if (isFetchingUpdates) return;
  isFetchingUpdates = true;
  $ui.loading(true);

  $http.get({
    url: `${BASE_URL}/update/`,
    header: { "User-Agent": UA, "Cookie": "isAdult=1" },
    handler: resp => {
      isFetchingUpdates = false;
      $ui.loading(false);
      if (finishCallback) finishCallback();

      if (!resp.data) {
        $ui.toast("获取更新列表失败");
        return;
      }

      updateList = parseUpdatesHtml(resp.data);
      if ($("listUpdates")) {
        $("listUpdates").data = updateList.map(item => ({
          imgCover: {
            source: {
              url: item.cover,
              header: { "User-Agent": UA, "Referer": "https://tw.manhuagui.com/" }
            }
          },
          lblTitle: { text: item.title },
          lblLatest: { text: item.latest },
          lblDate: { text: `更新：${item.date}` }
        }));
      }
    }
  });
}

// ================= 分类库数据流与筛选 =================

function renderGenreMatrix() {
  if (!$("matrixGenres")) return;
  $("matrixGenres").data = GENRES.map(g => {
    let isSelected = currentCategoryFilter.genre === g.key;
    return {
      lblGenre: {
        text: g.name,
        bgcolor: isSelected ? $color("#e74c3c") : $color("#f2f2f7"),
        textColor: isSelected ? $color("#ffffff") : $color("#444444")
      }
    };
  });
}

function renderGenreGrid() {
  if (!$("matrixGenresGrid")) return;
  $("matrixGenresGrid").data = GENRES.map(g => {
    let isSelected = currentCategoryFilter.genre === g.key;
    return {
      lblGenre: {
        text: g.name,
        bgcolor: isSelected ? $color("#e74c3c") : $color("#f2f2f7"),
        textColor: isSelected ? $color("#ffffff") : $color("#444444")
      }
    };
  });
  if ($("lblGenreExpandedTitle")) {
    let activeGenre = GENRES.find(g => g.key === currentCategoryFilter.genre);
    $("lblGenreExpandedTitle").text = `全部题材分类 (当前: ${activeGenre ? activeGenre.name : "全部"})`;
  }
}

function onSelectGenre(itemIndex) {
  let g = GENRES[itemIndex];
  if (!g) return;
  if (currentCategoryFilter.genre !== g.key) {
    currentCategoryFilter.genre = g.key;
    renderGenreMatrix();
    renderGenreGrid();
    fetchCategoryComics(false);
  }
}

function scrollGenreMatrixToSelected() {
  let idx = GENRES.findIndex(g => g.key === currentCategoryFilter.genre);
  if (idx >= 0 && $("matrixGenres")) {
    try {
      $("matrixGenres").scrollTo({
        indexPath: $indexPath(0, idx),
        animated: true
      });
    } catch (e) { }
  }
}

function toggleGenreExpand(expand) {
  isGenreExpanded = expand !== undefined ? expand : !isGenreExpanded;
  Storage.setGenreExpanded(isGenreExpanded);

  if (isGenreExpanded) {
    $("genreCollapsedView").hidden = true;
    $("genreExpandedView").hidden = false;
    renderGenreGrid();
  } else {
    $("genreCollapsedView").hidden = false;
    $("genreExpandedView").hidden = true;
    renderGenreMatrix();
    scrollGenreMatrixToSelected();
  }

  $ui.animate({
    duration: 0.25,
    animation: () => {
      $("genreSection").remakeLayout(make => {
        make.top.inset(0);
        make.left.right.inset(12);
        make.height.equalTo(isGenreExpanded ? 280 : 34);
      });
      $("categoryFilterBar").remakeLayout((make, view) => {
        make.top.equalTo($("genreSection").bottom).offset(6);
        make.left.right.inset(12);
        make.height.equalTo(30);
      });
      $("listCategory").remakeLayout((make, view) => {
        make.top.equalTo($("categoryFilterBar").bottom).offset(6);
        make.left.right.bottom.equalTo(0);
      });
      $("viewCategory").relayout();
    }
  });
}

function updateCategoryListUI() {
  if (!$("listCategory")) return;
  $("listCategory").data = categoryComics.map(item => ({
    imgCatCover: {
      source: {
        url: item.cover,
        header: { "User-Agent": UA, "Referer": "https://tw.manhuagui.com/" }
      }
    },
    lblCatTitle: { text: item.title },
    lblCatLatest: { text: item.latest },
    lblCatInfo: {
      text: item.score ? `★ ${item.score}  |  ${item.updateon}` : item.updateon
    }
  }));
}

function fetchCategoryComics(isLoadMore = false, finishCallback) {
  if (isFetchingCategory || (isLoadMore && !hasMoreCategory)) return;
  isFetchingCategory = true;

  if (!isLoadMore) {
    currentCategoryFilter.page = 1;
    categoryComics = [];
    hasMoreCategory = true;
    $ui.loading(true);
  }

  let url = buildCategoryUrl(currentCategoryFilter);

  $http.get({
    url: url,
    header: { "User-Agent": UA, "Cookie": "isAdult=1" },
    handler: resp => {
      isFetchingCategory = false;
      $ui.loading(false);
      if (finishCallback) finishCallback();

      if (!resp.data) {
        $ui.toast("分类数据加载失败");
        return;
      }

      let newItems = parseCategoryHtml(resp.data);
      if (newItems.length === 0) {
        hasMoreCategory = false;
        if (!isLoadMore) $ui.toast("暂无符合条件的漫画");
        else $ui.toast("没有更多了");
        return;
      }

      newItems.forEach(item => {
        if (!categoryComics.some(c => c.url === item.url)) {
          categoryComics.push(item);
        }
      });

      if (!resp.data.includes(`_p${currentCategoryFilter.page + 1}.html`)) {
        hasMoreCategory = false;
      } else {
        currentCategoryFilter.page++;
      }

      updateCategoryListUI();
    }
  });
}

function selectRegionFilter() {
  $ui.action({
    title: "选择地区",
    actions: REGIONS.map(r => ({
      title: r.name,
      handler: () => {
        currentCategoryFilter.region = r.key;
        $("btnRegionFilter").title = `${r.name} ▾`;
        fetchCategoryComics(false);
      }
    }))
  });
}

function selectStatusFilter() {
  $ui.action({
    title: "选择连载进度",
    actions: STATUSES.map(s => ({
      title: s.name,
      handler: () => {
        currentCategoryFilter.status = s.key;
        $("btnStatusFilter").title = `${s.name} ▾`;
        fetchCategoryComics(false);
      }
    }))
  });
}

function selectAudienceFilter() {
  $ui.action({
    title: "选择目标受众",
    actions: AUDIENCES.map(a => ({
      title: a.name,
      handler: () => {
        currentCategoryFilter.audience = a.key;
        $("btnAudienceFilter").title = `${a.name} ▾`;
        fetchCategoryComics(false);
      }
    }))
  });
}

function selectSortFilter() {
  $ui.action({
    title: "选择排序方式",
    actions: SORTS.map(s => ({
      title: s.name,
      handler: () => {
        currentCategoryFilter.sort = s.key;
        $("btnSortFilter").title = `${s.name} ▾`;
        fetchCategoryComics(false);
      }
    }))
  });
}

// ================= 收藏与历史 UI 刷新 =================

function refreshFavoritesUI() {
  let favs = Storage.getFavorites();
  if (!$("listFavorites")) return;

  if (favs.length === 0) {
    $("listFavorites").data = [
      {
        imgFavCover: { hidden: true },
        lblFavTitle: { text: "书架空空如也" },
        lblFavSub: { text: "快去分类库或搜索挑选喜爱的漫画加入书架吧~" }
      }
    ];
    return;
  }

  $("listFavorites").data = favs.map(item => ({
    imgFavCover: {
      hidden: false,
      source: {
        url: item.cover,
        header: { "User-Agent": UA, "Referer": "https://tw.manhuagui.com/" }
      }
    },
    lblFavTitle: { text: item.title },
    lblFavSub: { text: item.latest ? `最新：${item.latest}` : `收藏于 ${formatTime(item.updateTime)}` }
  }));
}

function refreshHistoryUI() {
  let hists = Storage.getHistory();
  if (!$("listHistory")) return;

  if (hists.length === 0) {
    $("listHistory").data = [
      {
        imgHistCover: { hidden: true },
        lblHistTitle: { text: "暂无观看历史" },
        lblHistTime: { text: "" },
        lblHistProgress: { text: "开启漫画阅读后将自动记录您的阅读进度" }
      }
    ];
    return;
  }

  $("listHistory").data = hists.map(item => ({
    imgHistCover: {
      hidden: false,
      source: {
        url: item.comicCover,
        header: { "User-Agent": UA, "Referer": "https://tw.manhuagui.com/" }
      }
    },
    lblHistTitle: { text: item.comicTitle },
    lblHistTime: { text: formatTime(item.timestamp) },
    lblHistProgress: { text: `读至：${item.chapterTitle} (第 ${item.page}/${item.totalPages} 页)` }
  }));
}

// ================= 漫画详情页 =================

function openComicDetail(comicUrl, preTitle = "加载中...", preCover = "") {
  $ui.loading(true);
  $http.get({
    url: comicUrl,
    header: { "User-Agent": UA, "Cookie": "isAdult=1" },
    handler: resp => {
      $ui.loading(false);
      if (!resp.data) {
        $ui.error("漫画详情加载失败");
        return;
      }

      let comic = parseComicDetail(resp.data, comicUrl);
      if (preCover && !comic.cover) comic.cover = preCover;
      renderDetailUI(comic);
    }
  });
}

function renderDetailUI(comic) {
  let isFavorite = Storage.isFavorite(comic.url);
  let comicHistory = Storage.getComicHistory(comic.url);
  let isReverseOrder = false;
  let allSections = comic.sections.map(s => ({
    title: s.title,
    rawTitle: s.rawTitle,
    rows: [...s.rows],
    collapsed: false
  }));

  function getFirstOrHistoryChapter() {
    if (comicHistory) {
      for (let s of allSections) {
        let idx = s.rows.findIndex(r => r.url === comicHistory.chapterUrl);
        if (idx !== -1) {
          return { chapter: s.rows[idx], index: idx, allRows: s.rows, page: comicHistory.page };
        }
      }
    }
    if (allSections.length > 0 && allSections[0].rows.length > 0) {
      let firstSection = allSections[0];
      return { chapter: firstSection.rows[0], index: 0, allRows: firstSection.rows, page: 1 };
    }
    return null;
  }

  let continueInfo = getFirstOrHistoryChapter();
  let continueBtnText = "开始阅读";
  if (comicHistory) {
    continueBtnText = `继续: ${comicHistory.chapterTitle} (P.${comicHistory.page})`;
  }

  function updateToggleAllBtn() {
    if ($("btnToggleAllSections")) {
      let anyExpanded = allSections.some(s => !s.collapsed);
      $("btnToggleAllSections").title = anyExpanded ? "折叠" : "展开";
    }
  }

  function reloadChapterList() {
    if (!$("detailChapterList")) return;
    $("detailChapterList").data = allSections.map(sec => {
      let rows = [];
      let isCollapsed = !!sec.collapsed;

      // 分组标题行 (row 0)：支持点击折叠与展开
      rows.push({
        isHeader: true,
        viewHeader: { hidden: false },
        viewChapter: { hidden: true },
        lblHeaderArrow: {
          text: isCollapsed ? "▶" : "▼",
          textColor: isCollapsed ? $color("#888888") : $color("#e74c3c")
        },
        lblHeaderTitle: {
          text: sec.rawTitle
        },
        lblHeaderCount: {
          text: `共 ${sec.rows.length} 话`
        },
        lblHeaderHint: {
          text: isCollapsed ? "点击展开 ▾" : "点击收起 ▴"
        }
      });

      // 展开状态下的章节行 (row 1 .. N)
      if (!isCollapsed) {
        let displayList = isReverseOrder ? [...sec.rows].reverse() : sec.rows;
        displayList.forEach(item => {
          let isLastRead = comicHistory && comicHistory.chapterUrl === item.url;
          let tagText = isLastRead ? `读至 P.${comicHistory.page}` : (item.pageCount || "");
          rows.push({
            isHeader: false,
            viewHeader: { hidden: true },
            viewChapter: { hidden: false },
            lblChapterTitle: {
              text: item.title,
              textColor: isLastRead ? $color("#e74c3c") : $color("#222222"),
              font: isLastRead ? $font("bold", 14) : $font(14)
            },
            lblChapterTag: {
              text: tagText,
              hidden: !tagText,
              textColor: isLastRead ? $color("#e74c3c") : $color("#888888"),
              bgcolor: isLastRead ? $color("#fdedec") : $color("#f4f5f7")
            },
            lblChapterArrow: {
              text: "›"
            }
          });
        });
      }

      return {
        rows: rows
      };
    });

    updateToggleAllBtn();
  }

  function refreshDetailData(sender) {
    if (!sender) $ui.loading(true);
    $http.get({
      url: comic.url,
      header: { "User-Agent": UA, "Cookie": "isAdult=1" },
      handler: resp => {
        if (!sender) $ui.loading(false);
        if (sender && sender.endRefreshing) sender.endRefreshing();
        if (!resp.data) {
          $ui.toast("网络异常，刷新失败");
          return;
        }
        let newComic = parseComicDetail(resp.data, comic.url);
        comic.latest = newComic.latest;
        comic.status = newComic.status;
        comic.year = newComic.year;
        comic.intro = newComic.intro;

        if ($("detailStatus")) {
          $("detailStatus").text = `状态: ${comic.status}  ${comic.year}`;
          $("detailStatus").textColor = comic.status.includes("完") ? $color("#27ae60") : $color("#e67e22");
        }
        if ($("detailLatest")) {
          $("detailLatest").text = comic.latest ? `最新: ${comic.latest}` : "";
        }
        if ($("detailIntro")) {
          $("detailIntro").text = comic.intro;
        }

        // 继承既有分组折叠状态
        let collapsedMap = {};
        allSections.forEach(s => { collapsedMap[s.rawTitle] = s.collapsed; });
        allSections = newComic.sections.map(s => ({
          title: s.title,
          rawTitle: s.rawTitle,
          rows: [...s.rows],
          collapsed: !!collapsedMap[s.rawTitle]
        }));

        reloadChapterList();
        $ui.toast("章节列表已更新");
      }
    });
  }

  $ui.push({
    props: {
      title: comic.title,
      navButtons: [
        {
          title: "刷新",
          symbol: "arrow.clockwise",
          handler: () => {
            refreshDetailData();
          }
        },
        {
          title: "分享",
          symbol: "square.and.arrow.up",
          handler: () => {
            $share.sheet([comic.title, comic.url]);
          }
        }
      ]
    },
    views: [
      {
        type: "list",
        props: {
          id: "detailChapterList",
          rowHeight: 48,
          pullToRefresh: true,
          header: {
            type: "view",
            props: { height: 248 },
            views: [
              // 封面图
              {
                type: "image",
                props: {
                  id: "detailCover",
                  radius: 8,
                  bgcolor: $color("#f0f0f0"),
                  contentMode: $contentMode.scaleAspectFill,
                  source: {
                    url: comic.cover,
                    header: { "User-Agent": UA, "Referer": "https://tw.manhuagui.com/" }
                  }
                },
                layout: make => {
                  make.left.top.inset(16);
                  make.width.equalTo(100);
                  make.height.equalTo(135);
                }
              },
              // 漫画信息文字
              {
                type: "label",
                props: {
                  text: comic.title,
                  font: $font("bold", 18),
                  lines: 1
                },
                layout: (make, view) => {
                  make.left.equalTo($("detailCover").right).offset(14);
                  make.right.inset(16);
                  make.top.inset(18);
                }
              },
              {
                type: "label",
                props: {
                  text: `作者: ${comic.author || "佚名"}`,
                  font: $font(13),
                  textColor: $color("#555555")
                },
                layout: (make, view) => {
                  make.left.equalTo($("detailCover").right).offset(14);
                  make.right.inset(16);
                  make.top.inset(46);
                }
              },
              {
                type: "label",
                props: {
                  id: "detailStatus",
                  text: `状态: ${comic.status}  ${comic.year}`,
                  font: $font(13),
                  textColor: comic.status.includes("完") ? $color("#27ae60") : $color("#e67e22")
                },
                layout: (make, view) => {
                  make.left.equalTo($("detailCover").right).offset(14);
                  make.right.inset(16);
                  make.top.inset(70);
                }
              },
              {
                type: "label",
                props: {
                  text: `类型: ${comic.genre || "漫画"} | ${comic.region || "地区"} (点此分类)`,
                  font: $font(13),
                  textColor: $color("#2980b9")
                },
                layout: (make, view) => {
                  make.left.equalTo($("detailCover").right).offset(14);
                  make.right.inset(16);
                  make.top.inset(94);
                }
              },
              {
                type: "label",
                props: {
                  id: "detailLatest",
                  text: comic.latest ? `最新: ${comic.latest}` : "",
                  font: $font(12),
                  textColor: $color("#e74c3c"),
                  lines: 1
                },
                layout: (make, view) => {
                  make.left.equalTo($("detailCover").right).offset(14);
                  make.right.inset(16);
                  make.top.inset(118);
                }
              },
              // 操作按钮栏：收藏 + 开始/继续阅读 + 正倒序 + 全部折叠/展开
              {
                type: "button",
                props: {
                  id: "btnFav",
                  title: isFavorite ? "❤️ 已收藏" : "🤍 收藏",
                  font: $font(13),
                  bgcolor: isFavorite ? $color("#e74c3c") : $color("#555555"),
                  radius: 6
                },
                layout: (make, view) => {
                  make.left.inset(16);
                  make.top.equalTo($("detailCover").bottom).offset(12);
                  make.width.equalTo(80);
                  make.height.equalTo(34);
                },
                events: {
                  tapped: sender => {
                    isFavorite = Storage.toggleFavorite(comic);
                    sender.title = isFavorite ? "❤️ 已收藏" : "🤍 收藏";
                    sender.bgcolor = isFavorite ? $color("#e74c3c") : $color("#555555");
                    $ui.toast(isFavorite ? "已加入书架" : "已移出书架");
                    refreshFavoritesUI();
                  }
                }
              },
              {
                type: "button",
                props: {
                  id: "btnContinue",
                  title: continueBtnText,
                  font: $font("bold", 13),
                  bgcolor: $color("#3498db"),
                  radius: 6
                },
                layout: (make, view) => {
                  make.left.equalTo($("btnFav").right).offset(8);
                  make.right.inset(136);
                  make.top.equalTo($("detailCover").bottom).offset(12);
                  make.height.equalTo(34);
                },
                events: {
                  tapped: () => {
                    let target = getFirstOrHistoryChapter();
                    if (target) {
                      comic.sections = allSections;
                      openReader(comic, target.chapter, target.index, target.allRows, target.page || 1, () => {
                        comicHistory = Storage.getComicHistory(comic.url);
                        reloadChapterList();
                      });
                    } else {
                      $ui.toast("暂无可用章节");
                    }
                  }
                }
              },
              {
                type: "button",
                props: {
                  id: "btnOrder",
                  title: "倒序",
                  font: $font(13),
                  bgcolor: $color("#ecf0f1"),
                  titleColor: $color("#333333"),
                  radius: 6
                },
                layout: (make, view) => {
                  make.right.inset(70);
                  make.top.equalTo($("detailCover").bottom).offset(12);
                  make.width.equalTo(56);
                  make.height.equalTo(34);
                },
                events: {
                  tapped: sender => {
                    isReverseOrder = !isReverseOrder;
                    sender.title = isReverseOrder ? "正序" : "倒序";
                    reloadChapterList();
                  }
                }
              },
              {
                type: "button",
                props: {
                  id: "btnToggleAllSections",
                  title: "折叠",
                  font: $font(12),
                  bgcolor: $color("#f2f4f7"),
                  titleColor: $color("#555555"),
                  radius: 6
                },
                layout: (make, view) => {
                  make.right.inset(16);
                  make.top.equalTo($("detailCover").bottom).offset(12);
                  make.width.equalTo(48);
                  make.height.equalTo(34);
                },
                events: {
                  tapped: sender => {
                    let anyExpanded = allSections.some(s => !s.collapsed);
                    allSections.forEach(s => s.collapsed = anyExpanded);
                    sender.title = anyExpanded ? "展开" : "折叠";
                    reloadChapterList();
                  }
                }
              },
              // 简介概要（点击弹出完整简介）
              {
                type: "label",
                props: {
                  id: "detailIntro",
                  text: comic.intro,
                  font: $font(12),
                  textColor: $color("#777777"),
                  lines: 2
                },
                layout: (make, view) => {
                  make.left.right.inset(16);
                  make.top.equalTo($("btnFav").bottom).offset(10);
                },
                events: {
                  tapped: () => {
                    $ui.alert({
                      title: "漫画简介",
                      message: comic.intro,
                      actions: [{ title: "知道了" }]
                    });
                  }
                }
              }
            ]
          },
          template: {
            views: [
              // 1. 分组标题行视图
              {
                type: "view",
                props: {
                  id: "viewHeader",
                  bgcolor: $color("#f8f9fa")
                },
                layout: $layout.fill,
                views: [
                  {
                    type: "label",
                    props: {
                      id: "lblHeaderArrow",
                      font: $font("bold", 13),
                      align: $align.center
                    },
                    layout: (make, view) => {
                      make.left.inset(16);
                      make.centerY.equalTo(view.super);
                      make.width.equalTo(16);
                    }
                  },
                  {
                    type: "label",
                    props: {
                      id: "lblHeaderTitle",
                      font: $font("bold", 15),
                      textColor: $color("#111111")
                    },
                    layout: (make, view) => {
                      make.left.equalTo(view.prev.right).offset(6);
                      make.centerY.equalTo(view.super);
                    }
                  },
                  {
                    type: "label",
                    props: {
                      id: "lblHeaderCount",
                      font: $font(11),
                      textColor: $color("#777777"),
                      bgcolor: $color("#eaecf0"),
                      radius: 4,
                      align: $align.center
                    },
                    layout: (make, view) => {
                      make.left.equalTo(view.prev.right).offset(8);
                      make.centerY.equalTo(view.super);
                      make.height.equalTo(18);
                      make.width.equalTo(68);
                    }
                  },
                  {
                    type: "label",
                    props: {
                      id: "lblHeaderHint",
                      font: $font(12),
                      textColor: $color("#999999"),
                      align: $align.right
                    },
                    layout: (make, view) => {
                      make.right.inset(16);
                      make.centerY.equalTo(view.super);
                    }
                  },
                  {
                    type: "view",
                    props: {
                      bgcolor: $color("#e5e7eb")
                    },
                    layout: (make, view) => {
                      make.left.right.bottom.inset(0);
                      make.height.equalTo(0.5);
                    }
                  }
                ]
              },
              // 2. 章节条目行视图
              {
                type: "view",
                props: {
                  id: "viewChapter",
                  bgcolor: $color("#ffffff")
                },
                layout: $layout.fill,
                views: [
                  {
                    type: "label",
                    props: {
                      id: "lblChapterTitle",
                      font: $font(14),
                      lines: 1
                    },
                    layout: (make, view) => {
                      make.left.inset(16);
                      make.right.inset(115);
                      make.centerY.equalTo(view.super);
                    }
                  },
                  {
                    type: "label",
                    props: {
                      id: "lblChapterTag",
                      font: $font(11),
                      align: $align.center,
                      radius: 4
                    },
                    layout: (make, view) => {
                      make.right.inset(30);
                      make.centerY.equalTo(view.super);
                      make.height.equalTo(20);
                      make.width.equalTo(72);
                    }
                  },
                  {
                    type: "label",
                    props: {
                      id: "lblChapterArrow",
                      text: "›",
                      font: $font("bold", 16),
                      textColor: $color("#cccccc"),
                      align: $align.center
                    },
                    layout: (make, view) => {
                      make.right.inset(14);
                      make.centerY.equalTo(view.super).offset(-1);
                      make.width.equalTo(12);
                    }
                  }
                ]
              }
            ]
          }
        },
        layout: $layout.fill,
        events: {
          didSelect: (sender, indexPath) => {
            let section = allSections[indexPath.section];
            if (!section) return;

            if (indexPath.row === 0) {
              section.collapsed = !section.collapsed;
              updateToggleAllBtn();
              reloadChapterList();
              return;
            }

            let clickedRow = indexPath.row - 1;
            let realIndex = isReverseOrder ? (section.rows.length - 1 - clickedRow) : clickedRow;
            let chapter = section.rows[realIndex];
            if (!chapter) return;
            comic.sections = allSections;
            openReader(comic, chapter, realIndex, section.rows, 1, () => {
              comicHistory = Storage.getComicHistory(comic.url);
              reloadChapterList();
            });
          },
          pulled: sender => {
            refreshDetailData(sender);
          },
          didPullRefresh: sender => {
            refreshDetailData(sender);
          }
        }
      }
    ]
  });

  reloadChapterList();
}

// ================= 搜索与分页界面 =================

function openSearchPage() {
  let searchKeyword = "";
  let searchPage = 1;
  let searchResults = [];
  let isFetching = false;
  let hasMore = true;

  function doSearch(isLoadMore = false) {
    if (!searchKeyword || isFetching || (isLoadMore && !hasMore)) return;
    isFetching = true;

    if (!isLoadMore) {
      searchPage = 1;
      searchResults = [];
      hasMore = true;
      $ui.loading(true);
      Storage.addSearchHistory(searchKeyword);
      renderSearchHistoryChips();
    }

    let searchUrl = `${BASE_URL}/s/${encodeURIComponent(searchKeyword)}_p${searchPage}.html`;

    $http.get({
      url: searchUrl,
      header: { "User-Agent": UA, "Cookie": "isAdult=1" },
      handler: resp => {
        isFetching = false;
        $ui.loading(false);
        let html = resp.data || "";
        let newItems = parseSearchHtml(html);

        if (newItems.length === 0) {
          hasMore = false;
          if (!isLoadMore) $ui.toast("未找到相关漫画");
          else $ui.toast("已经到底啦");
          return;
        }

        newItems.forEach(item => {
          if (!searchResults.some(r => r.url === item.url)) {
            searchResults.push(item);
          }
        });

        if (!html.includes(`_p${searchPage + 1}.html`)) {
          hasMore = false;
        } else {
          searchPage++;
        }

        if ($("searchList")) {
          $("searchList").data = searchResults.map(r => ({
            imgSearchCover: {
              source: {
                url: r.cover,
                header: { "User-Agent": UA, "Referer": "https://tw.manhuagui.com/" }
              }
            },
            lblSearchTitle: { text: r.title },
            lblSearchSub: { text: r.sub }
          }));
        }
      }
    });
  }

  function renderSearchHistoryChips() {
    let historyWords = Storage.getSearchHistory();
    if (!$("historyContainer")) return;
    $("historyContainer").hidden = historyWords.length === 0 || searchResults.length > 0;
    if ($("historyMatrix")) {
      $("historyMatrix").data = historyWords.map(w => ({
        lblTag: { text: w }
      }));
    }
  }

  $ui.push({
    props: { title: "搜索漫畫" },
    views: [
      {
        type: "input",
        props: {
          id: "searchInput",
          placeholder: "输入漫画名搜索，或直接输入ID (如 16460)",
          darkKeyboard: true,
          clearButtonMode: 1
        },
        layout: make => {
          make.top.left.right.inset(10);
          make.height.equalTo(38);
        },
        events: {
          returned: sender => {
            sender.blur();
            let kw = sender.text.trim();
            if (!kw) return;
            if (/^\d+$/.test(kw)) {
              $ui.pop();
              openComicDetail(`${BASE_URL}/comic/${kw}/`);
              return;
            }
            searchKeyword = kw;
            doSearch(false);
          }
        }
      },
      // 搜索历史区域
      {
        type: "view",
        props: {
          id: "historyContainer"
        },
        layout: (make, view) => {
          make.top.equalTo($("searchInput").bottom).offset(8);
          make.left.right.inset(12);
          make.height.equalTo(48);
        },
        views: [
          {
            type: "matrix",
            props: {
              id: "historyMatrix",
              direction: $scrollDirection.horizontal,
              itemSize: $size(80, 32),
              spacing: 8,
              template: {
                views: [
                  {
                    type: "label",
                    props: {
                      id: "lblTag",
                      font: $font(13),
                      textColor: $color("#555555"),
                      bgcolor: $color("#f0f0f0"),
                      radius: 16,
                      align: $align.center
                    },
                    layout: $layout.fill
                  }
                ]
              }
            },
            layout: (make, view) => {
              make.left.top.bottom.equalTo(0);
              make.right.inset(44);
            },
            events: {
              didSelect: (sender, indexPath) => {
                let kw = Storage.getSearchHistory()[indexPath.item];
                if (kw) {
                  $("searchInput").text = kw;
                  searchKeyword = kw;
                  doSearch(false);
                }
              }
            }
          },
          {
            type: "button",
            props: {
              title: "清空",
              font: $font(12),
              titleColor: $color("#999999"),
              bgcolor: $color("clear")
            },
            layout: make => {
              make.right.top.bottom.equalTo(0);
              make.width.equalTo(40);
            },
            events: {
              tapped: () => {
                Storage.clearSearchHistory();
                renderSearchHistoryChips();
              }
            }
          }
        ]
      },
      // 搜索结果列表
      {
        type: "list",
        props: {
          id: "searchList",
          rowHeight: 96,
          template: {
            views: [
              {
                type: "image",
                props: {
                  id: "imgSearchCover",
                  radius: 4,
                  bgcolor: $color("#eeeeee"),
                  contentMode: $contentMode.scaleAspectFill
                },
                layout: make => {
                  make.left.inset(12);
                  make.top.bottom.inset(8);
                  make.width.equalTo(60);
                }
              },
              {
                type: "label",
                props: { id: "lblSearchTitle", font: $font("bold", 15), lines: 1 },
                layout: (make, view) => {
                  make.left.equalTo($("imgSearchCover").right).offset(12);
                  make.right.inset(12);
                  make.top.inset(16);
                }
              },
              {
                type: "label",
                props: { id: "lblSearchSub", font: $font(13), textColor: $color("#666666"), lines: 2 },
                layout: (make, view) => {
                  make.left.equalTo($("imgSearchCover").right).offset(12);
                  make.right.inset(12);
                  make.top.equalTo($("lblSearchTitle").bottom).offset(8);
                }
              }
            ]
          }
        },
        layout: (make, view) => {
          make.top.equalTo($("historyContainer").bottom).offset(4);
          make.left.right.bottom.equalTo(0);
        },
        events: {
          didSelect: (sender, indexPath) => {
            let item = searchResults[indexPath.row];
            if (item) openComicDetail(item.url, item.title, item.cover);
          },
          didReachBottom: sender => {
            sender.endFetchingMore();
            doSearch(true);
          }
        }
      }
    ]
  });

  renderSearchHistoryChips();
}

// ================= 旗舰阅读器核心 =================

function openReaderDirectly(historyEntry) {
  let comic = {
    url: historyEntry.comicUrl,
    title: historyEntry.comicTitle,
    cover: historyEntry.comicCover
  };
  let chapter = {
    url: historyEntry.chapterUrl,
    title: historyEntry.chapterTitle
  };
  openReader(comic, chapter, historyEntry.chapterIndex || 0, [], historyEntry.page || 1);
}

function findAdjacentChapters(comic, currentChapter, chapterIndex, allChapters) {
  let prev = null;
  let next = null;

  // 1. 如果有当前章节列表
  if (allChapters && allChapters.length > 0) {
    let idx = chapterIndex;
    if (idx < 0 || idx >= allChapters.length || allChapters[idx].url !== currentChapter.url) {
      idx = allChapters.findIndex(r => r.url === currentChapter.url);
    }
    if (idx !== -1) {
      if (idx > 0) prev = allChapters[idx - 1];
      if (idx < allChapters.length - 1) next = allChapters[idx + 1];

      // 跨分组向后查找（例如第一卷读完进入第二卷）
      if (!next && comic && comic.sections && comic.sections.length > 1) {
        let secIdx = comic.sections.findIndex(s => s.rows && s.rows.some(r => r.url === currentChapter.url));
        if (secIdx !== -1 && secIdx < comic.sections.length - 1 && comic.sections[secIdx + 1].rows && comic.sections[secIdx + 1].rows.length > 0) {
          next = comic.sections[secIdx + 1].rows[0];
        }
      }

      // 跨分组向前查找
      if (!prev && comic && comic.sections && comic.sections.length > 1) {
        let secIdx = comic.sections.findIndex(s => s.rows && s.rows.some(r => r.url === currentChapter.url));
        if (secIdx > 0 && comic.sections[secIdx - 1].rows && comic.sections[secIdx - 1].rows.length > 0) {
          let prevSec = comic.sections[secIdx - 1].rows;
          prev = prevSec[prevSec.length - 1];
        }
      }

      return { prev, next, realIndex: idx, chapters: allChapters };
    }
  }

  // 2. 如果 allChapters 为空，但在 comic.sections 中存在
  if (comic && comic.sections && comic.sections.length > 0) {
    for (let sIdx = 0; sIdx < comic.sections.length; sIdx++) {
      let sec = comic.sections[sIdx];
      let idx = sec.rows.findIndex(r => r.url === currentChapter.url);
      if (idx !== -1) {
        if (idx > 0) {
          prev = sec.rows[idx - 1];
        } else if (sIdx > 0 && comic.sections[sIdx - 1].rows && comic.sections[sIdx - 1].rows.length > 0) {
          let prevSec = comic.sections[sIdx - 1].rows;
          prev = prevSec[prevSec.length - 1];
        }

        if (idx < sec.rows.length - 1) {
          next = sec.rows[idx + 1];
        } else if (sIdx < comic.sections.length - 1 && comic.sections[sIdx + 1].rows && comic.sections[sIdx + 1].rows.length > 0) {
          next = comic.sections[sIdx + 1].rows[0];
        }

        return { prev, next, realIndex: idx, chapters: sec.rows };
      }
    }
  }

  return { prev: null, next: null, realIndex: chapterIndex, chapters: allChapters };
}

function openReader(comic, chapter, chapterIndex = -1, allChapters = [], initialPage = 1, onFinished) {
  $ui.loading(true);
  $http.get({
    url: chapter.url,
    header: { "User-Agent": UA, "Cookie": "isAdult=1" },
    handler: resp => {
      $ui.loading(false);
      if (!resp.data) {
        $ui.error("章节数据加载失败");
        return;
      }

      let data = decryptImgData(resp.data);
      if (!data || !data.files || data.files.length === 0) {
        $ui.error("图片解密失败");
        return;
      }

      let path = data.path || "";
      let e = data.sl ? data.sl.e : "";
      let m = data.sl ? data.sl.m : "";

      let imageUrls = data.files.map(file => {
        return encodeURI(`${IMG_HOST}${path}${file}`) + `?e=${e}&m=${m}`;
      });

      renderReaderView(comic, chapter, imageUrls, chapterIndex, allChapters, initialPage, onFinished);
    }
  });
}

function renderReaderView(comic, chapter, imageUrls, chapterIndex, allChapters, initialPage, onFinished) {
  let isVerticalMode = false;
  let currentChapter = chapter;
  let currentChapterIndex = chapterIndex;
  let currentAllChapters = allChapters || [];
  let currentImageUrls = imageUrls;
  let totalPages = currentImageUrls.length;
  let currentPage = Math.min(Math.max(initialPage || 1, 1), totalPages);

  // 双向预加载缓存
  let prefetchNextCache = { url: "", data: null };
  let prefetchPrevCache = { url: "", data: null };

  let isTransitioning = false;
  let autoNextTimer = null;

  // 记录阅读进度
  function recordProgress(page) {
    currentPage = page;
    Storage.saveHistory({
      comicUrl: comic.url,
      comicTitle: comic.title,
      comicCover: comic.cover,
      chapterTitle: currentChapter.title,
      chapterUrl: currentChapter.url,
      chapterIndex: currentChapterIndex,
      page: currentPage,
      totalPages: totalPages
    });
    $ui.title = `${currentChapter.title} (${currentPage}/${totalPages})`;
    if (onFinished) onFinished();
  }

  // 模式切换（翻页 vs 条漫）
  function switchMode() {
    isVerticalMode = !isVerticalMode;
    let galleryView = $("readerGallery");
    let listView = $("readerList");
    let btnMode = $("btnMode");

    if (galleryView && listView) {
      galleryView.hidden = isVerticalMode;
      listView.hidden = !isVerticalMode;
      if (btnMode) {
        btnMode.title = isVerticalMode ? "翻页模式" : "条漫模式";
      }
      if (isVerticalMode) {
        // 同步当前页码到条漫
        let targetRow = Math.min(Math.max(currentPage - 1, 0), currentImageUrls.length - 1);
        let doScroll = () => {
          let list = $("readerList");
          if (list) {
            try {
              list.scrollTo({
                indexPath: $indexPath(0, targetRow),
                position: (typeof $scrollPosition !== "undefined" && $scrollPosition.top) ? $scrollPosition.top : 1,
                animated: false
              });
            } catch (e) {
              list.scrollTo({ indexPath: $indexPath(0, targetRow), animated: false });
            }
          }
        };
        $delay(0.02, doScroll);
      } else {
        // 同步当前页码到翻页画廊 (0-based)
        galleryView.page = Math.min(Math.max(currentPage - 1, 0), totalPages - 1);
      }
    }
  }

  // 双向预加载章节数据
  function prefetchChapter(targetChapter, isPrev = false) {
    if (!targetChapter || !targetChapter.url) return;
    let cache = isPrev ? prefetchPrevCache : prefetchNextCache;
    if (cache.url === targetChapter.url && cache.data) return;

    let targetUrl = targetChapter.url;
    cache.url = targetUrl;
    cache.data = null;

    $http.get({
      url: targetUrl,
      header: { "User-Agent": UA, "Cookie": "isAdult=1" },
      handler: resp => {
        if (resp.data && cache.url === targetUrl) {
          let data = decryptImgData(resp.data);
          if (data && data.files && data.files.length > 0) {
            let path = data.path || "";
            let e = data.sl ? data.sl.e : "";
            let m = data.sl ? data.sl.m : "";
            let urls = data.files.map(file => encodeURI(`${IMG_HOST}${path}${file}`) + `?e=${e}&m=${m}`);
            cache.data = { chapter: targetChapter, imageUrls: urls };
          }
        }
      }
    });
  }

  // 自动触发进入下一话
  function triggerAutoNext() {
    if (isTransitioning) return;
    cancelAutoNext();
    autoNextTimer = setTimeout(() => {
      doTransitionToNext();
    }, 450);
  }

  function cancelAutoNext() {
    if (autoNextTimer) {
      clearTimeout(autoNextTimer);
      autoNextTimer = null;
    }
  }

  // 执行切换到下一话（从第 1 页开始）
  function doTransitionToNext() {
    if (isTransitioning) return;
    cancelAutoNext();

    let adj = findAdjacentChapters(comic, currentChapter, currentChapterIndex, currentAllChapters);
    let next = adj.next;
    if (!next) {
      $ui.toast("已经是最后一话了");
      return;
    }

    isTransitioning = true;
    updateNextTransitionLoadingState(true, next.title);

    // 优先命中预加载缓存
    if (prefetchNextCache.url === next.url && prefetchNextCache.data) {
      let cached = prefetchNextCache.data;
      applyChapter(cached.chapter, cached.imageUrls, adj.realIndex + 1, adj.chapters, 1);
      return;
    }

    // 否则直接拉取
    $http.get({
      url: next.url,
      header: { "User-Agent": UA, "Cookie": "isAdult=1" },
      handler: resp => {
        if (!resp.data) {
          isTransitioning = false;
          updateNextTransitionLoadingState(false, next.title, "网络连接失败，请点击重试");
          $ui.toast("下一话数据加载失败");
          return;
        }

        let data = decryptImgData(resp.data);
        if (!data || !data.files || data.files.length === 0) {
          isTransitioning = false;
          updateNextTransitionLoadingState(false, next.title, "图片解密失败，请点击重试");
          $ui.toast("图片解密失败");
          return;
        }

        let path = data.path || "";
        let e = data.sl ? data.sl.e : "";
        let m = data.sl ? data.sl.m : "";
        let urls = data.files.map(file => encodeURI(`${IMG_HOST}${path}${file}`) + `?e=${e}&m=${m}`);

        applyChapter(next, urls, adj.realIndex + 1, adj.chapters, 1);
      }
    });
  }

  // 执行返回上一话（保证连续性：从上一话最后一页/最底端开始阅读）
  function doTransitionToPrev() {
    if (isTransitioning) return;
    cancelAutoNext();

    let adj = findAdjacentChapters(comic, currentChapter, currentChapterIndex, currentAllChapters);
    let prev = adj.prev;
    if (!prev) {
      $ui.toast("已经是第一话了");
      return;
    }

    isTransitioning = true;
    $ui.loading(true);

    // 优先命中上一话预加载缓存
    if (prefetchPrevCache.url === prev.url && prefetchPrevCache.data) {
      $ui.loading(false);
      let cached = prefetchPrevCache.data;
      applyChapter(cached.chapter, cached.imageUrls, adj.realIndex - 1, adj.chapters, cached.imageUrls.length);
      return;
    }

    // 否则直接拉取
    $http.get({
      url: prev.url,
      header: { "User-Agent": UA, "Cookie": "isAdult=1" },
      handler: resp => {
        $ui.loading(false);
        if (!resp.data) {
          isTransitioning = false;
          $ui.toast("上一话数据加载失败");
          return;
        }

        let data = decryptImgData(resp.data);
        if (!data || !data.files || data.files.length === 0) {
          isTransitioning = false;
          $ui.toast("图片解密失败");
          return;
        }

        let path = data.path || "";
        let e = data.sl ? data.sl.e : "";
        let m = data.sl ? data.sl.m : "";
        let urls = data.files.map(file => encodeURI(`${IMG_HOST}${path}${file}`) + `?e=${e}&m=${m}`);

        // 保证连续性：进入上一话时定位到最后一页 (urls.length)
        applyChapter(prev, urls, adj.realIndex - 1, adj.chapters, urls.length);
      }
    });
  }

  // 更新下一话过渡页加载状态提示
  function updateNextTransitionLoadingState(isLoading, nextTitle, errorMsg) {
    if ($("lblNextTransitionStatus")) {
      if (errorMsg) {
        $("lblNextTransitionStatus").text = errorMsg;
        $("lblNextTransitionStatus").textColor = $color("#e74c3c");
      } else {
        $("lblNextTransitionStatus").text = isLoading ? `正在进入: ${nextTitle}...` : `即将自动进入: ${nextTitle}`;
        $("lblNextTransitionStatus").textColor = $color("#3498db");
      }
    }
    if ($("nextTransitionSpinner")) {
      $("nextTransitionSpinner").hidden = !isLoading;
      $("nextTransitionSpinner").loading = isLoading;
    }
    if ($("btnNextTransitionAction") && errorMsg) {
      $("btnNextTransitionAction").title = "重试加载下一话";
    }
  }

  // 应用并渲染新章节（保留当前阅读器视图，无缝原地切换）
  function applyChapter(newChapter, newImageUrls, newChapterIndex, newAllChapters, startPage = 1) {
    currentChapter = newChapter;
    currentChapterIndex = newChapterIndex;
    currentAllChapters = newAllChapters;
    currentImageUrls = newImageUrls;
    totalPages = newImageUrls.length;
    currentPage = Math.min(Math.max(startPage, 1), totalPages);
    isTransitioning = false;

    let adj = findAdjacentChapters(comic, currentChapter, currentChapterIndex, currentAllChapters);
    currentChapterIndex = adj.realIndex;
    currentAllChapters = adj.chapters;
    let next = adj.next;
    let prev = adj.prev;

    let newGalleryItems = buildGalleryItems(newImageUrls, newChapter, next);
    let newListData = buildListData(newImageUrls, newChapter);
    let galleryPageIndex = currentPage - 1;

    let wrapper = $("readerWrapper");
    if (wrapper) {
      let oldG = $("readerGallery");
      let oldL = $("readerList");
      if (oldG) oldG.remove();
      if (oldL) oldL.remove();

      wrapper.add(buildGalleryView(newGalleryItems, galleryPageIndex, isVerticalMode));
      wrapper.add(buildListView(newListData, prev, next, isVerticalMode));

      // 若定位至末页（如返回上一话时），画廊模式与条漫模式均精准定位至末尾
      if (currentPage > 1) {
        $delay(0.05, () => {
          let g = $("readerGallery");
          if (g) g.page = galleryPageIndex;
        });

        let targetRow = Math.min(currentPage - 1, newImageUrls.length - 1);
        let doScroll = () => {
          let list = $("readerList");
          if (list) {
            try {
              list.scrollTo({
                indexPath: $indexPath(0, targetRow),
                position: (typeof $scrollPosition !== "undefined" && $scrollPosition.bottom) ? $scrollPosition.bottom : 3,
                animated: false
              });
            } catch (e) {
              list.scrollTo({ indexPath: $indexPath(0, targetRow), animated: false });
            }
          }
        };
        $delay(0.05, doScroll);
        $delay(0.15, doScroll);
      }
    }

    recordProgress(currentPage);

    // 预加载相邻话数
    if (next) prefetchChapter(next, false);
    if (prev) prefetchChapter(prev, true);
  }

  // 下一话过渡页面视图（置于画廊最后一页）
  function buildNextTransitionPageView(curChapter, nextChapter, total) {
    return {
      type: "view",
      props: {
        bgcolor: $color("black")
      },
      layout: $layout.fill,
      views: [
        {
          type: "view",
          props: {
            id: "nextTransitionCard",
            bgcolor: $color("#1c1c1e"),
            radius: 16
          },
          layout: (make, view) => {
            make.center.equalTo(view.super);
            make.left.right.inset(28);
            make.height.equalTo(320);
          },
          views: [
            {
              type: "image",
              props: {
                symbol: nextChapter ? "checkmark.circle.fill" : "flag.checkered.circle.fill",
                tintColor: nextChapter ? $color("#2ecc71") : $color("#f39c12"),
                contentMode: $contentMode.scaleAspectFit
              },
              layout: (make, view) => {
                make.centerX.equalTo(view.super);
                make.top.inset(28);
                make.size.equalTo($size(48, 48));
              }
            },
            {
              type: "label",
              props: {
                text: nextChapter ? "本话阅读完毕" : "全书阅读完毕",
                font: $font("bold", 18),
                textColor: $color("#ffffff"),
                align: $align.center
              },
              layout: (make, view) => {
                make.top.equalTo(view.prev.bottom).offset(14);
                make.left.right.inset(16);
              }
            },
            {
              type: "label",
              props: {
                text: curChapter.title,
                font: $font(13),
                textColor: $color("#888888"),
                align: $align.center
              },
              layout: (make, view) => {
                make.top.equalTo(view.prev.bottom).offset(6);
                make.left.right.inset(16);
              }
            },
            {
              type: "label",
              props: {
                id: "lblNextTransitionStatus",
                text: nextChapter ? `即将自动进入: ${nextChapter.title}` : "已是最新话，作者仍在快马加鞭更新中",
                font: $font("bold", 14),
                textColor: nextChapter ? $color("#3498db") : $color("#888888"),
                align: $align.center,
                lines: 2
              },
              layout: (make, view) => {
                make.top.equalTo(view.prev.bottom).offset(16);
                make.left.right.inset(16);
              }
            },
            {
              type: "spinner",
              props: {
                id: "nextTransitionSpinner",
                loading: !!nextChapter,
                hidden: !nextChapter,
                style: 0
              },
              layout: (make, view) => {
                make.top.equalTo(view.prev.bottom).offset(10);
                make.centerX.equalTo(view.super);
              }
            },
            {
              type: "button",
              props: {
                id: "btnNextTransitionAction",
                title: nextChapter ? "立即进入下一话 ›" : "返回漫画详情",
                font: $font("bold", 14),
                bgcolor: nextChapter ? $color("#3498db") : $color("#333333"),
                titleColor: $color("#ffffff"),
                radius: 20
              },
              layout: (make, view) => {
                make.bottom.inset(24);
                make.left.right.inset(24);
                make.height.equalTo(42);
              },
              events: {
                tapped: () => {
                  if (nextChapter) {
                    doTransitionToNext();
                  } else {
                    $ui.pop();
                  }
                }
              }
            }
          ]
        }
      ]
    };
  }

  // 构建画廊翻页视图数据：[...正文各页, 下一话过渡页]
  function buildGalleryItems(urls, curChapter, nextChapter) {
    let items = [];

    // 1. 漫画正文页 (index 0 .. urls.length - 1)
    for (let idx = 0; idx < urls.length; idx++) {
      let pageNum = idx + 1;
      items.push({
        type: "scroll",
        props: {
          zoomEnabled: true,
          maxZoomScale: 3,
          doubleTapToZoom: true,
          showsHorizontalScrollIndicator: false,
          showsVerticalScrollIndicator: false,
          bgcolor: $color("black")
        },
        layout: $layout.fill,
        views: [
          {
            type: "label",
            props: {
              text: `第 ${pageNum} / ${urls.length} 页`,
              textColor: $color("#555555"),
              font: $font(14),
              align: $align.center
            },
            layout: (make, view) => {
              make.center.equalTo(view.super);
            }
          },
          {
            type: "image",
            props: {
              source: {
                url: urls[idx],
                header: {
                  "User-Agent": UA,
                  "Referer": curChapter.url || "https://tw.manhuagui.com/"
                }
              },
              contentMode: $contentMode.scaleAspectFit,
              bgcolor: $color("clear")
            },
            layout: $layout.fill
          }
        ]
      });
    }

    // 2. 下一话过渡页 (index urls.length)
    items.push(buildNextTransitionPageView(curChapter, nextChapter, urls.length));
    return items;
  }

  // 构建画廊控件配置
  function buildGalleryView(items, startPageIndex, isHidden) {
    return {
      type: "gallery",
      props: {
        id: "readerGallery",
        items: items,
        interval: 0,
        page: startPageIndex,
        hidden: isHidden
      },
      layout: $layout.fill,
      events: {
        changed: sender => {
          let p = sender.page;
          if (p === totalPages) {
            // 翻至最后一页之后：下一话过渡页
            recordProgress(totalPages);
            let adj = findAdjacentChapters(comic, currentChapter, currentChapterIndex, currentAllChapters);
            if (adj.next) {
              triggerAutoNext();
            } else {
              $ui.toast("已经是最后一话了");
            }
          } else if (p >= 0 && p < totalPages) {
            // 正常漫画正文页 (0 <= p < totalPages)
            cancelAutoNext();
            recordProgress(p + 1);
          }
        }
      }
    };
  }

  // 构建条漫顶部过渡卡片（下拉/上滑返回上一话）
  function buildListHeader(prevChapter) {
    return {
      type: "view",
      props: {
        height: 160,
        bgcolor: $color("black")
      },
      views: [
        {
          type: "view",
          props: {
            bgcolor: $color("#1c1c1e"),
            radius: 12
          },
          layout: (make, view) => {
            make.left.right.inset(16);
            make.top.inset(14);
            make.bottom.inset(14);
          },
          views: [
            {
              type: "label",
              props: {
                text: "本话开始 · 到顶了",
                font: $font("bold", 15),
                textColor: $color("#ffffff"),
                align: $align.center
              },
              layout: (make, view) => {
                make.top.inset(16);
                make.centerX.equalTo(view.super);
              }
            },
            {
              type: "label",
              props: {
                text: prevChapter ? `继续下拉/上滑拉动返回上一话: ${prevChapter.title}` : "已是第一话，前面没有更多章节",
                font: $font(13),
                textColor: prevChapter ? $color("#3498db") : $color("#888888"),
                align: $align.center
              },
              layout: (make, view) => {
                make.top.equalTo(view.prev.bottom).offset(8);
                make.left.right.inset(16);
              }
            },
            {
              type: "button",
              props: {
                title: prevChapter ? "立即返回上一话 ‹" : "已是第一话",
                font: $font("bold", 13),
                bgcolor: prevChapter ? $color("#2c3e50") : $color("#222222"),
                titleColor: prevChapter ? $color("#ffffff") : $color("#666666"),
                radius: 17
              },
              layout: (make, view) => {
                make.bottom.inset(14);
                make.centerX.equalTo(view.super);
                make.width.equalTo(180);
                make.height.equalTo(34);
              },
              events: {
                tapped: () => {
                  if (prevChapter) {
                    doTransitionToPrev();
                  } else {
                    $ui.toast("已经是第一话了");
                  }
                }
              }
            }
          ]
        }
      ]
    };
  }

  // 构建条漫底部过渡卡片（触底/上滑进入下一话）
  function buildListFooter(nextChapter) {
    return {
      type: "view",
      props: {
        height: 180,
        bgcolor: $color("black")
      },
      views: [
        {
          type: "view",
          props: {
            bgcolor: $color("#1c1c1e"),
            radius: 12
          },
          layout: (make, view) => {
            make.left.right.inset(16);
            make.top.inset(16);
            make.bottom.inset(16);
          },
          views: [
            {
              type: "label",
              props: {
                text: "本话阅读完毕",
                font: $font("bold", 15),
                textColor: $color("#ffffff"),
                align: $align.center
              },
              layout: (make, view) => {
                make.top.inset(16);
                make.centerX.equalTo(view.super);
              }
            },
            {
              type: "label",
              props: {
                text: nextChapter ? `继续上滑或点击进入: ${nextChapter.title}` : "已读至全书最新话，暂无更多章节",
                font: $font(13),
                textColor: nextChapter ? $color("#3498db") : $color("#888888"),
                align: $align.center
              },
              layout: (make, view) => {
                make.top.equalTo(view.prev.bottom).offset(8);
                make.left.right.inset(16);
              }
            },
            {
              type: "button",
              props: {
                title: nextChapter ? "立即进入下一话 ›" : "返回漫画详情",
                font: $font("bold", 13),
                bgcolor: nextChapter ? $color("#3498db") : $color("#333333"),
                titleColor: $color("#ffffff"),
                radius: 17
              },
              layout: (make, view) => {
                make.bottom.inset(14);
                make.centerX.equalTo(view.super);
                make.width.equalTo(180);
                make.height.equalTo(34);
              },
              events: {
                tapped: () => {
                  if (nextChapter) {
                    doTransitionToNext();
                  } else {
                    $ui.pop();
                  }
                }
              }
            }
          ]
        }
      ]
    };
  }

  // 构建条漫数据
  function buildListData(urls, curChapter) {
    return urls.map((url, idx) => ({
      lblPage: { text: `第 ${idx + 1} / ${urls.length} 页` },
      comicImg: {
        source: {
          url: url,
          header: {
            "User-Agent": UA,
            "Referer": curChapter.url || "https://tw.manhuagui.com/"
          }
        }
      }
    }));
  }

  // 构建条漫控件配置
  function buildListView(listData, prevChapter, nextChapter, isHidden) {
    return {
      type: "list",
      props: {
        id: "readerList",
        hidden: !isHidden,
        bgcolor: $color("black"),
        separatorHidden: true,
        pullToRefresh: true,
        rowHeight: $device.info.screen.width * 1.42,
        template: {
          props: { bgcolor: $color("black") },
          views: [
            {
              type: "label",
              props: {
                id: "lblPage",
                textColor: $color("#555555"),
                font: $font(13),
                align: $align.center
              },
              layout: (make, view) => {
                make.center.equalTo(view.super);
              }
            },
            {
              type: "image",
              props: {
                id: "comicImg",
                contentMode: $contentMode.scaleAspectFit,
                bgcolor: $color("clear")
              },
              layout: $layout.fill
            }
          ]
        },
        header: buildListHeader(prevChapter),
        footer: buildListFooter(nextChapter),
        data: listData
      },
      layout: $layout.fill,
      events: {
        didScroll: sender => {
          let offsetY = sender.contentOffset.y;
          let rowHeight = $device.info.screen.width * 1.42;
          let headerH = 160;
          if (offsetY >= 0) {
            let rowIndex = Math.floor((offsetY - headerH + rowHeight * 0.5) / rowHeight);
            let page = Math.min(Math.max(rowIndex + 1, 1), totalPages);
            if (page !== currentPage) {
              currentPage = page;
              $ui.title = `${currentChapter.title} (${currentPage}/${totalPages})`;
              Storage.saveHistory({
                comicUrl: comic.url,
                comicTitle: comic.title,
                comicCover: comic.cover,
                chapterTitle: currentChapter.title,
                chapterUrl: currentChapter.url,
                chapterIndex: currentChapterIndex,
                page: currentPage,
                totalPages: totalPages
              });
              if (onFinished) onFinished();
            }
          }
        },
        pulled: sender => {
          sender.endRefreshing();
          let adj = findAdjacentChapters(comic, currentChapter, currentChapterIndex, currentAllChapters);
          if (adj.prev) {
            doTransitionToPrev();
          } else {
            $ui.toast("已经是第一话了");
          }
        },
        didReachBottom: sender => {
          sender.endFetchingMore();
          let adj = findAdjacentChapters(comic, currentChapter, currentChapterIndex, currentAllChapters);
          if (adj.next) {
            doTransitionToNext();
          } else {
            $ui.toast("已经是最后一话了");
          }
        }
      }
    };
  }

  // 选话菜单弹窗
  function showChapterMenu() {
    let adj = findAdjacentChapters(comic, currentChapter, currentChapterIndex, currentAllChapters);
    let actions = [];

    if (adj.prev) {
      actions.push({
        title: `上一话: ${adj.prev.title}`,
        handler: () => {
          switchToSpecificChapter(adj.prev, adj.realIndex - 1, adj.chapters, true);
        }
      });
    }

    if (adj.next) {
      actions.push({
        title: `下一话: ${adj.next.title}`,
        handler: () => {
          switchToSpecificChapter(adj.next, adj.realIndex + 1, adj.chapters, false);
        }
      });
    }

    actions.push({
      title: "取消",
      style: "Cancel"
    });

    $ui.action({
      title: "切换章节",
      message: `${comic.title} · 当前: ${currentChapter.title}`,
      actions: actions
    });
  }

  // 通过菜单跳转指定章节（isPrev 为真时自动定位到最后一页）
  function switchToSpecificChapter(targetChapter, targetIndex, targetChapters, isPrev = false) {
    $ui.loading(true);
    $http.get({
      url: targetChapter.url,
      header: { "User-Agent": UA, "Cookie": "isAdult=1" },
      handler: resp => {
        $ui.loading(false);
        if (!resp.data) {
          $ui.error("章节数据加载失败");
          return;
        }
        let data = decryptImgData(resp.data);
        if (!data || !data.files || data.files.length === 0) {
          $ui.error("图片解密失败");
          return;
        }
        let path = data.path || "";
        let e = data.sl ? data.sl.e : "";
        let m = data.sl ? data.sl.m : "";
        let urls = data.files.map(file => encodeURI(`${IMG_HOST}${path}${file}`) + `?e=${e}&m=${m}`);
        let startPage = isPrev ? urls.length : 1;
        applyChapter(targetChapter, urls, targetIndex, targetChapters, startPage);
      }
    });
  }

  // 配置阅读器手势（画廊模式下上滑回到上一话）
  function setupReaderGestures() {
    let wrapper = $("readerWrapper");
    if (!wrapper) return;
    try {
      let dirUp = (typeof $swipeGestureDirection !== "undefined" && $swipeGestureDirection.up) ? $swipeGestureDirection.up : 4;
      wrapper.addGesture({
        type: "swipe",
        direction: dirUp,
        handler: () => {
          if (isVerticalMode) return;
          let adj = findAdjacentChapters(comic, currentChapter, currentChapterIndex, currentAllChapters);
          if (adj.prev) {
            $ui.toast(`上滑返回上一话: ${adj.prev.title}`);
            doTransitionToPrev();
          } else {
            $ui.toast("已经是第一话了");
          }
        }
      });
    } catch (e) {
      console.log("setupReaderGestures error:", e);
    }
  }

  // 初始相邻章节解析
  let initAdj = findAdjacentChapters(comic, currentChapter, currentChapterIndex, currentAllChapters);
  currentChapterIndex = initAdj.realIndex;
  currentAllChapters = initAdj.chapters;
  let nextChapter = initAdj.next;
  let prevChapter = initAdj.prev;

  let galleryItems = buildGalleryItems(currentImageUrls, currentChapter, nextChapter);
  let listData = buildListData(currentImageUrls, currentChapter);
  let galleryPageIndex = currentPage - 1;

  let navButtons = [
    {
      title: "条漫模式",
      id: "btnMode",
      handler: () => switchMode()
    },
    {
      title: "选话",
      handler: () => showChapterMenu()
    }
  ];

  $ui.push({
    props: {
      id: "readerContainer",
      title: `${currentChapter.title} (${currentPage}/${totalPages})`,
      bgcolor: $color("black"),
      navButtons: navButtons
    },
    views: [
      {
        type: "view",
        props: {
          id: "readerWrapper"
        },
        layout: $layout.fill,
        views: [
          buildGalleryView(galleryItems, galleryPageIndex, isVerticalMode),
          buildListView(listData, prevChapter, nextChapter, isVerticalMode)
        ]
      }
    ]
  });

  setupReaderGestures();

  // 若初始页大于 1（例如恢复历史记录或从后一话回退至末页），画廊与条漫平滑定位
  if (currentPage > 1) {
    $delay(0.05, () => {
      let g = $("readerGallery");
      if (g) g.page = galleryPageIndex;
    });

    let targetRow = Math.min(currentPage - 1, currentImageUrls.length - 1);
    let doScroll = () => {
      let list = $("readerList");
      if (list) {
        try {
          list.scrollTo({
            indexPath: $indexPath(0, targetRow),
            position: (typeof $scrollPosition !== "undefined" && $scrollPosition.bottom) ? $scrollPosition.bottom : 3,
            animated: false
          });
        } catch (e) {
          list.scrollTo({ indexPath: $indexPath(0, targetRow), animated: false });
        }
      }
    };
    $delay(0.05, doScroll);
    $delay(0.15, doScroll);
  }

  recordProgress(currentPage);

  // 启动预加载上一话与下一话
  if (nextChapter) prefetchChapter(nextChapter, false);
  if (prevChapter) prefetchChapter(prevChapter, true);

  // 如果没有全章节列表（如从历史记录直接进入），后台拉取漫画详情补齐章节表并预加载
  if ((!currentAllChapters || currentAllChapters.length === 0) && comic.url) {
    $http.get({
      url: comic.url,
      header: { "User-Agent": UA, "Cookie": "isAdult=1" },
      handler: resp => {
        if (resp.data) {
          let detail = parseComicDetail(resp.data, comic.url);
          comic.sections = detail.sections;
          let newAdj = findAdjacentChapters(comic, currentChapter, currentChapterIndex, []);
          currentChapterIndex = newAdj.realIndex;
          currentAllChapters = newAdj.chapters;
          if (newAdj.next) prefetchChapter(newAdj.next, false);
          if (newAdj.prev) prefetchChapter(newAdj.prev, true);
        }
      }
    });
  }
}

// ================= 启动入口 =================
renderMainUI();

// ==UserScript==
// @name         South Plus +++
// @namespace    https://south-plus.org/
// @version      0.0.1
// @description  Local-only browsing improvements for South Plus: compact layout, quick navigation, read state, and local block rules.
// @author       local
// @match        https://south-plus.org/*
// @match        https://www.south-plus.net/*
// @match        https://bbs.blue-plus.net/*
// @match        https://white-plus.net/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

/*
 * 使用说明：
 * 1. 将本脚本安装到 Tampermonkey / Violentmonkey 等用户脚本管理器后启用。
 * 2. 打开匹配的 South Plus 站点页面，脚本会自动生效，无需手动执行。
 * 3. 默认提供紧凑布局、阅读优化、快速导航、已读标记、关注主题和本地屏蔽规则等增强功能。
 * 4. 所有设置与已读/关注状态仅保存在当前浏览器本地，不会上传到服务器。
 */

(function factoryWrapper(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(true);
    return;
  }

  var api = factory(false);
  api.init();
})(typeof globalThis !== 'undefined' ? globalThis : this, function createSouthPlusEnhancer(testMode) {
  'use strict';

  var APP = 'spEnhancer';
  var STORE_KEY = APP + ':settings:v1';
  var READ_KEY = APP + ':readThreads:v1';
  var WATCH_KEY = APP + ':watchThreads:v1';
  var DEFAULT_SETTINGS = {
    cleanMode: true,
    readerMode: true,
    immersiveRead: true,
    immersiveFontSize: 20,
    unifiedPreviewGallery: true,
    homeDashboard: true,
    adBlock: true,
    compactRead: true,
    unreadOnly: false,
    onlyOriginalAuthor: false,
    foldQuotes: true,
    hideUserProfile: false,
    titleKeywords: [],
    authorKeywords: [],
    quickReplies: [
      '感谢分享',
      '支持一下',
      '楼主辛苦了',
      '感谢楼主分享',
      '收藏备用',
      '马克一下',
      '先顶后看',
      '感谢整理',
      '资源很棒',
      '正好需要',
      '学习一下',
      '感谢补档',
    ],
  };

  function parseThreadId(value) {
    var text = String(value || '');
    var match =
      text.match(/(?:^|[_-])(?:td|ajax)_(\d+)(?:\D|$)/) ||
      text.match(/(?:td|a_ajax)_(\d+)/) ||
      text.match(/[?&]tid=(\d+)/) ||
      text.match(/[?&]tid-(\d+)/) ||
      text.match(/read\.php\?tid[=-](\d+)/);
    return match ? match[1] : '';
  }

  function parseLineList(value) {
    var seen = {};
    return String(value || '')
      .split(/\r?\n/)
      .map(function trimLine(line) {
        return line.trim();
      })
      .filter(function keepUnique(line) {
        if (!line || seen[line]) return false;
        seen[line] = true;
        return true;
      });
  }

  function parseQuickReplyList(value) {
    return parseLineList(value).slice(0, 30);
  }

  function containsAny(value, needles) {
    var haystack = String(value || '').toLowerCase();
    return (needles || []).some(function hasNeedle(needle) {
      return haystack.indexOf(String(needle || '').toLowerCase()) !== -1;
    });
  }

  function matchesBlockRules(item, rules) {
    var data = item || {};
    var config = rules || {};
    return (
      containsAny(data.title, config.titleKeywords) ||
      containsAny(data.author, config.authorKeywords)
    );
  }

  function parseForumFilterQuery(query) {
    var result = {
      includes: [],
      excludes: [],
      author: '',
    };
    String(query || '')
      .split(/\s+/)
      .map(function trimToken(token) {
        return token.trim();
      })
      .filter(Boolean)
      .forEach(function parseToken(token) {
        if (/^(?:作者|author):/i.test(token)) {
          result.author = token.replace(/^(?:作者|author):/i, '').toLowerCase();
          return;
        }
        if (token.charAt(0) === '!') {
          var excluded = token.slice(1);
          if (excluded) result.excludes.push(excluded.toLowerCase());
          return;
        }
        result.includes.push(token.toLowerCase());
      });
    return result;
  }

  function matchesForumFilter(item, query) {
    var parsed = typeof query === 'string' ? parseForumFilterQuery(query) : (query || {});
    var data = item || {};
    var title = String(data.title || '').toLowerCase();
    var author = String(data.author || '').toLowerCase();
    var combined = title + ' ' + author;

    if (parsed.author && author.indexOf(parsed.author) === -1) return false;
    if ((parsed.excludes || []).some(function hasExcluded(token) {
      return token && combined.indexOf(token) !== -1;
    })) {
      return false;
    }
    return (parsed.includes || []).every(function hasIncluded(token) {
      return !token || combined.indexOf(token) !== -1;
    });
  }

  function extractPreviewImageUrls(images, pageUrl) {
    var seen = {};
    return (images || [])
      .filter(isPreviewImageCandidate)
      .map(function toAbsoluteUrl(image) {
        try {
          return new URL(String(image.src || ''), pageUrl || location.href).href;
        } catch (error) {
          return '';
        }
      })
      .filter(function keepUnique(url) {
        if (!url || seen[url]) return false;
        seen[url] = true;
        return true;
      })
      .slice(0, 6);
  }

  function isVisibleThreadRow(row) {
    if (!row) return false;
    if (row.offsetParent === null) return false;
    if (row.classList && row.classList.contains('spx-filter-hidden')) return false;
    return true;
  }

  function markThreadsRead(items, state, timestamp) {
    var target = state || {};
    target.read = target.read || {};
    (items || []).forEach(function markItemRead(item) {
      if (!item || !item.id || !isVisibleThreadRow(item.row)) return;
      target.read[item.id] = timestamp || Date.now();
    });
    return target.read;
  }

  function findThreadIdsByAuthor(items, author) {
    var needle = String(author || '').toLowerCase();
    if (!needle) return [];
    return (items || [])
      .filter(function sameAuthor(item) {
        return String((item && item.author) || '').toLowerCase() === needle;
      })
      .map(function getThreadId(item) {
        return item.id;
      })
      .filter(Boolean);
  }

  function isPreviewImageCandidate(image) {
    var data = image || {};
    var src = String(data.src || '');
    var width = Number(data.naturalWidth || data.width || 0);
    var height = Number(data.naturalHeight || data.height || 0);
    var postIndex = Number(data.postIndex || 0);

    if (postIndex !== 0) return false;
    if (!src) return false;
    if (/\/images\/post\/smile\//i.test(src)) return false;
    if (/\/images\/.*(?:face|smile|emotion)/i.test(src)) return false;
    if (width === 0 && height === 0) return true;
    return width >= 120 || height >= 120;
  }

  function parseTodayCount(text) {
    var match = String(text || '').match(/\((\d+)\)\s*$/);
    return match ? Number(match[1]) : 0;
  }

  function isAdUrl(url) {
    var text = String(url || '').toLowerCase();
    return /(?:taobao|tmall|alimama|doubleclick|googlesyndication|adservice)/.test(text);
  }

  function detectPageType(url) {
    var text = String(url || '');
    if (/\/simple\//.test(text)) return 'simple';
    if (/\/read\.php\?tid[=-]\d+/.test(text)) return 'read';
    if (/\/post\.php(?:[?#].*)?$/.test(text) || /\/post\.php\?/.test(text)) return 'post';
    if (/\/thread\.php\?fid[=-]\d+/.test(text)) return 'forum';
    if (/\/search2?\.php(?:[?#].*)?$/.test(text)) return 'search';
    if (/\/(?:u|profile|userpay|message)\.php(?:[?#].*)?$/.test(text)) return 'profile';
    if (/\/(?:index\.php)?(?:[?#].*)?$/.test(text)) return 'home';
    return 'other';
  }

  function shouldUseImmersiveRead(settings, url) {
    return !!(settings && settings.immersiveRead) && detectPageType(url) === 'read';
  }

  function shouldUseReaderMode(settings, url) {
    var type = detectPageType(url);
    return !!(settings && settings.readerMode) && (type === 'read' || type === 'forum');
  }

  function shouldUseSiteShell(url) {
    return true;
  }

  function shouldUseForumDashboard(url) {
    return detectPageType(url) === 'forum';
  }

  function shouldUseForumKeyboardPaging(url) {
    return detectPageType(url) === 'forum';
  }

  function shouldUseSearchPage(url) {
    return detectPageType(url) === 'search';
  }

  function shouldUseProfilePage(url) {
    return detectPageType(url) === 'profile';
  }

  function shouldUseHomeDashboard(settings, url) {
    return !!(settings && settings.homeDashboard) && detectPageType(url) === 'home';
  }

  function shouldShowToolbarFeature(feature) {
    return feature !== 'latest' && feature !== 'clean';
  }

  function hasPreviewGalleryImages(root) {
    var scope = root || document;
    var firstPost = qsa('table.js-post', scope)[0];
    var content = firstPost ? qs('.tpc_content', firstPost) : null;
    if (!content) return false;

    return qsa('img', content)
      .map(function mapPreviewCandidate(img) {
        return {
          src: img.currentSrc || img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          postIndex: 0,
        };
      })
      .some(isPreviewImageCandidate);
  }

  function shouldShowToolbarAction(action, url, root) {
    var type = detectPageType(url);
    var page = currentPageNumber(url);

    if (action === 'prevPage') return (type === 'forum' || type === 'read') && page > 1;
    if (action === 'nextPage') return type === 'forum' || type === 'read';
    if (action === 'home') return type !== 'home';
    if (action === 'reader') return type === 'forum' || type === 'read';
    if (action === 'adBlock') return type !== 'simple';
    if (action === 'homeDashboard') return type === 'home';
    if (action === 'immersiveRead') return type === 'read';
    if (action === 'previewGallery') return type === 'read' && hasPreviewGalleryImages(root);
    if (action === 'unreadOnly') return type === 'forum';
    if (action === 'onlyOriginalAuthor') return type === 'read';
    return true;
  }

  function getSettingsPanelKeys(url, root) {
    var keys = [];
    var allKeys = [
      'adBlock',
      'cleanMode',
      'homeDashboard',
      'readerMode',
      'immersiveRead',
      'unifiedPreviewGallery',
      'compactRead',
      'foldQuotes',
      'hideUserProfile',
      'unreadOnly',
      'onlyOriginalAuthor',
    ];

    allKeys.forEach(function keepUsefulSetting(key) {
      if (key === 'adBlock' && shouldShowToolbarAction('adBlock', url, root)) keys.push(key);
      if (key === 'cleanMode' && shouldShowToolbarFeature('clean')) keys.push(key);
      if (key === 'homeDashboard' && shouldShowToolbarAction('homeDashboard', url, root)) keys.push(key);
      if (key === 'readerMode' && shouldShowToolbarAction('reader', url, root)) keys.push(key);
      if (key === 'immersiveRead' && shouldShowToolbarAction('immersiveRead', url, root)) keys.push(key);
      if (key === 'unifiedPreviewGallery' && shouldShowToolbarAction('previewGallery', url, root)) keys.push(key);
      if (key === 'compactRead' && detectPageType(url) === 'read') keys.push(key);
      if (key === 'foldQuotes' && detectPageType(url) === 'read') keys.push(key);
      if (key === 'hideUserProfile' && detectPageType(url) === 'read') keys.push(key);
      if (key === 'unreadOnly' && shouldShowToolbarAction('unreadOnly', url, root)) keys.push(key);
      if (key === 'onlyOriginalAuthor' && shouldShowToolbarAction('onlyOriginalAuthor', url, root)) keys.push(key);
    });

    return keys;
  }

  function buildPageUrl(url, page) {
    var targetPage = Math.max(1, Number(page) || 1);
    var parsed = new URL(String(url || ''), 'https://south-plus.org/');
    var href = parsed.href;
    var thread = href.match(/read\.php\?tid[=-](\d+)/);
    var forum = href.match(/thread\.php\?fid[=-](\d+)/);

    if (thread) {
      return parsed.origin + '/read.php?tid-' + thread[1] + '-page-' + targetPage + '.html';
    }

    if (forum) {
      if (targetPage === 1) {
        return parsed.origin + '/thread.php?fid-' + forum[1] + '.html';
      }
      return parsed.origin + '/thread.php?fid-' + forum[1] + '-page-' + targetPage + '.html';
    }

    return href;
  }

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function getStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  }

  function loadSettings() {
    var storage = getStorage();
    if (!storage) return copySettings(DEFAULT_SETTINGS);
    var stored = safeJsonParse(storage.getItem(STORE_KEY), {});
    return Object.assign(copySettings(DEFAULT_SETTINGS), stored || {});
  }

  function saveSettings(settings) {
    var storage = getStorage();
    if (!storage) return;
    storage.setItem(STORE_KEY, JSON.stringify(settings));
  }

  function copySettings(settings) {
    return JSON.parse(JSON.stringify(settings));
  }

  function loadMap(key) {
    var storage = getStorage();
    if (!storage) return {};
    return safeJsonParse(storage.getItem(key), {}) || {};
  }

  function saveMap(key, map) {
    var storage = getStorage();
    if (!storage) return;
    storage.setItem(key, JSON.stringify(map || {}));
  }

  function currentPageNumber(url) {
    var text = String(url || '');
    var match = text.match(/-page-(\d+)/);
    return match ? Number(match[1]) : 1;
  }

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function createEl(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
  }

  function getInjectedStyleText() {
    return [
      ':root{--spx-bg:#f7f8fb;--spx-panel:#fff;--spx-line:#cbd5e1;--spx-text:#1f2937;--spx-sub:#64748b;--spx-accent:#0f766e;--spx-warn:#b45309;}',
      '.spx-adblock .spx-ad-hidden{display:none!important;}',
      '.spx-adblock #banner a[href*="taobao"],.spx-adblock #banner a[href*="tmall"],.spx-adblock #banner a[href*="equity"]{display:none!important;}',
      '.spx-adblock a[href*="taobao"],.spx-adblock a[href*="tmall"],.spx-adblock a[href*="alimama"]{display:none!important;}',
      '.spx-adblock img[src*="taobao"],.spx-adblock img[src*="tmall"],.spx-adblock img[src*="alimama"]{display:none!important;}',
      '.spx-adblock #banner{min-height:0!important;}',
      '.spx-site-shell,.spx-site-shell body{width:100%!important;min-width:0!important;background:#eef2f5!important;color:#172033!important;font:14px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif!important;}',
      '.spx-site-shell a{color:#075985!important;text-decoration:none!important;}',
      '.spx-site-shell a:hover{text-decoration:underline!important;}',
      '.spx-site-shell #wrapA,.spx-site-shell #main{box-sizing:border-box!important;width:100%!important;max-width:none!important;background:#eef2f5!important;}',
      '.spx-site-shell #header,.spx-site-shell #mainNav,.spx-site-shell #infobox,.spx-site-shell #notice,.spx-site-shell #content,.spx-site-shell #main{box-sizing:border-box!important;width:min(1680px,calc(100vw - 44px))!important;margin-left:auto!important;margin-right:auto!important;}',
      '.spx-site-shell #mainNav{display:block!important;height:28px!important;border-radius:8px!important;box-shadow:0 4px 16px rgba(15,23,42,.08)!important;overflow:visible!important;}',
      '.spx-site-shell #mainNav>div[style*="padding-left"]{box-sizing:border-box!important;width:100%!important;max-width:100%!important;height:28px!important;padding-left:250px!important;overflow:visible!important;}',
      '.spx-site-shell #mainNav>div[style*="padding-left"] table,.spx-site-shell #mainNav>div[style*="padding-left"] tbody,.spx-site-shell #mainNav>div[style*="padding-left"] tr,.spx-site-shell #mainNav>div[style*="padding-left"] td{display:block!important;box-sizing:border-box!important;width:auto!important;height:28px!important;margin:0!important;padding:0!important;border:0!important;}',
      '.spx-site-shell #guide{display:flex!important;float:none!important;align-items:center!important;justify-content:flex-start!important;flex-wrap:nowrap!important;width:max-content!important;max-width:100%!important;margin:0!important;padding:0!important;overflow:visible!important;white-space:nowrap!important;}',
      '.spx-site-shell #guide>li{display:block!important;float:none!important;width:auto!important;min-width:max-content!important;margin:0!important;white-space:nowrap!important;}',
      '.spx-site-shell #guide>#h_push,.spx-site-shell #guide>#h_hack{display:none!important;}',
      '.spx-site-shell #guide>li>a{display:flex!important;float:none!important;align-items:center!important;height:28px!important;line-height:28px!important;padding:0 10px!important;white-space:nowrap!important;font-size:13px!important;font-weight:800!important;}',
      '.spx-site-shell #guide>li.current>a,.spx-site-shell #guide>li.spx-nav-active>a,.spx-site-shell #guide>li>a.spx-menu-open{background:linear-gradient(#d92831,#9f0007)!important;color:#fff!important;text-decoration:none!important;}',
      '.spx-site-shell #guide .spx-peacemaker-nav{position:relative!important;width:auto!important;min-width:max-content!important;overflow:visible!important;}',
      '.spx-site-shell #peacemakerconfig{position:relative!important;overflow:visible!important;color:#075985!important;}',
      '.spx-site-shell #peacemakerconfig.spx-menu-open{color:#fff!important;}',
      '.spx-site-shell #peacemakerconfig>div[hidden]{display:none!important;}',
      '.spx-site-shell #peacemakerconfig>div:not([hidden]){display:block!important;position:absolute!important;top:28px!important;right:0!important;left:auto!important;z-index:10000!important;width:142px!important;min-width:142px!important;margin:0!important;padding:4px!important;border:1px solid #0f172a!important;border-radius:6px!important;background:#fff!important;color:#0f172a!important;box-shadow:0 12px 28px rgba(15,23,42,.22)!important;line-height:1.4!important;}',
      '.spx-site-shell #peacemakerconfig>div:not([hidden])>div{box-sizing:border-box!important;display:block!important;margin:0!important;padding:6px 8px!important;background:#f8fafc!important;color:#0f172a!important;text-align:left!important;line-height:1.4!important;border-radius:4px!important;}',
      '.spx-site-shell #peacemakerconfig>div:not([hidden])>div:hover{background:#e0f2fe!important;}',
      '.spx-search-page #wrapA,.spx-search-page #main{box-sizing:border-box!important;max-width:none!important;background:#eef2f5!important;}',
      '.spx-search-page #main{box-sizing:border-box!important;width:min(1680px,calc(100vw - 44px))!important;margin:16px auto 42px!important;padding:0!important;display:block!important;}',
      '.spx-search-page .t{box-sizing:border-box!important;width:100%!important;margin:0 0 14px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;overflow:hidden!important;}',
      '.spx-search-page .tr1,.spx-search-page .tr2,.spx-search-page .tr3{font-size:14px!important;line-height:1.6!important;}',
      '.spx-search-page .tr3 td,.spx-search-page .tr1 td{padding:8px 10px!important;}',
      '.spx-search-page input[type="text"],.spx-search-page input[type="search"],.spx-search-page input[name="keyword"],.spx-search-page input[name="username"]{box-sizing:border-box!important;width:min(520px,calc(100vw - 96px))!important;min-width:min(420px,calc(100vw - 96px))!important;height:34px!important;padding:5px 10px!important;border:1px solid #cbd5e1!important;border-radius:5px!important;background:#fff!important;color:#172033!important;font-size:16px!important;line-height:22px!important;}',
      '.spx-search-page input[type="text"]:focus,.spx-search-page input[type="search"]:focus,.spx-search-page input[name="keyword"]:focus,.spx-search-page input[name="username"]:focus{border-color:#0f766e!important;box-shadow:0 0 0 2px rgba(15,118,110,.14)!important;outline:none!important;}',
      '.spx-profile-page #wrapA,.spx-profile-page #main{box-sizing:border-box!important;max-width:none!important;background:#eef2f5!important;}',
      '.spx-profile-page #main,.spx-profile-page #content{box-sizing:border-box!important;width:min(1680px,calc(100vw - 44px))!important;margin:16px auto 42px!important;padding:0!important;display:block!important;}',
      '.spx-profile-page #main>*{box-sizing:border-box!important;width:100%!important;max-width:none!important;}',
      '.spx-profile-page #main>.bdbA,.spx-profile-page #main>.t{margin-left:0!important;margin-right:0!important;}',
      '.spx-account-tabs{box-sizing:border-box!important;display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;width:100%!important;margin:0 0 14px!important;padding:12px 14px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;}',
      '.spx-account-tabs a{display:flex!important;align-items:center!important;justify-content:center!important;min-height:34px!important;padding:0 16px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#f8fafc!important;color:#075985!important;font-size:15px!important;font-weight:800!important;line-height:1.2!important;text-decoration:none!important;}',
      '.spx-account-tabs a.spx-account-tab-active,.spx-account-tabs a:hover{background:#e0f2fe!important;border-color:#7dd3fc!important;color:#0369a1!important;text-decoration:none!important;}',
      '.spx-profile-page #u-wrap,.spx-profile-page #u-wrap2{box-sizing:border-box!important;width:100%!important;max-width:none!important;background:#fff!important;overflow:visible!important;}',
      '.spx-profile-page #u-wrap2{display:grid!important;grid-template-columns:minmax(220px,300px) minmax(0,1fr)!important;gap:24px!important;padding:18px!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;}',
      '.spx-profile-page #u-sidebar{box-sizing:border-box!important;float:none!important;width:auto!important;min-width:0!important;}',
      '.spx-profile-page #u-sidebar .bdbA,.spx-profile-page #u-sidebar .bgA{box-sizing:border-box!important;width:100%!important;max-width:100%!important;margin:0 0 12px!important;padding:8px 12px!important;background:#fff!important;border:0!important;border-bottom:1px solid #e2e8f0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important;}',
      '.spx-profile-page #u-sidebar .bdbA:last-child,.spx-profile-page #u-sidebar .bgA:last-child{margin-bottom:0!important;}',
      '.spx-profile-page #u-content{box-sizing:border-box!important;float:none!important;width:auto!important;min-width:0!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px 24px!important;}',
      '.spx-profile-page #u-contentmain{box-sizing:border-box!important;grid-column:1/-1!important;float:none!important;width:100%!important;min-width:0!important;max-width:none!important;}',
      '.spx-profile-page #u-contentside{display:none!important;}',
      '.spx-profile-page #u-top{box-sizing:border-box!important;grid-column:1/-1!important;width:100%!important;height:auto!important;min-height:0!important;padding:0!important;position:static!important;}',
      '.spx-profile-page #u-top-nav{position:static!important;display:block!important;box-sizing:border-box!important;width:100%!important;height:auto!important;margin:12px 0 0!important;padding:0!important;overflow:visible!important;}',
      '.spx-profile-page #u-top-nav .b{display:flex!important;float:none!important;align-items:center!important;justify-content:flex-start!important;flex-wrap:wrap!important;gap:8px!important;width:100%!important;height:auto!important;margin:0!important;padding:0!important;list-style:none!important;overflow:visible!important;}',
      '.spx-profile-page #u-top-nav .b>li{display:block!important;float:none!important;width:auto!important;height:auto!important;margin:0!important;padding:0!important;list-style:none!important;}',
      '.spx-profile-page #u-top-nav .b>li>a{display:flex!important;align-items:center!important;justify-content:center!important;min-height:34px!important;padding:0 16px!important;margin:0!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#f8fafc!important;color:#075985!important;font-size:15px!important;font-weight:800!important;line-height:1.2!important;text-decoration:none!important;}',
      '.spx-profile-page #u-top-nav .b>li.current>a,.spx-profile-page #u-top-nav .b>li>a:hover{background:#e0f2fe!important;border-color:#7dd3fc!important;color:#0369a1!important;text-decoration:none!important;}',
      '.spx-profile-page.spx-account-tabs-ready #u-top-nav{display:none!important;}',
      '.spx-profile-page .u-content-66,.spx-profile-page .u-content-33{box-sizing:border-box!important;float:none!important;width:auto!important;min-width:0!important;}',
      '.spx-profile-page .u-profile,.spx-profile-page #u-content>.c{grid-column:1/-1!important;}',
      '.spx-site-shell:not(.spx-reader) .bdbA,.spx-site-shell:not(.spx-reader) .t,.spx-site-shell:not(.spx-reader) .t3,.spx-site-shell:not(.spx-reader) .t5{box-sizing:border-box!important;width:min(1680px,calc(100vw - 44px))!important;margin:16px auto 14px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;overflow:hidden!important;}',
      '.spx-site-shell:not(.spx-reader) .t,.spx-site-shell:not(.spx-reader) .t3,.spx-site-shell:not(.spx-reader) .t5{display:block!important;}',
      '.spx-site-shell:not(.spx-reader) .tr1,.spx-site-shell:not(.spx-reader) .tr2,.spx-site-shell:not(.spx-reader) .tr3{font-size:14px!important;line-height:1.6!important;}',
      '.spx-site-shell:not(.spx-reader) .tr3 td,.spx-site-shell:not(.spx-reader) .tr1 td,.spx-site-shell:not(.spx-reader) th,.spx-site-shell:not(.spx-reader) td{padding:8px 10px!important;}',
      '.spx-site-shell #set-wrap{display:grid!important;grid-template-columns:minmax(190px,240px) minmax(0,1fr)!important;gap:16px!important;box-sizing:border-box!important;width:100%!important;max-width:none!important;margin:16px auto 42px!important;padding:0!important;background:transparent!important;line-height:1.6!important;}',
      '.spx-site-shell #set-side,.spx-site-shell #set-content{box-sizing:border-box!important;float:none!important;width:auto!important;min-width:0!important;margin:0!important;padding:0!important;background:transparent!important;}',
      '.spx-site-shell #set-side-wrap,.spx-site-shell #set-content-wrap{box-sizing:border-box!important;width:100%!important;min-width:0!important;margin:0!important;padding:14px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;overflow:visible!important;}',
      '.spx-site-shell #set-side .set-h2{box-sizing:border-box!important;margin:0 0 10px!important;padding:0 2px 10px!important;border-bottom:1px solid #e2e8f0!important;color:#0f172a!important;font-size:16px!important;line-height:1.35!important;font-weight:800!important;}',
      '.spx-site-shell #set-menu{box-sizing:border-box!important;display:flex!important;flex-direction:column!important;gap:6px!important;width:100%!important;margin:0!important;padding:0!important;list-style:none!important;background:transparent!important;}',
      '.spx-site-shell #set-menu>li{display:block!important;width:100%!important;margin:0!important;padding:0!important;list-style:none!important;background:transparent!important;}',
      '.spx-site-shell #set-menu>li>a{display:flex!important;align-items:center!important;min-height:34px!important;box-sizing:border-box!important;width:100%!important;padding:0 12px!important;margin:0!important;border:1px solid #e2e8f0!important;border-radius:8px!important;background:#f8fafc!important;color:#075985!important;font-size:14px!important;font-weight:700!important;line-height:1.25!important;text-decoration:none!important;}',
      '.spx-site-shell #set-menu>li.current>a,.spx-site-shell #set-menu>li>a:hover{background:#e0f2fe!important;border-color:#7dd3fc!important;color:#0369a1!important;text-decoration:none!important;}',
      '.spx-profile-page.spx-account-tabs-ready #set-side{display:none!important;}',
      '.spx-profile-page.spx-account-tabs-ready #set-wrap{grid-template-columns:minmax(0,1fr)!important;}',
      '.spx-site-shell #set-content{box-sizing:border-box!important;display:block!important;overflow:visible!important;}',
      '.spx-site-shell #set-content table{box-sizing:border-box!important;width:100%!important;max-width:100%!important;}',
      '.spx-site-shell #set-content .set-tab-table{box-sizing:border-box!important;width:100%!important;margin:0 0 12px!important;overflow:auto!important;}',
      '.spx-site-shell #set-content .set-tab-box{box-sizing:border-box!important;width:100%!important;overflow:visible!important;}',
      '.spx-reader,.spx-reader body{background:#f4f6f8!important;background-image:none!important;color:#263238!important;font:15px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif!important;}',
      '.spx-reader #wrapA,.spx-reader #main,.spx-reader #content{background:#f4f6f8!important;background-image:none!important;}',
      '.spx-reader #main>br,.spx-reader #content>br{display:none!important;}',
      '.spx-reader a{color:#075985!important;text-decoration:none!important;}',
      '.spx-reader a:hover{text-decoration:underline!important;}',
      '.spx-reader #wrapA{max-width:1240px!important;margin:0 auto!important;}',
      '.spx-reader #main,.spx-reader #content{font-size:15px!important;line-height:1.65!important;}',
      '.spx-reader .t,.spx-reader .t3,.spx-reader .t5,.spx-reader .tr1,.spx-reader .tr2,.spx-reader .tr3{font-size:15px!important;}',
      '.spx-reader .tr3 td,.spx-reader .tr1 td{padding-top:8px!important;padding-bottom:8px!important;}',
      '.spx-reader td[id^="td_"]{font-size:15px!important;line-height:1.65!important;}',
      '.spx-reader td[id^="td_"] a[id^="a_ajax_"]{font-size:16px!important;line-height:1.65!important;font-weight:600!important;}',
      '.spx-reader td[id^="td_"] .s8{display:inline-block;margin-right:6px;padding:1px 6px;border-radius:4px;background:#e8f3ff;color:#075985!important;font-size:13px!important;}',
      '.spx-reader table.js-post{box-sizing:border-box!important;width:min(1680px,calc(100vw - 64px))!important;max-width:none!important;margin:14px auto!important;background:#fff!important;border:1px solid #d9e2ec!important;border-radius:8px!important;box-shadow:0 3px 12px rgba(15,23,42,.06)!important;overflow:hidden!important;table-layout:fixed!important;}',
      '.spx-reader table.js-post>tbody>tr>th.r_two{box-sizing:border-box!important;width:128px!important;max-width:128px!important;min-width:128px!important;padding:18px 8px!important;overflow:hidden!important;vertical-align:top!important;text-align:center!important;}',
      '.spx-reader table.js-post>tbody>tr>th.r_two .user-pic{display:block!important;width:96px!important;height:96px!important;max-height:96px!important;margin:0 auto 10px!important;padding:0!important;text-align:center!important;overflow:hidden!important;}',
      '.spx-reader table.js-post>tbody>tr>th.r_two .user-pic img,.spx-reader table.js-post>tbody>tr>th.r_two>img{display:block!important;width:96px!important;max-width:96px!important;height:auto!important;margin:0 auto!important;}',
      '.spx-reader table.js-post>tbody>tr>th.r_two>a[href*="u.php"],.spx-reader table.js-post>tbody>tr>th.r_two .readprofile>a[href],.spx-reader table.js-post>tbody>tr>th.r_two .user-info>a[href]{display:block!important;margin:0 auto!important;padding:0!important;color:#075985!important;font-size:16px!important;font-weight:800!important;line-height:1.35!important;text-align:center!important;word-break:break-word!important;}',
      '.spx-reader #content>table:not(.js-post):empty,.spx-reader #main>table:not(.js-post):empty,.spx-reader #content>table:not(.js-post) td:empty,.spx-reader #main>table:not(.js-post) td:empty{display:none!important;}',
      '.spx-reader #content>table:not(.js-post),.spx-reader #main>table:not(.js-post){border:0!important;box-shadow:none!important;background:transparent!important;}',
      '.spx-reader [data-spx-read-separator-hidden="1"]{display:none!important;}',
      '.spx-reader table.js-post>tbody>tr>th.r_one{box-sizing:border-box!important;width:auto!important;min-width:0!important;}',
      '.spx-reader.spx-compact-read table.js-post>tbody>tr>th.r_two,.spx-reader.spx-hide-profile table.js-post>tbody>tr>th.r_two{width:112px!important;max-width:112px!important;min-width:112px!important;}',
      '.spx-reader table.js-post td{font-size:15px!important;line-height:1.75!important;}',
      '.spx-reader .h1,.spx-reader [id^="subject_"]{font-size:18px!important;line-height:1.55!important;font-weight:700!important;color:#111827!important;}',
      '.spx-reader .tpc_content{box-sizing:border-box!important;max-width:900px!important;margin:0 auto!important;padding:14px 18px 20px!important;font-size:17px!important;line-height:1.95!important;letter-spacing:0!important;color:#1f2937!important;word-break:break-word!important;}',
      '.spx-reader .tpc_content br{line-height:2!important;}',
      '.spx-reader .tpc_content img{max-width:100%!important;height:auto!important;border-radius:4px!important;}',
      '.spx-reader .tiptop,.spx-reader .readbot{max-width:920px!important;margin-left:auto!important;margin-right:auto!important;color:#64748b!important;}',
      '.spx-reader .signature,.spx-reader .sigline{max-width:900px!important;margin-left:auto!important;margin-right:auto!important;color:#64748b!important;font-size:13px!important;}',
      '.spx-home-dashboard,.spx-home-dashboard body{width:100%!important;min-width:0!important;overflow-x:hidden!important;background:#eef2f5!important;color:#172033!important;}',
      '.spx-home-dashboard #wrapA,.spx-home-dashboard #main{box-sizing:border-box!important;width:100vw!important;max-width:none!important;margin:0!important;padding:0!important;background:#eef2f5!important;border:0!important;}',
      '.spx-home-dashboard #content{box-sizing:border-box!important;width:min(1680px,calc(100vw - 44px))!important;margin:16px auto 42px!important;display:block!important;background:transparent!important;}',
      '.spx-home-dashboard #spx-home-grid{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr))!important;gap:14px!important;}',
      '.spx-home-dashboard #toptool,.spx-home-dashboard #footer,.spx-home-dashboard .footer,.spx-home-dashboard #cate_info{display:none!important;}',
      '.spx-home-dashboard #header,.spx-home-dashboard #mainNav,.spx-home-dashboard #infobox,.spx-home-dashboard #notice{box-sizing:border-box!important;width:min(1680px,calc(100vw - 44px))!important;margin-left:auto!important;margin-right:auto!important;}',
      '.spx-home-dashboard #header{margin-top:10px!important;}',
      '.spx-home-dashboard #mainNav{position:sticky!important;top:0!important;z-index:9990!important;border-radius:8px!important;box-shadow:0 4px 16px rgba(15,23,42,.08)!important;overflow:visible!important;}',
      '.spx-home-dashboard #notice{display:block!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;padding:10px 14px!important;box-shadow:0 4px 14px rgba(15,23,42,.05)!important;}',
      '.spx-home-dashboard #notice table,.spx-home-dashboard #notice tbody,.spx-home-dashboard #notice tr{display:block!important;width:100%!important;}',
      '.spx-home-dashboard #notice td{display:block!important;width:auto!important;padding:4px 0!important;}',
      '.spx-home-dashboard .spx-home-quick{box-sizing:border-box!important;width:min(1680px,calc(100vw - 44px))!important;margin:14px auto 0!important;display:grid!important;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))!important;gap:10px!important;}',
      '.spx-home-dashboard .spx-home-quick a{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;min-height:42px!important;padding:0 12px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;color:#0f172a!important;text-decoration:none!important;font-weight:700!important;box-shadow:0 3px 12px rgba(15,23,42,.05)!important;}',
      '.spx-home-dashboard .spx-home-quick a span{font-size:12px!important;color:#64748b!important;font-weight:500!important;}',
      '.spx-home-dashboard .spx-home-module{grid-column:span 6!important;box-sizing:border-box!important;margin:0!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;overflow:hidden!important;}',
      '.spx-home-dashboard .spx-home-module[data-spx-large="1"]{grid-column:span 12!important;}',
      '.spx-home-dashboard .spx-home-module>h2,.spx-home-dashboard .spx-home-module .h{display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:38px!important;padding:0 14px!important;margin:0!important;background:#f8fafc!important;border-bottom:1px solid #e2e8f0!important;color:#0f172a!important;font-size:15px!important;font-weight:800!important;}',
      '.spx-home-dashboard .spx-home-module table,.spx-home-dashboard .spx-home-module tbody{display:block!important;width:100%!important;border:0!important;background:transparent!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr2{display:none!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr3{display:grid!important;grid-template-columns:minmax(220px,1.15fr) 120px minmax(260px,1fr)!important;gap:10px!important;align-items:center!important;margin:0!important;padding:10px 14px!important;border-bottom:1px solid #edf2f7!important;background:#fff!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr3:hover{background:#f8fbff!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr3:last-child{border-bottom:0!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr3>td{display:block!important;width:auto!important;padding:0!important;border:0!important;background:transparent!important;font-size:13px!important;line-height:1.45!important;color:#475569!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr3>td:first-child{display:none!important;}',
      '.spx-home-dashboard .spx-home-module [id^="fn_"] a,.spx-home-dashboard .spx-home-module [id^="fn_"]{font-size:15px!important;font-weight:800!important;color:#0f172a!important;line-height:1.4!important;}',
      '.spx-home-dashboard .spx-home-module [id^="desc_"]{margin-top:4px!important;color:#64748b!important;font-size:12px!important;}',
      '.spx-home-dashboard .spx-home-hot [id^="fn_"] a,.spx-home-dashboard .spx-home-hot [id^="fn_"]{color:#075985!important;}',
      '.spx-home-dashboard .spx-home-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:26px!important;height:20px!important;margin-left:6px!important;padding:0 7px!important;border-radius:999px!important;background:#e0f2fe!important;color:#0369a1!important;font-size:12px!important;font-weight:800!important;}',
      '.spx-home-dashboard .spx-home-collapse{border:0!important;background:transparent!important;color:#64748b!important;font-size:12px!important;cursor:pointer!important;}',
      '.spx-forum-dashboard,.spx-forum-dashboard body{width:100%!important;min-width:0!important;overflow-x:hidden!important;background:#eef2f5!important;color:#172033!important;}',
      '.spx-forum-dashboard #wrapA,.spx-forum-dashboard #main{box-sizing:border-box!important;width:100vw!important;max-width:none!important;margin:0!important;padding:0!important;background:#eef2f5!important;border:0!important;}',
      '.spx-forum-dashboard #content{box-sizing:border-box!important;width:min(1680px,calc(100vw - 44px))!important;margin:16px auto 42px!important;display:block!important;background:transparent!important;}',
      '.spx-forum-dashboard #content .t{box-sizing:border-box!important;width:100%!important;margin:0 0 14px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;overflow:hidden!important;}',
      '.spx-forum-dashboard #content .t table,.spx-forum-dashboard #content .t tbody{display:block!important;width:100%!important;border:0!important;background:transparent!important;}',
      '.spx-forum-dashboard #content .t tr.tr2{display:none!important;}',
      '.spx-forum-dashboard #content .t tr.tr3{display:grid!important;grid-template-columns:minmax(0,1fr) 96px 96px minmax(220px,.8fr)!important;gap:10px!important;align-items:center!important;margin:0!important;padding:10px 14px!important;border-bottom:1px solid #edf2f7!important;background:#fff!important;}',
      '.spx-forum-dashboard #content .t tr.tr3:hover{background:#f8fbff!important;}',
      '.spx-forum-dashboard #content .t tr.tr3:last-child{border-bottom:0!important;}',
      '.spx-forum-dashboard #content .t tr.tr3>td{display:block!important;width:auto!important;padding:0!important;border:0!important;background:transparent!important;font-size:13px!important;line-height:1.45!important;color:#475569!important;overflow:hidden!important;text-overflow:ellipsis!important;}',
      '.spx-forum-dashboard #content .t tr.tr3>td:first-child:not([id^="td_"]){display:none!important;}',
      '.spx-forum-dashboard td[id^="td_"]{font-size:14px!important;line-height:1.6!important;color:#475569!important;}',
      '.spx-forum-dashboard td[id^="td_"] a[id^="a_ajax_"],.spx-forum-dashboard [id^="td_"] a[href*="read.php"]{font-size:17px!important;font-weight:800!important;color:#075985!important;line-height:1.45!important;}',
      '.spx-forum-dashboard .gonggao{display:none!important;}',
      '.spx-forum-dashboard .spx-thread-tools{margin-left:8px!important;}',
      '.spx-immersive-read,.spx-immersive-read body{width:100%!important;min-width:0!important;overflow-x:hidden!important;background:#eef2f5!important;}',
      '.spx-immersive-read #toptool,.spx-immersive-read #banner,.spx-immersive-read #infobox,.spx-immersive-read #footer,.spx-immersive-read .footer,.spx-immersive-read #bottom,.spx-immersive-read #music,.spx-immersive-read #readlog,.spx-immersive-read #threadlog{display:none!important;}',
      '.spx-immersive-read #header,.spx-immersive-read #mainNav,.spx-immersive-read #breadcrumbs,.spx-immersive-read .crumbs-item{box-sizing:border-box!important;width:min(1680px,calc(100vw - 44px))!important;margin-left:auto!important;margin-right:auto!important;}',
      '.spx-immersive-read #header{margin-top:10px!important;}',
      '.spx-immersive-read #mainNav{position:sticky!important;top:0!important;z-index:9990!important;border-radius:8px!important;box-shadow:0 4px 16px rgba(15,23,42,.08)!important;overflow:visible!important;}',
      '.spx-immersive-read .bdbA{display:block!important;box-sizing:border-box!important;width:min(1680px,calc(100vw - 44px))!important;margin:10px auto 0!important;padding:0!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 4px 14px rgba(15,23,42,.05)!important;overflow:visible!important;}',
      '.spx-immersive-read #breadcrumbs{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:6px!important;width:100%!important;min-height:36px!important;margin:0!important;padding:7px 12px!important;overflow:visible!important;color:#64748b!important;font-size:13px!important;line-height:1.45!important;background:transparent!important;}',
      '.spx-immersive-read #breadcrumbs .crumbs-item{display:inline-flex!important;align-items:center!important;width:auto!important;max-width:100%!important;margin:0!important;overflow:visible!important;white-space:nowrap!important;color:#64748b!important;}',
      '.spx-immersive-read #breadcrumbs .crumbs-item.current{min-width:0!important;white-space:normal!important;color:#0f172a!important;font-weight:700!important;}',
      '.spx-immersive-read #wrapA,.spx-immersive-read #main,.spx-immersive-read #content{box-sizing:border-box!important;width:100vw!important;max-width:none!important;margin:0!important;padding:0!important;background:#eef2f5!important;border:0!important;}',
      '.spx-immersive-read #content>table:not(.js-post),.spx-immersive-read #main>table:not(.js-post){width:min(1680px,calc(100vw - 64px))!important;margin:12px auto!important;}',
      '.spx-immersive-read table.js-post{box-sizing:border-box!important;width:min(1680px,calc(100vw - 64px))!important;max-width:none!important;margin:18px auto!important;border:1px solid #d6dee8!important;border-radius:8px!important;background:#fff!important;box-shadow:0 8px 26px rgba(15,23,42,.08)!important;}',
      '.spx-immersive-read table.js-post>tbody>tr>td:first-child{display:none!important;}',
      '.spx-immersive-read table.js-post>tbody>tr>td{display:block!important;box-sizing:border-box!important;width:100%!important;padding:0!important;border:0!important;background:#fff!important;}',
      '.spx-immersive-read .spx-post-tools{box-sizing:border-box!important;max-width:980px!important;margin:0 auto!important;padding:8px 18px 0!important;color:#94a3b8!important;font-size:12px!important;opacity:.62!important;}',
      '.spx-immersive-read .spx-post-tools:hover{opacity:1!important;}',
      '.spx-immersive-read .spx-post-tools span{font-size:12px!important;font-weight:400!important;color:#94a3b8!important;}',
      '.spx-immersive-read .spx-post-tools button{font-size:12px!important;color:#94a3b8!important;border-color:#e2e8f0!important;background:#f8fafc!important;padding:1px 7px!important;}',
      '.spx-immersive-read .spx-preview-panel{box-sizing:border-box!important;max-width:100%!important;margin:0 auto 14px!important;padding:12px 18px 16px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;}',
      '.spx-immersive-read .spx-preview-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;font-size:13px!important;color:#64748b!important;}',
      '.spx-immersive-read .spx-preview-header strong{font-size:14px!important;color:#0f172a!important;}',
      '.spx-immersive-read .spx-preview-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;}',
      '.spx-immersive-read .spx-preview-item{display:block;overflow:hidden;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;text-decoration:none;}',
      '.spx-immersive-read .spx-preview-item img{display:block;width:100%;height:180px;object-fit:cover;background:#fff;}',
      '.spx-immersive-read .spx-preview-item span{display:block;padding:6px 8px;font-size:12px;line-height:1.35;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.spx-immersive-read .spx-preview-empty{padding:10px 2px;color:#94a3b8;font-size:13px;}',
      '.spx-immersive-read .spx-preview-source{display:none!important;}',
      '.spx-immersive-read .h1,.spx-immersive-read [id^="subject_"]{display:block!important;box-sizing:border-box!important;max-width:980px!important;margin:0 auto!important;padding:22px 18px 8px!important;font-size:21px!important;line-height:1.45!important;color:#111827!important;}',
      '.spx-immersive-read .tpc_content{max-width:980px!important;margin:0 auto!important;padding:18px 34px 34px!important;font-size:var(--spx-immersive-font-size,20px)!important;line-height:2.06!important;color:#172033!important;background:#fff!important;}',
      '.spx-immersive-read .tiptop,.spx-immersive-read .readbot,.spx-immersive-read .signature,.spx-immersive-read .sigline{max-width:980px!important;margin-left:auto!important;margin-right:auto!important;padding-left:18px!important;padding-right:18px!important;color:#94a3b8!important;font-size:12px!important;opacity:.58!important;}',
      '.spx-immersive-read textarea,.spx-immersive-read input[type="text"]{font-size:16px!important;}',
      '.spx-reader .spx-post-body-split,.spx-immersive-read .spx-post-body-split{box-sizing:border-box!important;display:grid!important;grid-template-columns:minmax(360px,560px) minmax(0,1fr)!important;gap:22px!important;align-items:start!important;max-width:100%!important;margin:0 auto!important;padding:18px 36px 36px!important;background:#fff!important;}',
      '.spx-reader .spx-post-body-split .tpc_content,.spx-immersive-read .spx-post-body-split .tpc_content{box-sizing:border-box!important;max-width:none!important;margin:0!important;padding:0!important;background:transparent!important;}',
      '.spx-reader .spx-preview-panel,.spx-immersive-read .spx-preview-panel{box-sizing:border-box!important;max-width:none!important;margin:0!important;padding:10px!important;background:#f8fafc!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:none!important;max-height:min(72vh,680px)!important;overflow:auto!important;}',
      '.spx-reader .spx-preview-header,.spx-immersive-read .spx-preview-header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;margin:0 0 10px!important;font-size:13px!important;color:#64748b!important;}',
      '.spx-reader .spx-preview-header strong,.spx-immersive-read .spx-preview-header strong{font-size:14px!important;color:#0f172a!important;}',
      '.spx-reader .spx-preview-grid,.spx-immersive-read .spx-preview-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;}',
      '.spx-reader .spx-preview-item,.spx-immersive-read .spx-preview-item{display:block!important;overflow:hidden!important;border:1px solid #e2e8f0!important;border-radius:8px!important;background:#fff!important;text-decoration:none!important;}',
      '.spx-reader .spx-preview-item img,.spx-immersive-read .spx-preview-item img{display:block!important;width:100%!important;height:190px!important;object-fit:cover!important;background:#fff!important;}',
      '.spx-reader .spx-preview-item .spx-preview-hover-image,.spx-immersive-read .spx-preview-item .spx-preview-hover-image{display:none!important;position:fixed!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;z-index:100002!important;width:auto!important;height:auto!important;max-width:min(72vw,980px)!important;max-height:min(86vh,820px)!important;object-fit:contain!important;padding:6px!important;background:#fff!important;border:1px solid #cbd5e1!important;border-radius:10px!important;box-shadow:0 18px 52px rgba(15,23,42,.35)!important;pointer-events:none!important;}',
      '.spx-reader .spx-preview-item:hover .spx-preview-hover-image,.spx-immersive-read .spx-preview-item:hover .spx-preview-hover-image{display:block!important;}',
      '.spx-reader .spx-preview-item span,.spx-immersive-read .spx-preview-item span{display:block!important;padding:5px 7px!important;font-size:12px!important;line-height:1.35!important;color:#475569!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}',
      '.spx-reader .spx-preview-source,.spx-immersive-read .spx-preview-source{display:none!important;}',
      '.spx-clean #infobox,.spx-clean #notice,.spx-clean #footer,.spx-clean .footer{display:none!important;}',
      '.spx-clean:not(.spx-site-shell) #wrapA{max-width:1180px!important;margin:0 auto!important;}',
      '.spx-clean #main{margin-top:8px!important;}',
      '.spx-clean table{border-collapse:collapse;}',
      '.spx-toolbar{position:fixed;right:14px;bottom:18px;z-index:99999;display:flex;flex-direction:column;gap:6px;font:12px/1.2 Arial,Helvetica,sans-serif;}',
      '.spx-toolbar button,.spx-toolbar a{width:42px;height:30px;border:1px solid var(--spx-line);border-radius:6px;background:var(--spx-panel);color:var(--spx-text);box-shadow:0 2px 8px rgba(15,23,42,.12);cursor:pointer;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;padding:0;}',
      '.spx-toolbar button:hover,.spx-toolbar a:hover{border-color:var(--spx-accent);color:var(--spx-accent);}',
      '.spx-toolbar .spx-active{background:#e6fffb;border-color:var(--spx-accent);color:var(--spx-accent);font-weight:bold;}',
      '.spx-settings{position:fixed;right:66px;bottom:18px;width:min(360px,calc(100vw - 24px));max-height:80vh;overflow:auto;z-index:100000;background:var(--spx-panel);border:1px solid var(--spx-line);box-shadow:0 12px 36px rgba(15,23,42,.24);border-radius:8px;padding:12px;color:var(--spx-text);font:13px/1.45 Arial,Helvetica,sans-serif;}',
      '.spx-settings[hidden]{display:none!important;}',
      '.spx-settings h3{margin:0 0 10px;font-size:15px;}',
      '.spx-settings label{display:flex;gap:8px;align-items:center;margin:7px 0;}',
      '.spx-settings textarea{box-sizing:border-box;width:100%;min-height:74px;border:1px solid var(--spx-line);border-radius:6px;padding:7px;font:12px/1.4 monospace;}',
      '.spx-settings .spx-help{margin:4px 0 8px;color:var(--spx-sub);font-size:12px;}',
      '.spx-settings .spx-row{display:flex;gap:8px;margin-top:10px;}',
      '.spx-settings button{border:1px solid var(--spx-line);border-radius:6px;background:#fff;padding:6px 10px;cursor:pointer;}',
      '.spx-settings .spx-primary{background:var(--spx-accent);border-color:var(--spx-accent);color:#fff;}',
      '.spx-quick-reply{box-sizing:border-box;margin:10px 0 12px;padding:10px 12px;border:1px solid var(--spx-line);border-radius:8px;background:#f8fafc;color:var(--spx-text);font:13px/1.45 Arial,Helvetica,sans-serif;}',
      '.spx-quick-reply-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;color:var(--spx-sub);}',
      '.spx-quick-reply-header strong{color:var(--spx-text);font-size:14px;}',
      '.spx-quick-reply-list{display:flex;flex-wrap:wrap;gap:6px;}',
      '.spx-quick-reply button{border:1px solid var(--spx-line);border-radius:999px;background:#fff;color:var(--spx-text);padding:5px 10px;cursor:pointer;font-size:13px;line-height:1.25;}',
      '.spx-quick-reply button:hover{border-color:var(--spx-accent);color:var(--spx-accent);background:#ecfdf5;}',
      '.spx-author-hover-source{cursor:help!important;}',
      '.spx-author-popover{position:fixed!important;z-index:100003!important;box-sizing:border-box!important;width:min(320px,calc(100vw - 32px))!important;max-height:min(460px,calc(100vh - 32px))!important;overflow:auto!important;padding:12px!important;background:#fff!important;border:1px solid #cbd5e1!important;border-radius:10px!important;box-shadow:0 18px 46px rgba(15,23,42,.24)!important;color:#172033!important;font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif!important;}',
      '.spx-author-popover-header{display:grid!important;grid-template-columns:48px minmax(0,1fr)!important;gap:10px!important;align-items:center!important;margin:0 0 10px!important;padding-bottom:10px!important;border-bottom:1px solid #e2e8f0!important;}',
      '.spx-author-popover-avatar{width:48px!important;height:48px!important;object-fit:cover!important;border-radius:8px!important;background:#f1f5f9!important;}',
      '.spx-author-popover-name{font-size:16px!important;font-weight:800!important;color:#075985!important;line-height:1.25!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}',
      '.spx-author-popover-link{display:inline-block!important;margin-top:3px!important;color:#64748b!important;font-size:12px!important;text-decoration:none!important;}',
      '.spx-author-popover-lines{display:flex!important;flex-direction:column!important;gap:5px!important;color:#475569!important;}',
      '.spx-author-popover-line{display:block!important;word-break:break-word!important;}',
      '.spx-fold-box{border:1px dashed var(--spx-line);background:var(--spx-bg);padding:8px;margin:8px 0;border-radius:6px;color:var(--spx-sub);}',
      '.spx-fold-box button{margin-left:8px;border:1px solid var(--spx-line);background:#fff;border-radius:5px;padding:2px 8px;cursor:pointer;}',
      '.spx-read-thread{opacity:.48;}',
      '.spx-hidden-rule{display:none!important;}',
      '.spx-unread-hidden{display:none!important;}',
      '.spx-thread-tools{display:inline-flex;gap:4px;margin-left:8px;vertical-align:middle;}',
      '.spx-thread-tools button{border:1px solid var(--spx-line);background:#fff;border-radius:4px;color:var(--spx-sub);font-size:12px;line-height:16px;padding:0 5px;cursor:pointer;}',
      '.spx-thread-tools button:hover{color:var(--spx-accent);border-color:var(--spx-accent);}',
      '.spx-watch-badge{display:inline-block;margin-left:5px;color:var(--spx-warn);font-weight:bold;}',
      '.spx-forum-tools{box-sizing:border-box;display:flex;align-items:center;gap:8px;width:min(1680px,calc(100vw - 44px));margin:0 auto 10px;padding:10px 12px;background:#fff;border:1px solid #d7e1eb;border-radius:8px;box-shadow:0 4px 14px rgba(15,23,42,.05);}',
      '.spx-forum-tools input{box-sizing:border-box;flex:1;min-width:180px;height:30px;border:1px solid var(--spx-line);border-radius:6px;padding:0 9px;font-size:13px;}',
      '.spx-forum-tools button{height:30px;border:1px solid var(--spx-line);border-radius:6px;background:#fff;color:var(--spx-text);padding:0 9px;cursor:pointer;font-size:12px;}',
      '.spx-forum-tools button:hover{border-color:var(--spx-accent);color:var(--spx-accent);}',
      '.spx-filter-hidden{display:none!important;}',
      '.spx-post-tools{display:flex;gap:6px;justify-content:flex-end;margin:4px 0;}',
      '.spx-post-tools button{border:1px solid var(--spx-line);background:#fff;border-radius:5px;padding:2px 8px;cursor:pointer;color:var(--spx-sub);}',
      '.spx-post-hidden{display:none!important;}',
      '.spx-site-shell .spx-post-shell-hidden,.spx-site-shell:not(.spx-reader) .spx-post-shell-hidden,.spx-reader .spx-post-shell-hidden,.spx-immersive-read .spx-post-shell-hidden{display:none!important;border:0!important;margin:0!important;padding:0!important;height:0!important;min-height:0!important;overflow:hidden!important;}',
      '.spx-preview-popover{position:fixed;z-index:100001;width:min(520px,calc(100vw - 28px));max-height:min(74vh,620px);overflow:auto;padding:12px;background:#fff;border:1px solid #cbd5e1;border-radius:10px;box-shadow:0 18px 48px rgba(15,23,42,.28);color:#172033;font:13px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif;}',
      '.spx-preview-popover h4{display:block;margin:0 0 6px;font-size:15px;line-height:1.35;color:#0f172a;}',
      '.spx-preview-meta{margin-bottom:8px;color:#64748b;font-size:12px;}',
      '.spx-preview-text{max-height:120px;overflow:hidden;margin-bottom:10px;color:#334155;}',
      '.spx-preview-images{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}',
      '.spx-preview-images a{display:block;overflow:hidden;border:1px solid #e2e8f0;border-radius:7px;background:#f8fafc;}',
      '.spx-preview-images img{display:block;width:100%;height:118px;object-fit:cover;}',
      '.spx-preview-status{color:#94a3b8;font-size:12px;}',
      '.spx-compact-read .user-info,.spx-compact-read .readprofile,.spx-hide-profile .user-pic,.spx-hide-profile .user-info,.spx-hide-profile .readprofile{display:none!important;}',
      '.spx-compact-read:not(.spx-reader) .tpc_content{font-size:14px;line-height:1.75;max-width:920px;}',
      '.spx-folded-quote{max-height:110px;overflow:hidden;position:relative;border-bottom:1px dashed var(--spx-line);}',
      '.spx-folded-quote:after{content:"";position:absolute;left:0;right:0;bottom:0;height:30px;background:linear-gradient(transparent,var(--spx-panel));}',
      '@media(max-width:900px){.spx-home-dashboard #content{width:calc(100vw - 16px)!important;margin:10px 8px 34px!important}.spx-home-dashboard #spx-home-grid{grid-template-columns:1fr!important}.spx-home-dashboard .spx-home-module,.spx-home-dashboard .spx-home-module[data-spx-large="1"]{grid-column:1!important}.spx-home-dashboard #header,.spx-home-dashboard #mainNav,.spx-home-dashboard #infobox,.spx-home-dashboard #notice,.spx-home-dashboard .spx-home-quick{width:calc(100vw - 16px)!important}.spx-home-dashboard .spx-home-module tr.tr3{grid-template-columns:1fr!important;gap:4px!important}.spx-home-dashboard .spx-home-module tr.tr3>td:first-child{display:none!important}}',
      '@media(max-width:760px){.spx-reader body{font-size:16px!important}.spx-reader #wrapA{width:auto!important;margin:0 6px!important}.spx-reader .tpc_content{font-size:17px!important;line-height:1.9!important;padding:12px!important}.spx-reader .spx-post-body-split,.spx-immersive-read .spx-post-body-split{display:flex!important;flex-direction:column!important;gap:12px!important;padding:14px!important}.spx-reader .spx-post-body-split .tpc_content,.spx-immersive-read .spx-post-body-split .tpc_content{padding:0!important}.spx-reader .spx-preview-panel,.spx-immersive-read .spx-preview-panel{width:auto!important;max-height:360px!important;margin:0!important;padding:10px!important}.spx-reader .spx-preview-grid,.spx-immersive-read .spx-preview-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.spx-reader .spx-preview-item img,.spx-immersive-read .spx-preview-item img{height:132px!important}.spx-immersive-read #wrapA,.spx-immersive-read #main,.spx-immersive-read #content{width:100vw!important;margin:0!important}.spx-immersive-read table.js-post{width:calc(100vw - 14px)!important;margin:10px 7px!important}.spx-immersive-read .h1,.spx-immersive-read [id^="subject_"]{font-size:19px!important;padding:16px 14px 6px!important}.spx-immersive-read .tpc_content{font-size:var(--spx-immersive-font-size,20px)!important;line-height:1.98!important;padding:14px!important}.spx-toolbar{right:8px;bottom:8px}.spx-toolbar button,.spx-toolbar a{width:38px;height:30px}.spx-settings{right:8px;bottom:52px}}',
    ].join('\n');
  }

  function injectStyles() {
    if (qs('#sp-enhancer-style')) return;
    var style = createEl('style');
    style.id = 'sp-enhancer-style';
    style.textContent = getInjectedStyleText();
    document.head.appendChild(style);
  }

  function setBodyClasses(settings) {
    document.documentElement.classList.toggle('spx-site-shell', shouldUseSiteShell(location.href));
    document.documentElement.classList.toggle('spx-adblock', !!settings.adBlock);
    document.documentElement.classList.toggle('spx-clean', !!settings.cleanMode);
    document.documentElement.classList.toggle('spx-reader', shouldUseReaderMode(settings, location.href));
    document.documentElement.classList.toggle('spx-immersive-read', shouldUseImmersiveRead(settings, location.href));
    document.documentElement.classList.toggle('spx-home-dashboard', shouldUseHomeDashboard(settings, location.href));
    document.documentElement.classList.toggle('spx-forum-dashboard', shouldUseForumDashboard(location.href));
    document.documentElement.classList.toggle('spx-search-page', shouldUseSearchPage(location.href));
    document.documentElement.classList.toggle('spx-profile-page', shouldUseProfilePage(location.href));
    document.documentElement.classList.toggle('spx-compact-read', !!settings.compactRead);
    document.documentElement.classList.toggle('spx-hide-profile', !!settings.hideUserProfile);
    document.documentElement.style.setProperty('--spx-immersive-font-size', String(settings.immersiveFontSize || 20) + 'px');
  }

  function extractAccountUserId(root, url) {
    var scope = root || document;
    var text = String(url || location.href || '');
    var urlMatch = text.match(/[?&]uid[=-](\d+)/) || text.match(/uid-(\d+)/);
    if (urlMatch) return urlMatch[1];

    var ownProfileLink = qsa('a[href*="u.php?action-show-uid"]', scope).filter(function likelyOwnProfile(link) {
      return /查看个人资料|个人资料|资料/.test((link.textContent || '').trim());
    })[0] || qs('#user-login a[href*="u.php"]', scope);

    var href = ownProfileLink ? ownProfileLink.getAttribute('href') || ownProfileLink.href : '';
    var linkMatch = String(href || '').match(/uid[=-](\d+)/) || String(href || '').match(/uid-(\d+)/);
    return linkMatch ? linkMatch[1] : '';
  }

  function getAccountTabItems(userId, origin) {
    var uid = String(userId || '');
    var base = String(origin || location.origin || '');
    return [
      { key: 'home', label: '个人首页', href: base + '/u.php?uid-' + uid + '.html' },
      { key: 'profile', label: '资料', href: base + '/u.php?action-show-uid-' + uid + '.html' },
      { key: 'topic', label: '主题', href: base + '/u.php?action-topic-uid-' + uid + '.html' },
      { key: 'post', label: '回复', href: base + '/u.php?action-post-uid-' + uid + '.html' },
      { key: 'favor', label: '收藏', href: base + '/u.php?action-favor-uid-' + uid + '.html' },
      { key: 'friend', label: '好友', href: base + '/u.php?action-friend-uid-' + uid + '.html' },
      { key: 'trade', label: '商品', href: base + '/u.php?action-trade-uid-' + uid + '.html' },
      { key: 'message', label: '消息', href: base + '/message.php' },
      { key: 'settings', label: '设置', href: base + '/profile.php' },
    ];
  }

  function getAccountActiveKey(url) {
    var text = String(url || '');
    if (/\/message\.php/.test(text)) return 'message';
    if (/\/profile\.php/.test(text)) return 'settings';
    if (/action-show/.test(text)) return 'profile';
    if (/action-topic/.test(text)) return 'topic';
    if (/action-post/.test(text)) return 'post';
    if (/action-favor/.test(text)) return 'favor';
    if (/action-friend/.test(text)) return 'friend';
    if (/action-trade/.test(text)) return 'trade';
    if (/\/u\.php/.test(text)) return 'home';
    return '';
  }

  function enhanceAccountNavigation(root) {
    if (!shouldUseProfilePage(location.href)) return;
    var scope = root || document;
    var uid = extractAccountUserId(scope, location.href);
    if (!uid) return;

    var tabs = qs('#spx-account-tabs', scope);
    if (!tabs) {
      tabs = createEl('nav', 'spx-account-tabs');
      tabs.id = 'spx-account-tabs';
    }

    var activeKey = getAccountActiveKey(location.href);
    tabs.textContent = '';
    getAccountTabItems(uid, location.origin).forEach(function appendAccountTab(item) {
      var link = createEl('a', item.key === activeKey ? 'spx-account-tab-active' : '', item.label);
      link.href = item.href;
      tabs.appendChild(link);
    });

    var mountBefore = qs('#u-wrap', scope) || qs('#set-wrap', scope) || qs('.bdbA', scope);
    var main = qs('#main', scope) || document.body;
    if (mountBefore && mountBefore.parentNode) {
      mountBefore.parentNode.insertBefore(tabs, mountBefore);
    } else if (tabs.parentNode !== main) {
      main.insertBefore(tabs, main.firstChild);
    }

    document.documentElement.classList.add('spx-account-tabs-ready');
  }

  function extractThreadCellInfo(cell) {
    var row = cell.closest('tr') || cell;
    var id = parseThreadId(cell.id);
    var titleLink = qs('#a_ajax_' + id, row) || qs('a[href*="read.php?tid"]', row);
    var authorLink = qs('a.bl[href*="u.php"]', row);
    return {
      id: id,
      cell: cell,
      row: row,
      titleLink: titleLink,
      title: titleLink ? titleLink.textContent.trim() : cell.textContent.trim(),
      author: authorLink ? authorLink.textContent.trim() : '',
    };
  }

  function isStickyCell(cell) {
    var text = (cell.textContent || '').trim();
    if (!cell.id) return false;
    var tid = Number(parseThreadId(cell.id));
    if (!tid) return false;
    if (/\[公告\]|版规|指南|长期招人|Q&A|新人报道/.test(text)) return true;
    return tid < 1000000;
  }

  function hideStickyThreads(cells) {
    (cells || qsa('td[id^="td_"]')).filter(isStickyCell).forEach(function hideCell(cell) {
      var row = cell.closest('tr') || cell;
      if (row && row.style && typeof row.style.setProperty === 'function') {
        row.style.setProperty('display', 'none', 'important');
        return;
      }
      if (row && row.style) row.style.display = 'none';
    });
  }

  function hideForumAnnouncementPanels(nodes) {
    (nodes || qsa('.gonggao')).forEach(function hidePanel(panel) {
      if (panel && panel.style && typeof panel.style.setProperty === 'function') {
        panel.style.setProperty('display', 'none', 'important');
        return;
      }
      if (panel && panel.style) panel.style.display = 'none';
    });
  }

  function hideForumAnnouncements() {
    if (detectPageType(location.href) !== 'forum') {
      restoreStickyThreads();
      return;
    }
    var stickyCells = qsa('td[id^="td_"]').filter(isStickyCell);
    hideForumAnnouncementPanels();
    if (!stickyCells.length) return;
    hideStickyThreads(stickyCells);
  }

  function restoreStickyThreads() {
    var foldBox = qs('#spx-sticky-fold-box');
    if (foldBox) {
      var foldRow = foldBox.closest('tr');
      if (foldRow) foldRow.remove();
    }
    qsa('td[id^="td_"]').filter(isStickyCell).forEach(function showCell(cell) {
      var row = cell.closest('tr') || cell;
      row.style.display = '';
    });
  }

  function boxRow(content) {
    var tr = createEl('tr');
    var td = createEl('td');
    td.colSpan = 8;
    td.appendChild(content);
    tr.appendChild(td);
    return tr;
  }

  function createForumQuickTools(settings, state, items) {
    if (qs('#spx-forum-tools')) return;
    var content = qs('#content') || qs('#main') || document.body;
    if (!content) return;

    var tools = createEl('div', 'spx-forum-tools');
    tools.id = 'spx-forum-tools';
    var input = createEl('input');
    input.type = 'search';
    input.placeholder = '快速过滤：关键词、!排除、作者:用户名';
    var markVisibleButton = createEl('button', '', '可见已读');
    var clearButton = createEl('button', '', '清空过滤');
    tools.appendChild(input);
    tools.appendChild(markVisibleButton);
    tools.appendChild(clearButton);

    function applyFilter() {
      var parsed = parseForumFilterQuery(input.value);
      items.forEach(function toggleItem(item) {
        var hidden = !!input.value.trim() && !matchesForumFilter(item, parsed);
        if (item.row && item.row.classList) item.row.classList.toggle('spx-filter-hidden', hidden);
      });
    }

    input.addEventListener('input', applyFilter);
    clearButton.addEventListener('click', function clearFilter() {
      input.value = '';
      applyFilter();
      input.focus();
    });
    markVisibleButton.addEventListener('click', function markVisibleRead() {
      markThreadsRead(items, state);
      saveMap(READ_KEY, state.read);
      items.forEach(function syncRead(item) {
        if (item.row && state.read[item.id]) item.row.classList.add('spx-read-thread');
      });
    });

    content.insertBefore(tools, content.firstChild);
  }

  function positionPreviewPanel(panel, event) {
    var margin = 14;
    var left = Math.min((event && event.clientX ? event.clientX + 16 : 24), window.innerWidth - panel.offsetWidth - margin);
    var top = Math.min((event && event.clientY ? event.clientY + 16 : 24), window.innerHeight - panel.offsetHeight - margin);
    panel.style.left = Math.max(margin, left) + 'px';
    panel.style.top = Math.max(margin, top) + 'px';
  }

  function removeThreadPreview() {
    var panel = qs('#spx-preview-popover');
    if (panel) panel.remove();
  }

  function renderPreviewPanel(info, payload, event) {
    removeThreadPreview();
    var panel = createEl('div', 'spx-preview-popover');
    panel.id = 'spx-preview-popover';
    var title = createEl('h4', '', info.title || '帖子预览');
    var meta = createEl('div', 'spx-preview-meta', (info.author ? '作者：' + info.author + ' · ' : '') + '悬停预览');
    var text = createEl('div', 'spx-preview-text', payload.text || '未提取到文字预览');
    panel.appendChild(title);
    panel.appendChild(meta);
    panel.appendChild(text);

    if (payload.images && payload.images.length) {
      var grid = createEl('div', 'spx-preview-images');
      payload.images.forEach(function appendPreviewImage(url) {
        var link = createEl('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        var image = createEl('img');
        image.src = url;
        image.loading = 'lazy';
        link.appendChild(image);
        grid.appendChild(link);
      });
      panel.appendChild(grid);
    } else {
      panel.appendChild(createEl('div', 'spx-preview-status', '没有可预览图片'));
    }

    panel.addEventListener('mouseleave', removeThreadPreview);
    document.body.appendChild(panel);
    positionPreviewPanel(panel, event || {});
  }

  function extractPreviewPayloadFromDocument(doc, url) {
    var content = doc && doc.querySelector ? doc.querySelector('.tpc_content') : null;
    var images = content ? Array.prototype.slice.call(content.querySelectorAll('img')) : [];
    return {
      text: content ? content.textContent.replace(/\s+/g, ' ').trim().slice(0, 260) : '',
      images: extractPreviewImageUrls(
        images.map(function mapPreviewImage(image) {
          return {
            src: image.getAttribute('src') || image.src,
            naturalWidth: image.naturalWidth || image.width || 0,
            naturalHeight: image.naturalHeight || image.height || 0,
            postIndex: 0,
          };
        }),
        url
      ),
    };
  }

  function attachThreadHoverPreview(info) {
    if (!info || !info.titleLink || info.titleLink.dataset.spxPreviewReady) return;
    info.titleLink.dataset.spxPreviewReady = '1';
    var timer = null;
    info.titleLink.addEventListener('mouseenter', function schedulePreview(event) {
      timer = window.setTimeout(function loadPreview() {
        var url = info.titleLink.href;
        renderPreviewPanel(info, { text: '正在加载预览...', images: [] }, event);
        window.fetch(url, { credentials: 'include' })
          .then(function parseResponse(response) {
            return response.text();
          })
          .then(function renderHtml(html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            renderPreviewPanel(info, extractPreviewPayloadFromDocument(doc, url), event);
          })
          .catch(function showPreviewError() {
            renderPreviewPanel(info, { text: '预览加载失败', images: [] }, event);
          });
      }, 420);
    });
    info.titleLink.addEventListener('mousemove', function movePreview(event) {
      var panel = qs('#spx-preview-popover');
      if (panel) positionPreviewPanel(panel, event);
    });
    info.titleLink.addEventListener('mouseleave', function cancelPreview() {
      if (timer) window.clearTimeout(timer);
      timer = null;
      window.setTimeout(removeThreadPreview, 120);
    });
  }

  function enhanceThreadList(settings, state) {
    if (detectPageType(location.href) !== 'forum') return;
    var cells = qsa('td[id^="td_"]').filter(function realThreadCell(cell) {
      return parseThreadId(cell.id) && qs('a[id^="a_ajax_"]', cell);
    });
    var items = [];

    cells.forEach(function enhanceCell(cell) {
      var info = extractThreadCellInfo(cell);
      if (!info.id || !info.titleLink) return;
      items.push(info);

      var isRead = !!state.read[info.id];
      info.row.classList.toggle('spx-read-thread', isRead);
      info.row.classList.toggle('spx-unread-hidden', !!settings.unreadOnly && isRead);
      info.row.classList.toggle('spx-hidden-rule', matchesBlockRules(info, settings));

      if (state.watch[info.id] && !qs('.spx-watch-badge', info.cell)) {
        info.titleLink.insertAdjacentElement('afterend', createEl('span', 'spx-watch-badge', '★'));
      }

      if (qs('.spx-thread-tools', info.cell)) return;
      var tools = createEl('span', 'spx-thread-tools');
      var watchButton = createEl('button', '', state.watch[info.id] ? '已存' : '稍后');
      var titleBlockButton = createEl('button', '', '屏题');
      var authorBlockButton = createEl('button', '', '屏人');
      var hideRowButton = createEl('button', '', '隐藏');
      var hideAuthorPageButton = createEl('button', '', '本页屏人');

      watchButton.title = '切换本地稍后看';
      titleBlockButton.title = '把标题加入本地屏蔽关键词';
      authorBlockButton.title = '把作者加入本地屏蔽关键词';
      hideRowButton.title = '临时隐藏当前行';
      hideAuthorPageButton.title = '临时隐藏本页同作者帖子';

      watchButton.addEventListener('click', function toggleWatch(event) {
        event.preventDefault();
        event.stopPropagation();
        if (state.watch[info.id]) {
          delete state.watch[info.id];
          watchButton.textContent = '稍后';
          var badge = qs('.spx-watch-badge', info.cell);
          if (badge) badge.remove();
        } else {
          state.watch[info.id] = {
            title: info.title,
            url: info.titleLink.href,
            savedAt: Date.now(),
          };
          watchButton.textContent = '已存';
          info.titleLink.insertAdjacentElement('afterend', createEl('span', 'spx-watch-badge', '★'));
        }
        saveMap(WATCH_KEY, state.watch);
      });

      titleBlockButton.addEventListener('click', function blockTitle(event) {
        event.preventDefault();
        event.stopPropagation();
        var keyword = window.prompt('添加标题屏蔽关键词', info.title.slice(0, 30));
        if (!keyword) return;
        settings.titleKeywords = parseLineList(settings.titleKeywords.concat([keyword]).join('\n'));
        saveSettings(settings);
        enhanceAll(settings, state);
      });

      authorBlockButton.addEventListener('click', function blockAuthor(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!info.author) return;
        settings.authorKeywords = parseLineList(settings.authorKeywords.concat([info.author]).join('\n'));
        saveSettings(settings);
        enhanceAll(settings, state);
      });

      hideRowButton.addEventListener('click', function hideCurrentRow(event) {
        event.preventDefault();
        event.stopPropagation();
        info.row.classList.add('spx-filter-hidden');
      });

      hideAuthorPageButton.addEventListener('click', function hideSameAuthorOnPage(event) {
        event.preventDefault();
        event.stopPropagation();
        findThreadIdsByAuthor(items, info.author).forEach(function hideThreadId(id) {
          var item = items.filter(function matchId(candidate) {
            return candidate.id === id;
          })[0];
          if (item && item.row) item.row.classList.add('spx-filter-hidden');
        });
      });

      tools.appendChild(watchButton);
      tools.appendChild(titleBlockButton);
      if (info.author) tools.appendChild(authorBlockButton);
      tools.appendChild(hideRowButton);
      if (info.author) tools.appendChild(hideAuthorPageButton);
      info.titleLink.insertAdjacentElement('afterend', tools);
      attachThreadHoverPreview(info);

      info.titleLink.addEventListener('click', function markRead() {
        state.read[info.id] = Date.now();
        saveMap(READ_KEY, state.read);
      }, { capture: true });
    });

    createForumQuickTools(settings, state, items);
    hideForumAnnouncements();
  }

  function getPostAuthor(post) {
    var profileText = '';
    var profile = qs('.readprofile', post) || qs('.user-info', post);
    if (profile) profileText = profile.textContent.replace(/\s+/g, ' ').trim();
    var userLink = getPostUserLink(post);
    var userText = userLink ? userLink.textContent.trim() : '';
    return userText || profileText;
  }

  function compactText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function getPostUserLink(scope) {
    return (
      qsa('a[href*="u.php?action-show"],a[href*="u.php?uid"],a[href*="u.php?action=show"],a[href*="profile.php?action-show"],.readprofile a[href],.user-info a[href],a[href*="u.php"]', scope)
        .filter(function hasUsefulUserText(link) {
          return !!compactText(link.textContent);
        })[0] ||
      qs('a[href*="u.php?action-show"]', scope) ||
      qs('a[href*="u.php?uid"]', scope) ||
      qs('a[href*="u.php?action=show"]', scope) ||
      qs('a[href*="profile.php?action-show"]', scope) ||
      qs('.readprofile a[href]', scope) ||
      qs('.user-info a[href]', scope) ||
      qs('a[href*="u.php"]', scope)
    );
  }

  function getVisiblePostAuthorName(post) {
    var authorCell = qs('th.r_two', post) || qs('td.r_two', post) || qs('.r_two', post);
    var userLink = getPostUserLink(authorCell || post);
    var linkText = compactText(userLink && userLink.textContent);
    if (linkText) return linkText;

    var authorText = compactText(authorCell && authorCell.textContent);
    if (!authorText) return '';
    return authorText
      .split(/\s{2,}|(?=作者资料)|(?=发送短消息)|(?=加为好友)|(?=使用道具)|(?=等级[:：])|(?=帖子[:：])|(?=注册[:：])|(?=威望[:：])|(?=金币[:：])/)
      .map(compactText)
      .filter(Boolean)[0] || '';
  }

  function getPostAuthorHoverTargets(post, info) {
    var authorCell = qs('th.r_two', post) || qs('td.r_two', post) || qs('.r_two', post);
    var targets = [
      authorCell,
      info && info.source,
      getPostUserLink(post),
      qs('.readprofile', post),
      qs('.user-info', post),
      qs('.user-pic', post),
    ];
    var seen = [];
    return targets.filter(function keepUniqueTarget(node) {
      if (!node || seen.indexOf(node) !== -1) return false;
      seen.push(node);
      return true;
    });
  }

  function extractPostAuthorInfo(post) {
    var authorCell = qs('th.r_two', post) || qs('td.r_two', post) || qs('.r_two', post);
    var scope = authorCell || post;
    var userLink = getPostUserLink(scope) || getPostUserLink(post);
    var avatar = qs('.user-pic img', scope) || qs('img', scope);
    var name = compactText(userLink && userLink.textContent) || getVisiblePostAuthorName(post) || getPostAuthor(post);
    var lines = [];
    var seen = {};

    qsa('.readprofile,.user-info,.user-pic,.f12,div,span', scope).forEach(function collectAuthorLine(node) {
      var text = compactText(node.textContent);
      if (!text || text === name || seen[text]) return;
      if (text.length > 90) return;
      seen[text] = true;
      lines.push(text);
    });

    if (!lines.length && authorCell) {
      compactText(authorCell.textContent)
        .split(/\s{2,}|(?=等级[:：])|(?=帖子[:：])|(?=注册[:：])|(?=威望[:：])|(?=金币[:：])/)
        .map(compactText)
        .filter(Boolean)
        .forEach(function addFallbackLine(text) {
          if (text === name || seen[text]) return;
          seen[text] = true;
          lines.push(text);
        });
    }

    return {
      name: name || '未知用户',
      url: userLink ? userLink.href : '',
      avatar: avatar ? (avatar.currentSrc || avatar.src || '') : '',
      lines: lines.slice(0, 8),
      source: authorCell || userLink || qs('.readprofile', scope),
    };
  }

  function removeAuthorPopover() {
    var popover = qs('#spx-author-popover');
    if (popover) popover.remove();
  }

  function positionAuthorPopover(popover, event) {
    if (!popover) return;
    var margin = 12;
    var left = (event && event.clientX ? event.clientX : 24) + 14;
    var top = (event && event.clientY ? event.clientY : 24) + 14;
    var width = popover.offsetWidth || 320;
    var height = popover.offsetHeight || 180;
    if (left + width + margin > window.innerWidth) left = window.innerWidth - width - margin;
    if (top + height + margin > window.innerHeight) top = window.innerHeight - height - margin;
    popover.style.left = Math.max(margin, left) + 'px';
    popover.style.top = Math.max(margin, top) + 'px';
  }

  function renderAuthorPopover(info, event) {
    removeAuthorPopover();
    if (!info || !info.name) return;

    var popover = createEl('div', 'spx-author-popover');
    popover.id = 'spx-author-popover';

    var header = createEl('div', 'spx-author-popover-header');
    if (info.avatar) {
      var avatar = createEl('img', 'spx-author-popover-avatar');
      avatar.src = info.avatar;
      avatar.alt = info.name;
      header.appendChild(avatar);
    } else {
      header.appendChild(createEl('div', 'spx-author-popover-avatar'));
    }

    var title = createEl('div');
    title.appendChild(createEl('div', 'spx-author-popover-name', info.name));
    if (info.url) {
      var link = createEl('a', 'spx-author-popover-link', '查看用户主页');
      link.href = info.url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      title.appendChild(link);
    }
    header.appendChild(title);
    popover.appendChild(header);

    var lines = createEl('div', 'spx-author-popover-lines');
    (info.lines && info.lines.length ? info.lines : ['页面未提供更多资料']).forEach(function appendLine(line) {
      lines.appendChild(createEl('div', 'spx-author-popover-line', line));
    });
    popover.appendChild(lines);

    popover.addEventListener('mouseenter', function keepPopover() {
      if (popover.spxHideTimer) window.clearTimeout(popover.spxHideTimer);
    });
    popover.addEventListener('mouseleave', removeAuthorPopover);
    document.body.appendChild(popover);
    positionAuthorPopover(popover, event || {});
  }

  function attachAuthorHoverCard(post) {
    if (!post || post.dataset.spxAuthorHoverReady === '1') return;
    var info = extractPostAuthorInfo(post);
    var targets = getPostAuthorHoverTargets(post, info);
    if (!targets.length) return;
    post.dataset.spxAuthorHoverReady = '1';

    targets.forEach(function bindAuthorTarget(target) {
      target.classList.add('spx-author-hover-source');
      target.addEventListener('mouseenter', function showAuthor(event) {
        renderAuthorPopover(info, event);
      });
      target.addEventListener('mouseover', function showAuthorFallback(event) {
        if (!qs('#spx-author-popover')) renderAuthorPopover(info, event);
      });
      target.addEventListener('mousemove', function moveAuthor(event) {
        positionAuthorPopover(qs('#spx-author-popover'), event);
      });
      target.addEventListener('mouseleave', function hideAuthor() {
        var popover = qs('#spx-author-popover');
        if (!popover) return;
        popover.spxHideTimer = window.setTimeout(removeAuthorPopover, 120);
      });
    });
  }

  function setImportantStyle(node, name, value) {
    if (!node || !node.style) return;
    if (typeof node.style.setProperty === 'function') {
      node.style.setProperty(name, value, 'important');
      return;
    }
    node.style[name] = value;
  }

  function applySiteShellLayout(root) {
    var scope = root || document;
    qsa('#header,#main,#content,#infobox,#notice', scope).forEach(function widenShellNode(node) {
      setImportantStyle(node, 'box-sizing', 'border-box');
      setImportantStyle(node, 'width', 'min(1680px, calc(100vw - 44px))');
      setImportantStyle(node, 'max-width', 'none');
      setImportantStyle(node, 'margin-left', 'auto');
      setImportantStyle(node, 'margin-right', 'auto');
    });
    qsa('#mainNav', scope).forEach(function widenNav(node) {
      setImportantStyle(node, 'box-sizing', 'border-box');
      setImportantStyle(node, 'width', 'min(1680px, calc(100vw - 44px))');
      setImportantStyle(node, 'max-width', 'none');
      setImportantStyle(node, 'margin-left', 'auto');
      setImportantStyle(node, 'margin-right', 'auto');
      setImportantStyle(node, 'height', '28px');
      setImportantStyle(node, 'overflow', 'visible');
    });
    qsa('#mainNav>div[style*="padding-left"]', scope).forEach(function resetNavMenuHost(node) {
      setImportantStyle(node, 'box-sizing', 'border-box');
      setImportantStyle(node, 'width', '100%');
      setImportantStyle(node, 'max-width', '100%');
      setImportantStyle(node, 'height', '28px');
      setImportantStyle(node, 'padding-left', '250px');
      setImportantStyle(node, 'overflow', 'visible');
    });
    qsa('#mainNav>div[style*="padding-left"] table,#mainNav>div[style*="padding-left"] tbody,#mainNav>div[style*="padding-left"] tr,#mainNav>div[style*="padding-left"] td', scope).forEach(function resetNavTableNode(node) {
      setImportantStyle(node, 'display', 'block');
      setImportantStyle(node, 'box-sizing', 'border-box');
      setImportantStyle(node, 'width', 'auto');
      setImportantStyle(node, 'height', '28px');
      setImportantStyle(node, 'margin', '0');
      setImportantStyle(node, 'padding', '0');
      setImportantStyle(node, 'border', '0');
    });
  }

  function getDirectChildByTag(node, tagName) {
    if (!node || !node.children) return null;
    var expected = String(tagName || '').toUpperCase();
    for (var index = 0; index < node.children.length; index += 1) {
      if (node.children[index].tagName === expected) return node.children[index];
    }
    return null;
  }

  function enhanceSiteNavigation(root) {
    var scope = root || document;
    var configLink = qs('#peacemakerconfig', scope);
    if (!configLink) return;

    var item = configLink.closest ? configLink.closest('li') : null;
    var menu = getDirectChildByTag(configLink, 'div');

    if (item) {
      item.classList.add('spx-peacemaker-nav');
      if (item.style && item.style.removeProperty) item.style.removeProperty('width');
    }

    function syncPeacemakerState() {
      var open = !!(menu && !menu.hasAttribute('hidden'));
      configLink.classList.toggle('spx-menu-open', open);
      if (item) item.classList.toggle('spx-nav-active', open);
    }

    if (!configLink.dataset.spxNavReady) {
      configLink.dataset.spxNavReady = '1';
      configLink.addEventListener('click', function syncAfterClick() {
        window.setTimeout(syncPeacemakerState, 0);
      });
      if (menu && typeof MutationObserver !== 'undefined') {
        new MutationObserver(syncPeacemakerState).observe(menu, {
          attributes: true,
          attributeFilter: ['hidden'],
        });
      }
    }

    syncPeacemakerState();
  }

  function applyReadPostLayout(post, settings) {
    if (!post) return;
    var authorCell = qs('th.r_two', post);
    var contentCell = qs('th.r_one', post);
    var compactAuthor = !!(settings && (settings.compactRead || settings.hideUserProfile));
    var authorWidth = compactAuthor ? '112px' : '128px';

    setImportantStyle(post, 'width', 'min(1680px, calc(100vw - 64px))');
    setImportantStyle(post, 'max-width', 'none');
    setImportantStyle(post, 'table-layout', 'fixed');

    setImportantStyle(authorCell, 'width', authorWidth);
    setImportantStyle(authorCell, 'max-width', authorWidth);
    setImportantStyle(authorCell, 'min-width', authorWidth);
    setImportantStyle(authorCell, 'padding', '18px 8px');
    setImportantStyle(authorCell, 'overflow', 'hidden');

    qsa('th.r_two img', post).forEach(function shrinkAuthorImage(image) {
      setImportantStyle(image, 'max-width', compactAuthor ? '72px' : '96px');
      setImportantStyle(image, 'height', 'auto');
    });

    setImportantStyle(contentCell, 'width', 'auto');
    setImportantStyle(contentCell, 'min-width', '0');
  }

  function getPostToolsHost(post, content) {
    return qs('th.r_one', post) || (content && content.parentNode) || post;
  }

  function syncHiddenPostShell(post) {
    if (!post || !post.closest || !post.classList) return;
    var shell = post.closest('div.t5.t2');
    if (!shell || !shell.classList) return;
    shell.classList.toggle('spx-post-shell-hidden', post.classList.contains('spx-post-hidden'));
  }

  function setHomeModuleCollapsed(rows, collapsed) {
    (rows || []).forEach(function toggleRow(row) {
      if (!row || !row.style) return;
      if (collapsed) {
        row.style.setProperty('display', 'none', 'important');
      } else {
        row.style.removeProperty('display');
      }
    });
  }

  function mountPreviewPanel(firstPost, content, panel) {
    if (!firstPost || !content || !panel || !content.parentNode) return;
    var split = qs('.spx-post-body-split', firstPost);
    if (!split) {
      split = createEl('div', 'spx-post-body-split');
      content.parentNode.insertBefore(split, content);
    }
    split.appendChild(panel);
    split.appendChild(content);
  }

  function enhanceReadPage(settings, state) {
    if (detectPageType(location.href) !== 'read') return;
    var tid = parseThreadId(location.href);
    if (tid) {
      state.read[tid] = Date.now();
      saveMap(READ_KEY, state.read);
    }

    var posts = qsa('table.js-post');
    var originalAuthor = posts.length ? getPostAuthor(posts[0]) : '';

    posts.forEach(function enhancePost(post, index) {
      var author = getPostAuthor(post);
      var content = qs('.tpc_content', post);
      if (!content) return;

      applyReadPostLayout(post, settings);
      attachAuthorHoverCard(post);

      post.classList.toggle('spx-post-hidden', matchesBlockRules({ title: content.textContent, author: author }, settings));
      if (settings.onlyOriginalAuthor && originalAuthor && author && author !== originalAuthor) {
        post.classList.add('spx-post-hidden');
      }
      syncHiddenPostShell(post);

      var toolsHost = getPostToolsHost(post, content);
      var existingTools = qs('.spx-post-tools', post);
      if (existingTools && existingTools.parentNode !== toolsHost) {
        toolsHost.insertBefore(existingTools, toolsHost.firstChild);
      }

      if (!existingTools) {
        var tools = createEl('div', 'spx-post-tools');
        var floor = createEl('span', '', index === 0 ? '楼主' : 'B' + index + 'F');
        var blockAuthor = createEl('button', '', '屏蔽此人');
        var copyLink = createEl('button', '', '复制链接');
        floor.style.marginRight = 'auto';

        blockAuthor.addEventListener('click', function addAuthorBlock() {
          if (!author) return;
          settings.authorKeywords = parseLineList(settings.authorKeywords.concat([author]).join('\n'));
          saveSettings(settings);
          enhanceAll(settings, state);
        });

        copyLink.addEventListener('click', function copyPostLink() {
          var hash = '';
          var anchor = qs('a[name]', post) || qs('[id^="read_"]', post);
          if (anchor) hash = '#' + (anchor.getAttribute('name') || anchor.id);
          navigator.clipboard.writeText(location.href.split('#')[0] + hash).catch(function noop() {});
        });

        tools.appendChild(floor);
        tools.appendChild(blockAuthor);
        tools.appendChild(copyLink);
        toolsHost.insertBefore(tools, toolsHost.firstChild);
      }
    });

    cleanupReadSeparators();
    enhancePreviewGallery(settings, posts);
    if (settings.foldQuotes) foldLongReadBlocks();
  }

  function enhancePreviewGallery(settings, posts) {
    restorePreviewGallery();
    if (!settings.unifiedPreviewGallery || !posts || !posts.length) return;

    var firstPost = posts[0];
    var content = qs('.tpc_content', firstPost);
    if (!content) return;

    var previewImages = qsa('img', content)
      .map(function mapImage(img) {
        return {
          node: img,
          src: img.currentSrc || img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          postIndex: 0,
        };
      })
      .filter(isPreviewImageCandidate);

    var seen = {};
    previewImages = previewImages.filter(function uniqueImage(item) {
      if (seen[item.src]) return false;
      seen[item.src] = true;
      return true;
    });

    if (!previewImages.length) return;

    var panel = createEl('section', 'spx-preview-panel');
    panel.id = 'spx-preview-panel';
    var header = createEl('div', 'spx-preview-header');
    header.innerHTML = '<strong>预览图</strong><span>' + previewImages.length + ' 张，点击打开原图</span>';
    var grid = createEl('div', 'spx-preview-grid');

    previewImages.forEach(function appendPreview(item, index) {
      item.node.classList.add('spx-preview-source');
      item.node.dataset.spxPreviewSource = '1';

      var link = createEl('a', 'spx-preview-item');
      link.href = item.src;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.title = '打开第 ' + (index + 1) + ' 张原图';

      var thumb = createEl('img');
      thumb.src = item.src;
      thumb.loading = 'lazy';
      thumb.alt = '预览图 ' + (index + 1);

      var hoverImage = createEl('img', 'spx-preview-hover-image');
      hoverImage.src = item.src;
      hoverImage.loading = 'lazy';
      hoverImage.alt = '预览图 ' + (index + 1) + ' 放大预览';

      var label = createEl('span', '', '图 ' + (index + 1));
      link.appendChild(thumb);
      link.appendChild(hoverImage);
      link.appendChild(label);
      grid.appendChild(link);
    });

    panel.appendChild(header);
    panel.appendChild(grid);

    mountPreviewPanel(firstPost, content, panel);
  }

  function restorePreviewGallery() {
    var panel = qs('#spx-preview-panel');
    if (panel) panel.remove();
    var split = qs('.spx-post-body-split');
    if (split) {
      var content = qs('.tpc_content', split);
      if (content && split.parentNode) split.parentNode.insertBefore(content, split);
      split.remove();
    }
    qsa('[data-spx-preview-source="1"]').forEach(function restoreImage(img) {
      img.classList.remove('spx-preview-source');
      delete img.dataset.spxPreviewSource;
    });
  }

  function isEmptyReadSeparatorNode(node) {
    if (!node) return false;
    if (node.classList && node.classList.contains('js-post')) return false;
    if (node.closest && node.closest('table.js-post')) return false;
    if (qs('table.js-post,.tpc_content,.pages,.page,#breadcrumbs,form,input,textarea,select,button,a[href],img,iframe,video,object,embed', node)) return false;

    var text = compactText(node.textContent);
    if (text) return false;

    return true;
  }

  function cleanupReadSeparators() {
    if (detectPageType(location.href) !== 'read') return;
    qsa('#content>*:not(.js-post),#main>*:not(.js-post)').forEach(function hideSeparator(node) {
      if (!isEmptyReadSeparatorNode(node)) return;
      node.dataset.spxReadSeparatorHidden = '1';
      if (node.style && typeof node.style.setProperty === 'function') {
        node.style.setProperty('display', 'none', 'important');
      } else if (node.style) {
        node.style.display = 'none';
      }
    });
  }

  function foldLongReadBlocks() {
    qsa('.quote, blockquote, .blockquote, .tpc_content .f12').forEach(function fold(node) {
      if (node.dataset.spxFolded) return;
      if ((node.textContent || '').length < 220 && node.scrollHeight < 150) return;
      node.dataset.spxFolded = '1';
      node.classList.add('spx-folded-quote');
      var button = createEl('button', '', '展开引用');
      button.style.margin = '4px 0 8px';
      button.addEventListener('click', function expand() {
        node.classList.remove('spx-folded-quote');
        button.remove();
      });
      node.insertAdjacentElement('afterend', button);
    });
  }

  function getQuickReplyEditor(root) {
    var scope = root || document;
    return (
      qs('textarea[name="atc_content"]', scope) ||
      qs('textarea[name="content"]', scope) ||
      qs('textarea#atc_content', scope) ||
      qs('textarea[id*="content"]', scope) ||
      qs('textarea', scope)
    );
  }

  function insertTextIntoEditor(editor, text) {
    if (!editor || typeof text !== 'string') return false;
    var current = String(editor.value || '');
    var start = typeof editor.selectionStart === 'number' ? editor.selectionStart : current.length;
    var end = typeof editor.selectionEnd === 'number' ? editor.selectionEnd : current.length;
    var prefix = current.slice(0, start);
    var suffix = current.slice(end);
    var spacer = prefix && !/\s$/.test(prefix) ? '\n' : '';
    editor.value = prefix + spacer + text + suffix;
    var cursor = (prefix + spacer + text).length;
    if (typeof editor.setSelectionRange === 'function') editor.setSelectionRange(cursor, cursor);
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));
    if (typeof editor.focus === 'function') editor.focus();
    return true;
  }

  function submitQuickReply(editor) {
    if (!editor) return false;
    var form = editor.closest && editor.closest('form');
    if (form) {
      var submitter =
        qs('input[type="submit"]', form) ||
        qs('button[type="submit"]', form) ||
        qs('input[name="submit"]', form) ||
        qs('button[name="submit"]', form);
      if (submitter && typeof submitter.click === 'function') {
        submitter.click();
        return true;
      }
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
        return true;
      }
      if (typeof form.submit === 'function') {
        form.submit();
        return true;
      }
    }

    var pageSubmit =
      qs('input[type="submit"]') ||
      qs('button[type="submit"]') ||
      qs('input[name="submit"]') ||
      qs('button[name="submit"]');
    if (pageSubmit && typeof pageSubmit.click === 'function') {
      pageSubmit.click();
      return true;
    }
    return false;
  }

  function getQuickReplyMount(editor) {
    if (!editor) return null;
    var form = editor.closest && editor.closest('form');
    var row = editor.closest && editor.closest('tr');
    if (row && row.parentNode && /^tr$/i.test(row.nodeName || '')) {
      return { parent: row.parentNode, before: row };
    }
    return { parent: (form || editor.parentNode), before: editor };
  }

  function createQuickReplyPanel(settings, editor) {
    var replies = parseQuickReplyList((settings && settings.quickReplies || []).join('\n'));
    if (!editor || !replies.length) return null;

    var panel = createEl('div', 'spx-quick-reply');
    panel.id = 'spx-quick-reply';
    var header = createEl('div', 'spx-quick-reply-header');
    header.appendChild(createEl('strong', '', '快捷回复'));
    header.appendChild(createEl('span', '', '点击语句后自动提交'));
    var list = createEl('div', 'spx-quick-reply-list');

    replies.forEach(function appendReply(reply) {
      var button = createEl('button', '', reply);
      button.type = 'button';
      button.title = '填入回复：' + reply;
      button.addEventListener('click', function useQuickReply() {
        if (insertTextIntoEditor(editor, reply)) submitQuickReply(editor);
      });
      list.appendChild(button);
    });

    panel.appendChild(header);
    panel.appendChild(list);
    return panel;
  }

  function enhanceQuickReply(settings) {
    if (detectPageType(location.href) !== 'read' && detectPageType(location.href) !== 'post') return;
    var oldPanel = qs('#spx-quick-reply');
    if (oldPanel) oldPanel.remove();

    var editor = getQuickReplyEditor(document);
    var panel = createQuickReplyPanel(settings, editor);
    var mount = getQuickReplyMount(editor);
    if (!panel || !mount || !mount.parent) return;

    if (mount.before && /^tr$/i.test(mount.before.nodeName || '') && /^tbody$/i.test(mount.parent.nodeName || '')) {
      var tr = createEl('tr');
      var td = createEl('td');
      td.colSpan = 20;
      tr.appendChild(td);
      td.appendChild(panel);
      mount.parent.insertBefore(tr, mount.before);
      return;
    }
    mount.parent.insertBefore(panel, mount.before);
  }

  function createSettingsPanel(settings, state) {
    var panel = qs('#spx-settings');
    if (panel) return panel;

    var settingLabels = {
      adBlock: '隐藏广告',
      cleanMode: '清爽模式',
      homeDashboard: '首页模块全屏',
      readerMode: '阅读排版优化',
      immersiveRead: '帖子页沉浸全屏',
      unifiedPreviewGallery: '预览图集中显示',
      compactRead: '阅读页紧凑',
      foldQuotes: '折叠长引用',
      hideUserProfile: '隐藏头像资料',
      unreadOnly: '列表只看未读',
      onlyOriginalAuthor: '阅读页只看楼主',
    };
    var settingKeys = getSettingsPanelKeys(location.href, document);
    var settingControls = settingKeys.map(function renderSetting(key) {
      return '<label><input type="checkbox" data-key="' + key + '"> ' + settingLabels[key] + '</label>';
    });

    panel = createEl('div', 'spx-settings');
    panel.id = 'spx-settings';
    panel.hidden = true;
    panel.innerHTML = [
      '<h3>South Plus 增强设置</h3>',
    ].concat(settingControls, [
      '<div>标题屏蔽关键词，每行一个</div>',
      '<textarea data-list="titleKeywords"></textarea>',
      '<div>作者屏蔽关键词，每行一个</div>',
      '<textarea data-list="authorKeywords"></textarea>',
      '<div>快捷回复语句，每行一个</div>',
      '<div class="spx-help">帖子详情页或回复页会显示为快捷按钮；点击只填入内容，不会自动提交。</div>',
      '<textarea data-list="quickReplies"></textarea>',
      '<div class="spx-row">',
      '<button class="spx-primary" data-action="save">保存</button>',
      '<button data-action="clear-read">清空已读</button>',
      '<button data-action="close">关闭</button>',
      '</div>',
    ]).join('');
    document.body.appendChild(panel);

    function syncForm() {
      qsa('input[data-key]', panel).forEach(function syncCheckbox(input) {
        input.checked = !!settings[input.dataset.key];
      });
      qsa('textarea[data-list]', panel).forEach(function syncList(textarea) {
        textarea.value = (settings[textarea.dataset.list] || []).join('\n');
      });
    }

    function saveForm() {
      qsa('input[data-key]', panel).forEach(function readCheckbox(input) {
        settings[input.dataset.key] = input.checked;
      });
      qsa('textarea[data-list]', panel).forEach(function readList(textarea) {
        settings[textarea.dataset.list] = textarea.dataset.list === 'quickReplies'
          ? parseQuickReplyList(textarea.value)
          : parseLineList(textarea.value);
      });
      saveSettings(settings);
      enhanceAll(settings, state);
    }

    panel.addEventListener('click', function handleSettingsClick(event) {
      var action = event.target && event.target.dataset && event.target.dataset.action;
      if (!action) return;
      if (action === 'save') {
        saveForm();
        panel.hidden = true;
      }
      if (action === 'close') panel.hidden = true;
      if (action === 'clear-read') {
        state.read = {};
        saveMap(READ_KEY, state.read);
        enhanceAll(settings, state);
      }
    });

    panel.spxSync = syncForm;
    syncForm();
    return panel;
  }

  function createToolbar(settings, state) {
    if (qs('#spx-toolbar')) return;
    var toolbar = createEl('div', 'spx-toolbar');
    toolbar.id = 'spx-toolbar';
    var type = detectPageType(location.href);
    var page = currentPageNumber(location.href);

    toolbar.appendChild(toolbarButton('顶', '回到顶部', function top() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
    toolbar.appendChild(toolbarButton('底', '滚到底部', function bottom() {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }));

    if (shouldShowToolbarAction('prevPage', location.href, document)) {
      toolbar.appendChild(toolbarLink('上', '上一页', buildPageUrl(location.href, Math.max(1, page - 1))));
    }
    if (shouldShowToolbarAction('nextPage', location.href, document)) {
      toolbar.appendChild(toolbarLink('下', '下一页', buildPageUrl(location.href, page + 1)));
    }

    if (shouldShowToolbarFeature('latest')) {
      toolbar.appendChild(toolbarLink('新', '最新帖子', location.origin + '/search2.php?orderway-postdate-asc-desc-newatc-1.html'));
    }
    if (shouldShowToolbarAction('home', location.href, document)) {
      toolbar.appendChild(toolbarLink('首', '论坛首页', location.origin + '/index.php'));
    }

    if (shouldShowToolbarFeature('clean')) {
      var cleanButton = toolbarButton('净', '切换清爽模式', function toggleClean() {
        settings.cleanMode = !settings.cleanMode;
        saveSettings(settings);
        enhanceAll(settings, state);
        cleanButton.classList.toggle('spx-active', settings.cleanMode);
      });
      cleanButton.classList.toggle('spx-active', settings.cleanMode);
      toolbar.appendChild(cleanButton);
    }

    if (shouldShowToolbarAction('reader', location.href, document)) {
      var readerButton = toolbarButton('字', '切换阅读排版优化', function toggleReader() {
        settings.readerMode = !settings.readerMode;
        saveSettings(settings);
        enhanceAll(settings, state);
        readerButton.classList.toggle('spx-active', settings.readerMode);
      });
      readerButton.classList.toggle('spx-active', settings.readerMode);
      toolbar.appendChild(readerButton);
    }

    if (shouldShowToolbarAction('adBlock', location.href, document)) {
      var adButton = toolbarButton('广', '切换隐藏广告', function toggleAdBlock() {
        settings.adBlock = !settings.adBlock;
        saveSettings(settings);
        enhanceAll(settings, state);
        adButton.classList.toggle('spx-active', settings.adBlock);
      });
      adButton.classList.toggle('spx-active', settings.adBlock);
      toolbar.appendChild(adButton);
    }

    if (shouldShowToolbarAction('homeDashboard', location.href, document)) {
      var homeButton = toolbarButton('模', '切换首页模块全屏', function toggleHomeDashboard() {
        settings.homeDashboard = !settings.homeDashboard;
        saveSettings(settings);
        enhanceAll(settings, state);
        homeButton.classList.toggle('spx-active', settings.homeDashboard);
      });
      homeButton.classList.toggle('spx-active', settings.homeDashboard);
      toolbar.appendChild(homeButton);
    }

    if (shouldShowToolbarAction('immersiveRead', location.href, document)) {
      var immersiveButton = toolbarButton('屏', '切换帖子页沉浸全屏', function toggleImmersive() {
        settings.immersiveRead = !settings.immersiveRead;
        saveSettings(settings);
        enhanceAll(settings, state);
        immersiveButton.classList.toggle('spx-active', settings.immersiveRead);
      });
      immersiveButton.classList.toggle('spx-active', settings.immersiveRead);
      toolbar.appendChild(immersiveButton);
    }

    if (shouldShowToolbarAction('previewGallery', location.href, document)) {
      var previewButton = toolbarButton('图', '切换预览图集中显示', function togglePreviewGallery() {
        settings.unifiedPreviewGallery = !settings.unifiedPreviewGallery;
        saveSettings(settings);
        enhanceAll(settings, state);
        previewButton.classList.toggle('spx-active', settings.unifiedPreviewGallery);
      });
      previewButton.classList.toggle('spx-active', settings.unifiedPreviewGallery);
      toolbar.appendChild(previewButton);
    }

    if (shouldShowToolbarAction('unreadOnly', location.href, document)) {
      var unreadButton = toolbarButton('未', '只看未读', function toggleUnread() {
        settings.unreadOnly = !settings.unreadOnly;
        saveSettings(settings);
        enhanceAll(settings, state);
        unreadButton.classList.toggle('spx-active', settings.unreadOnly);
      });
      unreadButton.classList.toggle('spx-active', settings.unreadOnly);
      toolbar.appendChild(unreadButton);
    }

    if (shouldShowToolbarAction('onlyOriginalAuthor', location.href, document)) {
      var authorButton = toolbarButton('楼', '只看楼主', function toggleAuthor() {
        settings.onlyOriginalAuthor = !settings.onlyOriginalAuthor;
        saveSettings(settings);
        enhanceAll(settings, state);
        authorButton.classList.toggle('spx-active', settings.onlyOriginalAuthor);
      });
      authorButton.classList.toggle('spx-active', settings.onlyOriginalAuthor);
      toolbar.appendChild(authorButton);
    }

    toolbar.appendChild(toolbarButton('设', '打开设置', function openSettings() {
      var panel = createSettingsPanel(settings, state);
      if (panel.spxSync) panel.spxSync();
      panel.hidden = !panel.hidden;
    }));
    document.body.appendChild(toolbar);
  }

  function isEditableKeyboardTarget(target) {
    if (!target) return false;
    var tagName = String(target.tagName || '').toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      !!target.isContentEditable ||
      !!(target.closest && target.closest('[contenteditable="true"]'))
    );
  }

  function bindForumKeyboardPaging() {
    if (document.documentElement.dataset.spxForumKeyboardPagingReady === '1') return;
    document.documentElement.dataset.spxForumKeyboardPagingReady = '1';
    document.addEventListener('keydown', function handleForumKeyboardPaging(event) {
      if (!shouldUseForumKeyboardPaging(location.href)) return;
      if (!event || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isEditableKeyboardTarget(event.target)) return;

      var key = event.key || event.code;
      var page = currentPageNumber(location.href);
      if (key === 'ArrowLeft' || key === 'Left') {
        if (page <= 1) return;
        event.preventDefault();
        location.href = buildPageUrl(location.href, page - 1);
        return;
      }
      if (key === 'ArrowRight' || key === 'Right') {
        event.preventDefault();
        location.href = buildPageUrl(location.href, page + 1);
      }
    }, true);
  }

  function toolbarButton(text, title, onClick) {
    var button = createEl('button', '', text);
    button.type = 'button';
    button.title = title;
    button.addEventListener('click', onClick);
    return button;
  }

  function toolbarLink(text, title, href) {
    var link = createEl('a', '', text);
    link.title = title;
    link.href = href;
    return link;
  }

  function enhanceHome(settings) {
    if (detectPageType(location.href) !== 'home') return;
    enhanceHomeDashboard(settings);
    if (!settings.cleanMode) {
      qsa('[data-spx-home-hidden="1"]').forEach(function showTable(table) {
        table.style.display = '';
        delete table.dataset.spxHomeHidden;
      });
      return;
    }
    qsa('table').forEach(function markTable(table) {
      if (/友情链接|在线用户/.test(table.textContent || '')) {
        table.dataset.spxHomeHidden = '1';
        table.style.display = 'none';
      }
    });
  }

  function enhanceHomeDashboard(settings) {
    restoreHomeDashboard();
    if (!shouldUseHomeDashboard(settings, location.href)) return;

    createHomeQuickLinks();
    var modules = qsa('#content .t[id^="t_"]');
    if (!modules.length) return;

    var grid = createEl('div');
    grid.id = 'spx-home-grid';
    modules[0].parentNode.insertBefore(grid, modules[0]);

    modules.forEach(function markModule(module) {
      var marker = createEl('span');
      marker.dataset.spxHomeMarker = module.id || 'module';
      marker.style.display = 'none';
      module.parentNode.insertBefore(marker, module);
      grid.appendChild(module);

      module.classList.add('spx-home-module');
      var rows = qsa('tr.tr3', module);
      if (rows.length > 6) module.dataset.spxLarge = '1';

      var header = qs('.h', module) || qs('h2', module);
      if (header && !qs('.spx-home-collapse', header)) {
        var collapse = createEl('button', 'spx-home-collapse', '折叠');
        collapse.type = 'button';
        collapse.addEventListener('click', function toggleModule() {
          var collapsed = module.dataset.spxCollapsed === '1';
          module.dataset.spxCollapsed = collapsed ? '0' : '1';
          setHomeModuleCollapsed(rows, !collapsed);
          collapse.textContent = collapsed ? '折叠' : '展开';
        });
        header.appendChild(collapse);
      }

      rows.forEach(function markForumRow(row) {
        var titleNode = qs('[id^="fn_"]', row);
        if (!titleNode || titleNode.dataset.spxHomeReady) return;
        titleNode.dataset.spxHomeReady = '1';
        var today = parseTodayCount(titleNode.textContent);
        if (today > 0) {
          row.classList.add('spx-home-hot');
          var badge = createEl('span', 'spx-home-badge', String(today));
          titleNode.appendChild(badge);
        }
      });
    });
  }

  function restoreHomeDashboard() {
    var quick = qs('#spx-home-quick');
    if (quick) quick.remove();
    qsa('.spx-home-module').forEach(function restoreModule(module) {
      var marker = qsa('[data-spx-home-marker]').filter(function findMarker(item) {
        return item.dataset.spxHomeMarker === (module.id || 'module');
      })[0];
      if (marker && marker.parentNode) {
        marker.parentNode.insertBefore(module, marker);
      }
      module.classList.remove('spx-home-module');
      delete module.dataset.spxLarge;
      delete module.dataset.spxCollapsed;
      qsa('.spx-home-collapse', module).forEach(function removeButton(button) {
        button.remove();
      });
      qsa('tr.tr3', module).forEach(function restoreRow(row) {
        setHomeModuleCollapsed([row], false);
        row.classList.remove('spx-home-hot');
      });
      qsa('[data-spx-home-ready="1"]', module).forEach(function restoreTitle(titleNode) {
        delete titleNode.dataset.spxHomeReady;
      });
      qsa('.spx-home-badge', module).forEach(function removeBadge(badge) {
        badge.remove();
      });
    });
    qsa('[data-spx-home-marker]').forEach(function removeMarker(marker) {
      marker.remove();
    });
    var grid = qs('#spx-home-grid');
    if (grid) grid.remove();
  }

  function createHomeQuickLinks() {
    if (qs('#spx-home-quick')) return;
    var quickItems = [
      { label: '茶馆', fid: '9' },
      { label: '询问&求物', fid: '48' },
      { label: '免空资源区', fid: '13' },
      { label: 'GALGAME汉化区', fid: '128' },
      { label: 'AI交流', fid: '208' },
      { label: '最新帖子', href: '/search2.php?orderway-postdate-asc-desc-newatc-1.html' },
    ];
    var quick = createEl('nav', 'spx-home-quick');
    quick.id = 'spx-home-quick';
    quickItems.forEach(function appendQuick(item) {
      var link = createEl('a');
      link.href = item.href ? location.origin + item.href : location.origin + '/thread.php?fid-' + item.fid + '.html';
      link.textContent = item.label;
      link.appendChild(createEl('span', '', item.href ? 'new' : 'fid-' + item.fid));
      quick.appendChild(link);
    });
    var main = qs('#main') || document.body;
    var content = qs('#content');
    if (content && content.parentNode) {
      content.parentNode.insertBefore(quick, content);
    } else {
      main.insertBefore(quick, main.firstChild);
    }
  }

  function enhanceAdBlock(settings) {
    restoreAdBlock();
    if (!settings.adBlock) return;

    qsa('a[href], area[href]').forEach(function hideAdLink(link) {
      if (!isAdUrl(link.href)) return;
      markAdHidden(link);

      var cell = link.closest('td');
      if (cell && isMostlyAdContainer(cell)) markAdHidden(cell);

      var row = link.closest('tr');
      if (row && isMostlyAdContainer(row)) markAdHidden(row);

      var box = link.closest('div');
      if (box && box.id !== 'header' && box.id !== 'mainNav' && isMostlyAdContainer(box)) {
        markAdHidden(box);
      }
    });

    qsa('img[src]').forEach(function hideAdImage(img) {
      if (!isAdUrl(img.src)) return;
      markAdHidden(img);
      var link = img.closest('a');
      if (link) markAdHidden(link);
    });
  }

  function markAdHidden(node) {
    if (!node || node.dataset.spxAdHidden === '1') return;
    node.dataset.spxAdPreviousDisplay = node.style.display || '';
    node.dataset.spxAdHidden = '1';
    node.classList.add('spx-ad-hidden');
    node.style.display = 'none';
  }

  function restoreAdBlock() {
    qsa('[data-spx-ad-hidden="1"]').forEach(function restoreAd(node) {
      node.classList.remove('spx-ad-hidden');
      node.style.display = node.dataset.spxAdPreviousDisplay || '';
      delete node.dataset.spxAdHidden;
      delete node.dataset.spxAdPreviousDisplay;
    });
  }

  function isMostlyAdContainer(node) {
    if (!node) return false;
    var text = (node.textContent || '').replace(/\s+/g, '');
    var links = qsa('a[href], area[href]', node);
    var images = qsa('img', node);
    if (!links.length && !images.length) return false;
    var adLinks = links.filter(function checkLink(link) {
      return isAdUrl(link.href);
    });
    if (adLinks.length && adLinks.length === links.length && text.length < 20) return true;
    if (images.length && text.length < 12 && node.getBoundingClientRect && node.getBoundingClientRect().height <= 180) return true;
    return false;
  }

  function enhanceAll(settings, state) {
    setBodyClasses(settings);
    applySiteShellLayout(document);
    enhanceSiteNavigation(document);
    enhanceAccountNavigation(document);
    enhanceAdBlock(settings);
    enhanceHome(settings);
    enhanceThreadList(settings, state);
    enhanceReadPage(settings, state);
    enhanceQuickReply(settings);
    var panel = qs('#spx-settings');
    if (panel && panel.spxSync) panel.spxSync();
  }

  function init() {
    if (testMode || typeof window === 'undefined' || !document.body) return;
    var settings = loadSettings();
    var state = {
      read: loadMap(READ_KEY),
      watch: loadMap(WATCH_KEY),
    };
    injectStyles();
    setBodyClasses(settings);
    createToolbar(settings, state);
    createSettingsPanel(settings, state);
    bindForumKeyboardPaging();
    enhanceAll(settings, state);
  }

  return {
    init: init,
    getDefaultSettings: function getDefaultSettings() {
      return copySettings(DEFAULT_SETTINGS);
    },
    parseThreadId: parseThreadId,
    parseLineList: parseLineList,
    parseQuickReplyList: parseQuickReplyList,
    matchesBlockRules: matchesBlockRules,
    parseForumFilterQuery: parseForumFilterQuery,
    matchesForumFilter: matchesForumFilter,
    extractPreviewImageUrls: extractPreviewImageUrls,
    markThreadsRead: markThreadsRead,
    findThreadIdsByAuthor: findThreadIdsByAuthor,
    isStickyCell: isStickyCell,
    hideStickyThreads: hideStickyThreads,
    hideForumAnnouncementPanels: hideForumAnnouncementPanels,
    isPreviewImageCandidate: isPreviewImageCandidate,
    isAdUrl: isAdUrl,
    parseTodayCount: parseTodayCount,
    shouldUseSiteShell: shouldUseSiteShell,
    shouldUseForumDashboard: shouldUseForumDashboard,
    shouldUseForumKeyboardPaging: shouldUseForumKeyboardPaging,
    shouldUseSearchPage: shouldUseSearchPage,
    shouldUseProfilePage: shouldUseProfilePage,
    shouldUseReaderMode: shouldUseReaderMode,
    shouldUseImmersiveRead: shouldUseImmersiveRead,
    shouldUseHomeDashboard: shouldUseHomeDashboard,
    shouldShowToolbarFeature: shouldShowToolbarFeature,
    hasPreviewGalleryImages: hasPreviewGalleryImages,
    shouldShowToolbarAction: shouldShowToolbarAction,
    getSettingsPanelKeys: getSettingsPanelKeys,
    buildPageUrl: buildPageUrl,
    detectPageType: detectPageType,
    getInjectedStyleText: getInjectedStyleText,
    applySiteShellLayout: applySiteShellLayout,
    enhanceSiteNavigation: enhanceSiteNavigation,
    applyReadPostLayout: applyReadPostLayout,
    isEmptyReadSeparatorNode: isEmptyReadSeparatorNode,
    getPostToolsHost: getPostToolsHost,
    syncHiddenPostShell: syncHiddenPostShell,
    setHomeModuleCollapsed: setHomeModuleCollapsed,
  };
});

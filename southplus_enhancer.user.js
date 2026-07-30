// ==UserScript==
// @name         South Plus +++
// @namespace    https://south-plus.org/
// @version      0.2.1
// @description  South Plus +++ 是一款集界面与阅读优化、帖子筛选屏蔽、快捷导航回复及自动购买等功能于一体的 South Plus 系列论坛增强脚本。
// @author       local
// @match        *://*.south-plus.net/*
// @match        *://south-plus.net/*
// @match        *://*.south-plus.org/*
// @match        *://south-plus.org/*
// @match        *://*.white-plus.net/*
// @match        *://white-plus.net/*
// @match        *://*.north-plus.net/*
// @match        *://north-plus.net/*
// @match        *://*.level-plus.net/*
// @match        *://level-plus.net/*
// @match        *://*.soul-plus.net/*
// @match        *://soul-plus.net/*
// @match        *://*.snow-plus.net/*
// @match        *://snow-plus.net/*
// @match        *://*.spring-plus.net/*
// @match        *://spring-plus.net/*
// @match        *://*.summer-plus.net/*
// @match        *://summer-plus.net/*
// @match        *://*.blue-plus.net/*
// @match        *://blue-plus.net/*
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
  var PROGRESS_KEY = APP + ':readProgress:v1';
  var RESTORE_PROGRESS_KEY = APP + ':restoreProgressTid:v1';
  var AUTO_BUY_KEY = APP + ':autoBuyAttempts:v1';
  var RESOURCE_KEY = APP + ':resources:v1';
  var AUTO_BUY_CHECK_TTL = 10 * 60 * 1000;
  var AUTO_BUY_ATTEMPT_LIMIT = 100;
  var RESOURCE_LIMIT = 500;
  var READ_PROGRESS_LIMIT = 200;
  var STALE_PROGRESS_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  var LOCAL_STORAGE_WARNING_BYTES = 4 * 1024 * 1024;
  var PREVIEW_GALLERY_BATCH_SIZE = 36;
  var RESOURCE_STATUSES = {
    saved: '已保存',
    todo: '待下载',
    done: '已处理',
    invalid: '已失效',
  };
  var RESOURCE_CATEGORIES = {
    magnet: '磁力',
    ed2k: '电驴',
    torrent: '种子',
    archive: '压缩包',
    cloud: '网盘',
    image: '图片',
    external: '外链',
  };
  var CLOUD_RESOURCE_HOST_PATTERN = [
    'pan\\.baidu\\.com',
    'yun\\.baidu\\.com',
    'aliyundrive\\.com',
    'alipan\\.com',
    'quark\\.cn',
    'drive\\.uc\\.cn',
    '115\\.com',
    'mega\\.nz',
    'terabox\\.com',
    'lanzou[a-z]?\\.com',
    'ilanzou\\.com',
    'weiyun\\.com',
    'cloud\\.189\\.cn',
    '123pan\\.com',
    'mypikpak\\.com',
    'pikpak\\.com',
    'mediafire\\.com',
    '4shared\\.com',
    'onedrive\\.live\\.com',
    'pan\\.xunlei\\.com',
    'cowtransfer\\.com',
    'feijipan\\.com',
  ].join('|');
  var CLOUD_RESOURCE_HOST_RE = new RegExp('(?:^|\\.)(?:' + CLOUD_RESOURCE_HOST_PATTERN + ')$', 'i');
  var CLOUD_RESOURCE_PATH_RE = new RegExp('^(?:(?:www|share|pan)\\.)?(?:' + CLOUD_RESOURCE_HOST_PATTERN + ')\\/', 'i');
  var TORRENT_RESOURCE_EXT_RE = /\.torrent(?:[?#&]|$)/i;
  var ARCHIVE_RESOURCE_EXT_RE = /\.(?:zip|rar|7z|tar|tgz|gz|bz2|xz|iso|001)(?:[?#&]|$)/i;
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
    autoBuyPost: false,
    autoBuyMaxSp: 5,
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

  function normalizeListValue(value, parser) {
    var source = value || [];
    return parser(source.join ? source.join('\n') : source);
  }

  function parseTagList(value) {
    var seen = {};
    return String(value || '')
      .replace(/\\n/g, '\n')
      .split(/[\n,，、#]+/)
      .map(function trimTag(tag) {
        return tag.trim().replace(/\s+/g, ' ');
      })
      .filter(function keepTag(tag) {
        var key = tag.toLowerCase();
        if (!tag || seen[key]) return false;
        seen[key] = true;
        return true;
      })
      .slice(0, 12);
  }

  function mergeTagLists() {
    var seen = {};
    var result = [];
    Array.prototype.slice.call(arguments).forEach(function readTags(tags) {
      normalizeListValue(tags, parseTagList).forEach(function addTag(tag) {
        var key = tag.toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        result.push(tag);
      });
    });
    return result;
  }

  function formatTags(tags) {
    var values = normalizeListValue(tags, parseTagList);
    return values.length ? values.join(' / ') : '';
  }

  function clampRatio(value) {
    var ratio = Number(value);
    if (!isFinite(ratio)) return 0;
    return Math.min(1, Math.max(0, ratio));
  }

  function getReadProgressPercent(record) {
    return Math.round(clampRatio(record && record.progress) * 100);
  }

  function isCompletedReadProgress(record) {
    return !!(record && record.updatedAt && getReadProgressPercent(record) >= 100);
  }

  function mergeReadProgressRecord(previous, next) {
    if (!next) return previous || null;
    if (isCompletedReadProgress(previous) && !isCompletedReadProgress(next)) return previous;
    if (previous && previous.tags && !next.tags) {
      next.tags = normalizeListValue(previous.tags, parseTagList);
    }
    return next;
  }

  function formatReadProgress(record) {
    if (!record || !record.updatedAt) return '';
    var percent = getReadProgressPercent(record);
    var page = Number(record.page) || 1;
    return (page > 1 ? '第 ' + page + ' 页 · ' : '') + percent + '%';
  }

  function getReadProgressFloorLabels(record) {
    return {
      last: String((record && record.floorLabel) || ''),
      next: String((record && (record.nextFloorLabel || record.floorLabel)) || ''),
    };
  }

  function getReadProgressRestoreTarget(record, mode) {
    var currentMode = mode === 'last' ? 'last' : 'next';
    var lastTop = Math.max(0, Number(record && (record.floorTop !== undefined ? record.floorTop : record.scrollY)) || 0);
    var nextTop = Math.max(
      0,
      Number(record && (record.nextFloorTop !== undefined ? record.nextFloorTop : record.floorTop !== undefined ? record.floorTop : record.scrollY)) || 0
    );
    if (currentMode === 'last') {
      return {
        mode: 'last',
        hash: String((record && record.floorHash) || ''),
        top: lastTop,
        label: String((record && record.floorLabel) || ''),
      };
    }
    return {
      mode: 'next',
      hash: String((record && (record.nextFloorHash || record.floorHash)) || ''),
      top: nextTop,
      label: String((record && (record.nextFloorLabel || record.floorLabel)) || ''),
    };
  }

  function pruneReadProgress(progress, limit) {
    var source = progress || {};
    var max = Math.max(1, Number(limit) || READ_PROGRESS_LIMIT);
    var keys = Object.keys(source)
      .filter(function hasProgress(key) {
        return source[key] && source[key].updatedAt;
      })
      .sort(function sortByUpdatedAt(left, right) {
        return (Number(source[right].updatedAt) || 0) - (Number(source[left].updatedAt) || 0);
      })
      .slice(0, max);
    var result = {};
    keys.forEach(function keepProgress(key) {
      result[key] = source[key];
    });
    return result;
  }

  function getWatchCenterEntries(watch, progress) {
    var progressMap = progress || {};
    return Object.keys(watch || {})
      .filter(function hasWatchItem(key) {
        var item = watch[key];
        return item && (item.title || item.url);
      })
      .map(function toWatchEntry(key) {
        var item = watch[key] || {};
        var record = progressMap[key] || {};
        var floorLabels = getReadProgressFloorLabels(record);
        var tags = mergeTagLists(item.tags, record.tags);
        return {
          id: key,
          title: String(record.title || item.title || '未命名帖子'),
          url: String(item.url || record.url || ''),
          savedAt: Number(item.savedAt) || 0,
          progressAt: Number(record.updatedAt) || 0,
          progressUrl: String(record.url || item.url || ''),
          progressText: formatReadProgress(record),
          progressPercent: getReadProgressPercent(record),
          isCompleted: isCompletedReadProgress(record),
          floorLabel: floorLabels.last,
          nextFloorLabel: floorLabels.next,
          floorHash: String(record.floorHash || ''),
          nextFloorHash: String(record.nextFloorHash || record.floorHash || ''),
          tags: tags,
          tagText: formatTags(tags),
        };
      })
      .sort(function sortBySavedAt(left, right) {
        return (right.savedAt || 0) - (left.savedAt || 0);
      });
  }

  function getHistoryCenterEntries(progress) {
    return Object.keys(progress || {})
      .filter(function hasHistoryItem(key) {
        var item = progress[key];
        return item && (item.title || item.url) && item.updatedAt;
      })
      .map(function toHistoryEntry(key) {
        var item = progress[key] || {};
        var floorLabels = getReadProgressFloorLabels(item);
        var tags = parseTagList(item.tags && item.tags.join ? item.tags.join('\n') : item.tags);
        return {
          id: key,
          title: String(item.title || '未命名帖子'),
          url: String(item.url || ''),
          page: Number(item.page) || 1,
          scrollY: Math.max(0, Number(item.scrollY) || 0),
          progressAt: Number(item.updatedAt) || 0,
          progressText: formatReadProgress(item),
          progressPercent: getReadProgressPercent(item),
          isCompleted: isCompletedReadProgress(item),
          floorLabel: floorLabels.last,
          nextFloorLabel: floorLabels.next,
          floorHash: String(item.floorHash || ''),
          nextFloorHash: String(item.nextFloorHash || item.floorHash || ''),
          tags: tags,
          tagText: formatTags(tags),
        };
      })
      .sort(function sortByProgressAt(left, right) {
        return (right.progressAt || 0) - (left.progressAt || 0);
      });
  }

  function getAutoBuyStatusLabel(status) {
    var labels = {
      checking: '检查中',
      skipped: '已跳过',
      buying: '购买中',
      done: '已完成',
      failed: '失败',
    };
    return labels[status] || '未知';
  }

  function getAutoBuyCenterEntries(attempts) {
    return Object.keys(attempts || {})
      .filter(function hasAttempt(key) {
        return attempts[key] && attempts[key].status;
      })
      .map(function toAutoBuyEntry(key) {
        var item = attempts[key] || {};
        return {
          key: key,
          status: String(item.status || ''),
          statusLabel: getAutoBuyStatusLabel(item.status),
          message: String(item.message || ''),
          url: String(item.url || ''),
          price: item.price === undefined ? null : Number(item.price),
          balance: item.balance === undefined ? null : Number(item.balance),
          updatedAt: Number(item.updatedAt) || 0,
        };
      })
      .sort(function sortByUpdatedAt(left, right) {
        return (right.updatedAt || 0) - (left.updatedAt || 0);
      });
  }

  function normalizeCenterSearchQuery(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function matchesCenterSearch(query, values) {
    if (!query) return true;
    return (values || []).some(function hasSearchValue(value) {
      return String(value || '').toLowerCase().indexOf(query) !== -1;
    });
  }

  function filterWatchCenterEntries(entries, options) {
    var query = normalizeCenterSearchQuery(options && options.query);
    var filter = String((options && options.filter) || 'all');
    var tag = String((options && options.tag) || 'all').toLowerCase();
    return (entries || []).filter(function matchWatchEntry(entry) {
      if (!matchesCenterSearch(query, [entry.title, entry.progressText, entry.floorLabel, entry.nextFloorLabel, entry.tagText])) return false;
      if (tag !== 'all' && parseTagList(entry.tags).map(function lower(item) { return item.toLowerCase(); }).indexOf(tag) === -1) return false;
      if (filter === 'todo') return !entry.isCompleted;
      if (filter === 'progress') return !!entry.progressAt;
      if (filter === 'done') return !!entry.isCompleted;
      return true;
    });
  }

  function filterHistoryCenterEntries(entries, options) {
    var query = normalizeCenterSearchQuery(options && options.query);
    var filter = String((options && options.filter) || 'all');
    var tag = String((options && options.tag) || 'all').toLowerCase();
    return (entries || []).filter(function matchHistoryEntry(entry) {
      if (!matchesCenterSearch(query, [entry.title, entry.progressText, entry.floorLabel, entry.nextFloorLabel, entry.tagText])) return false;
      if (tag !== 'all' && parseTagList(entry.tags).map(function lower(item) { return item.toLowerCase(); }).indexOf(tag) === -1) return false;
      if (filter === 'todo') return !entry.isCompleted;
      if (filter === 'done') return !!entry.isCompleted;
      return true;
    });
  }

  function getCenterTagOptions(entries) {
    var tags = [];
    (entries || []).forEach(function collectEntryTags(entry) {
      tags = mergeTagLists(tags, entry && entry.tags);
    });
    return tags
      .sort(function sortTags(left, right) {
        return left.localeCompare(right, 'zh-Hans-CN');
      })
      .map(function toOption(tag) {
        return { value: tag, label: tag };
      });
  }

  function filterAutoBuyCenterEntries(entries, options) {
    var query = normalizeCenterSearchQuery(options && options.query);
    var filter = String((options && options.filter) || 'all');
    return (entries || []).filter(function matchAutoBuyEntry(entry) {
      if (!matchesCenterSearch(query, [entry.key, entry.statusLabel, entry.message, entry.url, entry.price, entry.balance])) return false;
      if (filter === 'all') return true;
      return entry.status === filter;
    });
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

  function getPreviewImageSource(image) {
    var data = image || {};
    var node = data.node || {};
    return String(data.src || data.currentSrc || node.currentSrc || node.src || '').trim();
  }

  function getPreviewImageSize(image) {
    var data = image || {};
    var node = data.node || {};
    return {
      width: Number(data.naturalWidth || node.naturalWidth || data.width || node.width || 0),
      height: Number(data.naturalHeight || node.naturalHeight || data.height || node.height || 0),
    };
  }

  function isLargePreviewImage(image) {
    var size = getPreviewImageSize(image);
    if (!size.width && !size.height) return true;
    return Math.max(size.width, size.height) >= 600 || (size.width >= 480 && size.height >= 360);
  }

  function formatPreviewImageLinks(images) {
    var seen = {};
    return (images || [])
      .map(getPreviewImageSource)
      .filter(function keepUniquePreviewLink(url) {
        if (!url || seen[url]) return false;
        seen[url] = true;
        return true;
      })
      .join('\n');
  }

  function getPreviewGalleryRenderState(total, limit, batchSize) {
    var count = Math.max(0, Number(total) || 0);
    var step = Math.max(1, Number(batchSize) || PREVIEW_GALLERY_BATCH_SIZE);
    var nextLimit = Math.max(0, Number(limit) || step);
    var rendered = Math.min(count, nextLimit);
    return {
      total: count,
      rendered: rendered,
      hasMore: rendered < count,
      nextLimit: Math.min(count, rendered + step),
    };
  }

  function formatPreviewGallerySummary(total, visibleCount, renderedCount, largeOnly) {
    var pageTotal = Math.max(0, Number(total) || 0);
    var visible = Math.max(0, Number(visibleCount) || 0);
    var renderedValue = renderedCount == null ? visible : Number(renderedCount);
    var rendered = Math.min(visible, Math.max(0, renderedValue || 0));
    if (largeOnly) {
      return rendered < visible
        ? '大图已显示 ' + rendered + ' / ' + visible + '（当前页 ' + pageTotal + ' 张），点击进入灯箱'
        : '大图 ' + visible + ' / 当前页 ' + pageTotal + ' 张，点击进入灯箱';
    }
    return rendered < visible
      ? '已显示 ' + rendered + ' / 当前页 ' + pageTotal + ' 张，点击进入灯箱'
      : '当前页 ' + pageTotal + ' 张，点击进入灯箱';
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
    var className = String(data.className || '');
    var alt = String(data.alt || '');

    if (!src) return false;
    if (/\/(?:face|avatar|avatars|uc_server)\/|\/images\/face\//i.test(src)) return false;
    if (/\/images\/post\/smile\//i.test(src)) return false;
    if (/\/images\/.*(?:face|smile|emotion|icon|common)/i.test(src)) return false;
    if (/(?:smile|emotion|face|avatar|head|icon)/i.test(className + ' ' + alt)) return false;
    if (width === 0 && height === 0) return true;
    if (width <= 80 && height <= 80) return false;
    return width >= 120 || height >= 120;
  }

  function trimResourceUrlToken(value) {
    return String(value || '')
      .replace(/&amp;/g, '&')
      .trim()
      .replace(/^[<"'“”‘’]+|[<>"'“”‘’]+$/g, '')
      .replace(/[，。；、\s]+$/g, '')
      .replace(/[)\]）】]+$/g, '');
  }

  function decodeResourceUrlToken(value) {
    var text = trimResourceUrlToken(value);
    for (var index = 0; index < 2; index += 1) {
      try {
        var decoded = decodeURIComponent(text);
        if (decoded === text) break;
        text = decoded;
      } catch (error) {
        break;
      }
    }
    return text;
  }

  function isResourceLikeToken(value) {
    var text = trimResourceUrlToken(value);
    return /^magnet:\?/i.test(text) ||
      /^ed2k:\/\//i.test(text) ||
      /^https?:\/\//i.test(text) ||
      /^\/\//.test(text) ||
      CLOUD_RESOURCE_PATH_RE.test(text);
  }

  function unwrapResourceRedirectUrl(value, pageUrl) {
    var text = trimResourceUrlToken(value);
    if (!text) return '';

    var decoded = decodeResourceUrlToken(text);
    var parsed;
    try {
      parsed = new URL(decoded, pageUrl || 'https://south-plus.org/');
    } catch (error) {
      return decoded;
    }

    var paramNames = [
      'url',
      'u',
      'target',
      'to',
      'link',
      'href',
      'go',
      'jump',
      'redirect',
      'redirect_url',
      'redirect_uri',
      'r',
      'site',
      'src',
      'source',
      'file',
      'down',
      'download',
    ];
    for (var index = 0; index < paramNames.length; index += 1) {
      var raw = parsed.searchParams.get(paramNames[index]);
      var candidate = decodeResourceUrlToken(raw);
      if (candidate && isResourceLikeToken(candidate)) return candidate;
    }

    var queryText = [
      decodeResourceUrlToken(parsed.search.slice(1)),
      decodeResourceUrlToken(parsed.hash.replace(/^#/, '')),
      decoded,
    ].join(' ');
    var resourceMatch = queryText.match(new RegExp(
      "(magnet:\\?xt=urn:[^\\s<>\"'，。；、)）\\]]+|ed2k:\\/\\/\\|file\\|[^\\s<>\"'，。；、)）\\]]+|https?:\\/\\/[^\\s<>\"'，。；、)）\\]]+|(?:(?:www|share|pan)\\.)?(?:" +
        CLOUD_RESOURCE_HOST_PATTERN +
        ")\\/[^\\s<>\"'，。；、)）\\]]+)",
      'i'
    ));
    return resourceMatch ? resourceMatch[1] : decoded;
  }

  function normalizeResourceUrl(value, pageUrl) {
    var text = unwrapResourceRedirectUrl(value, pageUrl);
    if (!text) return '';
    if (/^(?:javascript|mailto|tel|data):/i.test(text) || text.charAt(0) === '#') return '';
    if (/^magnet:\?/i.test(text)) return text;
    if (/^ed2k:\/\//i.test(text)) return text;
    if (CLOUD_RESOURCE_PATH_RE.test(text)) {
      text = 'https://' + text;
    }
    if (/^\/\//.test(text)) text = 'https:' + text;
    try {
      return new URL(text, pageUrl || 'https://south-plus.org/').href;
    } catch (error) {
      return '';
    }
  }

  function classifyResourceLink(url) {
    var text = String(url || '');
    var lower = text.toLowerCase();
    if (/^magnet:\?/i.test(text)) return 'magnet';
    if (/^ed2k:\/\//i.test(text)) return 'ed2k';
    if (TORRENT_RESOURCE_EXT_RE.test(lower)) return 'torrent';
    if (ARCHIVE_RESOURCE_EXT_RE.test(lower)) return 'archive';
    try {
      var parsedUrl = new URL(text);
      var host = parsedUrl.hostname.toLowerCase();
      var path = decodeURIComponent(parsedUrl.pathname || '').toLowerCase();
      if (TORRENT_RESOURCE_EXT_RE.test(path)) return 'torrent';
      if (ARCHIVE_RESOURCE_EXT_RE.test(path)) return 'archive';
      if (CLOUD_RESOURCE_HOST_RE.test(host)) return 'cloud';
    } catch (error) {
      if (CLOUD_RESOURCE_PATH_RE.test(lower)) return 'cloud';
    }
    if (/\.(?:jpe?g|png|gif|webp|bmp|avif)(?:[?#]|$)/i.test(lower)) return 'image';
    if (/^https?:\/\//i.test(text)) return 'external';
    return '';
  }

  function getCloudProviderLabel(url) {
    var host = '';
    try {
      host = new URL(normalizeResourceUrl(url)).hostname.toLowerCase();
    } catch (error) {
      host = String(url || '').toLowerCase();
    }

    if (/baidu\.com$/.test(host)) return '百度网盘';
    if (/(?:aliyundrive|alipan)\.com$/.test(host)) return '阿里云盘';
    if (/quark\.cn$/.test(host)) return '夸克网盘';
    if (/drive\.uc\.cn$/.test(host)) return 'UC网盘';
    if (/115\.com$/.test(host)) return '115网盘';
    if (/mega\.nz$/.test(host)) return 'MEGA';
    if (/terabox\.com$/.test(host)) return 'Terabox';
    if (/lanzou[a-z]?\.com$|ilanzou\.com$/.test(host)) return '蓝奏云';
    if (/weiyun\.com$/.test(host)) return '腾讯微云';
    if (/cloud\.189\.cn$/.test(host)) return '天翼云盘';
    if (/123pan\.com$/.test(host)) return '123云盘';
    if (/(?:mypikpak|pikpak)\.com$/.test(host)) return 'PikPak';
    if (/mediafire\.com$/.test(host)) return 'MediaFire';
    if (/4shared\.com$/.test(host)) return '4shared';
    if (/onedrive\.live\.com$/.test(host)) return 'OneDrive';
    if (/pan\.xunlei\.com$/.test(host)) return '迅雷云盘';
    if (/cowtransfer\.com$/.test(host)) return '奶牛快传';
    if (/feijipan\.com$/.test(host)) return '小飞机网盘';
    return '其他网盘';
  }

  function getResourceDisplayLabel(item) {
    var data = typeof item === 'string' ? { url: item } : (item || {});
    var type = data.type || classifyResourceLink(data.url);
    if (type === 'cloud') return getCloudProviderLabel(data.url);
    return RESOURCE_CATEGORIES[type] || data.label || '链接';
  }

  function extractResourceAccessCode(value) {
    var text = String(value || '').replace(/\s+/g, ' ');
    var compactText = text.replace(/\s+/g, '');
    var match = text.match(/(?:提取码|提取碼|提取密码|访问码|访问密码|分享码|分享密码|取件码|取件密码|解压码|解压密码|密码|pass(?:word)?|pwd|code|access\s*code)\s*(?:是|为)?\s*[:：=]?\s*([A-Za-z0-9]{3,12})/i) ||
      compactText.match(/(?:提取码|提取碼|提取密码|访问码|访问密码|分享码|分享密码|取件码|取件密码|解压码|解压密码|密码)(?:是|为)?[:：=]?([A-Za-z0-9]{3,12})/i);
    return match ? match[1] : '';
  }

  function createResourceLink(url, meta) {
    var normalized = normalizeResourceUrl(url, meta && meta.pageUrl);
    var type = (meta && meta.type) || classifyResourceLink(normalized);
    if (!normalized || !type) return null;
    var accessCode = type === 'cloud'
      ? extractResourceAccessCode(normalized + ' ' + ((meta && meta.text) || '') + ' ' + ((meta && meta.context) || ''))
      : '';
    return {
      url: normalized,
      type: type,
      label: getResourceDisplayLabel({ url: normalized, type: type }),
      accessCode: accessCode,
      text: String((meta && meta.text) || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      floorLabel: String((meta && meta.floorLabel) || ''),
      author: String((meta && meta.author) || ''),
      postIndex: Number(meta && meta.postIndex) || 0,
      sourceIndex: Number(meta && meta.sourceIndex) || 0,
    };
  }

  function dedupeResourceLinks(links) {
    var seen = {};
    var result = [];
    (links || []).forEach(function keepUniqueResourceLink(item) {
      if (!item || !item.url) return;
      var type = item.type || classifyResourceLink(item.url);
      if (!type) return;
      var key = type + '|' + item.url.toLowerCase();
      if (seen[key]) return;
      seen[key] = true;
      result.push(Object.assign({}, item, {
        type: type,
        label: getResourceDisplayLabel(Object.assign({}, item, { type: type })),
      }));
    });
    return result;
  }

  function extractResourceLinksFromText(text, pageUrl, meta) {
    var source = String(text || '');
    var links = [];
    var patterns = [
      /magnet:\?xt=urn:[^\s<>"'，。；、)）\]]+/ig,
      /ed2k:\/\/\|file\|[^\s<>"'，。；、)）\]]+/ig,
      /https?:\/\/[^\s<>"'，。；、)）\]]+/ig,
      new RegExp(
        "(?:(?:www|share|pan)\\.)?(?:" + CLOUD_RESOURCE_HOST_PATTERN + ")\\/[^\\s<>\"'，。；、)）\\]]+",
        'ig'
      ),
    ];
    patterns.forEach(function scanPattern(pattern) {
      var match;
      while ((match = pattern.exec(source))) {
        var item = createResourceLink(match[0], Object.assign({}, meta || {}, {
          pageUrl: pageUrl,
          sourceIndex: match.index,
          context: source.slice(match.index, match.index + match[0].length + 96),
        }));
        if (item) links.push(item);
      }
    });
    return dedupeResourceLinks(links.sort(function sortBySourceIndex(left, right) {
      return (Number(left.sourceIndex) || 0) - (Number(right.sourceIndex) || 0);
    }));
  }

  function extractResourceLinksFromNode(node, pageUrl, meta) {
    if (!node) return [];
    var links = [];
    qsa('a[href],area[href]', node).forEach(function collectAnchor(link) {
      var item = createResourceLink(link.getAttribute('href') || link.href, Object.assign({}, meta || {}, {
        pageUrl: pageUrl,
        text: link.textContent,
      }));
      if (item) links.push(item);
    });
    qsa('img[src],source[src]', node).forEach(function collectMedia(media) {
      var mediaMeta = Object.assign({}, meta || {}, {
        pageUrl: pageUrl,
        type: 'image',
        text: media.getAttribute('alt') || media.getAttribute('title') || '',
      });
      if (media.tagName === 'IMG' && !isPreviewImageCandidate({
        src: media.currentSrc || media.src,
        naturalWidth: media.naturalWidth,
        naturalHeight: media.naturalHeight,
        width: media.width,
        height: media.height,
        className: media.className,
        alt: media.alt,
      })) return;
      var item = createResourceLink(media.getAttribute('src') || media.currentSrc || media.src, mediaMeta);
      if (item) links.push(item);
    });
    return dedupeResourceLinks(links.concat(extractResourceLinksFromText(node.textContent, pageUrl, meta)));
  }

  function extractReadPageResourceLinks(posts, pageUrl) {
    var list = posts || [];
    var links = [];
    list.forEach(function collectPostResources(post, index) {
      var content = qs('.tpc_content', post) || post;
      var meta = {
        pageUrl: pageUrl,
        floorLabel: getPostFloorLabel(index),
        author: getPostAuthor(post),
        postIndex: index,
      };
      links = links.concat(extractResourceLinksFromNode(content, pageUrl, meta));
    });
    return dedupeResourceLinks(links);
  }

  function filterResourceLinks(links, options) {
    var config = options || {};
    var scope = config.scope || 'all';
    var category = config.category || 'all';
    return (links || []).filter(function keepResourceLink(item) {
      if (!item || !item.url) return false;
      if (category !== 'all' && item.type !== category) return false;
      if (scope === 'floor') return Number(item.postIndex) === Number(config.postIndex);
      if (scope === 'author') return !!config.author && item.author === config.author;
      return true;
    });
  }

  function formatResourceLinks(links) {
    return dedupeResourceLinks(links)
      .map(function formatResourceLine(item) {
        var parts = ['[' + (item.label || getResourceDisplayLabel(item)) + ']'];
        if (item.floorLabel) parts.push(item.floorLabel);
        if (item.author) parts.push(item.author);
        parts.push(item.url);
        if (item.accessCode) parts.push('提取码 ' + item.accessCode);
        return parts.join(' ');
      })
      .join('\n');
  }

  function normalizeResourceTags(value) {
    return normalizeListValue(value, parseTagList);
  }

  function formatResourceTags(tags) {
    return formatTags(normalizeResourceTags(tags));
  }

  function getJumpResourceLinks(links) {
    return dedupeResourceLinks(links).filter(function keepJumpResource(item) {
      return item && /^(?:magnet|ed2k|torrent|archive|cloud|external)$/.test(item.type || '');
    });
  }

  function getResourceDownloadQueueEntries(entries) {
    return getJumpResourceLinks(entries).filter(function keepTodoResource(item) {
      return normalizeResourceStatus(item.status) === 'todo';
    });
  }

  function formatResourceDownloadList(entries) {
    return getJumpResourceLinks(entries)
      .map(function formatResourceDownloadItem(item, index) {
        var lines = [
          '#' + (index + 1) + ' [' + (item.label || getResourceDisplayLabel(item)) + '] ' + item.url,
        ];
        var source = [item.sourceTitle, item.floorLabel, item.author].filter(Boolean).join(' · ');
        if (item.accessCode) lines.push('提取码：' + item.accessCode);
        if (source) lines.push('来源：' + source);
        if (item.sourceUrl) lines.push('来源链接：' + item.sourceUrl);
        if (item.note) lines.push('备注：' + item.note);
        if (formatResourceTags(item.tags)) lines.push('标签：' + formatResourceTags(item.tags));
        if (item.status) lines.push('状态：' + getResourceStatusLabel(item.status));
        return lines.join('\n');
      })
      .join('\n\n');
  }

  function formatResourceMarkdownList(entries) {
    return getJumpResourceLinks(entries)
      .map(function formatResourceMarkdownItem(item, index) {
        var lines = [
          (index + 1) + '. **' + (item.label || getResourceDisplayLabel(item)) + '**：' + item.url,
        ];
        var source = [item.sourceTitle, item.floorLabel, item.author].filter(Boolean).join(' · ');
        if (item.accessCode) lines.push('   - 提取码：' + item.accessCode);
        if (source) lines.push('   - 来源：' + source);
        if (item.sourceUrl) lines.push('   - 来源链接：' + item.sourceUrl);
        if (item.note) lines.push('   - 备注：' + item.note);
        if (formatResourceTags(item.tags)) lines.push('   - 标签：' + formatResourceTags(item.tags));
        if (item.status) lines.push('   - 状态：' + getResourceStatusLabel(item.status));
        return lines.join('\n');
      })
      .join('\n\n');
  }

  function formatResourceJumpSummary(links) {
    var counts = {};
    var order = [];
    getJumpResourceLinks(links).forEach(function countResourceLabel(item) {
      var label = item.label || getResourceDisplayLabel(item);
      if (!counts[label]) {
        counts[label] = 0;
        order.push(label);
      }
      counts[label] += 1;
    });
    return order.map(function formatSummary(label) {
      return label + ' ' + counts[label];
    }).join(' / ');
  }

  function normalizeResourceStatus(status) {
    var value = String(status || 'saved');
    return RESOURCE_STATUSES[value] ? value : 'saved';
  }

  function getResourceStatusLabel(status) {
    return RESOURCE_STATUSES[normalizeResourceStatus(status)] || RESOURCE_STATUSES.saved;
  }

  function getResourceLibraryKey(item) {
    var data = item || {};
    var url = normalizeResourceUrl(data.url, data.pageUrl || data.sourceUrl);
    var type = data.type || classifyResourceLink(url);
    if (!url || !type) return '';
    return type + '|' + url.toLowerCase();
  }

  function normalizeResourceRecord(record, key) {
    var source = record || {};
    var url = normalizeResourceUrl(source.url, source.pageUrl || source.sourceUrl);
    var type = source.type || classifyResourceLink(url);
    if (!url || !type) return null;
    var label = source.label || getResourceDisplayLabel({ url: url, type: type });
    var provider = type === 'cloud' ? getCloudProviderLabel(url) : label;
    var savedAt = Number(source.savedAt || source.updatedAt || Date.now()) || Date.now();
    var updatedAt = Number(source.updatedAt || savedAt) || savedAt;
    var canonicalKey = getResourceLibraryKey({ url: url, type: type });
    return {
      key: canonicalKey || key || '',
      url: url,
      type: type,
      label: label,
      provider: provider,
      accessCode: String(source.accessCode || ''),
      sourceTitle: String(source.sourceTitle || source.title || ''),
      sourceUrl: String(source.sourceUrl || source.pageUrl || ''),
      floorLabel: String(source.floorLabel || ''),
      author: String(source.author || ''),
      text: String(source.text || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      note: String(source.note || source.memo || '').replace(/\s+/g, ' ').trim().slice(0, 160),
      tags: normalizeResourceTags(source.tags),
      status: normalizeResourceStatus(source.status),
      savedAt: savedAt,
      updatedAt: updatedAt,
    };
  }

  function createResourceRecord(item, meta, timestamp) {
    var source = item || {};
    var context = meta || {};
    var now = Number(timestamp) || Date.now();
    return normalizeResourceRecord({
      url: source.url,
      type: source.type,
      label: source.label,
      accessCode: source.accessCode,
      sourceTitle: context.sourceTitle || source.sourceTitle,
      sourceUrl: context.sourceUrl || source.sourceUrl || source.pageUrl,
      floorLabel: source.floorLabel || context.floorLabel,
      author: source.author || context.author,
      text: source.text,
      note: source.note || context.note,
      tags: mergeTagLists(source.tags, context.tags),
      status: source.status || context.status || 'saved',
      savedAt: now,
      updatedAt: now,
    });
  }

  function mergeResourceRecord(previous, next) {
    if (!next) return previous || null;
    if (!previous) return next;
    return Object.assign({}, previous, next, {
      status: previous.status || next.status,
      savedAt: Number(previous.savedAt || next.savedAt) || next.savedAt,
      accessCode: next.accessCode || previous.accessCode || '',
      sourceTitle: next.sourceTitle || previous.sourceTitle || '',
      sourceUrl: next.sourceUrl || previous.sourceUrl || '',
      floorLabel: next.floorLabel || previous.floorLabel || '',
      author: next.author || previous.author || '',
      text: next.text || previous.text || '',
      note: next.note || previous.note || '',
      tags: mergeTagLists(previous.tags, next.tags),
      updatedAt: Math.max(Number(previous.updatedAt) || 0, Number(next.updatedAt) || 0),
    });
  }

  function pruneResourceLibrary(resources, limit) {
    var source = resources || {};
    var max = Math.max(1, Number(limit) || RESOURCE_LIMIT);
    var normalized = {};
    Object.keys(source).forEach(function normalizeResourceKey(key) {
      var record = normalizeResourceRecord(source[key], key);
      if (!record || !record.key) return;
      normalized[record.key] = mergeResourceRecord(normalized[record.key], record);
    });
    var keys = Object.keys(normalized)
      .sort(function sortByResourceFreshness(left, right) {
        return (Number(normalized[right].updatedAt || normalized[right].savedAt) || 0) -
          (Number(normalized[left].updatedAt || normalized[left].savedAt) || 0);
      })
      .slice(0, max);
    var result = {};
    keys.forEach(function keepResource(key) {
      result[key] = normalized[key];
    });
    return result;
  }

  function saveResourceLinksToLibrary(links, resources, meta, timestamp) {
    var target = pruneResourceLibrary(resources || {});
    var saved = 0;
    getJumpResourceLinks(links).forEach(function saveResourceLink(item) {
      var record = createResourceRecord(item, meta, timestamp);
      if (!record || !record.key) return;
      target[record.key] = mergeResourceRecord(target[record.key], record);
      saved += 1;
    });
    return {
      resources: pruneResourceLibrary(target),
      saved: saved,
    };
  }

  function getResourceCenterEntries(resources) {
    var library = pruneResourceLibrary(resources || {});
    return Object.keys(library)
      .map(function toResourceEntry(key) {
        var item = normalizeResourceRecord(library[key], key);
        if (!item) return null;
        return Object.assign({}, item, {
          statusLabel: getResourceStatusLabel(item.status),
          sourceText: [item.sourceTitle, item.floorLabel, item.author].filter(Boolean).join(' · '),
          tagText: formatResourceTags(item.tags),
          providerKey: (item.type === 'cloud' ? item.provider : item.label).toLowerCase(),
        });
      })
      .filter(Boolean)
      .sort(function sortResourceEntries(left, right) {
        return (right.updatedAt || right.savedAt || 0) - (left.updatedAt || left.savedAt || 0);
      });
  }

  function getResourceProviderOptions(entries) {
    var seen = {};
    return (entries || [])
      .map(function toProviderOption(entry) {
        var label = entry.type === 'cloud' ? entry.provider : entry.label;
        var value = String(label || '').toLowerCase();
        return { value: value, label: label || '未知来源' };
      })
      .filter(function keepUniqueProvider(option) {
        if (!option.value || seen[option.value]) return false;
        seen[option.value] = true;
        return true;
      })
      .sort(function sortProvider(left, right) {
        return left.label.localeCompare(right.label, 'zh-Hans-CN');
      });
  }

  function getResourceSourceGroupKey(entry) {
    var item = entry || {};
    return String(item.sourceUrl || item.sourceTitle || 'unknown');
  }

  function getResourceSourceGroupLabel(entry) {
    var item = entry || {};
    return String(item.sourceTitle || item.sourceUrl || '未知来源');
  }

  function groupResourceCenterEntries(entries) {
    var groups = {};
    var order = [];
    (entries || []).forEach(function collectResourceGroup(entry) {
      if (!entry) return;
      var key = getResourceSourceGroupKey(entry);
      if (!groups[key]) {
        groups[key] = {
          key: key,
          label: getResourceSourceGroupLabel(entry),
          sourceUrl: entry.sourceUrl || '',
          entries: [],
          updatedAt: 0,
        };
        order.push(key);
      }
      groups[key].entries.push(entry);
      groups[key].updatedAt = Math.max(groups[key].updatedAt, Number(entry.updatedAt || entry.savedAt) || 0);
    });
    return order.map(function mapResourceGroup(key) {
      return groups[key];
    }).sort(function sortResourceGroups(left, right) {
      return right.updatedAt - left.updatedAt;
    });
  }

  function filterResourceCenterEntries(entries, options) {
    var query = normalizeCenterSearchQuery(options && options.query);
    var status = String((options && options.filter) || 'all');
    var provider = String((options && options.provider) || 'all').toLowerCase();
    var tag = String((options && options.tag) || 'all').toLowerCase();
    return (entries || []).filter(function matchResourceEntry(entry) {
      if (!matchesCenterSearch(query, [
        entry.url,
        entry.label,
        entry.provider,
        entry.statusLabel,
        entry.sourceTitle,
        entry.floorLabel,
        entry.author,
        entry.accessCode,
        entry.text,
        entry.note,
        entry.tagText,
      ])) return false;
      if (status !== 'all' && entry.status !== status) return false;
      if (provider !== 'all' && entry.providerKey !== provider) return false;
      if (tag !== 'all' && normalizeResourceTags(entry.tags).map(function lowerResourceTag(item) {
        return item.toLowerCase();
      }).indexOf(tag) === -1) return false;
      return true;
    });
  }

  function ensureResourceSelection(panelState) {
    if (!panelState.selectedResources || typeof panelState.selectedResources !== 'object') {
      panelState.selectedResources = {};
    }
    return panelState.selectedResources;
  }

  function getSelectedResourceKeys(entries, panelState) {
    var selection = ensureResourceSelection(panelState || {});
    var valid = {};
    (entries || []).forEach(function collectValidResourceKey(entry) {
      if (entry && entry.key) valid[entry.key] = true;
    });
    return Object.keys(selection).filter(function keepSelectedResourceKey(key) {
      return !!selection[key] && !!valid[key];
    });
  }

  function setResourceSelection(entries, panelState, selected) {
    var selection = ensureResourceSelection(panelState || {});
    (entries || []).forEach(function setResourceSelected(entry) {
      if (!entry || !entry.key) return;
      if (selected) selection[entry.key] = true;
      else delete selection[entry.key];
    });
    return selection;
  }

  function getResourceEntriesByKeys(entries, keys) {
    var selected = {};
    (keys || []).forEach(function keepKey(key) {
      selected[key] = true;
    });
    return (entries || []).filter(function isSelectedResourceEntry(entry) {
      return entry && selected[entry.key];
    });
  }

  function clampPreviewZoom(value) {
    var zoom = Number(value);
    if (!isFinite(zoom)) return 1;
    return Math.min(4, Math.max(0.5, Math.round(zoom * 100) / 100));
  }

  function getPreviewLightboxKeyAction(event) {
    if (!event || event.altKey || event.ctrlKey || event.metaKey) return '';
    var key = event.key || event.code || '';
    if (key === 'Escape' || key === 'Esc') return 'close';
    if (key === 'ArrowLeft' || key === 'Left') return 'previous';
    if (key === 'ArrowRight' || key === 'Right') return 'next';
    if (key === '+' || key === '=' || key === 'Add') return 'zoomIn';
    if (key === '-' || key === '_' || key === 'Subtract') return 'zoomOut';
    if (key === '0' || key === 'Digit0' || key === 'Numpad0') return 'zoomReset';
    return '';
  }

  function parsePostPrice(value) {
    var text = String(value || '').replace(/\s+/g, ' ');
    var patterns = [
      /(?:此帖|本帖|帖子)?\s*(?:售价|价格)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*SP(?:币)?/i,
      /(?:购买(?:此帖)?(?:需要)?|购买需要|需要|需支付|花费)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*SP(?:币)?/i,
    ];
    for (var index = 0; index < patterns.length; index += 1) {
      var match = text.match(patterns[index]);
      if (match) return Number(match[1]);
    }
    return null;
  }

  function parseUserSpBalance(value) {
    var text = String(value || '').replace(/\s+/g, ' ');
    var patterns = [
      /SP(?:币)?\s*(?:余额|结余|可用)?\s*[:：]\s*([0-9]+(?:\.[0-9]+)?)/i,
      /(?:当前(?:拥有|余额)?|账户余额|帐户余额|可用余额|余额)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)\s*SP(?:币)?/i,
    ];
    for (var index = 0; index < patterns.length; index += 1) {
      var match = text.match(patterns[index]);
      if (match) return Number(match[1]);
    }
    return null;
  }

  function shouldAutoBuyPost(settings, price, balance) {
    var config = settings || {};
    var maxPrice = Number(config.autoBuyMaxSp);
    var postPrice = Number(price);
    var currentBalance = Number(balance);
    return !!config.autoBuyPost &&
      maxPrice > 0 &&
      postPrice >= 0 &&
      postPrice < maxPrice &&
      currentBalance >= postPrice;
  }

  function extractBuyTopicUrl(value, pageUrl) {
    var text = String(value || '').replace(/&amp;/g, '&');
    var quoted = text.match(/['"]([^'"]*job\.php\?[^'"]*action=buytopic[^'"]*)['"]/i);
    var direct = text.match(/(?:https?:\/\/[^'"\s]*job\.php\?[^'"\s]*action=buytopic[^'"\s]*|\/?job\.php\?[^'"\s]*action=buytopic[^'"\s]*)/i);
    var target = quoted ? quoted[1] : (direct ? direct[0] : '');
    if (!target) return '';
    try {
      return new URL(target, pageUrl || 'https://south-plus.org/').href;
    } catch (error) {
      return '';
    }
  }

  function getAutoBuyAttemptKey(targetUrl, pageUrl) {
    var tid = '';
    var pid = '';
    try {
      var url = new URL(String(targetUrl || ''), pageUrl || 'https://south-plus.org/');
      tid = url.searchParams.get('tid') || parseThreadId(pageUrl) || parseThreadId(targetUrl);
      pid = url.searchParams.get('pid') || 'tpc';
    } catch (error) {
      tid = parseThreadId(targetUrl) || parseThreadId(pageUrl);
      pid = 'tpc';
    }
    if (!tid) return '';
    return tid + ':' + (pid || 'tpc');
  }

  function isAutoBuyAttemptBlocked(record, now) {
    if (!record || !record.status) return false;
    if (record.status === 'skipped') return false;
    if (record.status === 'checking') {
      var checkedAt = Number(record.updatedAt) || 0;
      var currentTime = now === undefined ? Date.now() : Number(now);
      return !checkedAt || (currentTime - checkedAt) <= AUTO_BUY_CHECK_TTL;
    }
    return record.status === 'buying' || record.status === 'done' || record.status === 'failed';
  }

  function formatAutoBuyAttemptMessage(record) {
    var data = record || {};
    var labels = {
      checking: '上次检查尚未完成',
      buying: '已发起过购买请求',
      done: '已记录购买完成',
      failed: '上次自动购买失败',
    };
    var label = labels[data.status] || '已有自动购买记录';
    var detail = data.message ? '，记录：' + data.message : '';
    return '自动购买未重复执行：' + label + detail + '。如需重试，请清空自动购买记录后再操作。';
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
      'cleanMode',
      'readerMode',
      'immersiveRead',
      'unifiedPreviewGallery',
      'compactRead',
      'foldQuotes',
      'hideUserProfile',
      'autoBuyPost',
      'unreadOnly',
      'onlyOriginalAuthor',
    ];

    allKeys.forEach(function keepUsefulSetting(key) {
      if (key === 'cleanMode' && shouldShowToolbarFeature('clean')) keys.push(key);
      if (key === 'readerMode' && shouldShowToolbarAction('reader', url, root)) keys.push(key);
      if (key === 'immersiveRead' && shouldShowToolbarAction('immersiveRead', url, root)) keys.push(key);
      if (key === 'unifiedPreviewGallery' && shouldShowToolbarAction('previewGallery', url, root)) keys.push(key);
      if (key === 'compactRead' && detectPageType(url) === 'read') keys.push(key);
      if (key === 'foldQuotes' && detectPageType(url) === 'read') keys.push(key);
      if (key === 'hideUserProfile' && detectPageType(url) === 'read') keys.push(key);
      if (key === 'autoBuyPost') keys.push(key);
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

  function isPlainObject(value) {
    return !!value && Object.prototype.toString.call(value) === '[object Object]';
  }

  function cloneJson(value, fallback) {
    if (value === undefined) return fallback;
    return safeJsonParse(JSON.stringify(value), fallback);
  }

  function copyStorageMap(value) {
    if (!isPlainObject(value)) return {};
    var result = {};
    Object.keys(value).forEach(function copyMapEntry(key) {
      var item = value[key];
      if (item === undefined || typeof item === 'function') return;
      result[key] = cloneJson(item, item);
    });
    return result;
  }

  function normalizeSettings(value) {
    var settings = Object.assign(copySettings(DEFAULT_SETTINGS), isPlainObject(value) ? value : {});
    Object.keys(DEFAULT_SETTINGS).forEach(function normalizeSetting(key) {
      var defaultValue = DEFAULT_SETTINGS[key];
      if (typeof defaultValue === 'boolean') {
        settings[key] = !!settings[key];
      }
    });
    settings.autoBuyMaxSp = Math.max(0, Number(settings.autoBuyMaxSp) || 0);
    settings.titleKeywords = normalizeListValue(settings.titleKeywords, parseLineList);
    settings.authorKeywords = normalizeListValue(settings.authorKeywords, parseLineList);
    settings.quickReplies = normalizeListValue(settings.quickReplies, parseQuickReplyList);
    return settings;
  }

  function createBackupPayload(data, timestamp) {
    var source = data || {};
    return {
      app: APP,
      version: 1,
      exportedAt: Number(timestamp) || Date.now(),
      data: {
        settings: normalizeSettings(source.settings),
        read: copyStorageMap(source.read),
        watch: copyStorageMap(source.watch),
        progress: pruneReadProgress(copyStorageMap(source.progress)),
        autoBuyAttempts: pruneAutoBuyAttempts(copyStorageMap(source.autoBuyAttempts)),
        resources: pruneResourceLibrary(copyStorageMap(source.resources)),
      },
    };
  }

  function normalizeBackupPayload(value) {
    var payload = typeof value === 'string' ? safeJsonParse(value, null) : value;
    if (!isPlainObject(payload)) return null;
    var source = isPlainObject(payload.data) ? payload.data : payload;
    return createBackupPayload({
      settings: source.settings,
      read: source.read,
      watch: source.watch,
      progress: source.progress,
      autoBuyAttempts: source.autoBuyAttempts || source.autoBuy,
      resources: source.resources,
    }, payload.exportedAt);
  }

  function collectBackupPayload(settings, state) {
    return createBackupPayload({
      settings: settings,
      read: state && state.read,
      watch: state && state.watch,
      progress: state && state.progress,
      autoBuyAttempts: loadAutoBuyAttempts(),
      resources: state && state.resources,
    });
  }

  function countMapItems(value) {
    return Object.keys(value || {}).length;
  }

  function estimateTextBytes(value) {
    var text = String(value == null ? '' : value);
    if (typeof TextEncoder !== 'undefined') {
      try {
        return new TextEncoder().encode(text).length;
      } catch (error) {
        // Fall back to a small UTF-8 byte counter below.
      }
    }
    var bytes = 0;
    for (var index = 0; index < text.length; index += 1) {
      var code = text.charCodeAt(index);
      if (code <= 0x7f) bytes += 1;
      else if (code <= 0x7ff) bytes += 2;
      else if (code >= 0xd800 && code <= 0xdbff) {
        bytes += 4;
        index += 1;
      } else {
        bytes += 3;
      }
    }
    return bytes;
  }

  function stringifyStorageValue(value) {
    try {
      return JSON.stringify(value == null ? {} : value);
    } catch (error) {
      return '';
    }
  }

  function formatStorageBytes(bytes) {
    var size = Math.max(0, Number(bytes) || 0);
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(size >= 10 * 1024 ? 0 : 1) + ' KB';
    return (size / 1024 / 1024).toFixed(1) + ' MB';
  }

  function createStorageUsageEntry(key, label, value, count, limit) {
    var text = stringifyStorageValue(value);
    return {
      key: key,
      label: label,
      bytes: estimateTextBytes(text),
      size: formatStorageBytes(estimateTextBytes(text)),
      count: Math.max(0, Number(count) || 0),
      limit: Math.max(0, Number(limit) || 0),
    };
  }

  function collectStorageUsageReport(data) {
    var backup = createBackupPayload(data || {});
    var source = backup.data || {};
    var entries = [
      createStorageUsageEntry(STORE_KEY, '设置', source.settings, 1, 0),
      createStorageUsageEntry(READ_KEY, '已读记录', source.read, countMapItems(source.read), 0),
      createStorageUsageEntry(WATCH_KEY, '稍后看', source.watch, countMapItems(source.watch), 0),
      createStorageUsageEntry(PROGRESS_KEY, '阅读进度', source.progress, countMapItems(source.progress), READ_PROGRESS_LIMIT),
      createStorageUsageEntry(AUTO_BUY_KEY, '自动购买记录', source.autoBuyAttempts, countMapItems(source.autoBuyAttempts), AUTO_BUY_ATTEMPT_LIMIT),
      createStorageUsageEntry(RESOURCE_KEY, '资源库', source.resources, countMapItems(source.resources), RESOURCE_LIMIT),
    ];
    var totalBytes = entries.reduce(function sumBytes(total, entry) {
      return total + entry.bytes;
    }, 0);
    var largest = entries.slice().sort(function sortByBytes(left, right) {
      return right.bytes - left.bytes;
    })[0] || null;
    var suggestions = [];

    if (totalBytes >= LOCAL_STORAGE_WARNING_BYTES) {
      suggestions.push('本地存储接近浏览器常见上限，建议先导出备份再清理旧记录');
    }
    entries.forEach(function addLimitSuggestion(entry) {
      if (!entry.limit) return;
      if (entry.count >= Math.floor(entry.limit * 0.8)) {
        suggestions.push(entry.label + '接近 ' + entry.limit + ' 条上限，建议清理或导出归档');
      }
    });
    if (largest && largest.bytes >= 512 * 1024) {
      suggestions.push(largest.label + '占用超过 512 KB，优先检查这一项');
    }

    return {
      entries: entries,
      totalBytes: totalBytes,
      totalSize: formatStorageBytes(totalBytes),
      largest: largest,
      suggestions: suggestions,
    };
  }

  function formatStorageUsageSummary(report) {
    var data = report || collectStorageUsageReport({});
    var largest = data.largest;
    return '本地存储约 ' + data.totalSize + ' · ' + (data.entries || []).length + ' 项' +
      (largest ? ' · 最大：' + largest.label + ' ' + largest.size : '');
  }

  function formatStorageUsageWarnings(report) {
    var data = report || {};
    return data.suggestions && data.suggestions.length
      ? data.suggestions.join(' · ')
      : '当前体积正常，暂无额外清理建议';
  }

  function formatStorageUsageLimit(entry) {
    if (!entry) return '0 条';
    if (!entry.limit) return entry.count + ' 条';
    var ratio = Math.round(clampRatio(entry.count / entry.limit) * 100);
    return entry.count + ' / ' + entry.limit + ' 条（' + ratio + '%）';
  }

  function getStorageUsageLevel(entry) {
    if (!entry) return 'ok';
    if (entry.limit && entry.count >= Math.floor(entry.limit * 0.9)) return 'danger';
    if (entry.limit && entry.count >= Math.floor(entry.limit * 0.8)) return 'warning';
    if (entry.bytes >= 512 * 1024) return 'warning';
    return 'ok';
  }

  function formatStorageUsageEntry(entry) {
    if (!entry) return '';
    return entry.label + '：' + entry.size + ' / ' + entry.count + ' 条' +
      (entry.limit ? ' / 上限 ' + entry.limit : '');
  }

  function getDataRecordTimestamp(record) {
    if (typeof record === 'number') return Number(record) || 0;
    return Number(record && (record.updatedAt || record.savedAt || record.createdAt)) || 0;
  }

  function getDataRecordFingerprint(record) {
    if (!record || typeof record === 'number') return '';
    var rawUrl = String(record.url || record.progressUrl || '');
    if (rawUrl) {
      try {
        var parsed = new URL(rawUrl, 'https://south-plus.org/');
        parsed.hash = '';
        return 'url:' + parsed.href.toLowerCase();
      } catch (error) {
        return 'url:' + rawUrl.split('#')[0].toLowerCase();
      }
    }
    var title = compactText(record.title || record.subject || '');
    return title ? 'title:' + title.toLowerCase() : '';
  }

  function getDuplicateRecordKeys(map) {
    var source = map || {};
    var seen = {};
    var duplicates = [];
    Object.keys(source)
      .sort(function sortByFreshness(left, right) {
        return getDataRecordTimestamp(source[right]) - getDataRecordTimestamp(source[left]);
      })
      .forEach(function detectDuplicateRecord(key) {
        var fingerprint = getDataRecordFingerprint(source[key]);
        if (!fingerprint) return;
        if (seen[fingerprint]) {
          duplicates.push(key);
          return;
        }
        seen[fingerprint] = key;
      });
    return duplicates;
  }

  function getInvalidProgressKeys(progress) {
    var source = progress || {};
    return Object.keys(source).filter(function isInvalidProgress(key) {
      return !(source[key] && source[key].updatedAt);
    });
  }

  function getInvalidAutoBuyKeys(attempts) {
    var source = attempts || {};
    return Object.keys(source).filter(function isInvalidAutoBuy(key) {
      return !(source[key] && source[key].status);
    });
  }

  function getInvalidResourceKeys(resources) {
    var source = resources || {};
    return Object.keys(source).filter(function isInvalidResource(key) {
      return !normalizeResourceRecord(source[key], key);
    });
  }

  function getStaleProgressKeys(progress, now, maxAge) {
    var source = progress || {};
    var currentTime = Number(now) || Date.now();
    var threshold = Math.max(1, Number(maxAge) || STALE_PROGRESS_MAX_AGE);
    return Object.keys(source).filter(function isStaleProgress(key) {
      var updatedAt = Number(source[key] && source[key].updatedAt) || 0;
      return !!updatedAt && currentTime - updatedAt > threshold;
    });
  }

  function getOrphanProgressKeys(progress, read, watch) {
    var readMap = read || {};
    var watchMap = watch || {};
    return Object.keys(progress || {}).filter(function isOrphanProgress(key) {
      return !(readMap[key] || watchMap[key]);
    });
  }

  function collectDataHealthReport(data, now) {
    var source = data || {};
    var settings = normalizeSettings(source.settings);
    var read = copyStorageMap(source.read);
    var watch = copyStorageMap(source.watch);
    var progress = copyStorageMap(source.progress);
    var autoBuyAttempts = copyStorageMap(source.autoBuyAttempts || source.autoBuy);
    var resources = copyStorageMap(source.resources);
    var autoBuyStatusCounts = {};

    Object.keys(autoBuyAttempts).forEach(function countAutoBuyStatus(key) {
      var status = String(autoBuyAttempts[key] && autoBuyAttempts[key].status || '');
      if (!status) return;
      autoBuyStatusCounts[status] = (autoBuyStatusCounts[status] || 0) + 1;
    });

    var duplicateWatchKeys = getDuplicateRecordKeys(watch);
    var duplicateProgressKeys = getDuplicateRecordKeys(progress);
    var staleProgressKeys = getStaleProgressKeys(progress, now);
    var invalidProgressKeys = getInvalidProgressKeys(progress);
    var invalidAutoBuyKeys = getInvalidAutoBuyKeys(autoBuyAttempts);
    var invalidResourceKeys = getInvalidResourceKeys(resources);

    return {
      counts: {
        titleKeywords: settings.titleKeywords.length,
        authorKeywords: settings.authorKeywords.length,
        quickReplies: settings.quickReplies.length,
        read: countMapItems(read),
        watch: countMapItems(watch),
        progress: countMapItems(progress),
        autoBuyAttempts: countMapItems(autoBuyAttempts),
        resources: countMapItems(pruneResourceLibrary(resources)),
      },
      autoBuyStatusCounts: autoBuyStatusCounts,
      duplicateWatchKeys: duplicateWatchKeys,
      duplicateProgressKeys: duplicateProgressKeys,
      staleProgressKeys: staleProgressKeys,
      orphanProgressKeys: getOrphanProgressKeys(progress, read, watch),
      invalidProgressKeys: invalidProgressKeys,
      invalidAutoBuyKeys: invalidAutoBuyKeys,
      invalidResourceKeys: invalidResourceKeys,
      cleanupCount:
        duplicateWatchKeys.length +
        duplicateProgressKeys.length +
        staleProgressKeys.length +
        invalidProgressKeys.length +
        invalidAutoBuyKeys.length +
        invalidResourceKeys.length,
    };
  }

  function cleanupDataHealthPayload(data, now) {
    var source = data || {};
    var settings = normalizeSettings(source.settings);
    var read = copyStorageMap(source.read);
    var watch = copyStorageMap(source.watch);
    var progress = copyStorageMap(source.progress);
    var autoBuyAttempts = copyStorageMap(source.autoBuyAttempts || source.autoBuy);
    var resources = copyStorageMap(source.resources);
    var before = collectDataHealthReport({
      settings: settings,
      read: read,
      watch: watch,
      progress: progress,
      autoBuyAttempts: autoBuyAttempts,
      resources: resources,
    }, now);

    before.duplicateWatchKeys.forEach(function removeDuplicateWatch(key) {
      delete watch[key];
    });
    before.duplicateProgressKeys.concat(before.staleProgressKeys, before.invalidProgressKeys).forEach(function removeBadProgress(key) {
      delete progress[key];
    });
    before.invalidAutoBuyKeys.forEach(function removeBadAutoBuy(key) {
      delete autoBuyAttempts[key];
    });
    before.invalidResourceKeys.forEach(function removeBadResource(key) {
      delete resources[key];
    });

    var payload = createBackupPayload({
      settings: settings,
      read: read,
      watch: watch,
      progress: progress,
      autoBuyAttempts: autoBuyAttempts,
      resources: resources,
    }, now);

    return {
      payload: payload,
      before: before,
      after: collectDataHealthReport(payload.data, now),
    };
  }

  function formatDataHealthSummary(report) {
    var data = report || collectDataHealthReport({});
    var counts = data.counts || {};
    return [
      '已读 ' + (counts.read || 0),
      '稍后看 ' + (counts.watch || 0),
      '阅读进度 ' + (counts.progress || 0),
      '自动购买记录 ' + (counts.autoBuyAttempts || 0),
      '资源 ' + (counts.resources || 0),
      '屏蔽词 ' + ((counts.titleKeywords || 0) + (counts.authorKeywords || 0)),
      '快捷回复 ' + (counts.quickReplies || 0),
    ].join(' · ');
  }

  function formatDataHealthWarnings(report) {
    var data = report || {};
    var warnings = [];
    if (data.duplicateWatchKeys && data.duplicateWatchKeys.length) warnings.push('重复稍后看 ' + data.duplicateWatchKeys.length);
    if (data.duplicateProgressKeys && data.duplicateProgressKeys.length) warnings.push('重复进度 ' + data.duplicateProgressKeys.length);
    if (data.staleProgressKeys && data.staleProgressKeys.length) warnings.push('过期进度 ' + data.staleProgressKeys.length);
    if (data.orphanProgressKeys && data.orphanProgressKeys.length) warnings.push('孤立进度 ' + data.orphanProgressKeys.length);
    if (data.invalidProgressKeys && data.invalidProgressKeys.length) warnings.push('异常进度 ' + data.invalidProgressKeys.length);
    if (data.invalidAutoBuyKeys && data.invalidAutoBuyKeys.length) warnings.push('异常购买记录 ' + data.invalidAutoBuyKeys.length);
    if (data.invalidResourceKeys && data.invalidResourceKeys.length) warnings.push('异常资源 ' + data.invalidResourceKeys.length);
    return warnings.length ? warnings.join(' · ') : '未发现需要清理的重复或过期数据';
  }

  function formatBackupImportPreview(payload) {
    var backup = normalizeBackupPayload(payload);
    if (!backup) return '';
    var report = collectDataHealthReport(backup.data, backup.exportedAt);
    return [
      '即将导入 South Plus +++ 本地备份。',
      formatDataHealthSummary(report),
      formatDataHealthWarnings(report),
      '导入会覆盖当前浏览器内同类本地数据，确认继续？',
    ].join('\n');
  }

  function getStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  }

  function loadSettings() {
    var storage = getStorage();
    if (!storage) return copySettings(DEFAULT_SETTINGS);
    var stored = safeJsonParse(storage.getItem(STORE_KEY), {});
    return normalizeSettings(stored);
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

  function loadReadProgress() {
    return pruneReadProgress(loadMap(PROGRESS_KEY));
  }

  function saveReadProgress(progress) {
    saveMap(PROGRESS_KEY, pruneReadProgress(progress));
  }

  function pruneAutoBuyAttempts(attempts) {
    var source = attempts || {};
    var keys = Object.keys(source)
      .filter(function hasRecord(key) {
        return source[key] && source[key].status;
      })
      .sort(function sortByUpdatedAt(left, right) {
        return (Number(source[right].updatedAt) || 0) - (Number(source[left].updatedAt) || 0);
      })
      .slice(0, AUTO_BUY_ATTEMPT_LIMIT);
    var result = {};
    keys.forEach(function keepAttempt(key) {
      result[key] = source[key];
    });
    return result;
  }

  function loadAutoBuyAttempts() {
    return pruneAutoBuyAttempts(loadMap(AUTO_BUY_KEY));
  }

  function saveAutoBuyAttempts(attempts) {
    saveMap(AUTO_BUY_KEY, pruneAutoBuyAttempts(attempts));
  }

  function loadResourceLibrary() {
    return pruneResourceLibrary(loadMap(RESOURCE_KEY));
  }

  function saveResourceLibrary(resources) {
    saveMap(RESOURCE_KEY, pruneResourceLibrary(resources));
  }

  function applyBackupPayload(payload, settings, state) {
    var backup = normalizeBackupPayload(payload);
    if (!backup) return false;
    var data = backup.data || {};
    var nextSettings = normalizeSettings(data.settings);
    Object.keys(settings || {}).forEach(function removeOldSetting(key) {
      delete settings[key];
    });
    Object.assign(settings, nextSettings);
    state.read = copyStorageMap(data.read);
    state.watch = copyStorageMap(data.watch);
    state.progress = pruneReadProgress(copyStorageMap(data.progress));
    state.resources = pruneResourceLibrary(copyStorageMap(data.resources));
    saveSettings(settings);
    saveMap(READ_KEY, state.read);
    saveMap(WATCH_KEY, state.watch);
    saveReadProgress(state.progress);
    saveAutoBuyAttempts(data.autoBuyAttempts);
    saveResourceLibrary(state.resources);
    clearReadProgressRestoreRequest(parseThreadId(location.href));
    refreshWatchCenter();
    refreshHistoryCenter();
    refreshAutoBuyCenter();
    refreshResourceCenter();
    enhanceAll(settings, state);
    return true;
  }

  function formatBackupFileName(timestamp) {
    var date = new Date(Number(timestamp) || Date.now());
    function pad(number) {
      return String(number).padStart(2, '0');
    }
    return 'southplus-plus-backup-' +
      date.getFullYear() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      '-' +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      '.json';
  }

  function downloadBackupPayload(payload) {
    if (
      typeof Blob === 'undefined' ||
      typeof URL === 'undefined' ||
      typeof URL.createObjectURL !== 'function' ||
      !document ||
      !document.body
    ) return false;
    var backup = normalizeBackupPayload(payload);
    if (!backup) return false;
    var blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = createEl('a');
    link.href = url;
    link.download = formatBackupFileName(backup.exportedAt);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function revokeBackupUrl() {
      if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
    }, 1000);
    return true;
  }

  function importBackupFile(file, settings, state, callback) {
    if (!file || typeof FileReader === 'undefined') {
      callback(false, '无法读取备份文件');
      return;
    }
    var reader = new FileReader();
    reader.onload = function handleBackupLoaded() {
      var backup = normalizeBackupPayload(reader.result);
      if (!backup) {
        callback(false, '备份文件格式无效');
        return;
      }
      if (typeof window.confirm === 'function' && !window.confirm(formatBackupImportPreview(backup))) {
        callback(false, '已取消导入');
        return;
      }
      var ok = applyBackupPayload(backup, settings, state);
      callback(ok, ok ? '已导入本地备份' : '备份文件格式无效');
    };
    reader.onerror = function handleBackupError() {
      callback(false, '备份文件读取失败');
    };
    reader.readAsText(file);
  }

  function recordAutoBuyAttempt(key, status, message, details) {
    if (!key) return null;
    var record = {
      status: status,
      message: String(message || ''),
      updatedAt: Date.now(),
    };
    var extra = details || {};
    if (extra.url) record.url = String(extra.url);
    if (extra.price !== undefined) record.price = Number(extra.price);
    if (extra.balance !== undefined) record.balance = Number(extra.balance);

    var attempts = loadAutoBuyAttempts();
    attempts[key] = record;
    saveAutoBuyAttempts(attempts);
    refreshAutoBuyCenter();
    return record;
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
      '.spx-site-shell #mainNav{display:block!important;height:30px!important;border-radius:8px!important;background:#2f343b!important;box-shadow:0 3px 10px rgba(15,23,42,.12)!important;overflow:visible!important;}',
      '.spx-site-shell #mainNav a{color:#dbe6ef!important;text-decoration:none!important;text-shadow:none!important;font-size:14px!important;line-height:30px!important;}',
      '.spx-site-shell #mainNav a:hover{color:#fff!important;text-decoration:none!important;}',
      '.spx-site-shell #mainNav>div[style*="padding-left"]{box-sizing:border-box!important;width:100%!important;max-width:100%!important;height:30px!important;padding-left:250px!important;background:transparent!important;overflow:visible!important;}',
      '.spx-site-shell #mainNav>div[style*="padding-left"] table,.spx-site-shell #mainNav>div[style*="padding-left"] tbody,.spx-site-shell #mainNav>div[style*="padding-left"] tr,.spx-site-shell #mainNav>div[style*="padding-left"] td{display:block!important;box-sizing:border-box!important;width:auto!important;height:30px!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;}',
      '.spx-site-shell #guide{display:flex!important;float:none!important;align-items:center!important;justify-content:flex-start!important;flex-wrap:nowrap!important;width:max-content!important;max-width:100%!important;margin:0!important;padding:0!important;overflow:visible!important;white-space:nowrap!important;}',
      '.spx-site-shell #guide>li{display:block!important;float:none!important;width:auto!important;min-width:max-content!important;margin:0!important;white-space:nowrap!important;}',
      '.spx-site-shell #guide>#h_push,.spx-site-shell #guide>#h_hack{display:none!important;}',
      '.spx-site-shell #guide>li>a{box-sizing:border-box!important;display:flex!important;float:none!important;align-items:center!important;height:30px!important;line-height:30px!important;padding:0 12px!important;white-space:nowrap!important;color:#dbe6ef!important;font-size:14px!important;font-weight:800!important;letter-spacing:.1px!important;text-shadow:none!important;}',
      '.spx-site-shell #guide>li>a:hover{background:#3a414a!important;color:#fff!important;text-decoration:none!important;}',
      '.spx-site-shell #guide>li.current>a,.spx-site-shell #guide>li.spx-nav-current>a,.spx-site-shell #guide>li>a.spx-nav-current{background:#f1f5f9!important;color:#111827!important;text-decoration:none!important;box-shadow:inset 0 -3px 0 #94a3b8!important;}',
      '.spx-site-shell #guide>li.spx-nav-active>a,.spx-site-shell #guide>li>a.spx-menu-open{background:#3a414a!important;color:#fff!important;text-decoration:none!important;box-shadow:none!important;}',
      '.spx-site-shell #guide .spx-peacemaker-nav{position:relative!important;width:auto!important;min-width:max-content!important;overflow:visible!important;}',
      '.spx-site-shell #peacemakerconfig{position:relative!important;overflow:visible!important;color:#dbe6ef!important;}',
      '.spx-site-shell #peacemakerconfig.spx-menu-open{color:#fff!important;}',
      '.spx-site-shell #peacemakerconfig>div[hidden]{display:none!important;}',
      '.spx-site-shell #peacemakerconfig>div:not([hidden]){box-sizing:border-box!important;display:block!important;position:absolute!important;top:30px!important;right:0!important;left:auto!important;z-index:10000!important;width:148px!important;min-width:148px!important;margin:0!important;padding:5px!important;border:1px solid #334155!important;border-radius:8px!important;background:#f8fafc!important;color:#0f172a!important;box-shadow:0 12px 28px rgba(15,23,42,.22)!important;font:700 13px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif!important;}',
      '.spx-site-shell #peacemakerconfig>div:not([hidden])>div{box-sizing:border-box!important;display:block!important;min-height:28px!important;margin:0!important;padding:5px 8px!important;background:#f8fafc!important;color:#0f172a!important;text-align:left!important;font:inherit!important;line-height:18px!important;border-radius:5px!important;}',
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
    ].concat(getInjectedContentLayoutStyleRules(), getInjectedWidgetStyleRules()).join('\n');
  }

  function getInjectedContentLayoutStyleRules() {
    return [
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
      '.spx-immersive-read .spx-preview-summary{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.spx-immersive-read .spx-preview-actions{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:6px;}',
      '.spx-immersive-read .spx-preview-actions button{height:26px;margin:0;padding:0 8px;border:1px solid #cbd5e1;border-radius:6px;background:#f8fafc;color:#334155;font-size:12px;line-height:1;cursor:pointer;}',
      '.spx-immersive-read .spx-preview-actions button:hover,.spx-immersive-read .spx-preview-actions button:focus-visible{border-color:#38bdf8;background:#e0f2fe;color:#075985;outline:none;}',
      '.spx-immersive-read .spx-preview-actions button[aria-pressed="true"]{border-color:#0284c7;background:#0284c7;color:#fff;}',
      '.spx-immersive-read .spx-preview-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;}',
      '.spx-immersive-read .spx-preview-item{display:block;overflow:hidden;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;text-decoration:none;}',
      '.spx-immersive-read .spx-preview-item img{display:block;width:100%;height:180px;object-fit:cover;background:#fff;}',
      '.spx-immersive-read .spx-preview-item span{display:block;padding:6px 8px;font-size:12px;line-height:1.35;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.spx-immersive-read .spx-preview-load-more{display:block;width:100%;height:32px;margin:10px 0 0;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#334155;font-size:12px;cursor:pointer;}',
      '.spx-immersive-read .spx-preview-load-more:hover,.spx-immersive-read .spx-preview-load-more:focus-visible{border-color:#38bdf8;background:#e0f2fe;color:#075985;outline:none;}',
      '.spx-immersive-read .spx-preview-load-more[hidden]{display:none!important;}',
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
      '.spx-reader .spx-preview-summary,.spx-immersive-read .spx-preview-summary{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}',
      '.spx-reader .spx-preview-actions,.spx-immersive-read .spx-preview-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;gap:6px!important;}',
      '.spx-reader .spx-preview-actions button,.spx-immersive-read .spx-preview-actions button{box-sizing:border-box!important;height:26px!important;margin:0!important;padding:0 8px!important;border:1px solid #cbd5e1!important;border-radius:6px!important;background:#f8fafc!important;color:#334155!important;font-size:12px!important;line-height:1!important;cursor:pointer!important;}',
      '.spx-reader .spx-preview-actions button:hover,.spx-reader .spx-preview-actions button:focus-visible,.spx-immersive-read .spx-preview-actions button:hover,.spx-immersive-read .spx-preview-actions button:focus-visible{border-color:#38bdf8!important;background:#e0f2fe!important;color:#075985!important;outline:none!important;}',
      '.spx-reader .spx-preview-actions button[aria-pressed="true"],.spx-immersive-read .spx-preview-actions button[aria-pressed="true"]{border-color:#0284c7!important;background:#0284c7!important;color:#fff!important;}',
      '.spx-reader .spx-preview-grid,.spx-immersive-read .spx-preview-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;}',
      '.spx-reader .spx-preview-item,.spx-immersive-read .spx-preview-item{display:block!important;overflow:hidden!important;border:1px solid #e2e8f0!important;border-radius:8px!important;background:#fff!important;text-decoration:none!important;}',
      '.spx-reader .spx-preview-item img,.spx-immersive-read .spx-preview-item img{display:block!important;width:100%!important;height:190px!important;object-fit:cover!important;background:#fff!important;}',
      '.spx-reader .spx-preview-item .spx-preview-hover-image,.spx-immersive-read .spx-preview-item .spx-preview-hover-image{display:none!important;position:fixed!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;z-index:100002!important;width:auto!important;height:auto!important;max-width:min(72vw,980px)!important;max-height:min(86vh,820px)!important;object-fit:contain!important;padding:6px!important;background:#fff!important;border:1px solid #cbd5e1!important;border-radius:10px!important;box-shadow:0 18px 52px rgba(15,23,42,.35)!important;pointer-events:none!important;}',
      '.spx-reader .spx-preview-item:hover .spx-preview-hover-image,.spx-immersive-read .spx-preview-item:hover .spx-preview-hover-image{display:block!important;}',
      '.spx-reader .spx-preview-item span,.spx-immersive-read .spx-preview-item span{display:block!important;padding:5px 7px!important;font-size:12px!important;line-height:1.35!important;color:#475569!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}',
      '.spx-reader .spx-preview-load-more,.spx-immersive-read .spx-preview-load-more{box-sizing:border-box!important;display:block!important;width:100%!important;height:32px!important;margin:10px 0 0!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#334155!important;font-size:12px!important;cursor:pointer!important;}',
      '.spx-reader .spx-preview-load-more:hover,.spx-reader .spx-preview-load-more:focus-visible,.spx-immersive-read .spx-preview-load-more:hover,.spx-immersive-read .spx-preview-load-more:focus-visible{border-color:#38bdf8!important;background:#e0f2fe!important;color:#075985!important;outline:none!important;}',
      '.spx-reader .spx-preview-load-more[hidden],.spx-immersive-read .spx-preview-load-more[hidden]{display:none!important;}',
      '.spx-reader .spx-preview-source,.spx-immersive-read .spx-preview-source{display:none!important;}',
      '.spx-preview-lightbox{position:fixed!important;inset:0!important;z-index:100010!important;box-sizing:border-box!important;display:flex!important;padding:18px!important;background:rgba(2,6,23,.9)!important;backdrop-filter:blur(5px)!important;color:#e2e8f0!important;font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif!important;}',
      '.spx-preview-lightbox-shell{box-sizing:border-box!important;display:flex!important;flex:1!important;min-width:0!important;min-height:0!important;flex-direction:column!important;overflow:hidden!important;border:1px solid rgba(148,163,184,.34)!important;border-radius:12px!important;background:#020617!important;box-shadow:0 24px 80px rgba(0,0,0,.5)!important;}',
      '.spx-preview-lightbox-toolbar{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:48px!important;padding:8px 10px 8px 14px!important;border-bottom:1px solid rgba(148,163,184,.22)!important;background:#0f172a!important;}',
      '.spx-preview-lightbox-counter{font-weight:700!important;color:#f8fafc!important;white-space:nowrap!important;}',
      '.spx-preview-lightbox-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;gap:6px!important;}',
      '.spx-preview-lightbox button{box-sizing:border-box!important;min-width:34px!important;height:32px!important;margin:0!important;padding:0 10px!important;border:1px solid #334155!important;border-radius:7px!important;background:#1e293b!important;color:#e2e8f0!important;cursor:pointer!important;font:600 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif!important;}',
      '.spx-preview-lightbox button:hover,.spx-preview-lightbox button:focus-visible{border-color:#38bdf8!important;background:#0c4a6e!important;color:#fff!important;outline:none!important;}',
      '.spx-preview-lightbox-zoom{display:inline-flex!important;min-width:58px!important;justify-content:center!important;color:#cbd5e1!important;font-variant-numeric:tabular-nums!important;}',
      '.spx-preview-lightbox-stage{position:relative!important;flex:1!important;min-height:0!important;overflow:hidden!important;background:#020617!important;}',
      '.spx-preview-lightbox-viewport{position:absolute!important;inset:0!important;overflow:auto!important;overscroll-behavior:contain!important;}',
      '.spx-preview-lightbox-canvas{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;min-width:100%!important;min-height:100%!important;padding:34px 78px!important;}',
      '.spx-preview-lightbox-image{display:block!important;flex:none!important;max-width:none!important;max-height:none!important;object-fit:contain!important;background:#fff!important;box-shadow:0 16px 50px rgba(0,0,0,.45)!important;}',
      '.spx-preview-lightbox-nav{position:absolute!important;top:50%!important;z-index:2!important;width:46px!important;height:64px!important;padding:0!important;transform:translateY(-50%)!important;border-color:rgba(148,163,184,.35)!important;background:rgba(15,23,42,.78)!important;font-size:30px!important;}',
      '.spx-preview-lightbox-prev{left:14px!important;}',
      '.spx-preview-lightbox-next{right:14px!important;}',
      '.spx-preview-lightbox-caption{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:38px!important;padding:7px 14px!important;border-top:1px solid rgba(148,163,184,.22)!important;background:#0f172a!important;color:#94a3b8!important;}',
      '.spx-preview-lightbox-url{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}',
      '.spx-preview-lightbox-help{flex:none!important;white-space:nowrap!important;font-size:12px!important;color:#64748b!important;}',
      '.spx-clean #infobox,.spx-clean #notice,.spx-clean #footer,.spx-clean .footer{display:none!important;}',
      '.spx-clean:not(.spx-site-shell) #wrapA{max-width:1180px!important;margin:0 auto!important;}',
      '.spx-clean #main{margin-top:8px!important;}',
      '.spx-clean table{border-collapse:collapse;}',
    ];
  }

  function getInjectedWidgetStyleRules() {
    return [
      '.spx-toolbar{position:fixed;right:14px;bottom:18px;z-index:99999;display:flex;flex-direction:column;gap:7px;box-sizing:border-box;padding:6px;border:1px solid rgba(203,213,225,.8);border-radius:16px;background:rgba(255,255,255,.92);box-shadow:0 18px 46px rgba(15,23,42,.18);font:12px/1.2 Arial,Helvetica,sans-serif;backdrop-filter:blur(10px);}',
      '.spx-toolbar button,.spx-toolbar a{width:52px;height:36px;border:1px solid transparent;border-radius:12px;background:#fff;color:var(--spx-text);box-shadow:0 4px 12px rgba(15,23,42,.08);cursor:pointer;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;padding:0;font-size:13px;font-weight:800;transition:background .16s ease,border-color .16s ease,color .16s ease,transform .16s ease,box-shadow .16s ease;}',
      '.spx-toolbar button:hover,.spx-toolbar a:hover,.spx-toolbar button:focus-visible,.spx-toolbar a:focus-visible{border-color:var(--spx-accent);color:var(--spx-accent);box-shadow:0 7px 18px rgba(15,118,110,.16);outline:none;transform:translateY(-1px);}',
      '.spx-toolbar .spx-active{background:#ccfbf1;border-color:#0f766e;color:#0f766e;font-weight:bold;box-shadow:inset 0 0 0 1px rgba(15,118,110,.12),0 6px 16px rgba(15,118,110,.14);}',
      '.spx-toolbox{position:fixed;right:82px;bottom:18px;width:min(470px,calc(100vw - 24px));max-height:82vh;overflow:hidden;z-index:100000;box-sizing:border-box;background:rgba(255,255,255,.98);border:1px solid rgba(148,163,184,.48);box-shadow:0 24px 80px rgba(15,23,42,.3);border-radius:18px;padding:0;color:var(--spx-text);font:13px/1.45 Arial,Helvetica,sans-serif;backdrop-filter:blur(12px);}',
      '.spx-toolbox[hidden]{display:none!important;}',
      '.spx-toolbox-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:15px 16px 13px;border-bottom:1px solid #e2e8f0;background:linear-gradient(135deg,#f8fafc 0%,#ecfeff 100%);}',
      '.spx-toolbox-eyebrow{margin:0 0 3px;color:#0f766e;font-size:11px;font-weight:900;letter-spacing:.08em;}',
      '.spx-toolbox-header h3{margin:0;color:#0f172a;font-size:17px;line-height:1.25;}',
      '.spx-toolbox-header p{margin:4px 0 0;color:#64748b;font-size:12px;line-height:1.45;}',
      '.spx-toolbox-close{flex:none;width:32px;height:32px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#334155;cursor:pointer;font-size:18px;font-weight:800;line-height:1;}',
      '.spx-toolbox-close:hover,.spx-toolbox-close:focus-visible{border-color:#0f766e;color:#0f766e;outline:none;}',
      '.spx-toolbox-body{box-sizing:border-box;max-height:calc(82vh - 78px);overflow:auto;padding:13px 14px 14px;scrollbar-width:thin;}',
      '.spx-toolbox-section{margin-top:14px;}',
      '.spx-toolbox-section:first-of-type{margin-top:0;}',
      '.spx-toolbox-section-title{display:flex;align-items:center;gap:8px;margin:0 0 8px;color:#475569;font-size:12px;font-weight:900;letter-spacing:.02em;}',
      '.spx-toolbox-section-title:after{content:"";height:1px;flex:1;background:#e2e8f0;}',
      '.spx-toolbox-count{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#e0f2fe;color:#075985;font-size:11px;font-weight:900;letter-spacing:0;}',
      '.spx-toolbox-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;}',
      '.spx-toolbox-action{box-sizing:border-box;min-width:0;min-height:64px;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:10px;position:relative;border:1px solid #dbe4ee!important;border-radius:12px!important;background:#fff!important;color:#1f2937!important;padding:10px 11px!important;text-align:left!important;text-decoration:none!important;cursor:pointer!important;box-shadow:0 5px 16px rgba(15,23,42,.06)!important;transition:background .16s ease,border-color .16s ease,color .16s ease,transform .16s ease,box-shadow .16s ease!important;}',
      '.spx-toolbox-action:hover,.spx-toolbox-action:focus-visible{border-color:var(--spx-accent)!important;background:#f0fdfa!important;color:#0f766e!important;text-decoration:none!important;outline:none!important;box-shadow:0 10px 24px rgba(15,118,110,.15)!important;transform:translateY(-1px)!important;}',
      '.spx-toolbox-action.spx-active{border-color:#0f766e!important;background:#ccfbf1!important;color:#0f766e!important;box-shadow:0 8px 22px rgba(15,118,110,.18)!important;}',
      '.spx-toolbox-action.spx-active:before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:0 999px 999px 0;background:#0f766e;}',
      '.spx-toolbox-key{flex:none;width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#f8fafc;border:1px solid #cbd5e1;color:#075985;font-size:15px;font-weight:900;}',
      '.spx-toolbox-action.spx-active .spx-toolbox-key{border-color:#0f766e;background:#f0fdfa;color:#0f766e;}',
      '.spx-toolbox-copy{min-width:0;display:block;}',
      '.spx-toolbox-name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:inherit;font-size:13px;font-weight:800;line-height:1.25;}',
      '.spx-toolbox-desc{display:-webkit-box;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical;margin-top:4px;color:#64748b;font-size:11px;line-height:1.3;}',
      '.spx-settings{position:fixed;right:66px;bottom:18px;width:min(360px,calc(100vw - 24px));max-height:80vh;overflow:auto;z-index:100000;background:var(--spx-panel);border:1px solid var(--spx-line);box-shadow:0 12px 36px rgba(15,23,42,.24);border-radius:8px;padding:12px;color:var(--spx-text);font:13px/1.45 Arial,Helvetica,sans-serif;}',
      '.spx-settings[hidden]{display:none!important;}',
      '.spx-settings h3{margin:0 0 10px;font-size:15px;}',
      '.spx-settings label{display:flex;gap:8px;align-items:center;margin:7px 0;}',
      '.spx-settings .spx-number-setting{justify-content:space-between;gap:10px;}',
      '.spx-settings .spx-number-setting input{box-sizing:border-box;width:84px;height:30px;border:1px solid var(--spx-line);border-radius:6px;padding:0 8px;text-align:right;}',
      '.spx-settings textarea{box-sizing:border-box;width:100%;min-height:74px;border:1px solid var(--spx-line);border-radius:6px;padding:7px;font:12px/1.4 monospace;}',
      '.spx-settings .spx-help{margin:4px 0 8px;color:var(--spx-sub);font-size:12px;}',
      '.spx-settings .spx-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}',
      '.spx-settings button{border:1px solid var(--spx-line);border-radius:6px;background:#fff;padding:6px 10px;cursor:pointer;}',
      '.spx-settings .spx-primary{background:var(--spx-accent);border-color:var(--spx-accent);color:#fff;}',
      '.spx-data-health{box-sizing:border-box;margin-top:10px;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;}',
      '.spx-data-health[hidden]{display:none!important;}',
      '.spx-storage-usage{display:grid;gap:6px;margin:7px 0 9px;font-size:12px;color:#334155;}',
      '.spx-storage-usage-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:7px 8px;border-radius:7px;background:#fff;border:1px solid #e5e7eb;}',
      '.spx-storage-usage-row.spx-storage-warning{border-color:#fbbf24;background:#fffbeb;}',
      '.spx-storage-usage-row.spx-storage-danger{border-color:#f87171;background:#fef2f2;}',
      '.spx-storage-usage-main{min-width:0;display:block;}',
      '.spx-storage-usage-main b{display:block;color:#0f172a;font-size:12px;line-height:1.3;}',
      '.spx-storage-usage-main em{display:block;margin-top:2px;color:#94a3b8;font-style:normal;font-size:11px;line-height:1.25;word-break:break-all;}',
      '.spx-storage-usage-meta{flex:none;text-align:right;color:#334155;font-weight:800;line-height:1.45;white-space:nowrap;}',
      '.spx-storage-suggestions{margin:6px 0 8px;padding:7px 8px;border-radius:7px;background:#fff;border:1px solid #e5e7eb;color:#475569;font-size:12px;line-height:1.45;}',
      '.spx-watch-center{position:fixed;right:66px;bottom:18px;width:min(460px,calc(100vw - 24px));max-height:80vh;overflow:auto;z-index:100000;background:var(--spx-panel);border:1px solid var(--spx-line);box-shadow:0 12px 36px rgba(15,23,42,.24);border-radius:8px;padding:12px;color:var(--spx-text);font:13px/1.45 Arial,Helvetica,sans-serif;}',
      '.spx-resource-panel{width:min(560px,calc(100vw - 24px));}',
      '.spx-watch-center[hidden]{display:none!important;}',
      '.spx-watch-center-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;}',
      '.spx-watch-center h3{margin:0;font-size:15px;}',
      '.spx-watch-center .spx-watch-summary{color:var(--spx-sub);font-size:12px;}',
      '.spx-watch-controls{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:0 0 10px;}',
      '.spx-watch-controls input,.spx-watch-controls select{box-sizing:border-box;height:32px;border:1px solid var(--spx-line);border-radius:6px;background:#fff;color:var(--spx-text);padding:0 10px;font-size:12px;}',
      '.spx-watch-controls input{flex:1 1 180px;min-width:180px;}',
      '.spx-watch-controls select{flex:1 0 126px;min-width:112px;max-width:180px;}',
      '.spx-watch-list{display:flex;flex-direction:column;gap:8px;}',
      '.spx-watch-item{box-sizing:border-box;padding:9px 10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;}',
      '.spx-watch-title{display:block;margin-bottom:4px;color:#075985!important;font-size:14px;font-weight:800;line-height:1.35;text-decoration:none;}',
      '.spx-resource-title-row{display:flex;align-items:flex-start;gap:8px;margin-bottom:4px;}',
      '.spx-resource-title-row .spx-watch-title{min-width:0;margin-bottom:0;word-break:break-all;}',
      '.spx-resource-select{flex:none;width:16px;height:16px;margin:2px 0 0;accent-color:var(--spx-accent);}',
      '.spx-resource-url{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#075985!important;font-size:12px;line-height:1.35;text-decoration:none;}',
      '.spx-auto-resource-jump{box-sizing:border-box;width:min(1680px,calc(100vw - 64px));margin:10px auto;padding:10px 12px;border:1px solid #99f6e4;border-radius:8px;background:#f0fdfa;color:#0f766e;font:13px/1.45 Arial,Helvetica,sans-serif;}',
      '.spx-auto-resource-jump strong{display:block;margin-bottom:6px;color:#0f766e;font-size:14px;}',
      '.spx-auto-resource-actions{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}',
      '.spx-auto-resource-actions a,.spx-auto-resource-actions button{box-sizing:border-box;max-width:220px;height:28px;padding:0 9px;border:1px solid #5eead4;border-radius:999px;background:#fff;color:#0f766e!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:none;font-size:12px;line-height:26px;cursor:pointer;}',
      '.spx-auto-resource-actions button:hover,.spx-auto-resource-actions a:hover{border-color:#0f766e;background:#ccfbf1;text-decoration:none!important;}',
      '.spx-watch-meta{margin-bottom:8px;color:var(--spx-sub);font-size:12px;}',
      '.spx-watch-actions{display:flex;flex-wrap:wrap;gap:6px;}',
      '.spx-watch-actions button,.spx-watch-actions a,.spx-watch-center-header button{border:1px solid var(--spx-line);border-radius:6px;background:#fff;color:var(--spx-text);padding:4px 8px;cursor:pointer;text-decoration:none;font-size:12px;line-height:1.25;}',
      '.spx-watch-actions button:hover,.spx-watch-actions a:hover,.spx-watch-center-header button:hover{border-color:var(--spx-accent);color:var(--spx-accent);}',
      '.spx-watch-empty{padding:14px 2px;color:var(--spx-sub);font-size:13px;}',
      '.spx-status-badge{display:inline-block;margin-right:6px;padding:1px 6px;border-radius:999px;background:#e0f2fe;color:#075985;font-weight:800;}',
      '.spx-status-badge.spx-status-saved{background:#e0f2fe;color:#075985;}',
      '.spx-status-badge.spx-status-todo{background:#fef3c7;color:#92400e;}',
      '.spx-status-badge.spx-status-failed{background:#fee2e2;color:#b91c1c;}',
      '.spx-status-badge.spx-status-done{background:#dcfce7;color:#15803d;}',
      '.spx-status-badge.spx-status-invalid{background:#fee2e2;color:#b91c1c;}',
      '.spx-quick-reply{box-sizing:border-box;margin:10px 0 12px;padding:10px 12px;border:1px solid var(--spx-line);border-radius:8px;background:#f8fafc;color:var(--spx-text);font:13px/1.45 Arial,Helvetica,sans-serif;}',
      '.spx-quick-reply-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;color:var(--spx-sub);}',
      '.spx-quick-reply-header strong{color:var(--spx-text);font-size:14px;}',
      '.spx-quick-reply-list{display:flex;flex-wrap:wrap;gap:6px;}',
      '.spx-quick-reply button{border:1px solid var(--spx-line);border-radius:999px;background:#fff;color:var(--spx-text);padding:5px 10px;cursor:pointer;font-size:13px;line-height:1.25;}',
      '.spx-quick-reply button:hover{border-color:var(--spx-accent);color:var(--spx-accent);background:#ecfdf5;}',
      '.spx-quick-reply button:disabled{cursor:wait;opacity:.55;}',
      '.spx-quick-reply-status.spx-error{color:#b91c1c;font-weight:600;}',
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
      '.spx-auto-buy-status{box-sizing:border-box;margin:8px 0;padding:8px 10px;border:1px solid #99f6e4;border-radius:6px;background:#f0fdfa;color:#0f766e;font-size:13px;line-height:1.45;}',
      '.spx-auto-buy-status.spx-error{border-color:#fecaca;background:#fef2f2;color:#b91c1c;}',
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
      '@media(max-width:760px){.spx-preview-lightbox{padding:0!important}.spx-preview-lightbox-shell{border:0!important;border-radius:0!important}.spx-preview-lightbox-toolbar{align-items:flex-start!important;min-height:0!important;padding:8px!important}.spx-preview-lightbox-actions{gap:4px!important}.spx-preview-lightbox button{height:30px!important;padding:0 8px!important}.spx-preview-lightbox-canvas{padding:22px 50px!important}.spx-preview-lightbox-nav{width:38px!important;height:54px!important;font-size:26px!important}.spx-preview-lightbox-prev{left:6px!important}.spx-preview-lightbox-next{right:6px!important}.spx-preview-lightbox-caption{padding:6px 9px!important}.spx-preview-lightbox-help{display:none!important}.spx-reader body{font-size:16px!important}.spx-reader #wrapA{width:auto!important;margin:0 6px!important}.spx-reader .tpc_content{font-size:17px!important;line-height:1.9!important;padding:12px!important}.spx-reader .spx-post-body-split,.spx-immersive-read .spx-post-body-split{display:flex!important;flex-direction:column!important;gap:12px!important;padding:14px!important}.spx-reader .spx-post-body-split .tpc_content,.spx-immersive-read .spx-post-body-split .tpc_content{padding:0!important}.spx-reader .spx-preview-panel,.spx-immersive-read .spx-preview-panel{width:auto!important;max-height:360px!important;margin:0!important;padding:10px!important}.spx-reader .spx-preview-grid,.spx-immersive-read .spx-preview-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.spx-reader .spx-preview-item img,.spx-immersive-read .spx-preview-item img{height:132px!important}.spx-immersive-read #wrapA,.spx-immersive-read #main,.spx-immersive-read #content{width:100vw!important;margin:0!important}.spx-immersive-read table.js-post{width:calc(100vw - 14px)!important;margin:10px 7px!important}.spx-immersive-read .h1,.spx-immersive-read [id^="subject_"]{font-size:19px!important;padding:16px 14px 6px!important}.spx-immersive-read .tpc_content{font-size:var(--spx-immersive-font-size,20px)!important;line-height:1.98!important;padding:14px!important}.spx-toolbar{right:8px;bottom:8px;padding:5px;border-radius:14px}.spx-toolbar button,.spx-toolbar a{width:46px;height:32px;font-size:12px}.spx-settings,.spx-watch-center,.spx-toolbox{right:8px;bottom:58px}.spx-toolbox-grid{grid-template-columns:1fr}.spx-toolbox{max-height:78vh;border-radius:14px}.spx-toolbox-body{max-height:calc(78vh - 78px);padding:11px}.spx-toolbox-action{min-height:58px!important}.spx-toolbox-desc{-webkit-line-clamp:1}}',
    ];
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

  function createWatchBadge(id) {
    var badge = createEl('span', 'spx-watch-badge', '★');
    badge.dataset.spxWatchId = String(id || '');
    return badge;
  }

  function formatShortTime(timestamp) {
    var value = Number(timestamp) || 0;
    if (!value) return '';
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    function pad(number) {
      return String(number).padStart(2, '0');
    }
    return pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' +
      pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  function createCenterActionElement(action) {
    if (!action) return null;
    var node = action.href ? createEl('a', '', action.text || '') : createEl('button', '', action.text || '');
    if (action.href) {
      node.href = action.href;
      node.target = action.target || '_blank';
      node.rel = action.rel || 'noreferrer';
    } else {
      node.type = 'button';
      if (action.dataset) {
        Object.keys(action.dataset).forEach(function setActionDataset(key) {
          node.dataset[key] = action.dataset[key];
        });
      }
    }
    return node;
  }

  function createCenterTitleElement(options) {
    var config = options || {};
    var node = createEl(config.href ? 'a' : 'div', 'spx-watch-title');
    if (config.href) {
      node.href = config.href;
      node.target = config.target || '_blank';
      node.rel = config.rel || 'noreferrer';
    }
    if (config.title) node.title = config.title;
    if (config.badgeText) {
      var badge = createEl('span', 'spx-status-badge' + (config.badgeClass ? ' ' + config.badgeClass : ''), config.badgeText);
      node.appendChild(badge);
    }
    node.appendChild(document.createTextNode(config.text || ''));
    return node;
  }

  function ensureCenterPanelState(panel, defaults) {
    if (!panel) return {};
    if (!panel.spxState) panel.spxState = {};
    Object.keys(defaults || {}).forEach(function keepCenterDefault(key) {
      if (panel.spxState[key] === undefined) panel.spxState[key] = defaults[key];
    });
    return panel.spxState;
  }

  function isCenterFiltered(panelState) {
    return !!(
      panelState &&
      (
        panelState.query ||
        (panelState.filter && panelState.filter !== 'all') ||
        (panelState.tag && panelState.tag !== 'all') ||
        (panelState.provider && panelState.provider !== 'all')
      )
    );
  }

  function createCenterControls(panelState, options) {
    var config = options || {};
    var controls = createEl('div', 'spx-watch-controls');
    if (config.searchPlaceholder !== false) {
      var queryInput = createEl('input');
      queryInput.type = 'search';
      queryInput.placeholder = config.searchPlaceholder || '搜索';
      queryInput.value = String(panelState.query || '');
      queryInput.dataset.spxCenterQuery = '1';
      controls.appendChild(queryInput);
    }
    if ((config.filters || []).length) {
      var filterSelect = createEl('select');
      filterSelect.dataset.spxCenterFilter = '1';
      (config.filters || []).forEach(function appendFilterOption(item) {
        var option = createEl('option');
        option.value = item.value;
        option.textContent = item.label;
        option.selected = String(panelState.filter || 'all') === String(item.value);
        filterSelect.appendChild(option);
      });
      controls.appendChild(filterSelect);
    }
    if ((config.providers || []).length) {
      var providerSelect = createEl('select');
      providerSelect.dataset.spxCenterProvider = '1';
      var allProviderOption = createEl('option');
      allProviderOption.value = 'all';
      allProviderOption.textContent = config.providerAllLabel || '全部来源';
      providerSelect.appendChild(allProviderOption);
      (config.providers || []).forEach(function appendProviderOption(item) {
        var option = createEl('option');
        option.value = item.value;
        option.textContent = item.label;
        option.selected = String(panelState.provider || 'all') === String(item.value);
        providerSelect.appendChild(option);
      });
      controls.appendChild(providerSelect);
    }
    if ((config.views || []).length) {
      var viewSelect = createEl('select');
      viewSelect.dataset.spxCenterView = '1';
      (config.views || []).forEach(function appendViewOption(item) {
        var option = createEl('option');
        option.value = item.value;
        option.textContent = item.label;
        option.selected = String(panelState.view || 'list') === String(item.value);
        viewSelect.appendChild(option);
      });
      controls.appendChild(viewSelect);
    }
    if ((config.tags || []).length) {
      var tagSelect = createEl('select');
      tagSelect.dataset.spxCenterTag = '1';
      var allTagOption = createEl('option');
      allTagOption.value = 'all';
      allTagOption.textContent = '全部标签';
      tagSelect.appendChild(allTagOption);
      (config.tags || []).forEach(function appendTagOption(item) {
        var option = createEl('option');
        option.value = item.value;
        option.textContent = item.label;
        option.selected = String(panelState.tag || 'all') === String(item.value);
        tagSelect.appendChild(option);
      });
      controls.appendChild(tagSelect);
    }
    return controls.children.length ? controls : null;
  }

  function renderCenterPanel(panel, options) {
    if (!panel || !options) return;
    var scrollTop = panel.scrollTop || 0;
    var panelState = ensureCenterPanelState(panel, options.stateDefaults || { query: '', filter: 'all', tag: 'all', provider: 'all' });
    var entries = options.entries || [];
    var visibleEntries = typeof options.filterEntries === 'function'
      ? options.filterEntries(entries, panelState)
      : entries.slice();
    var displayEntries = typeof options.transformVisibleEntries === 'function'
      ? options.transformVisibleEntries(visibleEntries, entries, panelState)
      : visibleEntries;
    panel.textContent = '';
    var header = createEl('div', 'spx-watch-center-header');
    var title = createEl('div');
    title.appendChild(createEl('h3', '', options.title || ''));
    title.appendChild(createEl(
      'div',
      'spx-watch-summary',
      (typeof options.summary === 'function' ? options.summary(visibleEntries, entries, panelState) : options.summary) || ''
    ));
    header.appendChild(title);

    var headerActions = createEl('div', 'spx-watch-actions');
    (typeof options.headerActions === 'function'
      ? options.headerActions(visibleEntries, entries, panelState)
      : (options.headerActions || []))
      .forEach(function appendHeaderAction(action) {
        var actionNode = createCenterActionElement(action);
        if (actionNode) headerActions.appendChild(actionNode);
      });
    header.appendChild(headerActions);
    panel.appendChild(header);

    var controls = createCenterControls(panelState, options.controls);
    if (controls) panel.appendChild(controls);

    if (!entries.length) {
      panel.appendChild(createEl('div', 'spx-watch-empty', options.emptyText || '暂无内容'));
      panel.scrollTop = scrollTop;
      return;
    }

    if (!displayEntries.length) {
      panel.appendChild(createEl('div', 'spx-watch-empty', options.emptyFilteredText || '没有匹配结果。'));
      panel.scrollTop = scrollTop;
      return;
    }

    var list = createEl('div', 'spx-watch-list');
    displayEntries.forEach(function appendEntry(entry) {
      var item = createEl('div', 'spx-watch-item');
      var itemData = options.getItemData ? options.getItemData(entry) : null;
      if (itemData) {
        Object.keys(itemData).forEach(function setItemData(key) {
          item.dataset[key] = itemData[key];
        });
      }
      item.appendChild(options.createTitle(entry));
      item.appendChild(createEl('div', 'spx-watch-meta', options.createMeta(entry)));
      var actions = createEl('div', 'spx-watch-actions');
      (options.createActions(entry) || []).forEach(function appendAction(action) {
        var actionNode = createCenterActionElement(action);
        if (actionNode) actions.appendChild(actionNode);
      });
      item.appendChild(actions);
      list.appendChild(item);
    });
    panel.appendChild(list);
    panel.scrollTop = scrollTop;
  }

  function setCenterPanelHidden(panel, hidden, buttonSelector) {
    if (!panel) return;
    panel.hidden = !!hidden;
    if (buttonSelector) {
      qsa(buttonSelector).forEach(function toggleCenterButton(button) {
        button.classList.toggle('spx-active', !panel.hidden);
      });
    }
  }

  function refreshCenterPanel(panelId) {
    var panel = qs(panelId);
    if (!panel || panel.hidden || typeof panel.spxRender !== 'function') return;
    panel.spxRender();
  }

  function commitCenterQueryInput(panel, config, target) {
    if (!target || !target.dataset || target.dataset.spxCenterQuery !== '1') return;
    var state = ensureCenterPanelState(panel, config.stateDefaults || { query: '', filter: 'all', tag: 'all', provider: 'all' });
    if (state.query === target.value) return;
    state.query = target.value;
    var selectionStart = typeof target.selectionStart === 'number' ? target.selectionStart : null;
    var selectionEnd = typeof target.selectionEnd === 'number' ? target.selectionEnd : null;
    panel.spxRender();
    var nextInput = qs('input[data-spx-center-query="1"]', panel);
    if (nextInput) {
      nextInput.focus();
      if (
        selectionStart !== null &&
        selectionEnd !== null &&
        typeof nextInput.setSelectionRange === 'function'
      ) {
        nextInput.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }

  function createCenterPanel(options) {
    var config = options || {};
    var panel = qs('#' + config.id);
    if (panel) return panel;

    panel = createEl('div', 'spx-watch-center');
    panel.id = config.id;
    panel.hidden = true;
    document.body.appendChild(panel);

    panel.addEventListener('compositionstart', function handleCenterCompositionStart(event) {
      var target = event.target;
      if (!target || !target.dataset || target.dataset.spxCenterQuery !== '1') return;
      panel.spxCenterQueryComposing = true;
    });

    panel.addEventListener('compositionend', function handleCenterCompositionEnd(event) {
      var target = event.target;
      if (!target || !target.dataset || target.dataset.spxCenterQuery !== '1') return;
      panel.spxCenterQueryComposing = false;
      commitCenterQueryInput(panel, config, target);
    });

    panel.addEventListener('input', function handleCenterInput(event) {
      var target = event.target;
      if (!target || !target.dataset || target.dataset.spxCenterQuery !== '1') return;
      if (event.isComposing || panel.spxCenterQueryComposing) return;
      commitCenterQueryInput(panel, config, target);
    });

    panel.addEventListener('change', function handleCenterChange(event) {
      var target = event.target;
      if (!target || !target.dataset) return;
      var state = ensureCenterPanelState(panel, config.stateDefaults || { query: '', filter: 'all', tag: 'all', provider: 'all' });
      if (target.dataset.spxCenterFilter === '1') {
        if (state.filter === target.value) return;
        state.filter = target.value;
      } else if (target.dataset.spxCenterTag === '1') {
        if (state.tag === target.value) return;
        state.tag = target.value;
      } else if (target.dataset.spxCenterProvider === '1') {
        if (state.provider === target.value) return;
        state.provider = target.value;
      } else if (target.dataset.spxCenterView === '1') {
        if (state.view === target.value) return;
        state.view = target.value;
      } else {
        return;
      }
      panel.spxRender();
    });

    panel.addEventListener('click', function handleCenterClick(event) {
      var target = event.target;
      var action = target && target.dataset && target.dataset.action;
      if (!action) return;
      config.onAction(action, target, panel);
    });

    panel.spxRender = function renderPanel() {
      config.render(panel);
    };
    panel.spxRender();
    return panel;
  }

  function openProgressEntry(state, id, url, mode) {
    if (!id) return;
    requestReadProgressRestore(id, mode);
    if (detectPageType(location.href) === 'read' && parseThreadId(location.href) === id) {
      restoreReadProgress(state, id, mode);
      return;
    }
    if (url) location.href = url;
  }

  function renderWatchCenter(panel, state) {
    state.watch = state.watch || {};
    state.progress = state.progress || {};
    var entries = getWatchCenterEntries(state.watch, state.progress);
    renderCenterPanel(panel, {
      title: '稍后看中心',
      summary: function summary(visibleEntries, entries, panelState) {
        return (
          (isCenterFiltered(panelState) ? (visibleEntries.length + ' / ') : '') +
          entries.length +
          ' 条已保存主题'
        );
      },
      headerActions: function headerActions(visibleEntries, entries, panelState) {
        var actions = [];
        if (visibleEntries.length && isCenterFiltered(panelState)) {
          actions.push({ text: '移除筛选', dataset: { action: 'remove-visible-watch' } });
        }
        if (entries.length) actions.push({ text: '清空', dataset: { action: 'clear-watch' } });
        actions.push({ text: '关闭', dataset: { action: 'close-watch' } });
        return actions;
      },
      controls: {
        searchPlaceholder: '搜索标题或楼层',
        filters: [
          { value: 'all', label: '全部' },
          { value: 'todo', label: '未读完' },
          { value: 'progress', label: '有进度' },
          { value: 'done', label: '已读完' },
        ],
        tags: getCenterTagOptions(entries),
      },
      emptyText: '还没有保存的主题。可在帖子列表点击“稍后”加入。',
      emptyFilteredText: '没有匹配的已保存主题。',
      entries: entries,
      filterEntries: filterWatchCenterEntries,
      getItemData: function getItemData(entry) {
        return { id: entry.id };
      },
      createTitle: function createTitle(entry) {
        return createCenterTitleElement({
          text: entry.title,
          href: entry.url || entry.progressUrl || '#',
        });
      },
      createMeta: function createMeta(entry) {
        var metaParts = [];
        if (entry.savedAt) metaParts.push('保存 ' + formatShortTime(entry.savedAt));
        if (entry.progressText) metaParts.push('进度 ' + entry.progressText);
        if (entry.nextFloorLabel) metaParts.push('续读 ' + entry.nextFloorLabel);
        if (entry.floorLabel && entry.floorLabel !== entry.nextFloorLabel) metaParts.push('上次 ' + entry.floorLabel);
        if (entry.tagText) metaParts.push('标签 ' + entry.tagText);
        return metaParts.join(' · ') || '暂无进度';
      },
      createActions: function createActions(entry) {
        var actions = [];
        if (entry.progressAt && entry.progressUrl) {
          actions.push({ text: '继续阅读', dataset: { action: 'continue-watch', id: entry.id } });
          if (entry.floorLabel) actions.push({ text: '上次楼层', dataset: { action: 'continue-last-watch', id: entry.id } });
        }
        actions.push({ text: '标签', dataset: { action: 'tag-watch', id: entry.id } });
        actions.push({ text: '打开', href: entry.url || entry.progressUrl || '#' });
        actions.push({ text: '移除', dataset: { action: 'remove-watch', id: entry.id } });
        return actions;
      },
    });
  }

  function refreshWatchCenter() {
    refreshCenterPanel('#spx-watch-center');
  }

  function createWatchCenterPanel(settings, state) {
    return createCenterPanel({
      id: 'spx-watch-center',
      render: function render(panel) {
        renderWatchCenter(panel, state);
      },
      onAction: function onAction(action, target, panel) {
        if (action === 'close-watch') {
          setCenterPanelHidden(panel, true, '[data-spx-watch-center-button="1"]');
          return;
        }
        if (action === 'remove-visible-watch') {
          var visibleEntries = filterWatchCenterEntries(
            getWatchCenterEntries(state.watch, state.progress),
            ensureCenterPanelState(panel, { query: '', filter: 'all', tag: 'all' })
          );
          if (!visibleEntries.length) return;
          if (typeof window.confirm === 'function' && !window.confirm('移除当前筛选结果中的稍后看主题？')) return;
          visibleEntries.forEach(function removeVisibleEntry(entry) {
            delete state.watch[entry.id];
          });
          saveMap(WATCH_KEY, state.watch);
          qsa('.spx-watch-badge').forEach(function removeMatchingBadge(badge) {
            if (!state.watch[badge.dataset.spxWatchId]) badge.remove();
          });
          renderWatchCenter(panel, state);
          return;
        }
        if (action === 'clear-watch') {
          if (typeof window.confirm === 'function' && !window.confirm('清空全部稍后看主题？')) return;
          state.watch = {};
          saveMap(WATCH_KEY, state.watch);
          qsa('.spx-watch-badge').forEach(function removeBadge(badge) {
            badge.remove();
          });
          renderWatchCenter(panel, state);
          return;
        }
        var id = target.dataset.id;
        if (!id) return;
        if (action === 'tag-watch') {
          var currentTags = parseTagList(state.watch[id] && state.watch[id].tags);
          var nextTags = typeof window.prompt === 'function'
            ? window.prompt('编辑标签，多个标签用逗号或换行分隔', currentTags.join('，'))
            : null;
          if (nextTags === null) return;
          state.watch[id] = state.watch[id] || {};
          state.watch[id].tags = parseTagList(nextTags);
          saveMap(WATCH_KEY, state.watch);
          renderWatchCenter(panel, state);
          return;
        }
        if (action === 'remove-watch') {
          delete state.watch[id];
          saveMap(WATCH_KEY, state.watch);
          qsa('.spx-watch-badge').forEach(function removeMatchingBadge(badge) {
            if (badge.dataset.spxWatchId === id) badge.remove();
          });
          renderWatchCenter(panel, state);
          return;
        }
        if (action === 'continue-watch') {
          var entry = getWatchCenterEntries(state.watch, state.progress).filter(function matchEntry(item) {
            return item.id === id;
          })[0];
          if (!entry) return;
          openProgressEntry(state, id, entry.progressUrl || entry.url, 'next');
          return;
        }
        if (action === 'continue-last-watch') {
          var lastEntry = getWatchCenterEntries(state.watch, state.progress).filter(function matchLastEntry(item) {
            return item.id === id;
          })[0];
          if (!lastEntry) return;
          openProgressEntry(state, id, lastEntry.progressUrl || lastEntry.url, 'last');
        }
      },
    });
  }

  function renderHistoryCenter(panel, state) {
    state.progress = state.progress || {};
    var entries = getHistoryCenterEntries(state.progress);
    renderCenterPanel(panel, {
      title: '最近浏览',
      summary: function summary(visibleEntries, entries, panelState) {
        return (
          (isCenterFiltered(panelState) ? (visibleEntries.length + ' / ') : '') +
          entries.length +
          ' 条阅读记录'
        );
      },
      headerActions: function headerActions(visibleEntries, entries, panelState) {
        var actions = [];
        if (visibleEntries.length && isCenterFiltered(panelState)) {
          actions.push({ text: '移除筛选', dataset: { action: 'remove-visible-history' } });
        }
        if (entries.length) actions.push({ text: '清空', dataset: { action: 'clear-history' } });
        actions.push({ text: '关闭', dataset: { action: 'close-history' } });
        return actions;
      },
      controls: {
        searchPlaceholder: '搜索标题或楼层',
        filters: [
          { value: 'all', label: '全部' },
          { value: 'todo', label: '未读完' },
          { value: 'done', label: '已读完' },
        ],
        tags: getCenterTagOptions(entries),
      },
      emptyText: '还没有阅读记录。打开帖子后会自动记录进度。',
      emptyFilteredText: '没有匹配的阅读记录。',
      entries: entries,
      filterEntries: filterHistoryCenterEntries,
      getItemData: function getItemData(entry) {
        return { id: entry.id };
      },
      createTitle: function createTitle(entry) {
        return createCenterTitleElement({
          text: entry.title,
          href: entry.url || '#',
        });
      },
      createMeta: function createMeta(entry) {
        var metaParts = [];
        if (entry.progressAt) metaParts.push('浏览 ' + formatShortTime(entry.progressAt));
        if (entry.progressText) metaParts.push('进度 ' + entry.progressText);
        if (entry.nextFloorLabel) metaParts.push('续读 ' + entry.nextFloorLabel);
        if (entry.floorLabel && entry.floorLabel !== entry.nextFloorLabel) metaParts.push('上次 ' + entry.floorLabel);
        if (entry.tagText) metaParts.push('标签 ' + entry.tagText);
        return metaParts.join(' · ') || '暂无进度';
      },
      createActions: function createActions(entry) {
        var actions = [
          { text: '继续阅读', dataset: { action: 'continue-history', id: entry.id } },
          { text: '标签', dataset: { action: 'tag-history', id: entry.id } },
          { text: '打开', href: entry.url || '#' },
          { text: '移除', dataset: { action: 'remove-history', id: entry.id } },
        ];
        if (entry.floorLabel) actions.splice(1, 0, { text: '上次楼层', dataset: { action: 'continue-last-history', id: entry.id } });
        return actions;
      },
    });
  }

  function refreshHistoryCenter() {
    refreshCenterPanel('#spx-history-center');
  }

  function createHistoryCenterPanel(settings, state) {
    return createCenterPanel({
      id: 'spx-history-center',
      render: function render(panel) {
        renderHistoryCenter(panel, state);
      },
      onAction: function onAction(action, target, panel) {
        if (action === 'close-history') {
          setCenterPanelHidden(panel, true, '[data-spx-history-center-button="1"]');
          return;
        }
        if (action === 'remove-visible-history') {
          var visibleEntries = filterHistoryCenterEntries(
            getHistoryCenterEntries(state.progress),
            ensureCenterPanelState(panel, { query: '', filter: 'all', tag: 'all' })
          );
          if (!visibleEntries.length) return;
          if (typeof window.confirm === 'function' && !window.confirm('移除当前筛选结果中的阅读记录？')) return;
          visibleEntries.forEach(function removeVisibleHistory(entry) {
            delete state.progress[entry.id];
          });
          saveReadProgress(state.progress);
          refreshWatchCenter();
          renderHistoryCenter(panel, state);
          return;
        }
        if (action === 'clear-history') {
          if (typeof window.confirm === 'function' && !window.confirm('清空全部阅读记录？')) return;
          state.progress = {};
          saveReadProgress(state.progress);
          clearReadProgressRestoreRequest(parseThreadId(location.href));
          refreshWatchCenter();
          renderHistoryCenter(panel, state);
          return;
        }
        var id = target.dataset.id;
        if (!id) return;
        if (action === 'tag-history') {
          var currentTags = parseTagList(state.progress[id] && state.progress[id].tags);
          var nextTags = typeof window.prompt === 'function'
            ? window.prompt('编辑标签，多个标签用逗号或换行分隔', currentTags.join('，'))
            : null;
          if (nextTags === null) return;
          state.progress[id] = state.progress[id] || {};
          state.progress[id].tags = parseTagList(nextTags);
          saveReadProgress(state.progress);
          refreshWatchCenter();
          renderHistoryCenter(panel, state);
          return;
        }
        if (action === 'remove-history') {
          delete state.progress[id];
          saveReadProgress(state.progress);
          refreshWatchCenter();
          renderHistoryCenter(panel, state);
          return;
        }
        if (action === 'continue-history') {
          var entry = getHistoryCenterEntries(state.progress).filter(function matchEntry(item) {
            return item.id === id;
          })[0];
          if (!entry) return;
          openProgressEntry(state, id, entry.url, 'next');
          return;
        }
        if (action === 'continue-last-history') {
          var lastEntry = getHistoryCenterEntries(state.progress).filter(function matchLastEntry(item) {
            return item.id === id;
          })[0];
          if (!lastEntry) return;
          openProgressEntry(state, id, lastEntry.url, 'last');
        }
      },
    });
  }

  function renderAutoBuyCenter(panel) {
    renderCenterPanel(panel, {
      title: '自动购买记录',
      summary: function summary(visibleEntries, entries, panelState) {
        return (
          ((panelState.query || panelState.filter !== 'all') ? (visibleEntries.length + ' / ') : '') +
          entries.length +
          ' 条执行记录'
        );
      },
      headerActions: function headerActions(visibleEntries, entries, panelState) {
        var actions = [];
        if (visibleEntries.length && (panelState.query || panelState.filter !== 'all')) {
          actions.push({ text: '删除筛选', dataset: { action: 'remove-visible-auto-buy-records' } });
        }
        if (entries.length) actions.push({ text: '清空', dataset: { action: 'clear-auto-buy-records' } });
        actions.push({ text: '关闭', dataset: { action: 'close-auto-buy-center' } });
        return actions;
      },
      controls: {
        searchPlaceholder: '搜索帖子或结果',
        filters: [
          { value: 'all', label: '全部' },
          { value: 'checking', label: '检查中' },
          { value: 'skipped', label: '已跳过' },
          { value: 'buying', label: '购买中' },
          { value: 'done', label: '已完成' },
          { value: 'failed', label: '失败' },
        ],
      },
      emptyText: '还没有自动购买记录。开启自动购买并遇到付费帖后会记录执行状态。',
      emptyFilteredText: '没有匹配的自动购买记录。',
      entries: getAutoBuyCenterEntries(loadAutoBuyAttempts()),
      filterEntries: filterAutoBuyCenterEntries,
      getItemData: function getItemData(entry) {
        return { key: entry.key };
      },
      createTitle: function createTitle(entry) {
        return createCenterTitleElement({
          text: entry.key,
          href: entry.url,
          badgeText: entry.statusLabel,
          badgeClass: 'spx-status-' + entry.status,
        });
      },
      createMeta: function createMeta(entry) {
        var metaParts = [];
        if (entry.updatedAt) metaParts.push('记录 ' + formatShortTime(entry.updatedAt));
        if (entry.price !== null && isFinite(entry.price)) metaParts.push('价格 ' + entry.price + ' SP');
        if (entry.balance !== null && isFinite(entry.balance)) metaParts.push('余额 ' + entry.balance + ' SP');
        if (entry.message) metaParts.push(entry.message);
        return metaParts.join(' · ') || '暂无详情';
      },
      createActions: function createActions(entry) {
        var actions = [];
        if (entry.url) actions.push({ text: '打开', href: entry.url });
        actions.push({ text: '删除记录', dataset: { action: 'remove-auto-buy-record', key: entry.key } });
        return actions;
      },
    });
  }

  function refreshAutoBuyCenter() {
    refreshCenterPanel('#spx-auto-buy-center');
  }

  function createAutoBuyCenterPanel(settings, state) {
    return createCenterPanel({
      id: 'spx-auto-buy-center',
      render: function render(panel) {
        renderAutoBuyCenter(panel);
      },
      onAction: function onAction(action, target, panel) {
        if (action === 'close-auto-buy-center') {
          setCenterPanelHidden(panel, true, '[data-spx-auto-buy-center-button="1"]');
          return;
        }
        if (action === 'remove-visible-auto-buy-records') {
          var attempts = loadAutoBuyAttempts();
          var visibleEntries = filterAutoBuyCenterEntries(
            getAutoBuyCenterEntries(attempts),
            ensureCenterPanelState(panel, { query: '', filter: 'all' })
          );
          if (!visibleEntries.length) return;
          if (typeof window.confirm === 'function' && !window.confirm('删除当前筛选结果中的自动购买记录？')) return;
          visibleEntries.forEach(function removeVisibleAutoBuyEntry(entry) {
            delete attempts[entry.key];
          });
          saveAutoBuyAttempts(attempts);
          renderAutoBuyCenter(panel);
          return;
        }
        if (action === 'clear-auto-buy-records') {
          if (typeof window.confirm === 'function' && !window.confirm('清空全部自动购买记录？')) return;
          saveAutoBuyAttempts({});
          delete document.documentElement.dataset.spxAutoBuyStatus;
          var status = qs('#spx-auto-buy-status');
          if (status) status.remove();
          renderAutoBuyCenter(panel);
          return;
        }
        if (action === 'remove-auto-buy-record') {
          var key = target.dataset.key;
          if (!key) return;
          var attempts = loadAutoBuyAttempts();
          delete attempts[key];
          saveAutoBuyAttempts(attempts);
          renderAutoBuyCenter(panel);
        }
      },
    });
  }

  function renderResourceCenter(panel, state) {
    state.resources = pruneResourceLibrary(state.resources || {});
    var entries = getResourceCenterEntries(state.resources);
    renderCenterPanel(panel, {
      title: '资源工作台',
      stateDefaults: { query: '', filter: 'all', provider: 'all', tag: 'all', view: 'list', selectedResources: {} },
      summary: function summary(visibleEntries, entries, panelState) {
        var queueCount = getResourceDownloadQueueEntries(entries).length;
        var selectedCount = getSelectedResourceKeys(entries, panelState).length;
        return (
          (isCenterFiltered(panelState) ? (visibleEntries.length + ' / ') : '') +
          entries.length +
          ' 条资源' +
          (queueCount ? (' · 待下载 ' + queueCount + ' 条') : '') +
          (selectedCount ? (' · 已选 ' + selectedCount + ' 条') : '') +
          (panelState.view === 'source' ? ' · 来源分组' : '')
        );
      },
      headerActions: function headerActions(visibleEntries, entries, panelState) {
        var actions = [];
        var selectedKeys = getSelectedResourceKeys(entries, panelState);
        var visibleQueue = getResourceDownloadQueueEntries(visibleEntries);
        if (visibleEntries.length) actions.push({ text: '全选筛选', dataset: { action: 'select-visible-resources' } });
        if (selectedKeys.length) {
          actions.push({ text: '取消选择', dataset: { action: 'clear-resource-selection' } });
          actions.push({ text: '复制选中', dataset: { action: 'copy-selected-resources' } });
          actions.push({ text: 'Markdown', dataset: { action: 'copy-selected-resource-markdown' } });
          actions.push({ text: '选中待下载', dataset: { action: 'mark-selected-resources', status: 'todo' } });
          actions.push({ text: '选中已处理', dataset: { action: 'mark-selected-resources', status: 'done' } });
          actions.push({ text: '选中失效', dataset: { action: 'mark-selected-resources', status: 'invalid' } });
          actions.push({ text: '选中标签', dataset: { action: 'tag-selected-resources' } });
          actions.push({ text: '选中备注', dataset: { action: 'note-selected-resources' } });
        }
        if (visibleEntries.length) actions.push({ text: '复制筛选', dataset: { action: 'copy-visible-resources' } });
        if (visibleQueue.length) actions.push({ text: '复制待下载', dataset: { action: 'copy-download-queue' } });
        if (visibleEntries.length) actions.push({ text: '导出清单', dataset: { action: 'export-visible-resources' } });
        if (visibleEntries.length && isCenterFiltered(panelState)) {
          actions.push({ text: '删除筛选', dataset: { action: 'remove-visible-resources' } });
        }
        if (entries.length) actions.push({ text: '清空', dataset: { action: 'clear-resources' } });
        actions.push({ text: '关闭', dataset: { action: 'close-resource-center' } });
        return actions;
      },
      controls: {
        searchPlaceholder: '搜索资源、帖子、作者、备注或标签',
        filters: [
          { value: 'all', label: '全部状态' },
          { value: 'saved', label: RESOURCE_STATUSES.saved },
          { value: 'todo', label: RESOURCE_STATUSES.todo },
          { value: 'done', label: RESOURCE_STATUSES.done },
          { value: 'invalid', label: RESOURCE_STATUSES.invalid },
        ],
        providers: getResourceProviderOptions(entries),
        providerAllLabel: '全部类型',
        tags: getCenterTagOptions(entries),
        views: [
          { value: 'list', label: '列表视图' },
          { value: 'source', label: '按来源帖' },
        ],
      },
      emptyText: '还没有保存的资源。可在阅读页资源面板或自动购买成功后存入。',
      emptyFilteredText: '没有匹配的资源。',
      entries: entries,
      filterEntries: filterResourceCenterEntries,
      transformVisibleEntries: function transformVisibleEntries(visibleEntries, entries, panelState) {
        return panelState.view === 'source' ? groupResourceCenterEntries(visibleEntries) : visibleEntries;
      },
      getItemData: function getItemData(entry) {
        return entry.entries ? { resourceGroupKey: entry.key } : { key: entry.key };
      },
      createTitle: function createTitle(entry) {
        if (entry.entries) {
          return createCenterTitleElement({
            text: entry.label + ' · ' + entry.entries.length + ' 条资源',
            href: entry.sourceUrl,
            badgeText: '来源分组',
            badgeClass: 'spx-status-saved',
            title: entry.label,
          });
        }
        var titleRow = createEl('div', 'spx-resource-title-row');
        var select = createEl('input', 'spx-resource-select');
        select.type = 'checkbox';
        select.dataset.action = 'toggle-resource-selection';
        select.dataset.key = entry.key;
        select.checked = !!ensureResourceSelection(ensureCenterPanelState(panel, { selectedResources: {} }))[entry.key];
        select.title = '选择资源';
        titleRow.appendChild(select);
        titleRow.appendChild(createCenterTitleElement({
          text: entry.label + ' · ' + entry.url,
          href: entry.url,
          badgeText: entry.statusLabel,
          badgeClass: 'spx-status-' + entry.status,
          title: entry.url,
        }));
        return titleRow;
      },
      createMeta: function createMeta(entry) {
        if (entry.entries) {
          var typeCounts = {};
          entry.entries.forEach(function countGroupResource(item) {
            var label = item.label || getResourceDisplayLabel(item);
            typeCounts[label] = (typeCounts[label] || 0) + 1;
          });
          var typeText = Object.keys(typeCounts).map(function formatTypeCount(label) {
            return label + ' ' + typeCounts[label];
          }).join(' / ');
          return [
            typeText,
            entry.updatedAt ? ('最新 ' + formatShortTime(entry.updatedAt)) : '',
            entry.sourceUrl ? entry.sourceUrl : '',
          ].filter(Boolean).join(' · ') || '暂无来源详情';
        }
        var metaParts = [];
        if (entry.savedAt) metaParts.push('保存 ' + formatShortTime(entry.savedAt));
        if (entry.provider) metaParts.push(entry.provider);
        if (entry.sourceText) metaParts.push(entry.sourceText);
        if (entry.accessCode) metaParts.push('提取码 ' + entry.accessCode);
        if (entry.tagText) metaParts.push('标签 ' + entry.tagText);
        if (entry.note) metaParts.push('备注 ' + entry.note);
        return metaParts.join(' · ') || '暂无来源';
      },
      createActions: function createActions(entry) {
        if (entry.entries) {
          var groupActions = [
            { text: '选择分组', dataset: { action: 'select-resource-group', sourceKey: entry.key } },
            { text: '复制分组', dataset: { action: 'copy-resource-group', sourceKey: entry.key } },
            { text: '分组 Markdown', dataset: { action: 'copy-resource-group-markdown', sourceKey: entry.key } },
            { text: '待下载', dataset: { action: 'mark-resource-group', sourceKey: entry.key, status: 'todo' } },
            { text: '已处理', dataset: { action: 'mark-resource-group', sourceKey: entry.key, status: 'done' } },
          ];
          if (entry.sourceUrl) groupActions.push({ text: '来源帖', href: entry.sourceUrl });
          return groupActions;
        }
        var actions = [
          { text: '复制', dataset: { action: 'copy-resource', key: entry.key } },
          { text: '备注', dataset: { action: 'note-resource', key: entry.key } },
          { text: '标签', dataset: { action: 'tag-resource', key: entry.key } },
          { text: '待下载', dataset: { action: 'mark-resource-todo', key: entry.key } },
          { text: '已处理', dataset: { action: 'mark-resource-done', key: entry.key } },
          { text: '失效', dataset: { action: 'mark-resource-invalid', key: entry.key } },
        ];
        if (entry.status !== 'saved') actions.push({ text: '已保存', dataset: { action: 'mark-resource-saved', key: entry.key } });
        if (entry.sourceUrl) actions.push({ text: '来源帖', href: entry.sourceUrl });
        actions.push({ text: '删除', dataset: { action: 'remove-resource', key: entry.key } });
        return actions;
      },
    });
  }

  function getVisibleResourceCenterEntries(panel, state) {
    return filterResourceCenterEntries(
      getResourceCenterEntries(state.resources),
      ensureCenterPanelState(panel, { query: '', filter: 'all', provider: 'all', tag: 'all', view: 'list', selectedResources: {} })
    );
  }

  function getResourceGroupEntriesFromPanel(panel, state, sourceKey) {
    var groups = groupResourceCenterEntries(getVisibleResourceCenterEntries(panel, state));
    var group = groups.filter(function matchResourceGroup(item) {
      return item.key === sourceKey;
    })[0];
    return group ? group.entries : [];
  }

  function updateResourceRecords(state, keys, updater) {
    var now = Date.now();
    (keys || []).forEach(function updateResourceKey(key) {
      if (!state.resources[key]) return;
      var record = normalizeResourceRecord(state.resources[key], key);
      if (!record) return;
      updater(record);
      record.updatedAt = now;
      state.resources[key] = record;
    });
  }

  function promptResourceTags(currentTags) {
    return typeof window.prompt === 'function'
      ? window.prompt('编辑标签，多个标签用逗号或换行分隔', normalizeResourceTags(currentTags).join('，'))
      : null;
  }

  function promptResourceNote(currentNote) {
    return typeof window.prompt === 'function'
      ? window.prompt('编辑备注', String(currentNote || ''))
      : null;
  }

  function getResourceEntryKeys(entries) {
    return (entries || []).map(function mapResourceEntryKey(entry) {
      return entry && entry.key;
    }).filter(Boolean);
  }

  function copyResourceEntriesToClipboard(entries, formatter, target, successText, restoreText) {
    copyTextToClipboard(formatter(entries)).then(
      function showCopySuccess() {
        setTemporaryText(target, successText, restoreText);
      },
      function showCopyFailure() {
        setTemporaryText(target, '复制失败', restoreText);
      }
    );
  }

  function refreshResourceCenter() {
    refreshCenterPanel('#spx-resource-center');
  }

  function saveResourceCenterState(state) {
    state.resources = pruneResourceLibrary(state.resources || {});
    saveResourceLibrary(state.resources);
    refreshResourceCenter();
  }

  function createResourceCenterPanel(settings, state) {
    return createCenterPanel({
      id: 'spx-resource-center',
      stateDefaults: { query: '', filter: 'all', provider: 'all', tag: 'all', view: 'list', selectedResources: {} },
      render: function render(panel) {
        renderResourceCenter(panel, state);
      },
      onAction: function onAction(action, target, panel) {
        state.resources = pruneResourceLibrary(state.resources || {});
        if (action === 'close-resource-center') {
          setCenterPanelHidden(panel, true, '[data-spx-resource-center-button="1"]');
          return;
        }
        var panelState = ensureCenterPanelState(panel, { query: '', filter: 'all', provider: 'all', tag: 'all', view: 'list', selectedResources: {} });
        var allEntries = getResourceCenterEntries(state.resources);
        var visibleEntriesNow = getVisibleResourceCenterEntries(panel, state);
        var selectedKeys = getSelectedResourceKeys(allEntries, panelState);
        var selectedEntries = getResourceEntriesByKeys(allEntries, selectedKeys);
        if (action === 'toggle-resource-selection') {
          var toggleKey = target.dataset.key;
          if (!toggleKey) return;
          var selection = ensureResourceSelection(panelState);
          if (target.checked) selection[toggleKey] = true;
          else delete selection[toggleKey];
          renderResourceCenter(panel, state);
          return;
        }
        if (action === 'select-visible-resources') {
          setResourceSelection(visibleEntriesNow, panelState, true);
          renderResourceCenter(panel, state);
          return;
        }
        if (action === 'clear-resource-selection') {
          panelState.selectedResources = {};
          renderResourceCenter(panel, state);
          return;
        }
        if (action === 'select-resource-group') {
          setResourceSelection(getResourceGroupEntriesFromPanel(panel, state, target.dataset.sourceKey), panelState, true);
          renderResourceCenter(panel, state);
          return;
        }
        if (action === 'copy-selected-resources') {
          copyResourceEntriesToClipboard(selectedEntries, formatResourceLinks, target, '已复制 ' + selectedEntries.length + ' 条', '复制选中');
          return;
        }
        if (action === 'copy-selected-resource-markdown') {
          copyResourceEntriesToClipboard(selectedEntries, formatResourceMarkdownList, target, '已复制 Markdown', 'Markdown');
          return;
        }
        if (action === 'copy-resource-group' || action === 'copy-resource-group-markdown') {
          var groupEntriesForCopy = getResourceGroupEntriesFromPanel(panel, state, target.dataset.sourceKey);
          copyResourceEntriesToClipboard(
            groupEntriesForCopy,
            action === 'copy-resource-group-markdown' ? formatResourceMarkdownList : formatResourceLinks,
            target,
            action === 'copy-resource-group-markdown' ? '已复制 Markdown' : ('已复制 ' + groupEntriesForCopy.length + ' 条'),
            action === 'copy-resource-group-markdown' ? '分组 Markdown' : '复制分组'
          );
          return;
        }
        if (action === 'mark-selected-resources' || action === 'mark-resource-group') {
          var statusKeys = action === 'mark-resource-group'
            ? getResourceEntryKeys(getResourceGroupEntriesFromPanel(panel, state, target.dataset.sourceKey))
            : selectedKeys;
          updateResourceRecords(state, statusKeys, function markSelectedResource(record) {
            record.status = normalizeResourceStatus(target.dataset.status);
          });
          saveResourceCenterState(state);
          renderResourceCenter(panel, state);
          return;
        }
        if (action === 'tag-selected-resources') {
          var selectedTagText = promptResourceTags([]);
          if (selectedTagText === null) return;
          updateResourceRecords(state, selectedKeys, function tagSelectedResource(record) {
            record.tags = parseTagList(selectedTagText);
          });
          saveResourceCenterState(state);
          renderResourceCenter(panel, state);
          return;
        }
        if (action === 'note-selected-resources') {
          var selectedNoteText = promptResourceNote('');
          if (selectedNoteText === null) return;
          updateResourceRecords(state, selectedKeys, function noteSelectedResource(record) {
            record.note = String(selectedNoteText || '').replace(/\s+/g, ' ').trim().slice(0, 160);
          });
          saveResourceCenterState(state);
          renderResourceCenter(panel, state);
          return;
        }
        if (action === 'copy-visible-resources') {
          var visibleForCopy = visibleEntriesNow;
          copyTextToClipboard(formatResourceLinks(visibleForCopy)).then(
            function showCopySuccess() {
              setTemporaryText(target, '已复制 ' + visibleForCopy.length + ' 条', '复制筛选');
            },
            function showCopyFailure() {
              setTemporaryText(target, '复制失败', '复制筛选');
            }
          );
          return;
        }
        if (action === 'copy-download-queue') {
          var visibleQueueForCopy = getResourceDownloadQueueEntries(visibleEntriesNow);
          copyTextToClipboard(formatResourceDownloadList(visibleQueueForCopy)).then(
            function showQueueCopySuccess() {
              setTemporaryText(target, '已复制 ' + visibleQueueForCopy.length + ' 条', '复制待下载');
            },
            function showQueueCopyFailure() {
              setTemporaryText(target, '复制失败', '复制待下载');
            }
          );
          return;
        }
        if (action === 'export-visible-resources') {
          var visibleForExport = visibleEntriesNow;
          if (!visibleForExport.length) return;
          if (exportResourceDownloadList(visibleForExport)) {
            setTemporaryText(target, '已导出 ' + visibleForExport.length + ' 条', '导出清单');
          } else {
            copyTextToClipboard(formatResourceDownloadList(visibleForExport)).then(
              function showExportCopySuccess() {
                setTemporaryText(target, '已复制清单', '导出清单');
              },
              function showExportFailure() {
                setTemporaryText(target, '导出失败', '导出清单');
              }
            );
          }
          return;
        }
        if (action === 'remove-visible-resources') {
          var visibleEntries = visibleEntriesNow;
          if (!visibleEntries.length) return;
          if (typeof window.confirm === 'function' && !window.confirm('删除当前筛选结果中的资源？')) return;
          visibleEntries.forEach(function removeVisibleResource(entry) {
            delete state.resources[entry.key];
            delete ensureResourceSelection(panelState)[entry.key];
          });
          saveResourceCenterState(state);
          renderResourceCenter(panel, state);
          return;
        }
        if (action === 'clear-resources') {
          if (typeof window.confirm === 'function' && !window.confirm('清空全部资源库记录？')) return;
          state.resources = {};
          panelState.selectedResources = {};
          saveResourceCenterState(state);
          renderResourceCenter(panel, state);
          return;
        }

        var key = target.dataset.key;
        if (!key) return;
        if (action === 'copy-resource') {
          var entry = state.resources[key];
          copyTextToClipboard(formatResourceLinks(entry ? [entry] : [])).catch(function noop() {});
          return;
        }
        if (action === 'remove-resource') {
          delete state.resources[key];
          delete ensureResourceSelection(panelState)[key];
          saveResourceCenterState(state);
          renderResourceCenter(panel, state);
          return;
        }
        if (action === 'tag-resource' && state.resources[key]) {
          var tagText = promptResourceTags(state.resources[key].tags);
          if (tagText === null) return;
          updateResourceRecords(state, [key], function tagResource(record) {
            record.tags = parseTagList(tagText);
          });
          saveResourceCenterState(state);
          renderResourceCenter(panel, state);
          return;
        }
        if (action === 'note-resource' && state.resources[key]) {
          var noteText = promptResourceNote(state.resources[key].note);
          if (noteText === null) return;
          updateResourceRecords(state, [key], function noteResource(record) {
            record.note = String(noteText || '').replace(/\s+/g, ' ').trim().slice(0, 160);
          });
          saveResourceCenterState(state);
          renderResourceCenter(panel, state);
          return;
        }
        if (/^mark-resource-/.test(action) && state.resources[key]) {
          var status = action.replace('mark-resource-', '');
          updateResourceRecords(state, [key], function markResource(record) {
            record.status = normalizeResourceStatus(status);
          });
          saveResourceCenterState(state);
          renderResourceCenter(panel, state);
        }
      },
    });
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
    var watchVisibleButton = createEl('button', '', '可见稍后');
    var preloadNextButton = createEl('button', '', '预载下页');
    var clearButton = createEl('button', '', '清空过滤');
    tools.appendChild(input);
    tools.appendChild(markVisibleButton);
    tools.appendChild(watchVisibleButton);
    tools.appendChild(preloadNextButton);
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
    watchVisibleButton.addEventListener('click', function watchVisibleThreads() {
      var count = 0;
      state.watch = state.watch || {};
      items.forEach(function saveVisibleWatch(item) {
        if (!item || !item.id || !item.titleLink || !isVisibleThreadRow(item.row)) return;
        if (state.watch[item.id]) return;
        state.watch[item.id] = {
          title: item.title,
          url: item.titleLink.href,
          savedAt: Date.now(),
        };
        count += 1;
        var button = qs('.spx-thread-tools button', item.cell);
        if (button && button.textContent === '稍后') button.textContent = '已存';
        if (!qs('.spx-watch-badge', item.cell)) {
          item.titleLink.insertAdjacentElement('afterend', createWatchBadge(item.id));
        }
      });
      saveMap(WATCH_KEY, state.watch);
      refreshWatchCenter();
      watchVisibleButton.textContent = count ? '已存 ' + count + ' 条' : '无新增';
      window.setTimeout(function resetWatchVisibleText() {
        watchVisibleButton.textContent = '可见稍后';
      }, 1600);
    });
    preloadNextButton.addEventListener('click', function preloadNextPage() {
      if (typeof window.fetch !== 'function') return;
      var nextUrl = buildPageUrl(location.href, currentPageNumber(location.href) + 1);
      preloadNextButton.disabled = true;
      preloadNextButton.textContent = '预载中';
      window.fetch(nextUrl, {
        credentials: 'include',
        cache: 'force-cache',
      })
        .then(function readNextPage(response) {
          if (!response.ok) throw new Error('下一页加载失败');
          return response.text();
        })
        .then(function showNextPageCount(html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var count = qsa('td[id^="td_"]', doc).length;
          preloadNextButton.textContent = count ? '已预载 ' + count + ' 条' : '已预载';
        })
        .catch(function showPreloadFailure() {
          preloadNextButton.textContent = '预载失败';
        })
        .then(function resetPreloadButton() {
          window.setTimeout(function resetPreloadText() {
            preloadNextButton.disabled = false;
            preloadNextButton.textContent = '预载下页';
          }, 1800);
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
        info.titleLink.insertAdjacentElement('afterend', createWatchBadge(info.id));
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
          info.titleLink.insertAdjacentElement('afterend', createWatchBadge(info.id));
        }
        saveMap(WATCH_KEY, state.watch);
        refreshWatchCenter();
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

  function getSessionStorage() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) return window.sessionStorage;
    } catch (error) {
      return null;
    }
    return null;
  }

  function requestReadProgressRestore(tid, mode) {
    var storage = getSessionStorage();
    if (!storage || !tid) return;
    storage.setItem(RESTORE_PROGRESS_KEY, JSON.stringify({
      tid: String(tid),
      mode: mode === 'last' ? 'last' : 'next',
    }));
  }

  function getReadProgressRestoreRequest(tid) {
    var storage = getSessionStorage();
    if (!storage || !tid) return null;
    var rawValue = storage.getItem(RESTORE_PROGRESS_KEY);
    if (!rawValue) return null;
    if (rawValue === String(tid)) return { tid: String(tid), mode: 'next' };
    try {
      var request = JSON.parse(rawValue);
      if (!request || String(request.tid || '') !== String(tid)) return null;
      return {
        tid: String(request.tid),
        mode: request.mode === 'last' ? 'last' : 'next',
      };
    } catch (error) {
      return null;
    }
  }

  function clearReadProgressRestoreRequest(tid) {
    var storage = getSessionStorage();
    if (!storage || !tid) return;
    if (getReadProgressRestoreRequest(tid)) {
      storage.removeItem(RESTORE_PROGRESS_KEY);
    }
  }

  function getReadPageTitle(root) {
    var scope = root || document;
    var titleNode =
      qs('[id^="subject_"]', scope) ||
      qs('.h1', scope) ||
      qs('h1', scope) ||
      qs('title', scope);
    return compactText(titleNode && titleNode.textContent) || compactText(document.title) || '未命名帖子';
  }

  function getCurrentResourceSourceMeta() {
    return {
      sourceTitle: getReadPageTitle(document),
      sourceUrl: location.href.split('#')[0],
    };
  }

  function getScrollTop() {
    return Number(
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      (document.body && document.body.scrollTop) ||
      0
    ) || 0;
  }

  function getPostFloorLabel(index) {
    return index === 0 ? '楼主' : 'B' + index + 'F';
  }

  function getPostAnchorHash(post) {
    if (!post) return '';
    var anchor =
      qs('[id^="td_"]', post) ||
      qs('[id^="read_"]', post) ||
      qs('[id^="p_"]', post) ||
      qs('a[id^="td_read_"]', post) ||
      qs('[id^="subject_"]', post) ||
      qs('a[name]:not([name="topic"]):not([name="avatar"])', post) ||
      qs('a[name]', post);
    if (!anchor) return '';
    var value = anchor.getAttribute('name') || anchor.id || '';
    return value ? ('#' + value) : '';
  }

  function getAbsoluteNodeTop(node) {
    if (!node || !node.getBoundingClientRect) return 0;
    var rect = node.getBoundingClientRect();
    return Math.max(0, Math.round(rect.top + getScrollTop()));
  }

  function getCurrentReadFloorRecord(posts) {
    var list = (posts || qsa('table.js-post'))
      .map(function toReadFloorItem(post, index) {
        return {
          floorIndex: index,
          floorLabel: getPostFloorLabel(index),
          floorHash: getPostAnchorHash(post),
          floorTop: getAbsoluteNodeTop(post),
        };
      })
      .filter(function keepReadFloorItem(item) {
        return !!item.floorLabel;
      });
    if (!list.length) return null;

    var targetTop = getScrollTop() + Math.max(80, Math.min((window.innerHeight || 0) * 0.35, 320));
    var current = list[0];
    list.forEach(function updateCurrentFloor(item) {
      if (item.floorTop <= targetTop) current = item;
    });

    var next = list[Math.min(list.length - 1, current.floorIndex + 1)] || current;
    return {
      floorIndex: current.floorIndex,
      floorLabel: current.floorLabel,
      floorHash: current.floorHash,
      floorTop: current.floorTop,
      nextFloorIndex: next.floorIndex,
      nextFloorLabel: next.floorLabel,
      nextFloorHash: next.floorHash,
      nextFloorTop: next.floorTop,
    };
  }

  function getReadScrollRatio() {
    var doc = document.documentElement;
    var body = document.body;
    var scrollHeight = Math.max(
      doc ? doc.scrollHeight : 0,
      body ? body.scrollHeight : 0
    );
    var viewportHeight = window.innerHeight || (doc && doc.clientHeight) || 0;
    var maxScroll = scrollHeight - viewportHeight;
    if (!(maxScroll > 0)) return 0;
    return clampRatio(getScrollTop() / maxScroll);
  }

  function buildReadProgressRecord(tid) {
    if (!tid) return null;
    var record = {
      title: getReadPageTitle(document),
      url: location.href.split('#')[0],
      page: currentPageNumber(location.href),
      scrollY: Math.max(0, Math.round(getScrollTop())),
      progress: getReadScrollRatio(),
      updatedAt: Date.now(),
    };
    var floorRecord = getCurrentReadFloorRecord();
    if (floorRecord) {
      record.floorIndex = floorRecord.floorIndex;
      record.floorLabel = floorRecord.floorLabel;
      record.floorHash = floorRecord.floorHash;
      record.floorTop = floorRecord.floorTop;
      record.nextFloorIndex = floorRecord.nextFloorIndex;
      record.nextFloorLabel = floorRecord.nextFloorLabel;
      record.nextFloorHash = floorRecord.nextFloorHash;
      record.nextFloorTop = floorRecord.nextFloorTop;
    }
    return record;
  }

  function saveReadProgressRecord(state, tid) {
    var record = buildReadProgressRecord(tid);
    if (!record) return null;
    state.progress = state.progress || {};
    state.progress[tid] = mergeReadProgressRecord(state.progress[tid], record);
    state.progress = pruneReadProgress(state.progress);
    saveReadProgress(state.progress);
    refreshWatchCenter();
    refreshHistoryCenter();
    return state.progress[tid];
  }

  function getReadProgressAnchorNode(hash) {
    var targetId = String(hash || '').replace(/^#/, '');
    if (!targetId) return null;
    return (
      document.getElementById(targetId) ||
      qsa('a[name]', document).filter(function matchAnchor(node) {
        return node.getAttribute('name') === targetId;
      })[0] ||
      null
    );
  }

  function restoreReadProgress(state, tid, mode) {
    var latestProgress = loadReadProgress();
    if (state && latestProgress) state.progress = latestProgress;
    var record = latestProgress && latestProgress[tid]
      ? latestProgress[tid]
      : (state && state.progress ? state.progress[tid] : null);
    if (!record) {
      clearReadProgressRestoreRequest(tid);
      return false;
    }
    clearReadProgressRestoreRequest(tid);
    var target = getReadProgressRestoreTarget(record, mode);
    window.setTimeout(function restoreScroll() {
      var top = Math.max(0, Number(target.top) || 0);
      var anchorNode = getReadProgressAnchorNode(target.hash);
      if (anchorNode && typeof anchorNode.scrollIntoView === 'function') {
        anchorNode.scrollIntoView({ block: 'start', behavior: 'smooth' });
      } else {
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
      window.setTimeout(function fallbackRestoreScroll() {
        if (Math.abs(getScrollTop() - top) <= 8) return;
        if (document.scrollingElement) document.scrollingElement.scrollTop = top;
        if (document.documentElement) document.documentElement.scrollTop = top;
        if (document.body) document.body.scrollTop = top;
      }, 260);
    }, 80);
    return true;
  }

  function restorePendingReadProgress(state, tid) {
    var request = getReadProgressRestoreRequest(tid);
    if (!request) return false;
    return restoreReadProgress(state, tid, request.mode);
  }

  function bindReadPageJumpButtons(state, tid) {
    if (!tid || !document.documentElement) return;
    if (document.documentElement.dataset.spxReadJumpTid === String(tid)) return;
    document.documentElement.dataset.spxReadJumpTid = String(tid);
    document.addEventListener('click', function handleReadJumpClick(event) {
      var target = event.target && event.target.closest
        ? event.target.closest('[data-spx-read-jump]')
        : null;
      if (!target) return;
      var targetTid = target.dataset.spxReadTid || tid;
      if (String(targetTid) !== String(tid)) return;
      event.preventDefault();
      restoreReadProgress(state, tid, target.dataset.spxReadJump);
    }, true);
  }

  function bindReadProgressTracking(state, tid) {
    if (!tid || !document.documentElement) return;
    if (document.documentElement.dataset.spxReadProgressTid === String(tid)) return;
    document.documentElement.dataset.spxReadProgressTid = String(tid);

    var saveTimer = null;
    function saveNow() {
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = null;
      saveReadProgressRecord(state, tid);
    }
    function scheduleSave() {
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(saveNow, 500);
    }

    window.addEventListener('scroll', scheduleSave, { passive: true });
    window.addEventListener('pagehide', saveNow);
    document.addEventListener('visibilitychange', function saveBeforeHidden() {
      if (document.visibilityState === 'hidden') saveNow();
    });
    window.setTimeout(saveNow, 700);
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
      setImportantStyle(node, 'height', '30px');
      setImportantStyle(node, 'overflow', 'visible');
    });
    qsa('#mainNav>div[style*="padding-left"]', scope).forEach(function resetNavMenuHost(node) {
      setImportantStyle(node, 'box-sizing', 'border-box');
      setImportantStyle(node, 'width', '100%');
      setImportantStyle(node, 'max-width', '100%');
      setImportantStyle(node, 'height', '30px');
      setImportantStyle(node, 'padding-left', '250px');
      setImportantStyle(node, 'overflow', 'visible');
    });
    qsa('#mainNav>div[style*="padding-left"] table,#mainNav>div[style*="padding-left"] tbody,#mainNav>div[style*="padding-left"] tr,#mainNav>div[style*="padding-left"] td', scope).forEach(function resetNavTableNode(node) {
      setImportantStyle(node, 'display', 'block');
      setImportantStyle(node, 'box-sizing', 'border-box');
      setImportantStyle(node, 'width', 'auto');
      setImportantStyle(node, 'height', '30px');
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
    var guide = qs('#guide', scope);

    function getNavUrlKey(href) {
      if (!href || /^javascript:/i.test(String(href))) return '';
      try {
        var parsed = new URL(href, location.href);
        return parsed.origin + parsed.pathname + parsed.search;
      } catch (error) {
        return '';
      }
    }

    function syncCurrentNavItem() {
      if (!guide) return;
      var currentUrl = new URL(location.href);
      var currentKey = currentUrl.origin + currentUrl.pathname + currentUrl.search;
      var discussionPage = /\/(?:thread|read|post|index)\.php$/i.test(currentUrl.pathname) || currentUrl.pathname === '/';
      var matched = null;

      qsa('li', guide).forEach(function resetNavItem(navItem) {
        navItem.classList.remove('spx-nav-current');
      });
      qsa('li>a', guide).forEach(function resetNavLink(link) {
        link.classList.remove('spx-nav-current');
        if (!matched && getNavUrlKey(link.getAttribute('href') || link.href) === currentKey) matched = link;
      });

      if (!matched && discussionPage) matched = qs('#h_index>a', guide);
      if (!matched && currentUrl.pathname === '/search.php') matched = qs('#h_search>a', guide);
      if (!matched) return;

      matched.classList.add('spx-nav-current');
      if (matched.parentElement) matched.parentElement.classList.add('spx-nav-current');
    }

    syncCurrentNavItem();

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

  function findAutoBuyTarget(root, pageUrl) {
    var scope = root || document;
    var controls = qsa(
      'input[onclick*="buytopic"],button[onclick*="buytopic"],a[href*="buytopic"]',
      scope
    );

    for (var index = 0; index < controls.length; index += 1) {
      var control = controls[index];
      var rawTarget = control.getAttribute('href') || control.getAttribute('onclick') || '';
      var url = extractBuyTopicUrl(rawTarget, pageUrl || location.href);
      if (!url) continue;

      var host = control.closest
        ? control.closest('h6.quote,.quote,.tpc_content,table.js-post')
        : control.parentNode;
      var price = parsePostPrice(host ? host.textContent : '');
      if (price === null) {
        var body = scope.body || scope.documentElement;
        price = parsePostPrice(body ? body.textContent : '');
      }
      if (price === null) continue;

      return {
        control: control,
        host: host || control.parentNode,
        price: price,
        url: url,
      };
    }

    return null;
  }

  function setAutoBuyStatus(target, message, isError) {
    var status = qs('#spx-auto-buy-status');
    if (!status) {
      status = createEl('div', 'spx-auto-buy-status');
      status.id = 'spx-auto-buy-status';
      var host = target && target.host;
      if (host && host.parentNode) {
        host.parentNode.insertBefore(status, host.nextSibling);
      } else {
        document.body.appendChild(status);
      }
    }
    status.textContent = message;
    status.classList.toggle('spx-error', !!isError);
  }

  function fetchCurrentUserSpBalance() {
    var url = new URL('/userpay.php', location.href).href;
    return window.fetch(url, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then(function readBalanceResponse(response) {
        if (!response.ok) throw new Error('读取 SP 余额失败');
        return response.text();
      })
      .then(function parseBalancePage(html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var balance = parseUserSpBalance(doc.body ? doc.body.textContent : '');
        if (balance === null) throw new Error('未识别到 SP 余额');
        return balance;
      });
  }

  function replaceReadPageContent(html, settings, state) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var currentContent = qs('#content') || qs('#main');
    var refreshedContent = qs('#content', doc) || qs('#main', doc);
    if (!currentContent || !refreshedContent) return false;

    currentContent.innerHTML = refreshedContent.innerHTML;
    enhanceAll(settings, state);
    return true;
  }

  function clearAutoBuyPageState(pageRoot) {
    if (!pageRoot) return;
    delete pageRoot.dataset.spxAutoBuyStatus;
    var status = qs('#spx-auto-buy-status');
    if (status) status.remove();
  }

  function createAutoBuyContext(settings) {
    var target = findAutoBuyTarget(document, location.href);
    var maxPrice = Number(settings.autoBuyMaxSp);
    if (!target || !(maxPrice > 0) || !(target.price < maxPrice)) return null;

    var attemptKey = getAutoBuyAttemptKey(target.url, location.href);
    var attempts = loadAutoBuyAttempts();
    return {
      pageRoot: document.documentElement,
      target: target,
      attemptKey: attemptKey,
      previousAttempt: attemptKey ? attempts[attemptKey] : null,
    };
  }

  function blockAutoBuyContext(context) {
    if (!context || !isAutoBuyAttemptBlocked(context.previousAttempt)) return false;
    context.pageRoot.dataset.spxAutoBuyStatus = 'blocked';
    setAutoBuyStatus(context.target, formatAutoBuyAttemptMessage(context.previousAttempt), true);
    return true;
  }

  function markAutoBuyChecking(context) {
    context.pageRoot.dataset.spxAutoBuyStatus = 'checking';
    recordAutoBuyAttempt(
      context.attemptKey,
      'checking',
      '正在检查账户 SP 余额',
      { price: context.target.price, url: context.target.url }
    );
    setAutoBuyStatus(context.target, '自动购买：正在检查账户 SP 余额…', false);
  }

  function skipAutoBuyContext(context, balance) {
    context.pageRoot.dataset.spxAutoBuyStatus = 'skipped';
    recordAutoBuyAttempt(
      context.attemptKey,
      'skipped',
      '余额 ' + balance + ' SP，帖子价格 ' + context.target.price + ' SP',
      { balance: balance, price: context.target.price, url: context.target.url }
    );
    setAutoBuyStatus(
      context.target,
      '自动购买未执行：当前余额 ' + balance + ' SP，帖子价格 ' + context.target.price + ' SP。',
      true
    );
    return null;
  }

  function requestAutoBuyPurchase(context, balance) {
    context.pageRoot.dataset.spxAutoBuyStatus = 'buying';
    recordAutoBuyAttempt(
      context.attemptKey,
      'buying',
      '已发起支付 ' + context.target.price + ' SP 的购买请求',
      { balance: balance, price: context.target.price, url: context.target.url }
    );
    context.target.control.disabled = true;
    context.target.control.setAttribute('aria-disabled', 'true');
    setAutoBuyStatus(
      context.target,
      '自动购买：正在支付 ' + context.target.price + ' SP 并加载帖子内容…',
      false
    );

    return window.fetch(context.target.url, {
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-store',
    }).then(function readPurchaseResponse(response) {
      if (!response.ok) throw new Error('购买请求失败');
      return response.text();
    });
  }

  function reloadAutoBuyThreadHtml(purchaseResult) {
    if (purchaseResult === null) return null;
    return window.fetch(location.href, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then(function readRefreshedThread(response) {
        if (!response.ok) throw new Error('重新加载帖子失败');
        return response.text();
      });
  }

  function applyAutoBuySuccess(context, settings, state, html) {
    if (!html) return;
    var refreshedDoc = new DOMParser().parseFromString(html, 'text/html');
    if (findAutoBuyTarget(refreshedDoc, location.href)) {
      throw new Error('购买后仍存在购买按钮');
    }
    if (!replaceReadPageContent(html, settings, state)) {
      throw new Error('无法更新帖子内容');
    }
    var resourceLinks = getJumpResourceLinks(extractReadPageResourceLinks(qsa('table.js-post'), location.href));
    var resourceSummary = formatResourceJumpSummary(resourceLinks);
    var savedResources = saveResourceLinksToLibrary(resourceLinks, state.resources, getCurrentResourceSourceMeta());
    state.resources = savedResources.resources;
    saveResourceLibrary(state.resources);
    refreshResourceCenter();
    showAutoBuyResourceJump(resourceLinks, state, savedResources.saved);
    context.pageRoot.dataset.spxAutoBuyStatus = 'done';
    recordAutoBuyAttempt(
      context.attemptKey,
      'done',
      '已支付 ' + context.target.price + ' SP 并加载帖子内容' + (resourceSummary ? '，识别资源：' + resourceSummary : ''),
      { price: context.target.price, url: context.target.url, resourceSummary: resourceSummary }
    );
  }

  function failAutoBuyContext(context, error) {
    var reason = error && error.message ? error.message : '未知错误';
    context.pageRoot.dataset.spxAutoBuyStatus = 'failed';
    context.target.control.disabled = false;
    context.target.control.removeAttribute('aria-disabled');
    recordAutoBuyAttempt(
      context.attemptKey,
      'failed',
      reason,
      { price: context.target.price, url: context.target.url }
    );
    setAutoBuyStatus(
      context.target,
      '自动购买失败：' + reason + '。已保留原购买按钮，请手动购买。',
      true
    );
  }

  function enhanceAutoBuyPost(settings, state) {
    if (detectPageType(location.href) !== 'read') return;

    var pageRoot = document.documentElement;
    if (!settings.autoBuyPost) {
      clearAutoBuyPageState(pageRoot);
      return;
    }
    if (pageRoot.dataset.spxAutoBuyStatus) return;

    var context = createAutoBuyContext(settings);
    if (!context) return;
    if (blockAutoBuyContext(context)) return;
    markAutoBuyChecking(context);

    fetchCurrentUserSpBalance()
      .then(function purchaseWhenAffordable(balance) {
        if (!shouldAutoBuyPost(settings, context.target.price, balance)) {
          return skipAutoBuyContext(context, balance);
        }
        return requestAutoBuyPurchase(context, balance);
      })
      .then(reloadAutoBuyThreadHtml)
      .then(function applyRefreshedThread(html) {
        applyAutoBuySuccess(context, settings, state, html);
      })
      .catch(function handleAutoBuyError(error) {
        failAutoBuyContext(context, error);
      });
  }

  function enhanceReadPage(settings, state) {
    if (detectPageType(location.href) !== 'read') return;
    var tid = parseThreadId(location.href);
    if (tid) {
      state.read[tid] = Date.now();
      saveMap(READ_KEY, state.read);
      restorePendingReadProgress(state, tid);
      bindReadProgressTracking(state, tid);
      bindReadPageJumpButtons(state, tid);
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
        var floor = createEl('span', '', getPostFloorLabel(index));
        var blockAuthor = createEl('button', '', '屏蔽此人');
        var copyLink = createEl('button', '', '复制链接');
        var extractResources = createEl('button', '', '资源');
        var jumpNextFloor = null;
        var jumpLastFloor = null;
        floor.style.marginRight = 'auto';
        extractResources.title = '提取本页资源链接，可按本楼、作者或类型复制';

        if (index === 0 && tid) {
          jumpNextFloor = createEl('button', '', '未读楼层');
          jumpLastFloor = createEl('button', '', '上次楼层');
          jumpNextFloor.title = '跳到上次未读位置';
          jumpLastFloor.title = '跳到上次读到的楼层';
          jumpNextFloor.dataset.spxReadJump = 'next';
          jumpNextFloor.dataset.spxReadTid = tid;
          jumpLastFloor.dataset.spxReadJump = 'last';
          jumpLastFloor.dataset.spxReadTid = tid;
        }

        blockAuthor.addEventListener('click', function addAuthorBlock() {
          if (!author) return;
          settings.authorKeywords = parseLineList(settings.authorKeywords.concat([author]).join('\n'));
          saveSettings(settings);
          enhanceAll(settings, state);
        });

        copyLink.addEventListener('click', function copyPostLink() {
          var hash = getPostAnchorHash(post);
          copyTextToClipboard(location.href.split('#')[0] + hash).catch(function noop() {});
        });

        extractResources.addEventListener('click', function openResources() {
          openResourcePanel(posts, index, author, { state: state });
        });

        tools.appendChild(floor);
        if (jumpNextFloor) tools.appendChild(jumpNextFloor);
        if (jumpLastFloor) tools.appendChild(jumpLastFloor);
        tools.appendChild(blockAuthor);
        tools.appendChild(copyLink);
        tools.appendChild(extractResources);
        toolsHost.insertBefore(tools, toolsHost.firstChild);
      }
    });

    cleanupReadSeparators();
    enhancePreviewGallery(settings, posts);
    if (settings.foldQuotes) foldLongReadBlocks();
    enhanceAutoBuyPost(settings, state);
  }

  function fallbackCopyText(value) {
    return new Promise(function copyWithSelection(resolve, reject) {
      if (!document.body || typeof document.execCommand !== 'function') {
        reject(new Error('当前浏览器不支持复制'));
        return;
      }
      var textarea = createEl('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', 'readonly');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.select();
      var copied = false;
      try {
        copied = document.execCommand('copy');
      } catch (error) {
        copied = false;
      }
      textarea.remove();
      if (copied) resolve();
      else reject(new Error('复制失败'));
    });
  }

  function copyTextToClipboard(value) {
    var text = String(value || '');
    if (!text) return Promise.reject(new Error('没有可复制的地址'));
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      return navigator.clipboard.writeText(text).catch(function fallbackClipboard() {
        return fallbackCopyText(text);
      });
    }
    return fallbackCopyText(text);
  }

  function formatResourceDownloadFileName(timestamp) {
    var rawTime = Number(timestamp);
    var date = new Date(isFinite(rawTime) ? rawTime : Date.now());
    var pad = function padDatePart(value) {
      return String(value).padStart(2, '0');
    };
    return [
      'southplus-resources-',
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      '-',
      pad(date.getHours()),
      pad(date.getMinutes()),
      '.txt',
    ].join('');
  }

  function downloadTextFile(filename, text) {
    if (
      typeof Blob === 'undefined' ||
      typeof URL === 'undefined' ||
      typeof URL.createObjectURL !== 'function' ||
      !document.body
    ) return false;
    var blob = new Blob([String(text || '')], { type: 'text/plain;charset=utf-8' });
    var href = URL.createObjectURL(blob);
    var link = createEl('a');
    link.href = href;
    link.download = filename || formatResourceDownloadFileName();
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function revokeObjectUrl() {
      URL.revokeObjectURL(href);
    }, 0);
    return true;
  }

  function exportResourceDownloadList(entries) {
    var text = formatResourceDownloadList(entries);
    if (!text) return false;
    return downloadTextFile(formatResourceDownloadFileName(), text);
  }

  function setTemporaryText(node, text, restoreText, delay) {
    if (!node) return;
    node.textContent = text;
    window.setTimeout(function restoreTextLater() {
      if (node.isConnected) node.textContent = restoreText;
    }, delay || 1400);
  }

  function closeResourcePanel() {
    var panel = qs('#spx-resource-panel');
    if (panel) panel.remove();
  }

  function closeAutoBuyResourceJump() {
    var panel = qs('#spx-auto-resource-jump');
    if (panel) panel.remove();
  }

  function mountAutoBuyResourceJump(panel) {
    if (!panel) return;
    var content = qs('#content') || qs('#main') || document.body;
    var firstPost = qsa('table.js-post', content)[0];
    if (firstPost && firstPost.parentNode) {
      firstPost.parentNode.insertBefore(panel, firstPost);
      return;
    }
    content.insertBefore(panel, content.firstChild);
  }

  function showAutoBuyResourceJump(links, state, savedCount) {
    var jumpLinks = getJumpResourceLinks(links);
    closeAutoBuyResourceJump();
    if (!jumpLinks.length || !document.body) return null;

    var panel = createEl('div', 'spx-auto-resource-jump');
    var title = createEl('strong', '', '购买完成，识别到资源：' + formatResourceJumpSummary(jumpLinks) + (savedCount ? ' · 已存资源库' : ''));
    var actions = createEl('div', 'spx-auto-resource-actions');
    var copyButton = createEl('button', '', '复制全部资源');
    var detailButton = createEl('button', '', '资源面板');
    var centerButton = createEl('button', '', '资源工作台');

    panel.id = 'spx-auto-resource-jump';
    copyButton.type = 'button';
    detailButton.type = 'button';
    centerButton.type = 'button';

    jumpLinks.slice(0, 8).forEach(function appendJumpLink(item, index) {
      var label = item.label || getResourceDisplayLabel(item);
      var link = createEl('a', '', label + (item.accessCode ? ' 提取码' : '') + ' #' + (index + 1));
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.title = item.url + (item.accessCode ? ' 提取码：' + item.accessCode : '');
      actions.appendChild(link);
    });

    copyButton.addEventListener('click', function copyAutoBuyResources() {
      copyButton.disabled = true;
      copyTextToClipboard(formatResourceLinks(jumpLinks)).then(
        function showCopySuccess() {
          copyButton.disabled = false;
          setTemporaryText(copyButton, '已复制 ' + jumpLinks.length + ' 条', '复制全部资源');
        },
        function showCopyFailure() {
          copyButton.disabled = false;
          setTemporaryText(copyButton, '复制失败', '复制全部资源');
        }
      );
    });
    detailButton.addEventListener('click', function openAllAutoBuyResources() {
      openResourcePanel(qsa('table.js-post'), 0, '', { defaultScope: 'all', state: state });
    });
    centerButton.addEventListener('click', function openAutoBuyResourceCenter() {
      var panel = createResourceCenterPanel(null, state || { resources: loadResourceLibrary() });
      if (panel.spxRender) panel.spxRender();
      setCenterPanelHidden(panel, false, '[data-spx-resource-center-button="1"]');
    });

    actions.appendChild(copyButton);
    actions.appendChild(detailButton);
    actions.appendChild(centerButton);
    panel.appendChild(title);
    panel.appendChild(actions);
    mountAutoBuyResourceJump(panel);
    return panel;
  }

  function openResourcePanel(posts, currentPostIndex, currentAuthor, options) {
    if (!document.body) return;
    var config = options || {};
    var allLinks = extractReadPageResourceLinks(posts, location.href);
    closeResourcePanel();

    var panel = createEl('div', 'spx-watch-center spx-resource-panel');
    panel.id = 'spx-resource-panel';
    var header = createEl('div', 'spx-watch-center-header');
    var title = createEl('h3', '', '资源链接');
    var summary = createEl('span', 'spx-watch-summary');
    var closeButton = createEl('button', '', '关闭');
    var controls = createEl('div', 'spx-watch-controls');
    var scopeSelect = createEl('select');
    var typeSelect = createEl('select');
    var list = createEl('div', 'spx-watch-list');
    var copyButton = createEl('button', '', '复制当前');
    var saveButton = createEl('button', '', '保存当前');
    var visibleLinks = [];

    closeButton.type = 'button';
    closeButton.addEventListener('click', closeResourcePanel);
    header.appendChild(title);
    header.appendChild(summary);
    header.appendChild(closeButton);

    [
      { value: 'all', text: '全部楼层' },
      { value: 'floor', text: '仅本楼' },
      { value: 'author', text: currentAuthor ? '仅此作者' : '仅此作者' },
    ].forEach(function appendScopeOption(option) {
      var item = createEl('option', '', option.text);
      item.value = option.value;
      if (option.value === (config.defaultScope || 'floor')) item.selected = true;
      if (option.value === 'author' && !currentAuthor) item.disabled = true;
      scopeSelect.appendChild(item);
    });

    [
      { value: 'all', text: '全部类型' },
      { value: 'magnet', text: '磁力' },
      { value: 'ed2k', text: '电驴' },
      { value: 'torrent', text: '种子' },
      { value: 'archive', text: '压缩包' },
      { value: 'cloud', text: '网盘' },
      { value: 'image', text: '图片' },
      { value: 'external', text: '外链' },
    ].forEach(function appendTypeOption(option) {
      var item = createEl('option', '', option.text);
      item.value = option.value;
      if (option.value === config.defaultCategory) item.selected = true;
      typeSelect.appendChild(item);
    });

    controls.appendChild(scopeSelect);
    controls.appendChild(typeSelect);
    controls.appendChild(copyButton);
    controls.appendChild(saveButton);

    function renderLinks() {
      visibleLinks = filterResourceLinks(allLinks, {
        scope: scopeSelect.value,
        category: typeSelect.value,
        postIndex: currentPostIndex,
        author: currentAuthor,
      });
      list.textContent = '';
      summary.textContent = '当前 ' + visibleLinks.length + ' / 全部 ' + allLinks.length + ' 条';
      copyButton.disabled = !visibleLinks.length;
      saveButton.disabled = !getJumpResourceLinks(visibleLinks).length;

      if (!visibleLinks.length) {
        list.appendChild(createEl('div', 'spx-watch-empty', '没有匹配的资源链接。'));
        return;
      }

      visibleLinks.forEach(function appendResourceLink(item) {
        var row = createEl('div', 'spx-watch-item');
        var meta = createEl(
          'div',
          'spx-watch-meta',
          '[' + (item.label || getResourceDisplayLabel(item)) + '] ' +
            [item.floorLabel, item.author].filter(Boolean).join(' · ')
        );
        var link = createEl('a', 'spx-resource-url', item.url);
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noreferrer';
        row.appendChild(meta);
        if (item.accessCode) {
          row.appendChild(createEl('div', 'spx-watch-meta', '提取码：' + item.accessCode));
        }
        row.appendChild(link);
        list.appendChild(row);
      });
    }

    scopeSelect.addEventListener('change', renderLinks);
    typeSelect.addEventListener('change', renderLinks);
    copyButton.addEventListener('click', function copyVisibleResourceLinks() {
      copyButton.disabled = true;
      copyTextToClipboard(formatResourceLinks(visibleLinks)).then(
        function showCopySuccess() {
          copyButton.disabled = false;
          setTemporaryText(copyButton, '已复制 ' + visibleLinks.length + ' 条', '复制当前');
        },
        function showCopyFailure() {
          copyButton.disabled = false;
          setTemporaryText(copyButton, '复制失败', '复制当前');
        }
      );
    });
    saveButton.addEventListener('click', function saveVisibleResourceLinks() {
      var targetState = config.state;
      if (!targetState) {
        setTemporaryText(saveButton, '无法保存', '保存当前');
        return;
      }
      var savedResources = saveResourceLinksToLibrary(visibleLinks, targetState.resources, getCurrentResourceSourceMeta());
      targetState.resources = savedResources.resources;
      saveResourceLibrary(targetState.resources);
      refreshResourceCenter();
      setTemporaryText(saveButton, savedResources.saved ? ('已保存 ' + savedResources.saved + ' 条') : '无可保存资源', '保存当前');
    });

    panel.appendChild(header);
    panel.appendChild(controls);
    panel.appendChild(list);
    document.body.appendChild(panel);
    renderLinks();
  }

  function closePreviewLightbox() {
    var lightbox = qs('#spx-preview-lightbox');
    if (!lightbox) return;
    if (typeof lightbox.spxClose === 'function') {
      lightbox.spxClose();
      return;
    }
    lightbox.remove();
  }

  function openPreviewLightbox(items, initialIndex) {
    var images = (items || []).filter(function hasPreviewSource(item) {
      return item && item.src;
    });
    if (!images.length || typeof document === 'undefined' || !document.body) return;

    closePreviewLightbox();

    var currentIndex = Math.min(
      images.length - 1,
      Math.max(0, Number(initialIndex) || 0)
    );
    var zoom = 1;
    var previousBodyOverflow = document.body.style.overflow || '';
    var copyStatusTimer = null;
    var closed = false;

    var lightbox = createEl('div', 'spx-preview-lightbox');
    lightbox.id = 'spx-preview-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', '预览图灯箱');

    var shell = createEl('div', 'spx-preview-lightbox-shell');
    var toolbar = createEl('div', 'spx-preview-lightbox-toolbar');
    var counter = createEl('span', 'spx-preview-lightbox-counter');
    var actions = createEl('div', 'spx-preview-lightbox-actions');
    var stage = createEl('div', 'spx-preview-lightbox-stage');
    var viewport = createEl('div', 'spx-preview-lightbox-viewport');
    var canvas = createEl('div', 'spx-preview-lightbox-canvas');
    var image = createEl('img', 'spx-preview-lightbox-image');
    var caption = createEl('div', 'spx-preview-lightbox-caption');
    var urlText = createEl('span', 'spx-preview-lightbox-url');
    var help = createEl(
      'span',
      'spx-preview-lightbox-help',
      '←/→ 切图 · +/- 缩放 · 0 重置 · Esc 关闭'
    );

    function createActionButton(text, title, className, onClick) {
      var button = createEl('button', className || '', text);
      button.type = 'button';
      button.title = title;
      button.addEventListener('click', onClick);
      return button;
    }

    var zoomOutButton = createActionButton('−', '缩小（快捷键 -）', '', function zoomOut() {
      setZoom(zoom - 0.25);
    });
    var zoomText = createEl('span', 'spx-preview-lightbox-zoom', '100%');
    var zoomInButton = createActionButton('+', '放大（快捷键 +）', '', function zoomIn() {
      setZoom(zoom + 0.25);
    });
    var resetButton = createActionButton('重置', '恢复适应窗口大小（快捷键 0）', '', function resetZoom() {
      setZoom(1);
    });
    var copyButton = createActionButton('复制地址', '复制当前原图地址', '', function copyUrl() {
      copyButton.disabled = true;
      copyTextToClipboard(images[currentIndex].src).then(
        function showCopySuccess() {
          copyButton.textContent = '已复制';
          copyButton.disabled = false;
          clearTimeout(copyStatusTimer);
          copyStatusTimer = setTimeout(function restoreCopyButton() {
            if (copyButton.isConnected) copyButton.textContent = '复制地址';
          }, 1400);
        },
        function showCopyFailure() {
          copyButton.textContent = '复制失败';
          copyButton.disabled = false;
          clearTimeout(copyStatusTimer);
          copyStatusTimer = setTimeout(function restoreCopyButton() {
            if (copyButton.isConnected) copyButton.textContent = '复制地址';
          }, 1400);
        }
      );
    });
    var closeButton = createActionButton('关闭', '关闭灯箱（快捷键 Esc）', '', close);
    var previousButton = createActionButton(
      '‹',
      '上一张（快捷键 ←）',
      'spx-preview-lightbox-nav spx-preview-lightbox-prev',
      function showPrevious() {
        showImage(currentIndex - 1);
      }
    );
    var nextButton = createActionButton(
      '›',
      '下一张（快捷键 →）',
      'spx-preview-lightbox-nav spx-preview-lightbox-next',
      function showNext() {
        showImage(currentIndex + 1);
      }
    );

    function applyImageSize() {
      var naturalWidth = Number(image.naturalWidth || images[currentIndex].naturalWidth || 0);
      var naturalHeight = Number(image.naturalHeight || images[currentIndex].naturalHeight || 0);
      if (!naturalWidth || !naturalHeight || !viewport.clientWidth || !viewport.clientHeight) return;

      var sidePadding = window.innerWidth <= 760 ? 104 : 172;
      var verticalPadding = window.innerWidth <= 760 ? 52 : 76;
      var availableWidth = Math.max(120, viewport.clientWidth - sidePadding);
      var availableHeight = Math.max(120, viewport.clientHeight - verticalPadding);
      var fitScale = Math.min(
        availableWidth / naturalWidth,
        availableHeight / naturalHeight,
        1
      );
      var displayWidth = Math.max(1, Math.round(naturalWidth * fitScale * zoom));
      var displayHeight = Math.max(1, Math.round(naturalHeight * fitScale * zoom));
      var canvasPadding = window.innerWidth <= 760 ? 100 : 156;

      image.style.width = displayWidth + 'px';
      image.style.height = displayHeight + 'px';
      canvas.style.width = Math.max(viewport.clientWidth, displayWidth + canvasPadding) + 'px';
      canvas.style.height = Math.max(viewport.clientHeight, displayHeight + 72) + 'px';

      window.requestAnimationFrame(function centerZoomedImage() {
        viewport.scrollLeft = Math.max(0, (canvas.scrollWidth - viewport.clientWidth) / 2);
        viewport.scrollTop = Math.max(0, (canvas.scrollHeight - viewport.clientHeight) / 2);
      });
    }

    function setZoom(nextZoom) {
      zoom = clampPreviewZoom(nextZoom);
      zoomText.textContent = Math.round(zoom * 100) + '%';
      applyImageSize();
    }

    function showImage(nextIndex) {
      currentIndex = (nextIndex + images.length) % images.length;
      zoom = 1;
      zoomText.textContent = '100%';
      counter.textContent = '图片 ' + (currentIndex + 1) + ' / ' + images.length;
      urlText.textContent = images[currentIndex].src;
      urlText.title = images[currentIndex].src;
      copyButton.textContent = '复制地址';
      image.alt = '预览图 ' + (currentIndex + 1);
      image.onload = applyImageSize;
      image.onerror = function showImageError() {
        urlText.textContent = '原图加载失败：' + images[currentIndex].src;
      };
      image.src = images[currentIndex].src;
      if (image.complete && image.naturalWidth) applyImageSize();
    }

    function handleKeydown(event) {
      var action = getPreviewLightboxKeyAction(event);
      if (!action) return;
      event.preventDefault();
      if (action === 'close') close();
      else if (action === 'previous') showImage(currentIndex - 1);
      else if (action === 'next') showImage(currentIndex + 1);
      else if (action === 'zoomIn') setZoom(zoom + 0.25);
      else if (action === 'zoomOut') setZoom(zoom - 0.25);
      else if (action === 'zoomReset') setZoom(1);
    }

    function handleResize() {
      applyImageSize();
    }

    function close() {
      if (closed) return;
      closed = true;
      clearTimeout(copyStatusTimer);
      document.removeEventListener('keydown', handleKeydown, true);
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = previousBodyOverflow;
      lightbox.remove();
    }

    lightbox.spxClose = close;
    lightbox.addEventListener('click', function closeFromBackdrop(event) {
      if (event.target === lightbox) close();
    });

    actions.appendChild(zoomOutButton);
    actions.appendChild(zoomText);
    actions.appendChild(zoomInButton);
    actions.appendChild(resetButton);
    actions.appendChild(copyButton);
    actions.appendChild(closeButton);
    toolbar.appendChild(counter);
    toolbar.appendChild(actions);
    canvas.appendChild(image);
    viewport.appendChild(canvas);
    stage.appendChild(viewport);
    stage.appendChild(previousButton);
    stage.appendChild(nextButton);
    caption.appendChild(urlText);
    caption.appendChild(help);
    shell.appendChild(toolbar);
    shell.appendChild(stage);
    shell.appendChild(caption);
    lightbox.appendChild(shell);
    document.body.appendChild(lightbox);

    previousButton.hidden = images.length < 2;
    nextButton.hidden = images.length < 2;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeydown, true);
    window.addEventListener('resize', handleResize);
    showImage(currentIndex);
    closeButton.focus();
  }

  function enhancePreviewGallery(settings, posts) {
    restorePreviewGallery();
    if (!settings.unifiedPreviewGallery || !posts || !posts.length) return;

    var firstPost = posts[0];
    var content = qs('.tpc_content', firstPost);
    if (!content) return;

    var previewImages = [];
    posts.forEach(function collectPostImages(post, postIndex) {
      var postContent = qs('.tpc_content', post);
      if (!postContent) return;
      qsa('img', postContent).forEach(function collectImage(img) {
        var item = {
          node: img,
          src: img.currentSrc || img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          width: img.width,
          height: img.height,
          className: img.className,
          alt: img.alt,
          postIndex: postIndex,
        };
        if (isPreviewImageCandidate(item)) previewImages.push(item);
      });
    });

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
    var title = createEl('strong', '', '预览图');
    var summary = createEl('span', 'spx-preview-summary');
    var actions = createEl('div', 'spx-preview-actions');
    var copyAllButton = createEl('button', '', '复制全部链接');
    var largeOnlyButton = createEl('button', '', '只看大图');
    var grid = createEl('div', 'spx-preview-grid');
    var loadMoreButton = createEl('button', 'spx-preview-load-more', '加载更多图片');
    var showLargeOnly = false;
    var visiblePreviewImages = previewImages.slice();
    var renderedPreviewLimit = PREVIEW_GALLERY_BATCH_SIZE;
    var copyAllTimer = null;

    copyAllButton.type = 'button';
    largeOnlyButton.type = 'button';
    loadMoreButton.type = 'button';
    copyAllButton.title = '复制当前筛选范围内的全部原图地址';
    largeOnlyButton.title = '只显示尺寸较大的预览图';
    loadMoreButton.title = '继续加载下一批预览图';
    largeOnlyButton.setAttribute('aria-pressed', 'false');

    function setPreviewButtonText(button, text, delay) {
      clearTimeout(copyAllTimer);
      button.textContent = text;
      copyAllTimer = setTimeout(function restorePreviewButtonText() {
        if (button.isConnected) button.textContent = '复制全部链接';
      }, delay || 1400);
    }

    function syncPreviewHeader() {
      var largeCount = previewImages.filter(isLargePreviewImage).length;
      var renderState = getPreviewGalleryRenderState(visiblePreviewImages.length, renderedPreviewLimit);
      summary.textContent = formatPreviewGallerySummary(
        previewImages.length,
        visiblePreviewImages.length,
        renderState.rendered,
        showLargeOnly
      );
      largeOnlyButton.hidden = largeCount === previewImages.length;
      largeOnlyButton.setAttribute('aria-pressed', showLargeOnly ? 'true' : 'false');
      copyAllButton.disabled = !visiblePreviewImages.length;
      loadMoreButton.hidden = !renderState.hasMore;
      loadMoreButton.textContent = '加载更多图片（' + renderState.rendered + ' / ' + renderState.total + '）';
    }

    function renderPreviewGrid() {
      visiblePreviewImages = showLargeOnly ? previewImages.filter(isLargePreviewImage) : previewImages.slice();
      grid.textContent = '';
      var renderState = getPreviewGalleryRenderState(visiblePreviewImages.length, renderedPreviewLimit);
      var renderedImages = visiblePreviewImages.slice(0, renderState.rendered);
      syncPreviewHeader();

      if (!visiblePreviewImages.length) {
        grid.appendChild(createEl('div', 'spx-preview-empty', '当前页没有符合条件的大图'));
        return;
      }

      renderedImages.forEach(function appendPreview(item, index) {
        var link = createEl('a', 'spx-preview-item');
        link.href = item.src;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.title = '在灯箱中查看第 ' + (index + 1) + ' 张图';
        link.addEventListener('click', function openLightbox(event) {
          if (
            event.button > 0 ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
          ) {
            return;
          }
          event.preventDefault();
          openPreviewLightbox(visiblePreviewImages, index);
        });

        var thumb = createEl('img');
        thumb.src = item.src;
        thumb.loading = 'lazy';
        thumb.decoding = 'async';
        thumb.alt = '预览图 ' + (index + 1);

        var hoverImage = createEl('img', 'spx-preview-hover-image');
        hoverImage.loading = 'lazy';
        hoverImage.decoding = 'async';
        hoverImage.dataset.src = item.src;
        hoverImage.alt = '预览图 ' + (index + 1) + ' 放大预览';
        function loadHoverImage() {
          if (!hoverImage.src) hoverImage.src = hoverImage.dataset.src || item.src;
        }
        link.addEventListener('mouseenter', loadHoverImage);
        link.addEventListener('focus', loadHoverImage);

        var label = createEl('span', '', '图 ' + (index + 1));
        link.appendChild(thumb);
        link.appendChild(hoverImage);
        link.appendChild(label);
        grid.appendChild(link);
      });
    }

    function loadNextPreviewBatch() {
      var renderState = getPreviewGalleryRenderState(visiblePreviewImages.length, renderedPreviewLimit);
      if (!renderState.hasMore) return;
      renderedPreviewLimit = renderState.nextLimit;
      renderPreviewGrid();
    }

    function handlePreviewPanelScroll() {
      if (loadMoreButton.hidden) return;
      if (panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 160) loadNextPreviewBatch();
    }

    copyAllButton.addEventListener('click', function copyAllPreviewLinks() {
      var links = formatPreviewImageLinks(visiblePreviewImages);
      copyAllButton.disabled = true;
      copyTextToClipboard(links).then(
        function showCopyAllSuccess() {
          copyAllButton.disabled = false;
          setPreviewButtonText(copyAllButton, '已复制 ' + visiblePreviewImages.length + ' 条');
        },
        function showCopyAllFailure() {
          copyAllButton.disabled = false;
          setPreviewButtonText(copyAllButton, '复制失败');
        }
      );
    });

    largeOnlyButton.addEventListener('click', function toggleLargeOnly() {
      showLargeOnly = !showLargeOnly;
      renderedPreviewLimit = PREVIEW_GALLERY_BATCH_SIZE;
      renderPreviewGrid();
    });
    loadMoreButton.addEventListener('click', loadNextPreviewBatch);
    panel.addEventListener('scroll', handlePreviewPanelScroll);

    actions.appendChild(copyAllButton);
    actions.appendChild(largeOnlyButton);
    header.appendChild(title);
    header.appendChild(summary);
    header.appendChild(actions);
    panel.appendChild(header);
    panel.appendChild(grid);
    panel.appendChild(loadMoreButton);
    renderPreviewGrid();

    mountPreviewPanel(firstPost, content, panel);
  }

  function restorePreviewGallery() {
    closePreviewLightbox();
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

  function createQuickReplyRequest(form, submitter, pageUrl, FormDataCtor) {
    if (!form || typeof FormDataCtor !== 'function') return null;
    if (String(form.method || '').toUpperCase() !== 'POST') return null;

    var body;
    var url;
    try {
      body = new FormDataCtor(form);
      var formAction = typeof form.getAttribute === 'function'
        ? form.getAttribute('action')
        : form.action;
      url = new URL(formAction || '', pageUrl).href;
    } catch (error) {
      return null;
    }
    if (!body || typeof body.has !== 'function' || typeof body.append !== 'function') return null;

    if (submitter && submitter.name && !body.has(submitter.name)) {
      body.append(submitter.name, submitter.value == null ? '' : submitter.value);
    }

    return {
      url: url,
      options: {
        method: 'POST',
        body: body,
        credentials: 'include',
        redirect: 'follow',
        cache: 'no-store',
      },
    };
  }

  function performQuickReplySubmit(options) {
    if (
      !options ||
      !options.request ||
      typeof options.fetch !== 'function' ||
      typeof options.applyHtml !== 'function'
    ) {
      return Promise.resolve(false);
    }

    var setPending = typeof options.setPending === 'function' ? options.setPending : function noop() {};
    var onError = typeof options.onError === 'function' ? options.onError : null;
    var shouldResetPending = false;

    function reportQuickReplyError(error) {
      if (!onError) return;
      try {
        onError(error);
      } catch (onErrorFailure) {}
    }

    return Promise.resolve()
      .then(function startQuickReplySubmit() {
        if (typeof options.isPending === 'function' && options.isPending()) return false;

        shouldResetPending = true;
        setPending(true);

        return Promise.resolve()
          .then(function submitReply() {
            return options.fetch(options.request.url, options.request.options);
          })
          .then(function checkSubmitResponse(response) {
            if (!response || response.ok !== true) throw new Error('快捷回复提交失败');
            return options.fetch(options.pageUrl, {
              credentials: 'include',
              cache: 'no-store',
            });
          })
          .then(function checkReloadResponse(response) {
            if (!response || response.ok !== true) throw new Error('重新加载帖子失败');
            return response.text();
          })
          .then(function applyReloadedHtml(html) {
            if (options.applyHtml(html) === false) throw new Error('无法更新帖子内容');
            return true;
          });
      })
      .catch(function handleQuickReplyError(error) {
        reportQuickReplyError(error);
        return false;
      })
      .then(function finishQuickReply(result) {
        if (!shouldResetPending) return result;
        try {
          setPending(false);
        } catch (error) {
          reportQuickReplyError(error);
          return false;
        }
        return result;
      });
  }

  function submitQuickReplyNative(editor) {
    if (!editor) return false;
    var form = editor.closest && editor.closest('form');
    if (form) {
      var submitter = getQuickReplySubmitter(form);
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

  function isQuickReplySubmitter(node) {
    if (!node || !node.tagName) return false;
    var tag = String(node.tagName || '').toUpperCase();
    var type = String(node.getAttribute && node.getAttribute('type') || '').toLowerCase();
    if (tag === 'BUTTON') return !type || type === 'submit';
    if (tag === 'INPUT') return type === 'submit' || type === 'image';
    return false;
  }

  function getQuickReplySubmitter(form, preferred) {
    if (!form) return null;
    if (preferred && isQuickReplySubmitter(preferred)) return preferred;
    if (form.spxQuickReplySubmitter && isQuickReplySubmitter(form.spxQuickReplySubmitter)) {
      return form.spxQuickReplySubmitter;
    }
    return (
      qs('input[type="submit"]', form) ||
      qs('button[type="submit"]', form) ||
      qs('button:not([type])', form) ||
      qs('input[name="submit"]', form) ||
      qs('button[name="submit"]', form)
    );
  }

  function getQuickReplyClickedSubmitter(target, form) {
    if (!target || !form) return null;
    var node = target.closest ? target.closest('input,button') : target;
    if (!node || (typeof form.contains === 'function' && !form.contains(node))) return null;
    return isQuickReplySubmitter(node) ? node : null;
  }

  function setQuickReplyPanelPending(panel, pending) {
    if (!panel) return;
    if (pending) {
      panel.dataset.spxQuickReplyPending = '1';
    } else {
      delete panel.dataset.spxQuickReplyPending;
    }
    qsa('button', panel).forEach(function toggleQuickReplyButton(button) {
      button.disabled = !!pending;
    });

    var status = qs('.spx-quick-reply-status', panel);
    if (pending && status) {
      status.classList.remove('spx-error');
      status.textContent = '正在提交并更新帖子…';
    }
  }

  function setQuickReplyFormPending(form, pending) {
    if (!form || !form.dataset) return;
    if (pending) {
      form.dataset.spxQuickReplyPending = '1';
    } else {
      delete form.dataset.spxQuickReplyPending;
    }
    qsa('input[type="submit"],button[type="submit"],button:not([type])', form)
      .forEach(function toggleFormSubmit(submitter) {
        submitter.disabled = !!pending;
      });
  }

  function setQuickReplyPending(form, panel, pending) {
    setQuickReplyFormPending(form, pending);
    setQuickReplyPanelPending(panel, pending);
  }

  function setQuickReplyPanelError(panel) {
    if (!panel) return;
    var status = qs('.spx-quick-reply-status', panel);
    if (!status) return;
    status.classList.add('spx-error');
    status.textContent = '提交失败，内容已保留，请重试。';
  }

  function submitQuickReplyAjax(editor, form, submitter, settings, state, panel) {
    if (!editor || !form) return false;
    var fetchImpl = typeof window !== 'undefined' && typeof window.fetch === 'function'
      ? window.fetch.bind(window)
      : null;
    var FormDataCtor = typeof FormData === 'function' ? FormData : null;
    var request = createQuickReplyRequest(
      form,
      submitter,
      location.href,
      FormDataCtor
    );

    if (!request || !fetchImpl || detectPageType(location.href) !== 'read') {
      return false;
    }

    return performQuickReplySubmit({
      request: request,
      pageUrl: location.href,
      fetch: fetchImpl,
      isPending: function isPending() {
        return !!(
          (panel && panel.dataset.spxQuickReplyPending === '1') ||
          (form.dataset && form.dataset.spxQuickReplyPending === '1')
        );
      },
      setPending: function setPending(pending) {
        setQuickReplyPending(form, panel, pending);
      },
      applyHtml: function applyHtml(html) {
        return replaceReadPageContent(html, settings, state);
      },
      onError: function onError() {
        setQuickReplyPanelError(panel);
      },
    });
  }

  function submitQuickReply(editor, settings, state, submitter) {
    if (!editor) return false;
    var form = editor.closest && editor.closest('form');
    var panel = qs('#spx-quick-reply');
    var ajaxResult = submitQuickReplyAjax(
      editor,
      form,
      getQuickReplySubmitter(form, submitter),
      settings,
      state,
      panel
    );
    if (ajaxResult === false) return submitQuickReplyNative(editor);
    return ajaxResult;
  }

  function bindQuickReplyFormSubmit(editor, settings, state, panel) {
    if (!editor || !editor.closest) return false;
    var form = editor.closest('form');
    if (!form || form.dataset.spxQuickReplySubmitBound === '1') return false;
    form.dataset.spxQuickReplySubmitBound = '1';

    form.addEventListener('click', function rememberQuickReplySubmitter(event) {
      var submitter = getQuickReplyClickedSubmitter(event.target, form);
      if (submitter) form.spxQuickReplySubmitter = submitter;
    }, true);

    form.addEventListener('submit', function handleQuickReplySubmit(event) {
      var submitter = getQuickReplySubmitter(form, event && event.submitter);
      var currentPanel = qs('#spx-quick-reply') || panel;
      var ajaxResult = submitQuickReplyAjax(editor, form, submitter, settings, state, currentPanel);
      if (ajaxResult === false) return;
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
    });
    return true;
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

  function createQuickReplyPanel(settings, editor, state) {
    var replies = parseQuickReplyList((settings && settings.quickReplies || []).join('\n'));
    if (!editor || !replies.length) return null;

    var panel = createEl('div', 'spx-quick-reply');
    panel.id = 'spx-quick-reply';
    var header = createEl('div', 'spx-quick-reply-header');
    header.appendChild(createEl('strong', '', '快捷回复'));
    header.appendChild(createEl(
      'span',
      'spx-quick-reply-status',
      '快捷语句或提交按钮都会无刷新展示'
    ));
    var list = createEl('div', 'spx-quick-reply-list');

    replies.forEach(function appendReply(reply) {
      var button = createEl('button', '', reply);
      button.type = 'button';
      button.title = '填入并提交回复：' + reply;
      button.addEventListener('click', function useQuickReply() {
        if (insertTextIntoEditor(editor, reply)) {
          submitQuickReply(editor, settings, state);
        }
      });
      list.appendChild(button);
    });

    panel.appendChild(header);
    panel.appendChild(list);
    return panel;
  }

  function enhanceQuickReply(settings, state) {
    if (detectPageType(location.href) !== 'read' && detectPageType(location.href) !== 'post') return;
    var oldPanel = qs('#spx-quick-reply');
    if (oldPanel) oldPanel.remove();

    var editor = getQuickReplyEditor(document);
    var panel = createQuickReplyPanel(settings, editor, state);
    bindQuickReplyFormSubmit(editor, settings, state, panel);
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
      cleanMode: '清爽模式',
      readerMode: '阅读排版优化',
      immersiveRead: '帖子页沉浸全屏',
      unifiedPreviewGallery: '预览图集中显示',
      compactRead: '阅读页紧凑',
      foldQuotes: '折叠长引用',
      hideUserProfile: '隐藏头像资料',
      autoBuyPost: '自动购买低价帖子',
      unreadOnly: '列表只看未读',
      onlyOriginalAuthor: '阅读页只看楼主',
    };
    var settingKeys = getSettingsPanelKeys(location.href, document);
    var settingControls = settingKeys.map(function renderSetting(key) {
      return '<label><input type="checkbox" data-key="' + key + '"> ' + settingLabels[key] + '</label>';
    });
    var autoBuyControls = settingKeys.indexOf('autoBuyPost') !== -1 ? [
      '<label class="spx-number-setting"><span>自动购买价格上限</span><span><input type="number" min="0" step="1" data-number="autoBuyMaxSp"> SP</span></label>',
      '<div class="spx-help">仅当帖子价格严格小于该值、账户 SP 足够且页面存在购买按钮时自动购买；默认关闭。</div>',
    ] : [];

    panel = createEl('div', 'spx-settings');
    panel.id = 'spx-settings';
    panel.hidden = true;
    panel.innerHTML = [
      '<h3>South Plus 增强设置</h3>',
    ].concat(settingControls, autoBuyControls, [
      '<div>标题屏蔽关键词，每行一个</div>',
      '<textarea data-list="titleKeywords"></textarea>',
      '<div>作者屏蔽关键词，每行一个</div>',
      '<textarea data-list="authorKeywords"></textarea>',
      '<div>快捷回复语句，每行一个</div>',
      '<div class="spx-help">帖子详情页或回复页会显示为快捷按钮；快捷语句和帖子页原生提交按钮都会无刷新展示新回复。</div>',
      '<textarea data-list="quickReplies"></textarea>',
      '<div class="spx-row">',
      '<button class="spx-primary" data-action="save">保存</button>',
      '<button data-action="export-backup">导出备份</button>',
      '<button data-action="import-backup">导入备份</button>',
      '<button data-action="show-data-health">数据健康</button>',
      '<button data-action="show-storage-usage">本地体积</button>',
      '<button data-action="clear-read">清空已读</button>',
      '<button data-action="clear-progress">清空进度</button>',
      settingKeys.indexOf('autoBuyPost') !== -1 ? '<button data-action="clear-auto-buy">清空自动购买记录</button>' : '',
      '<button data-action="close">关闭</button>',
      '</div>',
      '<div class="spx-data-health" data-role="data-health" hidden></div>',
      '<input type="file" accept="application/json,.json" data-action="import-backup-file" hidden>',
    ]).join('');
    document.body.appendChild(panel);

    function setTemporaryButtonText(button, text) {
      if (!button) return;
      var previous = button.dataset.spxOriginalText || button.textContent;
      button.dataset.spxOriginalText = previous;
      button.textContent = text;
      window.setTimeout(function restoreButtonText() {
        button.textContent = button.dataset.spxOriginalText || previous;
        delete button.dataset.spxOriginalText;
      }, 1800);
    }

    function syncForm() {
      qsa('input[data-key]', panel).forEach(function syncCheckbox(input) {
        input.checked = !!settings[input.dataset.key];
      });
      qsa('textarea[data-list]', panel).forEach(function syncList(textarea) {
        textarea.value = (settings[textarea.dataset.list] || []).join('\n');
      });
      qsa('input[data-number]', panel).forEach(function syncNumber(input) {
        input.value = String(Number(settings[input.dataset.number]) || 0);
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
      qsa('input[data-number]', panel).forEach(function readNumber(input) {
        settings[input.dataset.number] = Math.max(0, Number(input.value) || 0);
      });
      delete document.documentElement.dataset.spxAutoBuyStatus;
      var autoBuyStatus = qs('#spx-auto-buy-status');
      if (autoBuyStatus) autoBuyStatus.remove();
      saveSettings(settings);
      enhanceAll(settings, state);
    }

    function getCurrentDataHealthPayload() {
      return {
        settings: settings,
        read: state && state.read,
        watch: state && state.watch,
        progress: state && state.progress,
        autoBuyAttempts: loadAutoBuyAttempts(),
        resources: state && state.resources,
      };
    }

    function appendStorageUsageDetails(box, storageReport) {
      box.appendChild(createEl('strong', '', '本地数据体积'));
      box.appendChild(createEl('div', 'spx-help', formatStorageUsageSummary(storageReport)));
      var usageList = createEl('div', 'spx-storage-usage');
      storageReport.entries.forEach(function appendStorageEntry(entry) {
        var row = createEl('div', 'spx-storage-usage-row spx-storage-' + getStorageUsageLevel(entry));
        var main = createEl('span', 'spx-storage-usage-main');
        main.appendChild(createEl('b', '', entry.label));
        main.appendChild(createEl('em', '', entry.key));
        row.appendChild(main);
        row.appendChild(createEl('span', 'spx-storage-usage-meta', entry.size + ' · ' + formatStorageUsageLimit(entry)));
        usageList.appendChild(row);
      });
      box.appendChild(usageList);
      box.appendChild(createEl('div', 'spx-storage-suggestions', '清理建议：' + formatStorageUsageWarnings(storageReport)));
    }

    function appendDataHealthActions(box, report, refreshAction) {
      var actions = createEl('div', 'spx-row');
      var refresh = createEl('button', '', refreshAction === 'refresh-storage-usage' ? '刷新体积' : '刷新统计');
      var cleanup = createEl('button', '', '清理重复/过期');
      refresh.type = 'button';
      cleanup.type = 'button';
      refresh.dataset.action = refreshAction || 'refresh-data-health';
      cleanup.dataset.action = 'cleanup-data-health';
      cleanup.disabled = !report.cleanupCount;
      actions.appendChild(refresh);
      actions.appendChild(cleanup);
      box.appendChild(actions);
    }

    function renderDataHealthPanel(message) {
      var box = qs('[data-role="data-health"]', panel);
      if (!box) return;
      var payload = getCurrentDataHealthPayload();
      var report = collectDataHealthReport(payload);
      var storageReport = collectStorageUsageReport(payload);
      box.hidden = false;
      box.textContent = '';
      box.appendChild(createEl('strong', '', '本地数据健康'));
      box.appendChild(createEl('div', 'spx-help', formatDataHealthSummary(report)));
      box.appendChild(createEl('div', 'spx-help', formatDataHealthWarnings(report)));
      appendStorageUsageDetails(box, storageReport);
      if (message) box.appendChild(createEl('div', 'spx-help', message));
      appendDataHealthActions(box, report, 'refresh-data-health');
    }

    function renderStorageUsagePanel(message) {
      var box = qs('[data-role="data-health"]', panel);
      if (!box) return;
      var payload = getCurrentDataHealthPayload();
      var report = collectDataHealthReport(payload);
      var storageReport = collectStorageUsageReport(payload);
      box.hidden = false;
      box.textContent = '';
      appendStorageUsageDetails(box, storageReport);
      if (message) box.appendChild(createEl('div', 'spx-help', message));
      appendDataHealthActions(box, report, 'refresh-storage-usage');
    }

    function applyDataHealthCleanup(button) {
      var cleanup = cleanupDataHealthPayload(getCurrentDataHealthPayload());
      if (!cleanup.before.cleanupCount) {
        renderDataHealthPanel('暂无重复或过期数据需要清理。');
        return;
      }
      if (typeof window.confirm === 'function' && !window.confirm('将清理重复稍后看、重复/过期阅读进度和异常记录，确认继续？')) return;
      var done = applyBackupPayload(cleanup.payload, settings, state);
      renderDataHealthPanel(done ? '已清理 ' + cleanup.before.cleanupCount + ' 项数据。' : '清理失败。');
      setTemporaryButtonText(button, done ? '已清理' : '清理失败');
    }

    panel.addEventListener('click', function handleSettingsClick(event) {
      var action = event.target && event.target.dataset && event.target.dataset.action;
      if (!action) return;
      if (action === 'save') {
        saveForm();
        panel.hidden = true;
      }
      if (action === 'close') panel.hidden = true;
      if (action === 'export-backup') {
        var exported = downloadBackupPayload(collectBackupPayload(settings, state));
        setTemporaryButtonText(event.target, exported ? '已导出备份' : '导出失败');
      }
      if (action === 'import-backup') {
        var fileInput = qs('input[data-action="import-backup-file"]', panel);
        if (!fileInput) return;
        fileInput.value = '';
        fileInput.click();
      }
      if (action === 'show-data-health' || action === 'refresh-data-health') {
        renderDataHealthPanel();
      }
      if (action === 'show-storage-usage' || action === 'refresh-storage-usage') {
        renderStorageUsagePanel();
      }
      if (action === 'cleanup-data-health') {
        applyDataHealthCleanup(event.target);
      }
      if (action === 'clear-read') {
        state.read = {};
        saveMap(READ_KEY, state.read);
        enhanceAll(settings, state);
        setTemporaryButtonText(event.target, '已清空已读');
      }
      if (action === 'clear-progress') {
        state.progress = {};
        saveReadProgress(state.progress);
        clearReadProgressRestoreRequest(parseThreadId(location.href));
        refreshWatchCenter();
        refreshHistoryCenter();
        setTemporaryButtonText(event.target, '已清空阅读进度');
      }
      if (action === 'clear-auto-buy') {
        saveAutoBuyAttempts({});
        delete document.documentElement.dataset.spxAutoBuyStatus;
        var autoBuyStatus = qs('#spx-auto-buy-status');
        if (autoBuyStatus) autoBuyStatus.remove();
        refreshAutoBuyCenter();
        setTemporaryButtonText(event.target, '已清空购买记录');
      }
    });

    panel.addEventListener('change', function handleSettingsChange(event) {
      var target = event.target;
      if (!target || !target.dataset || target.dataset.action !== 'import-backup-file') return;
      var file = target.files && target.files[0];
      if (!file) return;
      var importButton = qs('button[data-action="import-backup"]', panel);
      importBackupFile(file, settings, state, function handleBackupImport(done, message) {
        setTemporaryButtonText(importButton, message || (done ? '已导入备份' : '导入失败'));
      });
    });

    panel.spxSync = syncForm;
    syncForm();
    return panel;
  }

  function getToolbarNavigationConfigs(url, root) {
    var page = currentPageNumber(url);
    return [
      {
        show: true,
        group: '页面导航',
        text: '顶',
        label: '回到顶部',
        title: '回到顶部',
        description: '快速滚动到页面开头',
        onClick: function top() {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      },
      {
        show: true,
        group: '页面导航',
        text: '底',
        label: '滚到底部',
        title: '滚到底部',
        description: '快速滚动到页面末尾',
        onClick: function bottom() {
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        },
      },
      {
        show: shouldShowToolbarAction('prevPage', url, root),
        group: '页面导航',
        text: '上',
        label: '上一页',
        title: '上一页',
        description: '切换到上一页内容',
        href: buildPageUrl(url, Math.max(1, page - 1)),
      },
      {
        show: shouldShowToolbarAction('nextPage', url, root),
        group: '页面导航',
        text: '下',
        label: '下一页',
        title: '下一页',
        description: '切换到下一页内容',
        href: buildPageUrl(url, page + 1),
      },
      {
        show: shouldShowToolbarFeature('latest'),
        group: '页面导航',
        text: '新',
        label: '最新帖子',
        title: '最新帖子',
        description: '打开站点最新帖子列表',
        href: location.origin + '/search2.php?orderway-postdate-asc-desc-newatc-1.html',
      },
      {
        show: shouldShowToolbarAction('home', url, root),
        group: '页面导航',
        text: '首',
        label: '论坛首页',
        title: '论坛首页',
        description: '回到当前站点首页',
        href: location.origin + '/index.php',
      },
    ];
  }

  function getToolbarToggleConfigs(url, root) {
    return [
      { show: shouldShowToolbarFeature('clean'), group: '阅读模式', key: 'cleanMode', text: '净', label: '清爽模式', title: '切换清爽模式', description: '隐藏低频模块和干扰内容' },
      { show: shouldShowToolbarAction('reader', url, root), group: '阅读模式', key: 'readerMode', text: '字', label: '阅读排版', title: '切换阅读排版优化', description: '优化字体、宽度和正文间距' },
      { show: shouldShowToolbarAction('adBlock', url, root), group: '阅读模式', key: 'adBlock', text: '广', label: '隐藏广告', title: '切换隐藏广告', description: '隐藏广告链接、图片和容器' },
      { show: shouldShowToolbarAction('homeDashboard', url, root), group: '阅读模式', key: 'homeDashboard', text: '模', label: '首页模块', title: '切换首页模块全屏', description: '以网格方式整理首页板块' },
      { show: shouldShowToolbarAction('immersiveRead', url, root), group: '阅读模式', key: 'immersiveRead', text: '屏', label: '沉浸阅读', title: '切换帖子页沉浸全屏', description: '放大帖子内容并弱化周边' },
      { show: shouldShowToolbarAction('previewGallery', url, root), group: '阅读模式', key: 'unifiedPreviewGallery', text: '图', label: '预览图集', title: '切换预览图集中显示', description: '集中查看当前页正文图片' },
      { show: shouldShowToolbarAction('unreadOnly', url, root), group: '阅读模式', key: 'unreadOnly', text: '未', label: '只看未读', title: '只看未读', description: '论坛列表隐藏已读主题' },
      { show: shouldShowToolbarAction('onlyOriginalAuthor', url, root), group: '阅读模式', key: 'onlyOriginalAuthor', text: '楼', label: '只看楼主', title: '只看楼主', description: '阅读页隐藏非楼主回复' },
    ];
  }

  function getToolbarCenterConfigs() {
    return [
      {
        show: true,
        group: '我的中心',
        text: '存',
        label: '稍后看',
        title: '打开稍后看中心',
        description: '管理保存的主题和续读入口',
        panelId: 'spx-watch-center',
        buttonDataset: 'spxWatchCenterButton',
        buttonSelector: '[data-spx-watch-center-button="1"]',
        createPanel: createWatchCenterPanel,
      },
      {
        show: true,
        group: '我的中心',
        text: '历',
        label: '最近浏览',
        title: '打开最近浏览',
        description: '查看阅读历史和进度',
        panelId: 'spx-history-center',
        buttonDataset: 'spxHistoryCenterButton',
        buttonSelector: '[data-spx-history-center-button="1"]',
        createPanel: createHistoryCenterPanel,
      },
      {
        show: true,
        group: '我的中心',
        text: '买',
        label: '购买记录',
        title: '打开自动购买记录',
        description: '查看自动购买执行状态',
        panelId: 'spx-auto-buy-center',
        buttonDataset: 'spxAutoBuyCenterButton',
        buttonSelector: '[data-spx-auto-buy-center-button="1"]',
        createPanel: createAutoBuyCenterPanel,
      },
      {
        show: true,
        group: '我的中心',
        text: '源',
        label: '资源工作台',
        title: '打开资源工作台',
        description: '管理磁力、网盘和种子资源',
        panelId: 'spx-resource-center',
        buttonDataset: 'spxResourceCenterButton',
        buttonSelector: '[data-spx-resource-center-button="1"]',
        createPanel: createResourceCenterPanel,
      },
    ];
  }

  function getToolbarSettingsConfig() {
    return {
      show: true,
      group: '设置',
      text: '设',
      label: '脚本设置',
      title: '打开脚本设置面板',
      description: '配置开关、备份和数据健康',
      kind: 'settings',
    };
  }

  function getToolboxActionConfigs(url, root) {
    return getToolbarNavigationConfigs(url, root)
      .concat(getToolbarToggleConfigs(url, root))
      .concat(getToolbarCenterConfigs())
      .concat([getToolbarSettingsConfig()])
      .filter(function keepVisibleToolboxAction(config) {
        return config && config.show !== false;
      });
  }

  function getToolboxGroups(url, root) {
    var order = ['页面导航', '阅读模式', '我的中心', '设置'];
    var groups = {};
    getToolboxActionConfigs(url, root).forEach(function collectToolboxConfig(config) {
      var group = config.group || '其他';
      if (!groups[group]) groups[group] = [];
      groups[group].push(config);
    });
    return order.concat(Object.keys(groups).filter(function keepExtraGroup(group) {
      return order.indexOf(group) === -1;
    })).filter(function hasGroupItems(group) {
      return groups[group] && groups[group].length;
    }).map(function toToolboxGroup(group) {
      return { title: group, items: groups[group] };
    });
  }

  function setToolboxHidden(panel, hidden, buttonSelector) {
    if (!panel) return;
    panel.hidden = !!hidden;
    if (buttonSelector) {
      qsa(buttonSelector).forEach(function toggleToolboxButton(button) {
        button.classList.toggle('spx-active', !panel.hidden);
        button.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
      });
    }
  }

  function isToolboxActionActive(config, settings) {
    if (!config) return false;
    if (config.key) return !!(settings && settings[config.key]);
    if (config.panelId) {
      var panel = qs('#' + config.panelId);
      return !!(panel && !panel.hidden);
    }
    return false;
  }

  function appendToolboxActionContent(node, config) {
    node.appendChild(createEl('span', 'spx-toolbox-key', config.text || ''));
    var copy = createEl('span', 'spx-toolbox-copy');
    copy.appendChild(createEl('span', 'spx-toolbox-name', config.label || config.title || config.text || '工具'));
    copy.appendChild(createEl('span', 'spx-toolbox-desc', config.description || config.title || ''));
    node.appendChild(copy);
  }

  function createToolboxActionElement(config, settings, state, toolbox) {
    var node = createEl(config.href ? 'a' : 'button', 'spx-toolbox-action');
    node.title = config.title || config.label || '';
    if (config.href) {
      node.href = config.href;
    } else {
      node.type = 'button';
    }
    if (config.buttonDataset) node.dataset[config.buttonDataset] = '1';
    node.classList.toggle('spx-active', isToolboxActionActive(config, settings));
    appendToolboxActionContent(node, config);

    if (config.href) return node;

    node.addEventListener('click', function handleToolboxAction() {
      if (config.kind === 'settings') {
        var settingsPanel = createSettingsPanel(settings, state);
        if (settingsPanel.spxSync) settingsPanel.spxSync();
        settingsPanel.hidden = !settingsPanel.hidden;
        setToolboxHidden(toolbox, true, '[data-spx-toolbox-button="1"]');
        return;
      }
      if (config.key) {
        settings[config.key] = !settings[config.key];
        saveSettings(settings);
        enhanceAll(settings, state);
        if (toolbox && toolbox.spxRender) toolbox.spxRender();
        return;
      }
      if (config.createPanel) {
        var centerPanel = config.createPanel(settings, state);
        if (centerPanel.spxRender) centerPanel.spxRender();
        setCenterPanelHidden(centerPanel, !centerPanel.hidden, config.buttonSelector);
        setToolboxHidden(toolbox, true, '[data-spx-toolbox-button="1"]');
        return;
      }
      if (typeof config.onClick === 'function') {
        config.onClick();
        setToolboxHidden(toolbox, true, '[data-spx-toolbox-button="1"]');
      }
    });

    return node;
  }

  function createToolboxPanel(settings, state) {
    var panel = qs('#spx-toolbox');
    if (panel) return panel;

    panel = createEl('div', 'spx-toolbox');
    panel.id = 'spx-toolbox';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'South Plus 工具箱');
    panel.hidden = true;
    panel.spxRender = function renderToolbox() {
      panel.textContent = '';
      var header = createEl('div', 'spx-toolbox-header');
      var title = createEl('div');
      title.appendChild(createEl('div', 'spx-toolbox-eyebrow', '功能分组'));
      title.appendChild(createEl('h3', '', 'South Plus 工具箱'));
      title.appendChild(createEl('p', '', '完整名称和用途说明都放在这里，右侧只保留高频入口。'));
      var closeButton = createEl('button', 'spx-toolbox-close', '×');
      closeButton.type = 'button';
      closeButton.title = '关闭工具箱';
      closeButton.addEventListener('click', function closeToolbox() {
        setToolboxHidden(panel, true, '[data-spx-toolbox-button="1"]');
      });
      header.appendChild(title);
      header.appendChild(closeButton);
      panel.appendChild(header);

      var body = createEl('div', 'spx-toolbox-body');
      getToolboxGroups(location.href, document).forEach(function appendGroup(group) {
        var section = createEl('section', 'spx-toolbox-section');
        var sectionTitle = createEl('div', 'spx-toolbox-section-title');
        sectionTitle.appendChild(createEl('span', '', group.title));
        sectionTitle.appendChild(createEl('span', 'spx-toolbox-count', String(group.items.length)));
        section.appendChild(sectionTitle);
        var grid = createEl('div', 'spx-toolbox-grid');
        group.items.forEach(function appendToolboxAction(config) {
          grid.appendChild(createToolboxActionElement(config, settings, state, panel));
        });
        section.appendChild(grid);
        body.appendChild(section);
      });
      panel.appendChild(body);
    };
    panel.spxRender();
    document.body.appendChild(panel);
    return panel;
  }

  function createToolbar(settings, state) {
    if (qs('#spx-toolbar')) return;
    var toolbar = createEl('div', 'spx-toolbar');
    toolbar.id = 'spx-toolbar';
    var toolbox = createToolboxPanel(settings, state);

    toolbar.appendChild(toolbarButton('顶部', '回到顶部', function top() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
    toolbar.appendChild(toolbarButton('底部', '滚到底部', function bottom() {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }));
    var toolboxButton = toolbarButton('工具', '打开工具箱', function toggleToolbox() {
      if (toolbox.spxRender) toolbox.spxRender();
      setToolboxHidden(toolbox, !toolbox.hidden, '[data-spx-toolbox-button="1"]');
    });
    toolboxButton.dataset.spxToolboxButton = '1';
    toolboxButton.setAttribute('aria-haspopup', 'dialog');
    toolboxButton.setAttribute('aria-controls', 'spx-toolbox');
    toolboxButton.setAttribute('aria-expanded', 'false');
    toolbar.appendChild(toolboxButton);

    toolbar.appendChild(toolbarButton('设置', '打开设置', function openSettings() {
      var panel = createSettingsPanel(settings, state);
      if (panel.spxSync) panel.spxSync();
      panel.hidden = !panel.hidden;
      setToolboxHidden(toolbox, true, '[data-spx-toolbox-button="1"]');
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
    enhanceQuickReply(settings, state);
    var panel = qs('#spx-settings');
    if (panel && panel.spxSync) panel.spxSync();
  }

  function init() {
    if (testMode || typeof window === 'undefined' || !document.body) return;
    var settings = loadSettings();
    var state = {
      read: loadMap(READ_KEY),
      watch: loadMap(WATCH_KEY),
      progress: loadReadProgress(),
      resources: loadResourceLibrary(),
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
    parseTagList: parseTagList,
    createBackupPayload: createBackupPayload,
    normalizeBackupPayload: normalizeBackupPayload,
    formatBackupFileName: formatBackupFileName,
    collectDataHealthReport: collectDataHealthReport,
    cleanupDataHealthPayload: cleanupDataHealthPayload,
    formatDataHealthSummary: formatDataHealthSummary,
    formatDataHealthWarnings: formatDataHealthWarnings,
    collectStorageUsageReport: collectStorageUsageReport,
    formatStorageBytes: formatStorageBytes,
    formatStorageUsageSummary: formatStorageUsageSummary,
    formatStorageUsageWarnings: formatStorageUsageWarnings,
    formatStorageUsageLimit: formatStorageUsageLimit,
    getStorageUsageLevel: getStorageUsageLevel,
    formatStorageUsageEntry: formatStorageUsageEntry,
    formatBackupImportPreview: formatBackupImportPreview,
    formatReadProgress: formatReadProgress,
    getReadProgressRestoreTarget: getReadProgressRestoreTarget,
    mergeReadProgressRecord: mergeReadProgressRecord,
    pruneReadProgress: pruneReadProgress,
    getWatchCenterEntries: getWatchCenterEntries,
    getHistoryCenterEntries: getHistoryCenterEntries,
    getAutoBuyCenterEntries: getAutoBuyCenterEntries,
    filterWatchCenterEntries: filterWatchCenterEntries,
    filterHistoryCenterEntries: filterHistoryCenterEntries,
    filterAutoBuyCenterEntries: filterAutoBuyCenterEntries,
    matchesBlockRules: matchesBlockRules,
    parseForumFilterQuery: parseForumFilterQuery,
    matchesForumFilter: matchesForumFilter,
    extractPreviewImageUrls: extractPreviewImageUrls,
    isLargePreviewImage: isLargePreviewImage,
    formatPreviewImageLinks: formatPreviewImageLinks,
    getPreviewGalleryRenderState: getPreviewGalleryRenderState,
    formatPreviewGallerySummary: formatPreviewGallerySummary,
    normalizeResourceUrl: normalizeResourceUrl,
    classifyResourceLink: classifyResourceLink,
    getCloudProviderLabel: getCloudProviderLabel,
    getResourceDisplayLabel: getResourceDisplayLabel,
    extractResourceLinksFromText: extractResourceLinksFromText,
    filterResourceLinks: filterResourceLinks,
    formatResourceLinks: formatResourceLinks,
    getJumpResourceLinks: getJumpResourceLinks,
    getResourceDownloadQueueEntries: getResourceDownloadQueueEntries,
    formatResourceDownloadList: formatResourceDownloadList,
    formatResourceMarkdownList: formatResourceMarkdownList,
    formatResourceDownloadFileName: formatResourceDownloadFileName,
    formatResourceJumpSummary: formatResourceJumpSummary,
    normalizeResourceTags: normalizeResourceTags,
    formatResourceTags: formatResourceTags,
    pruneResourceLibrary: pruneResourceLibrary,
    saveResourceLinksToLibrary: saveResourceLinksToLibrary,
    getResourceCenterEntries: getResourceCenterEntries,
    groupResourceCenterEntries: groupResourceCenterEntries,
    filterResourceCenterEntries: filterResourceCenterEntries,
    getSelectedResourceKeys: getSelectedResourceKeys,
    setResourceSelection: setResourceSelection,
    getResourceEntriesByKeys: getResourceEntriesByKeys,
    markThreadsRead: markThreadsRead,
    findThreadIdsByAuthor: findThreadIdsByAuthor,
    isStickyCell: isStickyCell,
    hideStickyThreads: hideStickyThreads,
    hideForumAnnouncementPanels: hideForumAnnouncementPanels,
    isPreviewImageCandidate: isPreviewImageCandidate,
    clampPreviewZoom: clampPreviewZoom,
    getPreviewLightboxKeyAction: getPreviewLightboxKeyAction,
    parsePostPrice: parsePostPrice,
    parseUserSpBalance: parseUserSpBalance,
    shouldAutoBuyPost: shouldAutoBuyPost,
    extractBuyTopicUrl: extractBuyTopicUrl,
    getAutoBuyAttemptKey: getAutoBuyAttemptKey,
    isAutoBuyAttemptBlocked: isAutoBuyAttemptBlocked,
    formatAutoBuyAttemptMessage: formatAutoBuyAttemptMessage,
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
    createQuickReplyRequest: createQuickReplyRequest,
    isQuickReplySubmitter: isQuickReplySubmitter,
    getQuickReplySubmitter: getQuickReplySubmitter,
    performQuickReplySubmit: performQuickReplySubmit,
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

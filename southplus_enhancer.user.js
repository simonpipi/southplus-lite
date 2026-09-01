// ==UserScript==
// @name         South Plus +++
// @namespace    https://south-plus.org/
// @version      0.6.4
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
// @grant        GM_xmlhttpRequest
// @connect      *
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
  var TASK_CLAIM_KEY = APP + ':taskClaims:v1';
  var TASK_AUTO_CLAIM_STATE_KEY = APP + ':taskAutoClaim:v1';
  var PROFILE_INFOBOX_CACHE_KEY = APP + ':profileInfobox:v1';
  var RESOURCE_KEY = APP + ':resources:v1';
  var READ_RESOURCE_RAIL_COLLAPSED_KEY = APP + ':readResourceRailCollapsed:v1';
  var NAVIGATION_KEY = APP + ':navigation:v1';
  var NAVIGATION_COLLAPSE_KEY = APP + ':navigationCollapse:v1';
  var NAVIGATION_COLLAPSE_DEFAULT_KEY = APP + ':navigationCollapseDefault:v1';
  var NAVIGATION_PIN_KEY = APP + ':navigationPins:v1';
  var NAVIGATION_USAGE_KEY = APP + ':navigationUsage:v1';
  var NAVIGATION_REFRESH_KEY = APP + ':navigationRefresh:v1';
  var FAVORITE_NAV_COUNT_CACHE_KEY = APP + ':favoriteNavCountCache:v1';
  var FAVORITE_NAV_SEEN_KEY = APP + ':favoriteNavSeen:v1';
  var THREAD_UPDATE_KEY = APP + ':threadUpdates:v1';
  var AUTO_BUY_CHECK_TTL = 10 * 60 * 1000;
  var AUTO_BUY_BUYING_TTL = 90 * 1000;
  var AUTO_BUY_ATTEMPT_LIMIT = 100;
  var TASK_CLAIM_RECORD_LIMIT = 100;
  var TASK_AUTO_CLAIM_DAILY_COOLDOWN = 18 * 60 * 60 * 1000;
  var TASK_AUTO_CLAIM_WEEKLY_COOLDOWN = 7 * 24 * 60 * 60 * 1000;
  var TASK_AUTO_CLAIM_PROBE_RETRY_TTL = 6 * 60 * 60 * 1000;
  var TASK_AUTO_CLAIM_ERROR_RETRY_TTL = 60 * 60 * 1000;
  var PROFILE_INFOBOX_CACHE_TTL = 6 * 60 * 60 * 1000;
  var RESOURCE_LIMIT = 500;
  var NAVIGATION_POOL_LIMIT = 160;
  var NAVIGATION_USAGE_LIMIT = 160;
  var NAVIGATION_REFRESH_TTL = 6 * 60 * 60 * 1000;
  var FAVORITE_NAV_COUNT_CACHE_TTL = 2 * 60 * 1000;
  var FAVORITE_NAV_COUNT_RETRY_TTL = 60 * 1000;
  var READ_PROGRESS_LIMIT = 200;
  var STALE_PROGRESS_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  var LOCAL_STORAGE_WARNING_BYTES = 4 * 1024 * 1024;
  var PREVIEW_GALLERY_BATCH_SIZE = 36;
  var PREVIEW_DOWNLOAD_MAX_RETRIES = 6;
  var PREVIEW_DOWNLOAD_CONCURRENCY = 3;
  var FAVORITE_NAV_BATCH_SIZE = 50;
  var FAVORITE_NAV_MAX_FETCHED_ITEMS = 120;
  var READ_REPLIES_PER_PAGE = 30;
  var THREAD_UPDATE_LIMIT = 260;
  var THREAD_UPDATE_CHECK_BATCH_SIZE = 10;
  var THREAD_UPDATE_HOT_TTL = 15 * 60 * 1000;
  var THREAD_UPDATE_WARM_TTL = 6 * 60 * 60 * 1000;
  var THREAD_UPDATE_COLD_TTL = 24 * 60 * 60 * 1000;
  var THREAD_UPDATE_RATE_LIMIT_COOLDOWN = 60 * 60 * 1000;
  var THREAD_PREVIEW_CACHE_TTL = 20 * 60 * 1000;
  var THREAD_PREVIEW_FAILURE_TTL = 3 * 60 * 1000;
  var THREAD_PREVIEW_CACHE_LIMIT = 50;
  var THREAD_PREVIEW_IMAGE_LIMIT = 6;
  var THREAD_PREVIEW_HOVER_DELAY = 520;
  var THREAD_PREVIEW_FAST_HOVER_DELAY = 260;
  var THREAD_PREVIEW_IMAGE_LOAD_DELAY = 180;
  var THREAD_PREVIEW_IMAGE_BATCH_SIZE = 2;
  var SP_BALANCE_CACHE_TTL = 90 * 1000;
  var TOOLBOX_BUTTON_SELECTOR = '[data-spx-toolbox-button="1"]';
  var SETTINGS_BUTTON_SELECTOR = '[data-spx-settings-button="1"]';
  var COMMAND_PALETTE_BUTTON_SELECTOR = '[data-spx-command-palette-button="1"]';
  var THREAD_ROW_HIDDEN_CLASSES = ['spx-filter-hidden', 'spx-resource-filter-hidden', 'spx-hidden-rule', 'spx-unread-hidden', 'spx-thread-row-hidden'];
  var pendingModuleNavigationConfigs = [];
  var scriptRequestState = {
    queue: [],
    running: false,
    timer: null,
    lastStartedAt: 0,
    cooldownUntil: 0,
    sequence: 0,
  };
  var threadPreviewCache = {};
  var threadPreviewCacheOrder = [];
  var spBalanceCache = { value: null, expiresAt: 0 };
  var readResourceRailContext = { posts: null, state: null, filter: 'all' };
  var readSummaryContext = { settings: null, state: null, posts: null, tid: '', originalAuthor: '' };
  var pendingFavoriteNavStatusNotes = [];
  var enhanceCycle = 0;
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
  var RESOURCE_BADGE_ORDER = ['baidu', 'quark', 'pikpak', 'magnet', 'torrent', 'archive', 'ed2k', 'external', 'cloud'];
  var RESOURCE_BADGE_DEFINITIONS = {
    baidu: { label: '百度', pattern: /百度|baidu|pan\.baidu|yun\.baidu/i },
    quark: { label: '夸克', pattern: /夸克|quark|pan\.quark/i },
    pikpak: { label: 'PikPak', pattern: /pikpak/i },
    magnet: { label: '磁力', pattern: /磁力|magnet/i },
    torrent: { label: '种子', pattern: /种子|torrent/i },
    archive: { label: '压缩包', pattern: /压缩包|解压|zip|rar|7z|iso/i },
    ed2k: { label: '电驴', pattern: /电驴|ed2k/i },
    external: { label: '外链', pattern: /外链|直链|镜像/i },
    cloud: { label: '网盘', pattern: /网盘|云盘/i },
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
    nightMode: false,
    immersiveFontSize: 16,
    unifiedPreviewGallery: true,
    homeDashboard: true,
    forumDashboard: true,
    moduleNavDensity: 'comfortable',
    adBlock: true,
    compactRead: true,
    unreadOnly: false,
    onlyOriginalAuthor: false,
    foldQuotes: true,
    hideUserProfile: false,
    networkFriendly: true,
    autoTaskClaim: true,
    autoBuyPost: false,
    autoBuyMaxSp: 5,
    smartModuleNavSort: true,
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

  var QUICK_REPLY_EMOTES = [
    { id: 638, fileName: '001.jpg' },
    { id: 700, fileName: '002.jpg' },
    { id: 707, fileName: '003.jpg' },
    { id: 746, fileName: '005.jpg' },
    { id: 641, fileName: '006.jpg' },
    { id: 735, fileName: '007.jpg' },
    { id: 742, fileName: '008.jpg' },
    { id: 711, fileName: '009.jpg' },
    { id: 655, fileName: '010.jpg' },
    { id: 730, fileName: '012.jpg' },
    { id: 732, fileName: '013.gif' },
    { id: 676, fileName: '014.jpg' },
    { id: 673, fileName: '015.jpg' },
    { id: 660, fileName: '016.jpg' },
    { id: 740, fileName: '017.jpg' },
    { id: 678, fileName: '018.jpg' },
    { id: 642, fileName: '019.jpg' },
    { id: 715, fileName: '020.jpg' },
    { id: 647, fileName: '021.gif' },
    { id: 682, fileName: '022.gif' },
    { id: 677, fileName: '023.jpg' },
    { id: 664, fileName: '024.jpg' },
    { id: 639, fileName: '025.jpg' },
    { id: 713, fileName: '026.jpg' },
    { id: 705, fileName: '027.jpg' },
    { id: 743, fileName: '028.jpg' },
    { id: 741, fileName: '029.jpg' },
    { id: 698, fileName: '030.jpg' },
    { id: 669, fileName: '031.gif' },
    { id: 708, fileName: '032.jpg' },
    { id: 686, fileName: '033.jpg' },
    { id: 709, fileName: '034.jpg' },
    { id: 728, fileName: '035.jpg' },
    { id: 747, fileName: '036.jpg' },
    { id: 726, fileName: '037.gif' },
    { id: 652, fileName: '038.gif' },
    { id: 646, fileName: '039.jpg' },
    { id: 703, fileName: '040.jpg' },
  ].map(function mapQuickReplyEmote(emote) {
    return {
      code: '[s:' + emote.id + ']',
      fileName: emote.fileName,
      src: 'https://south-plus.org/images/post/smile/smallface/face' + emote.fileName,
    };
  });

  function parseThreadId(value) {
    var text = String(value || '');
    var match =
      text.match(/^(\d+)$/) ||
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

  function normalizeModuleNavDensity(value) {
    var text = String(value || '').trim();
    if (text === 'compact' || text === 'standard' || text === 'comfortable') return text;
    return 'comfortable';
  }

  function getModuleNavigationDensityConfig(value) {
    var density = normalizeModuleNavDensity(value);
    var configs = {
      compact: {
        width: 220,
        maxOffset: 76,
        sectionHeight: 28,
        parentHeight: 30,
        itemHeight: 34,
        childHeight: 30,
        itemPadding: 10,
        sectionPadding: 9,
        radius: 9,
      },
      standard: {
        width: 240,
        maxOffset: 64,
        sectionHeight: 30,
        parentHeight: 36,
        itemHeight: 40,
        childHeight: 32,
        itemPadding: 12,
        sectionPadding: 11,
        radius: 10,
      },
      comfortable: {
        width: 260,
        maxOffset: 52,
        sectionHeight: 34,
        parentHeight: 40,
        itemHeight: 44,
        childHeight: 36,
        itemPadding: 14,
        sectionPadding: 12,
        radius: 12,
      },
    };
    return Object.assign({ density: density }, configs[density]);
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

  function isReadProgressBehind(previous, next) {
    if (!previous || !next) return false;
    var previousPage = Math.max(1, Number(previous.page) || 1);
    var nextPage = Math.max(1, Number(next.page) || 1);
    if (nextPage !== previousPage) return nextPage < previousPage;
    return clampRatio(next.progress) < clampRatio(previous.progress);
  }

  function mergeReadProgressRecord(previous, next) {
    if (!next) return previous || null;
    if (isReadProgressBehind(previous, next)) return previous;
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

  function normalizeThreadUpdateReplyCount(value) {
    if (value === null || value === undefined || value === '') return null;
    var count = Number(value);
    if (!isFinite(count) || count < 0) return null;
    return Math.floor(count);
  }

  function parseThreadReplyCount(text) {
    var value = compactText(text);
    if (!value) return null;
    var labeled = value.match(/(?:^|[\s·|/：:])(?:回复|回帖|Replies?)\s*[:：]?\s*(\d+)/i);
    return labeled ? normalizeThreadUpdateReplyCount(labeled[1]) : null;
  }

  function normalizeThreadUpdateRecord(record, key) {
    if (!record || typeof record !== 'object') return null;
    var source = record;
    var id = parseThreadId(key || source.id || source.url || source.progressUrl || '');
    if (!id) return null;
    var knownReplies = normalizeThreadUpdateReplyCount(source.knownReplies);
    if (knownReplies === null) knownReplies = normalizeThreadUpdateReplyCount(source.replies);
    if (knownReplies === null) knownReplies = 0;
    var readReplies = normalizeThreadUpdateReplyCount(source.readReplies);
    if (readReplies === null) readReplies = knownReplies;
    readReplies = Math.min(readReplies, knownReplies);
    var unreadReplies = Math.max(0, knownReplies - readReplies);
    return {
      id: id,
      title: compactText(source.title),
      url: String(source.url || source.progressUrl || ''),
      knownReplies: knownReplies,
      readReplies: readReplies,
      unreadReplies: unreadReplies,
      hasNewReplies: unreadReplies > 0,
      lastCheckedAt: Math.max(0, Number(source.lastCheckedAt) || 0),
      lastReadAt: Math.max(0, Number(source.lastReadAt) || 0),
      updatedAt: Math.max(0, Number(source.updatedAt || source.lastCheckedAt || source.lastReadAt) || 0),
      source: String(source.source || ''),
    };
  }

  function pruneThreadUpdates(updates, limit) {
    var source = updates || {};
    var normalized = {};
    Object.keys(source).forEach(function normalizeUpdateRecord(key) {
      var record = normalizeThreadUpdateRecord(source[key], key);
      if (record) normalized[record.id] = record;
    });
    var keys = Object.keys(normalized)
      .sort(function sortThreadUpdates(left, right) {
        var leftAt = Math.max(normalized[left].updatedAt, normalized[left].lastCheckedAt, normalized[left].lastReadAt);
        var rightAt = Math.max(normalized[right].updatedAt, normalized[right].lastCheckedAt, normalized[right].lastReadAt);
        return rightAt - leftAt || Number(right) - Number(left);
      })
      .slice(0, Math.max(1, Number(limit) || THREAD_UPDATE_LIMIT));
    var result = {};
    keys.forEach(function keepThreadUpdate(key) {
      result[key] = normalized[key];
    });
    return result;
  }

  function getThreadUpdateActivityAt(entry, record) {
    return Math.max(
      Number(entry && entry.progressAt) || 0,
      Number(entry && entry.savedAt) || 0,
      Number(record && record.lastReadAt) || 0,
      Number(record && record.updatedAt) || 0
    );
  }

  function getThreadUpdateCheckInterval(entry, record, now) {
    var currentTime = Number(now) || Date.now();
    var activityAt = getThreadUpdateActivityAt(entry, record);
    if (record && record.hasNewReplies) return THREAD_UPDATE_HOT_TTL;
    if (!entry || !entry.read || activityAt >= currentTime - 7 * 24 * 60 * 60 * 1000) return THREAD_UPDATE_HOT_TTL;
    if (activityAt >= currentTime - 30 * 24 * 60 * 60 * 1000) return THREAD_UPDATE_WARM_TTL;
    return THREAD_UPDATE_COLD_TTL;
  }

  function shouldCheckThreadUpdate(entry, record, now, manual) {
    if (!entry || !entry.id) return false;
    if (manual) return true;
    var normalizedRecord = normalizeThreadUpdateRecord(record, entry.id);
    if (!normalizedRecord || !normalizedRecord.lastCheckedAt) return true;
    return normalizedRecord.lastCheckedAt + getThreadUpdateCheckInterval(entry, normalizedRecord, now) <= (Number(now) || Date.now());
  }

  function updateThreadReplyState(updateMap, entry, options, now) {
    var map = updateMap || {};
    var source = entry || {};
    var id = parseThreadId(source.id || source.url || source.progressUrl || '');
    if (!id) return { map: map, record: null, changed: false };
    var opts = options || {};
    var currentTime = now === undefined ? Date.now() : Number(now);
    if (!isFinite(currentTime) || currentTime <= 0) currentTime = Date.now();
    var previous = normalizeThreadUpdateRecord(map[id], id);
    var replyCount = normalizeThreadUpdateReplyCount(source.replies);
    if (replyCount === null) replyCount = parseThreadReplyCount(source.meta || source.rowText || '');
    if (replyCount === null && !opts.markRead && !previous) return { map: map, record: null, changed: false };

    var knownReplies = replyCount === null ? (previous ? previous.knownReplies : 0) : replyCount;
    if (previous && replyCount !== null) knownReplies = Math.max(previous.knownReplies, replyCount);
    var readReplies;
    if (opts.markRead) {
      readReplies = knownReplies;
    } else if (previous) {
      readReplies = Math.min(previous.readReplies, knownReplies);
    } else {
      readReplies = knownReplies;
    }

    var record = Object.assign({}, previous || {}, {
      id: id,
      title: compactText(source.title) || (previous && previous.title) || '',
      url: String(source.url || source.progressUrl || (previous && previous.url) || ''),
      knownReplies: knownReplies,
      readReplies: readReplies,
      unreadReplies: Math.max(0, knownReplies - readReplies),
      lastCheckedAt: opts.checked === false ? (previous && previous.lastCheckedAt || 0) : currentTime,
      updatedAt: currentTime,
      source: String(opts.source || source.source || (previous && previous.source) || ''),
    });
    record.hasNewReplies = record.unreadReplies > 0;
    if (opts.markRead) record.lastReadAt = currentTime;

    var before = previous ? JSON.stringify(previous) : '';
    var after = JSON.stringify(normalizeThreadUpdateRecord(record, id));
    map[id] = record;
    return { map: map, record: record, changed: before !== after };
  }

  function applyThreadUpdateEntries(updateMap, entries, options, now) {
    var map = updateMap || {};
    var changed = false;
    (entries || []).forEach(function applyThreadUpdateEntry(entry) {
      var result = updateThreadReplyState(map, entry, options, now);
      map = result.map;
      if (result.changed) changed = true;
    });
    var pruned = pruneThreadUpdates(map);
    if (Object.keys(pruned).length !== Object.keys(map).length) changed = true;
    return { map: pruned, changed: changed };
  }

  function getThreadUpdateStatusForEntry(entry, updates) {
    var id = parseThreadId(entry && (entry.id || entry.url || entry.progressUrl || ''));
    if (!id) return null;
    var record = normalizeThreadUpdateRecord(updates && updates[id], id);
    if (!record) return null;
    return record;
  }

  function buildThreadLatestReadUrl(threadId, url) {
    var id = parseThreadId(threadId || url || '');
    if (!id) return String(url || '');
    var baseUrl = String(url || (typeof location !== 'undefined' ? location.href : 'https://south-plus.org/'));
    try {
      var parsed = new URL(baseUrl, typeof location !== 'undefined' ? location.href : 'https://south-plus.org/');
      return parsed.origin + '/read.php?tid=' + encodeURIComponent(id) + '&page=e#a';
    } catch (error) {
      return '/read.php?tid=' + encodeURIComponent(id) + '&page=e#a';
    }
  }

  function getReadReplyPage(replyNumber) {
    var targetReply = normalizeThreadUpdateReplyCount(replyNumber);
    if (targetReply === null || targetReply <= 0) return 1;
    return Math.floor((targetReply - 1) / READ_REPLIES_PER_PAGE) + 1;
  }

  function buildThreadReplyPageUrl(threadId, url, replyNumber) {
    var id = parseThreadId(threadId || url || '');
    if (!id) return String(url || '');
    var targetPage = getReadReplyPage(replyNumber);
    var baseUrl = String(url || (typeof location !== 'undefined' ? location.href : 'https://south-plus.org/'));
    try {
      var parsed = new URL(baseUrl, typeof location !== 'undefined' ? location.href : 'https://south-plus.org/');
      return parsed.origin + '/read.php?tid-' + encodeURIComponent(id) + '-page-' + targetPage + '.html';
    } catch (error) {
      return '/read.php?tid-' + encodeURIComponent(id) + '-page-' + targetPage + '.html';
    }
  }

  function getFavoriteNavFirstUnreadReply(entry) {
    var readReplies = normalizeThreadUpdateReplyCount(entry && entry.readReplies);
    var knownReplies = normalizeThreadUpdateReplyCount(entry && entry.knownReplies);
    if (readReplies !== null && knownReplies !== null && knownReplies > readReplies) return readReplies + 1;
    return null;
  }

  function decorateFavoriteNavEntryWithUpdate(entry, updates) {
    var source = Object.assign({}, entry || {});
    var record = getThreadUpdateStatusForEntry(source, updates);
    if (!record) return source;
    source.knownReplies = record.knownReplies;
    source.readReplies = record.readReplies;
    source.unreadReplies = record.unreadReplies;
    source.hasNewReplies = record.hasNewReplies;
    source.updateCheckedAt = record.lastCheckedAt;
    source.updateText = record.hasNewReplies ? ('新 +' + record.unreadReplies) : '';
    source.latestUrl = buildThreadLatestReadUrl(source.id, source.url || record.url);
    return source;
  }

  function decorateFavoriteNavEntriesWithUpdates(entries, updates) {
    return (entries || []).map(function decorateFavoriteEntry(entry) {
      return decorateFavoriteNavEntryWithUpdate(entry, updates);
    });
  }

  function decorateFavoriteNavEntryWithProgress(entry, progressMap) {
    var source = Object.assign({}, entry || {});
    var id = parseThreadId(source.id || source.url || '');
    var record = id && progressMap ? progressMap[id] : null;
    if (!record || !record.updatedAt) return source;
    var floorLabels = getReadProgressFloorLabels(record);
    source.progressAt = Number(record.updatedAt) || source.progressAt || 0;
    source.progressUrl = String(record.url || source.url || '');
    source.progressText = formatReadProgress(record);
    source.floorLabel = floorLabels.last;
    source.nextFloorLabel = floorLabels.next;
    source.read = source.read || isCompletedReadProgress(record);
    source.tags = mergeTagLists(source.tags, record.tags);
    source.tagText = formatTags(source.tags);
    return source;
  }

  function decorateFavoriteNavEntriesWithProgress(entries, progressMap) {
    return (entries || []).map(function decorateFavoriteProgress(entry) {
      return decorateFavoriteNavEntryWithProgress(entry, progressMap);
    });
  }

  function getFavoriteNavUpdateSummary(entries, updates) {
    var seen = {};
    var count = 0;
    var unreadReplies = 0;
    var latestAt = 0;
    (entries || []).forEach(function countUpdatedFavoriteEntry(entry) {
      var record = getThreadUpdateStatusForEntry(entry, updates);
      if (!record || !record.hasNewReplies || seen[record.id]) return;
      seen[record.id] = true;
      count += 1;
      unreadReplies += Number(record.unreadReplies) || 0;
      latestAt = Math.max(latestAt, record.lastCheckedAt, record.updatedAt);
    });
    return { count: count, unreadReplies: unreadReplies, latestAt: latestAt };
  }

  function getFavoriteNavUnreadUrl(entry) {
    if (!entry) return '';
    var firstUnreadReply = getFavoriteNavFirstUnreadReply(entry);
    if (firstUnreadReply) return buildThreadReplyPageUrl(entry.id, entry.url || entry.progressUrl || entry.latestUrl || '', firstUnreadReply);
    if (entry.latestUrl) return entry.latestUrl;
    return buildThreadLatestReadUrl(entry.id, entry.url || entry.progressUrl || '');
  }

  function parseReadPageNumberFromNode(node) {
    if (!node) return 0;
    var href = node.getAttribute ? (node.getAttribute('href') || '') : '';
    var hrefMatch = href.match(/-page-(\d+)/) || href.match(/[?&]page=(\d+)/);
    if (hrefMatch) return Number(hrefMatch[1]) || 0;
    var text = compactText(node.textContent || '');
    return /^\d+$/.test(text) ? Number(text) || 0 : 0;
  }

  function getReadPageNumbers(root) {
    var scope = root || document;
    var numbers = [];
    qsa('.pages a,.pages b,.pages strong,.pages span', scope).forEach(function collectPageNumber(node) {
      var page = parseReadPageNumberFromNode(node);
      if (page) numbers.push(page);
    });
    return numbers;
  }

  function parseThreadReadReplyCountFromDocument(root, pageUrl) {
    var scope = root || document;
    var posts = qsa('table.js-post', scope).length;
    if (!posts) return null;
    var numbers = getReadPageNumbers(scope);
    var currentPage = currentPageNumber(pageUrl || (typeof location !== 'undefined' ? location.href : '')) || 1;
    qsa('.pages b,.pages strong,.pages .current', scope).forEach(function collectCurrentPage(node) {
      currentPage = Math.max(currentPage, parseReadPageNumberFromNode(node));
    });
    var maxPage = numbers.reduce(function maxPageNumber(max, page) { return Math.max(max, page); }, currentPage);
    var url = String(pageUrl || (typeof location !== 'undefined' ? location.href : ''));
    var lastPageUrl = /[?&]page=e(?:[&#]|$)/i.test(url);
    if (maxPage > 1 && currentPage < maxPage && !lastPageUrl) return null;
    var effectivePage = lastPageUrl ? maxPage : currentPage;
    var firstPageTopicPost = effectivePage <= 1 ? 1 : 0;
    return Math.max(0, (Math.max(1, effectivePage) - 1) * READ_REPLIES_PER_PAGE + posts - firstPageTopicPost);
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

  function getTaskClaimTaskKey(taskName) {
    var text = String(taskName || '').replace(/\s+/g, '').toLowerCase();
    if (/日常|daily/.test(text)) return 'daily';
    if (/周常|weekly/.test(text)) return 'weekly';
    return text || 'task';
  }

  function getTaskClaimTaskLabel(taskKey, taskName) {
    var key = String(taskKey || getTaskClaimTaskKey(taskName));
    if (key === 'daily') return '日常';
    if (key === 'weekly') return '周常';
    return String(taskName || key || '任务');
  }

  function parseTaskClaimTaskName(text) {
    var value = String(text || '').replace(/\s+/g, ' ').trim();
    if (/日常/.test(value)) return '日常';
    if (/周常/.test(value)) return '周常';
    var match = value.match(/^([^\s(（]+)\s*(?:[（(]|任务时效|奖励)/);
    return match ? match[1] : '';
  }

  function parseTaskClaimRewardSp(text) {
    var match = String(text || '').match(/奖励\s*[:：]\s*SP币\s*([0-9]+(?:\.[0-9]+)?)/i);
    return match ? Number(match[1]) : null;
  }

  function parseTaskClaimCompletedAt(text) {
    var match = String(text || '').match(/完成时间\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*(?:(AM|PM)\s*[:：]?)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/i);
    if (!match) return 0;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var meridiem = String(match[4] || '').toUpperCase();
    var hour = Number(match[5]);
    var minute = Number(match[6]);
    var second = Number(match[7] || 0);
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    var date = new Date(year, month - 1, day, hour, minute, second);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  }

  function createTaskClaimRecordKey(record) {
    var item = record || {};
    var key = getTaskClaimTaskKey(item.taskKey || item.taskName);
    var completedAt = Math.max(0, Number(item.completedAt) || 0);
    return key + '|' + completedAt;
  }

  function normalizeTaskClaimRecord(record, fallbackKey) {
    var source = record || {};
    var taskName = getTaskClaimTaskLabel(source.taskKey, source.taskName);
    var taskKey = getTaskClaimTaskKey(source.taskKey || taskName);
    var completedAt = Math.max(0, Number(source.completedAt) || 0);
    if (!completedAt) return null;
    var rewardSp = source.rewardSp === null || source.rewardSp === undefined ? null : Number(source.rewardSp);
    if (rewardSp !== null && !isFinite(rewardSp)) rewardSp = null;
    var normalized = {
      key: String(fallbackKey || source.key || ''),
      taskKey: taskKey,
      taskName: getTaskClaimTaskLabel(taskKey, taskName),
      rewardSp: rewardSp,
      completedAt: completedAt,
      recordedAt: Math.max(0, Number(source.recordedAt) || completedAt || Date.now()),
      source: String(source.source || 'local'),
      sourceUrl: String(source.sourceUrl || ''),
    };
    normalized.key = normalized.key || createTaskClaimRecordKey(normalized);
    return normalized;
  }

  function pruneTaskClaimRecords(records) {
    var source = records || {};
    var entries = Object.keys(source).map(function mapTaskClaimRecord(key) {
      return normalizeTaskClaimRecord(source[key], key);
    }).filter(Boolean).sort(function sortTaskClaims(left, right) {
      return (right.completedAt || 0) - (left.completedAt || 0) || (right.recordedAt || 0) - (left.recordedAt || 0);
    }).slice(0, TASK_CLAIM_RECORD_LIMIT);
    var result = {};
    entries.forEach(function keepTaskClaim(record) {
      result[record.key] = record;
    });
    return result;
  }

  function getTaskClaimCenterEntries(records) {
    return Object.keys(records || {}).map(function toTaskClaimEntry(key) {
      return normalizeTaskClaimRecord(records[key], key);
    }).filter(Boolean).sort(function sortTaskClaimEntries(left, right) {
      return (right.completedAt || 0) - (left.completedAt || 0) || (right.recordedAt || 0) - (left.recordedAt || 0);
    });
  }

  function filterTaskClaimCenterEntries(entries, options) {
    var query = normalizeCenterSearchQuery(options && options.query);
    var filter = String((options && options.filter) || 'all');
    return (entries || []).filter(function matchTaskClaimEntry(entry) {
      if (!matchesCenterSearch(query, [entry.taskName, entry.taskKey, entry.rewardSp, entry.sourceUrl])) return false;
      if (filter === 'all') return true;
      return entry.taskKey === filter;
    });
  }

  function getTaskAutoClaimCooldownMs(taskKey) {
    var key = getTaskClaimTaskKey(taskKey);
    if (key === 'daily') return TASK_AUTO_CLAIM_DAILY_COOLDOWN;
    if (key === 'weekly') return TASK_AUTO_CLAIM_WEEKLY_COOLDOWN;
    return TASK_AUTO_CLAIM_PROBE_RETRY_TTL;
  }

  function getLatestTaskClaimCompletedAt(records, taskKey) {
    var key = getTaskClaimTaskKey(taskKey);
    return getTaskClaimCenterEntries(records).reduce(function latestTaskClaimCompletedAt(latest, record) {
      if (!record || record.taskKey !== key) return latest;
      return Math.max(latest, Number(record.completedAt) || 0);
    }, 0);
  }

  function isTaskClaimCompletedToday(records, taskKey, now) {
    return isTimestampToday(getLatestTaskClaimCompletedAt(records, taskKey), now);
  }

  function normalizeTaskAutoClaimState(state) {
    var source = isPlainObject(state) ? state : {};
    var tasks = isPlainObject(source.tasks) ? source.tasks : {};
    var normalizedTasks = {};
    ['daily', 'weekly'].forEach(function normalizeTaskAutoClaimTask(key) {
      var item = isPlainObject(tasks[key]) ? tasks[key] : {};
      normalizedTasks[key] = {
        nextCheckAt: Math.max(0, Number(item.nextCheckAt) || 0),
        updatedAt: Math.max(0, Number(item.updatedAt) || 0),
        reason: String(item.reason || ''),
      };
    });
    return {
      nextCheckAt: Math.max(0, Number(source.nextCheckAt) || 0),
      checkedAt: Math.max(0, Number(source.checkedAt) || 0),
      updatedAt: Math.max(0, Number(source.updatedAt) || 0),
      reason: String(source.reason || ''),
      tasks: normalizedTasks,
    };
  }

  function loadTaskAutoClaimState() {
    return normalizeTaskAutoClaimState(loadMap(TASK_AUTO_CLAIM_STATE_KEY));
  }

  function saveTaskAutoClaimState(state) {
    saveMap(TASK_AUTO_CLAIM_STATE_KEY, normalizeTaskAutoClaimState(state));
  }

  function getTaskAutoClaimNextCheckAtFromRecords(records, now) {
    var currentTime = now === undefined ? Date.now() : Number(now);
    var candidates = [];
    var hasUnknownTask = false;
    ['daily', 'weekly'].forEach(function collectTaskAutoClaimNextCheck(taskKey) {
      var completedAt = getLatestTaskClaimCompletedAt(records, taskKey);
      if (taskKey === 'daily' && isTaskClaimCompletedToday(records, 'daily', currentTime)) {
        candidates.push(getNextDayStart(currentTime));
      } else if (completedAt) {
        candidates.push(completedAt + getTaskAutoClaimCooldownMs(taskKey));
      } else {
        hasUnknownTask = true;
      }
    });
    if (hasUnknownTask) candidates.push(currentTime + TASK_AUTO_CLAIM_PROBE_RETRY_TTL);
    if (!candidates.length) return currentTime + TASK_AUTO_CLAIM_PROBE_RETRY_TTL;
    return Math.max(currentTime, Math.min.apply(Math, candidates));
  }

  function getTaskAutoClaimGate(records, state, now) {
    var currentTime = now === undefined ? Date.now() : Number(now);
    var normalizedState = normalizeTaskAutoClaimState(state);
    var globalNextCheckAt = Math.max(0, Number(normalizedState.nextCheckAt) || 0);
    var dailyCompletedToday = isTaskClaimCompletedToday(records, 'daily', currentTime);
    if (globalNextCheckAt > currentTime && (normalizedState.reason !== 'success' || dailyCompletedToday)) {
      return {
        canRun: false,
        nextCheckAt: globalNextCheckAt,
        dueTaskKeys: [],
        reason: normalizedState.reason || 'global-cooldown',
      };
    }

    var dueTaskKeys = [];
    var futureChecks = [];
    ['daily', 'weekly'].forEach(function collectTaskAutoClaimGate(taskKey) {
      var completedAt = getLatestTaskClaimCompletedAt(records, taskKey);
      var taskState = normalizedState.tasks[taskKey] || {};
      var stateNextCheckAt = Number(taskState.nextCheckAt) || 0;
      if (taskKey === 'daily') {
        if (dailyCompletedToday) {
          futureChecks.push(getNextDayStart(currentTime));
        } else if (stateNextCheckAt > currentTime) {
          futureChecks.push(stateNextCheckAt);
        } else {
          dueTaskKeys.push(taskKey);
        }
        return;
      }
      var recordNextCheckAt = completedAt ? completedAt + getTaskAutoClaimCooldownMs(taskKey) : 0;
      var taskNextCheckAt = Math.max(recordNextCheckAt, stateNextCheckAt);
      if (!taskNextCheckAt || taskNextCheckAt <= currentTime) {
        dueTaskKeys.push(taskKey);
      } else {
        futureChecks.push(taskNextCheckAt);
      }
    });

    if (dueTaskKeys.length) {
      return { canRun: true, nextCheckAt: 0, dueTaskKeys: dueTaskKeys, reason: 'due' };
    }
    return {
      canRun: false,
      nextCheckAt: futureChecks.length ? Math.min.apply(Math, futureChecks) : currentTime + TASK_AUTO_CLAIM_PROBE_RETRY_TTL,
      dueTaskKeys: [],
      reason: 'task-cooldown',
    };
  }

  function rememberTaskAutoClaimCheck(reason, nextCheckAt, now) {
    var currentTime = now === undefined ? Date.now() : Number(now);
    var state = loadTaskAutoClaimState();
    state.checkedAt = currentTime;
    state.updatedAt = currentTime;
    state.reason = String(reason || 'checked');
    state.nextCheckAt = Math.max(currentTime, Number(nextCheckAt) || (currentTime + TASK_AUTO_CLAIM_PROBE_RETRY_TTL));
    saveTaskAutoClaimState(state);
    return state;
  }

  function rememberTaskAutoClaimTaskCooldown(taskKey, reason, nextCheckAt, now) {
    var currentTime = now === undefined ? Date.now() : Number(now);
    var key = getTaskClaimTaskKey(taskKey);
    if (key !== 'daily' && key !== 'weekly') return loadTaskAutoClaimState();
    var state = loadTaskAutoClaimState();
    state.checkedAt = currentTime;
    state.updatedAt = currentTime;
    state.reason = String(reason || 'task-cooldown');
    state.tasks[key] = {
      nextCheckAt: Math.max(currentTime, Number(nextCheckAt) || (currentTime + getTaskAutoClaimCooldownMs(key))),
      updatedAt: currentTime,
      reason: state.reason,
    };
    saveTaskAutoClaimState(state);
    return state;
  }

  function getTaskAutoClaimBlockedRetryAt(results, now) {
    var currentTime = now === undefined ? Date.now() : Number(now);
    var candidates = [];
    (results || []).filter(isTaskAutoClaimResultBlocked).forEach(function collectBlockedTaskAutoClaimRetry(result) {
      var taskKey = result && result.target && result.target.taskKey;
      if (taskKey === 'daily' || taskKey === 'weekly') {
        candidates.push(currentTime + getTaskAutoClaimCooldownMs(taskKey));
      }
    });
    return candidates.length ? Math.min.apply(Math, candidates) : currentTime + TASK_AUTO_CLAIM_ERROR_RETRY_TTL;
  }

  function formatTaskAutoClaimNextCheck(nextCheckAt, now) {
    var currentTime = now === undefined ? Date.now() : Number(now);
    var remainingMs = Math.max(0, Number(nextCheckAt) - currentTime);
    if (!remainingMs) return '现在';
    var hours = Math.ceil(remainingMs / (60 * 60 * 1000));
    if (hours >= 24) return Math.ceil(hours / 24) + ' 天后';
    return hours + ' 小时后';
  }

  function isTaskInProgressPageUrl(url) {
    return /(?:actions[-=]newtasks|actions=newtasks|newtasks\.html)/i.test(String(url || ''));
  }

  function hasTaskAutoClaimStartLabel(text) {
    return /申请|开始|接受|领取任务/.test(String(text || '').replace(/\s+/g, ' '));
  }

  function hasTaskAutoClaimFinishLabel(text) {
    return /领取|领奖|奖励|完成/.test(String(text || '').replace(/\s+/g, ' '));
  }

  function hasTaskAutoClaimFinishContext(text) {
    var value = String(text || '').replace(/\s+/g, ' ');
    return /领取(?:此)?奖励|领奖|已完成\s*100\s*[％%]|完成\s*100\s*[％%]/.test(value);
  }

  function getTaskAutoClaimStartJobAction(actionType, pageUrl, contextText) {
    var type = String(actionType || '');
    if (type === 'finish') return 'job2';
    if (type === 'start') return 'job';
    if (isTaskInProgressPageUrl(pageUrl) || hasTaskAutoClaimFinishContext(contextText)) return 'job2';
    return 'job';
  }

  function extractTaskAutoClaimUrl(value, pageUrl, actionType, contextText) {
    var text = String(value || '').replace(/&amp;/g, '&').trim();
    if (!text) return '';
    var startJobMatch = text.match(/\bstartjob\s*\(\s*['"]?(\d+)['"]?\s*\)/i);
    if (startJobMatch) {
      var jobAction = getTaskAutoClaimStartJobAction(actionType, pageUrl, contextText);
      try {
        return new URL('plugin.php?H_name=tasks&action=ajax&actions=' + jobAction + '&cid=' + encodeURIComponent(startJobMatch[1]), pageUrl || (typeof location !== 'undefined' ? location.href : 'https://south-plus.org/')).href;
      } catch (error) {
        return '';
      }
    }
    var quoted = text.match(/['"]([^'"]*(?:plugin|hack|job)\.php\?[^'"]*(?:H_name[-=]?tasks|H_name-tasks|tasks)[^'"]*)['"]/i);
    var direct = quoted ? quoted[1] : '';
    if (!direct) {
      var directMatch = text.match(/((?:https?:\/\/[^\s'"<>]+|\/[^\s'"<>]+|(?:plugin|hack|job)\.php\?[^\s'"<>]+)(?:H_name[-=]?tasks|H_name-tasks|tasks)[^\s'"<>]*)/i);
      direct = directMatch ? directMatch[1] : '';
    }
    if (!direct) return '';
    try {
      return new URL(direct, pageUrl || (typeof location !== 'undefined' ? location.href : 'https://south-plus.org/')).href;
    } catch (error) {
      return '';
    }
  }

  function isTaskAutoClaimNavigationText(text) {
    return /^(?:社区论坛任务|新任务选择|进行中任务|已完成任务|已失败任务)$/i.test(String(text || '').replace(/\s+/g, ' ').trim());
  }

  function getTaskAutoClaimActionType(text, href, contextText) {
    var label = String(text || '').replace(/\s+/g, ' ');
    if (hasTaskAutoClaimStartLabel(label)) return 'start';
    if (hasTaskAutoClaimFinishLabel(label)) return 'finish';
    var value = [label, href, contextText].map(function normalizeTaskAutoClaimPart(part) {
      return String(part || '').replace(/\s+/g, ' ');
    }).join(' ');
    if (/[?&]actions=job2(?:[&#]|$)|(?:^|[-_=])job2(?:\b|[-_])/i.test(value)) return 'finish';
    if (/(?:job|action)[-_=]?(?:receive|reward|draw|finish|done|get)/i.test(value)) return 'finish';
    if (/(?:job|action)[-_=]?(?:apply|accept|start|add)/i.test(value)) return 'start';
    if (/[?&]actions=job(?:[&#]|$)/i.test(value)) return 'start';
    if (hasTaskAutoClaimFinishContext(value)) return 'finish';
    if (hasTaskAutoClaimStartLabel(value)) return 'start';
    return '';
  }

  function isTaskAutoClaimCandidate(text, href, contextText) {
    var label = String(text || '').replace(/\s+/g, ' ').trim();
    var scopeText = [label, contextText].join(' ');
    if (isTaskAutoClaimNavigationText(label)) return false;
    if (!/(日常|周常|daily|weekly)/i.test(scopeText)) return false;
    return !!getTaskAutoClaimActionType(label, href, contextText);
  }

  function createTaskClaimRecord(taskName, rewardSp, completedAt, sourceUrl, source, recordedAt) {
    var record = normalizeTaskClaimRecord({
      taskName: taskName,
      rewardSp: rewardSp,
      completedAt: completedAt,
      recordedAt: recordedAt || Date.now(),
      source: source || 'site-completed',
      sourceUrl: sourceUrl || '',
    });
    if (!record) return null;
    record.key = createTaskClaimRecordKey(record);
    return record;
  }

  function parseTaskClaimRecordsFromRows(rowTexts, options) {
    var opts = options || {};
    var current = null;
    var records = [];
    (rowTexts || []).forEach(function parseTaskClaimRow(rowText) {
      var text = String(rowText || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      var rowTaskName = parseTaskClaimTaskName(text);
      var rowRewardSp = parseTaskClaimRewardSp(text);
      if ((/任务时效|奖励\s*[:：]/.test(text)) && rowTaskName) {
        current = { taskName: rowTaskName, rewardSp: rowRewardSp };
      }
      var completedAt = parseTaskClaimCompletedAt(text);
      if (!completedAt) return;
      var taskName = rowTaskName || (current && current.taskName) || '';
      if (!taskName) return;
      var rewardSp = rowRewardSp !== null ? rowRewardSp : (current && current.rewardSp !== undefined ? current.rewardSp : null);
      var record = createTaskClaimRecord(taskName, rewardSp, completedAt, opts.sourceUrl, opts.source, opts.recordedAt);
      if (record) records.push(record);
    });
    return getTaskClaimCenterEntries(pruneTaskClaimRecords(records.reduce(function collectTaskClaim(result, record) {
      result[record.key] = record;
      return result;
    }, {})));
  }

  function parseTaskClaimRecordsFromText(text, options) {
    var sourceText = String(text || '').replace(/\s+/g, ' ').trim();
    if (!sourceText) return [];
    var records = [];
    var pattern = /(周常|日常)[\s\S]*?奖励\s*[:：]\s*SP币\s*([0-9]+(?:\.[0-9]+)?)[\s\S]*?完成时间\s*(\d{4}-\d{1,2}-\d{1,2}\s*(?:AM|PM)?\s*[:：]?\s*\d{1,2}:\d{2}(?::\d{2})?)/gi;
    var match;
    var opts = options || {};
    while ((match = pattern.exec(sourceText))) {
      var completedAt = parseTaskClaimCompletedAt('完成时间 ' + match[3]);
      var record = createTaskClaimRecord(match[1], Number(match[2]), completedAt, opts.sourceUrl, opts.source, opts.recordedAt);
      if (record) records.push(record);
    }
    return getTaskClaimCenterEntries(pruneTaskClaimRecords(records.reduce(function collectTaskClaim(result, record) {
      result[record.key] = record;
      return result;
    }, {})));
  }

  function getDayStart(timestamp) {
    var date = new Date(Number(timestamp) || Date.now());
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  function getNextDayStart(timestamp) {
    return getDayStart(timestamp) + 24 * 60 * 60 * 1000;
  }

  function isTimestampToday(timestamp, now) {
    var value = Number(timestamp) || 0;
    var currentTime = now || Date.now();
    return value >= getDayStart(currentTime) && value < getNextDayStart(currentTime);
  }

  function getForumDashboardTopicKey(item) {
    var source = item || {};
    var id = parseThreadId(source.id || source.url || source.progressUrl || source.sourceUrl || '');
    if (id) return 'tid:' + id;
    var baseUrl = typeof location !== 'undefined' ? location.href : 'https://south-plus.org/';
    var url = normalizeNavigationHref(source.url || source.progressUrl || source.sourceUrl || '', baseUrl);
    if (url) return 'url:' + url.replace(/#.*$/, '').toLowerCase();
    var title = compactText(source.title || source.sourceTitle || '');
    return title ? 'title:' + title.toLowerCase() : '';
  }

  function getForumDashboardTopicTags(item) {
    var tags = mergeTagLists(item && item.tags, item && item.resourceTags);
    var text = [item && item.title, item && item.meta, item && item.sourceText].filter(Boolean).join(' ');
    inferFavoriteNavTags(text, '').forEach(function appendInferredTag(tag) {
      if (tags.indexOf(tag) === -1) tags.push(tag);
    });
    return tags;
  }

  function mergeForumDashboardTopic(target, source) {
    var next = source || {};
    if (!target.title && next.title) target.title = next.title;
    if (!target.url && next.url) target.url = next.url;
    if (!target.author && next.author) target.author = next.author;
    if (!target.meta && next.meta) target.meta = next.meta;
    target.savedAt = Math.max(Number(target.savedAt) || 0, Number(next.savedAt) || 0);
    target.progressAt = Math.max(Number(target.progressAt) || 0, Number(next.progressAt) || 0);
    target.favoriteAt = Math.max(Number(target.favoriteAt) || 0, Number(next.favoriteAt) || 0);
    target.resourceAt = Math.max(Number(target.resourceAt) || 0, Number(next.resourceAt) || 0);
    target.progressPercent = Math.max(Number(target.progressPercent) || 0, Number(next.progressPercent) || 0);
    target.isCompleted = !!(target.isCompleted || next.isCompleted);
    target.hasWatch = !!(target.hasWatch || next.hasWatch);
    target.hasHistory = !!(target.hasHistory || next.hasHistory);
    target.hasSiteFavorite = !!(target.hasSiteFavorite || next.hasSiteFavorite);
    target.resourceCount = (Number(target.resourceCount) || 0) + (Number(next.resourceCount) || 0);
    target.tags = mergeTagLists(target.tags, getForumDashboardTopicTags(next));
    target.lastAt = Math.max(target.savedAt || 0, target.progressAt || 0, target.favoriteAt || 0, target.resourceAt || 0);
    return target;
  }

  function addForumDashboardTopic(map, item) {
    var key = getForumDashboardTopicKey(item);
    if (!key) return null;
    if (!map[key]) {
      map[key] = {
        key: key,
        id: parseThreadId(item && (item.id || item.url || item.progressUrl || item.sourceUrl)),
        title: '',
        url: '',
        author: '',
        meta: '',
        savedAt: 0,
        progressAt: 0,
        favoriteAt: 0,
        resourceAt: 0,
        progressPercent: 0,
        isCompleted: false,
        hasWatch: false,
        hasHistory: false,
        hasSiteFavorite: false,
        resourceCount: 0,
        tags: [],
        lastAt: 0,
      };
    }
    return mergeForumDashboardTopic(map[key], item);
  }

  function getForumDashboardTopicScore(item, now) {
    var topic = item || {};
    var currentTime = Number(now) || Date.now();
    var score = 0;
    if (topic.hasSiteFavorite && !topic.isCompleted) score += 30;
    if (topic.hasWatch && !topic.isCompleted) score += 25;
    if (topic.progressAt >= currentTime - 7 * 24 * 60 * 60 * 1000) score += 18;
    if (topic.progressPercent > 0 && topic.progressPercent < 100) score += 16;
    if (topic.resourceCount > 0) score += 15 + Math.min(10, topic.resourceCount * 2);
    if (isTimestampToday(topic.savedAt, currentTime) || isTimestampToday(topic.favoriteAt, currentTime)) score += 12;
    if (topic.tags && topic.tags.length) score += Math.min(12, topic.tags.length * 3);
    if (topic.isCompleted) score -= 18;
    if (topic.lastAt && topic.lastAt < currentTime - 30 * 24 * 60 * 60 * 1000) score -= 10;
    return score;
  }

  function formatForumDashboardRelativeTime(timestamp, now) {
    var value = Number(timestamp) || 0;
    if (!value) return '';
    var diff = Math.max(0, (Number(now) || Date.now()) - value);
    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return Math.max(1, Math.round(diff / 60 / 1000)) + ' 分钟前';
    if (diff < 24 * 60 * 60 * 1000) return Math.max(1, Math.round(diff / 60 / 60 / 1000)) + ' 小时前';
    if (diff < 30 * 24 * 60 * 60 * 1000) return Math.max(1, Math.round(diff / 24 / 60 / 60 / 1000)) + ' 天前';
    return formatShortTime(value);
  }

  function getForumDashboardRequestSummary(requestState, now) {
    var source = requestState || scriptRequestState || {};
    var queueCount = Array.isArray(source.queue) ? source.queue.length : Math.max(0, Number(source.queueCount) || 0);
    var cooldownRemainingMs = Math.max(0, Number(source.cooldownUntil || 0) - (Number(now) || Date.now()));
    return {
      queueCount: queueCount,
      cooldownRemainingMs: cooldownRemainingMs,
      status: cooldownRemainingMs > 0 ? '冷却中' : (queueCount > 0 || source.running ? '排队中' : '正常'),
      detail: '队列 ' + queueCount + ' / 冷却 ' + Math.ceil(cooldownRemainingMs / 1000) + ' 秒',
    };
  }

  function getForumDashboardActivityItems(report, now) {
    var items = [];
    (report.worthReviewing || []).slice(0, 2).forEach(function appendWorthActivity(topic) {
      items.push({
        type: topic.resourceCount ? 'resource' : 'progress',
        title: (topic.progressPercent ? '继续阅读 ' : '回看 ') + topic.title,
        meta: topic.meta || topic.reason || '',
        time: formatForumDashboardRelativeTime(topic.lastAt, now),
      });
    });
    (report.resources || []).slice(0, 2).forEach(function appendResourceActivity(entry) {
      items.push({
        type: 'resource',
        title: '资源待处理：' + (entry.sourceTitle || entry.label || '未命名资源'),
        meta: [entry.label, entry.provider, entry.statusLabel].filter(Boolean).join(' · '),
        time: formatForumDashboardRelativeTime(entry.updatedAt || entry.savedAt, now),
      });
    });
    if (report.request.status !== '正常') {
      items.push({ type: 'request', title: '后台请求' + report.request.status, meta: report.request.detail, time: '现在' });
    }
    return items.slice(0, 4);
  }

  function getForumDashboardTagStats(topics, resources) {
    var counts = {};
    (topics || []).forEach(function collectTopicTags(topic) {
      (topic.tags || []).forEach(function countTag(tag) {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    (resources || []).forEach(function collectResourceTag(entry) {
      var label = entry.type === 'cloud' ? '网盘' : entry.label;
      if (label) counts[label] = (counts[label] || 0) + 1;
    });
    return Object.keys(counts).map(function mapTagStat(tag) {
      return { label: tag, count: counts[tag] };
    }).sort(function sortTagStats(left, right) {
      return right.count - left.count || left.label.localeCompare(right.label, 'zh-Hans-CN');
    }).slice(0, 4);
  }

  function collectForumDashboardReport(data, now) {
    var source = data || {};
    var currentTime = Number(now) || Date.now();
    var origin = typeof location !== 'undefined' && location.origin ? location.origin : 'https://south-plus.org';
    var todayStart = getDayStart(currentTime);
    var readMap = source.read || {};
    var progressMap = source.progress || {};
    var watchMap = source.watch || {};
    var favoriteSeen = normalizeFavoriteNavSeenMap(source.favoriteSeen || {});
    var resources = getResourceCenterEntries(source.resources || {});
    var topics = {};

    getWatchCenterEntries(watchMap, progressMap).forEach(function collectWatchTopic(entry) {
      addForumDashboardTopic(topics, Object.assign({}, entry, {
        hasWatch: true,
        url: entry.progressUrl || entry.url,
        meta: [entry.progressText, entry.nextFloorLabel ? '续读 ' + entry.nextFloorLabel : '', entry.tagText].filter(Boolean).join(' · '),
      }));
    });

    getHistoryCenterEntries(progressMap).forEach(function collectHistoryTopic(entry) {
      addForumDashboardTopic(topics, Object.assign({}, entry, {
        hasHistory: true,
        url: entry.url,
        meta: [entry.progressText, entry.nextFloorLabel ? '续读 ' + entry.nextFloorLabel : '', entry.tagText].filter(Boolean).join(' · '),
      }));
    });

    resources.forEach(function collectResourceTopic(entry) {
      addForumDashboardTopic(topics, {
        id: parseThreadId(entry.sourceUrl),
        title: entry.sourceTitle || entry.sourceUrl || entry.label,
        url: entry.sourceUrl || entry.url,
        author: entry.author,
        sourceText: entry.sourceText,
        resourceTags: entry.tags,
        resourceCount: 1,
        resourceAt: entry.updatedAt || entry.savedAt,
        meta: [entry.label, entry.provider, entry.statusLabel].filter(Boolean).join(' · '),
      });
    });

    Object.keys(favoriteSeen).forEach(function markFavoriteTopic(id) {
      addForumDashboardTopic(topics, {
        id: id,
        hasSiteFavorite: true,
        favoriteAt: favoriteSeen[id],
      });
    });

    var topicList = Object.keys(topics).map(function finalizeTopic(key) {
      var topic = topics[key];
      topic.title = topic.title || (topic.id ? '收藏主题 #' + topic.id : '未命名主题');
      topic.url = topic.url || (topic.id ? origin + '/read.php?tid-' + topic.id + '.html' : '');
      topic.score = getForumDashboardTopicScore(topic, currentTime);
      var reasons = [];
      if (topic.hasSiteFavorite) reasons.push('站内收藏');
      if (topic.hasWatch) reasons.push('稍后看');
      if (topic.resourceCount) reasons.push('资源 ' + topic.resourceCount);
      if (topic.progressPercent) reasons.push('进度 ' + topic.progressPercent + '%');
      if (topic.tags && topic.tags.length) reasons.push('标签 ' + formatTags(topic.tags.slice(0, 3)));
      topic.reason = reasons.join(' · ') || '本地记录';
      return topic;
    }).filter(function keepScoredTopic(topic) {
      return topic.score > 0 && topic.title;
    }).sort(function sortDashboardTopics(left, right) {
      return right.score - left.score || right.lastAt - left.lastAt || String(left.title).localeCompare(String(right.title), 'zh-Hans-CN');
    });

    var todayViewed = {};
    Object.keys(readMap).forEach(function collectReadToday(id) {
      if (Number(readMap[id]) >= todayStart) todayViewed[id] = true;
    });
    Object.keys(progressMap).forEach(function collectProgressToday(id) {
      if (Number(progressMap[id] && progressMap[id].updatedAt) >= todayStart) todayViewed[id] = true;
    });

    var watchEntries = getWatchCenterEntries(watchMap, progressMap);
    var siteFavoriteToday = Object.keys(favoriteSeen).filter(function countFavoriteToday(id) {
      return Number(favoriteSeen[id]) >= todayStart;
    }).length;
    var watchToday = watchEntries.filter(function countWatchToday(entry) {
      return Number(entry.savedAt) >= todayStart;
    }).length;
    var unreadFavorites = topicList.filter(function countUnreadFavorite(topic) {
      return (topic.hasSiteFavorite || topic.hasWatch) && !topic.isCompleted;
    }).length;
    var watchBacklog = watchEntries.filter(function countWatchBacklog(entry) {
      return !entry.isCompleted;
    }).length;
    var resourceToday = resources.filter(function countResourceToday(entry) {
      return Math.max(Number(entry.updatedAt) || 0, Number(entry.savedAt) || 0) >= todayStart;
    }).length;
    var request = getForumDashboardRequestSummary(source.requestState, currentTime);
    var tagStats = getForumDashboardTagStats(topicList, resources);
    var report = {
      stats: {
        todayViewed: Object.keys(todayViewed).length,
        favoriteAdded: siteFavoriteToday + watchToday,
        unreadFavorites: unreadFavorites,
        resourceAdded: resourceToday,
        watchBacklog: watchBacklog,
        requestStatus: request.status,
      },
      request: request,
      worthReviewing: topicList.slice(0, 5),
      resources: resources.slice(0, 4),
      tagStats: tagStats,
      backlogStats: [
        { label: '稍后看', count: watchBacklog },
        { label: '未读收藏', count: unreadFavorites },
        { label: '待处理资源', count: resources.filter(function countTodoResource(entry) { return entry.status === 'todo' || entry.status === 'saved'; }).length },
        { label: '失败请求', count: getAutoBuyCenterEntries(source.autoBuyAttempts || {}).filter(function countFailedAttempt(entry) { return entry.status === 'failed'; }).length },
      ],
    };
    report.activities = getForumDashboardActivityItems(report, currentTime);
    return report;
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

  function normalizeCommandPaletteFilter(value) {
    var text = String(value || 'all');
    return /^(all|navigate|center|resource|setting|action)$/.test(text) ? text : 'all';
  }

  function getCommandPaletteCategoryLabel(value) {
    var labels = {
      navigate: '导航',
      center: '我的中心',
      resource: '资源',
      setting: '设置',
      action: '页面动作',
    };
    return labels[normalizeCommandPaletteFilter(value)] || '全部';
  }

  function getCommandPaletteSourceLabel(entry) {
    var item = entry || {};
    return item.source || getCommandPaletteCategoryLabel(item.category);
  }

  function createCommandPaletteEntry(config) {
    var source = config || {};
    var title = compactText(source.title || source.label || '未命名命令');
    if (!title) return null;
    var category = normalizeCommandPaletteFilter(source.category);
    var id = String(source.id || [category, title, source.href || source.key || source.panelId || source.recordId || ''].join('|'));
    return {
      id: id,
      category: category,
      icon: compactText(source.icon || title.slice(0, 1)).slice(0, 2),
      title: title,
      description: compactText(source.description || source.meta || getCommandPaletteCategoryLabel(category)),
      meta: compactText(source.meta || ''),
      source: compactText(source.source || getCommandPaletteCategoryLabel(category)),
      target: compactText(source.target || ''),
      risk: compactText(source.risk || '低'),
      href: String(source.href || ''),
      action: String(source.action || ''),
      key: String(source.key || ''),
      panelId: String(source.panelId || ''),
      recordId: String(source.recordId || ''),
      resourceKey: String(source.resourceKey || ''),
      keywords: compactText(source.keywords || ''),
      order: Number(source.order) || 0,
      payload: source.payload || null,
    };
  }

  function getCommandPaletteEntrySearchText(entry) {
    var item = entry || {};
    return compactText([
      item.title,
      item.description,
      item.meta,
      item.source,
      item.target,
      item.href,
      item.keywords,
      getCommandPaletteCategoryLabel(item.category),
    ].join(' ')).toLowerCase();
  }

  function getCommandPaletteConfigCategory(config) {
    var item = config || {};
    if (item.panelId) return 'center';
    if (item.key || item.kind === 'settings') return 'setting';
    if (item.group === '页面导航' || item.href) return 'navigate';
    return 'action';
  }

  function getCommandPaletteConfigAction(config) {
    var item = config || {};
    if (item.href) return 'open-url';
    if (item.panelId) return 'open-panel';
    if (item.kind === 'settings') return 'open-settings';
    if (item.key) return 'toggle-setting';
    if (typeof item.onClick === 'function') return 'run-action';
    return '';
  }

  function createCommandPaletteEntryFromToolboxConfig(config, index) {
    if (!config || config.show === false) return null;
    var category = getCommandPaletteConfigCategory(config);
    return createCommandPaletteEntry({
      id: 'toolbox|' + (config.key || config.panelId || config.kind || config.href || config.label || index),
      category: category,
      icon: config.text || config.label,
      title: config.label || config.title || config.text,
      description: config.description || config.title || '',
      source: config.group || getCommandPaletteCategoryLabel(category),
      target: config.href || config.panelId || config.key || '',
      risk: /清空|删除|购买/.test(config.label || config.title || '') ? '中' : '低',
      href: config.href,
      action: getCommandPaletteConfigAction(config),
      key: config.key,
      panelId: config.panelId,
      keywords: [config.group, config.title, config.description].join(' '),
      order: 100 + index,
      payload: config,
    });
  }

  function createCommandPaletteNavigationEntries(configs) {
    var seen = {};
    return (configs || []).map(function mapNavigationCommand(config, index) {
      if (!config || !config.href || !config.label) return null;
      var key = normalizeNavigationHref(config.href, typeof location !== 'undefined' ? location.href : 'https://south-plus.org/').replace(/#.*$/, '') + '|' + normalizeNavigationLabel(config.label);
      if (seen[key]) return null;
      seen[key] = true;
      return createCommandPaletteEntry({
        id: 'nav|' + key,
        category: 'navigate',
        icon: '导',
        title: config.label,
        description: [config.section || '导航中心', config.parentLabel, config.title && config.title !== config.label ? config.title : ''].filter(Boolean).join(' · '),
        source: config.section || '导航中心',
        target: config.href,
        href: config.href,
        action: 'open-url',
        keywords: [config.parentLabel, config.title].join(' '),
        order: 300 + index,
      });
    }).filter(Boolean);
  }

  function createCommandPaletteWatchEntries(watch, progress) {
    return getWatchCenterEntries(watch, progress).slice(0, 40).map(function mapWatchCommand(entry, index) {
      return createCommandPaletteEntry({
        id: 'watch|' + entry.id,
        category: 'center',
        icon: '存',
        title: entry.title,
        description: ['稍后看', entry.progressText, entry.nextFloorLabel, entry.tagText].filter(Boolean).join(' · '),
        source: '稍后看',
        target: entry.progressUrl || entry.url,
        href: entry.progressUrl || entry.url,
        action: 'open-watch-entry',
        recordId: entry.id,
        keywords: [entry.floorLabel, entry.nextFloorLabel, entry.tagText].join(' '),
        order: 500 + index,
      });
    });
  }

  function createCommandPaletteHistoryEntries(progress) {
    return getHistoryCenterEntries(progress).slice(0, 40).map(function mapHistoryCommand(entry, index) {
      return createCommandPaletteEntry({
        id: 'history|' + entry.id,
        category: 'center',
        icon: '历',
        title: entry.title,
        description: ['最近浏览', entry.progressText, entry.nextFloorLabel, entry.tagText].filter(Boolean).join(' · '),
        source: '最近浏览',
        target: entry.url,
        href: entry.url,
        action: 'open-history-entry',
        recordId: entry.id,
        keywords: [entry.floorLabel, entry.nextFloorLabel, entry.tagText].join(' '),
        order: 560 + index,
      });
    });
  }

  function createCommandPaletteResourceEntries(resources) {
    return getResourceCenterEntries(resources).slice(0, 60).map(function mapResourceCommand(entry, index) {
      return createCommandPaletteEntry({
        id: 'resource|' + entry.key,
        category: 'resource',
        icon: '源',
        title: entry.sourceTitle || entry.label || entry.url,
        description: [entry.label, entry.provider, entry.statusLabel, entry.accessCode ? ('提取码 ' + entry.accessCode) : '', entry.tagText].filter(Boolean).join(' · '),
        source: '资源工作台',
        target: entry.url,
        href: entry.url,
        action: 'open-resource-url',
        resourceKey: entry.key,
        keywords: [entry.url, entry.sourceUrl, entry.floorLabel, entry.author, entry.note, entry.text, entry.tagText].join(' '),
        order: 620 + index,
      });
    });
  }

  function createCommandPalettePageEntries(items) {
    var seen = {};
    return (items || []).map(function mapPageCommand(item, index) {
      if (!item || !item.title || !item.href) return null;
      var href = String(item.href || '');
      var key = href.replace(/#.*$/, '') + '|' + item.title;
      if (seen[key]) return null;
      seen[key] = true;
      return createCommandPaletteEntry({
        id: 'page|' + key,
        category: item.category || 'navigate',
        icon: item.icon || '页',
        title: item.title,
        description: item.description || '当前页面结果',
        source: item.source || '当前页面',
        target: href,
        href: href,
        action: 'open-url',
        keywords: item.keywords || '',
        order: 700 + index,
      });
    }).filter(Boolean);
  }

  function collectCommandPaletteEntries(data) {
    var source = data || {};
    var entries = [];
    (source.toolboxConfigs || []).forEach(function appendToolboxCommand(config, index) {
      var entry = createCommandPaletteEntryFromToolboxConfig(config, index);
      if (entry) entries.push(entry);
    });
    (source.centerConfigs || []).forEach(function appendCenterCommand(config, index) {
      var entry = createCommandPaletteEntryFromToolboxConfig(config, 200 + index);
      if (entry) entries.push(entry);
    });
    (source.settingsConfigs || []).forEach(function appendSettingsCommand(config, index) {
      var entry = createCommandPaletteEntryFromToolboxConfig(config, 300 + index);
      if (entry) entries.push(entry);
    });
    entries = entries
      .concat(createCommandPaletteNavigationEntries(source.navigationConfigs || []))
      .concat(createCommandPaletteWatchEntries(source.watch || {}, source.progress || {}))
      .concat(createCommandPaletteHistoryEntries(source.progress || {}))
      .concat(createCommandPaletteResourceEntries(source.resources || {}))
      .concat(createCommandPalettePageEntries(source.pageItems || []));
    return entries.filter(Boolean).sort(function sortCommandEntries(left, right) {
      return (left.order || 0) - (right.order || 0) || left.title.localeCompare(right.title, 'zh-Hans-CN');
    });
  }

  function getCommandPaletteQueryScore(entry, query) {
    var term = normalizeCenterSearchQuery(query);
    if (!term) return 0;
    var title = String(entry && entry.title || '').toLowerCase();
    if (title === term) return -30;
    if (title.indexOf(term) === 0) return -20;
    if (title.indexOf(term) >= 0) return -10;
    return 0;
  }

  function filterCommandPaletteEntries(entries, options) {
    var query = normalizeCenterSearchQuery(options && options.query);
    var filter = normalizeCommandPaletteFilter(options && options.filter);
    return (entries || []).filter(function matchCommandEntry(entry) {
      if (filter !== 'all' && entry.category !== filter) return false;
      return matchesCenterSearch(query, [getCommandPaletteEntrySearchText(entry)]);
    }).sort(function sortFilteredCommandEntries(left, right) {
      return getCommandPaletteQueryScore(left, query) - getCommandPaletteQueryScore(right, query) ||
        (left.order || 0) - (right.order || 0) ||
        left.title.localeCompare(right.title, 'zh-Hans-CN');
    });
  }

  function formatCommandPaletteResultSummary(visibleEntries, allEntries, options) {
    var visibleCount = (visibleEntries || []).length;
    var allCount = (allEntries || []).length;
    var filter = normalizeCommandPaletteFilter(options && options.filter);
    var prefix = filter === 'all' ? '全部命令' : getCommandPaletteCategoryLabel(filter);
    return prefix + ' · ' + visibleCount + ' / ' + allCount + ' 项';
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
    var resourceText = (data.resourceBadges || []).map(function mapFilterResourceBadge(badge) {
      return [badge.type, badge.label].filter(Boolean).join(' ');
    }).join(' ').toLowerCase();
    var combined = title + ' ' + author + ' ' + resourceText;

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

  function markPreviewImageLoaded(image) {
    if (!image || !image.dataset) return;
    image.dataset.spxPreviewReady = '1';
    image.dataset.spxPreviewLoaded = '1';
  }

  function preparePreviewImageReveal(image) {
    if (!image || !image.dataset) return image;
    image.dataset.spxPreviewReady = '0';

    var markLoaded = function markLoadedPreviewImage() {
      markPreviewImageLoaded(image);
      image.removeEventListener('load', markLoaded);
      image.removeEventListener('error', markLoaded);
    };

    image.addEventListener('load', markLoaded);
    image.addEventListener('error', markLoaded);
    if (image.src && image.complete && image.naturalWidth) markLoaded();
    return image;
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

  function getPreviewImageMetaText(image, index) {
    var item = image || {};
    return ['图 ' + ((Number(index) || 0) + 1), item.floorLabel, item.author].filter(Boolean).join(' · ');
  }

  function formatPreviewImageMarkdownLinks(images) {
    var seen = {};
    return (images || [])
      .map(function formatPreviewMarkdownItem(item, index) {
        var url = getPreviewImageSource(item);
        if (!url || seen[url]) return '';
        seen[url] = true;
        return '- ![' + getPreviewImageMetaText(item, index) + '](' + url + ')';
      })
      .filter(Boolean)
      .join('\n');
  }

  function formatPreviewImageLinksByFloor(images) {
    var groups = {};
    var order = [];
    var seen = {};
    (images || []).forEach(function collectPreviewFloor(item, index) {
      var url = getPreviewImageSource(item);
      if (!url || seen[url]) return;
      seen[url] = true;
      var label = item && item.floorLabel ? item.floorLabel : '未知楼层';
      var author = item && item.author ? item.author : '';
      var key = label + '\n' + author;
      if (!groups[key]) {
        groups[key] = {
          label: label,
          author: author,
          urls: [],
        };
        order.push(key);
      }
      groups[key].urls.push('#' + (index + 1) + ' ' + url);
    });
    return order
      .map(function formatPreviewFloorGroup(key) {
        var group = groups[key];
        return '[' + [group.label, group.author].filter(Boolean).join(' · ') + ']\n' + group.urls.join('\n');
      })
      .join('\n\n');
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

  function padPreviewDownloadPart(value, size) {
    return String(Math.max(0, Number(value) || 0)).padStart(size || 2, '0');
  }

  function formatPreviewImageArchiveFileName(timestamp) {
    var rawTime = Number(timestamp);
    var date = new Date(isFinite(rawTime) ? rawTime : Date.now());
    return [
      'southplus-images-',
      date.getFullYear(),
      padPreviewDownloadPart(date.getMonth() + 1),
      padPreviewDownloadPart(date.getDate()),
      '-',
      padPreviewDownloadPart(date.getHours()),
      padPreviewDownloadPart(date.getMinutes()),
      '.zip',
    ].join('');
  }

  function sanitizePreviewDownloadName(value) {
    return String(value || '')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 72) || 'image';
  }

  function getPreviewImageDownloadExtension(url, contentType) {
    var type = String(contentType || '').toLowerCase();
    if (/image\/png/.test(type)) return '.png';
    if (/image\/webp/.test(type)) return '.webp';
    if (/image\/gif/.test(type)) return '.gif';
    if (/image\/(?:jpeg|jpg|pjpeg)/.test(type)) return '.jpg';
    if (/image\/bmp/.test(type)) return '.bmp';
    try {
      var pathname = new URL(String(url || ''), 'https://south-plus.org/').pathname;
      var match = pathname.match(/\.([a-z0-9]{2,5})$/i);
      if (match && /^(?:jpg|jpeg|png|webp|gif|bmp|avif)$/.test(match[1].toLowerCase())) {
        return match[1].toLowerCase() === 'jpeg' ? '.jpg' : '.' + match[1].toLowerCase();
      }
    } catch (error) {}
    return '.jpg';
  }

  function formatPreviewImageDownloadFileName(item, index, contentType) {
    var image = item || {};
    var prefix = padPreviewDownloadPart((Number(index) || 0) + 1, 3);
    var meta = sanitizePreviewDownloadName([image.floorLabel, image.author].filter(Boolean).join('-'));
    return prefix + '-' + meta + getPreviewImageDownloadExtension(getPreviewImageSource(image), contentType);
  }

  function getHeaderValue(headers, name) {
    var headerName = String(name || '').toLowerCase();
    if (!headers || !headerName) return '';
    if (typeof headers.get === 'function') return headers.get(name) || '';
    var lines = String(headers || '').split(/\r?\n/);
    for (var index = 0; index < lines.length; index += 1) {
      var parts = lines[index].split(':');
      if (parts.length < 2) continue;
      if (parts.shift().trim().toLowerCase() === headerName) return parts.join(':').trim();
    }
    return '';
  }

  function isCrossOriginUrl(url, pageUrl) {
    try {
      var base = pageUrl || (typeof location !== 'undefined' ? location.href : 'https://south-plus.org/');
      return new URL(String(url || ''), base).origin !== new URL(base).origin;
    } catch (error) {
      return false;
    }
  }

  function getPrivilegedRequestApi() {
    if (typeof GM_xmlhttpRequest === 'function') return GM_xmlhttpRequest;
    if (typeof GM === 'object' && GM && typeof GM.xmlHttpRequest === 'function') return GM.xmlHttpRequest;
    return null;
  }

  function shouldUsePrivilegedPreviewDownload(url, pageUrl, hasPrivilegedRequest) {
    var available = hasPrivilegedRequest === undefined ? !!getPrivilegedRequestApi() : !!hasPrivilegedRequest;
    return available && isCrossOriginUrl(url, pageUrl);
  }

  function getPrivilegedResponseBlob(response) {
    if (typeof Blob === 'undefined') return null;
    var contentType = getHeaderValue(response && response.responseHeaders, 'content-type') || '';
    var body = response && response.response;
    if (body instanceof Blob) return { blob: body, contentType: contentType || body.type || '' };
    if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) {
      return { blob: new Blob([body], { type: contentType || 'application/octet-stream' }), contentType: contentType };
    }
    if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(body)) {
      return { blob: new Blob([body], { type: contentType || 'application/octet-stream' }), contentType: contentType };
    }
    if (typeof body === 'string' || response && typeof response.responseText === 'string') {
      return { blob: new Blob([body || response.responseText], { type: contentType || 'application/octet-stream' }), contentType: contentType };
    }
    return null;
  }

  function getPreviewDownloadStatusSummary(counts) {
    var data = counts || {};
    var total = Math.max(0, Number(data.total) || 0);
    var done = Math.max(0, Number(data.done) || 0);
    var failed = Math.max(0, Number(data.failed) || 0);
    var active = Math.max(0, Number(data.active) || 0);
    var queued = Math.max(0, Number(data.queued) || 0);
    if (!total) return '没有可下载图片';
    if (data.packing) return '正在打包 ' + done + ' 张图片';
    if (active || queued) return '下载中 ' + done + ' / ' + total + (failed ? ' · ' + failed + ' 张失败' : '');
    if (failed) return '已完成 ' + done + ' / ' + total + ' · ' + failed + ' 张失败可跳过';
    return '已完成 ' + done + ' / ' + total + ' · 准备 ZIP';
  }

  function formatPreviewDownloadReport(entries) {
    var rows = ['SouthPlus Lite 预览图下载报告', '生成时间：' + new Date().toLocaleString(), ''];
    var failed = (entries || []).filter(function keepFailedPreviewDownload(entry) {
      return entry && entry.status === 'failed';
    });
    rows.push('失败图片：' + failed.length + ' 张');
    failed.forEach(function appendFailedPreviewDownload(entry) {
      rows.push('');
      rows.push('#' + (Number(entry.index) + 1 || 1));
      rows.push('地址：' + (entry.src || getPreviewImageSource(entry.item)));
      rows.push('楼层：' + ((entry.item && entry.item.floorLabel) || '未知楼层'));
      rows.push('作者：' + ((entry.item && entry.item.author) || '未知作者'));
      rows.push('重试：' + (entry.attempts || 0) + ' / ' + PREVIEW_DOWNLOAD_MAX_RETRIES);
      rows.push('原因：' + (entry.error || '下载失败'));
    });
    return rows.join('\n');
  }

  var zipCrcTable = null;

  function getZipCrcTable() {
    if (zipCrcTable) return zipCrcTable;
    zipCrcTable = [];
    for (var i = 0; i < 256; i += 1) {
      var crc = i;
      for (var bit = 0; bit < 8; bit += 1) {
        crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
      }
      zipCrcTable[i] = crc >>> 0;
    }
    return zipCrcTable;
  }

  function getZipCrc32(bytes) {
    var table = getZipCrcTable();
    var crc = 0xffffffff;
    var data = bytes || [];
    for (var i = 0; i < data.length; i += 1) {
      crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function encodeZipText(text) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(String(text || ''));
    var encoded = unescape(encodeURIComponent(String(text || '')));
    var bytes = new Uint8Array(encoded.length);
    for (var i = 0; i < encoded.length; i += 1) bytes[i] = encoded.charCodeAt(i);
    return bytes;
  }

  function getZipDosDateTime(timestamp) {
    var date = new Date(timestamp || Date.now());
    var year = Math.max(1980, date.getFullYear());
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    };
  }

  function setZipUint16(view, offset, value) {
    view.setUint16(offset, value, true);
  }

  function setZipUint32(view, offset, value) {
    view.setUint32(offset, value >>> 0, true);
  }

  function getBlobBytes(blob) {
    if (blob instanceof Uint8Array) return Promise.resolve(blob);
    if (blob && typeof blob.arrayBuffer === 'function') {
      return blob.arrayBuffer().then(function convertBlobArrayBuffer(buffer) {
        return new Uint8Array(buffer);
      });
    }
    return new Promise(function readBlobWithFileReader(resolve, reject) {
      if (typeof FileReader === 'undefined' || !blob) {
        resolve(new Uint8Array(0));
        return;
      }
      var reader = new FileReader();
      reader.onload = function handleBlobRead() { resolve(new Uint8Array(reader.result || [])); };
      reader.onerror = function handleBlobReadError() { reject(reader.error || new Error('读取文件失败')); };
      reader.readAsArrayBuffer(blob);
    });
  }

  function createPreviewZipBlob(files) {
    if (typeof Blob === 'undefined' || typeof Uint8Array === 'undefined' || typeof DataView === 'undefined') {
      return Promise.reject(new Error('当前浏览器不支持 ZIP 打包'));
    }
    var sourceFiles = (files || []).filter(function keepZipFile(file) {
      return file && file.name && file.blob;
    });
    return Promise.all(sourceFiles.map(function normalizeZipFile(file) {
      return getBlobBytes(file.blob).then(function attachZipBytes(bytes) {
        return {
          name: String(file.name || 'image'),
          bytes: bytes,
          timestamp: file.timestamp || Date.now(),
        };
      });
    })).then(function buildZipFromBytes(normalizedFiles) {
      var chunks = [];
      var central = [];
      var offset = 0;
      normalizedFiles.forEach(function appendZipFile(file) {
        var nameBytes = encodeZipText(file.name);
        var data = file.bytes || new Uint8Array(0);
        var crc = getZipCrc32(data);
        var timeParts = getZipDosDateTime(file.timestamp);
        var header = new Uint8Array(30 + nameBytes.length);
        var view = new DataView(header.buffer);
        setZipUint32(view, 0, 0x04034b50);
        setZipUint16(view, 4, 20);
        setZipUint16(view, 6, 0x0800);
        setZipUint16(view, 8, 0);
        setZipUint16(view, 10, timeParts.time);
        setZipUint16(view, 12, timeParts.date);
        setZipUint32(view, 14, crc);
        setZipUint32(view, 18, data.length);
        setZipUint32(view, 22, data.length);
        setZipUint16(view, 26, nameBytes.length);
        setZipUint16(view, 28, 0);
        header.set(nameBytes, 30);
        chunks.push(header, data);
        central.push({ nameBytes: nameBytes, crc: crc, size: data.length, offset: offset, time: timeParts.time, date: timeParts.date });
        offset += header.length + data.length;
      });

      var centralOffset = offset;
      central.forEach(function appendCentralZipRecord(record) {
        var header = new Uint8Array(46 + record.nameBytes.length);
        var view = new DataView(header.buffer);
        setZipUint32(view, 0, 0x02014b50);
        setZipUint16(view, 4, 20);
        setZipUint16(view, 6, 20);
        setZipUint16(view, 8, 0x0800);
        setZipUint16(view, 10, 0);
        setZipUint16(view, 12, record.time);
        setZipUint16(view, 14, record.date);
        setZipUint32(view, 16, record.crc);
        setZipUint32(view, 20, record.size);
        setZipUint32(view, 24, record.size);
        setZipUint16(view, 28, record.nameBytes.length);
        setZipUint16(view, 30, 0);
        setZipUint16(view, 32, 0);
        setZipUint16(view, 34, 0);
        setZipUint16(view, 36, 0);
        setZipUint32(view, 38, 0);
        setZipUint32(view, 42, record.offset);
        header.set(record.nameBytes, 46);
        chunks.push(header);
        offset += header.length;
      });
      var centralSize = offset - centralOffset;
      var footer = new Uint8Array(22);
      var footerView = new DataView(footer.buffer);
      setZipUint32(footerView, 0, 0x06054b50);
      setZipUint16(footerView, 4, 0);
      setZipUint16(footerView, 6, 0);
      setZipUint16(footerView, 8, central.length);
      setZipUint16(footerView, 10, central.length);
      setZipUint32(footerView, 12, centralSize);
      setZipUint32(footerView, 16, centralOffset);
      setZipUint16(footerView, 20, 0);
      chunks.push(footer);
      return new Blob(chunks, { type: 'application/zip' });
    });
  }

  function hasThreadRowHiddenClass(row) {
    if (!row || !row.classList) return false;
    return THREAD_ROW_HIDDEN_CLASSES.some(function hasHiddenClass(className) {
      return row.classList.contains(className);
    });
  }

  function syncThreadRowDisplay(row) {
    if (!row || !row.style) return;
    if (hasThreadRowHiddenClass(row)) {
      setImportantStyle(row, 'display', 'none');
      return;
    }
    if (row.dataset && row.dataset.spxThreadListRow === '1') {
      setImportantStyle(row, 'display', 'grid');
      return;
    }
    if (typeof row.style.removeProperty === 'function') {
      row.style.removeProperty('display');
    } else {
      row.style.display = '';
    }
  }

  function setThreadRowHiddenClass(row, className, hidden) {
    if (!row || !row.classList || !className) return;
    row.classList.toggle(className, !!hidden);
    syncThreadRowDisplay(row);
  }

  function isVisibleThreadRow(row) {
    if (!row) return false;
    if (hasThreadRowHiddenClass(row)) return false;
    if (row.offsetParent === null) return false;
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
      var fallbackBase = 'https://south-plus.org/';
      var base = pageUrl || (typeof location !== 'undefined' ? location.href : fallbackBase);
      if (base && !/^[a-z][a-z0-9+.-]*:/i.test(String(base))) {
        base = new URL(String(base), fallbackBase).href;
      }
      return new URL(text, base || fallbackBase).href;
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

  function normalizeResourceStorageType(type, url) {
    var value = String(type || '').toLowerCase();
    if (RESOURCE_CATEGORIES[value]) return value;
    if (/^(?:baidu|quark|pikpak)$/.test(value)) return 'cloud';
    return classifyResourceLink(url);
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
    var normalizedLinks = dedupeResourceLinks(links).map(function normalizeJumpResource(item) {
      var type = normalizeResourceStorageType(item && item.type, item && item.url);
      if (!type || type === item.type) return item;
      return Object.assign({}, item, {
        type: type,
        label: getResourceDisplayLabel({ url: item.url, type: type }),
      });
    });
    return dedupeResourceLinks(normalizedLinks).filter(function keepJumpResource(item) {
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
    var type = normalizeResourceStorageType(data.type, url);
    if (!url || !type) return '';
    return type + '|' + url.toLowerCase();
  }

  function normalizeResourceRecord(record, key) {
    var source = record || {};
    var url = normalizeResourceUrl(source.url, source.pageUrl || source.sourceUrl);
    var type = normalizeResourceStorageType(source.type, url);
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

  function getResourceBadgeDefinition(type) {
    return RESOURCE_BADGE_DEFINITIONS[type] || null;
  }

  function getResourceBadgeOrderIndex(type) {
    var index = RESOURCE_BADGE_ORDER.indexOf(type);
    return index === -1 ? RESOURCE_BADGE_ORDER.length : index;
  }

  function getCloudResourceBadgeType(value) {
    var text = String(value || '');
    if (/百度|baidu/i.test(text)) return 'baidu';
    if (/夸克|quark/i.test(text)) return 'quark';
    if (/pikpak/i.test(text)) return 'pikpak';
    return 'cloud';
  }

  function getResourceBadgeFromResourceItem(item, source) {
    var data = item || {};
    var type = data.type || classifyResourceLink(data.url);
    var badgeType = type === 'cloud'
      ? getCloudResourceBadgeType([data.provider, data.label, data.url].filter(Boolean).join(' '))
      : type;
    var definition = getResourceBadgeDefinition(badgeType);
    if (!definition) return null;
    return {
      type: badgeType,
      label: definition.label,
      source: source || 'resource',
      guessed: false,
    };
  }

  function mergeResourceBadges() {
    var map = {};
    Array.prototype.slice.call(arguments).forEach(function mergeBadgeList(list) {
      (list || []).forEach(function mergeBadge(badge) {
        if (!badge || !badge.type || !getResourceBadgeDefinition(badge.type)) return;
        var previous = map[badge.type];
        if (!previous || (previous.guessed && !badge.guessed)) {
          map[badge.type] = Object.assign({}, badge, {
            label: badge.label || getResourceBadgeDefinition(badge.type).label,
            guessed: !!badge.guessed,
          });
        }
      });
    });
    return Object.keys(map)
      .sort(function sortResourceBadges(left, right) {
        return getResourceBadgeOrderIndex(left) - getResourceBadgeOrderIndex(right);
      })
      .map(function mapResourceBadge(type) {
        return map[type];
      });
  }

  function getResourceBadgesFromItems(items, source) {
    return mergeResourceBadges((items || []).map(function mapResourceBadgeItem(item) {
      return getResourceBadgeFromResourceItem(item, source);
    }));
  }

  function inferResourceBadgesFromText(text) {
    var source = String(text || '');
    var badges = RESOURCE_BADGE_ORDER.map(function inferResourceBadge(type) {
      var definition = getResourceBadgeDefinition(type);
      if (!definition || !definition.pattern.test(source)) return null;
      return {
        type: type,
        label: definition.label,
        source: 'title',
        guessed: true,
      };
    });
    var merged = mergeResourceBadges(badges);
    if (merged.some(function hasSpecificCloudBadge(badge) {
      return badge.type === 'baidu' || badge.type === 'quark' || badge.type === 'pikpak';
    })) {
      return merged.filter(function dropGenericCloudBadge(badge) {
        return badge.type !== 'cloud';
      });
    }
    return merged;
  }

  function getThreadResourceBadgeIndex(resources) {
    var index = {};
    getResourceCenterEntries(resources || {}).forEach(function indexResourceEntry(entry) {
      var tid = parseThreadId(entry.sourceUrl || entry.sourceTitle || '');
      var badge = getResourceBadgeFromResourceItem(entry, 'resource');
      if (!tid || !badge) return;
      index[tid] = mergeResourceBadges(index[tid], [badge]);
    });
    return index;
  }

  function getThreadResourceBadges(item, badgeIndex, previewPayload) {
    var data = item || {};
    var index = badgeIndex || {};
    var titleBadges = inferResourceBadgesFromText(data.title || '');
    var previewBadges = previewPayload && previewPayload.resourceBadges
      ? (previewPayload.resourceBadges || []).map(function markPreviewBadge(badge) {
        return Object.assign({}, badge, { source: badge.source || 'preview', guessed: !!badge.guessed });
      })
      : [];
    return mergeResourceBadges(index[data.id], previewBadges, titleBadges);
  }

  function getResourceBadgeTypes(badges) {
    return (badges || []).map(function mapBadgeType(badge) {
      return badge.type;
    }).filter(Boolean);
  }

  function getResourceRailTypeKey(item) {
    var data = item || {};
    var badge = getResourceBadgeFromResourceItem(data, 'resource');
    if (badge && badge.type) return badge.type;
    var type = data.type || classifyResourceLink(data.url);
    if (type === 'cloud') {
      return getCloudResourceBadgeType([data.provider, data.label, data.url].filter(Boolean).join(' '));
    }
    return getResourceBadgeDefinition(type) ? type : 'external';
  }

  function getResourceRailTypeLabel(type) {
    var definition = getResourceBadgeDefinition(type);
    if (definition && definition.label) return definition.label;
    return RESOURCE_CATEGORIES[type] || '资源';
  }

  function getResourceRailEntries(links, resources) {
    var library = pruneResourceLibrary(resources || {});
    return getJumpResourceLinks(links).map(function mapResourceRailEntry(item, index) {
      var key = getResourceLibraryKey(item);
      var savedRecord = key && library[key] ? normalizeResourceRecord(library[key], key) : null;
      var source = savedRecord || item || {};
      var type = getResourceRailTypeKey(source);
      var status = savedRecord ? normalizeResourceStatus(savedRecord.status) : 'todo';
      var accessCode = String(source.accessCode || item.accessCode || '');
      var floorLabel = String(item.floorLabel || source.floorLabel || '');
      var author = String(item.author || source.author || '');
      return {
        key: key || ('resource-rail-' + index),
        url: item.url || source.url || '',
        type: type,
        typeLabel: getResourceRailTypeLabel(type),
        label: item.label || source.label || getResourceDisplayLabel(source),
        accessCode: accessCode,
        floorLabel: floorLabel,
        author: author,
        postIndex: Number(item.postIndex) || 0,
        status: status,
        statusLabel: savedRecord ? getResourceStatusLabel(status) : '待保存',
        saved: !!savedRecord,
        sourceTitle: String(source.sourceTitle || ''),
        sourceUrl: String(source.sourceUrl || item.sourceUrl || item.pageUrl || ''),
        sourceText: [source.sourceTitle, floorLabel, author].filter(Boolean).join(' · '),
        note: String((savedRecord && savedRecord.note) || ''),
        tags: normalizeResourceTags(savedRecord && savedRecord.tags),
      };
    });
  }

  function filterResourceRailEntries(entries, filter) {
    var type = String(filter || 'all');
    if (type === 'all') return (entries || []).slice();
    return (entries || []).filter(function keepResourceRailEntry(entry) {
      return entry && entry.type === type;
    });
  }

  function formatResourceRailSummary(entries) {
    var floors = {};
    var codes = 0;
    var todo = 0;
    var saved = 0;
    (entries || []).forEach(function countResourceRailEntry(entry) {
      if (!entry) return;
      if (entry.floorLabel) floors[entry.floorLabel] = true;
      if (entry.accessCode) codes += 1;
      if (entry.saved) saved += 1;
      if (!entry.saved || normalizeResourceStatus(entry.status) === 'todo') todo += 1;
    });
    return {
      total: (entries || []).length,
      floors: Object.keys(floors).length,
      codes: codes,
      todo: todo,
      saved: saved,
    };
  }

  function formatResourceRailSummaryText(entries) {
    var summary = formatResourceRailSummary(entries);
    return summary.total + ' 条 · ' + summary.floors + ' 个楼层 · ' + summary.codes + ' 个口令 · 待处理 ' + summary.todo;
  }

  function formatResourceRailCodes(entries) {
    return (entries || []).filter(function hasResourceRailCode(entry) {
      return entry && entry.accessCode;
    }).map(function formatResourceRailCode(entry) {
      return [
        '[' + (entry.typeLabel || entry.label || '资源') + ']',
        entry.floorLabel,
        entry.author,
        entry.url,
        '提取码 ' + entry.accessCode,
      ].filter(Boolean).join(' ');
    }).join('\n');
  }

  function getAvailableResourceRailFilterTypes(entries) {
    var seen = {};
    (entries || []).forEach(function collectResourceRailType(entry) {
      if (entry && entry.type && getResourceBadgeDefinition(entry.type)) seen[entry.type] = true;
    });
    return RESOURCE_BADGE_ORDER.filter(function keepResourceRailType(type) {
      return !!seen[type];
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
    if (record.status === 'buying') {
      var buyingAt = Number(record.updatedAt) || 0;
      var buyingNow = now === undefined ? Date.now() : Number(now);
      return !buyingAt || (buyingNow - buyingAt) <= AUTO_BUY_BUYING_TTL;
    }
    return record.status === 'done' || record.status === 'failed';
  }

  function shouldRetryAutoBuyAttempt(record) {
    var data = record || {};
    if (data.status !== 'failed') return false;
    return /购买后仍存在购买按钮|原站仍保留/.test(String(data.message || data.error || ''));
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

  function getAutoBuyDoneAttemptForThread(attempts, threadId) {
    var tid = parseThreadId(threadId);
    if (!tid) return null;
    return Object.keys(attempts || {}).reduce(function findLatestAutoBuyDoneAttempt(latest, key) {
      var record = attempts[key] || {};
      var keyTid = String(key || '').split(':')[0];
      if (keyTid !== tid || record.status !== 'done') return latest;
      var current = Object.assign({ key: key }, record);
      if (!latest || (Number(current.updatedAt) || 0) > (Number(latest.updatedAt) || 0)) return current;
      return latest;
    }, null);
  }

  function formatAutoBuyNavSuccessDetail(record) {
    var data = record || {};
    var parts = ['自动购买已完成'];
    if (data.price !== undefined && isFinite(Number(data.price))) parts.push('价格 ' + Number(data.price) + ' SP');
    if (data.resourceSummary) parts.push('资源：' + data.resourceSummary);
    if (data.message) parts.push(data.message);
    return parts.join(' · ');
  }

  function normalizeAutoBuyResponseText(value) {
    return compactText(String(value || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '));
  }

  function isAutoBuyPurchaseResponseSuccessful(value) {
    var text = normalizeAutoBuyResponseText(value);
    return /(?:购买|支付|操作|處理|处理).{0,12}(?:成功|完成|已完成)|(?:已|已经|已經)购买|success/i.test(text);
  }

  function getAutoBuyPurchaseResponseFailureReason(value) {
    var text = normalizeAutoBuyResponseText(value);
    if (!text || isAutoBuyPurchaseResponseSuccessful(text)) return '';
    if (/(?:余额|SP|积分|金币|权限|验证|verify|登录|登入|非法|无效|失效|失败|错误|不存在).{0,16}(?:不足|失败|错误|无效|失效|过期|錯誤|失敗)|(?:请|請).{0,8}(?:登录|登入)|(?:失败|错误|錯誤|失敗)/i.test(text)) {
      return text.slice(0, 80) || '购买请求失败';
    }
    return '';
  }

  function isAutoBuyResidualTargetAcceptable(context, residualTarget, resourceLinks, purchaseResult) {
    if (!residualTarget) return true;
    var price = Number(context && context.target && context.target.price);
    if (price === 0) return true;
    if ((resourceLinks || []).length > 0) return true;
    return isAutoBuyPurchaseResponseSuccessful(purchaseResult);
  }

  function getAutoBuyResidualButtonNote(context, residualTarget, resourceLinks, purchaseResult) {
    if (!residualTarget || !isAutoBuyResidualTargetAcceptable(context, residualTarget, resourceLinks, purchaseResult)) return '';
    var price = Number(context && context.target && context.target.price);
    if (price === 0) return '原站仍保留 0 SP 购买按钮';
    if ((resourceLinks || []).length > 0) return '原站仍保留购买按钮，但刷新后已识别到资源';
    return '原站仍保留购买按钮，但购买接口已返回成功';
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
    if (/\/thread(?:_new)?\.php\?fid[=-]\d+/.test(text)) return 'forum';
    if (/\/search2?\.php(?:[?#].*)?$/.test(text)) return 'search';
    if (/\/(?:u|profile|userpay|message)\.php(?:[?#].*)?$/.test(text)) return 'profile';
    if (/\/(?:hack|plugin)\.php/i.test(text) && /(?:H_name|h_name)[=-]?tasks|tasks/i.test(text)) return 'task';
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

  function hasForumThreadList(root) {
    if (!root || typeof root.querySelectorAll !== 'function') return true;
    var hasListRows = qsa('td[id^="td_"]', root).some(function hasThreadTitle(cell) {
      return parseThreadId(cell.id) && !!qs('a[id^="a_ajax_"]', cell);
    });
    if (hasListRows) return true;
    return qsa('#wall .stream li a[href*="read.php?tid"]', root).some(function hasGalleryThread(link) {
      return !!parseThreadId(link.getAttribute('href') || link.href);
    });
  }

  function shouldUseForumDashboard(url, root) {
    return detectPageType(url) === 'forum' && hasForumThreadList(root);
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

  function shouldUseTaskPage(url) {
    return detectPageType(url) === 'task';
  }

  function shouldUseHomeDashboard(settings, url) {
    return !!(settings && settings.homeDashboard) && detectPageType(url) === 'home';
  }

  function shouldUseModuleNavigation(settings, url, root) {
    var type = detectPageType(url);
    if (type === 'home') return shouldUseHomeDashboard(settings, url);
    if (type === 'forum') return shouldUseForumDashboard(url, root);
    if (type === 'read') return shouldUseReaderMode(settings, url) || shouldUseImmersiveRead(settings, url);
    if (type === 'search') return true;
    if (type === 'task') return true;
    if (type === 'profile') return true;
    return false;
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
      'nightMode',
      'unifiedPreviewGallery',
      'forumDashboard',
      'compactRead',
      'foldQuotes',
      'hideUserProfile',
      'networkFriendly',
      'autoTaskClaim',
      'autoBuyPost',
      'unreadOnly',
      'onlyOriginalAuthor',
    ];

    allKeys.forEach(function keepUsefulSetting(key) {
      if (key === 'cleanMode' && shouldShowToolbarFeature('clean')) keys.push(key);
      if (key === 'readerMode' && shouldShowToolbarAction('reader', url, root)) keys.push(key);
      if (key === 'immersiveRead' && shouldShowToolbarAction('immersiveRead', url, root)) keys.push(key);
      if (key === 'nightMode') keys.push(key);
      if (key === 'unifiedPreviewGallery' && shouldShowToolbarAction('previewGallery', url, root)) keys.push(key);
      if (key === 'forumDashboard' && shouldShowToolbarAction('homeDashboard', url, root)) keys.push(key);
      if (key === 'compactRead' && detectPageType(url) === 'read') keys.push(key);
      if (key === 'foldQuotes' && detectPageType(url) === 'read') keys.push(key);
      if (key === 'hideUserProfile' && detectPageType(url) === 'read') keys.push(key);
      if (key === 'networkFriendly') keys.push(key);
      if (key === 'autoTaskClaim') keys.push(key);
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
    var galleryForum = href.match(/thread_new\.php\?fid[=-](\d+)/);
    var forum = href.match(/thread\.php\?fid[=-](\d+)/);

    if (thread) {
      return parsed.origin + '/read.php?tid-' + thread[1] + '-page-' + targetPage + '.html';
    }

    if (galleryForum) {
      return buildForumModePageUrl(href, targetPage, true);
    }

    if (forum) {
      return buildForumModePageUrl(href, targetPage, false);
    }

    return href;
  }

  function buildForumModePageUrl(url, page, galleryMode) {
    var parsed = new URL(String(url || ''), 'https://south-plus.org/');
    var fid = getCurrentForumId(parsed.href);
    var targetPage = Math.max(1, Number(page) || currentPageNumber(parsed.href) || 1);
    if (!fid) return parsed.href;
    if (galleryMode) {
      return parsed.origin + '/thread_new.php?fid-' + fid + '-page-' + targetPage + '.html';
    }
    if (targetPage === 1) return parsed.origin + '/thread.php?fid-' + fid + '.html';
    return parsed.origin + '/thread.php?fid-' + fid + '-page-' + targetPage + '.html';
  }

  function getForumListModeUrl(url, page) {
    return buildForumModePageUrl(url, page || currentPageNumber(url), false);
  }

  function getForumGalleryModeUrl(url, page) {
    return buildForumModePageUrl(url, page || currentPageNumber(url), true);
  }

  function isNetworkFriendlyMode(settings) {
    return !settings || settings.networkFriendly !== false;
  }

  function getScriptRequestPolicyConfig(policy) {
    var source = policy || {};
    var mode = source.mode || source.type || 'background';
    var friendly = source.networkFriendly !== false;
    var minDelay = Number(source.minDelay);
    var priority = Number(source.priority);
    var cooldownMs = Number(source.cooldownMs);

    if (!(minDelay >= 0)) {
      if (mode === 'action' || mode === 'interactive') minDelay = friendly ? 850 : 300;
      else if (mode === 'preview') minDelay = friendly ? 1200 : 500;
      else minDelay = friendly ? 1500 : 650;
    }

    if (!isFinite(priority)) {
      if (mode === 'action' || mode === 'interactive') priority = 30;
      else if (mode === 'preview') priority = 20;
      else priority = 5;
    }

    if (!(cooldownMs > 0)) cooldownMs = friendly ? 20 * 1000 : 10 * 1000;

    return {
      mode: mode,
      label: source.label || '脚本请求',
      priority: priority,
      minDelay: minDelay,
      cooldownMs: cooldownMs,
      networkFriendly: friendly,
      allowDuringCooldown: !!source.allowDuringCooldown,
    };
  }

  function isScriptRateLimitStatus(status) {
    var code = Number(status);
    return code === 429 || code === 503 || code === 504 || code === 520;
  }

  function isScriptRateLimitHtml(html) {
    var text = String(html || '').replace(/\s+/g, ' ').slice(0, 4000);
    return /(?:1\s*秒内操作频繁|操作频繁|访问过于频繁|请求过于频繁|系统繁忙|504\s*Gateway|Gateway\s*Timeout|HTTP\s*504|Error\s*code\s*520|HTTP\s*520|Web\s*server\s*is\s*returning\s*an\s*unknown\s*error)/i.test(text);
  }

  function createScriptRateLimitError(message) {
    var error = new Error(message || '请求过于频繁，脚本已暂停后台请求，请稍后再试。');
    error.spxRateLimited = true;
    return error;
  }

  function getScriptRequestDelay(policy, state, now) {
    var config = getScriptRequestPolicyConfig(policy);
    var source = state || {};
    var currentTime = now === undefined ? Date.now() : Number(now);
    var cooldownDelay = config.allowDuringCooldown ? 0 : Math.max(0, Number(source.cooldownUntil || 0) - currentTime);
    var intervalDelay = Math.max(0, Number(source.lastStartedAt || 0) + config.minDelay - currentTime);
    return Math.max(cooldownDelay, intervalDelay);
  }

  function isScriptRequestCoolingDown(now) {
    return Number(scriptRequestState.cooldownUntil || 0) > (now === undefined ? Date.now() : Number(now));
  }

  function getRateLimitErrorMessage(policy, reason) {
    var config = getScriptRequestPolicyConfig(policy);
    var label = config.label || '脚本请求';
    var detail = reason ? '：' + reason : '';
    return label + '触发站点限流' + detail + '，已暂停后台请求，请稍后再试。';
  }

  function markScriptRequestCooldown(policy, reason) {
    var config = getScriptRequestPolicyConfig(policy);
    scriptRequestState.cooldownUntil = Math.max(
      Number(scriptRequestState.cooldownUntil || 0),
      Date.now() + config.cooldownMs
    );
    return createScriptRateLimitError(getRateLimitErrorMessage(config, reason));
  }

  function getSchedulerTimerHost() {
    if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') return window;
    return typeof globalThis !== 'undefined' ? globalThis : null;
  }

  function pumpScriptRequestQueue() {
    var timerHost = getSchedulerTimerHost();
    if (scriptRequestState.running || !scriptRequestState.queue.length) return;
    var next = scriptRequestState.queue[0];
    var delay = getScriptRequestDelay(next.policy, scriptRequestState, Date.now());

    if (delay > 0) {
      if (!timerHost || typeof timerHost.setTimeout !== 'function' || scriptRequestState.timer) return;
      scriptRequestState.timer = timerHost.setTimeout(function resumeScriptRequestQueue() {
        scriptRequestState.timer = null;
        pumpScriptRequestQueue();
      }, delay);
      return;
    }

    scriptRequestState.queue.shift();
    scriptRequestState.running = true;
    scriptRequestState.lastStartedAt = Date.now();
    Promise.resolve()
      .then(next.task)
      .then(function resolveScriptRequest(value) {
        scriptRequestState.running = false;
        next.resolve(value);
        pumpScriptRequestQueue();
      }, function rejectScriptRequest(error) {
        scriptRequestState.running = false;
        next.reject(error);
        pumpScriptRequestQueue();
      });
  }

  function scheduleScriptRequest(task, policy) {
    if (typeof Promise !== 'function') return task();
    var config = getScriptRequestPolicyConfig(policy);
    return new Promise(function enqueueScriptRequest(resolve, reject) {
      var timerHost = getSchedulerTimerHost();
      scriptRequestState.sequence += 1;
      scriptRequestState.queue.push({
        task: task,
        policy: config,
        resolve: resolve,
        reject: reject,
        sequence: scriptRequestState.sequence,
      });
      scriptRequestState.queue.sort(function sortScriptRequestQueue(left, right) {
        if (right.policy.priority !== left.policy.priority) return right.policy.priority - left.policy.priority;
        return left.sequence - right.sequence;
      });
      if (scriptRequestState.timer && timerHost && typeof timerHost.clearTimeout === 'function') {
        timerHost.clearTimeout(scriptRequestState.timer);
        scriptRequestState.timer = null;
      }
      pumpScriptRequestQueue();
    });
  }

  function requestWithPolicy(url, options, policy) {
    var fetchImpl = policy && policy.fetch;
    if (!fetchImpl && typeof window !== 'undefined' && typeof window.fetch === 'function') {
      fetchImpl = window.fetch.bind(window);
    }
    if (typeof fetchImpl !== 'function') return Promise.reject(new Error('当前浏览器不支持 fetch'));
    var config = getScriptRequestPolicyConfig(policy);
    return scheduleScriptRequest(function executeScriptFetch() {
      return fetchImpl(url, options).then(function inspectScriptResponse(response) {
        if (response && isScriptRateLimitStatus(response.status)) {
          throw markScriptRequestCooldown(config, 'HTTP ' + response.status);
        }
        return response;
      });
    }, config);
  }

  function readScriptResponseText(response, policy) {
    if (!response || typeof response.text !== 'function') return Promise.resolve('');
    return response.text().then(function inspectScriptResponseText(html) {
      if (isScriptRateLimitHtml(html)) throw markScriptRequestCooldown(policy, '页面提示频繁或 504');
      return html;
    });
  }

  function getCachedThreadPreview(url, now) {
    var key = String(url || '');
    var entry = threadPreviewCache[key];
    if (!entry) return null;
    if (Number(entry.expiresAt || 0) <= (now === undefined ? Date.now() : Number(now))) {
      delete threadPreviewCache[key];
      threadPreviewCacheOrder = threadPreviewCacheOrder.filter(function keepThreadPreviewKey(item) {
        return item !== key;
      });
      return null;
    }
    return cloneJson(entry.payload, entry.payload);
  }

  function rememberThreadPreview(url, payload, now, ttl) {
    var key = String(url || '');
    if (!key || !payload) return;
    if (!threadPreviewCache[key]) threadPreviewCacheOrder.push(key);
    threadPreviewCache[key] = {
      expiresAt: (now === undefined ? Date.now() : Number(now)) + (Number(ttl) > 0 ? Number(ttl) : THREAD_PREVIEW_CACHE_TTL),
      payload: cloneJson(payload, payload),
    };
    while (threadPreviewCacheOrder.length > THREAD_PREVIEW_CACHE_LIMIT) {
      delete threadPreviewCache[threadPreviewCacheOrder.shift()];
    }
  }

  function getCachedUserSpBalance(now) {
    if (Number(spBalanceCache.expiresAt || 0) <= (now === undefined ? Date.now() : Number(now))) return null;
    return spBalanceCache.value === null ? null : Number(spBalanceCache.value);
  }

  function rememberUserSpBalance(balance, now) {
    var value = Number(balance);
    if (!isFinite(value)) return;
    spBalanceCache.value = value;
    spBalanceCache.expiresAt = (now === undefined ? Date.now() : Number(now)) + SP_BALANCE_CACHE_TTL;
  }

  function clearUserSpBalanceCache() {
    spBalanceCache = { value: null, expiresAt: 0 };
  }

  function getNavigationRefreshKey(urls) {
    return (urls || []).map(function normalizeRefreshUrl(url) {
      return String(url || '').replace(/#.*$/, '');
    }).join('|');
  }

  function shouldRefreshNavigationPool(urls, now) {
    var key = getNavigationRefreshKey(urls);
    var refreshedAt = Number(loadMap(NAVIGATION_REFRESH_KEY)[key] || 0);
    return !key || !refreshedAt || ((now === undefined ? Date.now() : Number(now)) - refreshedAt) >= NAVIGATION_REFRESH_TTL;
  }

  function rememberNavigationPoolRefresh(urls, now) {
    var key = getNavigationRefreshKey(urls);
    if (!key) return;
    var data = loadMap(NAVIGATION_REFRESH_KEY);
    data[key] = now === undefined ? Date.now() : Number(now);
    var keys = Object.keys(data).sort(function sortNavigationRefresh(left, right) {
      return Number(data[right] || 0) - Number(data[left] || 0);
    });
    keys.slice(20).forEach(function pruneNavigationRefresh(item) {
      delete data[item];
    });
    saveMap(NAVIGATION_REFRESH_KEY, data);
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
    settings.moduleNavDensity = normalizeModuleNavDensity(settings.moduleNavDensity);
    settings.immersiveFontSize = 16;
    settings.autoBuyMaxSp = Math.max(0, Number(settings.autoBuyMaxSp) || 0);
    settings.titleKeywords = normalizeListValue(settings.titleKeywords, parseLineList);
    settings.authorKeywords = normalizeListValue(settings.authorKeywords, parseLineList);
    settings.quickReplies = normalizeListValue(settings.quickReplies, parseQuickReplyList);
    return settings;
  }

  function getSettingsPresetDefinitions() {
    return {
      light: {
        label: '轻量',
        description: '减少后台和视觉增强，保留基础清爽阅读。',
        values: {
          cleanMode: true,
          readerMode: true,
          immersiveRead: false,
          unifiedPreviewGallery: false,
          forumDashboard: false,
          compactRead: true,
          networkFriendly: true,
        },
      },
      resource: {
        label: '资源',
        description: '强化图集、资源识别、仪表盘和工作台入口。',
        values: {
          cleanMode: true,
          readerMode: true,
          immersiveRead: true,
          unifiedPreviewGallery: true,
          forumDashboard: true,
          compactRead: true,
          networkFriendly: true,
        },
      },
      reading: {
        label: '阅读',
        description: '聚焦帖子正文、进度续读和长引用折叠。',
        values: {
          cleanMode: true,
          readerMode: true,
          immersiveRead: true,
          unifiedPreviewGallery: true,
          forumDashboard: false,
          compactRead: false,
          foldQuotes: true,
          hideUserProfile: false,
          networkFriendly: true,
        },
      },
    };
  }

  function applySettingsPreset(settings, presetKey) {
    var presets = getSettingsPresetDefinitions();
    var preset = presets[String(presetKey || '')];
    if (!preset) return normalizeSettings(settings);
    var nextSettings = Object.assign({}, settings || {}, preset.values || {});
    return normalizeSettings(nextSettings);
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
        threadUpdates: pruneThreadUpdates(copyStorageMap(source.threadUpdates)),
        autoBuyAttempts: pruneAutoBuyAttempts(copyStorageMap(source.autoBuyAttempts)),
        taskClaims: pruneTaskClaimRecords(copyStorageMap(source.taskClaims)),
        resources: pruneResourceLibrary(copyStorageMap(source.resources)),
        navigation: normalizeNavigationPool(source.navigation),
        navigationPins: normalizeNavigationPinMap(source.navigationPins),
        navigationUsage: normalizeNavigationUsageMap(source.navigationUsage),
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
      threadUpdates: source.threadUpdates,
      autoBuyAttempts: source.autoBuyAttempts || source.autoBuy,
      taskClaims: source.taskClaims,
      resources: source.resources,
      navigation: source.navigation,
      navigationPins: source.navigationPins,
      navigationUsage: source.navigationUsage,
    }, payload.exportedAt);
  }

  function collectBackupPayload(settings, state) {
    return createBackupPayload({
      settings: settings,
      read: state && state.read,
      watch: state && state.watch,
      progress: state && state.progress,
      threadUpdates: state && state.threadUpdates ? state.threadUpdates : loadThreadUpdates(),
      autoBuyAttempts: loadAutoBuyAttempts(),
      taskClaims: loadTaskClaimRecords(),
      resources: state && state.resources,
      navigation: loadNavigationPool(),
      navigationPins: loadNavigationPins(),
      navigationUsage: loadNavigationUsage(),
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
      createStorageUsageEntry(THREAD_UPDATE_KEY, '新回复追踪', source.threadUpdates, countMapItems(source.threadUpdates), THREAD_UPDATE_LIMIT),
      createStorageUsageEntry(AUTO_BUY_KEY, '自动购买记录', source.autoBuyAttempts, countMapItems(source.autoBuyAttempts), AUTO_BUY_ATTEMPT_LIMIT),
      createStorageUsageEntry(TASK_CLAIM_KEY, '任务领取记录', source.taskClaims, countMapItems(source.taskClaims), TASK_CLAIM_RECORD_LIMIT),
      createStorageUsageEntry(RESOURCE_KEY, '资源库', source.resources, countMapItems(source.resources), RESOURCE_LIMIT),
      createStorageUsageEntry(NAVIGATION_KEY, '导航池', source.navigation, countMapItems(source.navigation), NAVIGATION_POOL_LIMIT),
      createStorageUsageEntry(NAVIGATION_PIN_KEY, '导航置顶', source.navigationPins, countMapItems(source.navigationPins), 0),
      createStorageUsageEntry(NAVIGATION_USAGE_KEY, '导航排序', source.navigationUsage, countMapItems(source.navigationUsage), NAVIGATION_USAGE_LIMIT),
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

  function getInvalidTaskClaimKeys(records) {
    var source = records || {};
    return Object.keys(source).filter(function isInvalidTaskClaim(key) {
      return !normalizeTaskClaimRecord(source[key], key);
    });
  }

  function getInvalidResourceKeys(resources) {
    var source = resources || {};
    return Object.keys(source).filter(function isInvalidResource(key) {
      return !normalizeResourceRecord(source[key], key);
    });
  }

  function getInvalidThreadUpdateKeys(updates) {
    var source = updates || {};
    return Object.keys(source).filter(function isInvalidThreadUpdate(key) {
      return !normalizeThreadUpdateRecord(source[key], key);
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
    var threadUpdates = copyStorageMap(source.threadUpdates);
    var autoBuyAttempts = copyStorageMap(source.autoBuyAttempts || source.autoBuy);
    var taskClaims = copyStorageMap(source.taskClaims);
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
    var invalidThreadUpdateKeys = getInvalidThreadUpdateKeys(threadUpdates);
    var invalidAutoBuyKeys = getInvalidAutoBuyKeys(autoBuyAttempts);
    var invalidTaskClaimKeys = getInvalidTaskClaimKeys(taskClaims);
    var invalidResourceKeys = getInvalidResourceKeys(resources);

    return {
      counts: {
        titleKeywords: settings.titleKeywords.length,
        authorKeywords: settings.authorKeywords.length,
        quickReplies: settings.quickReplies.length,
        read: countMapItems(read),
        watch: countMapItems(watch),
        progress: countMapItems(progress),
        threadUpdates: countMapItems(pruneThreadUpdates(threadUpdates)),
        autoBuyAttempts: countMapItems(autoBuyAttempts),
        taskClaims: countMapItems(pruneTaskClaimRecords(taskClaims)),
        resources: countMapItems(pruneResourceLibrary(resources)),
      },
      autoBuyStatusCounts: autoBuyStatusCounts,
      duplicateWatchKeys: duplicateWatchKeys,
      duplicateProgressKeys: duplicateProgressKeys,
      staleProgressKeys: staleProgressKeys,
      orphanProgressKeys: getOrphanProgressKeys(progress, read, watch),
      invalidProgressKeys: invalidProgressKeys,
      invalidThreadUpdateKeys: invalidThreadUpdateKeys,
      invalidAutoBuyKeys: invalidAutoBuyKeys,
      invalidTaskClaimKeys: invalidTaskClaimKeys,
      invalidResourceKeys: invalidResourceKeys,
      cleanupCount:
        duplicateWatchKeys.length +
        duplicateProgressKeys.length +
        staleProgressKeys.length +
        invalidProgressKeys.length +
        invalidThreadUpdateKeys.length +
        invalidAutoBuyKeys.length +
        invalidTaskClaimKeys.length +
        invalidResourceKeys.length,
    };
  }

  function cleanupDataHealthPayload(data, now) {
    var source = data || {};
    var settings = normalizeSettings(source.settings);
    var read = copyStorageMap(source.read);
    var watch = copyStorageMap(source.watch);
    var progress = copyStorageMap(source.progress);
    var threadUpdates = copyStorageMap(source.threadUpdates);
    var autoBuyAttempts = copyStorageMap(source.autoBuyAttempts || source.autoBuy);
    var taskClaims = copyStorageMap(source.taskClaims);
    var resources = copyStorageMap(source.resources);
    var before = collectDataHealthReport({
      settings: settings,
      read: read,
      watch: watch,
      progress: progress,
      threadUpdates: threadUpdates,
      autoBuyAttempts: autoBuyAttempts,
      taskClaims: taskClaims,
      resources: resources,
    }, now);

    before.duplicateWatchKeys.forEach(function removeDuplicateWatch(key) {
      delete watch[key];
    });
    before.duplicateProgressKeys.concat(before.staleProgressKeys, before.invalidProgressKeys).forEach(function removeBadProgress(key) {
      delete progress[key];
    });
    before.invalidThreadUpdateKeys.forEach(function removeBadThreadUpdate(key) {
      delete threadUpdates[key];
    });
    before.invalidAutoBuyKeys.forEach(function removeBadAutoBuy(key) {
      delete autoBuyAttempts[key];
    });
    before.invalidTaskClaimKeys.forEach(function removeBadTaskClaim(key) {
      delete taskClaims[key];
    });
    before.invalidResourceKeys.forEach(function removeBadResource(key) {
      delete resources[key];
    });

    var payload = createBackupPayload({
      settings: settings,
      read: read,
      watch: watch,
      progress: progress,
      threadUpdates: threadUpdates,
      autoBuyAttempts: autoBuyAttempts,
      taskClaims: taskClaims,
      resources: resources,
      navigation: source.navigation,
      navigationPins: source.navigationPins,
      navigationUsage: source.navigationUsage,
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
      '任务领取记录 ' + (counts.taskClaims || 0),
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
    if (data.invalidThreadUpdateKeys && data.invalidThreadUpdateKeys.length) warnings.push('异常新回复追踪 ' + data.invalidThreadUpdateKeys.length);
    if (data.invalidAutoBuyKeys && data.invalidAutoBuyKeys.length) warnings.push('异常购买记录 ' + data.invalidAutoBuyKeys.length);
    if (data.invalidTaskClaimKeys && data.invalidTaskClaimKeys.length) warnings.push('异常任务领取记录 ' + data.invalidTaskClaimKeys.length);
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

  function normalizeNavigationHref(href, baseUrl) {
    var value = String(href || '').trim();
    if (!value || /^javascript:/i.test(value)) return '';
    try {
      return new URL(value, baseUrl || (typeof location !== 'undefined' ? location.href : 'https://south-plus.org/')).href;
    } catch (error) {
      return value;
    }
  }

  function getNavigationItemKey(section, label, href) {
    var cleanHref = String(href || '').replace(/#.*$/, '').toLowerCase();
    return [String(section || '导航'), String(label || '').toLowerCase(), cleanHref].join('|');
  }

  function isForumGalleryModeUrl(url) {
    return /(?:^|\/)thread_new\.php\?fid[=-]?\d+/i.test(String(url || ''));
  }

  function shouldKeepNavigationLabel(label, options) {
    var normalized = normalizeNavigationLabel(label);
    if (!normalized) return false;
    if (/图墙模式/.test(normalized) && !(options && options.allowForumViewSwitch)) return false;
    return true;
  }

  function isPersistentNavigationSection(section) {
    return ['子栏目', '版块导航'].indexOf(String(section || '子栏目')) !== -1;
  }

  function normalizePersistentNavigationConfig(config, baseUrl, fallbackOrder) {
    if (!config) return null;
    var label = normalizeNavigationLabel(config.label || config.title);
    var href = normalizeNavigationHref(config.href, baseUrl);
    if (!shouldKeepNavigationLabel(label) || !href || config.transient) return null;
    var canonicalLabel = getCanonicalForumNavigationLabel(label, href);
    if (canonicalLabel) label = canonicalLabel;
    if (label.length > 32) label = label.slice(0, 31) + '…';
    var section = config.persistSection || config.section || '子栏目';
    if (!isPersistentNavigationSection(section)) return null;
    return {
      section: section,
      parentLabel: normalizeNavigationLabel(config.parentLabel || ''),
      label: label,
      href: href,
      title: canonicalLabel || normalizeNavigationLabel(config.title || label),
      className: config.className || '',
      order: Math.max(0, Number(config.order !== undefined ? config.order : fallbackOrder) || 0),
      updatedAt: Math.max(0, Number(config.updatedAt) || Date.now()),
    };
  }

  function normalizeNavigationPool(value) {
    var source = value || {};
    var result = {};
    var entries = Array.isArray(source)
      ? source
      : Object.keys(source).map(function mapNavigationEntry(key) {
        return source[key];
      });
    entries.forEach(function normalizeEntry(item, index) {
      var normalized = normalizePersistentNavigationConfig(item, item && item.baseUrl, index + 1);
      if (!normalized) return;
      var key = getNavigationItemKey(normalized.section, normalized.label, normalized.href);
      result[key] = normalized;
    });
    Object.keys(result)
      .sort(function sortNavigationPool(left, right) {
        var leftItem = result[left];
        var rightItem = result[right];
        return (rightItem.updatedAt || 0) - (leftItem.updatedAt || 0);
      })
      .slice(NAVIGATION_POOL_LIMIT)
      .forEach(function removeExtraNavigation(key) {
        delete result[key];
      });
    return result;
  }

  function loadNavigationPool() {
    return normalizeNavigationPool(loadMap(NAVIGATION_KEY));
  }

  function saveNavigationPool(pool) {
    saveMap(NAVIGATION_KEY, normalizeNavigationPool(pool));
  }

  function normalizeNavigationPinMap(value) {
    var source = isPlainObject(value) ? value : {};
    var result = {};
    Object.keys(source).forEach(function normalizePinKey(key) {
      var text = String(key || '').trim();
      if (text && source[key]) result[text] = true;
    });
    return result;
  }

  function normalizeNavigationUsageMap(value) {
    var source = isPlainObject(value) ? value : {};
    var result = {};
    Object.keys(source).forEach(function normalizeUsageEntry(key) {
      var text = String(key || '').trim();
      var item = isPlainObject(source[key]) ? source[key] : {};
      if (!text) return;
      result[text] = {
        usedAt: Math.max(0, Number(item.usedAt) || 0),
        clickedAt: Math.max(0, Number(item.clickedAt) || 0),
        hitCount: Math.max(0, Math.floor(Number(item.hitCount) || 0)),
      };
    });
    Object.keys(result)
      .sort(function sortNavigationUsage(left, right) {
        var leftItem = result[left] || {};
        var rightItem = result[right] || {};
        var leftTime = Math.max(Number(leftItem.clickedAt) || 0, Number(leftItem.usedAt) || 0);
        var rightTime = Math.max(Number(rightItem.clickedAt) || 0, Number(rightItem.usedAt) || 0);
        return rightTime - leftTime;
      })
      .slice(NAVIGATION_USAGE_LIMIT)
      .forEach(function removeExtraNavigationUsage(key) {
        delete result[key];
      });
    return result;
  }

  function loadNavigationPins() {
    return normalizeNavigationPinMap(loadMap(NAVIGATION_PIN_KEY));
  }

  function saveNavigationPins(pins) {
    saveMap(NAVIGATION_PIN_KEY, normalizeNavigationPinMap(pins));
  }

  function loadNavigationUsage() {
    return normalizeNavigationUsageMap(loadMap(NAVIGATION_USAGE_KEY));
  }

  function saveNavigationUsage(usage) {
    saveMap(NAVIGATION_USAGE_KEY, normalizeNavigationUsageMap(usage));
  }

  function getModuleNavigationGroupKey(label) {
    return normalizeNavigationLabel(label).toLowerCase();
  }

  function normalizeNavigationCollapseState(value) {
    var source = isPlainObject(value) ? value : {};
    var result = {};
    Object.keys(source).forEach(function normalizeGroupState(key) {
      var groupKey = getModuleNavigationGroupKey(key);
      if (groupKey && source[key]) result[groupKey] = true;
    });
    return result;
  }

  function loadNavigationCollapseState() {
    return normalizeNavigationCollapseState(loadMap(NAVIGATION_COLLAPSE_KEY));
  }

  function saveNavigationCollapseState(state) {
    saveMap(NAVIGATION_COLLAPSE_KEY, normalizeNavigationCollapseState(state));
  }

  function isModuleNavigationGroupCollapsed(state, label) {
    return !!(state && state[getModuleNavigationGroupKey(label)]);
  }

  function hasActiveModuleNavigationNode(node) {
    if (!node) return false;
    if (node.config && node.config.active) return true;
    return (node.children || []).some(hasActiveModuleNavigationNode);
  }

  function getDefaultModuleNavigationCollapseState(groups) {
    var result = {};
    (groups || []).forEach(function defaultCollapseGroup(group) {
      var label = normalizeNavigationLabel(group && group.label);
      var hasActive = (group.nodes || []).some(hasActiveModuleNavigationNode);
      if (!label || hasActive) return;
      if (/版块导航|历史导航|已发现/.test(label) || (group.nodes || []).length > 18) {
        result[getModuleNavigationGroupKey(label)] = true;
      }
    });
    return result;
  }

  function applyInitialModuleNavigationCollapseState(groups, collapseState) {
    var current = normalizeNavigationCollapseState(collapseState);
    var storage = getStorage();
    if (!storage || storage.getItem(NAVIGATION_COLLAPSE_DEFAULT_KEY) === '1') return current;
    storage.setItem(NAVIGATION_COLLAPSE_DEFAULT_KEY, '1');
    if (Object.keys(current).length) return current;
    var defaults = getDefaultModuleNavigationCollapseState(groups);
    if (!Object.keys(defaults).length) return current;
    saveNavigationCollapseState(defaults);
    return defaults;
  }

  function loadReadProgress() {
    return pruneReadProgress(loadMap(PROGRESS_KEY));
  }

  function saveReadProgress(progress) {
    saveMap(PROGRESS_KEY, pruneReadProgress(progress));
  }

  function loadThreadUpdates() {
    return pruneThreadUpdates(loadMap(THREAD_UPDATE_KEY));
  }

  function saveThreadUpdates(updates) {
    saveMap(THREAD_UPDATE_KEY, pruneThreadUpdates(updates));
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

  function loadTaskClaimRecords() {
    return pruneTaskClaimRecords(loadMap(TASK_CLAIM_KEY));
  }

  function saveTaskClaimRecords(records) {
    saveMap(TASK_CLAIM_KEY, pruneTaskClaimRecords(records));
  }

  function mergeTaskClaimRecords(existing, incoming) {
    var result = pruneTaskClaimRecords(existing || {});
    (incoming || []).forEach(function mergeTaskClaimRecord(record) {
      var normalized = normalizeTaskClaimRecord(record);
      if (!normalized) return;
      var key = normalized.key || createTaskClaimRecordKey(normalized);
      var previous = result[key] || {};
      result[key] = Object.assign({}, previous, normalized, {
        key: key,
        recordedAt: Math.max(Number(previous.recordedAt) || 0, Number(normalized.recordedAt) || 0),
      });
    });
    return pruneTaskClaimRecords(result);
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
    state.threadUpdates = pruneThreadUpdates(copyStorageMap(data.threadUpdates));
    state.resources = pruneResourceLibrary(copyStorageMap(data.resources));
    var navigation = normalizeNavigationPool(data.navigation);
    var navigationPins = normalizeNavigationPinMap(data.navigationPins);
    var navigationUsage = normalizeNavigationUsageMap(data.navigationUsage);
    saveSettings(settings);
    saveMap(READ_KEY, state.read);
    saveMap(WATCH_KEY, state.watch);
    saveReadProgress(state.progress);
    saveThreadUpdates(state.threadUpdates);
    saveAutoBuyAttempts(data.autoBuyAttempts);
    saveTaskClaimRecords(data.taskClaims);
    saveResourceLibrary(state.resources);
    saveNavigationPool(navigation);
    saveNavigationPins(navigationPins);
    saveNavigationUsage(navigationUsage);
    clearReadProgressRestoreRequest(parseThreadId(location.href));
    refreshWatchCenter();
    refreshHistoryCenter();
    refreshFavoriteNavPanels();
    refreshAutoBuyCenter();
    refreshTaskClaimInlineSection();
    refreshResourceCenter();
    refreshReadResourceRail();
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
    if (extra.resourceSummary) record.resourceSummary = String(extra.resourceSummary);

    var attempts = loadAutoBuyAttempts();
    attempts[key] = record;
    saveAutoBuyAttempts(attempts);
    refreshAutoBuyCenter();
    return record;
  }

  function currentPageNumber(url) {
    var text = String(url || '');
    var match = text.match(/-page-(\d+)/) || text.match(/[?&]page=(\d+)/);
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

  var SPX_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif';
  var CSS_BOX = 'box-sizing:border-box!important;';
  var CSS_HIDE = 'display:none!important;';
  var CSS_PAGE_W = 'width:min(var(--spx-page-max),calc(100vw - var(--spx-page-space)))!important;';
  var CSS_ELLIPSIS = 'min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;';

  function getInjectedStyleText() {
    return [
      ':root,.spx-theme-clean{--spx-bg:#f7f9fc;--spx-page-bg:#eef2f6;--spx-panel:#fff;--spx-panel-muted:#f7f9fc;--spx-line:#d7dee9;--spx-line-soft:#e5eaf2;--spx-text:#1f2937;--spx-strong:#182230;--spx-sub:#667085;--spx-muted:#98a2b3;--spx-link:#1d4ed8;--spx-accent:#2563eb;--spx-accent-soft:#dbeafe;--spx-accent-wash:#eff6ff;--spx-danger:#b91c1c;--spx-danger-soft:#fef2f2;--spx-warn:#b45309;--spx-nav-bg:#283241;--spx-nav-hover:#334155;--spx-nav-text:#dfe7f0;--spx-nav-current-bg:#fff;--spx-nav-current-text:#182230;--spx-input-bg:#fff;--spx-row-bg:#fff;--spx-row-hover:#f8fbff;--spx-module-width:260px;--spx-module-max-offset:52px;--spx-module-section-height:34px;--spx-module-parent-height:40px;--spx-module-item-height:44px;--spx-module-child-height:36px;--spx-module-item-padding:14px;--spx-module-section-padding:12px;--spx-module-item-radius:12px;--spx-radius-sm:6px;--spx-radius:8px;--spx-radius-lg:12px;--spx-radius-xl:16px;--spx-shadow-card:0 6px 18px rgba(15,23,42,.06);--spx-shadow-popover:0 18px 48px rgba(15,23,42,.24);--spx-shadow-strong:0 24px 80px rgba(15,23,42,.3);--spx-page-max:1680px;--spx-page-space:clamp(28px,5.2vw,72px);--spx-reader-line:clamp(760px,62vw,960px);--spx-panel-width:min(620px,calc(100vw - 96px));--spx-panel-max-height:min(78vh,760px);--spx-control-height:32px;}',
      ':root.spx-theme-night,.spx-theme-night{--spx-bg:#202720;--spx-page-bg:#111412;--spx-panel:#181d1a;--spx-panel-muted:#202720;--spx-line:#303a32;--spx-line-soft:#263029;--spx-text:#edf4ec;--spx-strong:#f8fff5;--spx-sub:#aebbae;--spx-muted:#7c887d;--spx-link:#86efac;--spx-accent:#4ade80;--spx-accent-soft:#173a25;--spx-accent-wash:#102318;--spx-danger:#f87171;--spx-danger-soft:#3a171c;--spx-warn:#fbbf24;--spx-nav-bg:#070908;--spx-nav-hover:#202720;--spx-nav-text:#aebbae;--spx-nav-current-bg:#202720;--spx-nav-current-text:#f8fff5;--spx-input-bg:#151a17;--spx-row-bg:#181d1a;--spx-row-hover:#202720;--spx-shadow-card:0 10px 30px rgba(0,0,0,.28);--spx-shadow-popover:0 18px 48px rgba(0,0,0,.46);--spx-shadow-strong:0 24px 80px rgba(0,0,0,.55);}',
      '@media(max-width:900px){:root,.spx-theme-clean,.spx-theme-night{--spx-page-max:100vw;--spx-page-space:16px;--spx-reader-line:calc(100vw - 28px);--spx-panel-width:calc(100vw - 16px);--spx-panel-max-height:calc(100vh - 80px);}}',
      '.spx-adblock .spx-ad-hidden{'+CSS_HIDE+'}',
      '.spx-adblock #banner a[href*="taobao"],.spx-adblock #banner a[href*="tmall"],.spx-adblock #banner a[href*="equity"]{'+CSS_HIDE+'}',
      '.spx-adblock a[href*="taobao"],.spx-adblock a[href*="tmall"],.spx-adblock a[href*="alimama"]{'+CSS_HIDE+'}',
      '.spx-adblock img[src*="taobao"],.spx-adblock img[src*="tmall"],.spx-adblock img[src*="alimama"]{'+CSS_HIDE+'}',
      '.spx-adblock #banner{min-height:0!important;}',
      '.spx-site-shell,.spx-site-shell body{width:100%!important;min-width:0!important;margin:0!important;background:var(--spx-page-bg)!important;color:var(--spx-text)!important;font:14px/1.65 '+SPX_FONT+'!important;}',
      '.spx-site-shell a{color:var(--spx-link)!important;text-decoration:none!important;}',
      '.spx-site-shell a:hover{text-decoration:underline!important;}',
      '.spx-site-shell #wrapA,.spx-site-shell #main{'+CSS_BOX+'width:100%!important;max-width:none!important;background:var(--spx-page-bg)!important;}',
      '.spx-site-shell #header,.spx-site-shell #mainNav,.spx-site-shell #infobox,.spx-site-shell #notice,.spx-site-shell #content,.spx-site-shell #main{'+CSS_BOX+''+CSS_PAGE_W+'margin-left:auto!important;margin-right:auto!important;}',
      '.spx-site-shell #mainNav{display:block!important;height:30px!important;border-radius:8px!important;background:var(--spx-nav-bg)!important;box-shadow:0 3px 10px rgba(15,23,42,.12)!important;overflow:visible!important;}',
      '.spx-site-shell #mainNav a{color:var(--spx-nav-text)!important;text-decoration:none!important;text-shadow:none!important;font-size:14px!important;line-height:30px!important;}',
      '.spx-site-shell #mainNav a:hover{color:#fff!important;text-decoration:none!important;}',
      '.spx-site-shell #mainNav>div[style*="padding-left"]{'+CSS_BOX+'width:100%!important;max-width:100%!important;height:30px!important;padding-left:250px!important;background:transparent!important;overflow:visible!important;}',
      '.spx-site-shell #mainNav>div[style*="padding-left"] table,.spx-site-shell #mainNav>div[style*="padding-left"] tbody,.spx-site-shell #mainNav>div[style*="padding-left"] tr,.spx-site-shell #mainNav>div[style*="padding-left"] td{display:block!important;'+CSS_BOX+'width:auto!important;height:30px!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;}',
      '.spx-site-shell #guide{display:flex!important;float:none!important;align-items:center!important;justify-content:flex-start!important;flex-wrap:nowrap!important;width:max-content!important;max-width:100%!important;margin:0!important;padding:0!important;overflow:visible!important;white-space:nowrap!important;}',
      '.spx-site-shell #guide>li{display:block!important;float:none!important;width:auto!important;min-width:max-content!important;margin:0!important;white-space:nowrap!important;}',
      '.spx-site-shell #guide>#h_push,.spx-site-shell #guide>#h_hack{'+CSS_HIDE+'}',
      '.spx-site-shell #guide>li>a{'+CSS_BOX+'display:flex!important;float:none!important;align-items:center!important;height:30px!important;line-height:30px!important;padding:0 12px!important;white-space:nowrap!important;color:var(--spx-nav-text)!important;font-size:14px!important;font-weight:800!important;letter-spacing:.1px!important;text-shadow:none!important;}',
      '.spx-site-shell #guide>li>a:hover{background:var(--spx-nav-hover)!important;color:#fff!important;text-decoration:none!important;}',
      '.spx-site-shell #guide>li.current>a,.spx-site-shell #guide>li.spx-nav-current>a,.spx-site-shell #guide>li>a.spx-nav-current{background:var(--spx-nav-current-bg)!important;color:var(--spx-nav-current-text)!important;text-decoration:none!important;box-shadow:inset 0 -3px 0 var(--spx-accent)!important;}',
      '.spx-site-shell #guide>li.spx-nav-active>a,.spx-site-shell #guide>li>a.spx-menu-open{background:var(--spx-nav-hover)!important;color:#fff!important;text-decoration:none!important;box-shadow:none!important;}',
      '.spx-site-shell #spx-nav-brand{display:inline-flex!important;flex:none!important;align-items:center!important;height:28px!important;padding:0 12px!important;color:#fff!important;font-size:13px!important;font-weight:900!important;line-height:28px!important;letter-spacing:.02em!important;white-space:nowrap!important;}',
      '.spx-favorite-nav{position:relative!important;display:flex!important;flex:none!important;align-items:center!important;margin-left:auto!important;align-self:center!important;height:38px!important;overflow:visible!important;z-index:10002!important;}',
      '.spx-favorite-nav-trigger{'+CSS_BOX+'display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;height:28px!important;min-width:max-content!important;margin:0!important;padding:0 10px!important;border:1px solid rgba(217,119,6,.28)!important;border-radius:8px!important;background:#ffedd5!important;color:#7c2d12!important;font:900 12px/28px '+SPX_FONT+'!important;white-space:nowrap!important;cursor:pointer!important;box-shadow:none!important;}',
      '.spx-favorite-nav-trigger:hover,.spx-favorite-nav-trigger[aria-expanded="true"]{background:#fff7ed!important;color:#7c2d12!important;text-decoration:none!important;box-shadow:inset 0 -2px 0 var(--spx-warn)!important;}',
      '.spx-favorite-nav-star{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:18px!important;height:18px!important;border-radius:6px!important;background:var(--spx-warn)!important;color:#fff!important;font-size:12px!important;line-height:18px!important;}',
      '.spx-favorite-nav-count{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:20px!important;height:18px!important;padding:0 6px!important;border-radius:999px!important;background:#fff!important;color:var(--spx-warn)!important;font-size:11px!important;line-height:18px!important;font-variant-numeric:tabular-nums!important;}',
      '.spx-favorite-nav-update-count{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:28px!important;height:18px!important;padding:0 7px!important;border-radius:999px!important;background:#dc2626!important;color:#fff!important;font-size:11px!important;line-height:18px!important;font-variant-numeric:tabular-nums!important;}.spx-favorite-nav-update-count[hidden]{'+CSS_HIDE+'}',
      '.spx-favorite-nav-note,.spx-task-auto-claim-nav-note{'+CSS_BOX+'display:inline-flex!important;align-items:center!important;justify-content:center!important;height:24px!important;max-width:128px!important;margin-left:8px!important;padding:0 10px!important;border:1px solid #bbf7d0!important;border-radius:999px!important;background:#f0fdf4!important;color:#166534!important;font-size:12px!important;font-weight:900!important;line-height:24px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;box-shadow:0 4px 10px rgba(22,101,52,.12)!important;}',
      '.spx-favorite-nav-update-note{'+CSS_BOX+'display:inline-flex!important;align-items:center!important;justify-content:center!important;height:24px!important;max-width:132px!important;margin-left:8px!important;padding:0 10px!important;border:1px solid #fecaca!important;border-radius:999px!important;background:#fee2e2!important;color:#991b1b!important;font-size:12px!important;font-weight:900!important;line-height:24px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;box-shadow:0 4px 10px rgba(153,27,27,.1)!important;}.spx-favorite-nav-update-note[hidden]{'+CSS_HIDE+'}',
      '.spx-auto-buy-nav-note{border-color:#fed7aa!important;background:#fff7ed!important;color:#9a3412!important;}',
      '.spx-favorite-nav-panel{'+CSS_BOX+'position:absolute!important;top:46px!important;right:0!important;left:auto!important;z-index:10020!important;width:min(720px,calc(100vw - 72px))!important;max-height:min(78vh,720px)!important;overflow:hidden!important;border:1px solid #f3c27a!important;border-radius:12px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;box-shadow:0 22px 52px rgba(15,23,42,.24)!important;font:14px/1.55 '+SPX_FONT+'!important;}',
      '.spx-favorite-nav-panel[hidden]{'+CSS_HIDE+'}',
      '.spx-favorite-head{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:12px!important;padding:14px 14px 10px!important;border-bottom:1px solid #fde4bd!important;background:linear-gradient(180deg,#fff7ed 0%,var(--spx-panel) 100%)!important;}',
      '.spx-favorite-title h3{margin:0!important;color:var(--spx-strong)!important;font-size:15px!important;line-height:1.3!important;font-weight:900!important;}.spx-favorite-summary{margin-top:4px!important;color:#7c2d12!important;font-size:12px!important;font-weight:700!important;}',
      '.spx-favorite-open{display:inline-flex!important;align-items:center!important;min-height:30px!important;padding:0 10px!important;border-radius:8px!important;background:var(--spx-warn)!important;color:#fff!important;text-decoration:none!important;font-size:12px!important;font-weight:900!important;white-space:nowrap!important;}.spx-favorite-head-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;flex-wrap:wrap!important;}.spx-favorite-selected-count{color:#7c2d12!important;font-size:12px!important;font-weight:900!important;white-space:nowrap!important;}',
      '.spx-favorite-stats{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;padding:12px 14px 0!important;}.spx-favorite-stat{min-width:0!important;padding:9px 10px!important;border:1px solid #fde4bd!important;border-radius:10px!important;background:#fffaf3!important;}.spx-favorite-stat strong{display:block!important;color:#7c2d12!important;font-size:16px!important;line-height:1.2!important;font-variant-numeric:tabular-nums!important;}.spx-favorite-stat span{display:block!important;margin-top:3px!important;color:var(--spx-sub)!important;font-size:11px!important;font-weight:800!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}',
      '.spx-favorite-search{'+CSS_BOX+'width:calc(100% - 28px)!important;min-height:34px!important;margin:12px 14px 8px!important;padding:0 11px!important;border:1px solid var(--spx-line)!important;border-radius:9px!important;background:var(--spx-panel-muted)!important;color:var(--spx-text)!important;font-size:13px!important;outline:none!important;}.spx-favorite-search:focus{border-color:var(--spx-warn)!important;box-shadow:0 0 0 3px rgba(217,119,6,.14)!important;}',
      '.spx-favorite-tabs,.spx-favorite-tools{display:flex!important;align-items:center!important;gap:8px!important;padding:0 14px 10px!important;}.spx-favorite-tools{justify-content:space-between!important;}.spx-favorite-chips{display:flex!important;gap:6px!important;min-width:0!important;overflow-x:auto!important;scrollbar-width:thin!important;}.spx-favorite-tab,.spx-favorite-chip{flex:none!important;min-height:28px!important;padding:0 10px!important;border:1px solid var(--spx-line)!important;border-radius:999px!important;background:var(--spx-panel)!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:900!important;cursor:pointer!important;}.spx-favorite-tab.spx-active,.spx-favorite-chip.spx-active{border-color:var(--spx-warn)!important;background:#ffedd5!important;color:#7c2d12!important;}.spx-favorite-chip.spx-favorite-chip-update{border-color:#fecaca!important;background:#fee2e2!important;color:#991b1b!important;}.spx-favorite-sort{width:128px!important;height:30px!important;border:1px solid var(--spx-line)!important;border-radius:8px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;font-size:12px!important;font-weight:800!important;}',
      '.spx-favorite-list{display:grid!important;gap:8px!important;max-height:360px!important;overflow:auto!important;padding:0 14px 14px!important;}.spx-favorite-group{position:sticky!important;top:0!important;z-index:1!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;min-height:30px!important;padding:4px 2px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;font-size:12px!important;font-weight:900!important;}.spx-favorite-group-main{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important;}.spx-favorite-group-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:6px!important;flex-wrap:wrap!important;}.spx-favorite-group-actions button{min-height:26px!important;padding:0 8px!important;border:1px solid var(--spx-line)!important;border-radius:8px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;font-size:12px!important;font-weight:900!important;cursor:pointer!important;}.spx-favorite-group-actions .spx-danger{border-color:#fecaca!important;background:var(--spx-danger-soft)!important;color:var(--spx-danger)!important;}.spx-favorite-update-badge,.spx-thread-update-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;height:21px!important;min-width:max-content!important;padding:0 7px!important;border-radius:999px!important;background:#fee2e2!important;color:#b91c1c!important;font-size:11px!important;font-weight:900!important;line-height:21px!important;white-space:nowrap!important;}.spx-thread-update-badge{margin-right:6px!important;vertical-align:middle!important;}.spx-favorite-item{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:12px!important;min-height:64px!important;padding:11px 12px!important;border:1px solid var(--spx-line)!important;border-radius:10px!important;background:var(--spx-panel)!important;}.spx-favorite-item.spx-favorite-has-update{border-color:#fecaca!important;background:#fffafa!important;}.spx-favorite-body-head{display:flex!important;align-items:flex-start!important;gap:8px!important;min-width:0!important;}.spx-favorite-select{flex:none!important;width:16px!important;height:16px!important;margin:2px 0 0!important;accent-color:var(--spx-warn)!important;}.spx-favorite-item-title{display:-webkit-box!important;min-width:0!important;color:var(--spx-strong)!important;font-size:14px!important;font-weight:900!important;line-height:1.38!important;white-space:normal!important;overflow:hidden!important;text-overflow:ellipsis!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;}.spx-favorite-meta{margin-top:5px!important;color:var(--spx-text)!important;font-size:13px!important;line-height:1.42!important;white-space:normal!important;overflow:hidden!important;text-overflow:ellipsis!important;}.spx-favorite-actions{display:flex!important;gap:6px!important;align-items:center!important;}.spx-favorite-actions a,.spx-favorite-actions button,.spx-favorite-load-more{min-width:52px!important;height:28px!important;padding:0 8px!important;border:1px solid var(--spx-line)!important;border-radius:8px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;font-size:12px!important;font-weight:900!important;text-decoration:none!important;cursor:pointer!important;}.spx-favorite-actions .spx-primary{border-color:var(--spx-accent)!important;background:var(--spx-accent)!important;color:#fff!important;}.spx-favorite-actions .spx-danger{border-color:#fecaca!important;background:var(--spx-danger-soft)!important;color:var(--spx-danger)!important;}.spx-favorite-load{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:42px!important;padding:8px 10px!important;border:1px dashed #f3c27a!important;border-radius:10px!important;background:#fffaf3!important;color:#7c2d12!important;font-size:12px!important;font-weight:900!important;}.spx-favorite-empty{padding:18px 14px 20px!important;color:var(--spx-sub)!important;font-size:13px!important;font-weight:700!important;text-align:center!important;}',
      '.spx-favorite-nav-panel a.spx-favorite-item-title,.spx-favorite-nav-panel a.spx-favorite-item-title:link,.spx-favorite-nav-panel a.spx-favorite-item-title:visited{color:var(--spx-strong)!important;text-decoration:none!important;text-shadow:none!important;opacity:1!important;filter:none!important;}.spx-favorite-nav-panel .spx-favorite-meta{color:var(--spx-text)!important;text-shadow:none!important;opacity:1!important;filter:none!important;}',
      '.spx-site-shell #mainNav .spx-favorite-nav-panel a.spx-favorite-item-title,.spx-site-shell #mainNav .spx-favorite-nav-panel a.spx-favorite-item-title:link,.spx-site-shell #mainNav .spx-favorite-nav-panel a.spx-favorite-item-title:visited{display:-webkit-box!important;color:#182230!important;text-decoration:none!important;text-shadow:none!important;font-size:14px!important;font-weight:900!important;line-height:1.38!important;opacity:1!important;filter:none!important;}.spx-site-shell #mainNav .spx-favorite-nav-panel .spx-favorite-meta{color:#1f2937!important;font-size:13px!important;line-height:1.42!important;opacity:1!important;filter:none!important;}.spx-site-shell #mainNav .spx-favorite-nav-panel .spx-favorite-open,.spx-site-shell #mainNav .spx-favorite-nav-panel .spx-favorite-actions a.spx-primary{color:#fff!important;line-height:28px!important;}.spx-site-shell #mainNav .spx-favorite-nav-panel .spx-favorite-actions a:not(.spx-primary){color:#1f2937!important;line-height:28px!important;}',
      '.spx-site-shell #guide .spx-peacemaker-nav{position:relative!important;width:auto!important;min-width:max-content!important;overflow:visible!important;}',
      '.spx-site-shell #peacemakerconfig{position:relative!important;overflow:visible!important;color:var(--spx-nav-text)!important;}',
      '.spx-site-shell #peacemakerconfig.spx-menu-open{color:#fff!important;}',
      '.spx-site-shell #peacemakerconfig>div[hidden]{'+CSS_HIDE+'}',
      '.spx-site-shell #peacemakerconfig>div:not([hidden]){'+CSS_BOX+'display:block!important;position:absolute!important;top:30px!important;right:0!important;left:auto!important;z-index:10000!important;width:148px!important;min-width:148px!important;margin:0!important;padding:5px!important;border:1px solid #334155!important;border-radius:8px!important;background:#f8fafc!important;color:#0f172a!important;box-shadow:0 12px 28px rgba(15,23,42,.22)!important;font:700 13px/1.35 '+SPX_FONT+'!important;}',
      '.spx-site-shell #peacemakerconfig>div:not([hidden])>div{'+CSS_BOX+'display:block!important;min-height:28px!important;margin:0!important;padding:5px 8px!important;background:#f8fafc!important;color:#0f172a!important;text-align:left!important;font:inherit!important;line-height:18px!important;border-radius:5px!important;}',
      '.spx-site-shell #peacemakerconfig>div:not([hidden])>div:hover{background:#e0f2fe!important;}',
      '.spx-forum-dashboard-panel{'+CSS_BOX+'grid-column:1/-1!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;padding:14px!important;border:1px solid var(--spx-line)!important;border-radius:12px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;box-shadow:var(--spx-shadow-card)!important;overflow:hidden!important;}',
      '.spx-forum-dashboard-head{display:flex!important;align-items:flex-end!important;justify-content:space-between!important;gap:14px!important;margin:0 0 12px!important;}.spx-forum-dashboard-head h2{margin:0!important;color:var(--spx-strong)!important;font-size:20px!important;line-height:1.25!important;font-weight:900!important;}.spx-forum-dashboard-head p{margin:4px 0 0!important;color:var(--spx-sub)!important;font-size:13px!important;line-height:1.45!important;}',
      '.spx-forum-dashboard-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;flex-wrap:wrap!important;}.spx-forum-dashboard-actions button{min-height:32px!important;padding:0 11px!important;border:1px solid var(--spx-line)!important;border-radius:8px!important;background:var(--spx-panel-muted)!important;color:var(--spx-text)!important;font-size:12px!important;font-weight:900!important;cursor:pointer!important;}.spx-forum-dashboard-actions button.spx-primary{border-color:var(--spx-accent)!important;background:var(--spx-accent)!important;color:#fff!important;}',
      '.spx-forum-dashboard-stats{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:10px!important;margin:0 0 12px!important;}.spx-forum-dashboard-stat{'+CSS_BOX+'min-width:0!important;padding:11px!important;border:1px solid var(--spx-line)!important;border-radius:10px!important;background:var(--spx-panel-muted)!important;}.spx-forum-dashboard-stat-label{display:block!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:900!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}.spx-forum-dashboard-stat strong{display:block!important;margin:7px 0 0!important;color:var(--spx-strong)!important;font-size:22px!important;line-height:1.1!important;font-weight:900!important;font-variant-numeric:tabular-nums!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}.spx-forum-dashboard-stat small{display:block!important;margin:5px 0 0!important;color:var(--spx-muted)!important;font-size:12px!important;font-weight:800!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}',
      '.spx-forum-dashboard-stat.spx-blue{border-color:#bfdbfe!important;background:#eff6ff!important;}.spx-forum-dashboard-stat.spx-amber{border-color:#fed7aa!important;background:#fff7ed!important;}.spx-forum-dashboard-stat.spx-rose{border-color:#fecdd3!important;background:#fff1f2!important;}.spx-forum-dashboard-stat.spx-green{border-color:#bbf7d0!important;background:#f0fdf4!important;}.spx-forum-dashboard-stat.spx-violet{border-color:#ddd6fe!important;background:#f5f3ff!important;}',
      '.spx-forum-dashboard-grid{display:grid!important;grid-template-columns:minmax(0,1.08fr) minmax(340px,.92fr)!important;gap:12px!important;align-items:start!important;}.spx-forum-dashboard-stack{display:grid!important;gap:12px!important;min-width:0!important;}.spx-forum-dashboard-split{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important;}.spx-forum-dashboard-card{'+CSS_BOX+'min-width:0!important;padding:12px!important;border:1px solid var(--spx-line)!important;border-radius:10px!important;background:var(--spx-panel)!important;box-shadow:none!important;overflow:hidden!important;}.spx-forum-dashboard-card h3{margin:0 0 10px!important;color:var(--spx-strong)!important;font-size:14px!important;font-weight:900!important;line-height:1.3!important;}',
      '.spx-forum-dashboard-topic-list,.spx-forum-dashboard-resource-list,.spx-forum-dashboard-activity-list{display:grid!important;gap:8px!important;}.spx-forum-dashboard-topic,.spx-forum-dashboard-resource,.spx-forum-dashboard-activity{'+CSS_BOX+'display:grid!important;grid-template-columns:minmax(0,1fr) 54px auto!important;gap:10px!important;align-items:center!important;min-height:54px!important;padding:9px 10px!important;border:1px solid var(--spx-line-soft)!important;border-radius:9px!important;background:var(--spx-panel-muted)!important;}.spx-forum-dashboard-resource{grid-template-columns:minmax(0,1fr) auto!important;}.spx-forum-dashboard-activity{grid-template-columns:auto minmax(0,1fr) auto!important;}',
      '.spx-forum-dashboard-topic-title,.spx-forum-dashboard-resource-title{display:block!important;min-width:0!important;color:var(--spx-strong)!important;font-size:13px!important;font-weight:900!important;line-height:1.35!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;text-decoration:none!important;}.spx-forum-dashboard-topic-meta{margin-top:3px!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:700!important;line-height:1.35!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}.spx-forum-dashboard-score{color:var(--spx-sub)!important;font-size:12px!important;font-weight:900!important;text-align:right!important;font-variant-numeric:tabular-nums!important;}',
      '.spx-forum-dashboard-chips{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:5px!important;flex-wrap:wrap!important;}.spx-forum-dashboard-chip{display:inline-flex!important;align-items:center!important;justify-content:center!important;height:22px!important;padding:0 7px!important;border-radius:999px!important;background:var(--spx-accent-soft)!important;color:var(--spx-accent)!important;font-size:11px!important;font-weight:900!important;white-space:nowrap!important;}.spx-forum-dashboard-chip.spx-green{background:#dcfce7!important;color:#047857!important;}.spx-forum-dashboard-chip.spx-amber{background:#ffedd5!important;color:#92400e!important;}.spx-forum-dashboard-chip.spx-violet{background:#ede9fe!important;color:#6d28d9!important;}',
      '.spx-forum-dashboard-ranks{display:grid!important;gap:7px!important;}.spx-forum-dashboard-rank{display:grid!important;grid-template-columns:70px minmax(0,1fr) 34px!important;gap:8px!important;align-items:center!important;min-height:28px!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:900!important;}.spx-forum-dashboard-rank>b{display:block!important;height:8px!important;border-radius:999px!important;background:var(--spx-line-soft)!important;overflow:hidden!important;}.spx-forum-dashboard-rank>b>i{display:block!important;height:100%!important;border-radius:inherit!important;background:var(--spx-accent)!important;}.spx-forum-dashboard-rank>strong{text-align:right!important;color:var(--spx-strong)!important;font-variant-numeric:tabular-nums!important;}',
      '.spx-forum-dashboard-activity-mark{width:9px!important;height:36px!important;border-radius:999px!important;background:var(--spx-accent)!important;}.spx-forum-dashboard-activity.spx-resource .spx-forum-dashboard-activity-mark{background:#059669!important;}.spx-forum-dashboard-activity.spx-request .spx-forum-dashboard-activity-mark{background:#d97706!important;}.spx-forum-dashboard-activity time{color:var(--spx-muted)!important;font-size:12px!important;font-weight:900!important;white-space:nowrap!important;}.spx-forum-dashboard-empty{padding:12px!important;color:var(--spx-sub)!important;font-size:13px!important;font-weight:700!important;text-align:center!important;}',
      '@media(max-width:1180px){.spx-forum-dashboard-stats{grid-template-columns:repeat(3,minmax(0,1fr))!important}.spx-forum-dashboard-grid{grid-template-columns:minmax(0,1fr)!important}}',
      '@media(max-width:900px){.spx-forum-dashboard-panel{padding:10px!important}.spx-forum-dashboard-head{align-items:flex-start!important;flex-direction:column!important}.spx-forum-dashboard-actions{justify-content:flex-start!important}.spx-forum-dashboard-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}.spx-forum-dashboard-split{grid-template-columns:minmax(0,1fr)!important}.spx-forum-dashboard-topic,.spx-forum-dashboard-resource,.spx-forum-dashboard-activity{grid-template-columns:minmax(0,1fr)!important}.spx-forum-dashboard-score{text-align:left!important}.spx-forum-dashboard-chips{justify-content:flex-start!important}}',
      '.spx-search-page #wrapA,.spx-search-page #main{'+CSS_BOX+'max-width:none!important;background:var(--spx-page-bg)!important;}',
      '.spx-search-page #main{'+CSS_BOX+''+CSS_PAGE_W+'margin:16px auto 42px!important;padding:0!important;display:block!important;}',
      '.spx-search-page .t{'+CSS_BOX+'width:100%!important;margin:0 0 14px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;overflow:hidden!important;}',
      '.spx-search-page .tr1,.spx-search-page .tr2,.spx-search-page .tr3{font-size:14px!important;line-height:1.6!important;}',
      '.spx-search-page .tr3 td,.spx-search-page .tr1 td{padding:8px 10px!important;}',
      '.spx-search-page .spx-module-body input[type="text"],.spx-search-page .spx-module-body input[type="search"],.spx-search-page .spx-module-body input[name="keyword"],.spx-search-page .spx-module-body input[name="username"]{'+CSS_BOX+'width:min(520px,100%)!important;min-width:0!important;max-width:100%!important;height:34px!important;padding:5px 10px!important;border:1px solid #cbd5e1!important;border-radius:5px!important;background:#fff!important;color:#172033!important;font-size:16px!important;line-height:22px!important;}',
      '.spx-search-page .spx-module-body input[type="text"]:focus,.spx-search-page .spx-module-body input[type="search"]:focus,.spx-search-page .spx-module-body input[name="keyword"]:focus,.spx-search-page .spx-module-body input[name="username"]:focus{border-color:#0f766e!important;box-shadow:0 0 0 2px rgba(15,118,110,.14)!important;outline:none!important;}',
      '.spx-profile-page #wrapA,.spx-profile-page #main{'+CSS_BOX+'max-width:none!important;background:var(--spx-page-bg)!important;}',
      '.spx-profile-page #main,.spx-profile-page #content{'+CSS_BOX+''+CSS_PAGE_W+'margin:16px auto 42px!important;padding:0!important;display:block!important;}',
      '.spx-profile-page #main>*{'+CSS_BOX+'width:100%!important;max-width:none!important;}',
      '.spx-profile-page #main>.bdbA,.spx-profile-page #main>.t{margin-left:0!important;margin-right:0!important;}',
      '#infobox.spx-profile-infobox-restored{'+CSS_BOX+'display:flex!important;align-items:center!important;justify-content:space-between!important;gap:20px!important;min-height:88px!important;margin:0 auto 14px!important;padding:14px 22px!important;background:var(--spx-panel)!important;border:1px solid var(--spx-line)!important;border-radius:8px!important;box-shadow:var(--spx-shadow-card)!important;color:var(--spx-text)!important;overflow:hidden!important;}',
      '.spx-profile-infobox-main{display:flex!important;align-items:center!important;gap:14px!important;min-width:0!important;flex:1 1 auto!important;}',
      '.spx-profile-infobox-avatar{flex:0 0 56px!important;width:56px!important;height:56px!important;overflow:hidden!important;border-radius:6px!important;background:var(--spx-panel-muted)!important;}.spx-profile-infobox-avatar img{display:block!important;width:56px!important;height:56px!important;object-fit:cover!important;}',
      '.spx-profile-infobox-body{display:grid!important;gap:6px!important;min-width:0!important;flex:1 1 auto!important;}.spx-profile-infobox-meta{color:var(--spx-text)!important;font-size:14px!important;font-weight:800!important;line-height:1.45!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}.spx-profile-infobox-meta a{font-size:14px!important;font-weight:900!important;}.spx-profile-infobox-honor{color:var(--spx-text)!important;font-size:14px!important;line-height:1.45!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}',
      '.spx-profile-infobox-hot{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;flex:0 1 44%!important;min-width:300px!important;color:var(--spx-sub)!important;font-size:13px!important;font-weight:800!important;line-height:1.45!important;white-space:normal!important;overflow:visible!important;flex-wrap:wrap!important;}.spx-profile-infobox-hot-label{flex:none!important;color:var(--spx-sub)!important;font-weight:900!important;}.spx-profile-infobox-hot a{flex:none!important;font-size:13px!important;font-weight:900!important;}',
      '@media(max-width:760px){#infobox.spx-profile-infobox-restored{align-items:flex-start!important;flex-direction:column!important;padding:12px 14px!important}.spx-profile-infobox-hot{justify-content:flex-start!important;min-width:0!important;flex:1 1 auto!important}.spx-profile-infobox-meta,.spx-profile-infobox-honor{white-space:normal!important}}',
      '.spx-account-tabs{'+CSS_BOX+'display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;width:100%!important;margin:0 0 14px!important;padding:12px 14px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;}',
      '.spx-account-tabs a{display:flex!important;align-items:center!important;justify-content:center!important;min-height:34px!important;padding:0 16px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#f8fafc!important;color:#075985!important;font-size:15px!important;font-weight:800!important;line-height:1.2!important;text-decoration:none!important;}',
      '.spx-account-tabs a.spx-account-tab-active,.spx-account-tabs a:hover{background:#e0f2fe!important;border-color:#7dd3fc!important;color:#0369a1!important;text-decoration:none!important;}',
      '.spx-profile-page #u-wrap,.spx-profile-page #u-wrap2{'+CSS_BOX+'width:100%!important;max-width:none!important;background:#fff!important;overflow:visible!important;}',
      '.spx-profile-page #u-wrap2{display:grid!important;grid-template-columns:minmax(220px,300px) minmax(0,1fr)!important;gap:24px!important;padding:18px!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;}',
      '.spx-profile-page #u-sidebar{'+CSS_BOX+'float:none!important;width:auto!important;min-width:0!important;}',
      '.spx-profile-page #u-sidebar .bdbA,.spx-profile-page #u-sidebar .bgA{'+CSS_BOX+'width:100%!important;max-width:100%!important;margin:0 0 12px!important;padding:8px 12px!important;background:#fff!important;border:0!important;border-bottom:1px solid #e2e8f0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important;}',
      '.spx-profile-page #u-sidebar .bdbA:last-child,.spx-profile-page #u-sidebar .bgA:last-child{margin-bottom:0!important;}',
      '.spx-profile-page #u-content{'+CSS_BOX+'float:none!important;width:auto!important;min-width:0!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px 24px!important;}',
      '.spx-profile-page #u-contentmain{'+CSS_BOX+'grid-column:1/-1!important;float:none!important;width:100%!important;min-width:0!important;max-width:none!important;}',
      '.spx-profile-page #u-contentside{'+CSS_HIDE+'}',
      '.spx-profile-page #u-top{'+CSS_BOX+'grid-column:1/-1!important;width:100%!important;height:auto!important;min-height:0!important;padding:0!important;position:static!important;}',
      '.spx-profile-page #u-top-nav{position:static!important;display:block!important;'+CSS_BOX+'width:100%!important;height:auto!important;margin:12px 0 0!important;padding:0!important;overflow:visible!important;}',
      '.spx-profile-page #u-top-nav .b{display:flex!important;float:none!important;align-items:center!important;justify-content:flex-start!important;flex-wrap:wrap!important;gap:8px!important;width:100%!important;height:auto!important;margin:0!important;padding:0!important;list-style:none!important;overflow:visible!important;}',
      '.spx-profile-page #u-top-nav .b>li{display:block!important;float:none!important;width:auto!important;height:auto!important;margin:0!important;padding:0!important;list-style:none!important;}',
      '.spx-profile-page #u-top-nav .b>li>a{display:flex!important;align-items:center!important;justify-content:center!important;min-height:34px!important;padding:0 16px!important;margin:0!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#f8fafc!important;color:#075985!important;font-size:15px!important;font-weight:800!important;line-height:1.2!important;text-decoration:none!important;}',
      '.spx-profile-page #u-top-nav .b>li.current>a,.spx-profile-page #u-top-nav .b>li>a:hover{background:#e0f2fe!important;border-color:#7dd3fc!important;color:#0369a1!important;text-decoration:none!important;}',
      '.spx-profile-page.spx-account-tabs-ready #u-top-nav{'+CSS_HIDE+'}',
      '.spx-profile-page .u-content-66,.spx-profile-page .u-content-33{'+CSS_BOX+'float:none!important;width:auto!important;min-width:0!important;}',
      '.spx-profile-page .u-profile,.spx-profile-page #u-content>.c{grid-column:1/-1!important;}',
      '.spx-site-shell:not(.spx-reader) .bdbA,.spx-site-shell:not(.spx-reader) .t,.spx-site-shell:not(.spx-reader) .t3,.spx-site-shell:not(.spx-reader) .t5{'+CSS_BOX+''+CSS_PAGE_W+'margin:16px auto 14px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:var(--spx-radius)!important;box-shadow:var(--spx-shadow-card)!important;overflow:hidden!important;}',
      '.spx-site-shell:not(.spx-reader) .t,.spx-site-shell:not(.spx-reader) .t3,.spx-site-shell:not(.spx-reader) .t5{display:block!important;}',
      '.spx-site-shell:not(.spx-reader) .tr1,.spx-site-shell:not(.spx-reader) .tr2,.spx-site-shell:not(.spx-reader) .tr3{font-size:14px!important;line-height:1.6!important;}',
      '.spx-site-shell:not(.spx-reader) .tr3 td,.spx-site-shell:not(.spx-reader) .tr1 td,.spx-site-shell:not(.spx-reader) th,.spx-site-shell:not(.spx-reader) td{padding:8px 10px!important;}',
      '.spx-task-page #wrapA,.spx-task-page #main{'+CSS_BOX+'max-width:none!important;background:var(--spx-page-bg)!important;}',
      '.spx-task-page #main{display:block!important;width:calc(100vw - 40px)!important;max-width:1480px!important;margin:16px auto 42px!important;padding:0!important;overflow:hidden!important;}',
      '.spx-task-page #main>.bdbA,.spx-task-page #main>.spx-task-breadcrumb-block{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;margin:0 0 14px!important;}',
      '.spx-task-page #main>.t,.spx-task-page #main>.t3,.spx-task-page #main>.t5{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;margin:0 0 14px!important;}',
      '.spx-task-page #main>.t table,.spx-task-page #main>.t3 table,.spx-task-page #main>.t5 table{max-width:100%!important;}',
      '@media(max-width:900px){.spx-task-page #main{width:calc(100vw - 16px)!important;margin:10px 8px 34px!important}}',
      '.spx-site-shell #set-wrap{display:grid!important;grid-template-columns:minmax(190px,240px) minmax(0,1fr)!important;gap:16px!important;'+CSS_BOX+'width:100%!important;max-width:none!important;margin:16px auto 42px!important;padding:0!important;background:transparent!important;line-height:1.6!important;}',
      '.spx-site-shell #set-side,.spx-site-shell #set-content{'+CSS_BOX+'float:none!important;width:auto!important;min-width:0!important;margin:0!important;padding:0!important;background:transparent!important;}',
      '.spx-site-shell #set-side-wrap,.spx-site-shell #set-content-wrap{'+CSS_BOX+'width:100%!important;min-width:0!important;margin:0!important;padding:14px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;overflow:visible!important;}',
      '.spx-site-shell #set-side .set-h2{'+CSS_BOX+'margin:0 0 10px!important;padding:0 2px 10px!important;border-bottom:1px solid #e2e8f0!important;color:#0f172a!important;font-size:16px!important;line-height:1.35!important;font-weight:800!important;}',
      '.spx-site-shell #set-menu{'+CSS_BOX+'display:flex!important;flex-direction:column!important;gap:6px!important;width:100%!important;margin:0!important;padding:0!important;list-style:none!important;background:transparent!important;}',
      '.spx-site-shell #set-menu>li{display:block!important;width:100%!important;margin:0!important;padding:0!important;list-style:none!important;background:transparent!important;}',
      '.spx-site-shell #set-menu>li>a{display:flex!important;align-items:center!important;min-height:34px!important;'+CSS_BOX+'width:100%!important;padding:0 12px!important;margin:0!important;border:1px solid #e2e8f0!important;border-radius:8px!important;background:#f8fafc!important;color:#075985!important;font-size:14px!important;font-weight:700!important;line-height:1.25!important;text-decoration:none!important;}',
      '.spx-site-shell #set-menu>li.current>a,.spx-site-shell #set-menu>li>a:hover{background:#e0f2fe!important;border-color:#7dd3fc!important;color:#0369a1!important;text-decoration:none!important;}',
      '.spx-profile-page.spx-account-tabs-ready #set-side{'+CSS_HIDE+'}',
      '.spx-profile-page.spx-account-tabs-ready #set-wrap{grid-template-columns:minmax(0,1fr)!important;}',
      '.spx-site-shell #set-content{'+CSS_BOX+'display:block!important;overflow:visible!important;}',
      '.spx-site-shell #set-content table{'+CSS_BOX+'width:100%!important;max-width:100%!important;}',
      '.spx-site-shell #set-content .set-tab-table{'+CSS_BOX+'width:100%!important;margin:0 0 12px!important;overflow:auto!important;}',
      '.spx-site-shell #set-content .set-tab-box{'+CSS_BOX+'width:100%!important;overflow:visible!important;}',
    ].concat(
      getInjectedContentLayoutStyleRules(),
      getInjectedWidgetStyleRules(),
      getInjectedThemeOverrideStyleRules(),
      getInjectedPreviewParityStyleRules()
    ).join('\n');
  }

  function getInjectedContentLayoutStyleRules() {
    return [
      '.spx-reader,.spx-reader body{background:#f4f6f8!important;background-image:none!important;color:#263238!important;font:15px/1.7 '+SPX_FONT+'!important;}',
      '.spx-reader #wrapA,.spx-reader #main,.spx-reader #content{background:#f4f6f8!important;background-image:none!important;}',
      '.spx-reader #main>br,.spx-reader #content>br{'+CSS_HIDE+'}',
      '.spx-reader a{color:#075985!important;text-decoration:none!important;}',
      '.spx-reader a:hover{text-decoration:underline!important;}',
      '.spx-reader #wrapA{'+CSS_BOX+''+CSS_PAGE_W+'max-width:none!important;margin:0 auto!important;}',
      '.spx-reader #main,.spx-reader #content{font-size:15px!important;line-height:1.65!important;}',
      '.spx-reader .t,.spx-reader .t3,.spx-reader .t5,.spx-reader .tr1,.spx-reader .tr2,.spx-reader .tr3{font-size:15px!important;}',
      '.spx-reader .tr3 td,.spx-reader .tr1 td{padding-top:8px!important;padding-bottom:8px!important;}',
      '.spx-reader td[id^="td_"]{font-size:15px!important;line-height:1.65!important;}',
      '.spx-reader td[id^="td_"] a[id^="a_ajax_"]{font-size:16px!important;line-height:1.65!important;font-weight:600!important;}',
      '.spx-reader td[id^="td_"] .s8{display:inline-block;margin-right:6px;padding:1px 6px;border-radius:4px;background:#e8f3ff;color:#075985!important;font-size:13px!important;}',
      '.spx-reader table.js-post{'+CSS_BOX+''+CSS_PAGE_W+'max-width:none!important;margin:14px auto!important;background:#fff!important;border:1px solid #d9e2ec!important;border-radius:var(--spx-radius)!important;box-shadow:0 3px 12px rgba(15,23,42,.06)!important;overflow:hidden!important;table-layout:fixed!important;}',
      '.spx-reader table.js-post>tbody>tr>th.r_two{'+CSS_BOX+'width:128px!important;max-width:128px!important;min-width:128px!important;padding:18px 8px!important;overflow:hidden!important;vertical-align:top!important;text-align:center!important;}',
      '.spx-reader table.js-post>tbody>tr>th.r_two .user-pic{display:block!important;width:96px!important;height:96px!important;max-height:96px!important;margin:0 auto 10px!important;padding:0!important;text-align:center!important;overflow:hidden!important;}',
      '.spx-reader table.js-post>tbody>tr>th.r_two .user-pic img,.spx-reader table.js-post>tbody>tr>th.r_two>img{display:block!important;width:96px!important;max-width:96px!important;height:auto!important;margin:0 auto!important;}',
      '.spx-reader table.js-post>tbody>tr>th.r_two>a[href*="u.php"],.spx-reader table.js-post>tbody>tr>th.r_two .readprofile>a[href],.spx-reader table.js-post>tbody>tr>th.r_two .user-info>a[href]{display:block!important;margin:0 auto!important;padding:0!important;color:var(--spx-link)!important;font-size:16px!important;font-weight:800!important;line-height:1.35!important;text-align:center!important;word-break:break-word!important;}',
      '.spx-reader #content>table:not(.js-post):empty,.spx-reader #main>table:not(.js-post):empty,.spx-reader #content>table:not(.js-post) td:empty,.spx-reader #main>table:not(.js-post) td:empty{'+CSS_HIDE+'}',
      '.spx-reader #content>table:not(.js-post),.spx-reader #main>table:not(.js-post){border:0!important;box-shadow:none!important;background:transparent!important;}',
      '.spx-reader [data-spx-read-separator-hidden="1"]{'+CSS_HIDE+'}',
      '.spx-reader table.js-post>tbody>tr>th.r_one{'+CSS_BOX+'width:auto!important;min-width:0!important;}',
      '.spx-reader.spx-compact-read table.js-post>tbody>tr>th.r_two,.spx-reader.spx-hide-profile table.js-post>tbody>tr>th.r_two{width:112px!important;max-width:112px!important;min-width:112px!important;}',
      '.spx-reader table.js-post td{font-size:15px!important;line-height:1.75!important;}',
      '.spx-reader .h1,.spx-reader [id^="subject_"]{font-size:18px!important;line-height:1.55!important;font-weight:700!important;color:#111827!important;}',
      '.spx-reader .tpc_content{'+CSS_BOX+'max-width:var(--spx-reader-line)!important;margin:0 auto!important;padding:14px 18px 20px!important;font-size:16px!important;line-height:1.78!important;letter-spacing:0!important;color:#1f2937!important;word-break:break-word!important;}',
      '.spx-reader .tpc_content #read_tpc,.spx-reader .tpc_content>.f14{font-size:16px!important;line-height:1.78!important;}',
      '.spx-reader .tpc_content br{line-height:1.75!important;}',
      '.spx-reader .tpc_content img{max-width:100%!important;height:auto!important;border-radius:4px!important;}',
      '.spx-reader .tiptop,.spx-reader .readbot{max-width:var(--spx-reader-line)!important;margin-left:auto!important;margin-right:auto!important;color:#64748b!important;}',
      '.spx-reader .signature,.spx-reader .sigline{max-width:var(--spx-reader-line)!important;margin-left:auto!important;margin-right:auto!important;color:#64748b!important;font-size:13px!important;}',
      '.spx-home-dashboard,.spx-home-dashboard body{width:100%!important;min-width:0!important;overflow-x:hidden!important;background:var(--spx-page-bg)!important;color:#172033!important;}',
      '.spx-home-dashboard #wrapA,.spx-home-dashboard #main{'+CSS_BOX+'width:100vw!important;max-width:none!important;margin:0!important;padding:0!important;background:var(--spx-page-bg)!important;border:0!important;}',
      '.spx-home-dashboard #content{'+CSS_BOX+''+CSS_PAGE_W+'margin:16px auto 42px!important;display:block!important;background:transparent!important;}',
      '.spx-home-dashboard #spx-home-grid{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr))!important;gap:14px!important;min-width:0!important;}',
      '.spx-home-dashboard #toptool,.spx-home-dashboard #footer,.spx-home-dashboard .footer,.spx-home-dashboard #cate_info{'+CSS_HIDE+'}',
      '.spx-home-dashboard #header,.spx-home-dashboard #mainNav,.spx-home-dashboard #infobox,.spx-home-dashboard #notice{'+CSS_BOX+''+CSS_PAGE_W+'margin-left:auto!important;margin-right:auto!important;}',
      '.spx-home-dashboard #header{margin-top:10px!important;}',
      '.spx-home-dashboard #mainNav{position:sticky!important;top:0!important;z-index:9990!important;border-radius:8px!important;box-shadow:0 4px 16px rgba(15,23,42,.08)!important;overflow:visible!important;}',
      '.spx-home-dashboard #notice{display:block!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;padding:10px 14px!important;box-shadow:0 4px 14px rgba(15,23,42,.05)!important;}',
      '.spx-home-dashboard #notice table,.spx-home-dashboard #notice tbody,.spx-home-dashboard #notice tr{display:block!important;width:100%!important;}',
      '.spx-home-dashboard #notice td{display:block!important;width:auto!important;padding:4px 0!important;}',
      '.spx-home-dashboard .spx-home-quick{'+CSS_HIDE+'}',
      '.spx-home-dashboard .spx-home-quick a{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;min-height:42px!important;padding:0 12px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;color:#0f172a!important;text-decoration:none!important;font-weight:700!important;box-shadow:0 3px 12px rgba(15,23,42,.05)!important;}',
      '.spx-home-dashboard .spx-home-quick a span{font-size:12px!important;color:#64748b!important;font-weight:500!important;}',
      '.spx-home-dashboard .spx-home-module{grid-column:span 6!important;'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;overflow:hidden!important;}',
      '.spx-home-dashboard .spx-home-module[data-spx-large="1"]{grid-column:span 12!important;}',
      '.spx-home-dashboard .spx-home-module>h2,.spx-home-dashboard .spx-home-module .h{display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:38px!important;padding:0 14px!important;margin:0!important;background:#f8fafc!important;border-bottom:1px solid #e2e8f0!important;color:#0f172a!important;font-size:15px!important;font-weight:800!important;}',
      '.spx-home-dashboard .spx-home-module table,.spx-home-dashboard .spx-home-module tbody{display:block!important;width:100%!important;border:0!important;background:transparent!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr2{'+CSS_HIDE+'}',
      '.spx-home-dashboard .spx-home-module tr.tr3{display:grid!important;grid-template-columns:minmax(220px,1.15fr) 120px minmax(260px,1fr)!important;gap:10px!important;align-items:center!important;margin:0!important;padding:10px 14px!important;border-bottom:1px solid #edf2f7!important;background:#fff!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr3:hover{background:#f8fbff!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr3:last-child{border-bottom:0!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr3>td{display:block!important;width:auto!important;padding:0!important;border:0!important;background:transparent!important;font-size:13px!important;line-height:1.45!important;color:#475569!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr3>td:first-child{'+CSS_HIDE+'}',
      '.spx-home-dashboard .spx-home-module [id^="fn_"] a,.spx-home-dashboard .spx-home-module [id^="fn_"]{font-size:15px!important;font-weight:800!important;color:#0f172a!important;line-height:1.4!important;}',
      '.spx-home-dashboard .spx-home-module [id^="desc_"]{margin-top:4px!important;color:#64748b!important;font-size:12px!important;}',
      '.spx-home-dashboard .spx-home-hot [id^="fn_"] a,.spx-home-dashboard .spx-home-hot [id^="fn_"]{color:#075985!important;}',
      '.spx-home-dashboard .spx-home-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:26px!important;height:20px!important;margin-left:6px!important;padding:0 7px!important;border-radius:999px!important;background:#e0f2fe!important;color:#0369a1!important;font-size:12px!important;font-weight:800!important;}',
      '.spx-home-dashboard .spx-home-collapse{border:0!important;background:transparent!important;color:#64748b!important;font-size:12px!important;cursor:pointer!important;}',
      '.spx-forum-dashboard,.spx-forum-dashboard body{width:100%!important;min-width:0!important;overflow-x:hidden!important;background:var(--spx-page-bg)!important;color:#172033!important;}',
      '.spx-forum-dashboard #wrapA,.spx-forum-dashboard #main{'+CSS_BOX+'width:100vw!important;max-width:none!important;margin:0!important;padding:0!important;background:var(--spx-page-bg)!important;border:0!important;}',
      '.spx-forum-dashboard #content{'+CSS_BOX+''+CSS_PAGE_W+'margin:16px auto 42px!important;display:block!important;background:transparent!important;}',
      '.spx-forum-dashboard #content .t{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;margin:0 0 14px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;overflow:hidden!important;}',
      '.spx-forum-dashboard #content .t.spx-thread-list-table table,.spx-forum-dashboard #content .t.spx-thread-list-table tbody{display:block!important;width:100%!important;border:0!important;background:transparent!important;}',
      '.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr2{'+CSS_HIDE+'}',
      '.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3{display:grid!important;grid-template-columns:minmax(0,1fr) 96px 96px minmax(220px,.8fr)!important;gap:10px!important;align-items:center!important;margin:0!important;padding:10px 14px!important;border-bottom:1px solid #edf2f7!important;background:#fff!important;}',
      '.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3:hover{background:#f8fbff!important;}',
      '.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3:last-child{border-bottom:0!important;}',
      '.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3>td{display:block!important;width:auto!important;padding:0!important;border:0!important;background:transparent!important;font-size:13px!important;line-height:1.45!important;color:#475569!important;overflow:hidden!important;text-overflow:ellipsis!important;}',
      '.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3>td:first-child:not([id^="td_"]){'+CSS_HIDE+'}',
      '.spx-forum-dashboard td[id^="td_"]{font-size:14px!important;line-height:1.6!important;color:#475569!important;}',
      '.spx-forum-dashboard td[id^="td_"] a[id^="a_ajax_"],.spx-forum-dashboard [id^="td_"] a[href*="read.php"]{font-size:17px!important;font-weight:800!important;color:#075985!important;line-height:1.45!important;}',
      '.spx-forum-dashboard .gonggao{'+CSS_HIDE+'}',
      '.spx-forum-dashboard .spx-thread-tools{margin-left:8px!important;}',
      '.spx-immersive-read,.spx-immersive-read body{width:100%!important;min-width:0!important;overflow-x:hidden!important;background:var(--spx-page-bg)!important;}',
      '.spx-immersive-read #toptool,.spx-immersive-read #banner,.spx-immersive-read #footer,.spx-immersive-read .footer,.spx-immersive-read #bottom,.spx-immersive-read #music,.spx-immersive-read #readlog,.spx-immersive-read #threadlog{'+CSS_HIDE+'}',
      '.spx-immersive-read #header,.spx-immersive-read #mainNav,.spx-immersive-read #breadcrumbs,.spx-immersive-read .crumbs-item{'+CSS_BOX+''+CSS_PAGE_W+'margin-left:auto!important;margin-right:auto!important;}',
      '.spx-immersive-read #header{margin-top:10px!important;}',
      '.spx-immersive-read #mainNav{position:sticky!important;top:0!important;z-index:9990!important;border-radius:8px!important;box-shadow:0 4px 16px rgba(15,23,42,.08)!important;overflow:visible!important;}',
      '.spx-immersive-read .bdbA{display:block!important;'+CSS_BOX+''+CSS_PAGE_W+'margin:10px auto 0!important;padding:0!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:var(--spx-radius)!important;box-shadow:0 4px 14px rgba(15,23,42,.05)!important;overflow:visible!important;}',
      '.spx-immersive-read #breadcrumbs{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:6px!important;width:100%!important;min-height:36px!important;margin:0!important;padding:7px 12px!important;overflow:visible!important;color:#64748b!important;font-size:13px!important;line-height:1.45!important;background:transparent!important;}',
      '.spx-immersive-read #breadcrumbs .crumbs-item{display:inline-flex!important;align-items:center!important;width:auto!important;max-width:100%!important;margin:0!important;overflow:visible!important;white-space:nowrap!important;color:#64748b!important;}',
      '.spx-immersive-read #breadcrumbs .crumbs-item.current{min-width:0!important;white-space:normal!important;color:#0f172a!important;font-weight:700!important;}',
      '.spx-immersive-read #wrapA,.spx-immersive-read #main,.spx-immersive-read #content{'+CSS_BOX+'width:100vw!important;max-width:none!important;margin:0!important;padding:0!important;background:var(--spx-page-bg)!important;border:0!important;}',
      '.spx-immersive-read #content>table:not(.js-post),.spx-immersive-read #main>table:not(.js-post){'+CSS_PAGE_W+'margin:12px auto!important;}',
      '.spx-immersive-read table.js-post{'+CSS_BOX+''+CSS_PAGE_W+'max-width:none!important;margin:18px auto!important;border:1px solid #d6dee8!important;border-radius:var(--spx-radius)!important;background:#fff!important;box-shadow:0 8px 26px rgba(15,23,42,.08)!important;}',
      '.spx-immersive-read table.js-post>tbody>tr>td:first-child{'+CSS_HIDE+'}',
      '.spx-immersive-read table.js-post>tbody>tr>td{display:block!important;'+CSS_BOX+'width:100%!important;padding:0!important;border:0!important;background:#fff!important;}',
      '.spx-immersive-read .spx-post-tools{'+CSS_BOX+'max-width:var(--spx-reader-line)!important;margin:0 auto!important;padding:8px 18px 0!important;color:#94a3b8!important;font-size:12px!important;opacity:.62!important;}',
      '.spx-immersive-read .spx-post-tools:hover{opacity:1!important;}',
      '.spx-immersive-read .spx-post-tools span{font-size:12px!important;font-weight:400!important;color:#94a3b8!important;}',
      '.spx-immersive-read .spx-post-tools button{font-size:12px!important;color:#94a3b8!important;border-color:#e2e8f0!important;background:#f8fafc!important;padding:1px 7px!important;}',
      '.spx-immersive-read .spx-preview-panel{'+CSS_BOX+'max-width:100%!important;margin:0 auto 14px!important;padding:12px 18px 16px!important;background:#fff!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(15,23,42,.06)!important;}',
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
      '.spx-immersive-read .spx-preview-load-more[hidden]{'+CSS_HIDE+'}',
      '.spx-immersive-read .spx-preview-empty{padding:10px 2px;color:#94a3b8;font-size:13px;}',
      '.spx-immersive-read .spx-preview-source{'+CSS_HIDE+'}',
      '.spx-immersive-read .h1,.spx-immersive-read [id^="subject_"]{display:block!important;'+CSS_BOX+'max-width:var(--spx-reader-line)!important;margin:0 auto!important;padding:22px 18px 8px!important;font-size:21px!important;line-height:1.45!important;color:#111827!important;}',
      '.spx-immersive-read .tpc_content{'+CSS_BOX+'max-width:var(--spx-reader-line)!important;margin:0 auto!important;padding:18px 34px 34px!important;font-size:16px!important;line-height:1.78!important;color:#172033!important;background:#fff!important;}',
      '.spx-immersive-read .tpc_content #read_tpc,.spx-immersive-read .tpc_content>.f14{font-size:16px!important;line-height:1.78!important;}',
      '.spx-immersive-read .tiptop,.spx-immersive-read .readbot,.spx-immersive-read .signature,.spx-immersive-read .sigline{max-width:var(--spx-reader-line)!important;margin-left:auto!important;margin-right:auto!important;padding-left:18px!important;padding-right:18px!important;color:#94a3b8!important;font-size:12px!important;opacity:.58!important;}',
      '.spx-immersive-read textarea,.spx-immersive-read input[type="text"]{font-size:16px!important;}',
      '.spx-reader .spx-post-body-split,.spx-immersive-read .spx-post-body-split{'+CSS_BOX+'display:grid!important;grid-template-columns:minmax(320px,clamp(360px,34vw,560px)) minmax(0,1fr)!important;gap:clamp(14px,2vw,24px)!important;align-items:start!important;max-width:100%!important;margin:0 auto!important;padding:18px clamp(18px,3vw,36px) 36px!important;background:#fff!important;}',
      '.spx-reader .spx-post-body-split .tpc_content,.spx-immersive-read .spx-post-body-split .tpc_content{'+CSS_BOX+'width:100%!important;max-width:var(--spx-reader-line)!important;margin:0 auto!important;padding:0!important;background:transparent!important;}',
      '.spx-reader .spx-preview-panel,.spx-immersive-read .spx-preview-panel{'+CSS_BOX+'max-width:none!important;margin:0!important;padding:10px!important;background:#f8fafc!important;border:1px solid #d7e1eb!important;border-radius:8px!important;box-shadow:none!important;max-height:min(72vh,680px)!important;overflow:auto!important;}',
      '.spx-reader .spx-preview-header,.spx-immersive-read .spx-preview-header{position:sticky!important;top:0!important;z-index:3!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;margin:0 0 10px!important;background:inherit!important;font-size:13px!important;color:#64748b!important;}',
      '.spx-reader .spx-preview-header strong,.spx-immersive-read .spx-preview-header strong{font-size:14px!important;color:#0f172a!important;}',
      '.spx-reader .spx-preview-summary,.spx-immersive-read .spx-preview-summary{'+CSS_ELLIPSIS+'}',
      '.spx-reader .spx-preview-actions,.spx-immersive-read .spx-preview-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;gap:6px!important;}',
      '.spx-reader .spx-preview-actions button,.spx-immersive-read .spx-preview-actions button{'+CSS_BOX+'height:26px!important;margin:0!important;padding:0 8px!important;border:1px solid #cbd5e1!important;border-radius:6px!important;background:#f8fafc!important;color:#334155!important;font-size:12px!important;line-height:1!important;cursor:pointer!important;}',
      '.spx-reader .spx-preview-actions button:hover,.spx-reader .spx-preview-actions button:focus-visible,.spx-immersive-read .spx-preview-actions button:hover,.spx-immersive-read .spx-preview-actions button:focus-visible{border-color:#38bdf8!important;background:#e0f2fe!important;color:#075985!important;outline:none!important;}',
      '.spx-reader .spx-preview-actions button[aria-pressed="true"],.spx-immersive-read .spx-preview-actions button[aria-pressed="true"]{border-color:#0284c7!important;background:#0284c7!important;color:#fff!important;}',
      '.spx-reader .spx-preview-grid,.spx-immersive-read .spx-preview-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;}',
      '.spx-reader .spx-preview-item,.spx-immersive-read .spx-preview-item{display:block!important;overflow:hidden!important;border:1px solid #e2e8f0!important;border-radius:8px!important;background:#fff!important;text-decoration:none!important;}',
      '.spx-reader .spx-preview-item img,.spx-immersive-read .spx-preview-item img{display:block!important;width:100%!important;height:190px!important;object-fit:cover!important;background:#fff!important;}',
      '.spx-reader .spx-preview-item img[data-spx-preview-ready="0"],.spx-immersive-read .spx-preview-item img[data-spx-preview-ready="0"],.spx-preview-images img[data-spx-preview-ready="0"],.spx-preview-lightbox-image[data-spx-preview-ready="0"],.spx-preview-lightbox-thumb img[data-spx-preview-ready="0"]{opacity:0!important;}',
      '.spx-reader .spx-preview-item img[data-spx-preview-ready="1"],.spx-immersive-read .spx-preview-item img[data-spx-preview-ready="1"],.spx-preview-images img[data-spx-preview-ready="1"],.spx-preview-lightbox-image[data-spx-preview-ready="1"],.spx-preview-lightbox-thumb img[data-spx-preview-ready="1"]{opacity:1!important;transition:opacity .16s ease!important;}',
      '.spx-reader .spx-preview-item .spx-preview-hover-image,.spx-immersive-read .spx-preview-item .spx-preview-hover-image{'+CSS_HIDE+'position:fixed!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;z-index:100002!important;width:auto!important;height:auto!important;max-width:min(64vw,900px)!important;max-height:min(78vh,760px)!important;object-fit:contain!important;padding:6px!important;background:#fff!important;border:1px solid #cbd5e1!important;border-radius:10px!important;box-shadow:0 18px 52px rgba(15,23,42,.28)!important;pointer-events:none!important;transition:opacity .18s ease!important;}',
      '.spx-reader .spx-preview-item:hover .spx-preview-hover-image,.spx-immersive-read .spx-preview-item:hover .spx-preview-hover-image{display:block!important;opacity:.92!important;}',
      '.spx-reader .spx-preview-item:hover .spx-preview-hover-image[data-spx-preview-ready="0"],.spx-immersive-read .spx-preview-item:hover .spx-preview-hover-image[data-spx-preview-ready="0"]{opacity:0!important;}',
      '.spx-reader .spx-preview-item span,.spx-immersive-read .spx-preview-item span{display:block!important;padding:5px 7px!important;font-size:12px!important;line-height:1.35!important;color:#475569!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}',
      '.spx-reader .spx-preview-load-more,.spx-immersive-read .spx-preview-load-more{'+CSS_BOX+'display:block!important;width:100%!important;height:32px!important;margin:10px 0 0!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#334155!important;font-size:12px!important;cursor:pointer!important;}',
      '.spx-reader .spx-preview-load-more:hover,.spx-reader .spx-preview-load-more:focus-visible,.spx-immersive-read .spx-preview-load-more:hover,.spx-immersive-read .spx-preview-load-more:focus-visible{border-color:#38bdf8!important;background:#e0f2fe!important;color:#075985!important;outline:none!important;}',
      '.spx-reader .spx-preview-load-more[hidden],.spx-immersive-read .spx-preview-load-more[hidden]{'+CSS_HIDE+'}',
      '.spx-preview-download{'+CSS_BOX+'display:grid!important;gap:7px!important;margin:0 0 10px!important;padding:8px 9px!important;border:1px solid var(--spx-line-soft)!important;border-radius:8px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;}',
      '.spx-preview-download[hidden]{'+CSS_HIDE+'}.spx-preview-download-top{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;color:var(--spx-strong)!important;font-size:12px!important;font-weight:900!important;}.spx-preview-download-percent{flex:none!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:850!important;}',
      '.spx-preview-download-track{height:8px!important;overflow:hidden!important;border-radius:999px!important;background:var(--spx-line-soft)!important;}.spx-preview-download-progress{display:block!important;width:0;height:100%!important;border-radius:inherit!important;background:linear-gradient(90deg,var(--spx-accent),var(--spx-link))!important;transition:width .16s ease!important;}',
      '.spx-preview-download-compact{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;}.spx-preview-download-badges{display:flex!important;flex-wrap:wrap!important;gap:5px!important;min-width:0!important;}.spx-preview-download-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:22px!important;padding:0 8px!important;border-radius:999px!important;background:#e0f2fe!important;color:#075985!important;font-size:11px!important;font-weight:900!important;white-space:nowrap!important;}.spx-preview-download-badge.spx-ok{background:var(--spx-ok-soft,#dcfce7)!important;color:var(--spx-ok,#15803d)!important;}.spx-preview-download-badge.spx-fail{background:var(--spx-danger-soft)!important;color:var(--spx-danger)!important;}.spx-preview-download-badge.spx-zip{background:#ffedd5!important;color:var(--spx-warn)!important;}',
      '.spx-preview-download-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;gap:6px!important;}.spx-preview-download-actions button{height:24px!important;margin:0!important;padding:0 8px!important;border:1px solid var(--spx-line)!important;border-radius:7px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;font-size:11px!important;font-weight:850!important;line-height:1!important;cursor:pointer!important;}.spx-preview-download-actions button:hover,.spx-preview-download-actions button:focus-visible{border-color:var(--spx-accent)!important;color:var(--spx-accent)!important;outline:none!important;}.spx-preview-download-actions .spx-primary{border-color:var(--spx-accent)!important;background:var(--spx-accent)!important;color:#fff!important;}.spx-preview-download-actions button[disabled]{opacity:.58!important;cursor:not-allowed!important;}',
      '.spx-preview-download-detail{margin:0!important;border:1px solid var(--spx-line-soft)!important;border-radius:8px!important;background:var(--spx-panel)!important;}.spx-preview-download-detail summary{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;min-height:32px!important;padding:0 9px!important;color:var(--spx-text)!important;font-size:12px!important;font-weight:900!important;cursor:pointer!important;list-style:none!important;}.spx-preview-download-detail summary::-webkit-details-marker{'+CSS_HIDE+'}.spx-preview-download-detail summary:after{content:"展开";flex:none!important;color:var(--spx-link)!important;font-size:11px!important;font-weight:900!important;}.spx-preview-download-detail[open] summary{border-bottom:1px solid var(--spx-line-soft)!important;}.spx-preview-download-detail[open] summary:after{content:"收起";}.spx-preview-download-detail-text{'+CSS_ELLIPSIS+'}',
      '.spx-preview-download-queue{display:grid!important;gap:7px!important;padding:8px!important;}.spx-preview-download-row{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important;padding:7px!important;border:1px solid var(--spx-line-soft)!important;border-radius:8px!important;background:var(--spx-panel-muted)!important;}.spx-preview-download-name{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin:0 0 5px!important;color:var(--spx-strong)!important;font-size:12px!important;font-weight:900!important;}.spx-preview-download-name b{'+CSS_ELLIPSIS+'}.spx-preview-download-name em{flex:none!important;color:var(--spx-muted)!important;font-style:normal!important;font-size:11px!important;font-weight:850!important;}.spx-preview-download-meta{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin-top:5px!important;color:var(--spx-muted)!important;font-size:11px!important;font-weight:800!important;}.spx-preview-download-row button{height:24px!important;padding:0 8px!important;border:1px solid #fecaca!important;border-radius:7px!important;background:var(--spx-danger-soft)!important;color:var(--spx-danger)!important;font-size:11px!important;font-weight:850!important;cursor:pointer!important;}.spx-preview-download-row button[disabled]{color:var(--spx-muted)!important;background:var(--spx-panel-muted)!important;border-color:var(--spx-line-soft)!important;cursor:not-allowed!important;}',
      '.spx-preview-download-report{display:grid!important;gap:7px!important;padding:9px!important;border:1px solid #fed7aa!important;border-radius:8px!important;background:#fff7ed!important;color:var(--spx-warn)!important;font-size:12px!important;font-weight:850!important;}.spx-preview-download-report strong{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;color:#7c2d12!important;font-size:12px!important;font-weight:900!important;}',
      '.spx-reader .spx-preview-source,.spx-immersive-read .spx-preview-source{'+CSS_HIDE+'}',
      '.spx-preview-panel.spx-preview-drawer{position:fixed!important;right:14px!important;top:86px!important;bottom:18px!important;z-index:99970!important;'+CSS_BOX+'width:min(clamp(360px,28vw,500px),calc(100vw - 28px))!important;max-width:none!important;max-height:none!important;margin:0!important;padding:10px!important;overflow:auto!important;background:var(--spx-panel-muted)!important;border:1px solid #cbd5e1!important;border-radius:var(--spx-radius-lg)!important;box-shadow:var(--spx-shadow-popover)!important;}',
      '.spx-preview-panel.spx-preview-drawer .spx-preview-grid,.spx-preview-panel.spx-preview-masonry .spx-preview-grid{display:block!important;column-width:150px!important;column-gap:8px!important;}',
      '.spx-preview-panel.spx-preview-drawer .spx-preview-item,.spx-preview-panel.spx-preview-masonry .spx-preview-item{display:block!important;break-inside:avoid!important;margin:0 0 8px!important;background:#fff!important;}',
      '.spx-preview-panel.spx-preview-drawer .spx-preview-item img:not(.spx-preview-hover-image),.spx-preview-panel.spx-preview-masonry .spx-preview-item img:not(.spx-preview-hover-image){width:100%!important;height:auto!important;max-height:none!important;object-fit:contain!important;}',
      '.spx-preview-panel.spx-preview-drawer .spx-preview-drawer-tab{'+CSS_HIDE+'}',
      '.spx-preview-panel.spx-preview-drawer.spx-preview-collapsed{top:120px!important;bottom:auto!important;width:48px!important;height:132px!important;padding:0!important;overflow:hidden!important;border-radius:10px 0 0 10px!important;}',
      '.spx-preview-panel.spx-preview-drawer.spx-preview-collapsed .spx-preview-header,.spx-preview-panel.spx-preview-drawer.spx-preview-collapsed .spx-preview-download,.spx-preview-panel.spx-preview-drawer.spx-preview-collapsed .spx-preview-grid,.spx-preview-panel.spx-preview-drawer.spx-preview-collapsed .spx-preview-load-more{'+CSS_HIDE+'}',
      '.spx-preview-panel.spx-preview-drawer.spx-preview-collapsed .spx-preview-drawer-tab{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:100%!important;border:0!important;border-radius:0!important;background:var(--spx-accent)!important;color:#fff!important;font-weight:900!important;writing-mode:vertical-rl!important;letter-spacing:.08em!important;cursor:pointer!important;}',
      '.spx-preview-lightbox{position:fixed!important;inset:0!important;z-index:100010!important;'+CSS_BOX+'display:flex!important;padding:18px!important;background:rgba(2,6,23,.9)!important;backdrop-filter:blur(5px)!important;color:#e2e8f0!important;font:13px/1.45 '+SPX_FONT+'!important;}',
      '.spx-preview-lightbox-shell{'+CSS_BOX+'display:flex!important;flex:1!important;min-width:0!important;min-height:0!important;flex-direction:column!important;overflow:hidden!important;border:1px solid rgba(148,163,184,.34)!important;border-radius:12px!important;background:#020617!important;box-shadow:0 24px 80px rgba(0,0,0,.5)!important;}',
      '.spx-preview-lightbox-toolbar{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:48px!important;padding:8px 10px 8px 14px!important;border-bottom:1px solid rgba(148,163,184,.22)!important;background:#0f172a!important;}',
      '.spx-preview-lightbox-counter{font-weight:700!important;color:#f8fafc!important;white-space:nowrap!important;}',
      '.spx-preview-lightbox-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;gap:6px!important;}',
      '.spx-preview-lightbox button{'+CSS_BOX+'min-width:34px!important;height:32px!important;margin:0!important;padding:0 10px!important;border:1px solid #334155!important;border-radius:7px!important;background:#1e293b!important;color:#e2e8f0!important;cursor:pointer!important;font:600 13px/1 '+SPX_FONT+'!important;}',
      '.spx-preview-lightbox button:hover,.spx-preview-lightbox button:focus-visible{border-color:#38bdf8!important;background:#0c4a6e!important;color:#fff!important;outline:none!important;}',
      '.spx-preview-lightbox-zoom{display:inline-flex!important;min-width:58px!important;justify-content:center!important;color:#cbd5e1!important;font-variant-numeric:tabular-nums!important;}',
      '.spx-preview-lightbox-stage{position:relative!important;flex:1!important;min-height:0!important;overflow:hidden!important;background:#020617!important;}',
      '.spx-preview-lightbox-viewport{position:absolute!important;inset:0!important;overflow:auto!important;overscroll-behavior:contain!important;}',
      '.spx-preview-lightbox-canvas{'+CSS_BOX+'display:flex!important;align-items:center!important;justify-content:center!important;min-width:100%!important;min-height:100%!important;padding:34px 78px!important;}',
      '.spx-preview-lightbox-image{display:block!important;flex:none!important;max-width:none!important;max-height:none!important;object-fit:contain!important;background:#fff!important;box-shadow:0 16px 50px rgba(0,0,0,.45)!important;}',
      '.spx-preview-lightbox-nav{position:absolute!important;top:50%!important;z-index:2!important;width:46px!important;height:64px!important;padding:0!important;transform:translateY(-50%)!important;border-color:rgba(148,163,184,.35)!important;background:rgba(15,23,42,.78)!important;font-size:30px!important;}',
      '.spx-preview-lightbox-prev{left:14px!important;}',
      '.spx-preview-lightbox-next{right:14px!important;}',
      '.spx-preview-lightbox-caption{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:38px!important;padding:7px 14px!important;border-top:1px solid rgba(148,163,184,.22)!important;background:#0f172a!important;color:#94a3b8!important;}',
      '.spx-preview-lightbox-url{'+CSS_ELLIPSIS+'}',
      '.spx-preview-lightbox-help{flex:none!important;white-space:nowrap!important;font-size:12px!important;color:#64748b!important;}',
      '.spx-preview-lightbox-strip{display:flex!important;gap:7px!important;overflow-x:auto!important;padding:8px 10px!important;border-top:1px solid rgba(148,163,184,.18)!important;background:#020617!important;scrollbar-width:thin!important;}',
      '.spx-preview-lightbox-thumb{'+CSS_BOX+'flex:none!important;width:58px!important;height:46px!important;padding:0!important;border:2px solid transparent!important;border-radius:7px!important;overflow:hidden!important;background:#111827!important;opacity:.62!important;cursor:pointer!important;}',
      '.spx-preview-lightbox-thumb.spx-active{border-color:#38bdf8!important;opacity:1!important;}',
      '.spx-preview-lightbox-thumb img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;}',
      '.spx-clean #notice,.spx-clean #footer,.spx-clean .footer{'+CSS_HIDE+'}',
      '.spx-clean:not(.spx-site-shell) #wrapA{max-width:1180px!important;margin:0 auto!important;}',
      '.spx-clean #main{margin-top:8px!important;}',
      '.spx-clean table{border-collapse:collapse;}',
    ];
  }

  function getInjectedWidgetStyleRules() {
    return [
      '.spx-toolbar{position:fixed;right:14px;bottom:18px;z-index:99999;display:flex;flex-direction:column;gap:7px;box-sizing:border-box;padding:6px;border:1px solid rgba(203,213,225,.8);border-radius:16px;background:rgba(255,255,255,.92);box-shadow:0 18px 46px rgba(15,23,42,.18);font:12px/1.2 Arial,Helvetica,sans-serif;backdrop-filter:blur(10px);}',
      '.spx-toolbar button{width:52px;height:36px;border:1px solid transparent;border-radius:12px;background:#fff;color:var(--spx-text);box-shadow:0 4px 12px rgba(15,23,42,.08);cursor:pointer;text-align:center;display:flex;align-items:center;justify-content:center;padding:0;font-size:13px;font-weight:800;transition:background .16s ease,border-color .16s ease,color .16s ease,transform .16s ease,box-shadow .16s ease;}',
      '.spx-toolbar button:hover,.spx-toolbar button:focus-visible{border-color:var(--spx-accent);color:var(--spx-accent);box-shadow:0 7px 18px rgba(15,118,110,.16);outline:none;transform:translateY(-1px);}',
      '.spx-toolbar .spx-active{background:var(--spx-accent-soft);border-color:var(--spx-accent);color:var(--spx-accent);font-weight:bold;box-shadow:inset 0 0 0 1px rgba(15,118,110,.12),0 6px 16px rgba(15,118,110,.14);}',
      '.spx-command-overlay{position:fixed!important;inset:0!important;z-index:100080!important;'+CSS_BOX+'display:flex!important;align-items:flex-start!important;justify-content:center!important;padding:72px 24px 28px!important;background:rgba(15,23,42,.28)!important;backdrop-filter:blur(3px)!important;color:var(--spx-text)!important;font:13px/1.45 '+SPX_FONT+'!important;}',
      '.spx-command-overlay[hidden]{'+CSS_HIDE+'}.spx-command-wrap{'+CSS_BOX+'display:grid!important;grid-template-columns:minmax(0,720px) minmax(220px,300px)!important;gap:12px!important;width:min(1032px,calc(100vw - 72px))!important;align-items:start!important;}.spx-command-palette,.spx-command-detail{'+CSS_BOX+'overflow:hidden!important;border:1px solid var(--spx-line)!important;border-radius:14px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;box-shadow:var(--spx-shadow-popover)!important;}.spx-command-palette{display:flex!important;flex-direction:column!important;max-height:calc(100vh - 112px)!important;}',
      '.spx-command-head{display:grid!important;gap:10px!important;padding:14px!important;border-bottom:1px solid var(--spx-line-soft)!important;background:linear-gradient(180deg,#fff 0%,#f8fafc 100%)!important;}.spx-command-title{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;}.spx-command-title strong{display:block!important;color:var(--spx-strong)!important;font-size:15px!important;line-height:1.25!important;font-weight:900!important;}.spx-command-title span{color:var(--spx-sub)!important;font-size:12px!important;font-weight:900!important;white-space:nowrap!important;}.spx-command-close{flex:none!important;width:30px!important;height:30px!important;border:1px solid var(--spx-line)!important;border-radius:9px!important;background:var(--spx-panel)!important;color:var(--spx-sub)!important;font-size:16px!important;font-weight:900!important;cursor:pointer!important;}',
      '.spx-command-search-wrap{position:relative!important;}.spx-command-search{'+CSS_BOX+'width:100%!important;height:42px!important;padding:0 42px 0 14px!important;border:1px solid var(--spx-line)!important;border-radius:9px!important;background:var(--spx-input-bg)!important;color:var(--spx-text)!important;font-size:15px!important;font-weight:850!important;outline:none!important;}.spx-command-search:focus{border-color:var(--spx-accent)!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important;}.spx-command-search-mark{position:absolute!important;right:12px!important;top:50%!important;transform:translateY(-50%)!important;color:var(--spx-muted)!important;font-size:13px!important;font-weight:900!important;}',
      '.spx-command-tabs{display:flex!important;gap:7px!important;min-width:0!important;overflow-x:auto!important;scrollbar-width:thin!important;}.spx-command-tab{flex:none!important;min-height:28px!important;padding:0 10px!important;border:1px solid var(--spx-line)!important;border-radius:999px!important;background:var(--spx-panel)!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:900!important;cursor:pointer!important;}.spx-command-tab.spx-active{border-color:var(--spx-accent)!important;background:var(--spx-accent-wash)!important;color:var(--spx-accent)!important;}',
      '.spx-command-list{display:grid!important;flex:1 1 auto!important;min-height:0!important;max-height:min(56vh,474px)!important;overflow:auto!important;padding:10px!important;scrollbar-width:thin!important;}.spx-command-item{'+CSS_BOX+'display:grid!important;grid-template-columns:38px minmax(0,1fr) auto!important;gap:10px!important;align-items:center!important;min-height:64px!important;width:100%!important;padding:9px 10px!important;border:1px solid transparent!important;border-radius:12px!important;background:transparent!important;color:var(--spx-text)!important;text-align:left!important;cursor:pointer!important;}.spx-command-item:hover,.spx-command-item.spx-active{border-color:var(--spx-line)!important;background:var(--spx-panel-muted)!important;}.spx-command-item.spx-active{box-shadow:inset 3px 0 0 var(--spx-accent)!important;}',
      '.spx-command-icon{display:inline-flex!important;width:38px!important;height:38px!important;align-items:center!important;justify-content:center!important;border:1px solid var(--spx-line)!important;border-radius:10px!important;background:var(--spx-panel)!important;color:var(--spx-accent)!important;font-size:13px!important;font-weight:900!important;}.spx-command-main{min-width:0!important;}.spx-command-main strong{display:block!important;color:var(--spx-strong)!important;font-size:14px!important;line-height:1.3!important;font-weight:900!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}.spx-command-main span{display:block!important;margin-top:3px!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:750!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}',
      '.spx-command-tail{display:flex!important;align-items:center!important;gap:7px!important;color:var(--spx-muted)!important;font-size:11px!important;font-weight:900!important;white-space:nowrap!important;}.spx-command-pill,.spx-command-kbd{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:22px!important;padding:0 8px!important;border-radius:999px!important;background:var(--spx-accent-wash)!important;color:var(--spx-accent)!important;font-size:11px!important;font-weight:900!important;}.spx-command-kbd{min-width:34px!important;height:20px!important;border:1px solid var(--spx-line)!important;border-radius:6px!important;background:var(--spx-panel)!important;color:var(--spx-sub)!important;box-shadow:inset 0 -1px 0 rgba(15,23,42,.08)!important;}.spx-command-pill.spx-warn{background:#ffedd5!important;color:#7c2d12!important;}.spx-command-pill.spx-ok{background:#dcfce7!important;color:#15803d!important;}',
      '.spx-command-empty{padding:22px 10px!important;color:var(--spx-sub)!important;text-align:center!important;font-size:13px!important;font-weight:800!important;}.spx-command-foot{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;padding:9px 14px!important;border-top:1px solid var(--spx-line-soft)!important;background:var(--spx-panel-muted)!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:850!important;}.spx-command-keys{display:flex!important;flex-wrap:wrap!important;gap:6px!important;justify-content:flex-end!important;}',
      '.spx-command-detail{padding:14px!important;}.spx-command-detail h3{margin:0!important;color:var(--spx-strong)!important;font-size:15px!important;line-height:1.3!important;font-weight:900!important;}.spx-command-detail p{margin:5px 0 12px!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:750!important;}.spx-command-detail-card{display:grid!important;gap:9px!important;padding:11px!important;border:1px solid var(--spx-line-soft)!important;border-radius:12px!important;background:var(--spx-panel-muted)!important;}.spx-command-detail-row{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;min-height:26px!important;color:var(--spx-text)!important;font-size:12px!important;font-weight:850!important;}.spx-command-detail-row span:first-child{flex:none!important;color:var(--spx-sub)!important;}.spx-command-detail-row strong,.spx-command-detail-row a{'+CSS_ELLIPSIS+'text-align:right!important;color:inherit!important;font-weight:900!important;text-decoration:none!important;}.spx-command-detail-row a:hover{text-decoration:underline!important;}.spx-command-detail-target{align-items:flex-start!important;}.spx-command-detail-target strong,.spx-command-detail-target a{white-space:normal!important;overflow:visible!important;overflow-wrap:anywhere!important;word-break:break-word!important;line-height:1.35!important;text-align:left!important;color:var(--spx-link)!important;}',
      '@media(max-width:980px){.spx-command-wrap{grid-template-columns:1fr!important;width:min(720px,calc(100vw - 52px))!important}.spx-command-detail{display:none!important}}',
      '@media(max-width:760px){.spx-command-overlay{padding:58px 8px 20px!important}.spx-command-wrap{width:calc(100vw - 16px)!important}.spx-command-palette{max-height:calc(100vh - 78px)!important}.spx-command-list{max-height:none!important}.spx-command-item{grid-template-columns:34px minmax(0,1fr)!important;min-height:62px!important}.spx-command-icon{width:34px!important;height:34px!important}.spx-command-tail{grid-column:2!important;justify-content:flex-start!important}.spx-command-foot{align-items:flex-start!important;flex-direction:column!important}}',
      '.spx-toolbox{position:fixed;right:82px;bottom:18px;width:min(440px,calc(100vw - 24px));max-height:min(72vh,680px);overflow:hidden;z-index:100000;box-sizing:border-box;background:rgba(255,255,255,.98);border:1px solid rgba(148,163,184,.48);box-shadow:var(--spx-shadow-strong);border-radius:var(--spx-radius-xl);padding:0;color:var(--spx-text);font:13px/1.45 Arial,Helvetica,sans-serif;backdrop-filter:blur(12px);}',
      '.spx-toolbox[hidden]{'+CSS_HIDE+'}',
      '.spx-toolbox-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid var(--spx-line-soft);background:linear-gradient(135deg,#f8fafc 0%,#ecfeff 100%);}',
      '.spx-toolbox-eyebrow{margin:0 0 3px;color:#0f766e;font-size:11px;font-weight:900;letter-spacing:.08em;}',
      '.spx-toolbox-header h3{margin:0;color:var(--spx-strong);font-size:17px;line-height:1.25;}',
      '.spx-toolbox-header p{display:none;}',
      '.spx-toolbox-close{flex:none;width:32px;height:32px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#334155;cursor:pointer;font-size:18px;font-weight:800;line-height:1;}',
      '.spx-toolbox-close:hover,.spx-toolbox-close:focus-visible{border-color:#0f766e;color:#0f766e;outline:none;}',
      '.spx-toolbox-body{box-sizing:border-box;max-height:calc(min(72vh,680px) - 58px);overflow:auto;padding:12px 13px 13px;scrollbar-width:thin;}',
      '.spx-toolbox-section{margin-top:12px;}',
      '.spx-toolbox-section:first-of-type{margin-top:0;}',
      '.spx-toolbox-section-title{display:flex;align-items:center;gap:8px;margin:0 0 8px;color:#475569;font-size:12px;font-weight:900;letter-spacing:.02em;}',
      '.spx-toolbox-section-title:after{content:"";height:1px;flex:1;background:#e2e8f0;}',
      '.spx-toolbox-count{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#e0f2fe;color:#075985;font-size:11px;font-weight:900;letter-spacing:0;}',
      '.spx-toolbox-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;}',
      '.spx-toolbox-action{box-sizing:border-box;min-width:0;min-height:56px;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:9px;position:relative;border:1px solid #dbe4ee!important;border-radius:var(--spx-radius-lg)!important;background:#fff!important;color:#1f2937!important;padding:9px 10px!important;text-align:left!important;text-decoration:none!important;cursor:pointer!important;box-shadow:0 5px 16px rgba(15,23,42,.06)!important;transition:background .16s ease,border-color .16s ease,color .16s ease,transform .16s ease,box-shadow .16s ease!important;}',
      '.spx-toolbox-action:hover,.spx-toolbox-action:focus-visible{border-color:var(--spx-accent)!important;background:#f0fdfa!important;color:#0f766e!important;text-decoration:none!important;outline:none!important;box-shadow:0 10px 24px rgba(15,118,110,.15)!important;transform:translateY(-1px)!important;}',
      '.spx-toolbox-action.spx-active{border-color:#0f766e!important;background:#ccfbf1!important;color:#0f766e!important;box-shadow:0 8px 22px rgba(15,118,110,.18)!important;}',
      '.spx-toolbox-action.spx-active:before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:0 999px 999px 0;background:#0f766e;}',
      '.spx-toolbox-key{flex:none;width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#f8fafc;border:1px solid #cbd5e1;color:#075985;font-size:15px;font-weight:900;}',
      '.spx-toolbox-action.spx-active .spx-toolbox-key{border-color:#0f766e;background:#f0fdfa;color:#0f766e;}',
      '.spx-toolbox-copy{min-width:0;display:block;}',
      '.spx-toolbox-name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:inherit;font-size:13px;font-weight:800;line-height:1.25;}',
      '.spx-toolbox-desc{display:-webkit-box;overflow:hidden;-webkit-line-clamp:1;-webkit-box-orient:vertical;margin-top:4px;color:#64748b;font-size:11px;line-height:1.3;}',
      '.spx-settings{position:fixed;right:66px;bottom:18px;width:min(520px,calc(100vw - 24px));max-height:var(--spx-panel-max-height);overflow:hidden;z-index:100000;display:flex;flex-direction:column;background:var(--spx-panel);border:1px solid var(--spx-line);box-shadow:var(--spx-shadow-popover);border-radius:var(--spx-radius-lg);padding:0;color:var(--spx-text);font:13px/1.45 Arial,Helvetica,sans-serif;}',
      '.spx-settings[hidden]{'+CSS_HIDE+'}',
      '.spx-settings-header{flex:none;padding:13px 16px;border-bottom:1px solid var(--spx-line-soft);background:linear-gradient(135deg,#fff 0%,#f8fafc 100%);}',
      '.spx-settings h3{margin:0;font-size:16px;color:var(--spx-strong);line-height:1.3;}',
      '.spx-settings-subtitle{margin:3px 0 0;color:var(--spx-sub);font-size:12px;}',
      '.spx-settings-body{box-sizing:border-box;overflow:auto;padding:12px;display:grid;gap:11px;scrollbar-width:thin;}',
      '.spx-settings-section{box-sizing:border-box;padding:11px 12px;border:1px solid var(--spx-line-soft);border-radius:var(--spx-radius-lg);background:var(--spx-panel-muted);}',
      '.spx-settings-section h4{margin:0 0 8px;color:var(--spx-strong);font-size:13px;font-weight:900;line-height:1.3;}',
      '.spx-settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 12px;}',
      '.spx-settings label{display:flex;gap:8px;align-items:center;min-height:26px;margin:0;color:var(--spx-text);}',
      '.spx-settings label input[type="checkbox"]{flex:none;accent-color:var(--spx-accent);}',
      '.spx-settings .spx-number-setting{justify-content:space-between;gap:10px;}',
      '.spx-settings .spx-number-setting input{box-sizing:border-box;width:92px;height:var(--spx-control-height);border:1px solid var(--spx-line);border-radius:var(--spx-radius-sm);padding:0 8px;text-align:right;}',
      '.spx-settings .spx-choice-setting{justify-content:space-between;gap:10px;}',
      '.spx-settings .spx-choice-setting select{box-sizing:border-box;min-width:132px;height:var(--spx-control-height);border:1px solid var(--spx-line);border-radius:var(--spx-radius-sm);padding:0 8px;background:#fff;color:var(--spx-text);}',
      '.spx-settings textarea{box-sizing:border-box;width:100%;min-height:72px;border:1px solid var(--spx-line);border-radius:var(--spx-radius-sm);padding:7px;background:#fff;font:12px/1.4 monospace;}',
      '.spx-settings .spx-help{margin:4px 0 8px;color:var(--spx-sub);font-size:12px;}',
      '.spx-settings .spx-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}',
      '.spx-settings-footer{flex:none;display:flex;justify-content:flex-end;gap:8px;padding:10px 12px;border-top:1px solid var(--spx-line-soft);background:#fff;}',
      '.spx-settings button{border:1px solid var(--spx-line);border-radius:var(--spx-radius-sm);background:#fff;padding:6px 10px;cursor:pointer;color:var(--spx-text);}',
      '.spx-settings .spx-primary{background:var(--spx-accent);border-color:var(--spx-accent);color:#fff;}',
      '.spx-settings .spx-danger{border-color:#fecaca;background:var(--spx-danger-soft);color:var(--spx-danger);}',
      '.spx-settings-presets .spx-preset-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;}.spx-settings-presets .spx-preset-tabs button{min-height:34px;font-weight:900;background:#fff;border-color:var(--spx-line);}.spx-settings-presets .spx-preset-tabs button:hover{border-color:var(--spx-accent);color:var(--spx-accent);}',
      '.spx-batch-confirm-overlay{position:fixed;inset:0;z-index:100090;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:18px;background:rgba(15,23,42,.36);backdrop-filter:blur(4px);font:13px/1.45 '+SPX_FONT+';color:var(--spx-text);}',
      '.spx-batch-confirm{box-sizing:border-box;width:min(520px,calc(100vw - 32px));max-height:min(78vh,680px);overflow:auto;padding:14px;border:1px solid var(--spx-line);border-radius:16px;background:var(--spx-panel);box-shadow:var(--spx-shadow-popover);}.spx-batch-confirm-head{display:grid;gap:5px;margin-bottom:11px;}.spx-batch-confirm-head strong{color:var(--spx-strong);font-size:16px;font-weight:900;line-height:1.3;}.spx-batch-confirm-head span{color:var(--spx-sub);font-size:12px;}',
      '.spx-batch-impact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:11px;}.spx-batch-impact{box-sizing:border-box;display:grid;gap:2px;padding:10px;border:1px solid var(--spx-line-soft);border-radius:11px;background:var(--spx-panel-muted);}.spx-batch-impact b{color:var(--spx-strong);font-size:20px;line-height:1;font-weight:900;}.spx-batch-impact span{color:var(--spx-text);font-size:12px;font-weight:900;}.spx-batch-impact em{color:var(--spx-sub);font-size:11px;font-style:normal;}',
      '.spx-batch-list{display:grid;gap:6px;max-height:240px;overflow:auto;margin:0 0 12px;padding:8px;border:1px solid var(--spx-line-soft);border-radius:12px;background:#fff;}.spx-batch-item{display:grid;gap:2px;min-width:0;padding:6px 7px;border-radius:8px;background:var(--spx-panel-muted);}.spx-batch-item span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--spx-strong);font-weight:900;}.spx-batch-item em,.spx-batch-more{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--spx-sub);font-size:11px;font-style:normal;}',
      '.spx-batch-confirm-foot{display:flex;justify-content:flex-end;gap:8px;}.spx-batch-confirm-foot button{min-height:34px;padding:0 12px;border:1px solid var(--spx-line);border-radius:9px;background:#fff;color:var(--spx-text);font-weight:900;cursor:pointer;}.spx-batch-confirm-foot .spx-primary{border-color:var(--spx-danger);background:var(--spx-danger);color:#fff;}.spx-batch-confirm:not(.spx-batch-danger) .spx-batch-confirm-foot .spx-primary{border-color:var(--spx-accent);background:var(--spx-accent);}',
      '.spx-data-health{box-sizing:border-box;margin-top:10px;padding:10px;border:1px solid #e2e8f0;border-radius:var(--spx-radius);background:#fff;}',
      '.spx-data-health[hidden]{'+CSS_HIDE+'}',
      '.spx-storage-usage{display:grid;gap:6px;margin:7px 0 9px;font-size:12px;color:#334155;}',
      '.spx-storage-usage-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:7px 8px;border-radius:7px;background:#fff;border:1px solid #e5e7eb;}',
      '.spx-storage-usage-row.spx-storage-warning{border-color:#fbbf24;background:#fffbeb;}',
      '.spx-storage-usage-row.spx-storage-danger{border-color:#f87171;background:#fef2f2;}',
      '.spx-storage-usage-main{min-width:0;display:block;}',
      '.spx-storage-usage-main b{display:block;color:#0f172a;font-size:12px;line-height:1.3;}',
      '.spx-storage-usage-main em{display:block;margin-top:2px;color:#94a3b8;font-style:normal;font-size:11px;line-height:1.25;word-break:break-all;}',
      '.spx-storage-usage-meta{flex:none;text-align:right;color:#334155;font-weight:800;line-height:1.45;white-space:nowrap;}',
      '.spx-storage-suggestions{margin:6px 0 8px;padding:7px 8px;border-radius:7px;background:#fff;border:1px solid #e5e7eb;color:#475569;font-size:12px;line-height:1.45;}',
      '.spx-watch-center{position:fixed;right:66px;bottom:18px;width:var(--spx-panel-width);max-height:var(--spx-panel-max-height);overflow:auto;z-index:100000;background:var(--spx-panel);border:1px solid var(--spx-line);box-shadow:var(--spx-shadow-popover);border-radius:var(--spx-radius-lg);padding:14px;color:var(--spx-text);font:13px/1.45 Arial,Helvetica,sans-serif;scrollbar-width:thin;}',
      '.spx-resource-panel,#spx-resource-center{width:min(720px,calc(100vw - 96px));}',
      '#spx-content-center{width:min(680px,calc(100vw - 96px));}.spx-content-center-header p{margin:3px 0 0;color:var(--spx-sub);font-size:12px;}.spx-content-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:12px 0;}.spx-content-stat{box-sizing:border-box;display:grid;gap:2px;min-width:0;padding:10px;border:1px solid var(--spx-line-soft);border-radius:12px;background:var(--spx-panel-muted);}.spx-content-stat b{color:var(--spx-strong);font-size:19px;line-height:1;font-weight:900;}.spx-content-stat span{color:var(--spx-text);font-size:12px;font-weight:900;}.spx-content-stat em{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--spx-sub);font-size:11px;font-style:normal;}.spx-content-stat.spx-ok{border-color:#bbf7d0;background:#f0fdf4;}.spx-content-stat.spx-warn{border-color:#fde68a;background:#fffbeb;}',
      '.spx-workbench-open .spx-read-resource-rail,.spx-workbench-open .spx-read-resource-launcher,.spx-workbench-open .spx-preview-panel.spx-preview-drawer,.spx-workbench-open .spx-preview-popover{'+CSS_HIDE+'}.spx-module-body.spx-workbench-mode>*:not(.spx-workbench){'+CSS_HIDE+'}.spx-workbench{box-sizing:border-box;width:100%;max-width:100%;min-width:0;margin:0 0 12px;overflow:hidden;border:1px solid var(--spx-line);border-radius:14px;background:var(--spx-panel);box-shadow:var(--spx-shadow-card);color:var(--spx-text);font:13px/1.45 Arial,Helvetica,sans-serif;}.spx-workbench[hidden]{'+CSS_HIDE+'}.spx-workbench-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;min-width:0;padding:13px 14px;border-bottom:1px solid var(--spx-line-soft);background:linear-gradient(135deg,#fff 0%,#f8fafc 100%);}.spx-workbench-title{min-width:0;}.spx-workbench-title strong{display:block;color:var(--spx-strong);font-size:16px;font-weight:900;line-height:1.25;}.spx-workbench-title span{display:block;margin-top:3px;color:var(--spx-sub);font-size:12px;font-weight:800;}.spx-workbench-close{flex:none;min-height:30px;padding:0 10px;border:1px solid var(--spx-line);border-radius:9px;background:#fff;color:var(--spx-text);font-size:12px;font-weight:900;cursor:pointer;}.spx-workbench-tabs{display:flex;gap:7px;max-width:100%;overflow:auto;padding:10px 12px;border-bottom:1px solid var(--spx-line-soft);background:var(--spx-panel-muted);scrollbar-width:thin;}.spx-workbench-tab{flex:none;min-height:30px;padding:0 10px;border:1px solid var(--spx-line);border-radius:999px;background:var(--spx-panel);color:var(--spx-sub);font-size:12px;font-weight:900;cursor:pointer;}.spx-workbench-tab.spx-active{border-color:var(--spx-accent);background:var(--spx-accent-wash);color:var(--spx-accent);}.spx-workbench-stage{min-width:0;max-width:100%;overflow:hidden;}.spx-workbench-inline-panel.spx-watch-center{'+CSS_BOX+'position:static!important;right:auto!important;bottom:auto!important;display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;max-height:none!important;overflow:hidden!important;z-index:auto!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;padding:14px!important;}.spx-workbench-inline-panel.spx-watch-center[hidden]{'+CSS_HIDE+'}.spx-workbench-inline-panel .spx-watch-center-header{'+CSS_BOX+'position:static!important;top:auto!important;display:flex!important;align-items:flex-start!important;justify-content:space-between!important;flex-wrap:wrap!important;width:auto!important;max-width:100%!important;min-width:0!important;background:rgba(255,255,255,.92);}.spx-workbench-inline-panel .spx-watch-center-header>div:first-child{min-width:0!important;}.spx-workbench-inline-panel .spx-watch-center-header .spx-watch-actions{flex:1 1 260px!important;justify-content:flex-end!important;max-width:100%!important;min-width:0!important;}.spx-workbench-inline-panel#spx-content-center,.spx-workbench-inline-panel#spx-resource-center{width:100%!important;max-width:100%!important;}.spx-workbench-inline-panel .spx-watch-controls{'+CSS_BOX+'max-width:100%;min-width:0;}.spx-workbench-inline-panel .spx-watch-controls input{flex:1 1 260px!important;min-width:0!important;max-width:100%;}.spx-workbench-inline-panel .spx-watch-controls select{flex:1 1 150px!important;min-width:0!important;max-width:100%;}.spx-workbench-inline-panel .spx-watch-actions button,.spx-workbench-inline-panel .spx-watch-actions a{white-space:nowrap!important;}',
      '.spx-content-shortcuts{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}.spx-content-shortcuts button{min-height:32px;padding:0 10px;border:1px solid var(--spx-line);border-radius:9px;background:#fff;color:var(--spx-text);font-weight:900;cursor:pointer;}.spx-content-shortcuts .spx-primary{border-color:var(--spx-accent);background:var(--spx-accent);color:#fff;}.spx-content-recent-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}.spx-content-recent-section{box-sizing:border-box;padding:10px;border:1px solid var(--spx-line-soft);border-radius:12px;background:var(--spx-panel-muted);}.spx-content-recent-section h4{margin:0 0 8px;color:var(--spx-strong);font-size:13px;font-weight:900;}.spx-content-recent-list{display:grid;gap:7px;}.spx-content-recent{display:grid;gap:3px;min-width:0;padding:7px;border-radius:9px;background:#fff;border:1px solid var(--spx-line-soft);}.spx-content-recent strong,.spx-content-recent span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.spx-content-recent strong{color:var(--spx-strong);font-size:12px;}.spx-content-recent span,.spx-content-empty{color:var(--spx-sub);font-size:11px;}',
      '.spx-read-summary-card{box-sizing:border-box;width:100%;max-width:100%;min-width:0;overflow:hidden;margin:10px 0 12px;padding:14px;border:1px solid var(--spx-line);border-radius:16px;background:var(--spx-panel);box-shadow:var(--spx-shadow-card);color:var(--spx-text);font:13px/1.45 '+SPX_FONT+';}.spx-read-summary-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:start;margin-bottom:11px;}.spx-read-summary-copy{min-width:0;}.spx-read-summary-eyebrow{margin-bottom:3px;color:var(--spx-accent);font-size:11px;font-weight:900;letter-spacing:.04em;}.spx-read-summary-copy h3{margin:0;color:var(--spx-strong);font-size:17px;line-height:1.35;font-weight:900;word-break:break-word;}.spx-read-summary-copy p{margin:4px 0 0;color:var(--spx-sub);font-size:12px;}.spx-read-summary-chips{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;}.spx-chip{display:inline-flex;align-items:center;min-height:24px;padding:0 8px;border:1px solid var(--spx-line);border-radius:999px;background:var(--spx-panel-muted);color:var(--spx-sub);font-size:11px;font-weight:900;}.spx-chip.spx-ok{border-color:#bbf7d0;background:#f0fdf4;color:#15803d;}.spx-chip.spx-warn{border-color:#fde68a;background:#fffbeb;color:#92400e;}.spx-chip.spx-danger{border-color:#fecaca;background:#fef2f2;color:#b91c1c;}',
      '.spx-read-summary-progress{display:grid;grid-template-columns:auto minmax(140px,1fr);gap:10px;align-items:center;margin-bottom:11px;color:var(--spx-sub);font-size:12px;font-weight:900;}.spx-read-summary-track{height:8px;border-radius:999px;background:#e2e8f0;overflow:hidden;}.spx-read-summary-track i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--spx-accent),#22c55e);}.spx-read-summary-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:8px;margin-bottom:12px;}.spx-read-summary-metric{box-sizing:border-box;display:grid;gap:2px;min-width:0;padding:9px;border:1px solid var(--spx-line-soft);border-radius:12px;background:var(--spx-panel-muted);}.spx-read-summary-metric b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--spx-strong);font-size:16px;font-weight:900;}.spx-read-summary-metric span{color:var(--spx-text);font-size:12px;font-weight:900;}.spx-read-summary-metric em{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--spx-sub);font-size:11px;font-style:normal;}.spx-read-summary-metric.spx-ok{border-color:#bbf7d0;background:#f0fdf4;}.spx-read-summary-metric.spx-warn{border-color:#fde68a;background:#fffbeb;}.spx-read-summary-metric.spx-danger{border-color:#fecaca;background:#fef2f2;}.spx-read-summary-actions{display:flex;flex-wrap:wrap;gap:7px;}.spx-read-summary-actions button{min-height:32px;padding:0 10px;border:1px solid var(--spx-line);border-radius:9px;background:#fff;color:var(--spx-text);font-weight:900;cursor:pointer;}.spx-read-summary-actions button:disabled{cursor:default;opacity:.56;}.spx-read-summary-actions .spx-primary{border-color:var(--spx-accent);background:var(--spx-accent);color:#fff;}.spx-read-summary-actions button:hover:not(:disabled){border-color:var(--spx-accent);color:var(--spx-accent);background:var(--spx-accent-wash);}',
      '.spx-read-resource-rail{position:fixed!important;right:76px!important;top:72px!important;z-index:100015!important;'+CSS_BOX+'display:flex!important;flex-direction:column!important;width:320px!important;max-height:calc(100vh - 112px)!important;padding:12px!important;border:1px solid var(--spx-line)!important;border-radius:16px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;box-shadow:var(--spx-shadow-popover)!important;font:13px/1.45 '+SPX_FONT+'!important;}',
      '.spx-read-resource-rail[hidden]{'+CSS_HIDE+'}',
      '.spx-read-resource-rail-head{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:10px!important;margin:-12px -12px 10px!important;padding:12px!important;border-bottom:1px solid var(--spx-line-soft)!important;border-radius:16px 16px 0 0!important;background:linear-gradient(180deg,#fff 0%,#f8fafc 100%)!important;}',
      '.spx-read-resource-rail-head strong{display:block!important;color:var(--spx-strong)!important;font-size:15px!important;font-weight:900!important;line-height:1.25!important;}',
      '.spx-read-resource-summary{display:block!important;margin-top:3px!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:800!important;}',
      '.spx-read-resource-rail button,.spx-read-resource-launcher{'+CSS_BOX+'border:1px solid var(--spx-line)!important;border-radius:8px!important;background:#fff!important;color:var(--spx-text)!important;cursor:pointer!important;font:800 12px/1.2 '+SPX_FONT+'!important;}',
      '.spx-read-resource-rail button{min-height:28px!important;padding:0 9px!important;}',
      '.spx-read-resource-rail button:hover,.spx-read-resource-launcher:hover{border-color:var(--spx-accent)!important;color:var(--spx-accent)!important;background:var(--spx-accent-wash)!important;}',
      '.spx-read-resource-rail button:disabled{cursor:not-allowed!important;opacity:.5!important;}',
      '.spx-read-resource-actions,.spx-read-resource-filters,.spx-read-resource-card-actions{display:flex!important;flex-wrap:wrap!important;gap:6px!important;align-items:center!important;}',
      '.spx-read-resource-actions{margin-bottom:8px!important;}',
      '.spx-read-resource-filters{margin-bottom:10px!important;padding:8px!important;border:1px solid var(--spx-line-soft)!important;border-radius:12px!important;background:var(--spx-panel-muted)!important;}',
      '.spx-read-resource-filters button.spx-active{border-color:var(--spx-accent)!important;background:var(--spx-accent-wash)!important;color:var(--spx-accent)!important;}',
      '.spx-read-resource-list{display:flex!important;flex-direction:column!important;gap:8px!important;min-height:0!important;overflow:auto!important;padding-right:2px!important;scrollbar-width:thin!important;}',
      '.spx-read-resource-card{'+CSS_BOX+'display:grid!important;gap:7px!important;padding:10px!important;border:1px solid var(--spx-line-soft)!important;border-radius:12px!important;background:var(--spx-panel-muted)!important;color:var(--spx-text)!important;}',
      '.spx-read-resource-card.spx-active{border-color:var(--spx-accent)!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important;}',
      '.spx-read-resource-card-top{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;}',
      '.spx-read-resource-type{display:inline-flex!important;align-items:center!important;min-height:20px!important;padding:0 7px!important;border-radius:999px!important;background:#e0f2fe!important;color:#075985!important;font-size:11px!important;font-weight:900!important;}',
      '.spx-read-resource-url{display:block!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:var(--spx-link)!important;font-size:12px!important;font-weight:850!important;text-decoration:none!important;}',
      '.spx-read-resource-url:hover{text-decoration:underline!important;}',
      '.spx-read-resource-meta{color:var(--spx-sub)!important;font-size:12px!important;font-weight:750!important;line-height:1.38!important;word-break:break-word!important;}',
      '.spx-read-resource-card-actions button{min-height:26px!important;padding:0 8px!important;font-size:11px!important;}',
      '.spx-read-resource-card-actions .spx-action-secondary{color:var(--spx-sub)!important;background:var(--spx-panel)!important;}',
      '.spx-read-resource-launcher{position:fixed!important;right:16px!important;bottom:132px!important;z-index:100016!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:82px!important;height:38px!important;padding:0 12px!important;border-color:rgba(37,99,235,.34)!important;border-radius:14px!important;background:var(--spx-accent)!important;color:#fff!important;box-shadow:0 16px 42px rgba(37,99,235,.28)!important;}',
      '.spx-read-resource-launcher[hidden]{'+CSS_HIDE+'}',
      'table.js-post.spx-read-resource-floor-active{outline:3px solid rgba(37,99,235,.22)!important;outline-offset:3px!important;}',
      '.spx-watch-center[hidden]{'+CSS_HIDE+'}',
      '.spx-watch-center-header{position:sticky;top:-14px;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin:-14px -14px 12px;padding:13px 14px 11px;border-bottom:1px solid var(--spx-line-soft);background:rgba(255,255,255,.96);backdrop-filter:blur(10px);}',
      '.spx-watch-center h3{margin:0;color:var(--spx-strong);font-size:16px;line-height:1.3;}',
      '.spx-watch-center .spx-watch-summary{color:var(--spx-sub);font-size:12px;}',
      '.spx-watch-controls{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:0 0 12px;padding:9px;border:1px solid var(--spx-line-soft);border-radius:var(--spx-radius-lg);background:var(--spx-panel-muted);}',
      '.spx-watch-controls input,.spx-watch-controls select{box-sizing:border-box;height:var(--spx-control-height);border:1px solid var(--spx-line);border-radius:var(--spx-radius-sm);background:#fff;color:var(--spx-text);padding:0 10px;font-size:12px;}',
      '.spx-watch-controls input{flex:1 1 220px;min-width:184px;}',
      '.spx-watch-controls select{flex:1 0 132px;min-width:116px;max-width:190px;}',
      '.spx-watch-list{display:flex;flex-direction:column;gap:9px;}',
      '.spx-watch-item{box-sizing:border-box;padding:11px 12px;border:1px solid var(--spx-line-soft);border-radius:var(--spx-radius-lg);background:var(--spx-panel-muted);}',
      '.spx-watch-title{display:block;margin-bottom:5px;color:var(--spx-link)!important;font-size:14px;font-weight:800;line-height:1.38;text-decoration:none;word-break:break-word;}',
      '.spx-resource-title-row{display:flex;align-items:flex-start;gap:8px;margin-bottom:4px;}',
      '.spx-resource-title-row .spx-watch-title{min-width:0;margin-bottom:0;word-break:break-all;}',
      '.spx-resource-select{flex:none;width:16px;height:16px;margin:2px 0 0;accent-color:var(--spx-accent);}',
      '.spx-resource-url{display:block;overflow:hidden;text-overflow:ellipsis;white-space:normal;word-break:break-all;color:var(--spx-link)!important;font-size:12px;line-height:1.35;text-decoration:none;}',
      '.spx-auto-resource-jump{box-sizing:border-box;width:min(var(--spx-page-max),calc(100vw - var(--spx-page-space)));margin:10px auto;padding:10px 12px;border:1px solid #99f6e4;border-radius:var(--spx-radius);background:#f0fdfa;color:#0f766e;font:13px/1.45 Arial,Helvetica,sans-serif;}',
      '.spx-auto-resource-jump strong{display:block;margin-bottom:6px;color:#0f766e;font-size:14px;}',
      '.spx-auto-resource-actions{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}',
      '.spx-auto-resource-actions a,.spx-auto-resource-actions button{box-sizing:border-box;max-width:220px;height:28px;padding:0 9px;border:1px solid #5eead4;border-radius:999px;background:#fff;color:#0f766e!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:none;font-size:12px;line-height:26px;cursor:pointer;}',
      '.spx-auto-resource-actions button:hover,.spx-auto-resource-actions a:hover{border-color:#0f766e;background:#ccfbf1;text-decoration:none!important;}',
      '.spx-watch-meta{margin-bottom:8px;color:var(--spx-sub);font-size:12px;}',
      '.spx-watch-actions{display:flex;flex-wrap:wrap;gap:6px;}',
      '.spx-watch-actions button,.spx-watch-actions a,.spx-watch-center-header button{border:1px solid var(--spx-line);border-radius:var(--spx-radius-sm);background:#fff;color:var(--spx-text);padding:4px 8px;cursor:pointer;text-decoration:none;font-size:12px;line-height:1.25;}',
      '.spx-watch-actions .spx-action-primary{border-color:#99f6e4;background:var(--spx-accent-wash);color:var(--spx-accent)!important;font-weight:700;}',
      '.spx-watch-actions .spx-action-secondary{color:var(--spx-sub)!important;}',
      '.spx-watch-actions .spx-danger{border-color:#fecaca!important;background:var(--spx-danger-soft)!important;color:var(--spx-danger)!important;}',
      '.spx-watch-actions button[data-action*="clear"],.spx-watch-actions button[data-action*="remove"],.spx-watch-actions button[data-action*="delete"],.spx-watch-actions button[data-action*="invalid"]{border-color:#fecaca;background:var(--spx-danger-soft);color:var(--spx-danger);}',
      '.spx-watch-actions button:hover,.spx-watch-actions a:hover,.spx-watch-center-header button:hover{border-color:var(--spx-accent);color:var(--spx-accent);}',
      '.spx-watch-empty{padding:14px 2px;color:var(--spx-sub);font-size:13px;}',
      '@media(max-width:900px){.spx-read-summary-card{width:100%;max-width:100%;margin:8px 0 10px;padding:12px;border-radius:14px;}.spx-read-summary-head{grid-template-columns:1fr;}.spx-read-summary-chips{justify-content:flex-start;}.spx-read-summary-progress{grid-template-columns:1fr;gap:6px;}.spx-read-summary-metrics,.spx-content-stats{grid-template-columns:repeat(2,minmax(0,1fr));}.spx-content-recent-grid{grid-template-columns:1fr;}#spx-content-center{width:auto;}.spx-batch-impact-grid{grid-template-columns:1fr;}}',
      '.spx-status-badge{display:inline-block;margin-right:6px;padding:1px 6px;border-radius:999px;background:#e0f2fe;color:#075985;font-weight:800;}',
      '.spx-status-badge.spx-status-saved{background:#e0f2fe;color:#075985;}',
      '.spx-status-badge.spx-status-todo{background:#fef3c7;color:#92400e;}',
      '.spx-status-badge.spx-status-failed{background:#fee2e2;color:#b91c1c;}',
      '.spx-status-badge.spx-status-done{background:#dcfce7;color:#15803d;}',
      '.spx-status-badge.spx-status-invalid{background:#fee2e2;color:#b91c1c;}',
      '.spx-quick-reply{position:fixed!important;right:82px!important;bottom:78px!important;z-index:100020!important;'+CSS_BOX+'width:min(560px,calc(100vw - 108px))!important;max-height:min(78vh,720px)!important;overflow:auto!important;border:1px solid var(--spx-line)!important;border-radius:14px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;box-shadow:var(--spx-shadow-popover)!important;font:13px/1.45 '+SPX_FONT+'!important;}',
      '.spx-quick-reply.spx-quick-reply-collapsed{'+CSS_HIDE+'}',
      '.spx-quick-reply-launcher{position:fixed!important;right:16px!important;bottom:78px!important;z-index:100021!important;'+CSS_HIDE+'align-items:center!important;justify-content:center!important;min-width:118px!important;height:42px!important;padding:0 14px!important;border:1px solid rgba(37,99,235,.34)!important;border-radius:14px!important;background:var(--spx-accent)!important;color:#fff!important;font-size:13px!important;font-weight:900!important;box-shadow:0 18px 46px rgba(37,99,235,.3)!important;cursor:pointer!important;}',
      '.spx-quick-reply-launcher.spx-visible{display:inline-flex!important;}',
      '.spx-quick-reply-header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;margin:0!important;padding:12px 14px!important;border-bottom:1px solid var(--spx-line-soft)!important;background:var(--spx-panel)!important;color:var(--spx-sub)!important;}',
      '.spx-quick-reply-header strong{display:block!important;color:var(--spx-text)!important;font-size:14px!important;font-weight:900!important;line-height:1.25!important;}',
      '.spx-quick-reply-status{display:block!important;margin-top:3px!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:800!important;}',
      '.spx-quick-reply-status.spx-error{color:#b91c1c!important;font-weight:800!important;}',
      '.spx-quick-reply-actions{display:flex!important;gap:6px!important;flex:none!important;}',
      '.spx-quick-reply button{'+CSS_BOX+'border:1px solid var(--spx-line)!important;background:#fff!important;color:var(--spx-text)!important;cursor:pointer!important;}',
      '.spx-quick-reply button:hover{border-color:var(--spx-accent)!important;color:var(--spx-accent)!important;background:var(--spx-accent-wash)!important;}',
      '.spx-quick-reply button:disabled{cursor:wait!important;opacity:.55!important;}',
      '.spx-quick-reply-icon{min-width:58px!important;height:30px!important;padding:0 10px!important;border-radius:8px!important;font-size:12px!important;font-weight:900!important;}',
      '.spx-quick-reply-context{'+CSS_HIDE+'align-items:center!important;justify-content:space-between!important;gap:10px!important;min-height:36px!important;padding:8px 12px!important;border-bottom:1px solid #fde4bd!important;background:#fffbeb!important;color:#7c2d12!important;font-size:12px!important;font-weight:900!important;}',
      '.spx-quick-reply-context.spx-visible{display:flex!important;}',
      '.spx-quick-reply-context button{flex:none!important;width:24px!important;height:24px!important;padding:0!important;border:0!important;border-radius:7px!important;background:rgba(255,255,255,.8)!important;color:#7c2d12!important;font-size:14px!important;font-weight:900!important;}',
      '.spx-quick-reply-body{padding:12px!important;background:var(--spx-panel)!important;}',
      '.spx-quick-reply-list{display:flex!important;gap:7px!important;margin:0 0 9px!important;overflow-x:auto!important;scrollbar-width:thin!important;}',
      '.spx-quick-reply-chip{flex:none!important;min-height:28px!important;padding:0 9px!important;border-radius:999px!important;background:var(--spx-panel-muted)!important;font-size:13px!important;font-weight:800!important;line-height:1.2!important;}',
      '.spx-quick-reply-chip.spx-hot{border-color:#16a34a!important;background:#ecfdf5!important;color:#047857!important;}',
      '.spx-quick-reply-emotes{margin:-1px 0 10px!important;padding:8px!important;border:1px solid var(--spx-line-soft)!important;border-radius:9px!important;background:var(--spx-panel-muted)!important;}',
      '.spx-quick-reply-emote-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin-bottom:7px!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:900!important;}',
      '.spx-quick-reply-emote-grid{display:grid!important;grid-template-columns:repeat(auto-fill,34px)!important;gap:5px!important;align-items:center!important;}',
      '.spx-quick-reply-emote{width:34px!important;height:34px!important;padding:0!important;border-radius:7px!important;background:#fff!important;line-height:1!important;}',
      '.spx-quick-reply-emote img{display:block!important;max-width:28px!important;max-height:28px!important;margin:auto!important;object-fit:contain!important;}',
      '.spx-quick-reply-tools{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin-bottom:8px!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:850!important;}',
      '.spx-quick-reply-note{'+CSS_ELLIPSIS+'}',
      '.spx-quick-reply-counter{flex:none!important;font-weight:900!important;font-variant-numeric:tabular-nums!important;}',
      '.spx-quick-reply-editor{'+CSS_BOX+'display:block!important;width:100%!important;min-height:128px!important;max-height:260px!important;resize:vertical!important;padding:11px 12px!important;border:1px solid var(--spx-line)!important;border-radius:9px!important;background:var(--spx-panel-muted)!important;color:var(--spx-text)!important;font-size:14px!important;line-height:1.6!important;outline:none!important;}',
      '.spx-quick-reply-editor:focus{border-color:var(--spx-accent)!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important;}',
      '.spx-quick-reply-attach{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important;margin-top:9px!important;padding:8px!important;border:1px solid var(--spx-line-soft)!important;border-radius:9px!important;background:var(--spx-panel-muted)!important;}',
      '.spx-quick-reply-desc{'+CSS_BOX+'min-width:0!important;height:32px!important;padding:0 10px!important;border:1px solid var(--spx-line)!important;border-radius:8px!important;background:#fff!important;color:var(--spx-text)!important;font-size:13px!important;outline:none!important;}',
      '.spx-quick-reply-picker{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:32px!important;padding:0 11px!important;border:1px solid var(--spx-accent)!important;border-radius:8px!important;background:var(--spx-accent-wash)!important;color:var(--spx-accent)!important;font-size:13px!important;font-weight:900!important;cursor:pointer!important;white-space:nowrap!important;}',
      '.spx-quick-reply-help{grid-column:1/-1!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:800!important;}',
      '.spx-quick-reply-attachments{'+CSS_HIDE+'grid-column:1/-1!important;grid-template-columns:repeat(auto-fit,minmax(140px,1fr))!important;gap:7px!important;margin-top:1px!important;}',
      '.spx-quick-reply-attachments.spx-visible{display:grid!important;}',
      '.spx-quick-reply-attachment{display:grid!important;grid-template-columns:38px minmax(0,1fr) auto!important;gap:8px!important;align-items:center!important;min-width:0!important;padding:6px!important;border:1px solid var(--spx-line)!important;border-radius:8px!important;background:#fff!important;}',
      '.spx-quick-reply-thumb{width:38px!important;height:38px!important;border-radius:7px!important;background:#e5e7eb!important;object-fit:cover!important;}',
      '.spx-quick-reply-attachment-name{overflow:hidden!important;color:var(--spx-text)!important;font-size:12px!important;font-weight:900!important;text-overflow:ellipsis!important;white-space:nowrap!important;}',
      '.spx-quick-reply-attachment-size{margin-top:2px!important;color:var(--spx-sub)!important;font-size:11px!important;font-weight:800!important;}',
      '.spx-quick-reply-remove{width:26px!important;height:26px!important;padding:0!important;border-radius:7px!important;color:#b91c1c!important;font-weight:900!important;}',
      '.spx-quick-reply-footer{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;margin-top:10px!important;}',
      '.spx-quick-reply-hint{min-width:0!important;overflow:hidden!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:800!important;text-overflow:ellipsis!important;white-space:nowrap!important;}',
      '.spx-quick-reply-submit-actions{display:flex!important;gap:7px!important;flex:none!important;}',
      '.spx-quick-reply-action{min-height:32px!important;padding:0 12px!important;border-radius:8px!important;font-weight:900!important;}',
      '.spx-quick-reply-action.spx-primary{border-color:var(--spx-accent)!important;background:var(--spx-accent)!important;color:#fff!important;}',
      '.spx-quick-reply-selection{position:fixed!important;left:52%!important;top:50%!important;z-index:100022!important;'+CSS_HIDE+'gap:6px!important;padding:6px!important;border:1px solid var(--spx-line)!important;border-radius:9px!important;background:var(--spx-panel)!important;box-shadow:var(--spx-shadow-popover)!important;}',
      '.spx-quick-reply-selection.spx-visible{display:flex!important;}',
      '.spx-quick-reply-selection button{min-height:28px!important;padding:0 10px!important;border-radius:8px!important;font-size:12px!important;font-weight:900!important;}',
      '@media(max-width:900px){.spx-quick-reply{right:8px!important;bottom:calc(78px + env(safe-area-inset-bottom,0px))!important;width:calc(100vw - 16px)!important;border-radius:12px!important}.spx-quick-reply-launcher{right:8px!important;bottom:calc(78px + env(safe-area-inset-bottom,0px))!important}.spx-quick-reply-footer{align-items:stretch!important;flex-direction:column!important}.spx-quick-reply-attach{grid-template-columns:minmax(0,1fr)!important}.spx-quick-reply-picker{width:100%!important}.spx-quick-reply-submit-actions{justify-content:flex-end!important}}',
      '.spx-author-hover-source{cursor:help!important;}',
      '.spx-author-popover{position:fixed!important;z-index:100003!important;'+CSS_BOX+'width:min(320px,calc(100vw - 32px))!important;max-height:min(460px,calc(100vh - 32px))!important;overflow:auto!important;padding:12px!important;background:#fff!important;border:1px solid #cbd5e1!important;border-radius:10px!important;box-shadow:0 18px 46px rgba(15,23,42,.24)!important;color:#172033!important;font:13px/1.5 '+SPX_FONT+'!important;}',
      '.spx-author-popover-header{display:grid!important;grid-template-columns:48px minmax(0,1fr)!important;gap:10px!important;align-items:center!important;margin:0 0 10px!important;padding-bottom:10px!important;border-bottom:1px solid #e2e8f0!important;}',
      '.spx-author-popover-avatar{width:48px!important;height:48px!important;object-fit:cover!important;border-radius:8px!important;background:#f1f5f9!important;}',
      '.spx-author-popover-name{font-size:16px!important;font-weight:800!important;color:#075985!important;line-height:1.25!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}',
      '.spx-author-popover-link{display:inline-block!important;margin-top:3px!important;color:#64748b!important;font-size:12px!important;text-decoration:none!important;}',
      '.spx-author-popover-lines{display:flex!important;flex-direction:column!important;gap:5px!important;color:#475569!important;}',
      '.spx-author-popover-line{display:block!important;word-break:break-word!important;}',
      '.spx-fold-box{border:1px dashed var(--spx-line);background:var(--spx-bg);padding:8px;margin:8px 0;border-radius:6px;color:var(--spx-sub);}',
      '.spx-fold-box button{margin-left:8px;border:1px solid var(--spx-line);background:#fff;border-radius:5px;padding:2px 8px;cursor:pointer;}',
      '.spx-read-thread{opacity:.48;}',
      '.spx-hidden-rule{'+CSS_HIDE+'}',
      '.spx-unread-hidden{'+CSS_HIDE+'}',
      '.spx-thread-tools{display:inline-flex;gap:4px;margin-left:8px;vertical-align:middle;}',
      '.spx-thread-tools button{border:1px solid var(--spx-line);background:#fff;border-radius:4px;color:var(--spx-sub);font-size:12px;line-height:16px;padding:0 5px;cursor:pointer;}',
      '.spx-thread-tools button:hover{color:var(--spx-accent);border-color:var(--spx-accent);}',
      '.spx-watch-badge{display:inline-block;margin-left:5px;color:var(--spx-warn);font-weight:bold;}',
      '.spx-forum-tools{box-sizing:border-box;display:flex;align-items:center;gap:8px;width:min(var(--spx-page-max),calc(100vw - var(--spx-page-space)));margin:0 auto 10px;padding:10px 12px;background:#fff;border:1px solid #d7e1eb;border-radius:var(--spx-radius);box-shadow:0 4px 14px rgba(15,23,42,.05);}',
      '.spx-forum-tools input{box-sizing:border-box;flex:1;min-width:180px;height:30px;border:1px solid var(--spx-line);border-radius:6px;padding:0 9px;font-size:13px;}',
      '.spx-forum-tools button{height:30px;border:1px solid var(--spx-line);border-radius:6px;background:#fff;color:var(--spx-text);padding:0 9px;cursor:pointer;font-size:12px;}',
      '.spx-forum-tools button:hover{border-color:var(--spx-accent);color:var(--spx-accent);}',
      '.spx-forum-resource-filters{display:flex;align-items:center;gap:5px;max-width:46%;overflow-x:auto;scrollbar-width:thin;}',
      '.spx-forum-tools .spx-resource-filter-active{border-color:#93c5fd;background:#dbeafe;color:#1d4ed8;font-weight:900;}',
      '.spx-resource-badges{display:inline-flex;align-items:center;flex-wrap:wrap;gap:4px;margin-left:6px;vertical-align:middle;}',
      '.spx-resource-badge{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-height:21px;padding:0 7px;border:1px solid #bfdbfe;border-radius:6px;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:900;line-height:1;white-space:nowrap;cursor:pointer;}',
      '.spx-resource-badge:hover{filter:brightness(.97);transform:translateY(-1px);}',
      '.spx-resource-badge-guess{border-style:dashed;background:#fff;color:#475467;}',
      '.spx-resource-badge-baidu{border-color:#bfdbfe;background:#eff6ff;color:#1d4ed8;}.spx-resource-badge-quark{border-color:#99f6e4;background:#f0fdfa;color:#0f766e;}.spx-resource-badge-pikpak{border-color:#ddd6fe;background:#faf5ff;color:#6d28d9;}.spx-resource-badge-magnet{border-color:#fed7aa;background:#fff7ed;color:#c2410c;}.spx-resource-badge-torrent{border-color:#bae6fd;background:#f0f9ff;color:#0369a1;}.spx-resource-badge-archive{border-color:#fbcfe8;background:#fdf2f8;color:#be185d;}.spx-resource-badge-ed2k{border-color:#cbd5e1;background:#f1f5f9;color:#334155;}.spx-resource-badge-external{border-color:#fde68a;background:#fffbeb;color:#92400e;}.spx-resource-badge-cloud{border-color:#cbd5e1;background:#f8fafc;color:#475569;}',
      '.spx-module-nav-ready.spx-home-dashboard #content,.spx-module-nav-ready.spx-forum-dashboard #content{display:grid!important;grid-template-columns:minmax(196px,var(--spx-module-width)) minmax(0,1fr)!important;gap:14px!important;align-items:start!important;}',
      '.spx-module-body{grid-column:2!important;min-width:0!important;display:block!important;}',
      '.spx-module-nav-ready.spx-home-dashboard #content>*:not(.spx-module-nav):not(.spx-module-body),.spx-module-nav-ready.spx-forum-dashboard #content>*:not(.spx-module-nav):not(.spx-module-body){grid-column:2!important;min-width:0!important;}',
      '.spx-module-nav-ready .spx-forum-tools{width:100%!important;margin:0 0 10px!important;}',
      '.spx-module-nav{grid-column:1!important;position:sticky!important;top:46px!important;z-index:20!important;'+CSS_BOX+'display:flex!important;flex-direction:column!important;align-self:start!important;gap:8px!important;max-height:calc(100vh - var(--spx-module-max-offset))!important;padding:12px!important;overflow:auto!important;border:1px solid var(--spx-line)!important;border-radius:var(--spx-radius-lg)!important;background:var(--spx-panel)!important;box-shadow:var(--spx-shadow-card)!important;color:var(--spx-text)!important;scrollbar-width:thin!important;}',
      '.spx-module-nav-title{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;padding:0 2px 8px!important;border-bottom:1px solid var(--spx-line-soft)!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:900!important;line-height:1.25!important;white-space:nowrap!important;}',
      '.spx-module-nav-title strong{color:var(--spx-strong)!important;font-size:12px!important;font-weight:900!important;line-height:1.2!important;}.spx-module-nav-title span{flex:none!important;color:var(--spx-muted)!important;font-size:11px!important;font-weight:900!important;}',
      '.spx-module-nav-controls{display:flex!important;align-items:center!important;width:100%!important;min-width:0!important;}',
      'input.spx-module-nav-search{'+CSS_BOX+'flex:1 1 auto!important;width:100%!important;min-width:0!important;max-width:100%!important;height:30px!important;padding:0 10px!important;border:1px solid var(--spx-line)!important;border-radius:9px!important;background:var(--spx-input-bg)!important;color:var(--spx-text)!important;font-size:12px!important;font-weight:800!important;line-height:30px!important;outline:none!important;}',
      'input.spx-module-nav-search:focus{border-color:var(--spx-accent)!important;box-shadow:0 0 0 2px rgba(37,99,235,.12)!important;}',
      '.spx-module-nav-group{display:flex!important;flex-direction:column!important;gap:5px!important;}',
      '.spx-module-nav-section{appearance:none!important;'+CSS_BOX+'display:flex!important;align-items:center!important;gap:7px!important;width:100%!important;min-height:var(--spx-module-section-height)!important;margin:5px 0 1px!important;padding:0 var(--spx-module-section-padding)!important;border:0!important;border-radius:calc(var(--spx-module-item-radius) - 2px)!important;background:var(--spx-accent-wash)!important;color:var(--spx-accent)!important;font-size:11px!important;font-weight:900!important;line-height:1.2!important;text-align:left!important;white-space:nowrap!important;cursor:pointer!important;}',
      '.spx-module-nav-section:before{content:"▸";font-size:10px!important;color:var(--spx-accent)!important;}',
      '.spx-module-nav-section[aria-expanded="true"]:before{content:"▾";}',
      '.spx-module-nav-section[aria-expanded="false"]:before{content:"▸";}',
      '.spx-module-nav-section:after{content:"";height:1px!important;flex:1!important;background:rgba(37,99,235,.18)!important;}',
      '.spx-module-nav-group.spx-module-nav-collapsed>.spx-module-nav-node{'+CSS_HIDE+'}',
      '.spx-module-nav[data-spx-module-nav-searching="1"] .spx-module-nav-group.spx-module-nav-collapsed>.spx-module-nav-node{display:flex!important;}',
      '.spx-module-nav-node{display:flex!important;flex-direction:column!important;gap:4px!important;}',
      '.spx-module-nav-children{display:flex!important;flex-direction:column!important;gap:4px!important;margin:2px 0 3px 11px!important;padding-left:9px!important;border-left:2px solid var(--spx-line-soft)!important;}',
      '.spx-module-nav-parent-title{'+CSS_BOX+'display:flex!important;align-items:center!important;min-height:var(--spx-module-parent-height)!important;padding:0 var(--spx-module-section-padding)!important;border-radius:var(--spx-module-item-radius)!important;background:var(--spx-panel-muted)!important;color:var(--spx-strong)!important;font-size:12px!important;font-weight:900!important;line-height:1.25!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;}',
      '.spx-module-nav-item{'+CSS_BOX+'display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;min-height:var(--spx-module-item-height)!important;width:100%!important;padding:0 var(--spx-module-item-padding)!important;border:1px solid transparent!important;border-radius:var(--spx-module-item-radius)!important;background:var(--spx-panel-muted)!important;color:var(--spx-text)!important;text-decoration:none!important;font-size:12px!important;font-weight:900!important;line-height:1.2!important;white-space:nowrap!important;cursor:pointer!important;}',
      '.spx-module-nav-item.spx-module-nav-level-3{min-height:var(--spx-module-child-height)!important;padding:0 var(--spx-module-section-padding)!important;border-radius:calc(var(--spx-module-item-radius) - 2px)!important;background:transparent!important;color:var(--spx-link)!important;font-size:11px!important;font-weight:800!important;}',
      '.spx-module-nav-label{'+CSS_ELLIPSIS+'}',
      '.spx-module-nav-pin{flex:none;display:inline-flex!important;align-items:center!important;justify-content:center!important;width:20px!important;height:20px!important;border-radius:999px!important;color:var(--spx-muted)!important;font-size:13px!important;line-height:1!important;opacity:.72!important;cursor:pointer!important;}',
      '.spx-module-nav-pin:hover,.spx-module-nav-pin:focus-visible{background:var(--spx-accent-wash)!important;color:var(--spx-accent)!important;opacity:1!important;outline:none!important;}',
      '.spx-module-nav-item.spx-module-nav-pinned .spx-module-nav-pin{color:var(--spx-accent)!important;opacity:1!important;}',
      '.spx-module-nav-search-hidden{'+CSS_HIDE+'}',
      '.spx-module-nav-item:hover,.spx-module-nav-item:focus-visible{border-color:var(--spx-accent)!important;color:var(--spx-accent)!important;text-decoration:none!important;outline:none!important;}',
      '.spx-module-nav-item.spx-active{border-color:var(--spx-accent)!important;background:var(--spx-accent)!important;color:#fff!important;box-shadow:0 7px 16px rgba(37,99,235,.2)!important;}',
      '.spx-module-nav-count{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:22px!important;height:20px!important;padding:0 6px!important;border-radius:999px!important;background:var(--spx-panel)!important;color:var(--spx-sub)!important;font-size:11px!important;font-weight:900!important;font-variant-numeric:tabular-nums!important;}',
      '.spx-module-nav-item.spx-active .spx-module-nav-count{background:rgba(255,255,255,.22)!important;color:#fff!important;}',
      '.spx-filter-hidden{'+CSS_HIDE+'}',
      '.spx-resource-filter-hidden{'+CSS_HIDE+'}',
      '.spx-module-filter-hidden{'+CSS_HIDE+'}',
      '.spx-forum-prelude-hidden{'+CSS_HIDE+'}',
      '.spx-thread-row-hidden{'+CSS_HIDE+'}',
      '.spx-forum-section-title{'+CSS_BOX+'display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;min-height:38px!important;margin:0 0 10px!important;color:var(--spx-strong)!important;}',
      '.spx-forum-section-main{display:flex!important;align-items:center!important;gap:10px!important;min-width:0!important;}',
      '.spx-forum-section-title strong{display:block!important;'+CSS_ELLIPSIS+'font-size:16px!important;font-weight:900!important;}',
      '.spx-forum-section-title span{flex:none!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:800!important;}',
      '.spx-forum-section-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;flex:none!important;flex-wrap:wrap!important;margin-left:auto!important;}',
      '.spx-forum-post-link img{display:block!important;max-width:100%!important;height:auto!important;}',
      '.spx-forum-gallery-link{flex:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:30px!important;padding:0 11px!important;border:1px solid #fecaca!important;border-radius:8px!important;background:#fef2f2!important;color:#b91c1c!important;font-size:12px!important;font-weight:900!important;text-decoration:none!important;}',
      '.spx-forum-gallery-link:hover,.spx-forum-gallery-link:focus-visible{border-color:#f87171!important;background:#fee2e2!important;color:#991b1b!important;text-decoration:none!important;outline:none!important;}',
      '.spx-forum-gallery-link.spx-forum-list-link{border-color:#bfdbfe!important;background:#eff6ff!important;color:#1d4ed8!important;}',
      '.spx-forum-gallery-link.spx-forum-list-link:hover,.spx-forum-gallery-link.spx-forum-list-link:focus-visible{border-color:#60a5fa!important;background:#dbeafe!important;color:#1e40af!important;}',
      '.spx-forum-gallery-page #wall{'+CSS_BOX+'width:100%!important;max-width:100%!important;margin:0!important;padding:0!important;overflow:visible!important;background:transparent!important;}',
      '.spx-forum-gallery-page #wall .stream{position:static!important;display:grid!important;grid-template-columns:repeat(auto-fill,minmax(224px,1fr))!important;gap:14px!important;width:100%!important;height:auto!important;margin:0!important;padding:0!important;list-style:none!important;}',
      '.spx-forum-gallery-page #wall .stream>li{position:static!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;'+CSS_BOX+'display:block!important;width:auto!important;height:auto!important;margin:0!important;padding:0!important;list-style:none!important;}',
      '.spx-forum-gallery-page #wall .stream>li.spx-filter-hidden,.spx-forum-gallery-page #wall .stream>li.spx-resource-filter-hidden,.spx-forum-gallery-page #wall .stream>li.spx-hidden-rule,.spx-forum-gallery-page #wall .stream>li.spx-unread-hidden,.spx-forum-gallery-page #wall .stream>li.spx-thread-row-hidden{'+CSS_HIDE+'}',
      '.spx-forum-gallery-page #wall .inner,.spx-forum-gallery-page #wall .spx-gallery-card-inner{'+CSS_BOX+'display:flex!important;flex-direction:column!important;gap:0!important;min-height:100%!important;margin:0!important;padding:0!important;border:1px solid var(--spx-line)!important;border-radius:12px!important;background:var(--spx-panel)!important;box-shadow:0 8px 20px rgba(15,23,42,.07)!important;overflow:hidden!important;color:var(--spx-text)!important;}',
      '.spx-forum-gallery-page #wall .inner:hover{border-color:#bfdbfe!important;box-shadow:0 14px 30px rgba(15,23,42,.11)!important;}',
      '.spx-forum-gallery-page #wall .section-title{'+CSS_BOX+'display:block!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:0!important;margin:0!important;padding:12px 12px 7px!important;border:0!important;background:transparent!important;font-size:14px!important;line-height:1.45!important;overflow:visible!important;}',
      '.spx-forum-gallery-page #wall .section-title a{display:block!important;color:var(--spx-strong)!important;font-size:14px!important;font-weight:900!important;line-height:1.45!important;text-decoration:none!important;word-break:break-word!important;}',
      '.spx-forum-gallery-page #wall .section-title a:hover{color:var(--spx-accent)!important;text-decoration:none!important;}',
      '.spx-forum-gallery-page #wall .section-text{'+CSS_BOX+'display:block!important;width:100%!important;max-width:100%!important;margin:0!important;padding:0 12px 12px!important;clear:both!important;color:var(--spx-sub)!important;font-size:12px!important;line-height:1.55!important;overflow:visible!important;}',
      '.spx-forum-gallery-page #wall .section-text>span{float:none!important;display:block!important;width:100%!important;max-width:100%!important;margin:0 0 8px!important;padding:0!important;clear:both!important;color:var(--spx-sub)!important;font-size:12px!important;line-height:1.45!important;}',
      '.spx-forum-gallery-page #wall .section-text>span:first-child{'+CSS_HIDE+'}',
      '.spx-forum-gallery-page #wall .section-text>div{display:block!important;width:100%!important;max-width:100%!important;margin:0!important;clear:both!important;}',
      '.spx-forum-gallery-page #wall .section-text img{display:block!important;width:100%!important;max-width:100%!important;height:176px!important;object-fit:cover!important;border:1px solid var(--spx-line-soft)!important;border-radius:10px!important;background:var(--spx-panel-muted)!important;}',
      '.spx-forum-gallery-page #wall .section-text a#favor{'+CSS_HIDE+'}',
      '.spx-forum-gallery-page #wall .section-intro{'+CSS_BOX+'position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;z-index:auto!important;display:block!important;width:100%!important;max-width:100%!important;flex:none!important;margin:auto 0 0!important;padding:9px 12px!important;border-top:1px solid var(--spx-line-soft)!important;background:var(--spx-panel-muted)!important;color:var(--spx-sub)!important;font-size:12px!important;line-height:1.45!important;overflow:hidden!important;}',
      '.spx-forum-gallery-page #wall .section-intro table,.spx-forum-gallery-page #wall .section-intro tbody,.spx-forum-gallery-page #wall .section-intro tr,.spx-forum-gallery-page #wall .section-intro td{display:block!important;width:auto!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;}',
      '.spx-forum-gallery-page #wall .section-intro,.spx-forum-gallery-page #wall .section-intro *:not(a){color:var(--spx-sub)!important;text-shadow:none!important;opacity:1!important;filter:none!important;}',
      '.spx-forum-gallery-page #wall .section-intro a,.spx-forum-gallery-page #wall .section-intro a *{color:var(--spx-link)!important;font-weight:800!important;text-decoration:none!important;text-shadow:none!important;opacity:1!important;filter:none!important;}',
      '.spx-forum-gallery-page #wall .clear{'+CSS_HIDE+'}',
      '.spx-gallery-card-tools{'+CSS_BOX+'display:flex!important;align-items:center!important;gap:6px!important;width:100%!important;max-width:100%!important;flex:none!important;margin:0!important;padding:9px 12px 12px!important;clear:both!important;border-top:1px solid var(--spx-line-soft)!important;background:var(--spx-panel)!important;}',
      '.spx-gallery-card-tools button{'+CSS_BOX+'min-height:28px!important;padding:0 10px!important;border:1px solid var(--spx-line)!important;border-radius:8px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;font-size:12px!important;font-weight:900!important;line-height:26px!important;cursor:pointer!important;}',
      '.spx-gallery-card-tools button:hover,.spx-gallery-card-tools button:focus-visible{border-color:var(--spx-accent)!important;background:var(--spx-accent-wash)!important;color:var(--spx-accent)!important;outline:none!important;}',
      '.spx-gallery-card-tools button:disabled{cursor:default!important;opacity:.62!important;}',
      '@media(max-width:900px){.spx-forum-gallery-page #wall .stream{grid-template-columns:repeat(auto-fill,minmax(156px,1fr))!important;gap:10px!important}.spx-forum-gallery-page #wall .section-title{padding:10px 10px 6px!important}.spx-forum-gallery-page #wall .section-text{padding:0 10px 10px!important}.spx-forum-gallery-page #wall .section-text img{height:138px!important}.spx-forum-gallery-page #wall .section-intro{padding:8px 10px!important}.spx-gallery-card-tools{gap:5px!important;padding:8px 10px 10px!important}.spx-gallery-card-tools button{flex:1 1 0!important;min-width:0!important;padding:0 6px!important}}',
      '.spx-post-tools{display:flex;gap:6px;justify-content:flex-end;margin:4px 0;}',
      '.spx-post-tools button{border:1px solid var(--spx-line);background:#fff;border-radius:5px;padding:2px 8px;cursor:pointer;color:var(--spx-sub);}',
      '.spx-auto-buy-status{box-sizing:border-box;margin:8px 0;padding:8px 10px;border:1px solid #99f6e4;border-radius:6px;background:#f0fdfa;color:#0f766e;font-size:13px;line-height:1.45;}',
      '.spx-auto-buy-status.spx-error{border-color:#fecaca;background:#fef2f2;color:#b91c1c;}',
      '.spx-post-hidden{'+CSS_HIDE+'}',
      '.spx-site-shell .spx-post-shell-hidden,.spx-site-shell:not(.spx-reader) .spx-post-shell-hidden,.spx-reader .spx-post-shell-hidden,.spx-immersive-read .spx-post-shell-hidden{'+CSS_HIDE+'border:0!important;margin:0!important;padding:0!important;height:0!important;min-height:0!important;overflow:hidden!important;}',
      '.spx-preview-popover{position:fixed;z-index:100001;width:min(520px,calc(100vw - 28px));max-height:min(74vh,620px);overflow:auto;padding:12px;background:#fff;border:1px solid #cbd5e1;border-radius:10px;box-shadow:0 18px 48px rgba(15,23,42,.28);color:#172033;font:13px/1.55 '+SPX_FONT+';}',
      '.spx-preview-popover h4{display:block;margin:0 0 6px;font-size:15px;line-height:1.35;color:#0f172a;}',
      '.spx-preview-meta{margin-bottom:8px;color:#64748b;font-size:12px;}',
      '.spx-preview-chip-row{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 9px;}.spx-preview-chip{box-sizing:border-box;display:inline-flex;align-items:center;min-height:24px;padding:0 8px;border:1px solid #dbe4ee;border-radius:999px;background:#f8fafc;color:#475569;font-size:11px;font-weight:900;line-height:1.2;}.spx-preview-chip.spx-ok{border-color:#bbf7d0;background:#f0fdf4;color:#15803d;}.spx-preview-chip.spx-resource{border-color:#bae6fd;background:#f0f9ff;color:#0369a1;}.spx-preview-chip.spx-guess{border-style:dashed;color:#64748b;}.spx-preview-chip-row button{cursor:pointer;}.spx-preview-chip-row button:hover{border-color:#2563eb;color:#2563eb;background:#eff6ff;}',
      '.spx-preview-popover-actions{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px;}',
      '.spx-preview-popover-actions a,.spx-preview-popover-actions button{box-sizing:border-box;min-height:28px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#1f2937;padding:4px 9px;font-size:12px;line-height:18px;text-decoration:none;cursor:pointer;}',
      '.spx-preview-popover-actions a:hover,.spx-preview-popover-actions button:hover{border-color:#2563eb;color:#2563eb;}',
      '.spx-preview-popover-actions button:disabled{cursor:default;opacity:.62;}',
      '.spx-preview-text{max-height:120px;overflow:hidden;margin-bottom:10px;color:#334155;}',
      '.spx-preview-images{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}',
      '.spx-preview-images a{display:block;overflow:hidden;border:1px solid #e2e8f0;border-radius:7px;background:#f8fafc;}',
      '.spx-preview-images img{display:block;width:100%;height:118px;object-fit:cover;}',
      '.spx-preview-images img[data-spx-preview-lazy-src]{background:linear-gradient(135deg,#f1f5f9,#e2e8f0);opacity:.68;}',
      '.spx-preview-images img[data-spx-preview-loaded="1"]{opacity:1;transition:opacity .16s ease;}',
      '.spx-preview-status{color:#94a3b8;font-size:12px;}',
      '.spx-compact-read .user-info,.spx-compact-read .readprofile,.spx-hide-profile .user-pic,.spx-hide-profile .user-info,.spx-hide-profile .readprofile{'+CSS_HIDE+'}',
      '.spx-compact-read:not(.spx-reader) .tpc_content{font-size:15px;line-height:1.7;max-width:var(--spx-reader-line);}',
      '.spx-folded-quote{max-height:110px;overflow:hidden;position:relative;border-bottom:1px dashed var(--spx-line);}',
      '.spx-folded-quote:after{content:"";position:absolute;left:0;right:0;bottom:0;height:30px;background:linear-gradient(transparent,var(--spx-panel));}',
      '@media(max-width:900px){.spx-home-dashboard #content,.spx-forum-dashboard #content{width:calc(100vw - 16px)!important;margin:10px 8px 34px!important}.spx-module-nav-ready.spx-home-dashboard #content,.spx-module-nav-ready.spx-forum-dashboard #content{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:10px!important}.spx-module-nav-ready.spx-home-dashboard #content>*:not(.spx-module-nav),.spx-module-nav-ready.spx-forum-dashboard #content>*:not(.spx-module-nav),.spx-module-nav{grid-column:1!important}.spx-module-nav{position:static!important;display:flex!important;flex-direction:row!important;align-items:center!important;max-height:none!important;overflow-x:auto!important;overflow-y:hidden!important;padding:7px!important}.spx-module-nav-title{flex:none!important;padding:0 8px!important;border-bottom:0!important}.spx-module-nav-controls{flex:none!important;width:180px!important}.spx-module-nav-group,.spx-module-nav-node,.spx-module-nav-children{flex:none!important;display:flex!important;flex-direction:row!important;align-items:center!important;gap:6px!important;margin:0!important;padding:0!important;border-left:0!important}.spx-module-nav-section,.spx-module-nav-parent-title{flex:none!important}.spx-module-nav-parent-title{min-height:30px!important;border-radius:999px!important}.spx-module-nav-item{flex:none!important;width:auto!important;min-height:30px!important;border-radius:999px!important}.spx-home-dashboard #spx-home-grid{grid-template-columns:1fr!important}.spx-home-dashboard .spx-home-module,.spx-home-dashboard .spx-home-module[data-spx-large="1"]{grid-column:1!important}.spx-home-dashboard #header,.spx-home-dashboard #mainNav,.spx-home-dashboard #infobox,.spx-home-dashboard #notice,.spx-home-dashboard .spx-home-quick,.spx-forum-dashboard #header,.spx-forum-dashboard #mainNav,.spx-forum-dashboard #infobox,.spx-forum-dashboard #notice{width:calc(100vw - 16px)!important}.spx-home-dashboard .spx-home-module tr.tr3,.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3{grid-template-columns:1fr!important;gap:4px!important}.spx-home-dashboard .spx-home-module tr.tr3>td:first-child,.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3>td:first-child:not([id^="td_"]){display:none!important}.spx-forum-tools{width:100%!important;flex-wrap:wrap}.spx-forum-tools input{flex-basis:100%!important}}',
      '@media(max-width:760px){.spx-read-resource-rail{left:8px!important;right:8px!important;top:auto!important;bottom:calc(104px + env(safe-area-inset-bottom,0px))!important;width:auto!important;max-height:46vh!important;border-radius:18px!important}.spx-read-resource-rail-head{border-radius:18px 18px 0 0!important}.spx-read-resource-list{max-height:calc(46vh - 156px)!important}.spx-read-resource-launcher{right:8px!important;bottom:calc(104px + env(safe-area-inset-bottom,0px))!important;min-width:88px!important;height:40px!important}.spx-read-resource-actions button,.spx-read-resource-filters button{flex:1 1 auto!important}.spx-read-resource-card-actions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important}.spx-read-resource-card-actions button{min-width:0!important;padding:0 5px!important}}',
      '@media(max-width:760px){.spx-preview-lightbox{padding:0!important}.spx-preview-lightbox-shell{border:0!important;border-radius:0!important}.spx-preview-lightbox-toolbar{align-items:flex-start!important;min-height:0!important;padding:8px!important}.spx-preview-lightbox-actions{gap:4px!important}.spx-preview-lightbox button{height:30px!important;padding:0 8px!important}.spx-preview-lightbox-canvas{padding:22px 50px!important}.spx-preview-lightbox-nav{width:38px!important;height:54px!important;font-size:26px!important}.spx-preview-lightbox-prev{left:6px!important}.spx-preview-lightbox-next{right:6px!important}.spx-preview-lightbox-caption{padding:6px 9px!important}.spx-preview-lightbox-help{display:none!important}.spx-reader body{font-size:16px!important}.spx-reader #wrapA{width:calc(100vw - 14px)!important;margin:0 7px!important}.spx-reader .tpc_content{font-size:16px!important;line-height:1.76!important;padding:12px!important}.spx-reader .tpc_content #read_tpc,.spx-reader .tpc_content>.f14{font-size:16px!important;line-height:1.76!important}.spx-reader .spx-post-body-split,.spx-immersive-read .spx-post-body-split{display:flex!important;flex-direction:column!important;gap:12px!important;padding:14px!important}.spx-reader .spx-post-body-split .tpc_content,.spx-immersive-read .spx-post-body-split .tpc_content{padding:0!important}.spx-reader .spx-preview-panel,.spx-immersive-read .spx-preview-panel{width:auto!important;max-height:360px!important;margin:0!important;padding:10px!important}.spx-reader .spx-preview-grid,.spx-immersive-read .spx-preview-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.spx-reader .spx-preview-item img,.spx-immersive-read .spx-preview-item img{height:132px!important}.spx-preview-panel.spx-preview-drawer{left:8px!important;right:8px!important;top:auto!important;bottom:calc(62px + env(safe-area-inset-bottom,0px))!important;width:auto!important;max-height:58vh!important;border-radius:16px!important}.spx-preview-panel.spx-preview-drawer.spx-preview-collapsed{left:auto!important;right:8px!important;bottom:calc(62px + env(safe-area-inset-bottom,0px))!important;top:auto!important;width:46px!important;height:126px!important}.spx-immersive-read #wrapA,.spx-immersive-read #main,.spx-immersive-read #content{width:100vw!important;margin:0!important}.spx-immersive-read table.js-post{width:calc(100vw - 14px)!important;margin:10px 7px!important}.spx-immersive-read .h1,.spx-immersive-read [id^="subject_"]{font-size:19px!important;padding:16px 14px 6px!important}.spx-immersive-read .tpc_content{font-size:16px!important;line-height:1.76!important;padding:14px!important}.spx-immersive-read .tpc_content #read_tpc,.spx-immersive-read .tpc_content>.f14{font-size:16px!important;line-height:1.76!important}.spx-toolbar{left:8px!important;right:8px!important;bottom:calc(8px + env(safe-area-inset-bottom,0px))!important;width:auto!important;flex-direction:row!important;justify-content:space-between!important;padding:6px!important;border-radius:16px!important}.spx-toolbar button{flex:1 1 0!important;width:auto!important;height:34px!important;font-size:12px}.spx-settings,.spx-watch-center,.spx-toolbox{left:8px!important;right:8px!important;bottom:calc(58px + env(safe-area-inset-bottom,0px))!important;width:auto!important;max-height:calc(100vh - 92px - env(safe-area-inset-bottom,0px))!important;border-radius:18px!important}.spx-settings-grid,.spx-toolbox-grid{grid-template-columns:1fr!important}.spx-toolbox-body{max-height:calc(100vh - 150px - env(safe-area-inset-bottom,0px));padding:11px}.spx-toolbox-action{min-height:54px!important}.spx-watch-controls input,.spx-watch-controls select{flex:1 1 100%!important;max-width:none!important}.spx-resource-panel,#spx-resource-center{width:auto!important}.spx-watch-center-header{top:-14px}.spx-toolbox-desc{-webkit-line-clamp:1}}',
    ];
  }

  function getInjectedThemeOverrideStyleRules() {
    return [
      '.spx-theme-night,.spx-theme-night body{background:var(--spx-page-bg)!important;color:var(--spx-text)!important;}',
      '.spx-theme-night #wrapA,.spx-theme-night #main,.spx-theme-night #content,.spx-theme-night.spx-reader #wrapA,.spx-theme-night.spx-reader #main,.spx-theme-night.spx-reader #content,.spx-theme-night.spx-immersive-read #wrapA,.spx-theme-night.spx-immersive-read #main,.spx-theme-night.spx-immersive-read #content{background:var(--spx-page-bg)!important;background-image:none!important;color:var(--spx-text)!important;}',
      '.spx-theme-night a{color:var(--spx-link)!important;}',
      '.spx-theme-night input,.spx-theme-night textarea,.spx-theme-night select{background:var(--spx-input-bg)!important;color:var(--spx-text)!important;border-color:var(--spx-line)!important;}',
      '.spx-theme-night .t,.spx-theme-night .t3,.spx-theme-night .t5,.spx-theme-night .bdbA,.spx-theme-night table.js-post,.spx-theme-night .spx-home-module,.spx-theme-night .spx-watch-center,.spx-theme-night .spx-workbench,.spx-theme-night .spx-settings,.spx-theme-night .spx-toolbox,.spx-theme-night .spx-command-palette,.spx-theme-night .spx-command-detail,.spx-theme-night .spx-preview-panel,.spx-theme-night .spx-preview-popover,.spx-theme-night .spx-author-popover,.spx-theme-night .spx-quick-reply,.spx-theme-night .spx-forum-tools,.spx-theme-night .spx-read-resource-rail,.spx-theme-night .spx-read-resource-card,.spx-theme-night .spx-read-resource-filters,.spx-theme-night .spx-read-summary-card,.spx-theme-night .spx-batch-confirm,.spx-theme-night .spx-data-health,.spx-theme-night .spx-storage-usage-row,.spx-theme-night .spx-storage-suggestions{background:var(--spx-panel)!important;border-color:var(--spx-line)!important;color:var(--spx-text)!important;box-shadow:var(--spx-shadow-card)!important;}',
      '.spx-theme-night .tr1,.spx-theme-night .tr2,.spx-theme-night .tr3,.spx-theme-night td,.spx-theme-night th,.spx-theme-night .spx-home-module tr.tr3,.spx-theme-night.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3{background:var(--spx-row-bg)!important;border-color:var(--spx-line-soft)!important;color:var(--spx-text)!important;}',
      '.spx-theme-night .spx-home-module tr.tr3:hover,.spx-theme-night.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3:hover{background:var(--spx-row-hover)!important;}',
      '.spx-theme-night .spx-home-module>h2,.spx-theme-night .spx-home-module .h,.spx-theme-night .spx-settings-header,.spx-theme-night .spx-settings-footer,.spx-theme-night .spx-toolbox-header,.spx-theme-night .spx-watch-center-header,.spx-theme-night .spx-workbench-head,.spx-theme-night .spx-workbench-tabs,.spx-theme-night .spx-read-resource-rail-head,.spx-theme-night .spx-preview-lightbox-toolbar,.spx-theme-night .spx-preview-lightbox-caption{background:var(--spx-panel-muted)!important;border-color:var(--spx-line-soft)!important;color:var(--spx-strong)!important;}',
      '.spx-theme-night .spx-read-resource-rail button{background:var(--spx-panel)!important;color:var(--spx-text)!important;border-color:var(--spx-line)!important;}',
      '.spx-theme-night .spx-toolbox-action,.spx-theme-night .spx-watch-item,.spx-theme-night .spx-watch-controls,.spx-theme-night .spx-settings-section,.spx-theme-night .spx-preview-item,.spx-theme-night .spx-preview-images a,.spx-theme-night .spx-read-summary-metric,.spx-theme-night .spx-content-stat,.spx-theme-night .spx-content-recent-section,.spx-theme-night .spx-content-recent,.spx-theme-night .spx-batch-list,.spx-theme-night .spx-batch-item,.spx-theme-night .spx-batch-impact,.spx-theme-night .spx-fold-box,.spx-theme-night .spx-auto-resource-actions a,.spx-theme-night .spx-auto-resource-actions button{background:var(--spx-panel-muted)!important;border-color:var(--spx-line)!important;color:var(--spx-text)!important;}',
      '.spx-theme-night button,.spx-theme-night .spx-toolbar button,.spx-theme-night .spx-thread-tools button,.spx-theme-night .spx-post-tools button,.spx-theme-night .spx-watch-actions button,.spx-theme-night .spx-watch-actions a{background:var(--spx-panel-muted)!important;border-color:var(--spx-line)!important;color:var(--spx-text)!important;}',
      '.spx-theme-night .spx-toolbox-action:hover,.spx-theme-night .spx-toolbox-action:focus-visible,.spx-theme-night button:hover,.spx-theme-night .spx-toolbar button:hover{border-color:var(--spx-accent)!important;background:var(--spx-accent-wash)!important;color:var(--spx-accent)!important;}',
      '.spx-theme-night .spx-toolbox-action.spx-active,.spx-theme-night .spx-toolbar .spx-active,.spx-theme-night .spx-settings .spx-primary{border-color:var(--spx-accent)!important;background:var(--spx-accent-soft)!important;color:var(--spx-accent)!important;}',
      '.spx-theme-night .spx-toolbox-key,.spx-theme-night .spx-status-badge,.spx-theme-night .spx-home-badge,.spx-theme-night .spx-resource-badge,.spx-theme-night .spx-preview-chip,.spx-theme-night .spx-preview-download-badge,.spx-theme-night .spx-command-pill,.spx-theme-night .spx-forum-dashboard-chip,.spx-theme-night .spx-task-claim-reward,.spx-theme-night .spx-forum-tools .spx-resource-filter-active,.spx-theme-night td[id^="td_"] .s8{background:var(--spx-accent-soft)!important;border-color:var(--spx-line)!important;color:var(--spx-accent)!important;}',
      '.spx-theme-night .spx-status-badge.spx-status-todo,.spx-theme-night .spx-preview-download-badge.spx-zip,.spx-theme-night .spx-command-pill.spx-warn,.spx-theme-night .spx-resource-badge-magnet,.spx-theme-night .spx-resource-badge-external,.spx-theme-night .spx-forum-dashboard-chip.spx-amber{background:rgba(251,191,36,.16)!important;border-color:rgba(251,191,36,.42)!important;color:#facc15!important;}',
      '.spx-theme-night .spx-status-badge.spx-status-done,.spx-theme-night .spx-preview-chip.spx-ok,.spx-theme-night .spx-command-pill.spx-ok,.spx-theme-night .spx-resource-badge-quark,.spx-theme-night .spx-forum-dashboard-chip.spx-green{background:rgba(74,222,128,.16)!important;border-color:rgba(74,222,128,.42)!important;color:#86efac!important;}',
      '.spx-theme-night .spx-status-badge.spx-status-failed,.spx-theme-night .spx-status-badge.spx-status-invalid,.spx-theme-night .spx-preview-download-badge.spx-fail,.spx-theme-night .spx-resource-badge-archive{background:var(--spx-danger-soft)!important;border-color:rgba(248,113,113,.42)!important;color:var(--spx-danger)!important;}',
      '.spx-theme-night .spx-resource-badge-guess,.spx-theme-night .spx-resource-badge-ed2k,.spx-theme-night .spx-resource-badge-cloud{background:var(--spx-panel-muted)!important;border-color:var(--spx-line)!important;color:var(--spx-sub)!important;}',
      '.spx-theme-night #infobox.spx-profile-infobox-restored,.spx-theme-night .spx-profile-infobox-restored{background:var(--spx-panel)!important;border-color:var(--spx-line)!important;color:var(--spx-text)!important;box-shadow:var(--spx-shadow-card)!important;}',
      '.spx-theme-night .spx-profile-infobox-meta,.spx-theme-night .spx-profile-infobox-honor{color:var(--spx-text)!important;}.spx-theme-night .spx-profile-infobox-hot,.spx-theme-night .spx-profile-infobox-hot-label{color:var(--spx-sub)!important;}',
      '.spx-theme-night .spx-preview-lightbox{background:rgba(0,0,0,.92)!important;color:var(--spx-text)!important;}',
      '.spx-theme-night .spx-preview-lightbox-shell,.spx-theme-night .spx-preview-lightbox-stage,.spx-theme-night .spx-preview-lightbox-strip{background:#070908!important;border-color:var(--spx-line)!important;}',
      '.spx-theme-night .spx-preview-lightbox-image{background:#0b0f0c!important;}',
      '.spx-theme-night .spx-danger,.spx-theme-night .spx-watch-actions .spx-danger,.spx-theme-night .spx-settings .spx-danger{border-color:var(--spx-danger)!important;background:var(--spx-danger-soft)!important;color:var(--spx-danger)!important;}',
      '.spx-theme-night #peacemakerconfig>div:not([hidden]),.spx-theme-night #peacemakerconfig>div:not([hidden])>div,.spx-theme-night.spx-home-dashboard #notice,.spx-theme-night.spx-home-dashboard .spx-home-quick a,.spx-theme-night.spx-search-page .t,.spx-theme-night.spx-profile-page .spx-account-tabs,.spx-theme-night.spx-profile-page #u-wrap,.spx-theme-night.spx-profile-page #u-wrap2,.spx-theme-night.spx-profile-page #set-side-wrap,.spx-theme-night.spx-profile-page #set-content-wrap{background:var(--spx-panel)!important;border-color:var(--spx-line)!important;color:var(--spx-text)!important;box-shadow:var(--spx-shadow-card)!important;}',
      '.spx-theme-night.spx-home-dashboard #notice td,.spx-theme-night.spx-home-dashboard .spx-home-quick a span,.spx-theme-night.spx-home-dashboard .spx-home-module tr.tr3>td,.spx-theme-night.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3>td,.spx-theme-night.spx-forum-dashboard td[id^="td_"],.spx-theme-night.spx-search-page .tr1,.spx-theme-night.spx-search-page .tr2,.spx-theme-night.spx-search-page .tr3,.spx-theme-night.spx-profile-page #set-side .set-h2{background:transparent!important;border-color:var(--spx-line-soft)!important;color:var(--spx-sub)!important;}',
      '.spx-theme-night.spx-home-dashboard .spx-home-module [id^="fn_"],.spx-theme-night.spx-home-dashboard .spx-home-module [id^="fn_"] a,.spx-theme-night.spx-forum-dashboard td[id^="td_"] a[id^="a_ajax_"],.spx-theme-night.spx-forum-dashboard [id^="td_"] a[href*="read.php"],.spx-theme-night.spx-profile-page #set-menu>li>a,.spx-theme-night.spx-profile-page #u-top-nav .b>li>a,.spx-theme-night.spx-profile-page .spx-account-tabs a{color:var(--spx-link)!important;}',
      '.spx-theme-night.spx-profile-page #set-menu>li>a,.spx-theme-night.spx-profile-page #u-top-nav .b>li>a,.spx-theme-night.spx-profile-page .spx-account-tabs a,.spx-theme-night.spx-search-page .spx-module-body input[type="text"],.spx-theme-night.spx-search-page .spx-module-body input[type="search"],.spx-theme-night.spx-search-page .spx-module-body input[name="keyword"],.spx-theme-night.spx-search-page .spx-module-body input[name="username"]{background:var(--spx-panel-muted)!important;border-color:var(--spx-line)!important;color:var(--spx-text)!important;}',
      '.spx-theme-night .spx-preview-popover h4{color:var(--spx-strong)!important;}',
      '.spx-theme-night .spx-preview-popover .spx-preview-meta,.spx-theme-night .spx-preview-popover .spx-preview-status{color:var(--spx-muted)!important;}',
      '.spx-theme-night .spx-preview-popover-actions a,.spx-theme-night .spx-preview-popover-actions button{background:var(--spx-panel-muted)!important;border-color:var(--spx-line)!important;color:var(--spx-text)!important;}',
      '.spx-theme-night .spx-preview-popover-actions a:hover,.spx-theme-night .spx-preview-popover-actions button:hover{border-color:var(--spx-accent)!important;color:var(--spx-accent)!important;}',
      '.spx-theme-night .spx-preview-popover .spx-preview-text{color:var(--spx-text)!important;}',
      '.spx-theme-night .spx-preview-popover .spx-preview-images a{background:var(--spx-panel-muted)!important;border-color:var(--spx-line)!important;}',
      '.spx-theme-night .spx-read-summary-track{background:var(--spx-line)!important;}.spx-theme-night .spx-preview-chip,.spx-theme-night .spx-chip{background:var(--spx-panel-muted)!important;border-color:var(--spx-line)!important;color:var(--spx-sub)!important;}',
    ];
  }

  function getInjectedPreviewParityStyleRules() {
    return [
      ':root,.spx-theme-clean{--spx-page-max:1480px;--spx-page-space:40px;--spx-radius:10px;--spx-radius-lg:12px;--spx-shadow-card:0 8px 18px rgba(15,23,42,.07);}',
      ':root.spx-theme-night,.spx-theme-night{--spx-page-max:1480px;}',
      '.spx-site-shell #mainNav,.spx-home-dashboard #mainNav,.spx-forum-dashboard #mainNav,.spx-immersive-read #mainNav{height:38px!important;padding:0 8px!important;border-radius:10px!important;box-shadow:0 6px 18px rgba(15,23,42,.12)!important;}',
      '.spx-site-shell #mainNav>div:not([style*="padding-left"]){'+CSS_HIDE+'}',
      '.spx-site-shell #mainNav>div[style*="padding-left"]{display:flex!important;align-items:center!important;gap:6px!important;height:38px!important;padding-left:8px!important;}',
      '.spx-site-shell #mainNav>div[style*="padding-left"] table,.spx-site-shell #mainNav>div[style*="padding-left"] tbody,.spx-site-shell #mainNav>div[style*="padding-left"] tr,.spx-site-shell #mainNav>div[style*="padding-left"] td{flex:none!important;height:38px!important;}',
      '.spx-site-shell #guide{height:38px!important;align-items:center!important;gap:6px!important;}',
      '.spx-site-shell #guide>li>a{height:28px!important;line-height:28px!important;padding:0 10px!important;border-radius:8px!important;font-size:12px!important;font-weight:800!important;}',
      '.spx-site-shell #guide>li.current>a,.spx-site-shell #guide>li.spx-nav-current>a,.spx-site-shell #guide>li>a.spx-nav-current{box-shadow:inset 0 -2px 0 var(--spx-accent)!important;}',
      '.spx-site-shell #peacemakerconfig>div:not([hidden]){top:38px!important;border-radius:10px!important;}',
      '.spx-site-shell #header,.spx-site-shell #mainNav,.spx-site-shell #infobox,.spx-site-shell #notice,.spx-site-shell #content,.spx-home-dashboard #header,.spx-home-dashboard #mainNav,.spx-home-dashboard #infobox,.spx-home-dashboard #notice,.spx-home-dashboard #content,.spx-forum-dashboard #header,.spx-forum-dashboard #mainNav,.spx-forum-dashboard #infobox,.spx-forum-dashboard #notice,.spx-forum-dashboard #content,.spx-immersive-read #header,.spx-immersive-read #mainNav,.spx-immersive-read #breadcrumbs{width:calc(100vw - 40px)!important;max-width:1480px!important;margin-left:auto!important;margin-right:auto!important;}',
      '.spx-home-dashboard #header,.spx-forum-dashboard #header,.spx-immersive-read #header{margin-top:18px!important;}',
      '.spx-home-dashboard #content,.spx-forum-dashboard #content{margin:14px auto 56px!important;}',
      '.spx-module-nav-ready.spx-home-dashboard #content,.spx-module-nav-ready.spx-forum-dashboard #content{grid-template-columns:minmax(196px,var(--spx-module-width)) minmax(0,1fr)!important;gap:14px!important;}',
      '.spx-module-nav-ready .spx-module-nav-host{display:grid!important;grid-template-columns:minmax(196px,var(--spx-module-width)) minmax(0,1fr)!important;gap:14px!important;align-items:start!important;width:calc(100vw - 40px)!important;max-width:1480px!important;margin:14px auto 56px!important;}',
      '.spx-module-nav-ready .spx-module-body{grid-column:2!important;min-width:0!important;display:block!important;}',
      '.spx-module-nav-ready .spx-module-nav-host>*:not(.spx-module-nav):not(.spx-module-body){grid-column:2!important;min-width:0!important;}',
      '.spx-module-nav-ready.spx-search-page #main.spx-module-nav-host,.spx-module-nav-ready.spx-search-page #content.spx-module-nav-host,.spx-module-nav-ready.spx-profile-page #main.spx-module-nav-host,.spx-module-nav-ready.spx-profile-page #content.spx-module-nav-host{display:grid!important;grid-template-columns:minmax(196px,var(--spx-module-width)) minmax(0,1fr)!important;gap:14px!important;align-items:start!important;width:calc(100vw - 40px)!important;max-width:1480px!important;margin:14px auto 56px!important;}',
      '.spx-module-nav-ready.spx-search-page #main.spx-module-nav-host>.spx-module-nav,.spx-module-nav-ready.spx-search-page #content.spx-module-nav-host>.spx-module-nav,.spx-module-nav-ready.spx-profile-page #main.spx-module-nav-host>.spx-module-nav,.spx-module-nav-ready.spx-profile-page #content.spx-module-nav-host>.spx-module-nav{grid-column:1!important;width:auto!important;max-width:100%!important;min-width:0!important;}',
      '.spx-module-nav-ready.spx-search-page #main.spx-module-nav-host>.spx-module-body,.spx-module-nav-ready.spx-search-page #content.spx-module-nav-host>.spx-module-body,.spx-module-nav-ready.spx-profile-page #main.spx-module-nav-host>.spx-module-body,.spx-module-nav-ready.spx-profile-page #content.spx-module-nav-host>.spx-module-body{grid-column:2!important;width:auto!important;max-width:100%!important;min-width:0!important;}',
      '.spx-module-nav-ready.spx-search-page .spx-module-body>.bdbA,.spx-module-nav-ready.spx-search-page .spx-module-body>.t,.spx-module-nav-ready.spx-search-page .spx-module-body>.t3,.spx-module-nav-ready.spx-search-page .spx-module-body>.t5,.spx-module-nav-ready.spx-profile-page .spx-module-body>.bdbA,.spx-module-nav-ready.spx-profile-page .spx-module-body>.t,.spx-module-nav-ready.spx-profile-page .spx-module-body>.t3,.spx-module-nav-ready.spx-profile-page .spx-module-body>.t5{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;margin:0 0 14px!important;}',
      '.spx-module-nav-ready.spx-search-page .spx-module-body form{display:block!important;'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;}',
      '.spx-module-nav-ready.spx-search-page .spx-module-body form>.t,.spx-module-nav-ready.spx-search-page .spx-module-body form .t{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;margin-left:0!important;margin-right:0!important;}',
      '.spx-module-nav-ready.spx-search-page .spx-module-body table,.spx-module-nav-ready.spx-profile-page .spx-module-body table{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;table-layout:fixed!important;}',
      '.spx-module-nav-ready.spx-search-page .spx-module-body form table{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;table-layout:fixed!important;}',
      '.spx-module-nav-ready.spx-search-page .spx-module-body td,.spx-module-nav-ready.spx-search-page .spx-module-body th{'+CSS_BOX+'max-width:100%!important;word-break:break-word!important;}',
      '.spx-module-nav-ready.spx-profile-page .spx-module-body>#spx-account-tabs,.spx-module-nav-ready.spx-profile-page .spx-module-body>#u-wrap,.spx-module-nav-ready.spx-profile-page .spx-module-body>#u-wrap2,.spx-module-nav-ready.spx-profile-page .spx-module-body>#set-wrap,.spx-module-nav-ready.spx-profile-page .spx-module-body>#set-side-wrap,.spx-module-nav-ready.spx-profile-page .spx-module-body>#set-content-wrap{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;}',
      '.spx-module-nav-ready.spx-reader #main.spx-module-nav-host>.spx-module-body,.spx-module-nav-ready.spx-reader #content.spx-module-nav-host>.spx-module-body{grid-column:2!important;width:auto!important;max-width:100%!important;min-width:0!important;overflow:hidden!important;}',
      '.spx-module-nav-ready.spx-reader .spx-module-body>.bdbA{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;margin:0 0 10px!important;overflow:hidden!important;}',
      '.spx-module-nav-ready.spx-reader .spx-module-body #breadcrumbs{'+CSS_BOX+'display:flex!important;flex-wrap:wrap!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;overflow:hidden!important;}',
      '.spx-module-nav-ready.spx-reader .spx-module-body #breadcrumbs .crumbs-item{min-width:0!important;max-width:100%!important;white-space:normal!important;word-break:break-word!important;}',
      '.spx-module-nav-ready.spx-reader .spx-module-body table.js-post{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;margin:14px 0!important;table-layout:fixed!important;}',
      '.spx-module-nav-ready.spx-reader .spx-module-body table.js-post>tbody,.spx-module-nav-ready.spx-reader .spx-module-body table.js-post>tbody>tr{max-width:100%!important;}',
      '.spx-module-nav-ready.spx-reader .spx-module-body table.js-post>tbody>tr>th.r_one{'+CSS_BOX+'width:auto!important;max-width:100%!important;min-width:0!important;overflow:hidden!important;}',
      '.spx-module-nav-ready.spx-reader .spx-module-body table.js-post>tbody>tr>th.r_two{'+CSS_BOX+'max-width:128px!important;min-width:0!important;overflow:hidden!important;}',
      '.spx-module-nav-ready.spx-reader .spx-module-body .spx-post-tools,.spx-module-nav-ready.spx-reader .spx-module-body .tiptop,.spx-module-nav-ready.spx-reader .spx-module-body .tipad,.spx-module-nav-ready.spx-reader .spx-module-body .readbot,.spx-module-nav-ready.spx-reader .spx-module-body .spx-post-body-split,.spx-module-nav-ready.spx-reader .spx-module-body .tpc_content,.spx-module-nav-ready.spx-reader .spx-module-body .signature,.spx-module-nav-ready.spx-reader .spx-module-body .sigline{'+CSS_BOX+'max-width:100%!important;min-width:0!important;}',
      '.spx-module-nav-ready.spx-task-page #main.spx-module-nav-host,.spx-module-nav-ready.spx-task-page #content.spx-module-nav-host{display:grid!important;grid-template-columns:minmax(196px,var(--spx-module-width)) minmax(0,1fr)!important;gap:14px!important;align-items:start!important;width:calc(100vw - 40px)!important;max-width:1480px!important;margin:14px auto 56px!important;}',
      '.spx-module-nav-ready.spx-task-page #main.spx-module-nav-host>.spx-module-nav,.spx-module-nav-ready.spx-task-page #content.spx-module-nav-host>.spx-module-nav{grid-column:1!important;width:auto!important;max-width:100%!important;min-width:0!important;}',
      '.spx-module-nav-ready.spx-task-page #main.spx-module-nav-host>.spx-module-body,.spx-module-nav-ready.spx-task-page #content.spx-module-nav-host>.spx-module-body{grid-column:2!important;display:block!important;width:auto!important;max-width:100%!important;min-width:0!important;overflow:hidden!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-module-body>.bdbA,.spx-module-nav-ready.spx-task-page .spx-module-body>.spx-task-breadcrumb-block{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;margin:0 0 14px!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-task-breadcrumb-block #breadcrumbs,.spx-module-nav-ready.spx-task-page .spx-module-body>#breadcrumbs{'+CSS_BOX+'display:flex!important;flex-wrap:wrap!important;align-items:center!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-task-breadcrumb-block #breadcrumbs .crumbs-item,.spx-module-nav-ready.spx-task-page .spx-module-body>#breadcrumbs .crumbs-item{min-width:0!important;max-width:100%!important;white-space:normal!important;word-break:break-word!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-module-body>.t,.spx-module-nav-ready.spx-task-page .spx-module-body>.t3,.spx-module-nav-ready.spx-task-page .spx-module-body>.t5{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;margin:0 0 14px!important;overflow:hidden!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-module-body table{'+CSS_BOX+'width:100%!important;max-width:100%!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-module-body td,.spx-module-nav-ready.spx-task-page .spx-module-body th{max-width:100%!important;word-break:break-word!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-module-body img{max-width:100%!important;height:auto!important;}',
      '.spx-module-nav-ready.spx-task-page #main.spx-module-nav-host>.spx-module-body.spx-task-layout-body,.spx-module-nav-ready.spx-task-page #content.spx-module-nav-host>.spx-module-body.spx-task-layout-body{display:grid!important;grid-template-columns:minmax(240px,320px) minmax(0,1fr)!important;gap:18px!important;align-items:start!important;overflow:visible!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-task-layout-body>.bdbA,.spx-module-nav-ready.spx-task-page .spx-task-layout-body>.spx-task-breadcrumb-block{grid-column:1/-1!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-task-side-stack{grid-column:1!important;display:flex!important;flex-direction:column!important;gap:14px!important;min-width:0!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-task-side-stack:empty{'+CSS_HIDE+'}',
      '.spx-module-nav-ready.spx-task-page .spx-task-main-stack{grid-column:2!important;min-width:0!important;max-width:100%!important;overflow:hidden!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-task-side-stack>.t,.spx-module-nav-ready.spx-task-page .spx-task-side-stack>.t3,.spx-module-nav-ready.spx-task-page .spx-task-side-stack>.t5,.spx-module-nav-ready.spx-task-page .spx-task-main-stack>.t,.spx-module-nav-ready.spx-task-page .spx-task-main-stack>.t3,.spx-module-nav-ready.spx-task-page .spx-task-main-stack>.t5{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-task-side-stack>.spx-task-side-block,.spx-module-nav-ready.spx-task-page .spx-task-main-stack>.spx-task-main-block{float:none!important;clear:none!important;'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-task-main-stack table,.spx-module-nav-ready.spx-task-page .spx-task-side-stack table{'+CSS_BOX+'width:100%!important;max-width:100%!important;}',
      '.spx-module-nav-ready.spx-task-page .spx-task-main-stack>.spx-task-claim-inline{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;margin:14px 0 0!important;padding:14px!important;background:var(--spx-panel)!important;border:1px solid var(--spx-line)!important;border-radius:12px!important;box-shadow:var(--spx-shadow-card)!important;color:var(--spx-text)!important;}',
      '.spx-task-claim-head{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:12px!important;margin:0 0 10px!important;padding:0 0 10px!important;border-bottom:1px solid var(--spx-line-soft)!important;}',
      '.spx-task-claim-head h3{margin:0!important;color:var(--spx-strong)!important;font-size:16px!important;line-height:1.3!important;font-weight:900!important;}',
      '.spx-task-claim-summary{margin:3px 0 0!important;color:var(--spx-sub)!important;font-size:12px!important;line-height:1.35!important;}',
      '.spx-task-claim-actions{display:flex!important;flex-wrap:wrap!important;justify-content:flex-end!important;gap:6px!important;}',
      '.spx-task-claim-actions button,.spx-task-claim-remove{border:1px solid var(--spx-line)!important;border-radius:8px!important;background:var(--spx-panel-muted)!important;color:var(--spx-text)!important;padding:5px 10px!important;cursor:pointer!important;font-size:12px!important;line-height:1.25!important;}',
      '.spx-task-claim-actions button:hover,.spx-task-claim-remove:hover{border-color:var(--spx-accent)!important;color:var(--spx-accent)!important;}',
      '.spx-task-claim-inline .spx-watch-controls{margin:0 0 10px!important;}',
      '.spx-task-claim-status{margin:0 0 10px!important;padding:8px 10px!important;border:1px solid #bbf7d0!important;border-radius:8px!important;background:#f0fdf4!important;color:#166534!important;font-size:12px!important;line-height:1.45!important;}',
      '.spx-task-claim-status.spx-error{border-color:#fecaca!important;background:#fef2f2!important;color:#991b1b!important;}',
      '.spx-task-auto-claim-status{'+CSS_BOX+'margin:0 0 14px!important;padding:9px 11px!important;border:1px solid #bbf7d0!important;border-radius:10px!important;background:#f0fdf4!important;color:#166534!important;font-size:12px!important;line-height:1.45!important;}',
      '.spx-task-auto-claim-status.spx-error{border-color:#fecaca!important;background:#fef2f2!important;color:#991b1b!important;}',
      '.spx-task-claim-empty{'+CSS_BOX+'padding:14px!important;border:1px dashed var(--spx-line)!important;border-radius:10px!important;background:var(--spx-panel-muted)!important;color:var(--spx-sub)!important;font-size:13px!important;line-height:1.5!important;}',
      '.spx-task-claim-list{display:grid!important;gap:8px!important;max-height:420px!important;overflow:auto!important;padding-right:2px!important;scrollbar-width:thin!important;}',
      '.spx-task-claim-row{'+CSS_BOX+'display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:10px!important;align-items:center!important;padding:10px 11px!important;border:1px solid var(--spx-line-soft)!important;border-radius:10px!important;background:var(--spx-panel-muted)!important;}',
      '.spx-task-claim-body{min-width:0!important;display:grid!important;gap:4px!important;}',
      '.spx-task-claim-title{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important;color:var(--spx-strong)!important;font-size:13px!important;font-weight:900!important;line-height:1.35!important;}',
      '.spx-task-claim-title a,.spx-task-claim-title strong{'+CSS_ELLIPSIS+'color:var(--spx-strong)!important;text-decoration:none!important;}',
      '.spx-task-claim-reward{flex:0 0 auto!important;padding:2px 7px!important;border-radius:999px!important;background:#dcfce7!important;color:#166534!important;font-size:12px!important;font-weight:900!important;}',
      '.spx-task-claim-meta{'+CSS_ELLIPSIS+'color:var(--spx-sub)!important;font-size:12px!important;line-height:1.35!important;}',
      '.spx-module-nav-ready.spx-home-dashboard .spx-module-body #spx-home-grid{grid-template-columns:minmax(0,1fr)!important;width:100%!important;max-width:100%!important;min-width:0!important;}',
      '.spx-module-nav-ready.spx-home-dashboard .spx-module-body .spx-home-module,.spx-module-nav-ready.spx-home-dashboard .spx-module-body .spx-home-module[data-spx-large="1"]{grid-column:1!important;width:100%!important;max-width:100%!important;min-width:0!important;}',
      '.spx-module-nav{top:52px!important;gap:9px!important;padding:12px!important;border-radius:12px!important;box-shadow:0 5px 14px rgba(15,23,42,.05)!important;}',
      '.spx-module-nav-title{padding:0 2px 9px!important;border-bottom:1px solid var(--spx-line)!important;}',
      '.spx-module-nav-section{margin:6px 0 1px!important;border:0!important;background:var(--spx-accent-wash)!important;cursor:pointer!important;}',
      '.spx-module-nav-group.spx-module-nav-collapsed>.spx-module-nav-node{'+CSS_HIDE+'}',
      '.spx-module-nav-item{min-height:var(--spx-module-item-height)!important;padding:0 var(--spx-module-item-padding)!important;border-radius:var(--spx-module-item-radius)!important;background:var(--spx-panel-muted)!important;}',
      '.spx-module-nav-count{min-width:22px!important;height:20px!important;}',
      '.spx-home-dashboard .spx-home-quick{'+CSS_HIDE+'}',
      '.spx-home-dashboard #notice,.spx-home-dashboard .spx-home-module,.spx-forum-dashboard #content .t,.spx-forum-dashboard .spx-module-nav-host .t{'+CSS_BOX+'width:100%!important;max-width:100%!important;min-width:0!important;border-radius:12px!important;background:var(--spx-panel)!important;border-color:var(--spx-line)!important;box-shadow:0 8px 18px rgba(15,23,42,.06)!important;}',
      '.spx-home-dashboard .spx-home-module>h2,.spx-home-dashboard .spx-home-module .h{min-height:38px!important;padding:0 12px!important;background:var(--spx-panel)!important;border:0!important;border-bottom:1px solid var(--spx-line)!important;color:var(--spx-strong)!important;font-size:13px!important;font-weight:900!important;}',
      '.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table table,.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tbody{display:block!important;width:100%!important;border:0!important;background:transparent!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr2,.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr2,.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tr.tr2{display:grid!important;gap:8px!important;padding:10px 12px!important;border-bottom:1px solid var(--spx-line)!important;background:var(--spx-panel-muted)!important;color:var(--spx-sub)!important;font-size:12px!important;font-weight:900!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr2{grid-template-columns:minmax(360px,620px) 96px minmax(180px,260px)!important;justify-content:start!important;}',
      '.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr2,.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tr.tr2{grid-template-columns:minmax(0,1fr) 92px 82px minmax(160px,.7fr)!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr2>td,.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr2>td,.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tr.tr2>td{display:block!important;width:auto!important;padding:0!important;border:0!important;background:transparent!important;color:var(--spx-sub)!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr2>td:last-child,.spx-home-dashboard .spx-home-module tr.tr3>td:last-child{'+CSS_HIDE+'}',
      '.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tr.tr2>td:first-child{'+CSS_HIDE+'}',
      '.spx-home-dashboard .spx-home-module tr.tr3,.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3,.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tr.tr3{min-height:44px!important;padding:9px 12px!important;border-bottom:1px solid var(--spx-line)!important;background:var(--spx-panel)!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr3{grid-template-columns:minmax(360px,620px) 96px minmax(180px,260px)!important;justify-content:start!important;}',
      '.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3,.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tr.tr3{grid-template-columns:minmax(0,1fr) 92px 82px minmax(160px,.7fr)!important;}',
      '.spx-home-dashboard .spx-home-module tr.tr3>td,.spx-home-dashboard .spx-home-module tr.tr3>th,.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3>td,.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tr.tr3>td,.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tr.tr3>th{display:block!important;width:auto!important;padding:0!important;border:0!important;background:transparent!important;font-size:12px!important;line-height:1.45!important;color:var(--spx-sub)!important;overflow:hidden!important;text-overflow:ellipsis!important;}',
      '.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tr.tr3>td:first-child:not([id^="td_"]){'+CSS_HIDE+'}',
      '.spx-home-dashboard .spx-home-module [id^="fn_"] a,.spx-home-dashboard .spx-home-module [id^="fn_"],.spx-forum-dashboard td[id^="td_"] a[id^="a_ajax_"],.spx-forum-dashboard [id^="td_"] a[href*="read.php"]{color:var(--spx-strong)!important;font-size:14px!important;font-weight:800!important;}',
      '.spx-home-dashboard .spx-home-hot [id^="fn_"] a,.spx-home-dashboard .spx-home-hot [id^="fn_"]{color:var(--spx-accent)!important;}',
      '.spx-home-dashboard .spx-home-badge,.spx-toolbox-count,.spx-status-badge,.spx-toolbox-key{background:var(--spx-accent-soft)!important;color:var(--spx-accent)!important;}',
      '.spx-forum-tools{min-height:42px!important;padding:8px 10px!important;border-radius:12px!important;background:var(--spx-panel)!important;border-color:var(--spx-line)!important;box-shadow:0 8px 18px rgba(15,23,42,.06)!important;}',
      '.spx-forum-tools input{height:30px!important;border-radius:8px!important;background:var(--spx-panel-muted)!important;}',
      '.spx-forum-tools button,.spx-thread-tools button,.spx-post-tools button{border-radius:8px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;}',
      '.spx-forum-dashboard .spx-thread-list-table tr:not(.tr2):not(.tr3){'+CSS_HIDE+'}',
      '.spx-forum-dashboard .spx-thread-list-table tr.spx-filter-hidden,.spx-forum-dashboard .spx-thread-list-table tr.spx-hidden-rule,.spx-forum-dashboard .spx-thread-list-table tr.spx-unread-hidden,.spx-forum-dashboard .spx-thread-list-table tr.spx-thread-row-hidden{'+CSS_HIDE+'}',
      '.spx-forum-dashboard .spx-thread-list-table tr.tr3:not(:hover) .spx-thread-tools{'+CSS_HIDE+'}',
      '.spx-theme-night.spx-forum-gallery-page #wall .inner,.spx-theme-night.spx-forum-gallery-page #wall .spx-gallery-card-inner{background:var(--spx-panel)!important;border-color:var(--spx-line)!important;color:var(--spx-text)!important;box-shadow:0 10px 30px rgba(0,0,0,.28)!important;}',
      '.spx-theme-night.spx-forum-gallery-page #wall .section-intro{background:var(--spx-panel-muted)!important;border-color:var(--spx-line)!important;color:var(--spx-sub)!important;}',
      '.spx-theme-night.spx-forum-gallery-page #wall .section-text img{border-color:var(--spx-line)!important;background:var(--spx-panel-muted)!important;}',
      '.spx-toolbar{right:16px!important;bottom:18px!important;display:flex!important;flex-direction:row!important;gap:7px!important;padding:6px!important;border-radius:16px!important;background:rgba(255,255,255,.92)!important;box-shadow:0 18px 46px rgba(15,23,42,.18)!important;}',
      '.spx-toolbar button{width:52px!important;height:36px!important;border-radius:12px!important;background:var(--spx-panel)!important;color:var(--spx-text)!important;}',
      '.spx-toolbar button:hover,.spx-toolbar button:focus-visible{border-color:var(--spx-accent)!important;color:var(--spx-accent)!important;box-shadow:0 7px 18px rgba(37,99,235,.16)!important;}',
      '.spx-toolbar .spx-active{border-color:var(--spx-accent)!important;background:var(--spx-accent-soft)!important;color:var(--spx-accent)!important;box-shadow:inset 0 0 0 1px rgba(37,99,235,.12),0 6px 16px rgba(37,99,235,.14)!important;}',
      '.spx-toolbox,.spx-settings,.spx-watch-center{right:16px!important;bottom:72px!important;border-radius:12px!important;}',
      '.spx-toolbox{width:min(460px,calc(100vw - 32px))!important;}',
      '.spx-toolbox-header,.spx-settings-header,.spx-watch-center-header{background:var(--spx-panel)!important;border-color:var(--spx-line)!important;}',
      '.spx-toolbox-eyebrow{color:var(--spx-accent)!important;}',
      '.spx-toolbox-action{min-height:42px!important;border-radius:10px!important;background:var(--spx-panel-muted)!important;border-color:var(--spx-line)!important;box-shadow:none!important;}',
      '.spx-toolbox-action:hover,.spx-toolbox-action:focus-visible{border-color:var(--spx-accent)!important;background:var(--spx-accent-wash)!important;color:var(--spx-accent)!important;box-shadow:0 10px 24px rgba(37,99,235,.15)!important;}',
      '.spx-toolbox-action.spx-active{border-color:var(--spx-accent)!important;background:var(--spx-accent-soft)!important;color:var(--spx-accent)!important;box-shadow:0 8px 22px rgba(37,99,235,.18)!important;}',
      '.spx-toolbox-action.spx-active:before{background:var(--spx-accent)!important;}',
      '.spx-theme-night .spx-toolbar{background:rgba(24,29,26,.92)!important;box-shadow:0 18px 46px rgba(0,0,0,.42)!important;}',
      '.spx-theme-night.spx-home-dashboard .spx-home-module,.spx-theme-night.spx-home-dashboard #notice,.spx-theme-night.spx-home-dashboard .spx-home-quick a,.spx-theme-night.spx-forum-dashboard #content .t,.spx-theme-night.spx-forum-dashboard .spx-module-nav-host .t{background:#181d1a!important;border-color:#303a32!important;color:#edf4ec!important;box-shadow:0 10px 30px rgba(0,0,0,.28)!important;}',
      '.spx-theme-night .spx-forum-dashboard-panel,.spx-theme-night .spx-forum-dashboard-card{background:var(--spx-panel)!important;border-color:var(--spx-line)!important;color:var(--spx-text)!important;box-shadow:0 10px 30px rgba(0,0,0,.28)!important;}.spx-theme-night .spx-forum-dashboard-stat,.spx-theme-night .spx-forum-dashboard-topic,.spx-theme-night .spx-forum-dashboard-resource,.spx-theme-night .spx-forum-dashboard-activity{background:var(--spx-panel-muted)!important;border-color:var(--spx-line)!important;}.spx-theme-night .spx-forum-dashboard-stat.spx-blue,.spx-theme-night .spx-forum-dashboard-stat.spx-amber,.spx-theme-night .spx-forum-dashboard-stat.spx-rose,.spx-theme-night .spx-forum-dashboard-stat.spx-green,.spx-theme-night .spx-forum-dashboard-stat.spx-violet{background:var(--spx-panel-muted)!important;border-color:var(--spx-line)!important;}',
      '.spx-theme-night.spx-home-dashboard .spx-home-module tr.tr2,.spx-theme-night.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr2,.spx-theme-night.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tr.tr2{background:#202720!important;border-color:#303a32!important;color:#b7c8b7!important;}',
      '.spx-theme-night.spx-home-dashboard .spx-home-module tr.tr3,.spx-theme-night.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3,.spx-theme-night.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tr.tr3{background:#181d1a!important;border-color:#303a32!important;}',
      '.spx-theme-night.spx-home-dashboard .spx-home-module>h2,.spx-theme-night.spx-home-dashboard .spx-home-module .h,.spx-theme-night .spx-toolbox-header,.spx-theme-night .spx-settings-header,.spx-theme-night .spx-watch-center-header{background:var(--spx-panel)!important;}',
      '@media(max-width:900px){:root,.spx-theme-clean,.spx-theme-night{--spx-page-space:16px}.spx-site-shell #mainNav,.spx-home-dashboard #mainNav,.spx-forum-dashboard #mainNav,.spx-immersive-read #mainNav{height:34px!important}.spx-site-shell #guide{height:34px!important;overflow-x:auto!important}.spx-site-shell #guide>li>a{height:26px!important}.spx-site-shell #spx-nav-brand{height:26px!important;line-height:26px!important}.spx-module-nav-ready.spx-home-dashboard #content,.spx-module-nav-ready.spx-forum-dashboard #content,.spx-module-nav-ready .spx-module-nav-host{grid-template-columns:minmax(0,1fr)!important;gap:10px!important;width:calc(100vw - 16px)!important;margin:10px 8px 34px!important}.spx-module-nav-ready .spx-module-nav-host>*:not(.spx-module-nav),.spx-module-nav-ready .spx-module-body,.spx-module-nav{grid-column:1!important;width:auto!important;max-width:100%!important}.spx-module-nav{top:auto!important;position:static!important}.spx-module-nav-section{flex:none!important;margin:0 2px!important}.spx-home-dashboard .spx-home-module tr.tr2,.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr2,.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tr.tr2{display:none!important}.spx-home-dashboard .spx-home-module tr.tr3,.spx-forum-dashboard #content .t.spx-thread-list-table tr.tr3,.spx-forum-dashboard .spx-module-nav-host .t.spx-thread-list-table tr.tr3{grid-template-columns:1fr!important}}',
      '@media(max-width:900px){.spx-favorite-nav{margin-left:0!important;height:34px!important}.spx-favorite-nav-trigger{height:26px!important;line-height:26px!important}.spx-favorite-nav-panel{top:38px!important;right:auto!important;left:0!important;width:min(720px,calc(100vw - 24px))!important;max-height:calc(100vh - 84px)!important}.spx-favorite-stats{grid-template-columns:repeat(3,minmax(96px,1fr))!important;overflow-x:auto!important}.spx-favorite-item{grid-template-columns:minmax(0,1fr)!important}.spx-favorite-actions{justify-content:flex-start!important}.spx-favorite-tools{align-items:flex-start!important;flex-direction:column!important}.spx-favorite-sort{width:100%!important}}',
      '@media(max-width:900px){.spx-module-nav-ready.spx-search-page #main.spx-module-nav-host,.spx-module-nav-ready.spx-search-page #content.spx-module-nav-host,.spx-module-nav-ready.spx-profile-page #main.spx-module-nav-host,.spx-module-nav-ready.spx-profile-page #content.spx-module-nav-host{grid-template-columns:minmax(0,1fr)!important;width:calc(100vw - 16px)!important;margin:10px 8px 34px!important}.spx-module-nav-ready.spx-search-page #main.spx-module-nav-host>.spx-module-nav,.spx-module-nav-ready.spx-search-page #content.spx-module-nav-host>.spx-module-nav,.spx-module-nav-ready.spx-profile-page #main.spx-module-nav-host>.spx-module-nav,.spx-module-nav-ready.spx-profile-page #content.spx-module-nav-host>.spx-module-nav,.spx-module-nav-ready.spx-search-page #main.spx-module-nav-host>.spx-module-body,.spx-module-nav-ready.spx-search-page #content.spx-module-nav-host>.spx-module-body,.spx-module-nav-ready.spx-profile-page #main.spx-module-nav-host>.spx-module-body,.spx-module-nav-ready.spx-profile-page #content.spx-module-nav-host>.spx-module-body{grid-column:1!important;width:auto!important;max-width:100%!important}}',
      '@media(max-width:900px){.spx-module-nav-ready.spx-task-page #main.spx-module-nav-host,.spx-module-nav-ready.spx-task-page #content.spx-module-nav-host{grid-template-columns:minmax(0,1fr)!important;width:calc(100vw - 16px)!important;margin:10px 8px 34px!important}.spx-module-nav-ready.spx-task-page #main.spx-module-nav-host>.spx-module-nav,.spx-module-nav-ready.spx-task-page #content.spx-module-nav-host>.spx-module-nav,.spx-module-nav-ready.spx-task-page #main.spx-module-nav-host>.spx-module-body,.spx-module-nav-ready.spx-task-page #content.spx-module-nav-host>.spx-module-body{grid-column:1!important;width:auto!important;max-width:100%!important}.spx-module-nav-ready.spx-task-page #main.spx-module-nav-host>.spx-module-body.spx-task-layout-body,.spx-module-nav-ready.spx-task-page #content.spx-module-nav-host>.spx-module-body.spx-task-layout-body{grid-template-columns:minmax(0,1fr)!important}.spx-module-nav-ready.spx-task-page .spx-task-side-stack,.spx-module-nav-ready.spx-task-page .spx-task-main-stack{grid-column:1!important}}',
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
    var navDensity = getModuleNavigationDensityConfig(settings && settings.moduleNavDensity);
    document.documentElement.classList.toggle('spx-theme-clean', !settings.nightMode);
    document.documentElement.classList.toggle('spx-theme-night', !!settings.nightMode);
    document.documentElement.classList.toggle('spx-site-shell', shouldUseSiteShell(location.href));
    document.documentElement.classList.toggle('spx-adblock', !!settings.adBlock);
    document.documentElement.classList.toggle('spx-clean', !!settings.cleanMode);
    document.documentElement.classList.toggle('spx-reader', shouldUseReaderMode(settings, location.href));
    document.documentElement.classList.toggle('spx-immersive-read', shouldUseImmersiveRead(settings, location.href));
    document.documentElement.classList.toggle('spx-home-dashboard', shouldUseHomeDashboard(settings, location.href));
    document.documentElement.classList.toggle('spx-forum-dashboard', shouldUseForumDashboard(location.href, document));
    document.documentElement.classList.toggle('spx-forum-gallery-page', isForumGalleryModeUrl(location.href));
    document.documentElement.classList.toggle('spx-search-page', shouldUseSearchPage(location.href));
    document.documentElement.classList.toggle('spx-profile-page', shouldUseProfilePage(location.href));
    document.documentElement.classList.toggle('spx-task-page', shouldUseTaskPage(location.href));
    document.documentElement.classList.toggle('spx-compact-read', !!settings.compactRead);
    document.documentElement.classList.toggle('spx-hide-profile', !!settings.hideUserProfile);
    document.documentElement.style.setProperty('--spx-immersive-font-size', '16px');
    document.documentElement.style.setProperty('--spx-module-width', navDensity.width + 'px');
    document.documentElement.style.setProperty('--spx-module-max-offset', navDensity.maxOffset + 'px');
    document.documentElement.style.setProperty('--spx-module-section-height', navDensity.sectionHeight + 'px');
    document.documentElement.style.setProperty('--spx-module-parent-height', navDensity.parentHeight + 'px');
    document.documentElement.style.setProperty('--spx-module-item-height', navDensity.itemHeight + 'px');
    document.documentElement.style.setProperty('--spx-module-child-height', navDensity.childHeight + 'px');
    document.documentElement.style.setProperty('--spx-module-item-padding', navDensity.itemPadding + 'px');
    document.documentElement.style.setProperty('--spx-module-section-padding', navDensity.sectionPadding + 'px');
    document.documentElement.style.setProperty('--spx-module-item-radius', navDensity.radius + 'px');
  }

  function extractAccountUserId(root, url) {
    var scope = root || document;
    var text = String(url || location.href || '');
    var urlMatch = text.match(/[?&]uid[=-](\d+)/) || text.match(/uid-(\d+)/);
    if (urlMatch) return urlMatch[1];

    var globalDocument = typeof document !== 'undefined' ? document : null;
    if (scope && scope !== globalDocument) {
      var sourceUidLink = qsa('a[href*="uid"]', scope).map(function mapSourceUidLink(link) {
        return link.getAttribute('href') || link.href || '';
      }).filter(Boolean)[0];
      var sourceUidMatch = String(sourceUidLink || '').match(/uid[=-](\d+)/) || String(sourceUidLink || '').match(/uid-(\d+)/);
      if (sourceUidMatch) return sourceUidMatch[1];
    }

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

  function shouldRestoreProfileInfobox(url) {
    var activeKey = getAccountActiveKey(url || (typeof location !== 'undefined' ? location.href : ''));
    return ['home', 'profile', 'topic', 'post', 'favor', 'friend', 'trade'].indexOf(activeKey) !== -1;
  }

  function getProfileInfoboxSourceUrl(origin) {
    return String(origin || (typeof location !== 'undefined' ? location.origin : 'https://south-plus.org')) + '/thread.php?fid-9.html';
  }

  function getProfileInfoboxCache(now) {
    var cache = loadMap(PROFILE_INFOBOX_CACHE_KEY);
    var updatedAt = Number(cache.updatedAt) || 0;
    if (!cache.html || !updatedAt) return null;
    if ((now === undefined ? Date.now() : Number(now)) - updatedAt > PROFILE_INFOBOX_CACHE_TTL) return null;
    return cache;
  }

  function saveProfileInfoboxCache(html, sourceUrl, now) {
    var value = String(html || '').trim();
    if (!value || value.indexOf('id="infobox"') === -1) return false;
    saveMap(PROFILE_INFOBOX_CACHE_KEY, {
      html: value.slice(0, 12000),
      sourceUrl: String(sourceUrl || ''),
      updatedAt: now === undefined ? Date.now() : Number(now),
    });
    return true;
  }

  function createProfileInfoboxFromHtml(html) {
    if (!html || typeof DOMParser === 'undefined') return null;
    var doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
    var source = qs('#infobox', doc);
    if (!source) return null;
    return createProfileInfoboxFallback(source);
  }

  function createProfileInfoboxLink(label, href) {
    var link = createEl('a', '', label);
    link.href = href;
    return link;
  }

  function getProfileInfoboxSourceHref(sourceBox, label) {
    if (!sourceBox) return '';
    var sourceLink = qsa('a[href]', sourceBox).filter(function matchProfileInfoboxSourceLink(link) {
      return compactText(link.textContent) === label;
    })[0];
    return sourceLink ? sourceLink.getAttribute('href') || sourceLink.href || '' : '';
  }

  function cloneProfileInfoboxAvatar(sourceBox) {
    var avatar = (sourceBox && (qs('img[src*="face"]', sourceBox) || qs('img', sourceBox))) || qs('#u-portrait img') || qs('#user_info img');
    if (!avatar) return null;
    var clone = avatar.cloneNode(false);
    clone.removeAttribute('id');
    clone.removeAttribute('style');
    Array.prototype.slice.call(clone.attributes || []).forEach(function removeProfileAvatarHandler(attribute) {
      if (/^on/i.test(attribute.name || '')) clone.removeAttribute(attribute.name);
    });
    return clone;
  }

  function getProfileInfoboxHonor(sourceBox) {
    var currentHonor = compactText(qs('#honor') && qs('#honor').textContent);
    if (currentHonor) return currentHonor;
    var topHonor = compactText(qs('#u-top') && qs('#u-top').textContent).replace(/编辑.*$/, '');
    if (topHonor) return compactText(topHonor);
    var sourceText = compactText(sourceBox && sourceBox.textContent);
    var match = sourceText.match(/我的回复\s*(?:更多)?\s*(.*?)(?:\s*编辑|\s*热门版块[:：]|$)/);
    return match ? compactText(match[1]) : '';
  }

  function createProfileInfoboxFallback(sourceBox) {
    var uid = extractAccountUserId(sourceBox || document, location.href);
    var origin = location.origin;
    var box = createEl('div', 'cc spx-profile-infobox-restored spx-profile-infobox-fallback');
    var main = createEl('div', 'spx-profile-infobox-main');
    var avatarWrap = createEl('div', 'spx-profile-infobox-avatar');
    var avatar = cloneProfileInfoboxAvatar(sourceBox);
    if (avatar) {
      avatarWrap.appendChild(avatar);
    }

    var body = createEl('div', 'spx-profile-infobox-body');
    var meta = createEl('div', 'spx-profile-infobox-meta');
    var sourceText = compactText(sourceBox && sourceBox.textContent);
    var sidebarText = compactText(qs('#u-sidebar') && qs('#u-sidebar').textContent);
    var detailText = sourceText || sidebarText;
    var levelMatch = detailText.match(/等级[:：]?\s*(Lv\.\d+)/i);
    var postMatch = detailText.match(/帖子[:：]?\s*(\d+)/);
    var topicHref = getProfileInfoboxSourceHref(sourceBox, '我的主题') || (uid ? origin + '/u.php?action-topic-uid-' + uid + '.html' : '');
    var postHref = getProfileInfoboxSourceHref(sourceBox, '我的回复') || (uid ? origin + '/u.php?action-post-uid-' + uid + '.html' : '');
    meta.appendChild(document.createTextNode('等级:' + (levelMatch ? levelMatch[1] : '未知')));
    if (postMatch) meta.appendChild(document.createTextNode('，帖子:' + postMatch[1]));
    if (topicHref || postHref) {
      meta.appendChild(document.createTextNode('，'));
      if (topicHref) meta.appendChild(createProfileInfoboxLink('我的主题', topicHref));
      if (topicHref && postHref) meta.appendChild(document.createTextNode('，'));
      if (postHref) meta.appendChild(createProfileInfoboxLink('我的回复', postHref));
    }
    body.appendChild(meta);

    var honor = getProfileInfoboxHonor(sourceBox);
    if (honor) body.appendChild(createEl('div', 'spx-profile-infobox-honor', honor));

    main.appendChild(avatarWrap);
    main.appendChild(body);

    var hot = createEl('div', 'spx-profile-infobox-hot');
    hot.appendChild(createEl('span', 'spx-profile-infobox-hot-label', '热门版块:'));
    getCommonForumNavigationItems(origin).slice(1, 7).forEach(function appendHotForum(item) {
      hot.appendChild(createProfileInfoboxLink(item.label, item.href));
    });

    box.id = 'infobox';
    box.appendChild(main);
    box.appendChild(hot);
    return box;
  }

  function mountProfileInfobox(box, replaceNative) {
    if (!box) return null;
    var existing = qs('#infobox');
    if (existing && !existing.classList.contains('spx-profile-infobox-restored') && !replaceNative) return existing;
    setImportantStyle(box, 'box-sizing', 'border-box');
    setImportantStyle(box, 'width', 'min(1480px, calc(100vw - 40px))');
    setImportantStyle(box, 'max-width', 'none');
    setImportantStyle(box, 'margin-left', 'auto');
    setImportantStyle(box, 'margin-right', 'auto');
    var main = qs('#main') || qs('#content');
    if (existing && existing.parentNode) {
      existing.parentNode.replaceChild(box, existing);
    } else if (main && main.parentNode) {
      main.parentNode.insertBefore(box, main);
    } else if (document.body) {
      document.body.insertBefore(box, document.body.firstChild);
    }
    return box;
  }

  function isStandardProfileInfobox(box) {
    return !!(
      box &&
      box.classList &&
      box.classList.contains('spx-profile-infobox-restored') &&
      qs('.spx-profile-infobox-main', box) &&
      qs('.spx-profile-infobox-hot', box)
    );
  }

  function standardizeExistingInfobox() {
    var existing = qs('#infobox');
    if (!existing) return null;
    if (isStandardProfileInfobox(existing)) return existing;
    return mountProfileInfobox(createProfileInfoboxFallback(existing), true);
  }

  function restoreProfileInfobox(settings) {
    if (!shouldRestoreProfileInfobox(location.href)) return;
    if (standardizeExistingInfobox()) return;
    var cached = getProfileInfoboxCache();
    var mounted = cached && mountProfileInfobox(createProfileInfoboxFromHtml(cached.html));
    if (!mounted) mountProfileInfobox(createProfileInfoboxFallback());
    if (document.documentElement.dataset.spxProfileInfoboxRefreshing === '1') return;
    if (cached && cached.updatedAt && Date.now() - Number(cached.updatedAt) < PROFILE_INFOBOX_CACHE_TTL / 2) return;
    if (testMode || typeof window === 'undefined' || typeof DOMParser === 'undefined') return;
    document.documentElement.dataset.spxProfileInfoboxRefreshing = '1';
    var sourceUrl = getProfileInfoboxSourceUrl(location.origin);
    requestWithPolicy(sourceUrl, { credentials: 'include', cache: 'force-cache' }, {
      mode: 'background',
      label: '个人页头部信息',
      networkFriendly: isNetworkFriendlyMode(settings),
    }).then(function readProfileInfoboxResponse(response) {
      if (!response || !response.ok) return '';
      return readScriptResponseText(response, { mode: 'background', label: '个人页头部信息' });
    }).then(function applyFetchedProfileInfobox(html) {
      var node = createProfileInfoboxFromHtml(html);
      if (!node) return;
      saveProfileInfoboxCache(node.outerHTML, sourceUrl);
      mountProfileInfobox(node);
    }).catch(function ignoreProfileInfoboxRefresh() {}).then(function clearProfileInfoboxRefreshFlag() {
      delete document.documentElement.dataset.spxProfileInfoboxRefreshing;
    });
  }

  function getFavoriteNavUrl(userId, origin) {
    var uid = String(userId || '').replace(/\D+/g, '');
    if (!uid) return '';
    var base = String(origin || location.origin || '').replace(/\/+$/, '');
    return base + '/u.php?action-favor-uid-' + uid + '.html';
  }

  function extractSiteVerifyHashFromText(text) {
    var value = String(text || '');
    var markerIndex = value.indexOf('verifyhash');
    if (markerIndex < 0) return '';
    var assignIndex = value.indexOf('=', markerIndex);
    if (assignIndex < 0) return '';
    var rest = value.slice(assignIndex + 1).replace(/^\s+/, '');
    var quote = rest.charAt(0);
    if (quote !== "'" && quote !== '"') return '';
    var endIndex = rest.indexOf(quote, 1);
    return endIndex > 0 ? rest.slice(1, endIndex) : '';
  }

  function getSiteVerifyHash(root) {
    if (typeof verifyhash !== 'undefined' && verifyhash) return String(verifyhash);
    if (typeof window !== 'undefined' && window.verifyhash) return String(window.verifyhash);
    var scope = root || (typeof document !== 'undefined' ? document : null);
    var scripts = scope && scope.querySelectorAll ? qsa('script', scope) : [];
    for (var i = 0; i < scripts.length; i += 1) {
      var scriptMatch = extractSiteVerifyHashFromText(scripts[i].textContent || '');
      if (scriptMatch) return scriptMatch;
    }
    var html = scope && scope.documentElement ? scope.documentElement.outerHTML : '';
    return extractSiteVerifyHashFromText(html);
  }

  function getThreadFavoriteUrl(threadId, origin, verify, now) {
    var tid = parseThreadId(threadId);
    if (!tid) return '';
    var base = String(origin || location.origin || '').replace(/\/+$/, '');
    var url = base + '/pw_ajax.php?action=favor&tid=' + encodeURIComponent(tid);
    var timestamp = now === undefined ? Date.now() : Number(now);
    url += '&nowtime=' + encodeURIComponent(isFinite(timestamp) ? timestamp : Date.now());
    if (verify) url += '&verify=' + encodeURIComponent(verify);
    return url;
  }

  function getThreadFavoriteResultText(text) {
    var value = compactText(String(text || '').replace(/^<\?xml[^>]*>/i, '').replace(/<ajax><!\[CDATA\[|\]\]><\/ajax>/gi, ''));
    if (!value) return '已收藏';
    if (/登录|权限|失败|错误|非法|重试/.test(value)) return '收藏失败';
    if (/已经|已收藏|重复/.test(value)) return '已收藏';
    if (/success|成功|收藏/.test(value)) return '已收藏';
    return '已提交';
  }

  function isNewThreadFavoriteResult(text) {
    var value = compactText(String(text || '').replace(/^<\?xml[^>]*>/i, '').replace(/<ajax><!\[CDATA\[|\]\]><\/ajax>/gi, ''));
    if (!value || /已经|已收藏|重复/.test(value)) return false;
    return /success|成功|收藏/.test(value);
  }

  function getSiteFavoriteDeleteResultText(text) {
    var value = compactText(String(text || '').replace(/^<\?xml[^>]*>/i, '').replace(/<ajax><!\[CDATA\[|\]\]><\/ajax>/gi, ''));
    if (/登录|权限|失败|错误|非法|重试/.test(value)) return '删除失败';
    if (/删除|取消|移除|success|成功/.test(value)) return '已删除';
    return value ? '已提交' : '已删除';
  }

  function buildFavoriteDeleteRequest(action, method, fields, pageUrl) {
    var targetUrl = normalizeNavigationHref(action || '', pageUrl || location.href);
    if (!targetUrl) return null;
    var requestMethod = String(method || 'GET').toUpperCase() === 'POST' ? 'POST' : 'GET';
    var params = new URLSearchParams();
    (fields || []).forEach(function appendFavoriteDeleteField(field) {
      if (!field || !field.name) return;
      params.append(field.name, field.value == null ? '' : String(field.value));
    });
    var body = params.toString();
    if (requestMethod === 'GET') {
      if (body) targetUrl += (targetUrl.indexOf('?') === -1 ? '?' : '&') + body;
      return { url: targetUrl, method: 'GET', body: '' };
    }
    return {
      url: targetUrl,
      method: 'POST',
      body: body,
      contentType: 'application/x-www-form-urlencoded;charset=UTF-8',
    };
  }

  function normalizeFavoriteDeleteFields(fields) {
    var result = [];
    var hasJob = false;
    (fields || []).forEach(function keepFavoriteDeleteField(field) {
      if (!field || !field.name) return;
      if (field.name === 'job') {
        if (!hasJob) {
          result.push({ name: 'job', value: 'clear' });
          hasJob = true;
        }
        return;
      }
      if (field.name === 'type') return;
      result.push(field);
    });
    if (!hasJob) result.push({ name: 'job', value: 'clear' });
    return result;
  }

  function isFavoriteDeleteControl(node) {
    if (!node) return false;
    var text = [
      node.textContent,
      node.value,
      node.title,
      node.getAttribute && node.getAttribute('href'),
      node.getAttribute && node.getAttribute('onclick'),
    ].join(' ');
    return /删除|取消收藏|移除|delete|del/i.test(text) && /收藏|favor|selid|delete|del/i.test(text);
  }

  function getFavoriteDeleteUrlFromLink(node, pageUrl) {
    if (!isFavoriteDeleteControl(node)) return '';
    var values = [
      node.getAttribute && node.getAttribute('href'),
      node.getAttribute && node.getAttribute('onclick'),
    ];
    var candidates = [];
    values.forEach(function collectFavoriteDeleteCandidate(value) {
      var text = String(value || '').replace(/&amp;/g, '&').trim();
      if (!text) return;
      if (!/^javascript:/i.test(text)) candidates.push(text);
      var match;
      var quotedUrlRe = /['"]([^'"]*(?:u\.php|pw_ajax\.php|action[=-]favor|selid|delete|del)[^'"]*)['"]/ig;
      while ((match = quotedUrlRe.exec(text))) {
        candidates.push(match[1].replace(/&amp;/g, '&'));
      }
    });
    for (var index = 0; index < candidates.length; index += 1) {
      var candidate = candidates[index];
      if (!/(?:favor|selid|delete|del)/i.test(candidate)) continue;
      var url = normalizeNavigationHref(candidate, pageUrl || location.href);
      if (url) return url;
    }
    return '';
  }

  function collectFavoriteDeleteFormFields(form, targetControl, submitControl) {
    var fields = [];
    qsa('input,textarea,select', form).forEach(function collectFavoriteDeleteField(control) {
      if (!control || control.disabled || !control.name) return;
      var tag = String(control.tagName || '').toLowerCase();
      var type = String(control.type || '').toLowerCase();
      if (type === 'file' || type === 'reset' || type === 'button' || type === 'image') return;
      if (type === 'submit') {
        if (control === submitControl) fields.push({ name: control.name, value: control.value || '' });
        return;
      }
      if (type === 'checkbox') {
        if (control === targetControl) fields.push({ name: control.name, value: control.value || 'on' });
        return;
      }
      if (type === 'radio') {
        if (control.name === 'job' && control.value === 'clear') fields.push({ name: control.name, value: control.value });
        else if (control === targetControl) fields.push({ name: control.name, value: control.value || 'on' });
        return;
      }
      if (tag === 'select' && control.name !== 'type') {
        qsa('option', control).forEach(function collectFavoriteSelectOption(option) {
          if (option.selected) fields.push({ name: control.name, value: option.value });
        });
        return;
      }
      if (tag === 'select') return;
      fields.push({ name: control.name, value: control.value || '' });
    });
    if (submitControl && submitControl.name && submitControl.type !== 'submit') {
      fields.push({ name: submitControl.name, value: submitControl.value || submitControl.textContent || '' });
    }
    return fields;
  }

  function findFavoriteDeleteRequestFromForm(row, pageUrl) {
    if (!row || !row.closest) return null;
    var form = row.closest('form');
    if (!form) return null;
    var controls = qsa('input,button', form);
    var targetControl = qsa('input[type="checkbox"],input[type="radio"]', row).filter(function keepFavoriteCheckbox(control) {
      return /sel|id|favor|tid/i.test(control.name || '') || /\d+/.test(control.value || '');
    })[0];
    if (!targetControl) return null;
    var submitControl = controls.filter(isFavoriteDeleteControl)[0] || null;
    var fields = normalizeFavoriteDeleteFields(collectFavoriteDeleteFormFields(form, targetControl, submitControl));
    return buildFavoriteDeleteRequest(form.getAttribute('action') || form.action || pageUrl, form.getAttribute('method') || form.method || 'GET', fields, pageUrl);
  }

  function findFavoriteDeleteRequestFromLinks(row, pageUrl) {
    if (!row) return null;
    var deleteUrl = '';
    qsa('a[href],a[onclick],button[onclick],input[onclick]', row).some(function findFavoriteDeleteLink(node) {
      deleteUrl = getFavoriteDeleteUrlFromLink(node, pageUrl);
      return !!deleteUrl;
    });
    return deleteUrl ? buildFavoriteDeleteRequest(deleteUrl, 'GET', [], pageUrl) : null;
  }

  function getFavoriteNavDeleteKey(entry) {
    var item = entry || {};
    return [item.source || '', item.id || '', item.url || '', item.index == null ? '' : item.index].join('|');
  }

  function getSelectedSiteFavoriteEntries(entries, selectedMap) {
    var selected = selectedMap || {};
    return (entries || []).filter(function keepSelectedFavorite(entry) {
      return !!(entry && entry.deleteRequest && selected[getFavoriteNavDeleteKey(entry)]);
    });
  }

  function createSiteFavoriteDeleteRequest(row, pageUrl) {
    return findFavoriteDeleteRequestFromLinks(row, pageUrl) || findFavoriteDeleteRequestFromForm(row, pageUrl);
  }

  function markThreadFavoriteSeen(info) {
    var tid = parseThreadId(info && info.id);
    if (!tid) return false;
    var seenMap = loadMap(FAVORITE_NAV_SEEN_KEY);
    if (seenMap[tid]) return false;
    seenMap[tid] = Date.now();
    saveMap(FAVORITE_NAV_SEEN_KEY, seenMap);
    return true;
  }

  function isThreadFavoriteSeen(threadId) {
    var tid = parseThreadId(threadId);
    if (!tid) return false;
    return !!loadMap(FAVORITE_NAV_SEEN_KEY)[tid];
  }

  function saveThreadSiteFavorite(info, settings) {
    var verify = getSiteVerifyHash(document);
    var url = getThreadFavoriteUrl(info && info.id, location.origin, verify, Date.now());
    if (!url) return Promise.reject(new Error('缺少帖子ID'));
    if (!verify) return Promise.reject(new Error('缺少站点校验参数'));
    var policy = {
      mode: 'action',
      label: '收藏帖子',
      networkFriendly: isNetworkFriendlyMode(settings),
    };
    return requestWithPolicy(url, { credentials: 'include', cache: 'no-store' }, policy)
      .then(function readFavoriteResponse(response) {
        if (!response.ok) throw new Error('收藏失败');
        return readScriptResponseText(response, policy);
      })
      .then(function resolveFavoriteText(html) {
        var text = getThreadFavoriteResultText(html);
        if (text === '收藏失败') throw new Error('收藏失败');
        return {
          text: text,
          added: isNewThreadFavoriteResult(html) && markThreadFavoriteSeen(info),
        };
      });
  }

  function runThreadFavoriteAction(info, settings, state, button, doneText) {
    if (!button) return;
    var originalText = button.dataset.spxFavoriteOriginalText || button.textContent || '收藏';
    button.dataset.spxFavoriteOriginalText = originalText;
    button.disabled = true;
    button.textContent = '收藏中';
    saveThreadSiteFavorite(info, settings).then(
      function markFavoriteDone(result) {
        delete button.dataset.spxFavoriteOriginalText;
        button.textContent = doneText || result.text || '已收藏';
        syncFavoriteNavAfterSiteFavorite(info, settings, state, !!(result && result.added));
      },
      function markFavoriteFailed(error) {
        var message = error && error.message ? error.message : '收藏失败';
        button.dataset.spxFavoriteError = message;
        button.title = message;
        button.textContent = '收藏失败';
        if (typeof window === 'undefined' || typeof window.setTimeout !== 'function') {
          button.disabled = false;
          button.textContent = originalText;
          delete button.dataset.spxFavoriteOriginalText;
          return;
        }
        window.setTimeout(function restoreFavoriteButton() {
          if ('isConnected' in button && !button.isConnected) return;
          button.disabled = false;
          button.textContent = originalText;
          delete button.dataset.spxFavoriteOriginalText;
        }, 1400);
      }
    );
  }

  function normalizeFavoriteNavSource(value) {
    return value === 'watch' ? 'watch' : 'site';
  }

  function normalizeFavoriteNavFilter(value) {
    var filter = String(value || 'all');
    return /^(all|updated|recent|unread|resource|image|ai)$/.test(filter) ? filter : 'all';
  }

  function normalizeFavoriteNavSort(value) {
    var sort = String(value || 'recent');
    return /^(updated|recent|read|reply)$/.test(sort) ? sort : 'recent';
  }

  function formatFavoriteNavCount(count, loading) {
    if (loading) return '...';
    var value = Number(count);
    if (!isFinite(value) || value < 0) return '-';
    if (value >= 1000) return '999+';
    return String(value);
  }

  function getFavoriteNavCountCacheKey(favoriteUrl) {
    return String(favoriteUrl || '').replace(/#.*$/, '');
  }

  function normalizeFavoriteNavCountCacheEntry(entry, now) {
    var source = entry || {};
    var count = Number(source.count);
    var updatedAt = Number(source.updatedAt);
    var nextRefreshAt = Number(source.nextRefreshAt || 0);
    var currentTime = now === undefined ? Date.now() : Number(now);
    if (!isFinite(count) || count < 0 || !isFinite(updatedAt) || updatedAt <= 0) return null;
    return {
      count: Math.floor(count),
      updatedAt: updatedAt,
      expiresAt: updatedAt + FAVORITE_NAV_COUNT_CACHE_TTL,
      fresh: currentTime - updatedAt < FAVORITE_NAV_COUNT_CACHE_TTL,
      nextRefreshAt: isFinite(nextRefreshAt) && nextRefreshAt > 0 ? nextRefreshAt : 0,
      failedAt: Number(source.failedAt || 0) || 0,
    };
  }

  function shouldRefreshFavoriteNavCountCache(entry, now) {
    var cache = normalizeFavoriteNavCountCacheEntry(entry, now);
    var currentTime = now === undefined ? Date.now() : Number(now);
    if (!cache) {
      var nextRefreshAt = Number(entry && entry.nextRefreshAt || 0);
      return !(isFinite(nextRefreshAt) && nextRefreshAt > currentTime);
    }
    if (cache.fresh) return false;
    return !(cache.nextRefreshAt > currentTime);
  }

  function loadFavoriteNavCountCache(favoriteUrl, now) {
    var key = getFavoriteNavCountCacheKey(favoriteUrl);
    if (!key) return null;
    return normalizeFavoriteNavCountCacheEntry(loadMap(FAVORITE_NAV_COUNT_CACHE_KEY)[key], now);
  }

  function saveFavoriteNavCountCache(favoriteUrl, count, now) {
    var key = getFavoriteNavCountCacheKey(favoriteUrl);
    var value = Number(count);
    if (!key || !isFinite(value) || value < 0) return;
    var data = loadMap(FAVORITE_NAV_COUNT_CACHE_KEY);
    data[key] = {
      count: Math.floor(value),
      updatedAt: now === undefined ? Date.now() : Number(now),
    };
    var keys = Object.keys(data).sort(function sortFavoriteCountCache(left, right) {
      return Number(data[right] && data[right].updatedAt || 0) - Number(data[left] && data[left].updatedAt || 0);
    });
    keys.slice(12).forEach(function pruneFavoriteCountCache(item) {
      delete data[item];
    });
    saveMap(FAVORITE_NAV_COUNT_CACHE_KEY, data);
  }

  function delayFavoriteNavCountCacheRefresh(favoriteUrl, now) {
    var key = getFavoriteNavCountCacheKey(favoriteUrl);
    if (!key) return;
    var currentTime = now === undefined ? Date.now() : Number(now);
    var data = loadMap(FAVORITE_NAV_COUNT_CACHE_KEY);
    var entry = data[key] || {};
    entry.failedAt = currentTime;
    entry.nextRefreshAt = currentTime + FAVORITE_NAV_COUNT_RETRY_TTL;
    data[key] = entry;
    saveMap(FAVORITE_NAV_COUNT_CACHE_KEY, data);
  }

  function inferFavoriteNavTags(title, meta) {
    var text = compactText([title, meta].join(' '));
    var tags = [];
    if (/资源|磁力|网盘|种子|下载|合集|ed2k|torrent|magnet/i.test(text)) tags.push('资源');
    if (/图片|图集|预览|写真|画廊|gallery/i.test(text)) tags.push('图片');
    if (/\bAI\b|人工智能|模型|ChatGPT|Claude|Gemini/i.test(text)) tags.push('AI');
    if (/阅读|长帖|续读|楼层/i.test(text)) tags.push('阅读');
    return parseTagList(tags.join('\n'));
  }

  function getFavoriteNavEntrySearchText(entry) {
    return compactText([
      entry && entry.title,
      entry && entry.author,
      entry && entry.meta,
      entry && entry.updateText,
      entry && entry.progressText,
      entry && entry.tagText,
      entry && entry.tags && entry.tags.join ? entry.tags.join(' ') : entry && entry.tags,
    ].join(' ')).toLowerCase();
  }

  function matchesFavoriteNavFilter(entry, filter) {
    var normalized = normalizeFavoriteNavFilter(filter);
    var text = getFavoriteNavEntrySearchText(entry);
    if (normalized === 'all') return true;
    if (normalized === 'updated') return !!(entry && entry.hasNewReplies);
    if (normalized === 'recent') return !entry || !entry.savedAt || Date.now() - entry.savedAt <= 14 * 24 * 60 * 60 * 1000;
    if (normalized === 'unread') return !entry || !entry.read || !!entry.hasNewReplies;
    if (normalized === 'resource') return /资源|磁力|网盘|种子|下载|合集|ed2k|torrent|magnet/i.test(text);
    if (normalized === 'image') return /图片|图集|预览|写真|画廊|gallery/i.test(text);
    if (normalized === 'ai') return /\bai\b|人工智能|模型|chatgpt|claude|gemini/i.test(text);
    return true;
  }

  function filterFavoriteNavEntries(entries, options) {
    var query = normalizeCenterSearchQuery(options && options.query);
    var filter = normalizeFavoriteNavFilter(options && options.filter);
    return (entries || []).filter(function matchFavoriteEntry(entry) {
      if (query && getFavoriteNavEntrySearchText(entry).indexOf(query) === -1) return false;
      return matchesFavoriteNavFilter(entry, filter);
    });
  }

  function sortFavoriteNavEntries(entries, sort) {
    var normalized = normalizeFavoriteNavSort(sort);
    return (entries || []).slice().sort(function sortFavoriteEntry(left, right) {
      if (normalized === 'updated') {
        return (Number(right.unreadReplies) || 0) - (Number(left.unreadReplies) || 0) ||
          (Number(right.updateCheckedAt) || 0) - (Number(left.updateCheckedAt) || 0) ||
          (Number(right.savedAt) || 0) - (Number(left.savedAt) || 0);
      }
      if (normalized === 'reply') return (Number(right.replies) || 0) - (Number(left.replies) || 0);
      if (normalized === 'read') return (Number(right.progressAt) || 0) - (Number(left.progressAt) || 0);
      return (Number(right.savedAt) || 0) - (Number(left.savedAt) || 0) || (Number(left.index) || 0) - (Number(right.index) || 0);
    });
  }

  function parseFavoriteReplyCount(text) {
    var count = parseThreadReplyCount(text);
    return count === null ? 0 : count;
  }

  function parseFavoriteSavedAt(text, now) {
    var value = String(text || '').replace(/\s+/g, ' ');
    var base = new Date(now || Date.now());
    var fullMatch = value.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})日?\s+(\d{1,2}):(\d{2})/);
    if (fullMatch) {
      return new Date(
        Number(fullMatch[1]),
        Number(fullMatch[2]) - 1,
        Number(fullMatch[3]),
        Number(fullMatch[4]),
        Number(fullMatch[5])
      ).getTime() || 0;
    }
    var shortMatch = value.match(/(?:收藏|时间|保存)?\s*(\d{1,2})[-/.月](\d{1,2})日?\s+(\d{1,2}):(\d{2})/);
    if (shortMatch) {
      return new Date(
        base.getFullYear(),
        Number(shortMatch[1]) - 1,
        Number(shortMatch[2]),
        Number(shortMatch[3]),
        Number(shortMatch[4])
      ).getTime() || 0;
    }
    var todayMatch = value.match(/今天\s*(\d{1,2}):(\d{2})/);
    if (todayMatch) {
      return new Date(base.getFullYear(), base.getMonth(), base.getDate(), Number(todayMatch[1]), Number(todayMatch[2])).getTime() || 0;
    }
    var yesterdayMatch = value.match(/昨天\s*(\d{1,2}):(\d{2})/);
    if (yesterdayMatch) {
      return new Date(base.getFullYear(), base.getMonth(), base.getDate() - 1, Number(yesterdayMatch[1]), Number(yesterdayMatch[2])).getTime() || 0;
    }
    var relativeMatch = value.match(/(\d+)\s*(分钟|小时|天)前/);
    if (relativeMatch) {
      var amount = Number(relativeMatch[1]) || 0;
      var unit = relativeMatch[2];
      var duration = unit === '分钟' ? amount * 60 * 1000 : (unit === '小时' ? amount * 60 * 60 * 1000 : amount * 24 * 60 * 60 * 1000);
      return Date.now() - duration;
    }
    return 0;
  }

  function normalizeFavoriteNavSeenMap(map) {
    var result = {};
    Object.keys(map || {}).forEach(function normalizeFavoriteSeenKey(key) {
      var time = Number(map[key]) || 0;
      if (key && time > 0) result[key] = time;
    });
    return result;
  }

  function applyFavoriteNavSeenTimes(entries, seenMap, now) {
    var map = normalizeFavoriteNavSeenMap(seenMap);
    var changed = false;
    var currentTime = now || Date.now();
    (entries || []).forEach(function applyFavoriteSeen(entry) {
      if (!entry || entry.source !== 'site' || !entry.id) return;
      if (entry.savedAt) {
        entry.savedAtLabel = '收藏';
        if (!map[entry.id] || entry.savedAt < map[entry.id]) {
          map[entry.id] = entry.savedAt;
          changed = true;
        }
        return;
      }
      if (!map[entry.id]) {
        map[entry.id] = currentTime;
        changed = true;
      }
      entry.savedAt = map[entry.id];
      entry.savedAtLabel = '记录';
    });
    return { map: map, changed: changed };
  }

  function createSiteFavoriteEntryFromLink(link, pageUrl, index, readMap, now) {
    if (!link) return null;
    var href = normalizeNavigationHref(link.getAttribute('href') || link.href, pageUrl || location.href);
    var id = parseThreadId(href) || href;
    var title = compactText(link.textContent || link.title || '');
    if (!href || !title || !/read\.php/i.test(href)) return null;
    var row = link.closest ? (link.closest('tr') || link.closest('.tr3') || link.parentNode) : link.parentNode;
    var rowText = compactText(row ? row.textContent : '');
    var authorLink = row ? qsa('a[href*="u.php"]', row).filter(function keepAuthorLink(candidate) {
      return candidate !== link && !/read\.php/i.test(candidate.getAttribute('href') || candidate.href || '');
    })[0] : null;
    var author = compactText(authorLink ? authorLink.textContent : '');
    var tags = inferFavoriteNavTags(title, rowText);
    var savedAt = parseFavoriteSavedAt(rowText, now);
    var deleteRequest = createSiteFavoriteDeleteRequest(row, pageUrl);
    return {
      source: 'site',
      id: String(id),
      title: title,
      url: href,
      author: author,
      meta: rowText,
      savedAt: savedAt,
      savedAtLabel: savedAt ? '收藏' : '',
      progressAt: 0,
      replies: parseFavoriteReplyCount(rowText),
      read: !!(readMap && readMap[id]),
      tags: tags,
      tagText: formatTags(tags),
      index: index,
      deleteRequest: deleteRequest,
    };
  }

  function parseFavoriteNavEntriesFromDocument(root, pageUrl, readMap, limit, seenMap, now) {
    var seen = {};
    var entries = [];
    var maxItems = Math.max(1, Number(limit) || FAVORITE_NAV_MAX_FETCHED_ITEMS);
    qsa('a[href*="read.php"]', root).some(function collectFavoriteLink(link) {
      var entry = createSiteFavoriteEntryFromLink(link, pageUrl, entries.length, readMap, now);
      if (!entry || seen[entry.url]) return false;
      seen[entry.url] = true;
      entries.push(entry);
      return entries.length >= maxItems;
    });
    return entries;
  }

  function getFavoriteNavWatchEntries(state, progressOverride) {
    var source = state || {};
    var watchMap = source.watch || source;
    var progressMap = source.watch || source.progress ? (source.progress || {}) : (progressOverride || {});
    var updateMap = source.threadUpdates || {};
    return getWatchCenterEntries(watchMap || {}, progressMap || {}).map(function mapWatchFavorite(entry, index) {
      var updateRecord = getThreadUpdateStatusForEntry(entry, updateMap);
      return {
        source: 'watch',
        id: entry.id,
        title: entry.title,
        url: entry.progressUrl || entry.url,
        author: '',
        meta: entry.progressText || '',
        savedAt: entry.savedAt,
        progressAt: entry.progressAt,
        progressText: entry.progressText,
        floorLabel: entry.floorLabel,
        nextFloorLabel: entry.nextFloorLabel,
        replies: updateRecord ? updateRecord.knownReplies : 0,
        read: !!entry.isCompleted,
        tags: entry.tags,
        tagText: entry.tagText,
        index: index,
      };
    });
  }

  function createFavoriteNavEntryFromThreadInfo(info, now) {
    if (!info) return null;
    var tid = parseThreadId(info.id);
    var url = info.titleLink && info.titleLink.href ? info.titleLink.href : getThreadPreviewUrl(info);
    var title = compactText(info.title || (info.titleLink && info.titleLink.textContent) || '');
    if (!tid || !url || !title) return null;
    var timestamp = now === undefined ? Date.now() : Number(now);
    var savedAt = isFinite(timestamp) ? timestamp : Date.now();
    var rowText = compactText([title, info.author].filter(Boolean).join(' '));
    var tags = inferFavoriteNavTags(title, rowText);
    var replies = normalizeThreadUpdateReplyCount(info.replies);
    if (replies === null) replies = parseFavoriteReplyCount(rowText) || 0;
    return {
      source: 'site',
      id: tid,
      title: title,
      url: url,
      author: info.author || '',
      meta: rowText,
      savedAt: savedAt,
      savedAtLabel: '收藏',
      progressAt: 0,
      replies: replies,
      read: false,
      tags: tags,
      tagText: formatTags(tags),
      index: 0,
    };
  }

  function createReadPageFavoriteInfo(tid, title, author, url) {
    var id = parseThreadId(tid);
    if (!id) return null;
    return {
      id: id,
      title: compactText(title) || '未命名帖子',
      author: compactText(author),
      url: String(url || location.href || '').split('#')[0],
    };
  }

  function bumpFavoriteNavTriggerCount(wrapper, panelState, state) {
    var countNode = qs('.spx-favorite-nav-count', wrapper);
    if (!countNode) return;
    var current = panelState && isFinite(Number(panelState.lastKnownCount))
      ? Number(panelState.lastKnownCount)
      : parseInt(countNode.textContent, 10);
    if (!isFinite(current)) current = Object.keys((state && state.watch) || {}).length;
    if (!isFinite(current)) return;
    var next = current + 1;
    if (panelState) {
      var watchCount = Object.keys((state && state.watch) || {}).length;
      var nextSiteCount = Math.max(0, next - watchCount);
      panelState.cachedSiteCount = nextSiteCount;
      panelState.cachedSiteCountUpdatedAt = Date.now();
      panelState.cachedSiteCountFresh = true;
      panelState.lastKnownCount = next;
      saveFavoriteNavCountCache(panelState.favoriteUrl, nextSiteCount, panelState.cachedSiteCountUpdatedAt);
    }
    countNode.textContent = formatFavoriteNavCount(next);
    countNode.title = '我的收藏已更新 ' + next + ' 条';
  }

  function syncFavoriteNavAfterSiteFavorite(info, settings, state, added) {
    if (!added) return;
    var entry = createFavoriteNavEntryFromThreadInfo(info, Date.now());
    if (!entry) return;
    if (state) {
      state.threadUpdates = state.threadUpdates || loadThreadUpdates();
      var updateResult = updateThreadReplyState(state.threadUpdates, entry, { source: 'site-favorite' }, Date.now());
      state.threadUpdates = updateResult.map;
      if (updateResult.changed) saveThreadUpdates(state.threadUpdates);
    }
    qsa('#spx-favorite-nav').forEach(function syncFavoriteWrapper(wrapper) {
      var panel = qs('.spx-favorite-nav-panel', wrapper);
      if (!panel) return;
      var panelState = ensureFavoriteNavState(panel, panel.dataset.favoriteUrl || wrapper.dataset.favoriteUrl);
      var siteEntries = panelState.siteEntries || [];
      var exists = siteEntries.some(function matchFavoriteEntry(item) {
        return String(item.id || '') === entry.id || (item.url && item.url === entry.url);
      });
      if (!exists) {
        panelState.siteEntries = [entry].concat(siteEntries).map(function reindexFavoriteEntry(item, index) {
          item.index = index;
          return item;
        });
        if (panelState.siteLoaded) {
          panelState.cachedSiteCount = panelState.siteEntries.length;
          panelState.cachedSiteCountUpdatedAt = Date.now();
          panelState.cachedSiteCountFresh = true;
          saveFavoriteNavCountCache(panelState.favoriteUrl, panelState.siteEntries.length, panelState.cachedSiteCountUpdatedAt);
        }
      }
      if (panelState.siteLoaded) {
        updateFavoriteNavTrigger(wrapper, panelState, state);
        if (!panel.hidden) renderFavoriteNavPanel(panel, settings, state, wrapper);
      } else {
        bumpFavoriteNavTriggerCount(wrapper, panelState, state);
      }
    });
  }

  function deleteSiteFavoriteEntry(entry, settings) {
    var request = entry && entry.deleteRequest;
    if (!request || !request.url) return Promise.reject(new Error('缺少删除入口'));
    var policy = {
      mode: 'action',
      label: '删除收藏',
      networkFriendly: isNetworkFriendlyMode(settings),
    };
    var options = {
      method: request.method || 'GET',
      credentials: 'include',
      cache: 'no-store',
    };
    if (request.method === 'POST') {
      options.body = request.body || '';
      options.headers = { 'Content-Type': request.contentType || 'application/x-www-form-urlencoded;charset=UTF-8' };
    }
    return requestWithPolicy(request.url, options, policy)
      .then(function readFavoriteDeleteResponse(response) {
        if (!response.ok) throw new Error('删除收藏失败');
        return readScriptResponseText(response, policy);
      })
      .then(function resolveFavoriteDeleteText(html) {
        var text = getSiteFavoriteDeleteResultText(html);
        if (text === '删除失败') throw new Error('删除收藏失败');
        return entry;
      });
  }

  function deleteSiteFavoriteEntries(entries, settings) {
    var result = { deleted: [], errors: [] };
    return (entries || []).reduce(function queueFavoriteDelete(promise, entry) {
      return promise.then(function deleteNextFavorite() {
        return deleteSiteFavoriteEntry(entry, settings).then(
          function markFavoriteDeleted(deletedEntry) {
            result.deleted.push(deletedEntry);
          },
          function markFavoriteDeleteFailed(error) {
            result.errors.push({ entry: entry, error: error });
          }
        );
      });
    }, Promise.resolve()).then(function returnFavoriteDeleteResult() {
      return result;
    });
  }

  function removeDeletedSiteFavoriteEntries(panelState, entries) {
    if (!panelState || !entries || !entries.length) return;
    var deleted = {};
    entries.forEach(function collectDeletedFavorite(entry) {
      deleted[getFavoriteNavDeleteKey(entry)] = true;
    });
    panelState.siteEntries = (panelState.siteEntries || []).filter(function keepSiteFavorite(entry) {
      return !deleted[getFavoriteNavDeleteKey(entry)];
    }).map(function reindexFavoriteEntry(entry, index) {
      entry.index = index;
      return entry;
    });
    panelState.cachedSiteCount = panelState.siteEntries.length;
    panelState.cachedSiteCountUpdatedAt = Date.now();
    panelState.cachedSiteCountFresh = true;
    saveFavoriteNavCountCache(panelState.favoriteUrl, panelState.siteEntries.length, panelState.cachedSiteCountUpdatedAt);
    panelState.lastKnownCount = null;
    var seenMap = loadMap(FAVORITE_NAV_SEEN_KEY);
    var changed = false;
    entries.forEach(function removeDeletedFavoriteSeen(entry) {
      if (entry && entry.id && seenMap[entry.id]) {
        delete seenMap[entry.id];
        changed = true;
      }
    });
    if (changed) saveMap(FAVORITE_NAV_SEEN_KEY, seenMap);
    if (panelState.selectedSiteFavorites) {
      entries.forEach(function removeDeletedFavoriteSelection(entry) {
        delete panelState.selectedSiteFavorites[getFavoriteNavDeleteKey(entry)];
      });
    }
  }

  function ensureFavoriteNavState(panel, favoriteUrl) {
    if (!panel.spxFavoriteNavState) {
      panel.spxFavoriteNavState = {
        source: 'site',
        query: '',
        filter: 'all',
        sort: 'recent',
        limit: FAVORITE_NAV_BATCH_SIZE,
        favoriteUrl: favoriteUrl || '',
        siteEntries: [],
        siteLoaded: false,
        siteLoading: false,
        siteError: '',
        lastKnownCount: null,
        cachedSiteCount: null,
        cachedSiteCountUpdatedAt: 0,
        cachedSiteCountFresh: false,
        updateChecking: false,
        updateStatus: '',
        updateCheckedAt: 0,
        selectedSiteFavorites: {},
      };
    }
    if (!panel.spxFavoriteNavState.selectedSiteFavorites) panel.spxFavoriteNavState.selectedSiteFavorites = {};
    if (favoriteUrl) panel.spxFavoriteNavState.favoriteUrl = favoriteUrl;
    return panel.spxFavoriteNavState;
  }

  function getFavoriteNavPanelEntries(panelState, state) {
    var siteEntries = decorateFavoriteNavEntriesWithProgress((panelState && panelState.siteEntries) || [], state && state.progress);
    var watchEntries = getFavoriteNavWatchEntries(state || {});
    return siteEntries.concat(watchEntries);
  }

  function syncFavoriteNavUpdateIndicator(wrapper, summary) {
    if (!wrapper) return;
    var trigger = qs('.spx-favorite-nav-trigger', wrapper);
    if (!trigger) return;
    var data = summary || {};
    var count = Math.max(0, Number(data.count) || 0);
    var updateCount = qs('.spx-favorite-nav-update-count', trigger);
    if (!updateCount) {
      updateCount = createEl('span', 'spx-favorite-nav-update-count');
      trigger.appendChild(updateCount);
    }
    updateCount.hidden = !count;
    updateCount.textContent = count ? ('新 ' + formatFavoriteNavCount(count, false)) : '';

    var note = qs('.spx-favorite-nav-update-note', wrapper);
    if (!note) {
      note = createEl('span', 'spx-favorite-nav-update-note');
      wrapper.appendChild(note);
    }
    note.hidden = !count;
    note.textContent = count ? '收藏有新回复' : '';
    if (count) note.title = '有 ' + count + ' 个收藏或稍后看主题出现新回复，共 ' + (Number(data.unreadReplies) || 0) + ' 条';
  }

  function updateFavoriteNavTrigger(wrapper, panelState, state) {
    var countNode = qs('.spx-favorite-nav-count', wrapper);
    if (!countNode) return;
    var siteCount = panelState && panelState.siteLoaded ? (panelState.siteEntries || []).length : 0;
    var cachedSiteCount = Number(panelState && panelState.cachedSiteCount);
    var hasCachedSiteCount = isFinite(cachedSiteCount) && cachedSiteCount >= 0;
    var watchCount = Object.keys((state && state.watch) || {}).length;
    var totalCount = siteCount + watchCount;
    var loading = !!(panelState && panelState.siteLoading);
    var hasSiteCount = !!(panelState && panelState.siteLoaded);
    var hasError = !!(panelState && panelState.siteError);
    var updateSummary = getFavoriteNavUpdateSummary(getFavoriteNavPanelEntries(panelState, state), state && state.threadUpdates);
    if (hasSiteCount) {
      countNode.textContent = formatFavoriteNavCount(totalCount, false);
      countNode.title = '我的收藏已读取 ' + totalCount + ' 条（站内 ' + siteCount + '，稍后看 ' + watchCount + '）';
      panelState.lastKnownCount = totalCount;
    } else if (hasCachedSiteCount) {
      var cachedTotal = cachedSiteCount + watchCount;
      countNode.textContent = formatFavoriteNavCount(cachedTotal, false);
      if (loading) {
        countNode.title = '显示短期缓存 ' + cachedTotal + ' 条（站内 ' + cachedSiteCount + '，稍后看 ' + watchCount + '），正在刷新站内收藏。';
      } else if (hasError) {
        countNode.title = '显示短期缓存 ' + cachedTotal + ' 条；站内收藏刷新失败：' + panelState.siteError;
      } else {
        countNode.title = '显示短期缓存 ' + cachedTotal + ' 条（站内 ' + cachedSiteCount + '，稍后看 ' + watchCount + '）。';
      }
      panelState.lastKnownCount = cachedTotal;
    } else if (hasError) {
      countNode.textContent = formatFavoriteNavCount(-1, false);
      countNode.title = '站内收藏读取失败：' + panelState.siteError;
    } else if (loading) {
      countNode.textContent = formatFavoriteNavCount(0, true);
      countNode.title = '正在读取站内收藏数量';
    } else {
      countNode.textContent = formatFavoriteNavCount(watchCount, false);
      countNode.title = '仅显示本地稍后看 ' + watchCount + ' 条；打开我的收藏面板后读取站内收藏。';
    }
    syncFavoriteNavUpdateIndicator(wrapper, updateSummary);
  }

  function refreshFavoriteNavPanels() {
    qsa('#spx-favorite-nav').forEach(function refreshFavoriteWrapper(wrapper) {
      var panel = qs('.spx-favorite-nav-panel', wrapper);
      var panelState = panel ? ensureFavoriteNavState(panel, panel.dataset.favoriteUrl || wrapper.dataset.favoriteUrl) : null;
      updateFavoriteNavTrigger(wrapper, panelState, {
        watch: loadMap(WATCH_KEY),
        progress: loadReadProgress(),
        threadUpdates: loadThreadUpdates(),
      });
      if (panel && !panel.hidden && typeof panel.spxRenderFavoriteNav === 'function') panel.spxRenderFavoriteNav();
    });
  }

  function createFavoriteNavAction(text, action, value, primary) {
    var button = createEl('button', primary ? 'spx-primary' : '', text);
    button.type = 'button';
    button.dataset.action = action;
    if (value !== undefined) button.dataset.value = String(value);
    if (/delete|remove|clear/.test(String(action || ''))) button.classList.add('spx-danger');
    return button;
  }

  function appendFavoriteNavEntry(list, entry, panelState) {
    var hasUpdate = !!(entry && entry.hasNewReplies);
    var item = createEl('div', 'spx-favorite-item' + (hasUpdate ? ' spx-favorite-has-update' : ''));
    item.dataset.source = entry.source || 'site';
    item.dataset.id = String(entry.id || '');
    var body = createEl('div');
    var bodyHead = createEl('div', entry.source === 'site' && entry.deleteRequest ? 'spx-favorite-body-head' : '');
    if (entry.source === 'site' && entry.deleteRequest) {
      var select = createEl('input', 'spx-favorite-select');
      select.type = 'checkbox';
      select.title = '选择后可批量删除';
      select.dataset.spxFavoriteSelect = '1';
      select.dataset.value = getFavoriteNavDeleteKey(entry);
      select.checked = !!(panelState && panelState.selectedSiteFavorites && panelState.selectedSiteFavorites[select.dataset.value]);
      bodyHead.appendChild(select);
    }
    if (hasUpdate) {
      var updateBadge = createEl('span', 'spx-favorite-update-badge', '新 +' + entry.unreadReplies);
      updateBadge.title = '已发现新回复，点击读新回复直达未读分页和楼层';
      bodyHead.appendChild(updateBadge);
    }
    var title = createEl('a', 'spx-favorite-item-title', entry.title || '未命名帖子');
    title.href = entry.url || '#';
    title.target = '_blank';
    title.rel = 'noreferrer';
    bodyHead.appendChild(title);
    body.appendChild(bodyHead);
    var metaParts = [];
    if (entry.author) metaParts.push(entry.author);
    if (entry.savedAt) metaParts.push((entry.savedAtLabel || '保存') + ' ' + formatShortTime(entry.savedAt));
    if (entry.progressText) metaParts.push('进度 ' + entry.progressText);
    if (entry.nextFloorLabel) metaParts.push('续读 ' + entry.nextFloorLabel);
    if (hasUpdate) metaParts.push('新回复 +' + entry.unreadReplies);
    if (hasUpdate && entry.knownReplies) metaParts.push('回复 ' + entry.readReplies + ' -> ' + entry.knownReplies);
    if (entry.replies) metaParts.push('回复 ' + entry.replies);
    if (entry.tagText) metaParts.push('标签 ' + entry.tagText);
    body.appendChild(createEl('div', 'spx-favorite-meta', metaParts.join(' · ') || (entry.source === 'site' ? '站内收藏' : '本地稍后看')));
    item.appendChild(body);
    var actions = createEl('div', 'spx-favorite-actions');
    if (hasUpdate) {
      actions.appendChild(createFavoriteNavAction('读新回复', 'read-favorite-update', entry.id, true));
    } else {
      var open = createEl('a', 'spx-primary', entry.source === 'watch' && entry.progressAt ? '续读' : '打开');
      open.href = entry.url || '#';
      open.target = '_blank';
      open.rel = 'noreferrer';
      actions.appendChild(open);
    }
    actions.appendChild(createFavoriteNavAction('复制', 'copy-favorite', entry.url || '', false));
    if (entry.source === 'site' && entry.deleteRequest) {
      actions.appendChild(createFavoriteNavAction('删除', 'delete-favorite-site', getFavoriteNavDeleteKey(entry), false));
    }
    if (entry.source === 'watch') actions.appendChild(createFavoriteNavAction('移除', 'remove-favorite-watch', entry.id, false));
    item.appendChild(actions);
    list.appendChild(item);
  }

  function renderFavoriteNavPanel(panel, settings, state, wrapper) {
    var panelState = ensureFavoriteNavState(panel, panel && panel.dataset.favoriteUrl);
    var updateMap = (state && state.threadUpdates) || {};
    var rawWatchEntries = getFavoriteNavWatchEntries(state);
    var rawSiteEntries = decorateFavoriteNavEntriesWithProgress(panelState.siteEntries || [], state && state.progress);
    var updateSummary = getFavoriteNavUpdateSummary(rawSiteEntries.concat(rawWatchEntries), updateMap);
    var watchEntries = decorateFavoriteNavEntriesWithUpdates(rawWatchEntries, updateMap);
    var siteEntries = decorateFavoriteNavEntriesWithUpdates(rawSiteEntries, updateMap);
    var cachedSiteCount = Number(panelState.cachedSiteCount);
    var hasCachedSiteCount = isFinite(cachedSiteCount) && cachedSiteCount >= 0;
    var displaySiteCount = panelState.siteLoaded ? siteEntries.length : hasCachedSiteCount ? cachedSiteCount : siteEntries.length;
    var source = normalizeFavoriteNavSource(panelState.source);
    var sourceEntries = source === 'watch' ? watchEntries : siteEntries;
    var filtered = sortFavoriteNavEntries(filterFavoriteNavEntries(sourceEntries, panelState), panelState.sort);
    var visible = filtered.slice(0, Math.max(1, Number(panelState.limit) || FAVORITE_NAV_BATCH_SIZE));
    var isFiltered = !!(panelState.query || normalizeFavoriteNavFilter(panelState.filter) !== 'all');
    var deletableVisible = source === 'site' ? visible.filter(function keepDeletableFavorite(entry) {
      return !!(entry && entry.deleteRequest);
    }) : [];
    var selectedEntries = getSelectedSiteFavoriteEntries(siteEntries, panelState.selectedSiteFavorites);
    var selectedVisibleCount = getSelectedSiteFavoriteEntries(visible, panelState.selectedSiteFavorites).length;
    var allVisibleSelected = !!(deletableVisible.length && selectedVisibleCount === deletableVisible.length);

    panel.textContent = '';

    var header = createEl('div', 'spx-favorite-head');
    var title = createEl('div', 'spx-favorite-title');
    title.appendChild(createEl('h3', '', '我的收藏'));
    title.appendChild(createEl('div', 'spx-favorite-summary', panelState.siteLoading ? '正在读取站内收藏页...' : (panelState.updateStatus || '新回复状态按缓存与手动检查合并，优先使用已打开页面')));
    header.appendChild(title);
    var headerButtons = createEl('div', 'spx-favorite-head-actions');
    var checkButton = createFavoriteNavAction(panelState.updateChecking ? '检查中' : '检查更新', 'check-favorite-updates', '', false);
    checkButton.disabled = !!panelState.updateChecking;
    checkButton.title = '刷新站内收藏页，并按优先级最多检查 10 条稍后看主题';
    headerButtons.appendChild(checkButton);
    var openLink = createEl('a', 'spx-favorite-open', '打开收藏页');
    openLink.href = panelState.favoriteUrl || '#';
    openLink.target = '_blank';
    openLink.rel = 'noreferrer';
    headerButtons.appendChild(openLink);
    header.appendChild(headerButtons);
    panel.appendChild(header);

    var stats = createEl('div', 'spx-favorite-stats');
    [
      ['站内收藏', panelState.siteLoading && !hasCachedSiteCount ? '...' : displaySiteCount],
      ['本次显示', visible.length + ' / ' + filtered.length],
      ['稍后看', watchEntries.length],
      ['有新回复', panelState.updateChecking ? '...' : updateSummary.count],
    ].forEach(function appendStat(item) {
      var stat = createEl('div', 'spx-favorite-stat');
      stat.appendChild(createEl('strong', '', String(item[1])));
      stat.appendChild(createEl('span', '', item[0]));
      stats.appendChild(stat);
    });
    panel.appendChild(stats);

    var query = createEl('input', 'spx-favorite-search');
    query.type = 'search';
    query.placeholder = '筛选收藏标题、作者或标签';
    query.value = panelState.query || '';
    query.dataset.spxFavoriteQuery = '1';
    panel.appendChild(query);

    var tabs = createEl('div', 'spx-favorite-tabs');
    [
      { value: 'site', label: '站内收藏 ' + (panelState.siteLoading && !hasCachedSiteCount ? '...' : displaySiteCount) },
      { value: 'watch', label: '稍后看 ' + watchEntries.length },
    ].forEach(function appendTab(tab) {
      var button = createFavoriteNavAction(tab.label, 'favorite-source', tab.value, false);
      button.className = 'spx-favorite-tab' + (source === tab.value ? ' spx-active' : '');
      tabs.appendChild(button);
    });
    panel.appendChild(tabs);

    var tools = createEl('div', 'spx-favorite-tools');
    var chips = createEl('div', 'spx-favorite-chips');
    [
      { value: 'all', label: '全部' },
      { value: 'recent', label: '最近' },
      { value: 'updated', label: '有新回复 ' + updateSummary.count },
      { value: 'unread', label: '未读' },
      { value: 'resource', label: '资源' },
      { value: 'image', label: '图片' },
      { value: 'ai', label: 'AI' },
    ].forEach(function appendChip(chip) {
      var button = createFavoriteNavAction(chip.label, 'favorite-filter', chip.value, false);
      button.className = 'spx-favorite-chip' + (chip.value === 'updated' ? ' spx-favorite-chip-update' : '') + (normalizeFavoriteNavFilter(panelState.filter) === chip.value ? ' spx-active' : '');
      chips.appendChild(button);
    });
    tools.appendChild(chips);
    var sort = createEl('select', 'spx-favorite-sort');
    sort.dataset.spxFavoriteSort = '1';
    [
      { value: 'recent', label: '最近收藏' },
      { value: 'read', label: '最近阅读' },
      { value: 'updated', label: '新回复优先' },
      { value: 'reply', label: '回复最多' },
    ].forEach(function appendSortOption(item) {
      var option = createEl('option');
      option.value = item.value;
      option.textContent = item.label;
      option.selected = normalizeFavoriteNavSort(panelState.sort) === item.value;
      sort.appendChild(option);
    });
    tools.appendChild(sort);
    panel.appendChild(tools);

    var list = createEl('div', 'spx-favorite-list');
    if (source === 'site' && panelState.siteLoading) {
      list.appendChild(createEl('div', 'spx-favorite-empty', '正在读取站内收藏页...'));
    } else if (source === 'site' && panelState.siteError) {
      list.appendChild(createEl('div', 'spx-favorite-empty', panelState.siteError + '，可先打开收藏页查看。'));
    } else if (!sourceEntries.length) {
      list.appendChild(createEl('div', 'spx-favorite-empty', source === 'site' ? '暂无可展示的站内收藏。' : '还没有本地稍后看。'));
    } else if (!visible.length) {
      list.appendChild(createEl('div', 'spx-favorite-empty', '没有匹配的收藏。'));
    } else {
      var group = createEl('div', 'spx-favorite-group');
      var groupMain = createEl('div', 'spx-favorite-group-main');
      groupMain.appendChild(createEl('span', '', source === 'site' ? '站内收藏' : '本地稍后看'));
      groupMain.appendChild(createEl('span', '', (isFiltered ? filtered.length + ' / ' : '') + sourceEntries.length + ' 条'));
      group.appendChild(groupMain);
      var groupActions = createEl('div', 'spx-favorite-group-actions');
      if (source === 'site' && deletableVisible.length) {
        groupActions.appendChild(createFavoriteNavAction(allVisibleSelected ? '取消本页' : '全选本页', 'toggle-visible-favorite-site', allVisibleSelected ? 'off' : 'on', false));
      }
      if (source === 'site' && selectedEntries.length) {
        groupActions.appendChild(createEl('span', 'spx-favorite-selected-count', '已选 ' + selectedEntries.length));
        groupActions.appendChild(createFavoriteNavAction('删除所选', 'delete-selected-favorite-site', '', false));
      }
      group.appendChild(groupActions);
      list.appendChild(group);
      visible.forEach(function appendVisibleEntry(entry) {
        appendFavoriteNavEntry(list, entry, panelState);
      });
      if (filtered.length > visible.length) {
        var load = createEl('div', 'spx-favorite-load');
        load.appendChild(createEl('span', '', '已显示 ' + visible.length + ' 条，继续加载下一批。'));
        load.appendChild(createFavoriteNavAction('加载更多', 'favorite-load-more'));
        list.appendChild(load);
      }
    }
    panel.appendChild(list);
    updateFavoriteNavTrigger(wrapper, panelState, state);
  }

  function loadFavoriteNavSiteEntries(panel, settings, state, wrapper, force) {
    var panelState = ensureFavoriteNavState(panel, panel && panel.dataset.favoriteUrl);
    if ((!force && panelState.siteLoaded) || panelState.siteLoading || !panelState.favoriteUrl) return Promise.resolve(panelState);
    if (typeof DOMParser === 'undefined') return Promise.resolve(panelState);
    panelState.siteLoading = true;
    panelState.siteError = '';
    renderFavoriteNavPanel(panel, settings, state, wrapper);
    var policy = {
      mode: 'interactive',
      label: '我的收藏',
      networkFriendly: isNetworkFriendlyMode(settings),
    };
    return requestWithPolicy(panelState.favoriteUrl, { credentials: 'include', cache: 'no-store' }, policy)
      .then(function readFavoriteResponse(response) {
        if (!response.ok) throw new Error('读取收藏页失败');
        return readScriptResponseText(response, policy);
      })
      .then(function parseFavoriteHtml(html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var seenMap = loadMap(FAVORITE_NAV_SEEN_KEY);
        var checkedAt = Date.now();
        panelState.siteEntries = parseFavoriteNavEntriesFromDocument(
          doc,
          panelState.favoriteUrl,
          state && state.read,
          FAVORITE_NAV_MAX_FETCHED_ITEMS,
          seenMap,
          checkedAt
        );
        var updateResult = applyThreadUpdateEntries((state && state.threadUpdates) || {}, panelState.siteEntries, { source: 'favorite-page' }, checkedAt);
        if (state) state.threadUpdates = updateResult.map;
        if (updateResult.changed) saveThreadUpdates(updateResult.map);
        var seenResult = applyFavoriteNavSeenTimes(panelState.siteEntries, seenMap, checkedAt);
        if (seenResult.changed) saveMap(FAVORITE_NAV_SEEN_KEY, seenResult.map);
        panelState.cachedSiteCount = panelState.siteEntries.length;
        panelState.cachedSiteCountUpdatedAt = checkedAt;
        panelState.cachedSiteCountFresh = true;
        saveFavoriteNavCountCache(panelState.favoriteUrl, panelState.siteEntries.length, panelState.cachedSiteCountUpdatedAt);
        panelState.siteLoaded = true;
        panelState.updateCheckedAt = checkedAt;
      })
      .catch(function handleFavoriteLoadError(error) {
        panelState.siteError = error && error.message ? error.message : '读取收藏页失败';
        delayFavoriteNavCountCacheRefresh(panelState.favoriteUrl);
      })
      .then(function finishFavoriteLoad() {
        panelState.siteLoading = false;
        if (panel && !panel.hidden) renderFavoriteNavPanel(panel, settings, state, wrapper);
        else updateFavoriteNavTrigger(wrapper, panelState, state);
        return panelState;
      });
  }

  function getFavoriteNavWatchUpdateCandidates(state, now, manual) {
    var updateMap = (state && state.threadUpdates) || {};
    return getFavoriteNavWatchEntries(state || {})
      .filter(function keepWatchUpdateCandidate(entry) {
        return shouldCheckThreadUpdate(entry, updateMap[entry.id], now, manual);
      })
      .sort(function sortWatchUpdateCandidate(left, right) {
        var leftRecord = getThreadUpdateStatusForEntry(left, updateMap) || {};
        var rightRecord = getThreadUpdateStatusForEntry(right, updateMap) || {};
        if (!!rightRecord.hasNewReplies !== !!leftRecord.hasNewReplies) return rightRecord.hasNewReplies ? 1 : -1;
        var leftActivity = getThreadUpdateActivityAt(left, leftRecord);
        var rightActivity = getThreadUpdateActivityAt(right, rightRecord);
        if (rightActivity !== leftActivity) return rightActivity - leftActivity;
        return (Number(leftRecord.lastCheckedAt) || 0) - (Number(rightRecord.lastCheckedAt) || 0);
      });
  }

  function checkFavoriteNavWatchUpdates(settings, state, manual) {
    var currentTime = Date.now();
    var candidates = getFavoriteNavWatchUpdateCandidates(state || {}, currentTime, manual);
    var selected = candidates.slice(0, THREAD_UPDATE_CHECK_BATCH_SIZE);
    var result = { checked: 0, total: candidates.length, changed: false, errors: 0 };
    if (!selected.length || typeof DOMParser === 'undefined') return Promise.resolve(result);
    state.threadUpdates = state.threadUpdates || loadThreadUpdates();
    return selected.reduce(function queueWatchUpdateCheck(promise, entry) {
      return promise.then(function checkOneWatchEntry() {
        var targetUrl = buildThreadLatestReadUrl(entry.id, entry.url || entry.progressUrl);
        var policy = {
          mode: 'interactive',
          label: '稍后看更新检查',
          networkFriendly: isNetworkFriendlyMode(settings),
          cooldownMs: THREAD_UPDATE_RATE_LIMIT_COOLDOWN,
        };
        return requestWithPolicy(targetUrl, { credentials: 'include', cache: 'no-store' }, policy)
          .then(function readWatchUpdateResponse(response) {
            if (!response.ok) throw new Error('检查失败');
            return readScriptResponseText(response, policy);
          })
          .then(function parseWatchUpdateHtml(html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var replies = parseThreadReadReplyCountFromDocument(doc, targetUrl);
            var updateResult = updateThreadReplyState(state.threadUpdates, Object.assign({}, entry, {
              replies: replies,
              url: entry.url || targetUrl,
            }), { source: 'watch-manual-check' }, Date.now());
            state.threadUpdates = updateResult.map;
            if (updateResult.changed) result.changed = true;
            result.checked += 1;
          })
          .catch(function keepCheckingAfterWatchUpdateError(error) {
            if (error && error.spxRateLimited) throw error;
            result.errors += 1;
          });
      });
    }, Promise.resolve()).then(function finishWatchUpdateCheck() {
      if (result.changed) saveThreadUpdates(state.threadUpdates);
      return result;
    });
  }

  function checkFavoriteNavUpdates(panel, settings, state, wrapper) {
    var panelState = ensureFavoriteNavState(panel, panel && panel.dataset.favoriteUrl);
    if (panelState.updateChecking) return;
    panelState.updateChecking = true;
    panelState.updateStatus = '正在检查新回复，站内收藏优先走批量页，稍后看最多抽查 ' + THREAD_UPDATE_CHECK_BATCH_SIZE + ' 条';
    renderFavoriteNavPanel(panel, settings, state, wrapper);
    loadFavoriteNavSiteEntries(panel, settings, state, wrapper, true)
      .then(function checkWatchEntriesAfterSiteFavorites() {
        return checkFavoriteNavWatchUpdates(settings, state, true);
      })
      .then(function finishFavoriteUpdateCheck(result) {
        var summary = getFavoriteNavUpdateSummary(getFavoriteNavPanelEntries(panelState, state), state && state.threadUpdates);
        panelState.updateChecking = false;
        panelState.updateCheckedAt = Date.now();
        panelState.updateStatus = '已检查站内收藏和 ' + result.checked + '/' + result.total + ' 条稍后看；有新回复 ' + summary.count + ' 个';
        renderFavoriteNavPanel(panel, settings, state, wrapper);
        refreshFavoriteNavPanels();
      }, function failFavoriteUpdateCheck(error) {
        panelState.updateChecking = false;
        panelState.updateStatus = error && error.message ? error.message : '检查新回复失败';
        renderFavoriteNavPanel(panel, settings, state, wrapper);
      });
  }

  function findFavoriteNavEntryForUpdate(panelState, state, id) {
    var updateMap = (state && state.threadUpdates) || {};
    var entries = decorateFavoriteNavEntriesWithUpdates(getFavoriteNavPanelEntries(panelState, state), updateMap);
    return entries.filter(function matchFavoriteUpdateEntry(entry) {
      return String(entry.id || '') === String(id || '');
    })[0] || null;
  }

  function openFavoriteUpdateEntry(state, entry) {
    if (!entry || !entry.id) return;
    var firstUnreadReply = getFavoriteNavFirstUnreadReply(entry);
    var targetUrl = getFavoriteNavUnreadUrl(entry) || entry.url || entry.progressUrl;
    if (firstUnreadReply) {
      requestReadProgressRestore(entry.id, 'next', { reply: firstUnreadReply });
      if (targetUrl) location.href = targetUrl;
      return;
    }
    if (entry.progressAt && entry.progressUrl) {
      openProgressEntry(state, entry.id, targetUrl, 'next');
      return;
    }
    requestReadProgressRestore(entry.id, 'next');
    if (targetUrl) location.href = targetUrl;
  }

  function closeFavoriteNavPanel(wrapper) {
    var panel = qs('.spx-favorite-nav-panel', wrapper);
    var trigger = qs('.spx-favorite-nav-trigger', wrapper);
    if (panel) panel.hidden = true;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function setFavoriteNavPanelHidden(wrapper, hidden, settings, state) {
    var panel = qs('.spx-favorite-nav-panel', wrapper);
    var trigger = qs('.spx-favorite-nav-trigger', wrapper);
    if (!panel || !trigger) return;
    panel.hidden = !!hidden;
    trigger.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) {
      renderFavoriteNavPanel(panel, settings, state, wrapper);
      loadFavoriteNavSiteEntries(panel, settings, state, wrapper);
      var input = qs('.spx-favorite-search', panel);
      if (input && typeof input.focus === 'function') input.focus();
    }
  }

  function getFavoriteNavMountHost(scope) {
    return qs('#mainNav>div[style*="padding-left"]', scope) || qs('#mainNav', scope);
  }

  function enhanceFavoriteNavigation(settings, state, root) {
    var scope = root || document;
    var host = getFavoriteNavMountHost(scope);
    if (!host) return;
    var uid = extractAccountUserId(scope, location.href);
    var favoriteUrl = getFavoriteNavUrl(uid, location.origin);
    if (!favoriteUrl) return;

    var wrapper = qs('#spx-favorite-nav', host) || createEl('div', 'spx-favorite-nav');
    wrapper.id = 'spx-favorite-nav';
    wrapper.dataset.favoriteUrl = favoriteUrl;
    var panel = qs('.spx-favorite-nav-panel', wrapper);

    if (!panel) {
      var trigger = createEl('button', 'spx-favorite-nav-trigger');
      trigger.type = 'button';
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', 'spx-favorite-nav-panel');
      trigger.title = '打开我的收藏';
      trigger.appendChild(createEl('span', 'spx-favorite-nav-star', '★'));
      trigger.appendChild(createEl('span', '', '我的收藏'));
      trigger.appendChild(createEl('span', 'spx-favorite-nav-count', formatFavoriteNavCount(Object.keys((state && state.watch) || {}).length, false)));
      wrapper.appendChild(trigger);

      panel = createEl('section', 'spx-favorite-nav-panel');
      panel.id = 'spx-favorite-nav-panel';
      panel.hidden = true;
      panel.dataset.favoriteUrl = favoriteUrl;
      wrapper.appendChild(panel);

      trigger.addEventListener('click', function toggleFavoriteNav(event) {
        event.preventDefault();
        event.stopPropagation();
        setFavoriteNavPanelHidden(wrapper, !panel.hidden, settings, state);
      });
      panel.addEventListener('click', function stopFavoritePanelClick(event) {
        event.stopPropagation();
      });
      panel.addEventListener('input', function handleFavoriteInput(event) {
        var target = event.target;
        if (!target || !target.dataset || target.dataset.spxFavoriteQuery !== '1') return;
        var panelState = ensureFavoriteNavState(panel, favoriteUrl);
        panelState.query = target.value;
        panelState.limit = FAVORITE_NAV_BATCH_SIZE;
        renderFavoriteNavPanel(panel, settings, state, wrapper);
        var nextInput = qs('.spx-favorite-search', panel);
        if (nextInput) nextInput.focus();
      });
      panel.addEventListener('change', function handleFavoriteChange(event) {
        var target = event.target;
        var panelState = ensureFavoriteNavState(panel, favoriteUrl);
        if (!target || !target.dataset) return;
        if (target.dataset.spxFavoriteSelect === '1') {
          var selectionKey = target.dataset.value;
          if (!selectionKey) return;
          if (target.checked) panelState.selectedSiteFavorites[selectionKey] = true;
          else delete panelState.selectedSiteFavorites[selectionKey];
          renderFavoriteNavPanel(panel, settings, state, wrapper);
          return;
        }
        if (target.dataset.spxFavoriteSort !== '1') return;
        panelState.sort = normalizeFavoriteNavSort(target.value);
        panelState.limit = FAVORITE_NAV_BATCH_SIZE;
        renderFavoriteNavPanel(panel, settings, state, wrapper);
      });
      panel.addEventListener('click', function handleFavoriteAction(event) {
        var target = event.target;
        var action = target && target.dataset && target.dataset.action;
        if (!action) return;
        var panelState = ensureFavoriteNavState(panel, favoriteUrl);
        if (action === 'favorite-source') {
          panelState.source = normalizeFavoriteNavSource(target.dataset.value);
          panelState.limit = FAVORITE_NAV_BATCH_SIZE;
          renderFavoriteNavPanel(panel, settings, state, wrapper);
          return;
        }
        if (action === 'favorite-filter') {
          panelState.filter = normalizeFavoriteNavFilter(target.dataset.value);
          panelState.limit = FAVORITE_NAV_BATCH_SIZE;
          renderFavoriteNavPanel(panel, settings, state, wrapper);
          return;
        }
        if (action === 'favorite-load-more') {
          panelState.limit += FAVORITE_NAV_BATCH_SIZE;
          renderFavoriteNavPanel(panel, settings, state, wrapper);
          return;
        }
        if (action === 'check-favorite-updates') {
          checkFavoriteNavUpdates(panel, settings, state, wrapper);
          return;
        }
        if (action === 'read-favorite-update') {
          openFavoriteUpdateEntry(state, findFavoriteNavEntryForUpdate(panelState, state, target.dataset.value));
          return;
        }
        if (action === 'copy-favorite') {
          copyTextToClipboard(target.dataset.value).then(
            function showFavoriteCopySuccess() { setTemporaryText(target, '已复制', '复制'); },
            function showFavoriteCopyFailure() { setTemporaryText(target, '失败', '复制'); }
          );
          return;
        }
        if (action === 'toggle-visible-favorite-site') {
          var shouldSelectVisible = target.dataset.value !== 'off';
          var decoratedSiteEntries = decorateFavoriteNavEntriesWithUpdates(panelState.siteEntries || [], state && state.threadUpdates);
          var visibleForSelection = sortFavoriteNavEntries(
            filterFavoriteNavEntries(decoratedSiteEntries, panelState),
            panelState.sort
          ).slice(0, Math.max(1, Number(panelState.limit) || FAVORITE_NAV_BATCH_SIZE));
          visibleForSelection.forEach(function toggleVisibleFavoriteSelection(entry) {
            if (!entry || !entry.deleteRequest) return;
            var key = getFavoriteNavDeleteKey(entry);
            if (shouldSelectVisible) panelState.selectedSiteFavorites[key] = true;
            else delete panelState.selectedSiteFavorites[key];
          });
          renderFavoriteNavPanel(panel, settings, state, wrapper);
          return;
        }
        if (action === 'delete-favorite-site' || action === 'delete-selected-favorite-site') {
          var entriesToDelete;
          if (action === 'delete-selected-favorite-site') {
            entriesToDelete = getSelectedSiteFavoriteEntries(panelState.siteEntries || [], panelState.selectedSiteFavorites);
          } else {
            entriesToDelete = (panelState.siteEntries || []).filter(function matchSiteFavorite(entry) {
              return getFavoriteNavDeleteKey(entry) === target.dataset.value;
            });
          }
          entriesToDelete = (entriesToDelete || []).filter(function keepDeletableSiteFavorite(entry) {
            return !!(entry && entry.deleteRequest);
          });
          if (!entriesToDelete.length) return;
          var confirmText = entriesToDelete.length > 1
            ? '确定删除选中的 ' + entriesToDelete.length + ' 条站内收藏？此操作会同步到原站收藏夹。'
            : '删除这个站内收藏？此操作会同步到原站收藏夹。';
          confirmBatchAction({
            title: entriesToDelete.length > 1 ? '删除所选站内收藏' : '删除站内收藏',
            message: '此操作会同步到原站收藏夹，不只是本地隐藏。',
            confirmText: '删除收藏',
            impacts: [{ label: '站内收藏', value: entriesToDelete.length, note: '同步原站' }],
            items: entriesToDelete.map(function mapFavoriteConfirmItem(entry) {
              return { title: entry.title, meta: [entry.author, entry.url].filter(Boolean).join(' · ') };
            }),
          }, confirmText).then(function deleteFavoriteAfterConfirm(ok) {
            if (!ok) return;
            var originalText = target.textContent || '删除';
            target.disabled = true;
            target.textContent = '删除中';
            deleteSiteFavoriteEntries(entriesToDelete, settings).then(function handleFavoriteDeleteResult(result) {
              if (result.deleted.length) {
                removeDeletedSiteFavoriteEntries(panelState, result.deleted);
                updateFavoriteNavTrigger(wrapper, panelState, state);
                renderFavoriteNavPanel(panel, settings, state, wrapper);
              }
              if (result.errors.length && !result.deleted.length) {
                target.disabled = false;
                setTemporaryText(target, '删除失败', originalText);
                return;
              }
              if (result.errors.length && typeof window.alert === 'function') {
                window.alert('部分收藏删除失败：' + result.errors.length + ' 条');
              }
            });
          });
          return;
        }
        if (action === 'remove-favorite-watch') {
          var id = target.dataset.value;
          if (!id || !state || !state.watch) return;
          delete state.watch[id];
          saveMap(WATCH_KEY, state.watch);
          refreshWatchCenter();
          renderFavoriteNavPanel(panel, settings, state, wrapper);
          refreshFavoriteNavPanels();
        }
      });
      document.addEventListener('click', function closeFavoriteNavOnOutside(event) {
        if (!wrapper.contains(event.target)) closeFavoriteNavPanel(wrapper);
      });
      document.addEventListener('keydown', function closeFavoriteNavOnEscape(event) {
        if (event.key === 'Escape') closeFavoriteNavPanel(wrapper);
      });
    } else {
      panel.dataset.favoriteUrl = favoriteUrl;
    }

    if (!wrapper.parentNode) host.appendChild(wrapper);
    var panelState = ensureFavoriteNavState(panel, favoriteUrl);
    panel.spxRenderFavoriteNav = function renderCurrentFavoriteNavPanel() {
      if (state) {
        state.read = loadMap(READ_KEY);
        state.watch = loadMap(WATCH_KEY);
        state.progress = loadReadProgress();
        state.threadUpdates = loadThreadUpdates();
      }
      renderFavoriteNavPanel(panel, settings, state, wrapper);
    };
    var countCacheKey = getFavoriteNavCountCacheKey(favoriteUrl);
    var countCacheSource = countCacheKey ? loadMap(FAVORITE_NAV_COUNT_CACHE_KEY)[countCacheKey] : null;
    var countCache = loadFavoriteNavCountCache(favoriteUrl);
    if (countCache) {
      panelState.cachedSiteCount = countCache.count;
      panelState.cachedSiteCountUpdatedAt = countCache.updatedAt;
      panelState.cachedSiteCountFresh = countCache.fresh;
    }
    updateFavoriteNavTrigger(wrapper, panel.spxFavoriteNavState, state);
    flushFavoriteNavStatusNotes();
    if (shouldRefreshFavoriteNavCountCache(countCacheSource)) {
      loadFavoriteNavSiteEntries(panel, settings, state, wrapper);
    }
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
      replies: extractThreadReplyCountFromRow(row),
    };
  }

  function extractThreadReplyCountFromRow(row) {
    if (!row) return null;
    var cells = qsa('td', row);
    for (var index = 0; index < cells.length; index += 1) {
      var cell = cells[index];
      var text = compactText(cell && cell.textContent);
      if (!text) continue;
      var withSlash = text.match(/^(\d{1,6})\s*\/\s*\d{1,7}$/);
      if (withSlash) return normalizeThreadUpdateReplyCount(withSlash[1]);
      var labeled = parseThreadReplyCount(text);
      if (labeled !== null) return labeled;
      var byTitle = parseThreadReplyCount(cell && cell.getAttribute ? cell.getAttribute('title') : '');
      if (byTitle !== null) return byTitle;
    }
    var joined = cells.map(function mapThreadReplyCell(cell) {
      return compactText(cell && cell.textContent);
    }).filter(Boolean).join(' ');
    var rowText = joined || compactText(row.textContent || '');
    var labeled = parseThreadReplyCount(rowText);
    if (labeled !== null) return labeled;
    return null;
  }

  function extractForumGalleryCardInfo(card) {
    var inner = qs('.inner', card) || card;
    var titleLink = qs('.section-title a[href*="read.php?tid"]', inner) || qs('a[href*="read.php?tid"]', inner);
    var id = parseThreadId(titleLink ? (titleLink.getAttribute('href') || titleLink.href) : '');
    var authorLink = qs('.section-intro a.bl[href*="u.php"]', inner) || qs('.section-intro a[href*="u.php"]', inner);
    return {
      id: id,
      cell: inner,
      row: card,
      titleLink: titleLink,
      title: titleLink ? titleLink.textContent.trim() : inner.textContent.trim(),
      author: authorLink ? authorLink.textContent.trim() : '',
      replies: extractThreadReplyCountFromRow(card),
    };
  }

  function syncThreadUpdateEntries(state, entries, source) {
    if (!state || !entries || !entries.length) return false;
    state.threadUpdates = state.threadUpdates || loadThreadUpdates();
    var favoriteSeen = loadMap(FAVORITE_NAV_SEEN_KEY);
    var watchMap = state.watch || {};
    var trackedEntries = entries.filter(function keepTrackedThreadUpdateEntry(entry) {
      var id = parseThreadId(entry && entry.id);
      return !!(id && (watchMap[id] || favoriteSeen[id] || state.threadUpdates[id]));
    });
    if (!trackedEntries.length) return false;
    var result = applyThreadUpdateEntries(state.threadUpdates, trackedEntries, { source: source || 'forum-list' }, Date.now());
    state.threadUpdates = result.map;
    if (result.changed) {
      saveThreadUpdates(state.threadUpdates);
      refreshFavoriteNavPanels();
    }
    return result.changed;
  }

  function renderThreadUpdateBadge(info, state) {
    if (!info || !info.cell || !info.titleLink) return;
    var previous = qs('.spx-thread-update-badge', info.cell);
    if (previous) previous.remove();
    var id = parseThreadId(info.id);
    if (!id) return;
    var favoriteSeen = loadMap(FAVORITE_NAV_SEEN_KEY);
    if (!((state && state.watch && state.watch[id]) || favoriteSeen[id])) return;
    var entry = decorateFavoriteNavEntryWithUpdate(info, state && state.threadUpdates);
    if (!entry.hasNewReplies) return;
    var badge = createEl('span', 'spx-thread-update-badge', '新 +' + entry.unreadReplies);
    badge.title = '收藏或稍后看主题有新回复，打开我的收藏可直达未读';
    info.titleLink.insertAdjacentElement('beforebegin', badge);
  }

  function dispatchResourceBadgeFilter(type) {
    if (!type || typeof document === 'undefined') return;
    var detail = { type: type };
    try {
      document.dispatchEvent(new CustomEvent('spx-resource-filter', { detail: detail }));
    } catch (error) {
      var event = document.createEvent && document.createEvent('CustomEvent');
      if (!event) return;
      event.initCustomEvent('spx-resource-filter', true, false, detail);
      document.dispatchEvent(event);
    }
  }

  function renderThreadResourceBadges(info, badges) {
    if (!info || !info.cell || !info.titleLink) return;
    var previous = qs('.spx-resource-badges', info.cell);
    if (previous) previous.remove();
    var list = mergeResourceBadges(badges || []);
    info.resourceBadges = list;
    info.resourceBadgeTypes = getResourceBadgeTypes(list);
    if (info.row && info.row.dataset) info.row.dataset.spxResourceTypes = info.resourceBadgeTypes.join(' ');
    if (!list.length) return;

    var wrap = createEl('span', 'spx-resource-badges');
    wrap.setAttribute('aria-label', '资源类型角标');
    list.forEach(function appendResourceBadge(badge) {
      var button = createEl('button', 'spx-resource-badge spx-resource-badge-' + badge.type + (badge.guessed ? ' spx-resource-badge-guess' : ''), badge.label);
      button.type = 'button';
      button.dataset.spxResourceType = badge.type;
      button.title = (badge.guessed ? '标题关键词推测：' : '已识别资源：') + badge.label + '，点击筛选同类主题';
      button.addEventListener('click', function filterByResourceBadge(event) {
        event.preventDefault();
        event.stopPropagation();
        dispatchResourceBadgeFilter(badge.type);
      });
      wrap.appendChild(button);
    });

    var anchor = qs('.spx-thread-tools', info.cell) || qs('.spx-watch-badge', info.cell) || info.titleLink;
    anchor.insertAdjacentElement('afterend', wrap);
  }

  function updateThreadResourceBadges(info, state, previewPayload) {
    if (!info) return;
    var badges = getThreadResourceBadges(info, getThreadResourceBadgeIndex(state && state.resources), previewPayload);
    renderThreadResourceBadges(info, badges);
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

  function createWatchBadge(id) {
    var badge = createEl('span', 'spx-watch-badge', '★');
    badge.dataset.spxWatchId = String(id || '');
    return badge;
  }

  function syncThreadWatchState(info, state, button) {
    if (!info || !info.id || !info.cell || !info.titleLink) return;
    var watch = (state && state.watch) || {};
    var saved = !!watch[info.id];
    if (button) button.textContent = saved ? '已存' : '稍后';
    var badge = qs('.spx-watch-badge', info.cell);
    if (saved && !badge) {
      info.titleLink.insertAdjacentElement('afterend', createWatchBadge(info.id));
    }
    if (!saved && badge) badge.remove();
  }

  function toggleThreadWatch(info, state, button) {
    if (!info || !info.id || !info.titleLink) return;
    state.watch = state.watch || {};
    if (state.watch[info.id]) {
      delete state.watch[info.id];
    } else {
      state.watch[info.id] = {
        title: info.title,
        url: info.titleLink.href,
        savedAt: Date.now(),
      };
      state.threadUpdates = state.threadUpdates || loadThreadUpdates();
      var updateResult = updateThreadReplyState(state.threadUpdates, info, { source: 'watch' }, Date.now());
      state.threadUpdates = updateResult.map;
      if (updateResult.changed) saveThreadUpdates(state.threadUpdates);
    }
    syncThreadWatchState(info, state, button);
    saveMap(WATCH_KEY, state.watch);
    refreshWatchCenter();
    refreshFavoriteNavPanels();
  }

  function ensureForumGalleryCardTools(info, settings, state) {
    if (!info || !info.id || !info.cell || !info.titleLink) return null;
    var tools = qs('.spx-gallery-card-tools', info.cell);
    if (!tools) {
      tools = createEl('div', 'spx-gallery-card-tools');
    }

    var watchButton = qs('[data-spx-gallery-action="watch"]', tools);
    if (!watchButton) {
      watchButton = createEl('button', '', state.watch && state.watch[info.id] ? '已存' : '稍后');
      watchButton.type = 'button';
      watchButton.dataset.spxGalleryAction = 'watch';
      watchButton.title = '切换本地稍后看';
      tools.appendChild(watchButton);
    }
    if (watchButton.dataset.spxGalleryBound !== '1') {
      watchButton.dataset.spxGalleryBound = '1';
      watchButton.addEventListener('click', function toggleGalleryWatch(event) {
        event.preventDefault();
        event.stopPropagation();
        toggleThreadWatch(info, state, watchButton);
      });
    }

    var favoriteButton = qs('[data-spx-gallery-action="favorite"]', tools);
    if (!favoriteButton) {
      favoriteButton = createEl('button', '', isThreadFavoriteSeen(info.id) ? '已收藏' : '收藏');
      favoriteButton.type = 'button';
      favoriteButton.dataset.spxGalleryAction = 'favorite';
      favoriteButton.title = '收藏到站内收藏夹';
      tools.appendChild(favoriteButton);
    }
    if (favoriteButton.dataset.spxGalleryBound !== '1') {
      favoriteButton.dataset.spxGalleryBound = '1';
      favoriteButton.addEventListener('click', function favoriteGalleryThread(event) {
        event.preventDefault();
        event.stopPropagation();
        runThreadFavoriteAction(info, settings, state, favoriteButton, '已收藏');
      });
    }

    syncThreadWatchState(info, state, watchButton);
    favoriteButton.disabled = isThreadFavoriteSeen(info.id);
    favoriteButton.textContent = favoriteButton.disabled ? '已收藏' : '收藏';

    var sectionIntro = qs('.section-intro', info.cell);
    var introTail = sectionIntro;
    if (introTail && introTail.nextElementSibling && introTail.nextElementSibling.classList && introTail.nextElementSibling.classList.contains('clear')) {
      introTail = introTail.nextElementSibling;
    }
    if (introTail && introTail.parentNode === info.cell && tools.previousElementSibling !== introTail) {
      introTail.insertAdjacentElement('afterend', tools);
    } else if (tools.parentNode !== info.cell) {
      info.cell.appendChild(tools);
    }
    return tools;
  }

  function clearForumGalleryResourceBadges(info) {
    if (!info || !info.cell) return;
    var badges = qs('.spx-resource-badges', info.cell);
    if (badges) badges.remove();
  }

  function watchForumGalleryStream(wall, settings, state) {
    if (!wall || wall.dataset.spxGalleryObserver === '1' || typeof MutationObserver === 'undefined') return;
    var stream = qs('.stream', wall);
    if (!stream) return;
    wall.dataset.spxGalleryObserver = '1';
    var timer = null;
    var observer = new MutationObserver(function refreshGalleryCards(mutations) {
      var hasCardMutation = (mutations || []).some(function hasAddedOrRemovedCard(mutation) {
        return mutation && (mutation.addedNodes.length || mutation.removedNodes.length);
      });
      if (!hasCardMutation) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(function runDeferredGalleryEnhance() {
        timer = null;
        enhanceForumGallery(settings, state);
      }, 120);
    });
    observer.observe(stream, { childList: true });
  }

  function scheduleForumGalleryToolRepair(wall, settings, state) {
    if (!wall || wall.dataset.spxGalleryRepairScheduled === '1' || typeof window === 'undefined' || typeof window.setTimeout !== 'function') return;
    wall.dataset.spxGalleryRepairScheduled = '1';
    [300, 900, 1800].forEach(function scheduleRepair(delayMs) {
      window.setTimeout(function repairGalleryTools() {
        enhanceForumGallery(settings, state);
      }, delayMs);
    });
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
    var actionText = String(action.text || '');
    if (/^(打开|复制|继续阅读|上次楼层|全选筛选)$/.test(actionText)) {
      node.classList.add('spx-action-primary');
    } else {
      node.classList.add('spx-action-secondary');
    }
    if (/删除|移除|清空|失效/.test(actionText)) {
      node.classList.add('spx-danger');
    }
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

  function normalizeBatchConfirmItems(items) {
    return (items || []).map(function normalizeBatchConfirmItem(item) {
      if (!item) return null;
      if (typeof item === 'string') return { title: item, meta: '' };
      return {
        title: compactText(item.title || item.text || item.url || item.key || '未命名项目'),
        meta: compactText(item.meta || item.description || item.url || ''),
      };
    }).filter(Boolean);
  }

  function showBatchConfirmDialog(options) {
    var config = options || {};
    var fallbackText = config.fallbackText || config.message || config.title || '确认执行此操作？';
    if (typeof document === 'undefined' || !document.body) {
      return Promise.resolve(typeof window === 'undefined' || typeof window.confirm !== 'function' || window.confirm(fallbackText));
    }

    return new Promise(function openBatchConfirmDialog(resolve) {
      var existing = qs('#spx-batch-confirm-overlay');
      if (existing) existing.remove();

      var overlay = createEl('div', 'spx-batch-confirm-overlay');
      overlay.id = 'spx-batch-confirm-overlay';
      var dialog = createEl('section', 'spx-batch-confirm' + (config.danger === false ? '' : ' spx-batch-danger'));
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-label', config.title || '确认操作');

      var header = createEl('div', 'spx-batch-confirm-head');
      header.appendChild(createEl('strong', '', config.title || '确认操作'));
      header.appendChild(createEl('span', '', config.message || '这个操作会修改本地或站内数据。'));
      dialog.appendChild(header);

      var impacts = config.impacts || [];
      if (impacts.length) {
        var impactGrid = createEl('div', 'spx-batch-impact-grid');
        impacts.forEach(function appendBatchImpact(item) {
          var card = createEl('div', 'spx-batch-impact' + (item.className ? ' ' + item.className : ''));
          card.appendChild(createEl('b', '', String(item.value === undefined ? '' : item.value)));
          card.appendChild(createEl('span', '', item.label || '影响项'));
          if (item.note) card.appendChild(createEl('em', '', item.note));
          impactGrid.appendChild(card);
        });
        dialog.appendChild(impactGrid);
      }

      var items = normalizeBatchConfirmItems(config.items);
      if (items.length) {
        var list = createEl('div', 'spx-batch-list');
        items.slice(0, 8).forEach(function appendBatchItem(item) {
          var row = createEl('div', 'spx-batch-item');
          row.appendChild(createEl('span', '', item.title));
          if (item.meta) row.appendChild(createEl('em', '', item.meta));
          list.appendChild(row);
        });
        if (items.length > 8) {
          list.appendChild(createEl('div', 'spx-batch-more', '其余 ' + (items.length - 8) + ' 项将在确认后一起处理。'));
        }
        dialog.appendChild(list);
      }

      var footer = createEl('div', 'spx-batch-confirm-foot');
      var cancel = createEl('button', '', config.cancelText || '取消');
      var confirm = createEl('button', 'spx-primary', config.confirmText || '确认执行');
      cancel.type = 'button';
      confirm.type = 'button';
      cancel.dataset.action = 'cancel';
      confirm.dataset.action = 'confirm';
      footer.appendChild(cancel);
      footer.appendChild(confirm);
      dialog.appendChild(footer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      function closeBatchConfirm(result) {
        document.removeEventListener('keydown', handleBatchConfirmKeydown, true);
        if (overlay.isConnected) overlay.remove();
        resolve(!!result);
      }

      function handleBatchConfirmKeydown(event) {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        closeBatchConfirm(false);
      }

      overlay.addEventListener('click', function handleBatchConfirmClick(event) {
        var target = event.target;
        if (target === overlay) {
          closeBatchConfirm(false);
          return;
        }
        var action = target && target.dataset && target.dataset.action;
        if (action === 'cancel') closeBatchConfirm(false);
        if (action === 'confirm') closeBatchConfirm(true);
      });
      document.addEventListener('keydown', handleBatchConfirmKeydown, true);
      if (typeof confirm.focus === 'function') confirm.focus();
    });
  }

  function confirmBatchAction(options, fallbackText) {
    var config = Object.assign({ fallbackText: fallbackText }, options || {});
    return showBatchConfirmDialog(config).catch(function fallbackBatchConfirm() {
      var message = config.fallbackText || config.message || config.title || '确认执行此操作？';
      return typeof window === 'undefined' || typeof window.confirm !== 'function' || window.confirm(message);
    });
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

  function setCenterPanelHidden(panel, hidden) {
    if (!panel) return;
    panel.hidden = !!hidden;
    if (panel.hidden && panel.classList && panel.classList.contains('spx-workbench-inline-panel')) {
      var workbench = panel.closest && panel.closest('#spx-workbench');
      if (workbench) hideWorkbenchPanel();
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

  function getWorkbenchState(state) {
    return {
      read: state && state.read ? state.read : loadMap(READ_KEY),
      watch: state && state.watch ? state.watch : loadMap(WATCH_KEY),
      progress: state && state.progress ? state.progress : loadReadProgress(),
      threadUpdates: state && state.threadUpdates ? state.threadUpdates : loadThreadUpdates(),
      resources: state && state.resources ? state.resources : loadResourceLibrary(),
    };
  }

  function getWorkbenchHost() {
    return qs('.spx-module-body') || getModuleNavigationHost() || document.body;
  }

  function isWorkbenchInlinePanelId(panelId) {
    return [
      'spx-content-center',
      'spx-watch-center',
      'spx-history-center',
      'spx-auto-buy-center',
      'spx-resource-center',
    ].indexOf(panelId) !== -1;
  }

  function getWorkbenchCenterConfigs() {
    return getToolbarCenterConfigs().filter(function keepWorkbenchCenter(config) {
      return config && isWorkbenchInlinePanelId(config.panelId);
    });
  }

  function createWorkbenchTab(config, active) {
    var tab = createEl('button', 'spx-workbench-tab' + (active ? ' spx-active' : ''), config.label || '我的内容');
    tab.type = 'button';
    tab.dataset.spxWorkbenchPanel = config.panelId || '';
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
    if (config.title) tab.title = config.title;
    return tab;
  }

  function renderWorkbenchTabs(shell, activePanelId) {
    var tabs = qs('.spx-workbench-tabs', shell);
    if (!tabs) return;
    tabs.textContent = '';
    getWorkbenchCenterConfigs().forEach(function appendWorkbenchTab(config) {
      tabs.appendChild(createWorkbenchTab(config, config.panelId === activePanelId));
    });
  }

  function ensureWorkbenchPanel(settings, state) {
    var host = getWorkbenchHost();
    if (!host) return null;
    var shell = qs('#spx-workbench', host) || qs('#spx-workbench');
    if (!shell) {
      shell = createEl('section', 'spx-workbench');
      shell.id = 'spx-workbench';
      shell.hidden = true;
      shell.setAttribute('aria-label', '我的工作台');
      var head = createEl('div', 'spx-workbench-head');
      var title = createEl('div', 'spx-workbench-title');
      title.appendChild(createEl('strong', '', '我的工作台'));
      title.appendChild(createEl('span', '', '从左侧导航进入，工具栏保持原来的页面动作和设置入口。'));
      var close = createEl('button', 'spx-workbench-close', '关闭');
      close.type = 'button';
      close.dataset.action = 'close-workbench';
      head.appendChild(title);
      head.appendChild(close);
      shell.appendChild(head);
      shell.appendChild(createEl('div', 'spx-workbench-tabs'));
      shell.appendChild(createEl('div', 'spx-workbench-stage'));
      shell.addEventListener('click', function handleWorkbenchClick(event) {
        var closeTarget = event.target && event.target.closest && event.target.closest('[data-action="close-workbench"]');
        if (closeTarget) {
          hideWorkbenchPanel();
          return;
        }
        var tab = event.target && event.target.closest && event.target.closest('[data-spx-workbench-panel]');
        if (!tab || !tab.dataset.spxWorkbenchPanel) return;
        if (!isWorkbenchInlinePanelId(tab.dataset.spxWorkbenchPanel)) return;
        openWorkbenchPanel(tab.dataset.spxWorkbenchPanel, settings, state, { scroll: false });
      });
    }
    if (shell.parentNode !== host) host.insertBefore(shell, host.firstChild);
    return shell;
  }

  function clearWorkbenchStage(stage, keepPanelId) {
    if (!stage) return;
    Array.prototype.slice.call(stage.children).forEach(function removePreviousWorkbenchPanel(child) {
      if (child.id === keepPanelId) return;
      child.classList.remove('spx-workbench-inline-panel');
      child.remove();
    });
  }

  function openCenterPanelFallback(config, settings, state) {
    if (!config || !config.createPanel) return false;
    var centerPanel = config.createPanel(settings, state);
    if (centerPanel.spxRender) centerPanel.spxRender();
    setCenterPanelHidden(centerPanel, false);
    return true;
  }

  function setWorkbenchBodyMode(shell, active) {
    var body = shell && shell.closest && shell.closest('.spx-module-body');
    if (body) body.classList.toggle('spx-workbench-mode', !!active);
    if (document.documentElement) document.documentElement.classList.toggle('spx-workbench-open', !!active);
  }

  function hideWorkbenchPanel() {
    var shell = qs('#spx-workbench');
    if (shell) {
      shell.hidden = true;
      setWorkbenchBodyMode(shell, false);
    }
  }

  function syncWorkbenchNavigationActive(panelId) {
    if (!panelId) return;
    var nav = qs('#spx-module-nav');
    if (!nav) return;
    var target = qsa('[data-spx-workbench-nav-panel]', nav).filter(function matchWorkbenchNavigation(item) {
      return item.dataset && item.dataset.spxWorkbenchNavPanel === panelId;
    })[0];
    if (target) setModuleNavActive(nav, target);
  }

  function openWorkbenchPanel(panelId, settings, state, options) {
    var config = getCommandCenterPanelConfig(panelId);
    var workbenchState = getWorkbenchState(state);
    if (!config || !config.createPanel) return false;
    if (!isWorkbenchInlinePanelId(panelId)) {
      hideWorkbenchPanel();
      return openCenterPanelFallback(config, settings, workbenchState);
    }
    var shell = ensureWorkbenchPanel(settings || loadSettings(), workbenchState);
    var stage = shell && qs('.spx-workbench-stage', shell);
    if (!shell || !stage) return openCenterPanelFallback(config, settings, workbenchState);
    clearWorkbenchStage(stage, panelId);
    var panel = config.createPanel(settings || loadSettings(), workbenchState);
    if (panel.spxRender) panel.spxRender();
    panel.hidden = false;
    panel.classList.add('spx-workbench-inline-panel');
    stage.appendChild(panel);
    shell.hidden = false;
    setWorkbenchBodyMode(shell, true);
    shell.dataset.spxWorkbenchPanel = panelId;
    renderWorkbenchTabs(shell, panelId);
    syncWorkbenchNavigationActive(panelId);
    if (!options || options.scroll !== false) shell.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
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
          setCenterPanelHidden(panel, true);
          return;
        }
        if (action === 'remove-visible-watch') {
          var visibleEntries = filterWatchCenterEntries(
            getWatchCenterEntries(state.watch, state.progress),
            ensureCenterPanelState(panel, { query: '', filter: 'all', tag: 'all' })
          );
          if (!visibleEntries.length) return;
          confirmBatchAction({
            title: '移除稍后看筛选结果',
            message: '将从本地稍后看移除当前筛选结果，阅读进度不会删除。',
            confirmText: '移除筛选',
            impacts: [{ label: '稍后看主题', value: visibleEntries.length, note: '仅移除保存状态' }],
            items: visibleEntries.map(function mapWatchConfirmItem(entry) {
              return { title: entry.title, meta: [entry.progressText, entry.nextFloorLabel].filter(Boolean).join(' · ') };
            }),
          }, '移除当前筛选结果中的稍后看主题？').then(function removeVisibleWatchAfterConfirm(ok) {
            if (!ok) return;
            visibleEntries.forEach(function removeVisibleEntry(entry) {
              delete state.watch[entry.id];
            });
            saveMap(WATCH_KEY, state.watch);
            qsa('.spx-watch-badge').forEach(function removeMatchingBadge(badge) {
              if (!state.watch[badge.dataset.spxWatchId]) badge.remove();
            });
            renderWatchCenter(panel, state);
          });
          return;
        }
        if (action === 'clear-watch') {
          var allWatchEntries = getWatchCenterEntries(state.watch, state.progress);
          confirmBatchAction({
            title: '清空稍后看',
            message: '将清空全部本地稍后看主题，阅读进度仍会保留在最近浏览。',
            confirmText: '清空稍后看',
            impacts: [{ label: '稍后看主题', value: allWatchEntries.length, note: '不可自动恢复' }],
            items: allWatchEntries.map(function mapClearWatchConfirmItem(entry) {
              return { title: entry.title, meta: entry.url };
            }),
          }, '清空全部稍后看主题？').then(function clearWatchAfterConfirm(ok) {
            if (!ok) return;
            state.watch = {};
            saveMap(WATCH_KEY, state.watch);
            qsa('.spx-watch-badge').forEach(function removeBadge(badge) {
              badge.remove();
            });
            renderWatchCenter(panel, state);
          });
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
          setCenterPanelHidden(panel, true);
          return;
        }
        if (action === 'remove-visible-history') {
          var visibleEntries = filterHistoryCenterEntries(
            getHistoryCenterEntries(state.progress),
            ensureCenterPanelState(panel, { query: '', filter: 'all', tag: 'all' })
          );
          if (!visibleEntries.length) return;
          confirmBatchAction({
            title: '移除阅读记录筛选结果',
            message: '将移除当前筛选结果中的阅读进度记录，稍后看保存状态不会删除。',
            confirmText: '移除筛选',
            impacts: [{ label: '阅读记录', value: visibleEntries.length, note: '影响续读位置' }],
            items: visibleEntries.map(function mapHistoryConfirmItem(entry) {
              return { title: entry.title, meta: [entry.progressText, entry.nextFloorLabel].filter(Boolean).join(' · ') };
            }),
          }, '移除当前筛选结果中的阅读记录？').then(function removeVisibleHistoryAfterConfirm(ok) {
            if (!ok) return;
            visibleEntries.forEach(function removeVisibleHistory(entry) {
              delete state.progress[entry.id];
            });
            saveReadProgress(state.progress);
            refreshWatchCenter();
            renderHistoryCenter(panel, state);
          });
          return;
        }
        if (action === 'clear-history') {
          var allHistoryEntries = getHistoryCenterEntries(state.progress);
          confirmBatchAction({
            title: '清空阅读记录',
            message: '将清空全部阅读进度和最近浏览记录。',
            confirmText: '清空阅读记录',
            impacts: [{ label: '阅读记录', value: allHistoryEntries.length, note: '不可自动恢复' }],
            items: allHistoryEntries.map(function mapClearHistoryConfirmItem(entry) {
              return { title: entry.title, meta: entry.progressText || entry.url };
            }),
          }, '清空全部阅读记录？').then(function clearHistoryAfterConfirm(ok) {
            if (!ok) return;
            state.progress = {};
            saveReadProgress(state.progress);
            clearReadProgressRestoreRequest(parseThreadId(location.href));
            refreshWatchCenter();
            renderHistoryCenter(panel, state);
          });
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
          setCenterPanelHidden(panel, true);
          return;
        }
        if (action === 'remove-visible-auto-buy-records') {
          var attempts = loadAutoBuyAttempts();
          var visibleEntries = filterAutoBuyCenterEntries(
            getAutoBuyCenterEntries(attempts),
            ensureCenterPanelState(panel, { query: '', filter: 'all' })
          );
          if (!visibleEntries.length) return;
          confirmBatchAction({
            title: '删除自动购买筛选记录',
            message: '将删除当前筛选结果中的自动购买执行记录。',
            confirmText: '删除筛选',
            impacts: [{ label: '购买记录', value: visibleEntries.length, note: '可能影响重复购买拦截' }],
            items: visibleEntries.map(function mapAutoBuyConfirmItem(entry) {
              return { title: entry.key, meta: [entry.statusLabel, entry.message].filter(Boolean).join(' · ') };
            }),
          }, '删除当前筛选结果中的自动购买记录？').then(function removeVisibleAutoBuyAfterConfirm(ok) {
            if (!ok) return;
            visibleEntries.forEach(function removeVisibleAutoBuyEntry(entry) {
              delete attempts[entry.key];
            });
            saveAutoBuyAttempts(attempts);
            renderAutoBuyCenter(panel);
          });
          return;
        }
        if (action === 'clear-auto-buy-records') {
          var allAutoBuyEntries = getAutoBuyCenterEntries(loadAutoBuyAttempts());
          confirmBatchAction({
            title: '清空自动购买记录',
            message: '将清空全部自动购买执行记录。',
            confirmText: '清空记录',
            impacts: [{ label: '购买记录', value: allAutoBuyEntries.length, note: '不可自动恢复' }],
            items: allAutoBuyEntries.map(function mapClearAutoBuyConfirmItem(entry) {
              return { title: entry.key, meta: entry.statusLabel };
            }),
          }, '清空全部自动购买记录？').then(function clearAutoBuyAfterConfirm(ok) {
            if (!ok) return;
            saveAutoBuyAttempts({});
            delete document.documentElement.dataset.spxAutoBuyStatus;
            var status = qs('#spx-auto-buy-status');
            if (status) status.remove();
            renderAutoBuyCenter(panel);
          });
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

  function syncTaskClaimRecordsFromDocument(root, sourceUrl) {
    if (typeof document === 'undefined') return 0;
    var scope = root || document;
    var rows = qsa('tr,.tr3,.t,.t3,.spx-task-main-block,.spx-task-main-stack', scope).map(function mapTaskClaimRow(row) {
      return String(row.textContent || '').replace(/\s+/g, ' ').trim();
    }).filter(function keepTaskClaimRow(text) {
      return /任务|奖励|完成时间|日常|周常/.test(text);
    });
    var options = {
      source: 'site-completed',
      sourceUrl: sourceUrl || (typeof location !== 'undefined' ? location.href : ''),
      recordedAt: Date.now(),
    };
    var records = parseTaskClaimRecordsFromRows(rows, options);
    if (!records.length) records = parseTaskClaimRecordsFromText(scope.textContent || '', options);
    if (!records.length) return 0;
    saveTaskClaimRecords(mergeTaskClaimRecords(loadTaskClaimRecords(), records));
    showDailyTaskDoneNavStatus(loadTaskClaimRecords(), Date.now());
    refreshTaskClaimInlineSection();
    return records.length;
  }

  function getTaskCompletedPageUrl() {
    var origin = (typeof location !== 'undefined' && location.origin) ? location.origin : 'https://south-plus.org';
    return origin + '/plugin.php?H_name-tasks-actions-endtasks.html.html';
  }

  function getTaskHomePageUrl() {
    var origin = (typeof location !== 'undefined' && location.origin) ? location.origin : 'https://south-plus.org';
    return origin + '/plugin.php?H_name-tasks.html';
  }

  function getTaskInProgressPageUrl() {
    var origin = (typeof location !== 'undefined' && location.origin) ? location.origin : 'https://south-plus.org';
    return origin + '/plugin.php?H_name-tasks-actions-newtasks.html.html';
  }

  function shouldSyncTaskClaimRecordsFromUrl(url) {
    return shouldUseTaskPage(url) && /(?:actions[-=]endtasks|endtasks)/i.test(String(url || ''));
  }

  function syncTaskClaimRecordsFromCurrentPage() {
    if (typeof document === 'undefined' || !shouldSyncTaskClaimRecordsFromUrl(location.href)) return 0;
    if (document.documentElement.dataset.spxTaskClaimsSynced === '1') return 0;
    document.documentElement.dataset.spxTaskClaimsSynced = '1';
    return syncTaskClaimRecordsFromDocument(document, location.href);
  }

  function getTaskAutoClaimContextText(control) {
    if (!control || !control.closest) return '';
    var row = control.closest('tr,.tr3,.f_one,.spx-task-main-block,.spx-task-main-stack,.t,.t3,.t5');
    return String(row && row.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function getTaskAutoClaimControlText(control) {
    return String(
      control && (control.textContent || control.value || control.title || control.getAttribute && control.getAttribute('aria-label')) || ''
    ).replace(/\s+/g, ' ').trim();
  }

  function buildTaskAutoClaimFormRequest(control, pageUrl) {
    if (!control || !control.form) return null;
    var form = control.form;
    var method = String(form.method || 'get').toUpperCase();
    var url = '';
    try {
      url = new URL(form.action || pageUrl || location.href, pageUrl || location.href).href;
    } catch (error) {
      url = pageUrl || location.href;
    }
    var formData = new FormData(form);
    if (control.name && !formData.has(control.name)) formData.append(control.name, control.value || '');
    if (method === 'GET') {
      var queryUrl = new URL(url, pageUrl || location.href);
      formData.forEach(function appendTaskAutoClaimQuery(value, key) {
        queryUrl.searchParams.append(key, value);
      });
      return { url: queryUrl.href, options: { method: 'GET', credentials: 'include', cache: 'no-store' } };
    }
    return { url: url, options: { method: method, credentials: 'include', cache: 'no-store', body: formData } };
  }

  function createTaskAutoClaimTarget(control, pageUrl) {
    var label = getTaskAutoClaimControlText(control);
    var rawTarget = control && (control.getAttribute('href') || control.getAttribute('onclick') || '') || '';
    var contextText = getTaskAutoClaimContextText(control);
    var preliminaryActionType = getTaskAutoClaimActionType(label, rawTarget, contextText);
    var href = extractTaskAutoClaimUrl(rawTarget, pageUrl, preliminaryActionType, contextText);
    var formRequest = !href ? buildTaskAutoClaimFormRequest(control, pageUrl) : null;
    if (!href && formRequest) href = formRequest.url;
    if (!href || !isTaskAutoClaimCandidate(label, href, contextText)) return null;
    var taskName = parseTaskClaimTaskName(contextText) || parseTaskClaimTaskName(label);
    var taskKey = getTaskClaimTaskKey(taskName);
    if (taskKey !== 'daily' && taskKey !== 'weekly') return null;
    var actionType = getTaskAutoClaimActionType(label, href, contextText) || preliminaryActionType || 'claim';
    return {
      key: taskKey + '|' + actionType + '|' + href,
      taskKey: taskKey,
      taskName: getTaskClaimTaskLabel(taskKey, taskName),
      actionType: actionType,
      label: label || '领取',
      url: href,
      options: formRequest ? formRequest.options : { method: 'GET', credentials: 'include', cache: 'no-store' },
    };
  }

  function getTaskAutoClaimTargets(root, pageUrl) {
    var scope = root || document;
    var targets = [];
    var seen = {};
    qsa('a[href],a[onclick],button,input[type="button"],input[type="submit"],input[type="image"],[role="button"][onclick]', scope).forEach(function collectTaskAutoClaimControl(control) {
      if (
        control.closest &&
        control.closest('.spx-task-side-stack,.spx-task-side-block,.spx-module-nav,#spx-toolbar,#spx-settings,#spx-toolbox')
      ) return;
      var target = createTaskAutoClaimTarget(control, pageUrl);
      if (!target || seen[target.key]) return;
      seen[target.key] = true;
      targets.push(target);
    });
    return targets.slice(0, 4);
  }

  function getTaskAutoClaimTargetsFromHtml(html, pageUrl) {
    var parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
    if (!parser) return [];
    var doc = parser.parseFromString(String(html || ''), 'text/html');
    return getTaskAutoClaimTargets(doc, pageUrl);
  }

  function getTaskAutoClaimStatusBox(host) {
    if (!host) return null;
    var box = qs('#spx-task-auto-claim-status', host) || qs('#spx-task-auto-claim-status');
    if (!box) {
      box = createEl('div', 'spx-task-auto-claim-status');
      box.id = 'spx-task-auto-claim-status';
      host.insertBefore(box, host.firstChild || null);
    }
    return box;
  }

  function setTaskAutoClaimStatus(host, text, isError) {
    var box = getTaskAutoClaimStatusBox(host);
    if (!box) return;
    box.textContent = text || '';
    box.classList.toggle('spx-error', !!isError);
  }

  function showFavoriteNavStatusNote(className, text, detail) {
    if (typeof document === 'undefined') return null;
    var wrapper = qs('#spx-favorite-nav');
    if (!wrapper) {
      pendingFavoriteNavStatusNotes = pendingFavoriteNavStatusNotes.filter(function keepOtherPendingNote(note) {
        return note && note.className !== className;
      });
      pendingFavoriteNavStatusNotes.push({ className: className, text: text, detail: detail });
      return null;
    }
    var noteClass = String(className || 'spx-favorite-nav-note');
    var note = qs('.' + noteClass, wrapper);
    if (!note) {
      note = createEl('span', 'spx-favorite-nav-note ' + noteClass);
      note.setAttribute('role', 'status');
      note.setAttribute('aria-live', 'polite');
      wrapper.appendChild(note);
    }
    note.hidden = false;
    note.textContent = text || '';
    note.title = detail || note.textContent;
    return note;
  }

  function flushFavoriteNavStatusNotes() {
    if (!pendingFavoriteNavStatusNotes.length || typeof document === 'undefined') return;
    var wrapper = qs('#spx-favorite-nav');
    if (!wrapper) return;
    var notes = pendingFavoriteNavStatusNotes.slice();
    pendingFavoriteNavStatusNotes = [];
    notes.forEach(function showPendingFavoriteNavStatus(note) {
      showFavoriteNavStatusNote(note.className, note.text, note.detail);
    });
  }

  function showTaskAutoClaimNavSuccess(text, detail) {
    return showFavoriteNavStatusNote('spx-task-auto-claim-nav-note', text || '任务执行成功', detail);
  }

  function showDailyTaskDoneNavStatus(records, now) {
    if (!isTaskClaimCompletedToday(records, 'daily', now)) return null;
    var completedAt = getLatestTaskClaimCompletedAt(records, 'daily');
    var detail = completedAt ? ('日常任务已完成：' + formatShortTime(completedAt)) : '日常任务已完成';
    return showTaskAutoClaimNavSuccess('今日任务已完成', detail);
  }

  function hasSuccessfulTaskAutoClaimTask(results, taskKey) {
    var key = getTaskClaimTaskKey(taskKey);
    return (results || []).some(function hasSuccessfulTaskResult(result) {
      return result && result.target && result.target.taskKey === key && !isTaskAutoClaimResultBlocked(result);
    });
  }

  function showAutoBuyNavSuccess(record) {
    return showFavoriteNavStatusNote('spx-auto-buy-nav-note', '已购买', formatAutoBuyNavSuccessDetail(record));
  }

  function syncAutoBuyNavSuccessForThread(threadId) {
    var record = getAutoBuyDoneAttemptForThread(loadAutoBuyAttempts(), threadId);
    if (!record) return null;
    return showAutoBuyNavSuccess(record);
  }

  function fetchAndSyncTaskClaimRecordsAfterAutoClaim(host) {
    var url = getTaskCompletedPageUrl();
    return requestWithPolicy(url, { credentials: 'include', cache: 'no-store' }, { mode: 'action', label: '自动任务领取后同步记录' })
      .then(function readTaskAutoClaimCompletedPage(response) {
        return readScriptResponseText(response, { mode: 'action', label: '自动任务领取后同步记录' });
      })
      .then(function syncTaskAutoClaimCompletedPage(html) {
        var parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
        var doc = parser ? parser.parseFromString(html, 'text/html') : null;
        return syncTaskClaimRecordsFromDocument(doc || document, url);
      });
  }

  function getTaskAutoClaimResponseResult(html) {
    var value = compactText(String(html || '')
      .replace(/^<\?xml[^>]*>/i, '')
      .replace(/<ajax><!\[CDATA\[|\]\]><\/ajax>/gi, '')
      .replace(/<[^>]+>/g, ' '));
    var match = value.match(/^(success|confirm|error|fail|failure)\s*(.*)$/i);
    return {
      status: match ? match[1].toLowerCase() : '',
      message: match ? match[2] : value,
    };
  }

  function isTaskAutoClaimResultBlocked(result) {
    var status = result && result.response && result.response.status;
    return !!status && status !== 'success';
  }

  function hasSuccessfulTaskAutoClaimAction(results, actionType) {
    return (results || []).some(function hasTaskAutoClaimAction(result) {
      return result && result.target && result.target.actionType === actionType && !isTaskAutoClaimResultBlocked(result);
    });
  }

  function runTaskAutoClaimTargets(targets, host, index, results) {
    var list = targets || [];
    var output = results || [];
    if (index >= list.length) return Promise.resolve(output);
    var target = list[index];
    setTaskAutoClaimStatus(host, '自动领取：正在处理 ' + target.taskName + '...', false);
    return requestWithPolicy(target.url, target.options, { mode: 'action', label: '自动任务领取' })
      .then(function readTaskAutoClaimResponse(response) {
        if (!response.ok) throw new Error(target.taskName + ' 请求失败');
        return readScriptResponseText(response, { mode: 'action', label: '自动任务领取' });
      })
      .then(function keepTaskAutoClaimResult(html) {
        output.push({ target: target, html: html, response: getTaskAutoClaimResponseResult(html) });
        return runTaskAutoClaimTargets(list, host, index + 1, output);
      });
  }

  function resolveTaskAutoClaimTargets(host, options) {
    var opts = options || {};
    var canUseCurrentPage = opts.allowCurrentPage !== false;
    var targets = opts.initialTargets || (canUseCurrentPage ? getTaskAutoClaimTargets(host, location.href) : []);
    if (targets.length) return Promise.resolve({ source: 'current', targets: targets });
    if (canUseCurrentPage && /actions[-=]newtasks|newtasks/i.test(String(location.href || ''))) {
      return Promise.resolve({ source: 'current', targets: [] });
    }
    setTaskAutoClaimStatus(host, '自动领取：正在检查新任务页可领取入口...', false);
    var taskHomeUrl = getTaskHomePageUrl();
    var inProgressUrl = getTaskInProgressPageUrl();
    var requestPolicy = { mode: 'action', label: '自动任务领取检查' };
    return requestWithPolicy(taskHomeUrl, { credentials: 'include', cache: 'no-store' }, requestPolicy)
      .then(function readTaskAutoClaimHomePage(response) {
        if (!response.ok) throw new Error('新任务页检查失败');
        return readScriptResponseText(response, requestPolicy);
      })
      .then(function collectTaskAutoClaimHomeTargets(html) {
        var homeTargets = getTaskAutoClaimTargetsFromHtml(html, taskHomeUrl);
        if (homeTargets.length) return { source: 'task-home', targets: homeTargets };
        setTaskAutoClaimStatus(host, '自动领取：新任务页暂无入口，正在检查进行中任务奖励...', false);
        return requestWithPolicy(inProgressUrl, { credentials: 'include', cache: 'no-store' }, requestPolicy)
          .then(function readTaskAutoClaimInProgressPage(response) {
            if (!response.ok) throw new Error('进行中任务页检查失败');
            return readScriptResponseText(response, requestPolicy);
          })
          .then(function collectTaskAutoClaimInProgressTargets(html) {
            return { source: 'in-progress', targets: getTaskAutoClaimTargetsFromHtml(html, inProgressUrl) };
          });
      });
  }

  function fetchTaskAutoClaimRewardTargets(host, completedResults) {
    if (!hasSuccessfulTaskAutoClaimAction(completedResults, 'start')) return Promise.resolve([]);
    setTaskAutoClaimStatus(host, '自动领取：任务申请完成，正在检查进行中任务奖励...', false);
    var url = getTaskInProgressPageUrl();
    var seen = {};
    (completedResults || []).forEach(function rememberCompletedTaskAutoClaim(result) {
      if (result && result.target) seen[result.target.key] = true;
    });
    return requestWithPolicy(url, { credentials: 'include', cache: 'no-store' }, { mode: 'action', label: '自动任务奖励检查' })
      .then(function readTaskAutoClaimRewardPage(response) {
        if (!response.ok) throw new Error('进行中任务奖励检查失败');
        return readScriptResponseText(response, { mode: 'action', label: '自动任务奖励检查' });
      })
      .then(function collectTaskAutoClaimRewardTargets(html) {
        return getTaskAutoClaimTargetsFromHtml(html, url).filter(function keepTaskAutoClaimRewardTarget(target) {
          return target.actionType === 'finish' && !seen[target.key];
        });
      });
  }

  function maybeRunAutoTaskClaim(settings, host) {
    if (!settings || !settings.autoTaskClaim || typeof document === 'undefined' || typeof location === 'undefined') return Promise.resolve(null);
    if (!document.documentElement || document.documentElement.dataset.spxTaskAutoClaimRan === '1') return Promise.resolve(null);
    var isTaskPage = shouldUseTaskPage(location.href);
    var currentHost = host || (isTaskPage ? (qs('.spx-module-body') || qs('#main')) : null);
    var taskClaimRecords = loadTaskClaimRecords();
    showDailyTaskDoneNavStatus(taskClaimRecords, Date.now());
    document.documentElement.dataset.spxTaskAutoClaimRan = '1';
    if (shouldSyncTaskClaimRecordsFromUrl(location.href)) {
      setTaskAutoClaimStatus(currentHost, '自动领取：当前是已完成任务页，仅同步领取记录，不执行领取。', false);
      return Promise.resolve(null);
    }
    var currentTargets = isTaskPage && currentHost ? getTaskAutoClaimTargets(currentHost, location.href) : [];
    var gate = currentTargets.length ? { canRun: true, nextCheckAt: 0, dueTaskKeys: [], reason: 'visible-target' } : getTaskAutoClaimGate(taskClaimRecords, loadTaskAutoClaimState(), Date.now());
    if (!gate.canRun) {
      setTaskAutoClaimStatus(currentHost, '自动领取：仍在冷却中，下次检查约 ' + formatTaskAutoClaimNextCheck(gate.nextCheckAt) + '。', false);
      return Promise.resolve(null);
    }
    return resolveTaskAutoClaimTargets(currentHost, { allowCurrentPage: isTaskPage, initialTargets: currentTargets })
      .then(function runResolvedTaskAutoClaimTargets(result) {
        var targets = result && result.targets || [];
        if (!targets.length) {
          var message = result && result.source === 'in-progress'
            ? '自动领取：新任务页和进行中任务页都没有发现可领取入口，可能仍在冷却中。'
            : '自动领取：没有发现可领取的日常 / 周常入口，可能仍在冷却中。';
          rememberTaskAutoClaimCheck('no-targets', Date.now() + TASK_AUTO_CLAIM_PROBE_RETRY_TTL);
          setTaskAutoClaimStatus(currentHost, message, false);
          return null;
        }
        return runTaskAutoClaimTargets(targets, currentHost, 0, []).then(function runTaskAutoClaimRewards(results) {
          return fetchTaskAutoClaimRewardTargets(currentHost, results).then(function runTaskAutoClaimRewardTargets(rewardTargets) {
            if (!rewardTargets.length) return results;
            return runTaskAutoClaimTargets(rewardTargets, currentHost, 0, results);
          });
        });
      })
      .then(function syncTaskAutoClaimRecords(results) {
        if (!results) return null;
        var blocked = results.filter(isTaskAutoClaimResultBlocked);
        var succeeded = results.filter(function keepSucceededTaskAutoClaim(result) {
          return !isTaskAutoClaimResultBlocked(result);
        });
        blocked.forEach(function rememberBlockedTaskAutoClaim(result) {
          if (result && result.target) {
            rememberTaskAutoClaimTaskCooldown(result.target.taskKey, 'blocked', Date.now() + getTaskAutoClaimCooldownMs(result.target.taskKey));
          }
        });
        if (!succeeded.length) {
          var blockedMessage = blocked[0] && blocked[0].response && blocked[0].response.message || '当前任务暂不可领取';
          rememberTaskAutoClaimCheck('blocked', getTaskAutoClaimBlockedRetryAt(results));
          setTaskAutoClaimStatus(currentHost, '自动领取：暂不可领取，' + blockedMessage, false);
          return null;
        }
        return fetchAndSyncTaskClaimRecordsAfterAutoClaim(currentHost).then(function reportTaskAutoClaimSync(count) {
          var latestRecords = loadTaskClaimRecords();
          rememberTaskAutoClaimCheck('success', getTaskAutoClaimNextCheckAtFromRecords(latestRecords, Date.now()));
          var blockedText = blocked.length ? ('，另有 ' + blocked.length + ' 个暂不可领取。') : '';
          var successMessage = '已处理 ' + succeeded.length + ' 个任务' + (count ? ('，同步 ' + count + ' 条领取记录') : '');
          if (isTaskClaimCompletedToday(latestRecords, 'daily', Date.now()) || hasSuccessfulTaskAutoClaimTask(succeeded, 'daily')) {
            showTaskAutoClaimNavSuccess('今日任务已完成', successMessage + blockedText);
          } else {
            showTaskAutoClaimNavSuccess('任务执行成功', successMessage + blockedText);
          }
          setTaskAutoClaimStatus(
            currentHost,
            '自动领取：已处理 ' + succeeded.length + ' 个任务' + (count ? ('，同步 ' + count + ' 条领取记录。') : '，可刷新页面查看最新状态。') + blockedText,
            false
          );
        });
      })
      .catch(function handleTaskAutoClaimError(error) {
        rememberTaskAutoClaimCheck('error', Date.now() + TASK_AUTO_CLAIM_ERROR_RETRY_TTL);
        setTaskAutoClaimStatus(currentHost, '自动领取失败：' + String(error && error.message || error || '未知错误'), true);
      });
  }

  function setTaskClaimInlineStatus(section, text, isError) {
    if (!section) return;
    section.spxTaskClaimStatus = text || '';
    section.spxTaskClaimStatusError = !!isError;
  }

  function renderTaskClaimInlineSection(section) {
    if (!section) return;
    var entries = getTaskClaimCenterEntries(loadTaskClaimRecords());
    var state = ensureCenterPanelState(section, { query: '', filter: 'all' });
    var visibleEntries = filterTaskClaimCenterEntries(entries, state);
    var filtered = isCenterFiltered(state);

    section.textContent = '';
    section.id = 'spx-task-claims';

    var header = createEl('div', 'spx-task-claim-head');
    var title = createEl('div');
    title.appendChild(createEl('h3', '', '任务领取记录'));
    title.appendChild(createEl(
      'p',
      'spx-task-claim-summary',
      (filtered ? (visibleEntries.length + ' / ') : '') + entries.length + ' / ' + TASK_CLAIM_RECORD_LIMIT + ' 条本地记录'
    ));
    header.appendChild(title);

    var actions = createEl('div', 'spx-task-claim-actions');
    var syncButton = createEl('button', '', '同步已完成页');
    syncButton.type = 'button';
    syncButton.dataset.action = 'sync-task-claims';
    actions.appendChild(syncButton);
    header.appendChild(actions);
    section.appendChild(header);

    var controls = createCenterControls(state, {
      searchPlaceholder: '搜索任务或来源',
      filters: [
        { value: 'all', label: '全部' },
        { value: 'daily', label: '日常' },
        { value: 'weekly', label: '周常' },
      ],
    });
    if (controls) section.appendChild(controls);

    if (section.spxTaskClaimStatus) {
      section.appendChild(createEl(
        'div',
        'spx-task-claim-status' + (section.spxTaskClaimStatusError ? ' spx-error' : ''),
        section.spxTaskClaimStatus
      ));
    }

    if (!entries.length) {
      section.appendChild(createEl('div', 'spx-task-claim-empty', '还没有任务领取记录。打开已完成任务页后会自动同步，并在本地保留最近 100 次。'));
      return;
    }

    if (!visibleEntries.length) {
      section.appendChild(createEl('div', 'spx-task-claim-empty', '没有匹配的任务领取记录。'));
      return;
    }

    var list = createEl('div', 'spx-task-claim-list');
    visibleEntries.forEach(function appendTaskClaimEntry(entry) {
      var row = createEl('div', 'spx-task-claim-row');
      row.dataset.key = entry.key;

      var body = createEl('div', 'spx-task-claim-body');
      var line = createEl('div', 'spx-task-claim-title');
      var name = entry.sourceUrl ? createEl('a', '', entry.taskName) : createEl('strong', '', entry.taskName);
      if (entry.sourceUrl) name.href = entry.sourceUrl;
      line.appendChild(name);
      if (entry.rewardSp !== null && isFinite(entry.rewardSp)) {
        line.appendChild(createEl('span', 'spx-task-claim-reward', '+' + entry.rewardSp + ' SP'));
      }
      body.appendChild(line);

      var metaParts = [];
      if (entry.completedAt) metaParts.push('领取 ' + formatShortTime(entry.completedAt));
      if (entry.recordedAt && entry.recordedAt !== entry.completedAt) metaParts.push('记录 ' + formatShortTime(entry.recordedAt));
      if (entry.source === 'site-completed') metaParts.push('来源 已完成任务页');
      body.appendChild(createEl('div', 'spx-task-claim-meta', metaParts.join(' · ') || '暂无详情'));
      row.appendChild(body);

      var removeButton = createEl('button', 'spx-task-claim-remove', '删除');
      removeButton.type = 'button';
      removeButton.dataset.action = 'remove-task-claim';
      removeButton.dataset.key = entry.key;
      row.appendChild(removeButton);
      list.appendChild(row);
    });
    section.appendChild(list);
  }

  function refreshTaskClaimInlineSection() {
    qsa('.spx-task-claim-inline').forEach(function refreshInlineTaskClaims(section) {
      renderTaskClaimInlineSection(section);
    });
  }

  function syncTaskClaimRecordsFromCompletedPage(section) {
    var url = getTaskCompletedPageUrl();
    setTaskClaimInlineStatus(section, '正在同步已完成任务页...', false);
    renderTaskClaimInlineSection(section);
    requestWithPolicy(url, { credentials: 'include', cache: 'no-store' }, { mode: 'action', label: '任务记录同步' })
      .then(function readTaskClaimInlineSyncResponse(response) {
        return readScriptResponseText(response, { mode: 'action', label: '任务记录同步' });
      })
      .then(function importTaskClaimInlineSyncHtml(html) {
        var parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
        var doc = parser ? parser.parseFromString(html, 'text/html') : null;
        var count = syncTaskClaimRecordsFromDocument(doc || document, url);
        setTaskClaimInlineStatus(section, count ? ('已同步 ' + count + ' 条已完成任务记录。') : '已完成页没有发现新的任务领取记录。', false);
        renderTaskClaimInlineSection(section);
      })
      .catch(function handleTaskClaimInlineSyncError(error) {
        setTaskClaimInlineStatus(section, String(error && error.message || '任务记录同步失败'), true);
        renderTaskClaimInlineSection(section);
      });
  }

  function handleTaskClaimInlineAction(action, target, section) {
    if (!section) return;
    if (action === 'sync-task-claims') {
      syncTaskClaimRecordsFromCompletedPage(section);
      return;
    }
    if (action === 'remove-task-claim') {
      var key = target && target.dataset && target.dataset.key;
      if (!key) return;
      var taskClaims = loadTaskClaimRecords();
      delete taskClaims[key];
      saveTaskClaimRecords(taskClaims);
      setTaskClaimInlineStatus(section, '已删除 1 条本地任务领取记录。', false);
      renderTaskClaimInlineSection(section);
    }
  }

  function createTaskClaimInlineSection(settings, state) {
    var section = createEl('section', 'spx-task-claim-inline');
    section.id = 'spx-task-claims';
    section.spxState = { query: '', filter: 'all' };
    section.spxRender = function renderInlineTaskClaims() {
      renderTaskClaimInlineSection(section);
    };
    section.addEventListener('compositionstart', function handleTaskClaimInlineCompositionStart(event) {
      var target = event.target;
      if (!target || !target.dataset || target.dataset.spxCenterQuery !== '1') return;
      section.spxCenterQueryComposing = true;
    });
    section.addEventListener('compositionend', function handleTaskClaimInlineCompositionEnd(event) {
      var target = event.target;
      if (!target || !target.dataset || target.dataset.spxCenterQuery !== '1') return;
      section.spxCenterQueryComposing = false;
      commitCenterQueryInput(section, { stateDefaults: { query: '', filter: 'all' } }, target);
    });
    section.addEventListener('input', function handleTaskClaimInlineInput(event) {
      var target = event.target;
      if (!target || !target.dataset || target.dataset.spxCenterQuery !== '1') return;
      if (event.isComposing || section.spxCenterQueryComposing) return;
      commitCenterQueryInput(section, { stateDefaults: { query: '', filter: 'all' } }, target);
    });
    section.addEventListener('change', function handleTaskClaimInlineChange(event) {
      var target = event.target;
      if (!target || !target.dataset || target.dataset.spxCenterFilter !== '1') return;
      var currentState = ensureCenterPanelState(section, { query: '', filter: 'all' });
      if (currentState.filter === target.value) return;
      currentState.filter = target.value;
      renderTaskClaimInlineSection(section);
    });
    section.addEventListener('click', function handleTaskClaimInlineClick(event) {
      var target = event.target;
      var action = target && target.dataset && target.dataset.action;
      if (!action) return;
      handleTaskClaimInlineAction(action, target, section);
    });
    renderTaskClaimInlineSection(section);
    return section;
  }

  function ensureTaskClaimInlineSection(host) {
    if (!host || !shouldSyncTaskClaimRecordsFromUrl(location.href)) return null;
    var section = qs('#spx-task-claims', host) || qs('#spx-task-claims');
    if (!section) section = createTaskClaimInlineSection();
    if (section.parentNode !== host) host.appendChild(section);
    renderTaskClaimInlineSection(section);
    return section;
  }

  function createMyContentStat(label, value, note, className) {
    var stat = createEl('div', 'spx-content-stat' + (className ? ' ' + className : ''));
    stat.appendChild(createEl('b', '', String(value)));
    stat.appendChild(createEl('span', '', label));
    if (note) stat.appendChild(createEl('em', '', note));
    return stat;
  }

  function createMyContentShortcut(label, action, primary) {
    var button = createEl('button', primary ? 'spx-primary' : '', label);
    button.type = 'button';
    button.dataset.action = action;
    return button;
  }

  function appendMyContentRecentList(section, entries, emptyText, formatter) {
    var list = createEl('div', 'spx-content-recent-list');
    if (!(entries || []).length) {
      list.appendChild(createEl('div', 'spx-content-empty', emptyText));
    } else {
      entries.slice(0, 3).forEach(function appendRecentEntry(entry) {
        var row = createEl('div', 'spx-content-recent');
        var formatted = formatter(entry);
        row.appendChild(createEl('strong', '', formatted.title));
        row.appendChild(createEl('span', '', formatted.meta));
        list.appendChild(row);
      });
    }
    section.appendChild(list);
  }

  function renderMyContentCenter(panel, settings, state) {
    state.watch = state.watch || {};
    state.progress = state.progress || {};
    state.resources = pruneResourceLibrary(state.resources || {});
    var watchEntries = getWatchCenterEntries(state.watch, state.progress);
    var historyEntries = getHistoryCenterEntries(state.progress);
    var resourceEntries = getResourceCenterEntries(state.resources);
    var autoBuyEntries = getAutoBuyCenterEntries(loadAutoBuyAttempts());
    var taskClaimEntries = getTaskClaimCenterEntries(loadTaskClaimRecords());
    var favoriteSeenCount = Object.keys(loadMap(FAVORITE_NAV_SEEN_KEY)).length;
    var unreadWatchCount = watchEntries.filter(function countUnreadWatch(entry) {
      return !entry.progressAt || !isCompletedReadProgress(state.progress && state.progress[entry.id]);
    }).length;
    var queueCount = getResourceDownloadQueueEntries(resourceEntries).length;

    panel.textContent = '';
    var header = createEl('div', 'spx-watch-center-header spx-content-center-header');
    var title = createEl('div');
    title.appendChild(createEl('h3', '', '我的内容'));
    title.appendChild(createEl('p', '', '收藏、稍后、阅读进度、资源、购买和任务的本地汇总。'));
    header.appendChild(title);
    header.appendChild(createMyContentShortcut('关闭', 'close-content-center'));
    panel.appendChild(header);

    var stats = createEl('div', 'spx-content-stats');
    stats.appendChild(createMyContentStat('稍后看', watchEntries.length, unreadWatchCount ? ('未读 ' + unreadWatchCount) : '已同步进度', unreadWatchCount ? 'spx-warn' : 'spx-ok'));
    stats.appendChild(createMyContentStat('最近浏览', historyEntries.length, '阅读进度记录'));
    stats.appendChild(createMyContentStat('资源', resourceEntries.length, queueCount ? ('待下载 ' + queueCount) : '无待处理', queueCount ? 'spx-warn' : 'spx-ok'));
    stats.appendChild(createMyContentStat('购买记录', autoBuyEntries.length, '自动购买执行状态'));
    stats.appendChild(createMyContentStat('任务领取', taskClaimEntries.length, '最近 100 次'));
    stats.appendChild(createMyContentStat('收藏标记', favoriteSeenCount, '本地已识别站内收藏'));
    panel.appendChild(stats);

    var shortcuts = createEl('div', 'spx-content-shortcuts');
    shortcuts.appendChild(createMyContentShortcut('打开稍后看', 'open-watch-center', true));
    shortcuts.appendChild(createMyContentShortcut('打开最近浏览', 'open-history-center', false));
    shortcuts.appendChild(createMyContentShortcut('打开资源工作台', 'open-resource-center', false));
    shortcuts.appendChild(createMyContentShortcut('打开购买记录', 'open-auto-buy-center', false));
    shortcuts.appendChild(createMyContentShortcut('查看已完成任务', 'open-task-completed-page', false));
    panel.appendChild(shortcuts);

    var grid = createEl('div', 'spx-content-recent-grid');
    var watchSection = createEl('section', 'spx-content-recent-section');
    watchSection.appendChild(createEl('h4', '', '稍后看积压'));
    appendMyContentRecentList(watchSection, watchEntries, '暂无稍后看主题。', function formatWatchRecent(entry) {
      return { title: entry.title, meta: [entry.progressText, entry.nextFloorLabel, entry.tagText].filter(Boolean).join(' · ') || entry.url };
    });
    grid.appendChild(watchSection);

    var resourceSection = createEl('section', 'spx-content-recent-section');
    resourceSection.appendChild(createEl('h4', '', '资源待处理'));
    appendMyContentRecentList(resourceSection, getResourceDownloadQueueEntries(resourceEntries), '暂无待下载资源。', function formatResourceRecent(entry) {
      return { title: entry.label || entry.url, meta: [entry.sourceTitle, entry.floorLabel, entry.author].filter(Boolean).join(' · ') || entry.url };
    });
    grid.appendChild(resourceSection);

    var taskSection = createEl('section', 'spx-content-recent-section');
    taskSection.appendChild(createEl('h4', '', '任务领取'));
    appendMyContentRecentList(taskSection, taskClaimEntries, '暂无任务领取记录。', function formatTaskClaimRecent(entry) {
      return { title: entry.taskName, meta: [entry.rewardSp !== null ? ('+' + entry.rewardSp + ' SP') : '', formatShortTime(entry.completedAt)].filter(Boolean).join(' · ') };
    });
    grid.appendChild(taskSection);
    panel.appendChild(grid);
  }

  function createMyContentCenterPanel(settings, state) {
    return createCenterPanel({
      id: 'spx-content-center',
      render: function render(panel) {
        renderMyContentCenter(panel, settings, state);
      },
      onAction: function onAction(action, target, panel) {
        if (action === 'close-content-center') {
          setCenterPanelHidden(panel, true);
          return;
        }
        if (action === 'open-watch-center') {
          if (openWorkbenchPanel('spx-watch-center', settings, state)) return;
          setCenterPanelHidden(createWatchCenterPanel(settings, state), false);
          return;
        }
        if (action === 'open-history-center') {
          if (openWorkbenchPanel('spx-history-center', settings, state)) return;
          setCenterPanelHidden(createHistoryCenterPanel(settings, state), false);
          return;
        }
        if (action === 'open-resource-center') {
          if (openWorkbenchPanel('spx-resource-center', settings, state)) return;
          setCenterPanelHidden(createResourceCenterPanel(settings, state), false);
          return;
        }
        if (action === 'open-auto-buy-center') {
          if (openWorkbenchPanel('spx-auto-buy-center', settings, state)) return;
          setCenterPanelHidden(createAutoBuyCenterPanel(settings, state), false);
          return;
        }
        if (action === 'open-task-completed-page') {
          if (typeof location !== 'undefined') location.href = getTaskCompletedPageUrl() + '#spx-task-claims';
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
    refreshReadResourceRail();
    refreshReadThreadSummaryCard();
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
          setCenterPanelHidden(panel, true);
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
          if (!statusKeys.length) return;
          var nextStatus = normalizeResourceStatus(target.dataset.status);
          var statusLabel = getResourceStatusLabel(nextStatus);
          var statusEntries = getResourceEntriesByKeys(allEntries, statusKeys);
          confirmBatchAction({
            title: '批量标记资源',
            message: '将把选中的资源统一标记为“' + statusLabel + '”。',
            confirmText: '标记为' + statusLabel,
            danger: nextStatus === 'invalid',
            impacts: [{ label: '资源记录', value: statusKeys.length, note: '状态改为 ' + statusLabel }],
            items: statusEntries.map(function mapStatusConfirmItem(entry) {
              return { title: entry.label || entry.url, meta: [entry.sourceTitle, entry.floorLabel, entry.author].filter(Boolean).join(' · ') };
            }),
          }, '批量标记选中的资源？').then(function markResourcesAfterConfirm(ok) {
            if (!ok) return;
            updateResourceRecords(state, statusKeys, function markSelectedResource(record) {
              record.status = nextStatus;
            });
            saveResourceCenterState(state);
            renderResourceCenter(panel, state);
          });
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
          confirmBatchAction({
            title: '删除资源筛选结果',
            message: '将从资源工作台删除当前筛选结果。',
            confirmText: '删除筛选',
            impacts: [{ label: '资源记录', value: visibleEntries.length, note: '不可自动恢复' }],
            items: visibleEntries.map(function mapVisibleResourceConfirmItem(entry) {
              return { title: entry.label || entry.url, meta: [entry.sourceTitle, entry.floorLabel, entry.author].filter(Boolean).join(' · ') };
            }),
          }, '删除当前筛选结果中的资源？').then(function removeVisibleResourcesAfterConfirm(ok) {
            if (!ok) return;
            visibleEntries.forEach(function removeVisibleResource(entry) {
              delete state.resources[entry.key];
              delete ensureResourceSelection(panelState)[entry.key];
            });
            saveResourceCenterState(state);
            renderResourceCenter(panel, state);
          });
          return;
        }
        if (action === 'clear-resources') {
          confirmBatchAction({
            title: '清空资源工作台',
            message: '将清空全部本地资源记录，包括备注、标签和处理状态。',
            confirmText: '清空资源',
            impacts: [{ label: '资源记录', value: allEntries.length, note: '不可自动恢复' }],
            items: allEntries.map(function mapClearResourceConfirmItem(entry) {
              return { title: entry.label || entry.url, meta: entry.sourceTitle || entry.url };
            }),
          }, '清空全部资源库记录？').then(function clearResourcesAfterConfirm(ok) {
            if (!ok) return;
            state.resources = {};
            panelState.selectedResources = {};
            saveResourceCenterState(state);
            renderResourceCenter(panel, state);
          });
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
    var activeResourceFilter = 'all';
    var input = createEl('input');
    input.type = 'search';
    input.placeholder = '快速过滤：关键词、!排除、作者:用户名';
    var resourceFilters = createEl('div', 'spx-forum-resource-filters');
    var markVisibleButton = createEl('button', '', '可见已读');
    var watchVisibleButton = createEl('button', '', '可见稍后');
    var preloadNextButton = createEl('button', '', '预载下页');
    var clearButton = createEl('button', '', '清空过滤');
    tools.appendChild(input);
    tools.appendChild(resourceFilters);
    tools.appendChild(markVisibleButton);
    tools.appendChild(watchVisibleButton);
    tools.appendChild(preloadNextButton);
    tools.appendChild(clearButton);

    function getAvailableResourceFilterTypes() {
      var seen = {};
      (items || []).forEach(function collectItemResourceTypes(item) {
        (item.resourceBadgeTypes || []).forEach(function collectType(type) {
          if (getResourceBadgeDefinition(type)) seen[type] = true;
        });
      });
      return RESOURCE_BADGE_ORDER.filter(function keepAvailableType(type) {
        return !!seen[type];
      });
    }

    function syncResourceFilterButtons() {
      qsa('button[data-spx-resource-filter]', resourceFilters).forEach(function syncFilterButton(button) {
        button.classList.toggle('spx-resource-filter-active', button.dataset.spxResourceFilter === activeResourceFilter);
      });
    }

    function setResourceFilter(type) {
      activeResourceFilter = getResourceBadgeDefinition(type) ? type : 'all';
      syncResourceFilterButtons();
      applyFilter();
    }

    function createResourceFilterButton(type, label) {
      var button = createEl('button', type === activeResourceFilter ? 'spx-resource-filter-active' : '', label);
      button.type = 'button';
      button.dataset.spxResourceFilter = type;
      button.title = type === 'all' ? '显示全部资源类型' : '只看' + label + '资源主题';
      button.addEventListener('click', function applyResourceFilter(event) {
        event.preventDefault();
        setResourceFilter(type);
      });
      return button;
    }

    function renderResourceFilters() {
      var types = getAvailableResourceFilterTypes();
      resourceFilters.textContent = '';
      if (!types.length) return;
      resourceFilters.appendChild(createResourceFilterButton('all', '全部资源'));
      types.forEach(function appendResourceFilter(type) {
        resourceFilters.appendChild(createResourceFilterButton(type, getResourceBadgeDefinition(type).label));
      });
    }

    function applyFilter() {
      var parsed = parseForumFilterQuery(input.value);
      items.forEach(function toggleItem(item) {
        var textHidden = !!input.value.trim() && !matchesForumFilter(item, parsed);
        var resourceHidden = activeResourceFilter !== 'all' && (item.resourceBadgeTypes || []).indexOf(activeResourceFilter) === -1;
        setThreadRowHiddenClass(item.row, 'spx-filter-hidden', textHidden);
        setThreadRowHiddenClass(item.row, 'spx-resource-filter-hidden', resourceHidden);
      });
    }

    renderResourceFilters();
    document.addEventListener('spx-resource-filter', function handleResourceBadgeFilter(event) {
      if (!tools.isConnected) return;
      setResourceFilter(event && event.detail && event.detail.type);
    });

    input.addEventListener('input', applyFilter);
    clearButton.addEventListener('click', function clearFilter() {
      input.value = '';
      activeResourceFilter = 'all';
      syncResourceFilterButtons();
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
      var preloadPolicy = {
        mode: 'interactive',
        label: '预载下页',
        networkFriendly: isNetworkFriendlyMode(settings),
      };
      preloadNextButton.disabled = true;
      preloadNextButton.textContent = '预载中';
      requestWithPolicy(nextUrl, {
        credentials: 'include',
        cache: 'force-cache',
      }, preloadPolicy)
        .then(function readNextPage(response) {
          if (!response.ok) throw new Error('下一页加载失败');
          return readScriptResponseText(response, preloadPolicy);
        })
        .then(function showNextPageCount(html) {
          var doc = new DOMParser().parseFromString(html, 'text/html');
          var count = qsa('td[id^="td_"]', doc).length || qsa('#wall .stream li a[href*="read.php?tid"]', doc).length;
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

  function restoreModuleNavigation() {
    var nav = qs('#spx-module-nav');
    if (nav) nav.remove();
    document.documentElement.classList.remove('spx-module-nav-ready');
    qsa('.spx-module-body').forEach(function unwrapModuleBody(body) {
      var parent = body.parentNode;
      if (!parent) return;
      while (body.firstChild) {
        parent.insertBefore(body.firstChild, body);
      }
      body.remove();
    });
    qsa('.spx-module-nav-host').forEach(function restoreNavHost(host) {
      host.classList.remove('spx-module-nav-host');
    });
    qsa('.spx-module-filter-hidden').forEach(function restoreFilteredRow(row) {
      row.classList.remove('spx-module-filter-hidden');
    });
  }

  function getCompactNodeText(node, fallback) {
    if (!node) return fallback || '';
    var clone = node.cloneNode(true);
    qsa('button,input,select,textarea', clone).forEach(function removeControl(control) {
      control.remove();
    });
    return (clone.textContent || '').replace(/\s+/g, ' ').trim() || fallback || '';
  }

  function ensureModuleTargetId(node, prefix, index) {
    if (!node) return '';
    if (!node.id) node.id = 'spx-module-target-' + prefix + '-' + (index + 1);
    return node.id;
  }

  function setModuleNavActive(nav, activeItem) {
    qsa('.spx-module-nav-item', nav).forEach(function toggleActive(item) {
      item.classList.toggle('spx-active', item === activeItem);
    });
  }

  function getModuleNavigationConfigPinKey(config) {
    if (!config || !config.href) return '';
    var label = normalizeNavigationLabel(config.label || config.title);
    var baseUrl = typeof location !== 'undefined' ? location.href : 'https://south-plus.org/';
    var href = normalizeNavigationHref(config.href, baseUrl);
    if (!label || !href) return '';
    return getNavigationItemKey(config.section || '导航', label, href);
  }

  function toggleModuleNavigationPin(pinKey) {
    if (!pinKey) return;
    var pins = loadNavigationPins();
    if (pins[pinKey]) {
      delete pins[pinKey];
    } else {
      pins[pinKey] = true;
    }
    saveNavigationPins(pins);
    remountGlobalModuleNavigation();
  }

  function createModuleNavigationPin(config) {
    var pin = createEl('span', 'spx-module-nav-pin', config.pinned ? '★' : '☆');
    pin.setAttribute('role', 'button');
    pin.setAttribute('tabindex', '0');
    pin.setAttribute('aria-label', config.pinned ? '取消置顶' : '置顶导航');
    pin.title = config.pinned ? '取消置顶' : '置顶导航';
    pin.addEventListener('click', function handleModuleNavigationPinClick(event) {
      event.preventDefault();
      event.stopPropagation();
      toggleModuleNavigationPin(config.pinKey);
    });
    pin.addEventListener('keydown', function handleModuleNavigationPinKeydown(event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      toggleModuleNavigationPin(config.pinKey);
    });
    return pin;
  }

  function getModuleNavigationUsageKey(config) {
    if (!config) return '';
    var label = normalizeNavigationLabel(config.label || config.title);
    var section = normalizeNavigationLabel(config.section || '导航');
    var parentLabel = normalizeNavigationLabel(config.parentLabel || '');
    var baseUrl = typeof location !== 'undefined' ? location.href : 'https://south-plus.org/';
    var href = normalizeNavigationHref(config.href || '', baseUrl);
    if (!label || !section) return '';
    if (href) return getNavigationItemKey(section, label, href);
    if (config.panelId) return getNavigationItemKey(section, label, 'panel:' + config.panelId);
    if (config.target && config.target.id) return getNavigationItemKey(section, label, 'target:' + config.target.id);
    return getNavigationItemKey(section, label, parentLabel || label);
  }

  function rememberModuleNavigationUsage(config, options) {
    var key = getModuleNavigationUsageKey(config);
    if (!key) return null;
    var now = Date.now();
    var usage = loadNavigationUsage();
    var record = usage[key] || {};
    var clicked = !!(options && options.clicked);
    var minimumInterval = clicked ? 0 : 5 * 60 * 1000;
    if (!clicked && record.usedAt && (now - Number(record.usedAt)) < minimumInterval) return record;
    usage[key] = {
      usedAt: now,
      clickedAt: clicked ? now : Math.max(0, Number(record.clickedAt) || 0),
      hitCount: Math.min(999, Math.max(0, Math.floor(Number(record.hitCount) || 0)) + 1),
    };
    saveNavigationUsage(usage);
    return usage[key];
  }

  function rememberActiveModuleNavigationUsage(configs) {
    (configs || []).some(function rememberActiveConfig(config) {
      if (!config || !config.active) return false;
      rememberModuleNavigationUsage(config, { clicked: false });
      return true;
    });
  }

  function getModuleNavigationNumericCount(config) {
    if (!config) return 0;
    var direct = Number(config.count);
    if (isFinite(direct) && direct > 0) return direct;
    var match = String(config.countText === undefined ? '' : config.countText).match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function getNavigationRecencyScore(timestamp, now) {
    var currentTime = now === undefined ? Date.now() : Number(now);
    var time = Number(timestamp) || 0;
    if (!time || time > currentTime) return 0;
    var ageHours = (currentTime - time) / (60 * 60 * 1000);
    if (ageHours <= 1) return 90;
    if (ageHours <= 24) return 72;
    if (ageHours <= 7 * 24) return 54;
    if (ageHours <= 30 * 24) return 28;
    return 8;
  }

  function getModuleNavigationSmartScore(config, usageMap, now) {
    var data = config || {};
    var usage = usageMap || {};
    var usageKey = getModuleNavigationUsageKey(data);
    var record = usageKey ? usage[usageKey] : null;
    var score = 0;
    if (data.active) score += 100000;
    if (data.pinned || data.section === '置顶导航') score += 50000;
    if (String(data.className || '').split(/\s+/).indexOf('spx-module-nav-workbench') !== -1) score += 90;
    if (record) {
      score += getNavigationRecencyScore(Math.max(Number(record.clickedAt) || 0, Number(record.usedAt) || 0), now);
      score += Math.min(80, Math.max(0, Number(record.hitCount) || 0) * 8);
    }
    score += Math.min(60, getModuleNavigationNumericCount(data));
    return score;
  }

  function getModuleNavigationNodeSmartScore(node, usageMap, now) {
    var ownScore = node && node.config ? getModuleNavigationSmartScore(node.config, usageMap, now) : 0;
    var childScore = (node && node.children || []).reduce(function getBestChildScore(best, child) {
      return Math.max(best, getModuleNavigationNodeSmartScore(child, usageMap, now));
    }, 0);
    return Math.max(ownScore, childScore);
  }

  function sortModuleNavigationNodeList(nodes, usageMap, now) {
    return (nodes || []).map(function mapNavigationNode(node, index) {
      if (node && node.children && node.children.length) {
        node.children = sortModuleNavigationNodeList(node.children, usageMap, now);
      }
      return {
        index: index,
        order: Number(node && node.config && node.config.order) || 0,
        score: getModuleNavigationNodeSmartScore(node, usageMap, now),
        node: node,
      };
    }).sort(function sortNavigationNodes(left, right) {
      if (right.score !== left.score) return right.score - left.score;
      if (left.order !== right.order) return left.order - right.order;
      return left.index - right.index;
    }).map(function unwrapNavigationNode(item) {
      return item.node;
    });
  }

  function sortModuleNavigationTree(groups, settings, usageMap, now) {
    if (settings && settings.smartModuleNavSort === false) return groups || [];
    var usage = usageMap || loadNavigationUsage();
    return (groups || []).map(function sortNavigationGroup(group) {
      group.nodes = sortModuleNavigationNodeList(group.nodes || [], usage, now);
      return group;
    });
  }

  function getModuleNavigationSearchText(config) {
    return compactText([
      config && config.section,
      config && config.parentLabel,
      config && config.label,
      config && config.title,
    ].join(' '));
  }

  function appendModuleNavigationItem(container, config, active, level) {
    var item = createEl(config.href ? 'a' : 'button', 'spx-module-nav-item');
    item.classList.add('spx-module-nav-level-' + (level || 2));
    if (config.className) {
      String(config.className).split(/\s+/).filter(Boolean).forEach(function addNavigationClass(className) {
        item.classList.add(className);
      });
    }
    item.classList.toggle('spx-module-nav-pinned', !!config.pinned);
    if (config.href) {
      item.href = config.href;
    } else {
      item.type = 'button';
    }
    item.title = config.title || config.label || '';
    item.dataset.spxModuleNavText = getModuleNavigationSearchText(config);
    if (config.panelId && String(config.className || '').split(/\s+/).indexOf('spx-module-nav-workbench') !== -1) {
      item.dataset.spxWorkbenchNavPanel = config.panelId;
    }
    item.appendChild(createEl('span', 'spx-module-nav-label', config.label));
    if (!config.navigationOnly && (config.countText !== undefined || config.count !== undefined)) {
      item.appendChild(createEl('span', 'spx-module-nav-count', String(config.countText !== undefined ? config.countText : config.count)));
    }
    if (config.pinKey) item.appendChild(createModuleNavigationPin(config));
    item.classList.toggle('spx-active', !!active);
    item.addEventListener('click', function activateModuleNav(event) {
      var nav = item.closest ? item.closest('.spx-module-nav') : null;
      rememberModuleNavigationUsage(config, { clicked: true });
      if (String(config.className || '').split(/\s+/).indexOf('spx-module-nav-workbench') === -1) {
        hideWorkbenchPanel();
      }
      if (typeof config.onClick === 'function') {
        event.preventDefault();
        config.onClick(event);
      }
      if (nav) setModuleNavActive(nav, item);
      if (config.target && config.target.scrollIntoView) {
        config.target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    container.appendChild(item);
  }

  function filterModuleNavigation(nav, query) {
    if (!nav) return;
    var term = compactText(query).toLowerCase();
    var hiddenClass = 'spx-module-nav-search-hidden';
    qsa('.' + hiddenClass, nav).forEach(function clearPreviousSearch(node) {
      node.classList.remove(hiddenClass);
    });
    if (!term) {
      delete nav.dataset.spxModuleNavSearching;
      return;
    }
    nav.dataset.spxModuleNavSearching = '1';
    qsa('.spx-module-nav-item,.spx-module-nav-parent-title', nav).forEach(function toggleSearchItem(item) {
      var text = compactText(item.dataset.spxModuleNavText || item.textContent).toLowerCase();
      item.classList.toggle(hiddenClass, text.indexOf(term) === -1);
    });
    qsa('.spx-module-nav-node', nav).reverse().forEach(function toggleSearchNode(node) {
      var own = node.firstElementChild;
      var hasVisibleItem = qsa('.spx-module-nav-item:not(.' + hiddenClass + '),.spx-module-nav-parent-title:not(.' + hiddenClass + ')', node).length > 0;
      if (hasVisibleItem && own && own.classList && own.classList.contains(hiddenClass)) {
        own.classList.remove(hiddenClass);
      }
      node.classList.toggle(hiddenClass, !hasVisibleItem);
    });
    qsa('.spx-module-nav-group', nav).forEach(function toggleSearchGroup(group) {
      var hasVisibleNode = qsa('.spx-module-nav-node:not(.' + hiddenClass + ')', group).length > 0;
      group.classList.toggle(hiddenClass, !hasVisibleNode);
    });
  }

  function createModuleNavigationSearch(nav) {
    var controls = createEl('div', 'spx-module-nav-controls');
    var search = createEl('input', 'spx-module-nav-search');
    search.type = 'search';
    search.placeholder = '搜索导航';
    search.setAttribute('aria-label', '搜索导航');
    search.addEventListener('input', function handleModuleNavigationSearchInput() {
      filterModuleNavigation(nav, search.value);
    });
    controls.appendChild(search);
    return controls;
  }

  function createModuleNavigationTitle(title, count, smartSort) {
    var node = createEl('div', 'spx-module-nav-title');
    node.appendChild(createEl('strong', '', title || '导航中心'));
    node.appendChild(createEl('span', '', (Number(count) || 0) + ' 项' + (smartSort ? ' · 智能' : '')));
    return node;
  }

  function getModuleNavigationHost() {
    return qs('#content') || qs('#main') || qs('#wrapA');
  }

  function createModuleNavigationNode(config) {
    return {
      key: getNavigationItemKey(config.section, config.label, config.href || config.parentLabel || ''),
      label: config.label,
      config: config,
      children: [],
      childKeys: {},
    };
  }

  function dedupeModuleNavigationTree(groups) {
    var topLevelLabels = {};
    var childLabels = {};
    (groups || []).forEach(function collectTopLevelLabels(group) {
      (group.nodes || []).forEach(function collectNodeLabel(node) {
        var label = normalizeNavigationLabel(node && node.label).toLowerCase();
        if (label) topLevelLabels[label] = true;
      });
    });
    (groups || []).forEach(function pruneGroupChildren(group) {
      (group.nodes || []).forEach(function pruneNodeChildren(node) {
        node.children = (node.children || []).filter(function keepUniqueChild(child) {
          var label = normalizeNavigationLabel(child && child.label).toLowerCase();
          if (!label || topLevelLabels[label] || childLabels[label]) return false;
          childLabels[label] = true;
          return true;
        });
      });
    });
    return groups;
  }

  function buildModuleNavigationTree(configs) {
    var groups = [];
    var groupMap = {};
    (configs || []).forEach(function appendTreeConfig(config) {
      var section = config.section || '导航';
      if (!groupMap[section]) {
        groupMap[section] = {
          label: section,
          nodes: [],
          nodeMap: {},
          parentMap: {},
        };
        groups.push(groupMap[section]);
      }
      var group = groupMap[section];
      var parentLabel = normalizeNavigationLabel(config.parentLabel);
      var label = normalizeNavigationLabel(config.label);
      var labelKey = label.toLowerCase();
      if (parentLabel && parentLabel !== label) {
        var parentMapKey = parentLabel.toLowerCase();
        var parentKey = 'parent|' + parentMapKey;
        var parentNode = group.parentMap[parentMapKey] || group.nodeMap[parentKey];
        if (!parentNode) {
          parentNode = {
            key: parentKey,
            label: parentLabel,
            config: null,
            children: [],
            childKeys: {},
          };
          group.nodeMap[parentKey] = parentNode;
          group.parentMap[parentMapKey] = parentNode;
          group.nodes.push(parentNode);
        }
        var childKey = label.toLowerCase();
        if (parentNode.childKeys[childKey] === undefined) {
          parentNode.childKeys[childKey] = parentNode.children.length;
          parentNode.children.push(createModuleNavigationNode(config));
        } else {
          var childIndex = parentNode.childKeys[childKey];
          parentNode.children[childIndex] = createModuleNavigationNode(
            Object.assign({}, parentNode.children[childIndex].config || {}, config)
          );
        }
        return;
      }

      var key = getNavigationItemKey(section, label, config.href || label);
      var existingParentNode = group.parentMap[labelKey];
      if (existingParentNode) {
        existingParentNode.config = Object.assign({}, existingParentNode.config || {}, config);
        existingParentNode.label = label;
        group.nodeMap[key] = existingParentNode;
        return;
      }
      if (group.nodeMap[key]) {
        group.nodeMap[key].config = Object.assign({}, group.nodeMap[key].config || {}, config);
        if (!group.parentMap[labelKey]) group.parentMap[labelKey] = group.nodeMap[key];
        return;
      }
      group.nodeMap[key] = createModuleNavigationNode(config);
      group.parentMap[labelKey] = group.nodeMap[key];
      group.nodes.push(group.nodeMap[key]);
    });
    return dedupeModuleNavigationTree(groups);
  }

  function appendModuleNavigationNode(nav, parent, node, hasActive, state) {
    var wrapper = createEl('div', 'spx-module-nav-node');
    var active = !!(node.config && node.config.active);
    if (node.config) {
      appendModuleNavigationItem(wrapper, node.config, active || (!hasActive && state.index === 0), node.children.length ? 2 : 2);
      state.index += 1;
    } else {
      var parentTitle = createEl('div', 'spx-module-nav-parent-title', node.label);
      parentTitle.dataset.spxModuleNavText = compactText(node.label);
      wrapper.appendChild(parentTitle);
    }
    if (node.children.length) {
      var children = createEl('div', 'spx-module-nav-children');
      node.children.forEach(function appendChildNavigation(childNode) {
        appendModuleNavigationItem(children, childNode.config, !!childNode.config.active, 3);
        state.index += 1;
      });
      wrapper.appendChild(children);
    }
    parent.appendChild(wrapper);
  }

  function setModuleNavigationGroupCollapsed(groupNode, button, label, collapsed) {
    if (!groupNode || !button) return;
    groupNode.classList.toggle('spx-module-nav-collapsed', !!collapsed);
    button.setAttribute('aria-expanded', String(!collapsed));
    button.title = (collapsed ? '展开 ' : '折叠 ') + label;
  }

  function appendModuleNavigationSection(groupNode, label, collapseState) {
    var button = createEl('button', 'spx-module-nav-section', label);
    var key = getModuleNavigationGroupKey(label);
    var collapsed = isModuleNavigationGroupCollapsed(collapseState, label);
    button.type = 'button';
    button.dataset.spxModuleNavGroup = key;
    setModuleNavigationGroupCollapsed(groupNode, button, label, collapsed);
    button.addEventListener('click', function toggleModuleNavigationGroup() {
      var nextCollapsed = !isModuleNavigationGroupCollapsed(collapseState, label);
      if (nextCollapsed) {
        collapseState[key] = true;
      } else {
        delete collapseState[key];
      }
      saveNavigationCollapseState(collapseState);
      setModuleNavigationGroupCollapsed(groupNode, button, label, nextCollapsed);
    });
    groupNode.appendChild(button);
  }

  function mountModuleNavigation(title, configs, settings) {
    restoreModuleNavigation();
    var content = getModuleNavigationHost();
    var navSettings = normalizeSettings(settings);
    var visibleConfigs = (configs || []).filter(function keepModuleConfig(config) {
      return config && config.label && (
        config.count ||
        config.count === 0 ||
        config.countText !== undefined ||
        config.alwaysShow ||
        config.href ||
        config.onClick ||
        config.target
      );
    });
    if (!content || !visibleConfigs.length) return null;

    var nav = createEl('nav', 'spx-module-nav');
    nav.id = 'spx-module-nav';
    nav.dataset.spxModuleNavSort = navSettings.smartModuleNavSort === false ? 'default' : 'smart';
    nav.setAttribute('aria-label', title || '导航中心');
    nav.appendChild(createModuleNavigationTitle(title || '导航中心', visibleConfigs.length, navSettings.smartModuleNavSort !== false));
    nav.appendChild(createModuleNavigationSearch(nav));
    var hasActive = visibleConfigs.some(function hasActiveConfig(config) {
      return !!config.active;
    });
    var state = { index: 0 };
    rememberActiveModuleNavigationUsage(visibleConfigs);
    var groups = sortModuleNavigationTree(buildModuleNavigationTree(visibleConfigs), navSettings);
    var collapseState = applyInitialModuleNavigationCollapseState(groups, loadNavigationCollapseState());
    groups.forEach(function appendGroup(group) {
      var groupNode = createEl('div', 'spx-module-nav-group');
      appendModuleNavigationSection(groupNode, group.label, collapseState);
      group.nodes.forEach(function appendNode(node) {
        appendModuleNavigationNode(nav, groupNode, node, hasActive, state);
      });
      nav.appendChild(groupNode);
    });
    var body = createEl('div', 'spx-module-body');
    while (content.firstChild) {
      body.appendChild(content.firstChild);
    }
    content.classList.add('spx-module-nav-host');
    content.appendChild(nav);
    content.appendChild(body);
    document.documentElement.classList.add('spx-module-nav-ready');
    return nav;
  }

  function queueModuleNavigationConfigs(configs) {
    var nextConfigs = configs || [];
    pendingModuleNavigationConfigs = pendingModuleNavigationConfigs.concat(nextConfigs);
    rememberModuleNavigationConfigs(nextConfigs);
  }

  function getHomeNavigationBaseUrl(origin) {
    return String(origin || location.origin || '') + '/index.php';
  }

  function getSeedModuleNavigationConfigs(origin) {
    var homeUrl = getHomeNavigationBaseUrl(origin);
    return [
      { label: '漫区特设', href: homeUrl + '#spx-module-target-home-1', order: 10 },
      { label: '蜜柑计划', href: homeUrl + '#spx-module-target-home-2', order: 20 },
      { label: '综合交流', href: homeUrl + '#spx-module-target-home-3', order: 30 },
      { label: '人民囧府', href: homeUrl + '#spx-module-target-home-4', order: 40 },
    ].map(function mapSeedNavigation(item) {
      return {
        section: '子栏目',
        label: item.label,
        href: item.href,
        title: item.label,
        alwaysShow: true,
        navigationOnly: true,
        order: item.order,
      };
    });
  }

  function rememberModuleNavigationConfigs(configs) {
    var source = configs || [];
    if (!source.length) return false;
    var pool = loadNavigationPool();
    var changed = false;
    var now = Date.now();
    var baseUrl = typeof location !== 'undefined' ? location.href : '';
    var maxOrder = Object.keys(pool).reduce(function getMaxOrder(max, key) {
      return Math.max(max, Number(pool[key] && pool[key].order) || 0);
    }, 0);
    source.forEach(function rememberConfig(config, index) {
      var normalized = normalizePersistentNavigationConfig(config, baseUrl, maxOrder + index + 1);
      if (!normalized) return;
      if (!isPersistentNavigationSection(normalized.section)) return;
      normalized.updatedAt = now;
      var key = getNavigationItemKey(normalized.section, normalized.label, normalized.href);
      var existing = pool[key];
      if (existing) {
        normalized.order = existing.order || normalized.order;
      }
      if (!existing || JSON.stringify(existing) !== JSON.stringify(normalized)) {
        pool[key] = normalized;
        changed = true;
      }
    });
    if (changed) saveNavigationPool(pool);
    return changed;
  }

  function getPersistentModuleNavigationConfigs() {
    var sectionOrder = {
      子栏目: 1,
      版块导航: 2,
    };
    var pool = loadNavigationPool();
    var poolItems = Object.keys(pool).map(function mapPoolItem(key) {
      return pool[key];
    }).filter(function keepPersistentPoolSection(item) {
      return item && isPersistentNavigationSection(item.section);
    });
    return getSeedModuleNavigationConfigs(location.origin)
      .concat(poolItems)
      .map(function mapPersistentNavigation(item) {
        return {
          section: item.section || '子栏目',
          parentLabel: item.parentLabel || '',
          label: item.label,
          href: item.href,
          title: item.title || item.label,
          className: item.className || 'spx-module-nav-persisted',
          active: isModuleNavigationConfigActive(item, location.href),
          alwaysShow: true,
          navigationOnly: true,
          order: Number(item.order) || 0,
          updatedAt: Number(item.updatedAt) || 0,
        };
      })
      .sort(function sortPersistentNavigation(left, right) {
        var leftSection = sectionOrder[left.section] || 99;
        var rightSection = sectionOrder[right.section] || 99;
        if (leftSection !== rightSection) return leftSection - rightSection;
        return (left.order || 0) - (right.order || 0) || String(left.label).localeCompare(String(right.label));
      });
  }

  function mergeModuleNavigationConfigs(configs) {
    var result = [];
    var positions = {};
    (configs || []).forEach(function mergeNavigationConfig(config) {
      if (!config || !config.label) return;
      var label = normalizeNavigationLabel(config.label);
      if (!shouldKeepNavigationLabel(label, { allowForumViewSwitch: !!config.allowForumViewSwitch })) return;
      var href = normalizeNavigationHref(config.href || '', location.href);
      var section = config.section || '';
      var parentLabel = normalizeNavigationLabel(config.parentLabel || '');
      var key = [section, parentLabel, label, (href || '').replace(/#.*$/, '') || config.target || config.onClick || result.length].join('|');
      var nextConfig = Object.assign({}, config, {
        parentLabel: parentLabel,
        label: label,
        href: href || config.href,
        active: !!config.active || isModuleNavigationConfigActive(Object.assign({}, config, { href: href || config.href }), location.href),
        alwaysShow: config.alwaysShow !== false,
        navigationOnly: config.navigationOnly !== false,
      });
      if (positions[key] !== undefined) {
        result[positions[key]] = Object.assign({}, result[positions[key]], nextConfig);
        return;
      }
      positions[key] = result.length;
      result.push(nextConfig);
    });
    return result;
  }

  function getPinnedModuleNavigationClassName(config) {
    var classNames = String(config && config.className || '').split(/\s+/).filter(Boolean);
    if (classNames.indexOf('spx-module-nav-pinned') === -1) classNames.push('spx-module-nav-pinned');
    return classNames.join(' ');
  }

  function withPinnedModuleNavigationConfigs(configs) {
    var pins = loadNavigationPins();
    var pinnedConfigs = [];
    var sourceConfigs = (configs || []).map(function markPinnedNavigationConfig(config) {
      var pinKey = getModuleNavigationConfigPinKey(config);
      var pinned = !!(pinKey && pins[pinKey]);
      var nextConfig = Object.assign({}, config, {
        pinKey: pinKey,
        pinned: pinned,
      });
      if (pinned && nextConfig.href) {
        pinnedConfigs.push(Object.assign({}, nextConfig, {
          section: '置顶导航',
          parentLabel: '',
          title: (nextConfig.title || nextConfig.label) + ' · 置顶',
          className: getPinnedModuleNavigationClassName(nextConfig),
          active: !!nextConfig.active,
          alwaysShow: true,
          navigationOnly: true,
        }));
      }
      return nextConfig;
    });
    return pinnedConfigs.concat(sourceConfigs);
  }

  function collectHomeNavigationConfigsFromDocument(root, pageUrl) {
    var baseUrl = normalizeNavigationHref(pageUrl || getHomeNavigationBaseUrl(location.origin), location.href);
    return qsa('#content .t[id^="t_"]', root).map(function mapHomeDocumentModule(module, index) {
      var header = qs('.h', module) || qs('h2', module);
      var moduleId = module.id || 'spx-module-target-home-' + (index + 1);
      return {
        section: '子栏目',
        label: getCompactNodeText(header, '模块 ' + (index + 1)).slice(0, 18),
        href: baseUrl.replace(/#.*$/, '') + '#' + moduleId,
        title: getCompactNodeText(header, '模块 ' + (index + 1)).slice(0, 18),
        alwaysShow: true,
        navigationOnly: true,
      };
    });
  }

  function collectForumNavigationConfigsFromDocument(root, pageUrl) {
    var currentFid = getCurrentForumId(pageUrl || location.href);
    var seen = {};
    var configs = [];
    qsa('a[href*="thread.php?fid"]', root).forEach(function collectFetchedForumLink(link) {
      if (!isUsefulForumNavigationLink(link, currentFid)) return;
      var href = normalizeNavigationHref(link.getAttribute('href') || link.href, pageUrl || location.href);
      var fid = getCurrentForumId(href);
      var label = normalizeNavigationLabel(link.textContent);
      var parentLabel = getForumNavigationParentLabel(link);
      var key = [parentLabel, fid || href].join('|');
      if (!label || !href || seen[key]) return;
      seen[key] = true;
      configs.push({
        section: '子栏目',
        parentLabel: parentLabel,
        label: label,
        href: href,
        title: label,
        alwaysShow: true,
        navigationOnly: true,
      });
    });
    return configs;
  }

  function collectRemoteNavigationConfigsFromHtml(html, pageUrl) {
    if (!html || typeof DOMParser === 'undefined') return [];
    var doc = new DOMParser().parseFromString(html, 'text/html');
    return collectHomeNavigationConfigsFromDocument(doc, pageUrl)
      .concat(collectForumNavigationConfigsFromDocument(doc, pageUrl));
  }

  function getNavigationDiscoveryUrls() {
    var seen = {};
    function append(url) {
      var href = normalizeNavigationHref(url, location.href).replace(/#.*$/, '');
      try {
        if (!href || seen[href] || new URL(href, location.href).origin !== location.origin) return;
      } catch (error) {
        return;
      }
      seen[href] = true;
    }
    append(getHomeNavigationBaseUrl(location.origin));
    if (detectPageType(location.href) === 'forum') append(location.href);
    qsa('.bdbA a[href*="thread.php?fid"], #breadcrumbs a[href*="thread.php?fid"], .crumbs-item[href*="thread.php?fid"], .crumbs-item a[href*="thread.php?fid"]').forEach(function collectCrumbDiscoveryUrl(link) {
      append(link.href || link.getAttribute('href'));
    });
    return Object.keys(seen).slice(0, 4);
  }

  function remountGlobalModuleNavigation() {
    var settings = loadSettings();
    mountModuleNavigation('导航中心', getAllModuleNavigationConfigs(settings, getWorkbenchState()), settings);
  }

  function scheduleNavigationPoolRefresh(settings) {
    if (testMode || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
    var urls = getNavigationDiscoveryUrls();
    if (isNetworkFriendlyMode(settings)) {
      urls = urls.slice(0, 2);
      if (!shouldRefreshNavigationPool(urls)) return;
    }
    var refreshKey = urls.join('|');
    if (!urls.length || document.documentElement.dataset.spxNavigationRefreshKey === refreshKey) return;
    document.documentElement.dataset.spxNavigationRefreshKey = refreshKey;
    var navigationPolicy = {
      mode: 'background',
      label: '导航中心后台刷新',
      networkFriendly: isNetworkFriendlyMode(settings),
    };
    var navigationRateLimited = false;
    urls.reduce(function chainNavigationFetch(chain, url) {
      return chain.then(function fetchNavigationUrl(results) {
        return requestWithPolicy(url, {
          credentials: 'include',
          cache: 'force-cache',
        }, navigationPolicy)
          .then(function readNavigationResponse(response) {
            if (!response.ok) return '';
            return readScriptResponseText(response, navigationPolicy);
          })
          .then(function collectFetchedNavigation(html) {
            results.push(collectRemoteNavigationConfigsFromHtml(html, url));
            return results;
          })
          .catch(function ignoreNavigationFetchFailure(error) {
            if (error && error.spxRateLimited) navigationRateLimited = true;
            results.push([]);
            return results;
          });
      });
    }, Promise.resolve([])).then(function applyFetchedNavigation(results) {
      var configs = [];
      results.forEach(function concatNavigationItems(items) {
        configs = configs.concat(items || []);
      });
      if (!navigationRateLimited) rememberNavigationPoolRefresh(urls);
      if (rememberModuleNavigationConfigs(configs)) remountGlobalModuleNavigation();
    });
  }

  function createHomeModuleNavigation(modules) {
    var configs = (modules || []).map(function mapHomeModule(module, index) {
      var header = qs('.h', module) || qs('h2', module);
      var id = ensureModuleTargetId(module, 'home', index);
      var label = getCompactNodeText(header, '模块 ' + (index + 1)).slice(0, 18);
      return {
        section: '子栏目',
        label: label,
        href: getHomeNavigationBaseUrl(location.origin) + '#' + id,
        title: label,
        target: module,
        alwaysShow: true,
        navigationOnly: true,
      };
    });
    queueModuleNavigationConfigs(configs);
  }

  function getForumBoardTitle() {
    var currentCrumb = qs('.bdbA .crumbs-item.current');
    var title = getCompactNodeText(currentCrumb, '').replace(/\[.*?\]/g, '').trim();
    if (title) return title.slice(0, 24);
    var documentTitle = (document.title || '').replace(/\s*[-|].*$/, '').trim();
    return documentTitle || '全部主题';
  }

  function getForumPostLinkConfig(root, fid) {
    var currentFid = String(fid || getCurrentForumId(location.href) || '').replace(/\D/g, '');
    if (!currentFid) return null;
    var scope = root || document;
    var postPattern = new RegExp('post\\.php\\?fid[-=]' + currentFid + '(?:\\.html|$|[&#])', 'i');
    var baseUrl = typeof location !== 'undefined' && location.href ? location.href : 'https://south-plus.org/';
    var links = qsa('a[href*="post.php?fid"]', scope);
    for (var index = 0; index < links.length; index += 1) {
      var rawHref = links[index].getAttribute('href') || links[index].href || '';
      if (!rawHref || /special[-=]/i.test(rawHref) || !postPattern.test(rawHref)) continue;
      var href = normalizeNavigationHref(rawHref, baseUrl);
      if (!href) continue;
      var image = links[index] && typeof links[index].querySelector === 'function' ? qs('img', links[index]) : null;
      var imageSrc = image && normalizeNavigationHref(image.getAttribute('src') || image.src || '', baseUrl);
      var config = { label: '发布新帖', href: href, title: '在当前版块发布新帖' };
      if (imageSrc) config.imageSrc = imageSrc;
      return config;
    }
    return null;
  }

  function createForumSectionTitle(items, target) {
    var table = target && target.closest ? target.closest('.spx-thread-list-table') || target : target;
    if (!table || !table.parentNode) return null;
    qsa('.spx-forum-section-title').forEach(function removeOldTitle(node) {
      node.remove();
    });
    var title = createEl('div', 'spx-forum-section-title');
    var main = createEl('div', 'spx-forum-section-main');
    var currentFid = getCurrentForumId(location.href);
    var postConfig = getForumPostLinkConfig(document, currentFid);
    var galleryConfig = collectForumViewNavigationConfigs(table ? [table, document] : [document], currentFid)[0];
    main.appendChild(createEl('strong', '', getForumBoardTitle()));
    main.appendChild(createEl('span', '', '当前定位 · ' + (items ? items.length : 0) + ' 个帖子'));
    title.appendChild(main);
    var actions = createEl('div', 'spx-forum-section-actions');
    if (postConfig && postConfig.href) {
      var postLink = createEl('a', 'spx-forum-post-link', postConfig.imageSrc ? '' : (postConfig.label || '发布新帖'));
      postLink.href = postConfig.href;
      postLink.title = postConfig.title || '发布新帖';
      if (postConfig.imageSrc) {
        var postImage = createEl('img');
        postImage.src = postConfig.imageSrc;
        postImage.alt = postConfig.label || '发布新帖';
        postLink.appendChild(postImage);
      }
      actions.appendChild(postLink);
    }
    if (galleryConfig && galleryConfig.href) {
      var galleryLink = createEl('a', 'spx-forum-gallery-link', galleryConfig.label || '图墙模式');
      galleryLink.href = galleryConfig.href;
      if (galleryConfig.label === '列表模式') galleryLink.classList.add('spx-forum-list-link');
      galleryLink.title = galleryConfig.title || (galleryConfig.label === '列表模式' ? '切换回列表模式' : '点击进入图墙模式');
      actions.appendChild(galleryLink);
    }
    if (actions.childNodes.length) title.appendChild(actions);
    table.parentNode.insertBefore(title, table);
    return title;
  }

  function compactForumPrelude(threadTable) {
    var table = threadTable && threadTable.closest ? threadTable.closest('.spx-thread-list-table') || threadTable : threadTable;
    var content = qs('#content') || qs('#main');
    if (!content || !table) return;
    var node = content.firstElementChild;
    while (node && node !== table) {
      var next = node.nextElementSibling;
      if (
        node.id !== 'spx-forum-tools' &&
        !node.classList.contains('spx-forum-section-title') &&
        !node.classList.contains('spx-module-nav')
      ) {
        node.classList.add('spx-forum-prelude-hidden');
      }
      node = next;
    }
  }

  function getForumNavigationScopeNodes(threadTable) {
    var content = qs('#content') || qs('#main');
    if (!content) return [];
    if (!threadTable) return [content];
    var nodes = [];
    var node = content.firstElementChild;
    while (node && node !== threadTable) {
      if (
        node.id !== 'spx-forum-tools' &&
        !node.classList.contains('spx-forum-section-title') &&
        !node.classList.contains('spx-module-nav')
      ) {
        nodes.push(node);
      }
      node = node.nextElementSibling;
    }
    return nodes;
  }

  function normalizeNavigationLabel(text) {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .replace(/\s*\(\d+\)\s*$/, '')
      .trim();
  }

  function getCommonForumNavigationLabelByFid() {
    return {
      9: '茶馆',
      48: '询问&求物',
      13: '免空资源区',
      128: '同人音声',
      221: 'GALGAME汉化区',
      208: 'AI交流',
    };
  }

  function getCanonicalForumNavigationLabel(label, href) {
    var fid = getCurrentForumId(href);
    var fidMap = getCommonForumNavigationLabelByFid();
    return fid && fidMap[fid] ? fidMap[fid] : '';
  }

  function isGlobalSiteNavigationTarget(label, href) {
    var normalized = normalizeNavigationLabel(label);
    var fid = getCurrentForumId(href);
    var fidMap = getCommonForumNavigationLabelByFid();
    if (fid && fidMap[fid] && normalizeNavigationLabel(fidMap[fid]) === normalized) return true;
    return normalized === '最新帖子' && /search2?\.php/.test(String(href || '')) && /newatc/.test(String(href || ''));
  }

  function getHomeNavigationParentLabel(link) {
    var module = link && link.closest ? link.closest('.spx-home-module,.t[id^="t_"]') : null;
    if (!module) return '';
    var header = qs('.h', module) || qs('h2', module);
    return normalizeNavigationLabel(getCompactNodeText(header, '')).slice(0, 32);
  }

  function getForumNavigationParentLabel(link) {
    var ownLabel = normalizeNavigationLabel(link && link.textContent);
    var row = link && link.closest ? link.closest('tr') : null;
    var isRowTitle = false;
    var selectors = [
      'a[id^="a_ajax_"]',
      '[id^="fn_"] h3 a',
      '[id^="fn_"] > a',
      '[id^="fn_"] a[href*="thread.php?fid"]',
    ];
    if (row) {
      for (var index = 0; index < selectors.length; index += 1) {
        var candidate = qs(selectors[index], row);
        var label = normalizeNavigationLabel(candidate && candidate.textContent);
        if (label && label === ownLabel) isRowTitle = true;
        if (label && label !== ownLabel) return label.slice(0, 32);
      }
    }
    if (isRowTitle) return '';
    var homeParent = getHomeNavigationParentLabel(link);
    if (homeParent && homeParent !== ownLabel) return homeParent;
    return '';
  }

  function isUsefulForumNavigationLink(link, currentFid) {
    if (!link) return false;
    var href = String(link.getAttribute('href') || link.href || '');
    var label = normalizeNavigationLabel(link.textContent);
    if (!href || !/thread\.php\?fid[=-]?\d+/.test(href)) return false;
    if (/skinco|page-\d+|search|rss/i.test(href)) return false;
    if (!shouldKeepNavigationLabel(label) || label.length > 28) return false;
    if (/^(折叠|展开|版块|最后发表|主题\/文章|版主|上一页|下一页|首页)$/.test(label)) return false;
    if (isGlobalSiteNavigationTarget(label, href)) return false;
    return getCurrentForumId(href) !== String(currentFid || '');
  }

  function getForumViewNavigationLabel(label) {
    var normalized = normalizeNavigationLabel(label);
    return /图墙模式/.test(normalized) ? '图墙模式' : normalized;
  }

  function appendForumViewNavigationConfig(configs, seen, label, href, title, active) {
    var normalizedLabel = normalizeNavigationLabel(label);
    var normalizedHref = normalizeNavigationHref(href, location.href);
    var key = normalizedHref.replace(/#.*$/, '');
    if (!normalizedLabel || !normalizedHref || seen[key]) return;
    seen[key] = true;
    configs.push({
      section: '版块导航',
      parentLabel: getForumBoardTitle(),
      label: normalizedLabel,
      href: normalizedHref,
      title: normalizeNavigationLabel(title) || normalizedLabel,
      className: 'spx-module-nav-forum-view',
      active: !!active,
      alwaysShow: true,
      navigationOnly: true,
      transient: true,
      allowForumViewSwitch: true,
    });
  }

  function isForumGalleryModeLink(link, currentFid) {
    if (!link) return false;
    var href = String(link.getAttribute('href') || link.href || '');
    var label = normalizeNavigationLabel(link.textContent);
    var fid = getCurrentForumId(href);
    if (!href || !isForumGalleryModeUrl(href) || !/图墙模式/.test(label)) return false;
    return !currentFid || !fid || fid === String(currentFid);
  }

  function collectForumViewNavigationConfigs(scopeNodes, currentFid) {
    var configs = [];
    var seen = {};
    if (isForumGalleryModeUrl(location.href)) {
      appendForumViewNavigationConfig(configs, seen, '列表模式', getForumListModeUrl(location.href), '切换回列表模式', false);
    }
    (scopeNodes || []).forEach(function collectForumViewLinks(scope) {
      qsa('a[href*="thread_new.php"]', scope).forEach(function appendForumViewLink(link) {
        if (!isForumGalleryModeLink(link, currentFid)) return;
        var href = normalizeNavigationHref(link.getAttribute('href') || link.href, location.href);
        var label = getForumViewNavigationLabel(link.textContent);
        appendForumViewNavigationConfig(configs, seen, label, href, normalizeNavigationLabel(link.textContent) || label, isForumGalleryModeUrl(location.href));
      });
    });
    return configs;
  }

  function getCurrentForumViewNavigationConfigs() {
    if (detectPageType(location.href) !== 'forum') return [];
    return collectForumViewNavigationConfigs([document], getCurrentForumId(location.href));
  }

  function createForumModuleNavigation(items) {
    if (!items || !items.length) return;
    var listRoot = items[0].row && items[0].row.closest ? items[0].row.closest('.spx-thread-list-table') || items[0].row.closest('#wall') : null;
    var currentFid = getCurrentForumId(location.href);
    var seen = {};
    var configs = [];
    var scopeNodes = getForumNavigationScopeNodes(listRoot);
    scopeNodes.forEach(function collectForumNavLinks(scope) {
      qsa('a[href*="thread.php?fid"]', scope).forEach(function appendForumNavLink(link) {
        if (!isUsefulForumNavigationLink(link, currentFid)) return;
        var href = link.href || link.getAttribute('href');
        var fid = getCurrentForumId(href);
        var label = normalizeNavigationLabel(link.textContent);
        var parentLabel = getForumNavigationParentLabel(link);
        var key = [parentLabel, fid || href].join('|');
        if (seen[key]) return;
        seen[key] = true;
        configs.push({
          section: '子栏目',
          parentLabel: parentLabel,
          label: label,
          href: href,
          title: label,
          alwaysShow: true,
          navigationOnly: true,
        });
      });
    });
    configs = configs.concat(collectForumViewNavigationConfigs(scopeNodes.concat(listRoot ? [listRoot] : []), currentFid));
    queueModuleNavigationConfigs(configs);
  }

  function getCommonForumNavigationItems(origin) {
    var base = String(origin || location.origin || '');
    return [
      { label: '首页', href: base + '/index.php' },
      { label: '茶馆', fid: '9' },
      { label: '询问&求物', fid: '48' },
      { label: '免空资源区', fid: '13' },
      { label: '同人音声', fid: '128' },
      { label: 'GALGAME汉化区', fid: '221' },
      { label: 'AI交流', fid: '208' },
      { label: '最新帖子', href: base + '/search2.php?orderway-postdate-asc-desc-newatc-1.html' },
    ].map(function buildForumNavigationItem(item) {
      if (item.href) return item;
      return {
        label: item.label,
        fid: item.fid,
        href: base + '/thread.php?fid-' + item.fid + '.html',
      };
    });
  }

  function getCurrentForumId(url) {
    var text = String(url || '');
    var match = text.match(/fid[=-](\d+)/) || text.match(/fid-(\d+)/);
    return match ? match[1] : '';
  }

  function getNavigationComparableUrl(href, baseUrl, includeHash) {
    if (!href || /^javascript:/i.test(String(href))) return '';
    try {
      var parsed = new URL(String(href), baseUrl || location.href);
      return parsed.origin + parsed.pathname + parsed.search + (includeHash ? parsed.hash : '');
    } catch (error) {
      return '';
    }
  }

  function isModuleNavigationConfigActive(config, url) {
    var href = config && config.href;
    if (!href) return false;
    var currentUrl = String(url || (typeof location !== 'undefined' ? location.href : ''));
    var includeHash = String(href).indexOf('#') !== -1;
    var targetKey = getNavigationComparableUrl(href, currentUrl, includeHash);
    var currentKey = getNavigationComparableUrl(currentUrl, currentUrl, includeHash);
    if (targetKey && currentKey && targetKey === currentKey) return true;
    if (includeHash) return false;
    var currentFid = getCurrentForumId(currentUrl);
    var targetFid = getCurrentForumId(href);
    if (isForumGalleryModeUrl(currentUrl) || isForumGalleryModeUrl(href)) {
      return !!(currentFid && targetFid && currentFid === targetFid && isForumGalleryModeUrl(currentUrl) === isForumGalleryModeUrl(href));
    }
    return !!(currentFid && targetFid && currentFid === targetFid);
  }

  function isCommonNavigationActive(item, url) {
    var text = String(url || '');
    if (item.fid) return getCurrentForumId(text) === String(item.fid);
    return item.label === '最新帖子' && isModuleNavigationConfigActive(item, url);
  }

  function getGlobalSiteNavigationConfigs(url) {
    return getCommonForumNavigationItems(location.origin).map(function mapSiteNavigation(item) {
      return {
        section: '站点导航',
        label: item.label,
        href: item.href,
        title: item.label,
        className: 'spx-module-nav-site',
        active: isCommonNavigationActive(item, url),
        alwaysShow: true,
        navigationOnly: true,
      };
    });
  }

  function getReadPageNavigationConfigs() {
    if (detectPageType(location.href) !== 'read') return [];
    var configs = [];
    var seen = {};
    function appendConfig(section, label, href, options) {
      var normalized = normalizeNavigationLabel(label);
      var url = String(href || '');
      if (!normalized || !url || /^javascript:/i.test(url)) return;
      var key = section + '|' + normalized + '|' + url.replace(/#.*$/, '');
      if (seen[key]) return;
      seen[key] = true;
      var config = {
        section: section,
        label: normalized,
        href: url,
        title: normalized,
        alwaysShow: true,
        navigationOnly: true,
      };
      if (options && options.active) config.active = true;
      if (options && options.className) config.className = options.className;
      configs.push(config);
    }

    var crumbSeen = {};
    var crumbLinks = [];
    qsa('.bdbA a[href*="thread.php?fid"], #breadcrumbs a[href*="thread.php?fid"], .crumbs-item[href*="thread.php?fid"], .crumbs-item a[href*="thread.php?fid"], .breadcrumbs a[href*="thread.php?fid"], #breadCrumb a[href*="thread.php?fid"]').forEach(function collectReadCrumb(link) {
      var label = normalizeNavigationLabel(link.textContent);
      var href = link.href || link.getAttribute('href');
      var fid = getCurrentForumId(href);
      var key = fid || href;
      if (!label || !href || !key || crumbSeen[key]) return;
      if (/^(南\+ South Plus|首页)$/.test(label)) return;
      crumbSeen[key] = true;
      crumbLinks.push({ label: label, href: href });
    });
    crumbLinks.forEach(function appendReadCrumb(item, index) {
      appendConfig('当前位置', item.label, item.href, {
        active: index === crumbLinks.length - 1,
        className: 'spx-module-nav-current',
      });
    });
    rememberModuleNavigationConfigs(crumbLinks.map(function mapReadCrumbToPersistentNav(item) {
      return {
        section: '子栏目',
        label: item.label,
        href: item.href,
        title: item.label,
        alwaysShow: true,
        navigationOnly: true,
      };
    }));

    var topicSeen = {};
    qsa('a[href]').forEach(function collectTopicNavigation(link) {
      var rawLabel = normalizeNavigationLabel(link.textContent);
      var label = '';
      if (/上一主题/.test(rawLabel)) label = '上一主题';
      if (/下一主题/.test(rawLabel)) label = '下一主题';
      if (!label || topicSeen[label]) return;
      var href = link.href || link.getAttribute('href');
      if (!href || /^javascript:/i.test(href)) return;
      topicSeen[label] = true;
      appendConfig('主题导航', label, href, {
        className: 'spx-module-nav-topic',
      });
    });
    return configs;
  }

  function getSearchPageNavigationConfigs() {
    if (detectPageType(location.href) !== 'search') return [];
    var isLatest = /search2?\.php/.test(String(location.href || '')) && /newatc/.test(String(location.href || ''));
    return [{
      section: '站点导航',
      label: '搜索',
      href: location.origin + '/search.php',
      title: '搜索',
      className: 'spx-module-nav-search-page',
      active: !isLatest,
      alwaysShow: true,
      navigationOnly: true,
    }];
  }

  function getProfilePageNavigationConfigs() {
    if (!shouldUseProfilePage(location.href)) return [];
    var uid = extractAccountUserId(document, location.href);
    if (!uid) return [];
    var activeKey = getAccountActiveKey(location.href);
    return getAccountTabItems(uid, location.origin).map(function mapProfileListNav(item) {
      var label = item.key === 'topic' ? '我的主题' : (item.key === 'post' ? '我的回复' : item.label);
      return {
        section: '个人导航',
        label: label,
        href: item.href,
        title: label,
        className: 'spx-module-nav-profile',
        active: item.key === activeKey,
        alwaysShow: true,
        navigationOnly: true,
      };
    });
  }

  function getTaskPageNavigationConfigs() {
    if (!shouldUseTaskPage(location.href)) return [];
    return [{
      section: '站点导航',
      label: '社区论坛任务',
      href: location.origin + '/plugin.php?H_name-tasks.html',
      title: '社区论坛任务',
      className: 'spx-module-nav-task',
      active: true,
      alwaysShow: true,
      navigationOnly: true,
    }];
  }

  function getAllModuleNavigationConfigs(settings, state) {
    return withPinnedModuleNavigationConfigs(mergeModuleNavigationConfigs(
      getGlobalSiteNavigationConfigs(location.href)
        .concat(getPersistentModuleNavigationConfigs())
        .concat(getWorkbenchNavigationConfigs(settings, state))
        .concat(getSearchPageNavigationConfigs())
        .concat(getProfilePageNavigationConfigs())
        .concat(getTaskPageNavigationConfigs())
        .concat(getCurrentForumViewNavigationConfigs())
        .concat(getReadPageNavigationConfigs())
        .concat(pendingModuleNavigationConfigs)
    ));
  }

  function createGlobalModuleNavigation(settings, state) {
    if (!shouldUseModuleNavigation(settings, location.href, document)) return;
    mountModuleNavigation('导航中心', getAllModuleNavigationConfigs(settings, state), settings);
    scheduleNavigationPoolRefresh(settings);
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
    if (!panel) return;
    if (panel.spxPreviewImageTimer && typeof window !== 'undefined' && typeof window.clearTimeout === 'function') {
      window.clearTimeout(panel.spxPreviewImageTimer);
      panel.spxPreviewImageTimer = null;
    }
    panel.remove();
  }

  function getThreadPreviewUrl(info) {
    return String(info && info.titleLink && info.titleLink.href || info && info.url || '');
  }

  function getThreadPreviewMetaText(info, payload) {
    var status = payload && payload.status
      ? String(payload.status)
      : (payload && payload.cached ? '已缓存' : '悬停预览');
    return (info && info.author ? '作者：' + info.author + ' · ' : '') + status;
  }

  function getThreadPreviewImageUrls(payload) {
    return (payload && payload.images || []).slice(0, THREAD_PREVIEW_IMAGE_LIMIT);
  }

  function getThreadPreviewImageSummary(payload) {
    var count = payload && payload.images ? payload.images.length : 0;
    if (!count) return '没有可预览图片';
    if (count > THREAD_PREVIEW_IMAGE_LIMIT) return '已显示前 ' + THREAD_PREVIEW_IMAGE_LIMIT + ' 张，打开帖子查看其余 ' + (count - THREAD_PREVIEW_IMAGE_LIMIT) + ' 张';
    return '共 ' + count + ' 张预览图';
  }

  function getThreadPreviewStatusChips(info, payload, state) {
    var chips = [];
    var tid = parseThreadId(info && info.id);
    chips.push({ label: tid && isThreadFavoriteSeen(tid) ? '已收藏' : '未收藏', className: tid && isThreadFavoriteSeen(tid) ? 'spx-ok' : '' });
    chips.push({ label: state && state.watch && state.watch[tid] ? '已稍后' : '未稍后', className: state && state.watch && state.watch[tid] ? 'spx-ok' : '' });
    getThreadResourceBadges(info, getThreadResourceBadgeIndex(state && state.resources), payload).forEach(function appendPreviewResourceChip(badge) {
      chips.push({
        label: badge.label,
        className: badge.guessed ? 'spx-guess' : 'spx-resource',
        resourceType: badge.type,
        title: (badge.guessed ? '标题推测：' : '已识别资源：') + badge.label,
      });
    });
    return chips;
  }

  function appendThreadPreviewStatusChips(panel, info, payload, state) {
    var chips = getThreadPreviewStatusChips(info, payload, state);
    if (!chips.length) return;
    var row = createEl('div', 'spx-preview-chip-row');
    chips.forEach(function appendPreviewStatusChip(chip) {
      var node = chip.resourceType
        ? createEl('button', 'spx-preview-chip ' + (chip.className || ''), chip.label)
        : createEl('span', 'spx-preview-chip ' + (chip.className || ''), chip.label);
      if (chip.title) node.title = chip.title;
      if (chip.resourceType) {
        node.type = 'button';
        node.dataset.spxResourceType = chip.resourceType;
        node.addEventListener('click', function filterPreviewResource(event) {
          event.preventDefault();
          event.stopPropagation();
          dispatchResourceBadgeFilter(chip.resourceType);
        });
      }
      row.appendChild(node);
    });
    panel.appendChild(row);
  }

  function getThreadPreviewHoverDelay(settings) {
    return isNetworkFriendlyMode(settings) ? THREAD_PREVIEW_HOVER_DELAY : THREAD_PREVIEW_FAST_HOVER_DELAY;
  }

  function loadThreadPreviewPanelImage(image) {
    if (!image || image.src) return false;
    var src = image.dataset && image.dataset.spxPreviewLazySrc;
    if (!src) return false;
    preparePreviewImageReveal(image);
    image.src = src;
    delete image.dataset.spxPreviewLazySrc;
    if (image.complete && image.naturalWidth) markPreviewImageLoaded(image);
    return true;
  }

  function loadThreadPreviewPanelImages(panel, batchSize) {
    if (!panel || !panel.isConnected) return 0;
    var limit = Math.max(1, Number(batchSize) || THREAD_PREVIEW_IMAGE_BATCH_SIZE);
    var loaded = 0;
    qsa('img[data-spx-preview-lazy-src]', panel).some(function loadPreviewImage(image) {
      if (loaded >= limit) return true;
      if (loadThreadPreviewPanelImage(image)) loaded += 1;
      return false;
    });
    return loaded;
  }

  function scheduleThreadPreviewPanelImages(panel) {
    if (!panel || typeof window === 'undefined' || typeof window.setTimeout !== 'function') return;
    var loadNextBatch = function loadNextThreadPreviewImageBatch() {
      if (!panel.isConnected) return;
      panel.spxPreviewImageTimer = null;
      loadThreadPreviewPanelImages(panel, THREAD_PREVIEW_IMAGE_BATCH_SIZE);
      if (qs('img[data-spx-preview-lazy-src]', panel)) {
        panel.spxPreviewImageTimer = window.setTimeout(loadNextBatch, THREAD_PREVIEW_IMAGE_LOAD_DELAY);
      }
    };
    panel.spxPreviewImageTimer = window.setTimeout(loadNextBatch, THREAD_PREVIEW_IMAGE_LOAD_DELAY);
    panel.addEventListener('mouseenter', function loadVisibleThreadPreviewImages() {
      loadThreadPreviewPanelImages(panel, THREAD_PREVIEW_IMAGE_BATCH_SIZE);
    }, { once: true });
    panel.addEventListener('focusin', function loadFocusedThreadPreviewImages() {
      loadThreadPreviewPanelImages(panel, THREAD_PREVIEW_IMAGE_BATCH_SIZE);
    }, { once: true });
  }

  function saveThreadPreviewWatch(info, state) {
    if (!info || !info.id || !state) return false;
    state.watch = state.watch || {};
    if (state.watch[info.id]) return false;
    state.watch[info.id] = {
      title: info.title,
      url: getThreadPreviewUrl(info),
      savedAt: Date.now(),
    };
    saveMap(WATCH_KEY, state.watch);
    if (info.cell && info.titleLink && !qs('.spx-watch-badge', info.cell)) {
      info.titleLink.insertAdjacentElement('afterend', createWatchBadge(info.id));
    }
    refreshWatchCenter();
    return true;
  }

  function setPreviewActionText(button, text) {
    if (!button) return;
    var previous = button.dataset.spxPreviewOriginalText || button.textContent;
    button.dataset.spxPreviewOriginalText = previous;
    button.textContent = text;
    if (typeof window === 'undefined' || typeof window.setTimeout !== 'function') return;
    window.setTimeout(function restorePreviewActionText() {
      if ('isConnected' in button && !button.isConnected) return;
      button.textContent = button.dataset.spxPreviewOriginalText || previous;
      delete button.dataset.spxPreviewOriginalText;
    }, 1400);
  }

  function appendPreviewActions(panel, info, state, settings) {
    var url = getThreadPreviewUrl(info);
    if (!url) return;
    var actions = createEl('div', 'spx-preview-popover-actions');
    var openLink = createEl('a', '', '打开帖子');
    openLink.href = url;
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';
    actions.appendChild(openLink);

    var watchButton = createEl('button', '', state && state.watch && state.watch[info.id] ? '已稍后' : '加入稍后');
    watchButton.type = 'button';
    watchButton.disabled = !!(state && state.watch && state.watch[info.id]);
    watchButton.addEventListener('click', function addPreviewWatch(event) {
      event.preventDefault();
      event.stopPropagation();
      if (saveThreadPreviewWatch(info, state)) {
        watchButton.textContent = '已加入稍后';
        watchButton.disabled = true;
      } else {
        setPreviewActionText(watchButton, state ? '已稍后' : '无法保存');
      }
    });
    actions.appendChild(watchButton);

    var favoriteButton = createEl('button', '', isThreadFavoriteSeen(info && info.id) ? '已收藏' : '收藏');
    favoriteButton.type = 'button';
    favoriteButton.title = '收藏到站内收藏夹';
    favoriteButton.disabled = isThreadFavoriteSeen(info && info.id);
    favoriteButton.addEventListener('click', function addPreviewFavorite(event) {
      event.preventDefault();
      event.stopPropagation();
      runThreadFavoriteAction(info, settings, state, favoriteButton, '已收藏');
    });
    actions.appendChild(favoriteButton);

    var copyButton = createEl('button', '', '复制链接');
    copyButton.type = 'button';
    copyButton.addEventListener('click', function copyPreviewLink(event) {
      event.preventDefault();
      event.stopPropagation();
      copyTextToClipboard(url).then(
        function markCopied() { setPreviewActionText(copyButton, '已复制'); },
        function markCopyFailed() { setPreviewActionText(copyButton, '复制失败'); }
      );
    });
    actions.appendChild(copyButton);
    panel.appendChild(actions);
  }

  function renderPreviewPanel(info, payload, event, state, settings) {
    removeThreadPreview();
    var panel = createEl('div', 'spx-preview-popover');
    panel.id = 'spx-preview-popover';
    var title = createEl('h4', '', info.title || '帖子预览');
    var meta = createEl('div', 'spx-preview-meta', getThreadPreviewMetaText(info, payload));
    var text = createEl('div', 'spx-preview-text', payload.text || '未提取到文字预览');
    panel.appendChild(title);
    panel.appendChild(meta);
    appendThreadPreviewStatusChips(panel, info, payload, state);
    appendPreviewActions(panel, info, state, settings);
    panel.appendChild(text);

    var previewImages = getThreadPreviewImageUrls(payload);
    if (previewImages.length) {
      var grid = createEl('div', 'spx-preview-images');
      previewImages.forEach(function appendPreviewImage(url) {
        var link = createEl('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        var image = createEl('img');
        image.loading = 'lazy';
        image.decoding = 'async';
        image.alt = '预览图';
        preparePreviewImageReveal(image);
        image.dataset.spxPreviewLazySrc = url;
        link.appendChild(image);
        grid.appendChild(link);
      });
      panel.appendChild(grid);
    }
    panel.appendChild(createEl('div', 'spx-preview-status', getThreadPreviewImageSummary(payload)));

    panel.addEventListener('mouseleave', removeThreadPreview);
    document.body.appendChild(panel);
    positionPreviewPanel(panel, event || {});
    scheduleThreadPreviewPanelImages(panel);
  }

  function extractPreviewPayloadFromDocument(doc, url) {
    var content = doc && doc.querySelector ? doc.querySelector('.tpc_content') : null;
    var images = content ? Array.prototype.slice.call(content.querySelectorAll('img')) : [];
    var resourceLinks = doc && doc.querySelectorAll ? getJumpResourceLinks(extractReadPageResourceLinks(qsa('table.js-post', doc), url)) : [];
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
      resourceBadges: getResourceBadgesFromItems(resourceLinks, 'preview'),
    };
  }

  function attachThreadHoverPreview(info, settings, state) {
    if (!info || !info.titleLink || info.titleLink.dataset.spxPreviewReady) return;
    info.titleLink.dataset.spxPreviewReady = '1';
    var timer = null;
    var previewToken = 0;
    var lastPreviewEvent = null;
    var previewAbortController = null;
    info.titleLink.addEventListener('mouseenter', function schedulePreview(event) {
      lastPreviewEvent = event;
      previewToken += 1;
      var currentToken = previewToken;
      var url = info.titleLink.href;
      var cached = getCachedThreadPreview(url);
      if (timer) window.clearTimeout(timer);
      if (previewAbortController) {
        previewAbortController.abort();
        previewAbortController = null;
      }
      timer = window.setTimeout(function loadPreview() {
        timer = null;
        if (currentToken !== previewToken) return;
        if (cached) {
          cached.cached = true;
          updateThreadResourceBadges(info, state, cached);
          renderPreviewPanel(info, cached, lastPreviewEvent || event, state, settings);
          return;
        }
        if (isScriptRequestCoolingDown()) {
          renderPreviewPanel(info, { text: '站点提示操作频繁，悬停预览已临时暂停。', images: [], status: '请求冷却中' }, lastPreviewEvent || event, state, settings);
          return;
        }
        var previewPolicy = {
          mode: 'preview',
          label: '悬停预览',
          networkFriendly: isNetworkFriendlyMode(settings),
        };
        var requestOptions = { credentials: 'include' };
        var requestController = null;
        if (typeof AbortController === 'function') {
          requestController = new AbortController();
          previewAbortController = requestController;
          requestOptions.signal = requestController.signal;
        }
        renderPreviewPanel(info, { text: '正在加载预览...', images: [], status: '加载中' }, lastPreviewEvent || event, state, settings);
        requestWithPolicy(url, requestOptions, previewPolicy)
          .then(function parseResponse(response) {
            return readScriptResponseText(response, previewPolicy);
          })
          .then(function renderHtml(html) {
            if (previewAbortController === requestController) previewAbortController = null;
            if (currentToken !== previewToken) return;
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var payload = extractPreviewPayloadFromDocument(doc, url);
            rememberThreadPreview(url, payload);
            updateThreadResourceBadges(info, state, payload);
            renderPreviewPanel(info, payload, lastPreviewEvent || event, state, settings);
          })
          .catch(function showPreviewError(error) {
            if (previewAbortController === requestController) previewAbortController = null;
            if (error && error.name === 'AbortError') return;
            if (currentToken !== previewToken) return;
            var failurePayload = { text: '预览加载失败，已短暂缓存失败状态，避免重复请求同一主题。', images: [], status: '加载失败' };
            rememberThreadPreview(url, failurePayload, undefined, THREAD_PREVIEW_FAILURE_TTL);
            renderPreviewPanel(info, failurePayload, lastPreviewEvent || event, state, settings);
          });
      }, cached ? Math.min(120, getThreadPreviewHoverDelay(settings)) : getThreadPreviewHoverDelay(settings));
    });
    info.titleLink.addEventListener('mousemove', function movePreview(event) {
      lastPreviewEvent = event;
      var panel = qs('#spx-preview-popover');
      if (panel) positionPreviewPanel(panel, event);
    });
    info.titleLink.addEventListener('mouseleave', function cancelPreview() {
      previewToken += 1;
      if (timer) window.clearTimeout(timer);
      timer = null;
      if (previewAbortController) {
        previewAbortController.abort();
        previewAbortController = null;
      }
      window.setTimeout(function removePreviewIfPanelInactive() {
        var panel = qs('#spx-preview-popover');
        if (panel && panel.matches && panel.matches(':hover')) return;
        removeThreadPreview();
      }, 160);
    });
  }

  function enhanceForumGallery(settings, state) {
    if (!isForumGalleryModeUrl(location.href)) return false;
    var wall = qs('#wall');
    if (!wall) return false;
    var cards = qsa('.stream li', wall).filter(function keepGalleryThreadCard(card) {
      var info = extractForumGalleryCardInfo(card);
      return !!(info.id && info.titleLink);
    });
    if (!cards.length) return false;

    wall.classList.add('spx-forum-gallery-wall');
    watchForumGalleryStream(wall, settings, state);
    scheduleForumGalleryToolRepair(wall, settings, state);
    var items = [];
    var resourceBadgeIndex = getThreadResourceBadgeIndex(state.resources);

    cards.forEach(function enhanceGalleryCard(card) {
      var info = extractForumGalleryCardInfo(card);
      if (!info.id || !info.titleLink) return;
      items.push(info);
      card.classList.add('spx-gallery-thread-card');
      info.cell.classList.add('spx-gallery-card-inner');
      if (card.dataset) card.dataset.spxGalleryThread = '1';

      var isRead = !!state.read[info.id];
      card.classList.toggle('spx-read-thread', isRead);
      setThreadRowHiddenClass(card, 'spx-unread-hidden', !!settings.unreadOnly && isRead);
      setThreadRowHiddenClass(card, 'spx-hidden-rule', matchesBlockRules(info, settings));

      var resourceBadges = getThreadResourceBadges(info, resourceBadgeIndex);
      info.resourceBadges = resourceBadges;
      info.resourceBadgeTypes = getResourceBadgeTypes(resourceBadges);
      if (card.dataset) card.dataset.spxResourceTypes = info.resourceBadgeTypes.join(' ');

      ensureForumGalleryCardTools(info, settings, state);
      clearForumGalleryResourceBadges(info);

      if (info.titleLink.dataset && info.titleLink.dataset.spxGalleryReadBound !== '1') {
        info.titleLink.dataset.spxGalleryReadBound = '1';
        info.titleLink.addEventListener('click', function markGalleryThreadRead() {
          state.read[info.id] = Date.now();
          saveMap(READ_KEY, state.read);
          refreshFavoriteNavPanels();
        }, { capture: true });
      }
    });

    syncThreadUpdateEntries(state, items, 'gallery-list');
    items.forEach(function renderGalleryUpdateBadge(info) {
      renderThreadUpdateBadge(info, state);
    });
    createForumQuickTools(settings, state, items);
    createForumSectionTitle(items, wall);
    compactForumPrelude(wall);
    createForumModuleNavigation(items, state);
    hideForumAnnouncements();
    return true;
  }

  function enhanceThreadList(settings, state) {
    if (detectPageType(location.href) !== 'forum') return;
    if (enhanceForumGallery(settings, state)) return;
    qsa('.spx-thread-list-table').forEach(function clearThreadListTable(table) {
      table.classList.remove('spx-thread-list-table');
      delete table.dataset.spxThreadListLayout;
    });
    var cells = qsa('td[id^="td_"]').filter(function realThreadCell(cell) {
      return parseThreadId(cell.id) && qs('a[id^="a_ajax_"]', cell);
    });
    var items = [];
    var resourceBadgeIndex = getThreadResourceBadgeIndex(state.resources);

    cells.forEach(function enhanceCell(cell) {
      var table = cell.closest ? cell.closest('.t') : null;
      if (table) {
        table.classList.add('spx-thread-list-table');
        if (table.dataset.spxThreadListLayout !== '1') {
          table.dataset.spxThreadListLayout = '1';
          qsa('table,tbody', table).forEach(function blockThreadTable(node) {
            setImportantStyle(node, 'display', 'block');
            setImportantStyle(node, 'width', '100%');
          });
          qsa('tr.tr2,tr.tr3', table).forEach(function gridThreadRow(row) {
            var isDecorativeThreadRow = row.classList.contains('tr3') && !qs('td[id^="td_"]', row);
            if (row.dataset) row.dataset.spxThreadListRow = '1';
            setThreadRowHiddenClass(row, 'spx-thread-row-hidden', isDecorativeThreadRow);
          });
        }
      }
      var info = extractThreadCellInfo(cell);
      if (!info.id || !info.titleLink) return;
      items.push(info);

      var isRead = !!state.read[info.id];
      info.row.classList.toggle('spx-read-thread', isRead);
      if (info.row.dataset) info.row.dataset.spxThreadListRow = '1';
      setThreadRowHiddenClass(info.row, 'spx-unread-hidden', !!settings.unreadOnly && isRead);
      setThreadRowHiddenClass(info.row, 'spx-hidden-rule', matchesBlockRules(info, settings));
      var resourceBadges = getThreadResourceBadges(info, resourceBadgeIndex);
      info.resourceBadges = resourceBadges;
      info.resourceBadgeTypes = getResourceBadgeTypes(resourceBadges);

      if (state.watch[info.id] && !qs('.spx-watch-badge', info.cell)) {
        info.titleLink.insertAdjacentElement('afterend', createWatchBadge(info.id));
      }

      if (qs('.spx-thread-tools', info.cell)) {
        renderThreadResourceBadges(info, resourceBadges);
        attachThreadHoverPreview(info, settings, state);
        return;
      }
      var tools = createEl('span', 'spx-thread-tools');
      var watchButton = createEl('button', '', state.watch[info.id] ? '已存' : '稍后');
      var titleBlockButton = createEl('button', '', '屏题');
      var authorBlockButton = createEl('button', '', '屏人');
      var hideRowButton = createEl('button', '', '隐藏');
      var favoriteButton = createEl('button', '', isThreadFavoriteSeen(info.id) ? '已收藏' : '收藏');

      watchButton.title = '切换本地稍后看';
      titleBlockButton.title = '把标题加入本地屏蔽关键词';
      authorBlockButton.title = '把作者加入本地屏蔽关键词';
      hideRowButton.title = '临时隐藏当前行';
      favoriteButton.title = '收藏到站内收藏夹';
      favoriteButton.disabled = isThreadFavoriteSeen(info.id);

      watchButton.addEventListener('click', function toggleWatch(event) {
        event.preventDefault();
        event.stopPropagation();
        toggleThreadWatch(info, state, watchButton);
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
        setThreadRowHiddenClass(info.row, 'spx-filter-hidden', true);
      });

      favoriteButton.addEventListener('click', function favoriteCurrentThread(event) {
        event.preventDefault();
        event.stopPropagation();
        runThreadFavoriteAction(info, settings, state, favoriteButton, '已收藏');
      });

      tools.appendChild(watchButton);
      tools.appendChild(titleBlockButton);
      if (info.author) tools.appendChild(authorBlockButton);
      tools.appendChild(hideRowButton);
      tools.appendChild(favoriteButton);
      info.titleLink.insertAdjacentElement('afterend', tools);
      renderThreadResourceBadges(info, resourceBadges);
      attachThreadHoverPreview(info, settings, state);

      info.titleLink.addEventListener('click', function markRead() {
        state.read[info.id] = Date.now();
        saveMap(READ_KEY, state.read);
        refreshFavoriteNavPanels();
      }, { capture: true });
    });

    syncThreadUpdateEntries(state, items, 'forum-list');
    items.forEach(function renderListUpdateBadge(info) {
      renderThreadUpdateBadge(info, state);
    });
    createForumQuickTools(settings, state, items);
    var threadTable = items[0] && items[0].row && items[0].row.closest ? items[0].row.closest('.spx-thread-list-table') : null;
    createForumSectionTitle(items, threadTable);
    compactForumPrelude(threadTable);
    createForumModuleNavigation(items, state);
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

  function requestReadProgressRestore(tid, mode, options) {
    var storage = getSessionStorage();
    if (!storage || !tid) return;
    var request = {
      tid: String(tid),
      mode: mode === 'last' ? 'last' : 'next',
    };
    var targetReply = normalizeThreadUpdateReplyCount(options && options.reply);
    if (targetReply !== null && targetReply > 0) request.reply = targetReply;
    storage.setItem(RESTORE_PROGRESS_KEY, JSON.stringify(request));
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
      var targetReply = normalizeThreadUpdateReplyCount(request.reply);
      var result = {
        tid: String(request.tid),
        mode: request.mode === 'last' ? 'last' : 'next',
      };
      if (targetReply !== null && targetReply > 0) result.reply = targetReply;
      return result;
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

  function syncNativeReadFavoriteFromGuide(info, settings, state, attemptsLeft) {
    var guide = qs('#ajax_guide');
    var guideText = compactText(guide && guide.textContent);
    if (guideText) {
      if (isNewThreadFavoriteResult(guideText)) {
        var added = markThreadFavoriteSeen(info);
        syncFavoriteNavAfterSiteFavorite(info, settings, state, added);
      }
      if (getThreadFavoriteResultText(guideText) !== '已提交') return;
    }
    if (!attemptsLeft) return;
    window.setTimeout(function retryNativeFavoriteSync() {
      syncNativeReadFavoriteFromGuide(info, settings, state, attemptsLeft - 1);
    }, 800);
  }

  function bindNativeReadFavoriteSync(settings, state, tid, originalAuthor) {
    if (!tid) return;
    var nativeFavorite = qs('a[onclick*="action=favor"][onclick*="tid"],a[title*="收藏该主题"]');
    if (!nativeFavorite || nativeFavorite.dataset.spxNativeFavoriteSync === '1') return;
    nativeFavorite.dataset.spxNativeFavoriteSync = '1';
    nativeFavorite.addEventListener('click', function syncNativeFavoriteAfterClick() {
      var info = createReadPageFavoriteInfo(tid, getReadPageTitle(document), originalAuthor, location.href);
      window.setTimeout(function syncNativeFavoriteFromGuide() {
        syncNativeReadFavoriteFromGuide(info, settings, state, 3);
      }, 1800);
    }, true);
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
    refreshReadThreadSummaryCard();
    refreshFavoriteNavPanels();
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

  function getReadPostReplyNumber(post, index, pageNumber) {
    var text = compactText(post && post.textContent);
    if (/楼主/.test(text)) return 0;
    var labelMatch = text.match(/\bB\s*(\d+)\s*F\b/i) || text.match(/(?:^|\D)(\d+)\s*楼(?:\D|$)/);
    if (labelMatch) return Number(labelMatch[1]) || 0;
    var page = Math.max(1, Number(pageNumber) || currentPageNumber(location.href) || 1);
    var localIndex = Math.max(0, Number(index) || 0);
    return page <= 1
      ? localIndex
      : (page - 1) * READ_REPLIES_PER_PAGE + localIndex + 1;
  }

  function getReadReplyFloorTarget(replyNumber) {
    var targetReply = normalizeThreadUpdateReplyCount(replyNumber);
    if (targetReply === null || targetReply <= 0) return null;
    var posts = qsa('table.js-post');
    if (!posts.length) return null;
    var page = currentPageNumber(location.href) || getReadReplyPage(targetReply);
    var matched = null;
    posts.forEach(function matchReadReplyPost(post, index) {
      if (matched) return;
      if (getReadPostReplyNumber(post, index, page) !== targetReply) return;
      matched = post;
    });
    if (!matched) {
      var localIndex = page <= 1
        ? targetReply
        : targetReply - (page - 1) * READ_REPLIES_PER_PAGE - 1;
      matched = posts[localIndex] || null;
    }
    if (!matched) return null;
    return {
      hash: getPostAnchorHash(matched),
      node: matched,
      top: getAbsoluteNodeTop(matched),
      label: getPostFloorLabel(targetReply),
    };
  }

  function restoreReadReplyFloor(state, tid, replyNumber) {
    var targetReply = normalizeThreadUpdateReplyCount(replyNumber);
    if (targetReply === null || targetReply <= 0) return false;
    clearReadProgressRestoreRequest(tid);
    window.setTimeout(function restoreUnreadReplyFloor() {
      var target = getReadReplyFloorTarget(targetReply);
      if (!target) {
        restoreReadProgress(state, tid, 'next');
        return;
      }
      var top = Math.max(0, Number(target.top) || 0);
      var anchorNode = getReadProgressAnchorNode(target.hash) || target.node;
      if (anchorNode && typeof anchorNode.scrollIntoView === 'function') {
        anchorNode.scrollIntoView({ block: 'start', behavior: 'smooth' });
      } else {
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
      window.setTimeout(function fallbackUnreadReplyScroll() {
        if (Math.abs(getScrollTop() - top) <= 8) return;
        if (document.scrollingElement) document.scrollingElement.scrollTop = top;
        if (document.documentElement) document.documentElement.scrollTop = top;
        if (document.body) document.body.scrollTop = top;
      }, 260);
    }, 80);
    return true;
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
    if (request.reply) return restoreReadReplyFloor(state, tid, request.reply);
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

  function getReadPageImageCount(posts) {
    var count = 0;
    (posts || []).forEach(function countPostImages(post, postIndex) {
      var content = qs('.tpc_content', post) || post;
      qsa('img', content).forEach(function countPreviewCandidate(image) {
        if (isPreviewImageCandidate({
          src: image.currentSrc || image.src,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          width: image.width,
          height: image.height,
          className: image.className,
          alt: image.alt,
          postIndex: postIndex,
        })) count += 1;
      });
    });
    return count;
  }

  function getReadSummaryAutoBuyStatus(settings) {
    if (!settings || !settings.autoBuyPost) return { text: '已关闭', detail: '设置中未开启自动购买', className: 'spx-muted' };
    var status = document.documentElement && document.documentElement.dataset
      ? document.documentElement.dataset.spxAutoBuyStatus
      : '';
    var labels = {
      checking: '检查中',
      skipped: '已跳过',
      buying: '购买中',
      done: '已完成',
      failed: '失败',
      blocked: '已拦截',
    };
    if (status) {
      return {
        text: labels[status] || status,
        detail: '当前页执行状态',
        className: status === 'done' ? 'spx-ok' : status === 'failed' || status === 'blocked' ? 'spx-danger' : 'spx-warn',
      };
    }
    var target = findAutoBuyTarget(document, location.href);
    if (target) {
      return { text: target.price + ' SP', detail: '待自动购买判断', className: 'spx-warn' };
    }
    return { text: '无购买项', detail: '当前页未发现付费入口', className: 'spx-ok' };
  }

  function getReadThreadSummaryData(settings, state, posts, tid, originalAuthor) {
    state.progress = state.progress || {};
    state.watch = state.watch || {};
    var record = tid ? state.progress[tid] : null;
    var floors = getReadProgressFloorLabels(record);
    var resources = getCurrentReadResourceRailEntries(posts, state);
    var resourceSummary = formatResourceRailSummary(resources);
    var autoBuy = getReadSummaryAutoBuyStatus(settings);
    return {
      tid: tid,
      title: getReadPageTitle(document) || '当前帖子',
      author: originalAuthor || '',
      url: location.href.split('#')[0],
      watched: !!(tid && state.watch[tid]),
      favorited: isThreadFavoriteSeen(tid),
      progressText: formatReadProgress(record) || '暂无记录',
      progressPercent: getReadProgressPercent(record),
      lastFloor: floors.last || '暂无',
      nextFloor: floors.next || floors.last || '暂无',
      resources: resources,
      resourceSummary: resourceSummary,
      imageCount: getReadPageImageCount(posts),
      autoBuy: autoBuy,
    };
  }

  function createReadSummaryMetric(label, value, note, className) {
    var metric = createEl('div', 'spx-read-summary-metric' + (className ? ' ' + className : ''));
    metric.appendChild(createEl('b', '', String(value)));
    metric.appendChild(createEl('span', '', label));
    if (note) metric.appendChild(createEl('em', '', note));
    return metric;
  }

  function createReadSummaryAction(action, text, primary) {
    var button = createEl('button', primary ? 'spx-primary' : '', text);
    button.type = 'button';
    button.dataset.spxReadSummaryAction = action;
    return button;
  }

  function setReadSummaryWatchState(data, state) {
    if (!data || !data.tid || !state) return;
    state.watch = state.watch || {};
    if (state.watch[data.tid]) {
      delete state.watch[data.tid];
    } else {
      state.watch[data.tid] = {
        title: data.title,
        url: data.url,
        savedAt: Date.now(),
      };
    }
    saveMap(WATCH_KEY, state.watch);
    refreshWatchCenter();
  }

  function openReadSummaryResourceCenter(settings, state) {
    var panel = createResourceCenterPanel(settings, state || { resources: loadResourceLibrary() });
    setCenterPanelHidden(panel, false);
  }

  function renderReadThreadSummaryCard(card, settings, state, posts, tid, originalAuthor) {
    var data = getReadThreadSummaryData(settings, state, posts, tid, originalAuthor);
    card.textContent = '';
    card.dataset.spxReadTid = data.tid || '';
    card.spxSummaryData = data;

    var head = createEl('div', 'spx-read-summary-head');
    var copy = createEl('div', 'spx-read-summary-copy');
    copy.appendChild(createEl('div', 'spx-read-summary-eyebrow', '帖子详情摘要'));
    copy.appendChild(createEl('h3', '', data.title));
    copy.appendChild(createEl('p', '', [data.author ? ('楼主 ' + data.author) : '', data.tid ? ('TID ' + data.tid) : ''].filter(Boolean).join(' · ') || '当前阅读页'));
    head.appendChild(copy);
    var chips = createEl('div', 'spx-read-summary-chips');
    chips.appendChild(createEl('span', data.favorited ? 'spx-chip spx-ok' : 'spx-chip', data.favorited ? '已收藏' : '未收藏'));
    chips.appendChild(createEl('span', data.watched ? 'spx-chip spx-ok' : 'spx-chip', data.watched ? '已稍后' : '未稍后'));
    chips.appendChild(createEl('span', 'spx-chip ' + data.autoBuy.className, '自动购买 ' + data.autoBuy.text));
    head.appendChild(chips);
    card.appendChild(head);

    var progress = createEl('div', 'spx-read-summary-progress');
    progress.appendChild(createEl('span', '', '阅读进度 ' + data.progressText));
    var track = createEl('div', 'spx-read-summary-track');
    var bar = createEl('i');
    bar.style.width = Math.max(0, Math.min(100, data.progressPercent)) + '%';
    track.appendChild(bar);
    progress.appendChild(track);
    card.appendChild(progress);

    var metrics = createEl('div', 'spx-read-summary-metrics');
    metrics.appendChild(createReadSummaryMetric('未读楼层', data.nextFloor, '继续阅读位置'));
    metrics.appendChild(createReadSummaryMetric('上次楼层', data.lastFloor, '最近停留位置'));
    metrics.appendChild(createReadSummaryMetric('资源', data.resourceSummary.total, formatResourceRailSummaryText(data.resources)));
    metrics.appendChild(createReadSummaryMetric('图片', data.imageCount, data.imageCount ? '正文可预览图片' : '暂无正文图片'));
    metrics.appendChild(createReadSummaryMetric('自动购买', data.autoBuy.text, data.autoBuy.detail, data.autoBuy.className));
    card.appendChild(metrics);

    var actions = createEl('div', 'spx-read-summary-actions');
    if (data.tid) {
      var continueButton = createReadSummaryAction('continue', '继续阅读', true);
      var lastButton = createReadSummaryAction('last', '上次楼层', false);
      continueButton.disabled = !state.progress || !state.progress[data.tid];
      lastButton.disabled = !state.progress || !state.progress[data.tid];
      actions.appendChild(continueButton);
      actions.appendChild(lastButton);
      actions.appendChild(createReadSummaryAction('watch', data.watched ? '取消稍后' : '加入稍后', false));
      var favoriteButton = createReadSummaryAction('favorite', data.favorited ? '已收藏' : '收藏', false);
      favoriteButton.disabled = data.favorited;
      actions.appendChild(favoriteButton);
    }
    actions.appendChild(createReadSummaryAction('resources', '资源工作台', false));
    card.appendChild(actions);
  }

  function refreshReadThreadSummaryCard() {
    var card = qs('#spx-read-summary-card');
    if (!card || !readSummaryContext.tid) return;
    renderReadThreadSummaryCard(
      card,
      readSummaryContext.settings,
      readSummaryContext.state,
      readSummaryContext.posts || [],
      readSummaryContext.tid,
      readSummaryContext.originalAuthor
    );
  }

  function createReadThreadSummaryCard(settings, state, posts, tid, originalAuthor) {
    if (!document.body || !tid) return null;
    var existing = qs('#spx-read-summary-card');
    if (existing) existing.remove();
    var card = createEl('section', 'spx-read-summary-card');
    card.id = 'spx-read-summary-card';
    readSummaryContext = { settings: settings, state: state, posts: posts || [], tid: tid, originalAuthor: originalAuthor || '' };
    renderReadThreadSummaryCard(card, settings, state, posts || [], tid, originalAuthor || '');
    card.addEventListener('click', function handleReadSummaryClick(event) {
      var target = event.target && event.target.closest
        ? event.target.closest('[data-spx-read-summary-action]')
        : null;
      if (!target || !card.contains(target)) return;
      var action = target.dataset.spxReadSummaryAction;
      var data = card.spxSummaryData || getReadThreadSummaryData(settings, state, posts, tid, originalAuthor);
      if (action === 'continue') {
        restoreReadProgress(state, tid, 'next');
        return;
      }
      if (action === 'last') {
        restoreReadProgress(state, tid, 'last');
        return;
      }
      if (action === 'watch') {
        setReadSummaryWatchState(data, state);
        refreshReadThreadSummaryCard();
        return;
      }
      if (action === 'favorite') {
        runThreadFavoriteAction(createReadPageFavoriteInfo(tid, data.title, data.author, data.url), settings, state, target, '已收藏');
        window.setTimeout(refreshReadThreadSummaryCard, 900);
        return;
      }
      if (action === 'resources') {
        openReadSummaryResourceCenter(settings, state);
      }
    });

    var firstPost = posts && posts[0];
    if (firstPost && firstPost.parentNode) {
      firstPost.parentNode.insertBefore(card, firstPost);
    } else {
      var host = qs('#content') || qs('#main') || document.body;
      host.insertBefore(card, host.firstChild || null);
    }
    return card;
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
      setImportantStyle(node, 'width', 'min(1480px, calc(100vw - 40px))');
      setImportantStyle(node, 'max-width', 'none');
      setImportantStyle(node, 'margin-left', 'auto');
      setImportantStyle(node, 'margin-right', 'auto');
    });
    qsa('#mainNav', scope).forEach(function widenNav(node) {
      setImportantStyle(node, 'box-sizing', 'border-box');
      setImportantStyle(node, 'width', 'min(1480px, calc(100vw - 40px))');
      setImportantStyle(node, 'max-width', 'none');
      setImportantStyle(node, 'margin-left', 'auto');
      setImportantStyle(node, 'margin-right', 'auto');
      setImportantStyle(node, 'height', '38px');
      setImportantStyle(node, 'overflow', 'visible');
      qsa(':scope>div', node).forEach(function hideLegacyNavChild(child) {
        if (qs('#guide', child)) return;
        setImportantStyle(child, 'display', 'none');
      });
    });
    qsa('#mainNav>div[style*="padding-left"]', scope).forEach(function resetNavMenuHost(node) {
      setImportantStyle(node, 'display', 'flex');
      setImportantStyle(node, 'align-items', 'center');
      setImportantStyle(node, 'gap', '6px');
      setImportantStyle(node, 'box-sizing', 'border-box');
      setImportantStyle(node, 'width', '100%');
      setImportantStyle(node, 'max-width', '100%');
      setImportantStyle(node, 'height', '38px');
      setImportantStyle(node, 'padding-left', '8px');
      setImportantStyle(node, 'overflow', 'visible');
    });
    qsa('#mainNav>div[style*="padding-left"] table,#mainNav>div[style*="padding-left"] tbody,#mainNav>div[style*="padding-left"] tr,#mainNav>div[style*="padding-left"] td', scope).forEach(function resetNavTableNode(node) {
      setImportantStyle(node, 'display', 'block');
      setImportantStyle(node, 'box-sizing', 'border-box');
      setImportantStyle(node, 'width', 'auto');
      setImportantStyle(node, 'height', '38px');
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

    if (guide) {
      var guideHost = guide.closest ? guide.closest('#mainNav>div') : null;
      if (guideHost && !qs('#spx-nav-brand', guideHost)) {
        var brand = createEl('strong', 'spx-nav-brand', 'South Plus +++');
        brand.id = 'spx-nav-brand';
        guideHost.insertBefore(brand, guideHost.firstChild);
      }
    }

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

    setImportantStyle(post, 'width', '100%');
    setImportantStyle(post, 'max-width', '100%');
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

  function findAutoBuyTargets(root, pageUrl) {
    var scope = root || document;
    var resolvedPageUrl = pageUrl || location.href;
    var controls = qsa(
      'input[onclick*="buytopic"],button[onclick*="buytopic"],a[href*="buytopic"]',
      scope
    );
    var targets = [];
    var seen = {};

    for (var index = 0; index < controls.length; index += 1) {
      var control = controls[index];
      var rawTarget = control.getAttribute('href') || control.getAttribute('onclick') || '';
      var url = extractBuyTopicUrl(rawTarget, resolvedPageUrl);
      if (!url) continue;
      var attemptKey = getAutoBuyAttemptKey(url, resolvedPageUrl);
      var dedupeKey = attemptKey || url;
      if (seen[dedupeKey]) continue;

      var host = control.closest
        ? control.closest('h6.quote,.quote,.tpc_content,table.js-post')
        : control.parentNode;
      var price = parsePostPrice(host ? host.textContent : '');
      if (price === null) {
        var body = scope.body || scope.documentElement;
        price = parsePostPrice(body ? body.textContent : '');
      }
      if (price === null) continue;

      seen[dedupeKey] = true;
      targets.push({
        control: control,
        host: host || control.parentNode,
        price: price,
        url: url,
        attemptKey: attemptKey,
      });
    }

    return targets;
  }

  function findAutoBuyTarget(root, pageUrl) {
    var targets = findAutoBuyTargets(root, pageUrl);
    return targets.length ? targets[0] : null;
  }

  function findAutoBuyTargetByAttemptKey(root, pageUrl, attemptKey) {
    var key = String(attemptKey || '');
    if (!key) return null;
    var targets = findAutoBuyTargets(root, pageUrl);
    for (var index = 0; index < targets.length; index += 1) {
      if (targets[index].attemptKey === key) return targets[index];
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

  function fetchCurrentUserSpBalance(settings) {
    var cachedBalance = getCachedUserSpBalance();
    if (cachedBalance !== null) return Promise.resolve(cachedBalance);
    var url = new URL('/userpay.php', location.href).href;
    var balancePolicy = {
      mode: 'interactive',
      label: 'SP 余额检查',
      networkFriendly: isNetworkFriendlyMode(settings),
    };
    return requestWithPolicy(url, {
      credentials: 'include',
      cache: 'no-store',
    }, balancePolicy)
      .then(function readBalanceResponse(response) {
        if (!response.ok) throw new Error('读取 SP 余额失败');
        return readScriptResponseText(response, balancePolicy);
      })
      .then(function parseBalancePage(html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var balance = parseUserSpBalance(doc.body ? doc.body.textContent : '');
        if (balance === null) throw new Error('未识别到 SP 余额');
        rememberUserSpBalance(balance);
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

  function createAutoBuyContext(settings, options) {
    var config = options || {};
    var ignoredAttemptKeys = config.ignoredAttemptKeys || {};
    var maxPrice = Number(settings.autoBuyMaxSp);
    if (!(maxPrice > 0)) return null;
    var targets = findAutoBuyTargets(document, location.href);
    var attempts = loadAutoBuyAttempts();
    for (var index = 0; index < targets.length; index += 1) {
      var target = targets[index];
      if (!(target.price < maxPrice)) continue;
      var attemptKey = target.attemptKey || getAutoBuyAttemptKey(target.url, location.href);
      if (!attemptKey || ignoredAttemptKeys[attemptKey]) continue;
      var previousAttempt = attempts[attemptKey] || null;
      if (isAutoBuyAttemptBlocked(previousAttempt) && !shouldRetryAutoBuyAttempt(previousAttempt)) {
        if (previousAttempt.status === 'done') showAutoBuyNavSuccess(Object.assign({ key: attemptKey }, previousAttempt));
        continue;
      }
      return {
        pageRoot: document.documentElement,
        target: target,
        attemptKey: attemptKey,
        networkFriendly: isNetworkFriendlyMode(settings),
        previousAttempt: previousAttempt,
      };
    }
    return null;
  }

  function blockAutoBuyContext(context) {
    if (!context || !isAutoBuyAttemptBlocked(context.previousAttempt)) return false;
    context.pageRoot.dataset.spxAutoBuyStatus = 'blocked';
    setAutoBuyStatus(context.target, formatAutoBuyAttemptMessage(context.previousAttempt), context.previousAttempt.status !== 'done');
    if (context.previousAttempt.status === 'done') showAutoBuyNavSuccess(context.previousAttempt);
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

    var purchasePolicy = {
      mode: 'action',
      label: '自动购买',
      networkFriendly: context.networkFriendly,
    };
    return requestWithPolicy(context.target.url, {
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-store',
    }, purchasePolicy).then(function readPurchaseResponse(response) {
      if (!response.ok) throw new Error('购买请求失败');
      clearUserSpBalanceCache();
      return readScriptResponseText(response, purchasePolicy);
    });
  }

  function reloadAutoBuyThreadHtml(context, purchaseResult) {
    if (purchaseResult === null) return null;
    var reloadPolicy = {
      mode: 'interactive',
      label: '自动购买后刷新帖子',
      networkFriendly: context && context.networkFriendly,
    };
    return requestWithPolicy(location.href, {
      credentials: 'include',
      cache: 'no-store',
    }, reloadPolicy)
      .then(function readRefreshedThread(response) {
        if (!response.ok) throw new Error('重新加载帖子失败');
        return readScriptResponseText(response, reloadPolicy);
      })
      .then(function keepPurchaseResult(html) {
        return { html: html, purchaseResult: purchaseResult };
      });
  }

  function applyAutoBuySuccess(context, settings, state, payload) {
    var html = typeof payload === 'string' ? payload : payload && payload.html;
    var purchaseResult = payload && typeof payload === 'object' ? payload.purchaseResult : '';
    if (!html) return;
    var failureReason = getAutoBuyPurchaseResponseFailureReason(purchaseResult);
    if (failureReason) throw new Error(failureReason);
    var refreshedDoc = new DOMParser().parseFromString(html, 'text/html');
    var residualTarget = findAutoBuyTargetByAttemptKey(refreshedDoc, location.href, context.attemptKey);
    var refreshedResourceLinks = getJumpResourceLinks(extractReadPageResourceLinks(qsa('table.js-post', refreshedDoc), location.href));
    var residualNote = getAutoBuyResidualButtonNote(context, residualTarget, refreshedResourceLinks, purchaseResult);
    if (residualTarget && !residualNote) {
      throw new Error('购买后仍存在购买按钮');
    }
    if (!replaceReadPageContent(html, settings, state)) {
      throw new Error('无法更新帖子内容');
    }
    var resourceLinks = getJumpResourceLinks(extractReadPageResourceLinks(qsa('table.js-post'), location.href));
    if (!resourceLinks.length && refreshedResourceLinks.length) resourceLinks = refreshedResourceLinks;
    var resourceSummary = formatResourceJumpSummary(resourceLinks);
    var savedResources = saveResourceLinksToLibrary(resourceLinks, state.resources, getCurrentResourceSourceMeta());
    state.resources = savedResources.resources;
    saveResourceLibrary(state.resources);
    refreshResourceCenter();
    refreshReadResourceRail();
    showAutoBuyResourceJump(resourceLinks, state, savedResources.saved);
    context.pageRoot.dataset.spxAutoBuyStatus = 'done';
    var doneRecord = recordAutoBuyAttempt(
      context.attemptKey,
      'done',
      '已支付 ' + context.target.price + ' SP 并加载帖子内容' + (resourceSummary ? '，识别资源：' + resourceSummary : '') + (residualNote ? '，' + residualNote : ''),
      { price: context.target.price, url: context.target.url, resourceSummary: resourceSummary, residualButton: !!residualNote }
    );
    showAutoBuyNavSuccess(doneRecord);
    if (residualNote) {
      setAutoBuyStatus(
        findAutoBuyTarget(document, location.href) || context.target,
        '自动购买已完成：' + residualNote + '，已记录为成功。',
        false
      );
    }
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

  function createAutoBuyQueueSummary() {
    return { done: 0, skipped: 0, failed: 0, ignoredAttemptKeys: {} };
  }

  function formatAutoBuyQueueSummary(summary) {
    var data = summary || {};
    var parts = [data.done ? '自动购买已完成' : '自动购买已处理'];
    if (data.done) parts.push('成功 ' + data.done + ' 个');
    if (data.skipped) parts.push('跳过 ' + data.skipped + ' 个');
    if (data.failed) parts.push('失败 ' + data.failed + ' 个');
    return parts.join('，') + '。';
  }

  function finishAutoBuyQueueStatus(context, summary) {
    var data = summary || {};
    if (!context || !(data.done || data.skipped || data.failed)) return;
    setAutoBuyStatus(
      findAutoBuyTarget(document, location.href) || context.target,
      formatAutoBuyQueueSummary(data),
      !!data.failed && !data.done
    );
  }

  function runAutoBuyQueue(settings, state, summary, lastContext) {
    var queue = summary || createAutoBuyQueueSummary();
    var context = createAutoBuyContext(settings, { ignoredAttemptKeys: queue.ignoredAttemptKeys });
    if (!context) {
      document.documentElement.dataset.spxAutoBuyStatus = 'done';
      finishAutoBuyQueueStatus(lastContext, queue);
      return Promise.resolve(queue);
    }
    markAutoBuyChecking(context);

    return fetchCurrentUserSpBalance(settings).then(
      function purchaseWhenAffordable(balance) {
        if (!shouldAutoBuyPost(settings, context.target.price, balance)) {
          queue.skipped += 1;
          queue.ignoredAttemptKeys[context.attemptKey] = true;
          skipAutoBuyContext(context, balance);
          return runAutoBuyQueue(settings, state, queue, context);
        }
        return requestAutoBuyPurchase(context, balance)
          .then(function reloadPurchasedThread(purchaseResult) {
            return reloadAutoBuyThreadHtml(context, purchaseResult);
          })
          .then(function applyRefreshedThread(payload) {
            applyAutoBuySuccess(context, settings, state, payload);
            queue.done += 1;
            queue.ignoredAttemptKeys[context.attemptKey] = true;
            return runAutoBuyQueue(settings, state, queue, context);
          })
          .catch(function handleCurrentAutoBuyError(error) {
            queue.failed += 1;
            queue.ignoredAttemptKeys[context.attemptKey] = true;
            failAutoBuyContext(context, error);
            return runAutoBuyQueue(settings, state, queue, context);
          });
      },
      function handleBalanceCheckError(error) {
        queue.failed += 1;
        queue.ignoredAttemptKeys[context.attemptKey] = true;
        failAutoBuyContext(context, error);
        finishAutoBuyQueueStatus(context, queue);
        return queue;
      }
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

    if (!createAutoBuyContext(settings)) return;
    pageRoot.dataset.spxAutoBuyStatus = 'running';

    runAutoBuyQueue(settings, state, createAutoBuyQueueSummary(), null)
      .catch(function handleAutoBuyError() {
        pageRoot.dataset.spxAutoBuyStatus = 'failed';
      });
  }

  function syncReadPageThreadUpdateState(state, tid) {
    if (!state || !tid) return;
    state.threadUpdates = state.threadUpdates || loadThreadUpdates();
    var favoriteSeen = loadMap(FAVORITE_NAV_SEEN_KEY);
    if (!(state.watch && state.watch[tid]) && !favoriteSeen[tid] && !state.threadUpdates[tid]) return;
    var replies = parseThreadReadReplyCountFromDocument(document, location.href);
    var updateResult = updateThreadReplyState(state.threadUpdates, {
      id: tid,
      title: getReadPageTitle(document),
      url: location.href.split('#')[0],
      replies: replies,
    }, { markRead: true, source: 'read-page' }, Date.now());
    state.threadUpdates = updateResult.map;
    if (updateResult.changed) {
      saveThreadUpdates(state.threadUpdates);
      refreshFavoriteNavPanels();
    }
  }

  function enhanceReadPage(settings, state) {
    if (detectPageType(location.href) !== 'read') return;
    var tid = parseThreadId(location.href);
    if (tid) {
      state.read[tid] = Date.now();
      saveMap(READ_KEY, state.read);
      syncAutoBuyNavSuccessForThread(tid);
      restorePendingReadProgress(state, tid);
      bindReadProgressTracking(state, tid);
      bindReadPageJumpButtons(state, tid);
    }

    var posts = qsa('table.js-post');
    syncReadPageThreadUpdateState(state, tid);
    var originalAuthor = posts.length ? getPostAuthor(posts[0]) : '';
    bindNativeReadFavoriteSync(settings, state, tid, originalAuthor);
    createReadThreadSummaryCard(settings, state, posts, tid, originalAuthor);

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

      function openPostQuickReply(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        }
        var floorLabel = getPostFloorLabel(index);
        var contextLabel = '回复 ' + (author || '用户') + ' · ' + floorLabel;
        var replyText = '回 ' + floorLabel + (author ? '(' + author + ')' : '') + ' 的帖子\n';
        openFloatingQuickReplyContext(contextLabel, replyText);
      }

      qsa('.readbot .huifu a,a[onclick*="postreply"]', post).forEach(function bindNativeQuickReply(link) {
        if (link.dataset.spxQuickReplyBound === '1') return;
        link.dataset.spxQuickReplyBound = '1';
        link.addEventListener('click', openPostQuickReply, true);
      });

      if (!existingTools) {
        var tools = createEl('div', 'spx-post-tools');
        var floor = createEl('span', '', getPostFloorLabel(index));
        var quickReply = createEl('button', '', '回复');
        var blockAuthor = createEl('button', '', '屏蔽此人');
        var copyLink = createEl('button', '', '复制链接');
        var extractResources = createEl('button', '', '资源');
        var jumpNextFloor = null;
        var jumpLastFloor = null;
        floor.style.marginRight = 'auto';
        quickReply.type = 'button';
        blockAuthor.type = 'button';
        copyLink.type = 'button';
        extractResources.type = 'button';
        extractResources.title = '提取本页资源链接，可按本楼、作者或类型复制';

        if (index === 0 && tid) {
          jumpNextFloor = createEl('button', '', '未读楼层');
          jumpLastFloor = createEl('button', '', '上次楼层');
          jumpNextFloor.type = 'button';
          jumpLastFloor.type = 'button';
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

        quickReply.addEventListener('click', openPostQuickReply);

        tools.appendChild(floor);
        if (jumpNextFloor) tools.appendChild(jumpNextFloor);
        if (jumpLastFloor) tools.appendChild(jumpLastFloor);
        tools.appendChild(quickReply);
        tools.appendChild(blockAuthor);
        tools.appendChild(copyLink);
        tools.appendChild(extractResources);
        toolsHost.insertBefore(tools, toolsHost.firstChild);
      }
    });

    cleanupReadSeparators();
    createReadResourceRail(posts, state);
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

  function downloadBlobFile(filename, blob) {
    if (
      typeof Blob === 'undefined' ||
      typeof URL === 'undefined' ||
      typeof URL.createObjectURL !== 'function' ||
      !document.body ||
      !blob
    ) return false;
    var href = URL.createObjectURL(blob);
    var link = createEl('a');
    link.href = href;
    link.download = filename || 'download';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function revokeObjectUrl() {
      URL.revokeObjectURL(href);
    }, 0);
    return true;
  }

  function downloadTextFile(filename, text) {
    if (typeof Blob === 'undefined') return false;
    return downloadBlobFile(filename || formatResourceDownloadFileName(), new Blob([String(text || '')], { type: 'text/plain;charset=utf-8' }));
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

  function isReadResourceRailCollapsed() {
    var storage = getStorage();
    return !!(storage && storage.getItem(READ_RESOURCE_RAIL_COLLAPSED_KEY) === '1');
  }

  function setReadResourceRailCollapsed(collapsed) {
    var storage = getStorage();
    if (storage) storage.setItem(READ_RESOURCE_RAIL_COLLAPSED_KEY, collapsed ? '1' : '0');
    qsa('#spx-read-resource-rail').forEach(function toggleRail(rail) {
      rail.hidden = !!collapsed;
    });
    qsa('#spx-read-resource-launcher').forEach(function toggleLauncher(launcher) {
      launcher.hidden = !collapsed;
    });
  }

  function closeReadResourceRail() {
    qsa('#spx-read-resource-rail,#spx-read-resource-launcher').forEach(function removeResourceRail(node) {
      node.remove();
    });
  }

  function getCurrentReadResourceRailEntries(posts, state) {
    return getResourceRailEntries(
      extractReadPageResourceLinks(posts || [], typeof location !== 'undefined' ? location.href : ''),
      state && state.resources
    );
  }

  function copyReadResourceRailEntries(entries, target, restoreText) {
    copyTextToClipboard(formatResourceLinks(entries)).then(
      function showReadResourceRailCopySuccess() {
        setTemporaryText(target, '已复制 ' + (entries || []).length + ' 条', restoreText);
      },
      function showReadResourceRailCopyFailure() {
        setTemporaryText(target, '复制失败', restoreText);
      }
    );
  }

  function copyReadResourceRailCodes(entries, target) {
    var text = formatResourceRailCodes(entries);
    if (!text) {
      setTemporaryText(target, '无口令', '复制口令');
      return;
    }
    copyTextToClipboard(text).then(
      function showReadResourceRailCodeCopySuccess() {
        setTemporaryText(target, '已复制口令', '复制口令');
      },
      function showReadResourceRailCodeCopyFailure() {
        setTemporaryText(target, '复制失败', '复制口令');
      }
    );
  }

  function saveReadResourceRailEntries(entries, state, target, restoreText) {
    if (!state) {
      setTemporaryText(target, '无法保存', restoreText || '保存当前');
      return;
    }
    var savedResources = saveResourceLinksToLibrary(entries, state.resources, getCurrentResourceSourceMeta());
    state.resources = savedResources.resources;
    saveResourceLibrary(state.resources);
    refreshResourceCenter();
    refreshReadResourceRail();
    setTemporaryText(target, savedResources.saved ? ('已保存 ' + savedResources.saved + ' 条') : '无可保存资源', restoreText || '保存当前');
  }

  function markReadResourceRailEntry(entry, state, status, target) {
    if (!entry || !state) return;
    var savedResources = saveResourceLinksToLibrary([entry], state.resources, getCurrentResourceSourceMeta());
    state.resources = savedResources.resources;
    updateResourceRecords(state, [entry.key], function markReadRailResource(record) {
      record.status = normalizeResourceStatus(status);
    });
    saveResourceCenterState(state);
    refreshReadResourceRail();
    setTemporaryText(target, getResourceStatusLabel(status), target.textContent || '标记');
  }

  function jumpToReadResourceRailEntry(entry, posts) {
    var post = posts && posts[Number(entry && entry.postIndex) || 0];
    if (!post) return;
    post.classList.add('spx-read-resource-floor-active');
    if (typeof post.scrollIntoView === 'function') {
      post.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    window.setTimeout(function clearResourceFloorHighlight() {
      if (post.isConnected) post.classList.remove('spx-read-resource-floor-active');
    }, 1800);
  }

  function createReadResourceRail(posts, state) {
    if (detectPageType(location.href) !== 'read' || !document.body) return null;
    readResourceRailContext.posts = posts || [];
    readResourceRailContext.state = state;
    closeReadResourceRail();

    var entries = getCurrentReadResourceRailEntries(posts, state);
    if (!entries.length) return null;

    var rail = createEl('aside', 'spx-read-resource-rail');
    var launcher = createEl('button', 'spx-read-resource-launcher', '资源 ' + entries.length);
    rail.id = 'spx-read-resource-rail';
    rail.setAttribute('role', 'complementary');
    rail.setAttribute('aria-label', '当前帖子资源');
    launcher.id = 'spx-read-resource-launcher';
    launcher.type = 'button';
    launcher.title = '展开当前帖资源栏';

    function setRailAction(button, action, key, status) {
      button.dataset.spxRailAction = action;
      if (key) button.dataset.spxResourceKey = key;
      if (status) button.dataset.spxResourceStatus = status;
      return button;
    }

    function getRailEntryByKey(key) {
      return (rail.spxEntriesByKey || {})[String(key || '')] || null;
    }

    function handleReadResourceRailClick(event) {
      var target = event.target && event.target.closest
        ? event.target.closest('[data-spx-rail-action]')
        : null;
      if (!target || !rail.contains(target)) return;
      var action = target.dataset.spxRailAction;
      var visibleEntries = rail.spxVisibleEntries || [];
      var entry = getRailEntryByKey(target.dataset.spxResourceKey);
      var card = target.closest ? target.closest('.spx-read-resource-card') : null;

      if (action === 'collapse') {
        setReadResourceRailCollapsed(true);
        return;
      }
      if (action === 'copy-all') {
        copyReadResourceRailEntries(visibleEntries, target, '复制全部');
        return;
      }
      if (action === 'save-visible') {
        saveReadResourceRailEntries(visibleEntries, readResourceRailContext.state, target, '保存当前');
        return;
      }
      if (action === 'copy-codes') {
        copyReadResourceRailCodes(visibleEntries, target);
        return;
      }
      if (action === 'filter') {
        readResourceRailContext.filter = target.dataset.spxResourceRailFilter || 'all';
        renderRail();
        return;
      }
      if (!entry) return;
      if (action === 'jump') {
        if (card) card.classList.add('spx-active');
        jumpToReadResourceRailEntry(entry, readResourceRailContext.posts);
        window.setTimeout(function clearActiveCard() {
          if (card && card.isConnected) card.classList.remove('spx-active');
        }, 1800);
        return;
      }
      if (action === 'copy-one') {
        copyReadResourceRailEntries([entry], target, '复制');
        return;
      }
      if (action === 'save-one') {
        saveReadResourceRailEntries([entry], readResourceRailContext.state, target, entry.saved ? '已保存' : '保存');
        return;
      }
      if (action === 'status') {
        markReadResourceRailEntry(entry, readResourceRailContext.state, target.dataset.spxResourceStatus, target);
      }
    }

    function renderRail() {
      var allEntries = getCurrentReadResourceRailEntries(readResourceRailContext.posts, readResourceRailContext.state);
      if (!allEntries.length) {
        closeReadResourceRail();
        return;
      }
      var availableTypes = getAvailableResourceRailFilterTypes(allEntries);
      if (readResourceRailContext.filter !== 'all' && availableTypes.indexOf(readResourceRailContext.filter) === -1) {
        readResourceRailContext.filter = 'all';
      }
      var visibleEntries = filterResourceRailEntries(allEntries, readResourceRailContext.filter);
      var entriesByKey = {};
      rail.textContent = '';
      rail.spxVisibleEntries = visibleEntries;
      visibleEntries.forEach(function indexVisibleRailEntry(entry) {
        entriesByKey[entry.key] = entry;
      });
      rail.spxEntriesByKey = entriesByKey;
      launcher.textContent = '资源 ' + allEntries.length;

      var header = createEl('div', 'spx-read-resource-rail-head');
      var title = createEl('div');
      title.appendChild(createEl('strong', '', '当前帖资源'));
      title.appendChild(createEl('span', 'spx-read-resource-summary', formatResourceRailSummaryText(allEntries)));
      var collapseButton = createEl('button', '', '收起');
      collapseButton.type = 'button';
      setRailAction(collapseButton, 'collapse');
      header.appendChild(title);
      header.appendChild(collapseButton);
      rail.appendChild(header);

      var actions = createEl('div', 'spx-read-resource-actions');
      var copyAllButton = createEl('button', '', '复制全部');
      var saveButton = createEl('button', '', '保存当前');
      var copyCodeButton = createEl('button', '', '复制口令');
      [copyAllButton, saveButton, copyCodeButton].forEach(function setRailActionType(button) {
        button.type = 'button';
        actions.appendChild(button);
      });
      setRailAction(copyAllButton, 'copy-all');
      setRailAction(saveButton, 'save-visible');
      setRailAction(copyCodeButton, 'copy-codes');
      copyAllButton.disabled = !visibleEntries.length;
      saveButton.disabled = !getJumpResourceLinks(visibleEntries).length;
      copyCodeButton.disabled = !visibleEntries.some(function hasCode(entry) { return !!entry.accessCode; });
      rail.appendChild(actions);

      var filters = createEl('div', 'spx-read-resource-filters');
      [{ value: 'all', label: '全部' }].concat(availableTypes.map(function mapResourceRailType(type) {
        return { value: type, label: getResourceRailTypeLabel(type) };
      })).forEach(function appendResourceRailFilter(item) {
        var button = createEl('button', item.value === readResourceRailContext.filter ? 'spx-active' : '', item.label);
        button.type = 'button';
        button.dataset.spxResourceRailFilter = item.value;
        setRailAction(button, 'filter');
        filters.appendChild(button);
      });
      rail.appendChild(filters);

      var list = createEl('div', 'spx-read-resource-list');
      if (!visibleEntries.length) {
        list.appendChild(createEl('div', 'spx-watch-empty', '没有匹配的资源。'));
      }
      visibleEntries.forEach(function appendReadResourceRailEntry(entry) {
        var item = createEl('article', 'spx-read-resource-card');
        item.dataset.key = entry.key;
        item.dataset.type = entry.type;
        var top = createEl('div', 'spx-read-resource-card-top');
        top.appendChild(createEl('span', 'spx-read-resource-type', entry.typeLabel));
        top.appendChild(createEl('span', 'spx-status-badge spx-status-' + entry.status, entry.statusLabel));
        item.appendChild(top);
        var link = createEl('a', 'spx-read-resource-url', entry.url);
        link.href = entry.url;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.title = entry.url;
        item.appendChild(link);
        var metaParts = [entry.floorLabel, entry.author, entry.accessCode ? ('提取码 ' + entry.accessCode) : '', entry.note ? ('备注 ' + entry.note) : ''];
        item.appendChild(createEl('div', 'spx-read-resource-meta', metaParts.filter(Boolean).join(' · ') || '暂无来源'));
        var itemActions = createEl('div', 'spx-read-resource-card-actions');
        var jumpButton = createEl('button', '', '定位楼层');
        var copyButton = createEl('button', '', '复制');
        var saveOneButton = createEl('button', '', entry.saved ? '已保存' : '保存');
        var todoButton = createEl('button', '', '待下载');
        var doneButton = createEl('button', '', '已处理');
        var invalidButton = createEl('button', '', '失效');
        [jumpButton, copyButton, saveOneButton, todoButton, doneButton, invalidButton].forEach(function setupResourceCardButton(button) {
          button.type = 'button';
          itemActions.appendChild(button);
        });
        setRailAction(jumpButton, 'jump', entry.key);
        setRailAction(copyButton, 'copy-one', entry.key);
        setRailAction(saveOneButton, 'save-one', entry.key);
        setRailAction(todoButton, 'status', entry.key, 'todo');
        setRailAction(doneButton, 'status', entry.key, 'done');
        setRailAction(invalidButton, 'status', entry.key, 'invalid');
        saveOneButton.classList.toggle('spx-action-secondary', entry.saved);
        item.appendChild(itemActions);
        list.appendChild(item);
      });
      rail.appendChild(list);
      setReadResourceRailCollapsed(isReadResourceRailCollapsed());
    }

    rail.spxRender = renderRail;
    rail.addEventListener('click', handleReadResourceRailClick);
    launcher.addEventListener('click', function expandReadResourceRail() {
      setReadResourceRailCollapsed(false);
    });
    document.body.appendChild(rail);
    document.body.appendChild(launcher);
    renderRail();
    return rail;
  }

  function refreshReadResourceRail() {
    var rail = qs('#spx-read-resource-rail');
    if (rail && typeof rail.spxRender === 'function') {
      rail.spxRender();
      return;
    }
    if (readResourceRailContext.posts && readResourceRailContext.posts.length) {
      createReadResourceRail(readResourceRailContext.posts, readResourceRailContext.state);
    }
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
      setCenterPanelHidden(panel, false);
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
      refreshReadResourceRail();
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
    var strip = createEl('div', 'spx-preview-lightbox-strip');

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
      var nextSrc = images[currentIndex].src;
      zoom = 1;
      zoomText.textContent = '100%';
      counter.textContent = '图片 ' + (currentIndex + 1) + ' / ' + images.length;
      urlText.textContent = nextSrc;
      urlText.title = nextSrc;
      copyButton.textContent = '复制地址';
      image.alt = '预览图 ' + (currentIndex + 1);
      image.dataset.spxPreviewReady = '0';
      image.onload = function handleLightboxImageLoad() {
        markPreviewImageLoaded(image);
        applyImageSize();
      };
      image.onerror = function showImageError() {
        markPreviewImageLoaded(image);
        urlText.textContent = '原图加载失败：' + nextSrc;
      };
      image.src = nextSrc;
      if (image.complete && image.naturalWidth) {
        markPreviewImageLoaded(image);
        applyImageSize();
      }
      qsa('.spx-preview-lightbox-thumb', strip).forEach(function syncThumb(button, thumbIndex) {
        var active = thumbIndex === currentIndex;
        button.classList.toggle('spx-active', active);
        button.setAttribute('aria-current', active ? 'true' : 'false');
        if (active && button.scrollIntoView) button.scrollIntoView({ block: 'nearest', inline: 'center' });
      });
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
    images.forEach(function appendLightboxThumb(item, index) {
      var thumbButton = createEl('button', 'spx-preview-lightbox-thumb');
      var thumbImage = createEl('img');
      thumbButton.type = 'button';
      thumbButton.title = '查看第 ' + (index + 1) + ' 张';
      thumbButton.dataset.spxPreviewThumbIndex = String(index);
      thumbImage.loading = 'lazy';
      thumbImage.decoding = 'async';
      thumbImage.alt = '预览缩略图 ' + (index + 1);
      preparePreviewImageReveal(thumbImage);
      thumbImage.src = item.src;
      if (thumbImage.complete && thumbImage.naturalWidth) markPreviewImageLoaded(thumbImage);
      thumbButton.appendChild(thumbImage);
      strip.appendChild(thumbButton);
    });
    strip.addEventListener('click', function handleLightboxThumbClick(event) {
      var thumb = event.target && event.target.closest
        ? event.target.closest('[data-spx-preview-thumb-index]')
        : null;
      if (!thumb || !strip.contains(thumb)) return;
      showImage(Number(thumb.dataset.spxPreviewThumbIndex) || 0);
    });
    if (images.length > 1) shell.appendChild(strip);
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

    var panel = createEl('section', 'spx-preview-panel spx-preview-drawer spx-preview-collapsed');
    panel.id = 'spx-preview-panel';
    var header = createEl('div', 'spx-preview-header');
    var title = createEl('strong', '', '预览图');
    var summary = createEl('span', 'spx-preview-summary');
    var actions = createEl('div', 'spx-preview-actions');
    var downloadAllButton = createEl('button', '', '下载全部');
    var copyAllButton = createEl('button', '', '复制全部链接');
    var copyFloorButton = createEl('button', '', '按楼层复制');
    var copyMarkdownButton = createEl('button', '', '复制Markdown');
    var largeOnlyButton = createEl('button', '', '只看大图');
    var masonryButton = createEl('button', '', '瀑布流');
    var drawerButton = createEl('button', '', '侧栏');
    var collapseDrawerButton = createEl('button', '', '收起');
    var downloadPanel = createEl('section', 'spx-preview-download');
    var downloadTop = createEl('div', 'spx-preview-download-top');
    var downloadTitle = createEl('strong', '', '下载准备中');
    var downloadPercent = createEl('span', 'spx-preview-download-percent', '0%');
    var downloadTrack = createEl('div', 'spx-preview-download-track');
    var downloadProgress = createEl('span', 'spx-preview-download-progress');
    var downloadCompact = createEl('div', 'spx-preview-download-compact');
    var downloadBadges = createEl('div', 'spx-preview-download-badges');
    var downloadActions = createEl('div', 'spx-preview-download-actions');
    var packDownloadedButton = createEl('button', 'spx-primary', '打包已完成');
    var retryFailedButton = createEl('button', '', '重试失败');
    var cancelDownloadButton = createEl('button', '', '取消');
    var downloadDetail = createEl('details', 'spx-preview-download-detail');
    var downloadDetailSummary = createEl('summary');
    var downloadDetailText = createEl('span', 'spx-preview-download-detail-text');
    var downloadQueue = createEl('div', 'spx-preview-download-queue');
    var grid = createEl('div', 'spx-preview-grid');
    var loadMoreButton = createEl('button', 'spx-preview-load-more', '加载更多图片');
    var drawerTab = createEl('button', 'spx-preview-drawer-tab', '预览图');
    var showLargeOnly = false;
    var previewImages = null;
    var visiblePreviewImages = [];
    var previewDownloadState = null;
    var renderedPreviewLimit = PREVIEW_GALLERY_BATCH_SIZE;
    var idleScanId = null;
    var idleScanType = '';

    downloadAllButton.type = 'button';
    copyAllButton.type = 'button';
    copyFloorButton.type = 'button';
    copyMarkdownButton.type = 'button';
    largeOnlyButton.type = 'button';
    masonryButton.type = 'button';
    drawerButton.type = 'button';
    collapseDrawerButton.type = 'button';
    packDownloadedButton.type = 'button';
    retryFailedButton.type = 'button';
    cancelDownloadButton.type = 'button';
    loadMoreButton.type = 'button';
    drawerTab.type = 'button';
    downloadAllButton.title = '下载当前筛选范围内的全部原图并打包为 ZIP';
    copyAllButton.title = '复制当前筛选范围内的全部原图地址';
    copyFloorButton.title = '按楼层分组复制当前筛选范围内的原图地址';
    copyMarkdownButton.title = '复制当前筛选范围内的 Markdown 图片清单';
    largeOnlyButton.title = '只显示尺寸较大的预览图';
    masonryButton.title = '切换瀑布流缩略图排列';
    drawerButton.title = '将预览图固定到右侧侧栏';
    collapseDrawerButton.title = '收起右侧预览图侧栏';
    packDownloadedButton.title = '跳过仍失败的图片，只将已下载图片打包为 ZIP';
    retryFailedButton.title = '重新下载失败图片，单轮最多重试 6 次';
    cancelDownloadButton.title = '取消当前批量下载';
    drawerTab.title = '展开预览图侧栏';
    loadMoreButton.title = '继续加载下一批预览图';
    largeOnlyButton.setAttribute('aria-pressed', 'false');
    masonryButton.setAttribute('aria-pressed', 'false');
    drawerButton.setAttribute('aria-pressed', 'false');
    collapseDrawerButton.hidden = true;
    downloadPanel.hidden = true;
    downloadTrack.appendChild(downloadProgress);
    downloadTop.appendChild(downloadTitle);
    downloadTop.appendChild(downloadPercent);
    downloadActions.appendChild(packDownloadedButton);
    downloadActions.appendChild(retryFailedButton);
    downloadActions.appendChild(cancelDownloadButton);
    downloadCompact.appendChild(downloadBadges);
    downloadCompact.appendChild(downloadActions);
    downloadDetailSummary.appendChild(downloadDetailText);
    downloadDetail.appendChild(downloadDetailSummary);
    downloadDetail.appendChild(downloadQueue);
    downloadPanel.appendChild(downloadTop);
    downloadPanel.appendChild(downloadTrack);
    downloadPanel.appendChild(downloadCompact);
    downloadPanel.appendChild(downloadDetail);

    function cancelIdlePreviewScan() {
      if (idleScanId === null) return;
      if (idleScanType === 'idle' && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleScanId);
      } else {
        window.clearTimeout(idleScanId);
      }
      idleScanId = null;
      idleScanType = '';
    }

    function scanPreviewImages() {
      if (previewImages) return previewImages;
      cancelIdlePreviewScan();
      var nextImages = [];
      posts.forEach(function collectPostImages(post, postIndex) {
        var postContent = qs('.tpc_content', post);
        if (!postContent) return;
        var floorLabel = getPostFloorLabel(postIndex);
        var author = getPostAuthor(post);
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
            floorLabel: floorLabel,
            author: author,
          };
          if (isPreviewImageCandidate(item)) nextImages.push(item);
        });
      });

      var seen = {};
      previewImages = nextImages.filter(function uniqueImage(item) {
        if (!item.src || seen[item.src]) return false;
        seen[item.src] = true;
        return true;
      });
      visiblePreviewImages = previewImages.slice();
      return previewImages;
    }

    function getVisiblePreviewImages() {
      var images = previewImages || [];
      return showLargeOnly ? images.filter(isLargePreviewImage) : images.slice();
    }

    function scheduleIdlePreviewScan() {
      if (idleScanId !== null) return;
      var callback = function runIdlePreviewScan() {
        idleScanId = null;
        idleScanType = '';
        if (!panel.isConnected) return;
        var images = scanPreviewImages();
        if (!images.length && panel.classList.contains('spx-preview-collapsed')) {
          restorePreviewGallery();
          return;
        }
        visiblePreviewImages = getVisiblePreviewImages();
        if (panel.classList.contains('spx-preview-collapsed')) syncPreviewHeader();
        else renderPreviewGrid();
      };
      if (typeof window.requestIdleCallback === 'function') {
        idleScanType = 'idle';
        idleScanId = window.requestIdleCallback(callback, { timeout: 2200 });
      } else {
        idleScanType = 'timer';
        idleScanId = window.setTimeout(callback, 1200);
      }
    }

    function setPreviewButtonText(button, text, delay) {
      clearTimeout(button.spxPreviewTimer);
      if (!button.dataset.spxOriginalText) button.dataset.spxOriginalText = button.textContent;
      button.textContent = text;
      button.spxPreviewTimer = setTimeout(function restorePreviewButtonText() {
        if (button.isConnected) button.textContent = button.dataset.spxOriginalText || '复制全部链接';
        delete button.dataset.spxOriginalText;
      }, delay || 1400);
    }

    function copyPreviewText(button, text, count) {
      button.disabled = true;
      copyTextToClipboard(text).then(
        function showCopySuccess() {
          button.disabled = false;
          setPreviewButtonText(button, '已复制 ' + count + ' 条');
        },
        function showCopyFailure() {
          button.disabled = false;
          setPreviewButtonText(button, '复制失败');
        }
      );
    }

    function getPreviewDownloadCounts() {
      var entries = previewDownloadState && previewDownloadState.entries ? previewDownloadState.entries : [];
      return entries.reduce(function countPreviewDownload(result, entry) {
        result.total += 1;
        if (entry.status === 'done') result.done += 1;
        else if (entry.status === 'failed') result.failed += 1;
        else if (entry.status === 'downloading' || entry.status === 'retrying') result.active += 1;
        else if (entry.status === 'queued') result.queued += 1;
        else if (entry.status === 'cancelled') result.cancelled += 1;
        return result;
      }, { total: 0, done: 0, failed: 0, active: 0, queued: 0, cancelled: 0, packing: !!(previewDownloadState && previewDownloadState.packing) });
    }

    function getPreviewDownloadProgressPercent() {
      var entries = previewDownloadState && previewDownloadState.entries ? previewDownloadState.entries : [];
      if (!entries.length) return 0;
      var total = entries.reduce(function sumPreviewDownloadProgress(sum, entry) {
        if (entry.status === 'done') return sum + 100;
        if (entry.status === 'failed' || entry.status === 'cancelled') return sum;
        return sum + Math.max(0, Math.min(99, Number(entry.progress) || 0));
      }, 0);
      return Math.round(total / entries.length);
    }

    function createPreviewDownloadBadge(text, className) {
      return createEl('span', ['spx-preview-download-badge', className || ''].filter(Boolean).join(' '), text);
    }

    function getPreviewDownloadEntryStatusText(entry) {
      if (!entry) return '';
      if (entry.status === 'done') return '已完成';
      if (entry.status === 'failed') return entry.attempts >= PREVIEW_DOWNLOAD_MAX_RETRIES ? '已达上限' : '失败';
      if (entry.status === 'cancelled') return '已取消';
      if (entry.status === 'retrying') return '重试中';
      if (entry.status === 'downloading') return (entry.progress || 0) + '%';
      return '等待';
    }

    function renderPreviewDownloadQueue() {
      if (!previewDownloadState) return;
      var counts = getPreviewDownloadCounts();
      var activeEntries = previewDownloadState.entries.filter(function keepVisiblePreviewDownload(entry) {
        return entry.status !== 'done';
      });
      downloadQueue.textContent = '';

      activeEntries.forEach(function appendPreviewDownloadEntry(entry) {
        var row = createEl('div', 'spx-preview-download-row');
        var main = createEl('div');
        var name = createEl('div', 'spx-preview-download-name');
        var label = createEl('b', '', entry.fileName || formatPreviewImageDownloadFileName(entry.item, entry.index, entry.contentType));
        var size = createEl('em', '', entry.loaded && entry.total ? Math.round(entry.loaded / 1024) + ' / ' + Math.round(entry.total / 1024) + ' KB' : ('第 ' + entry.attempts + ' / ' + PREVIEW_DOWNLOAD_MAX_RETRIES + ' 次'));
        var track = createEl('div', 'spx-preview-download-track');
        var progress = createEl('span', 'spx-preview-download-progress');
        var meta = createEl('div', 'spx-preview-download-meta');
        var source = [entry.item && entry.item.floorLabel, entry.item && entry.item.author].filter(Boolean).join(' · ') || '预览图';
        var status = entry.error || getPreviewDownloadEntryStatusText(entry);
        progress.style.width = Math.max(0, Math.min(100, Number(entry.progress) || 0)) + '%';
        name.appendChild(label);
        name.appendChild(size);
        track.appendChild(progress);
        meta.appendChild(createEl('span', '', source));
        meta.appendChild(createEl('span', '', status));
        main.appendChild(name);
        main.appendChild(track);
        main.appendChild(meta);
        row.appendChild(main);
        if (entry.status === 'failed') {
          var retryButton = createEl('button', '', entry.attempts >= PREVIEW_DOWNLOAD_MAX_RETRIES ? '已达上限' : '重试');
          retryButton.type = 'button';
          retryButton.disabled = previewDownloadState.running || previewDownloadState.packing || entry.attempts >= PREVIEW_DOWNLOAD_MAX_RETRIES;
          retryButton.dataset.spxPreviewDownloadRetry = String(entry.index);
          row.appendChild(retryButton);
        } else {
          row.appendChild(createPreviewDownloadBadge(getPreviewDownloadEntryStatusText(entry), entry.status === 'failed' ? 'spx-fail' : ''));
        }
        downloadQueue.appendChild(row);
      });

      if (counts.done) {
        var doneRow = createEl('div', 'spx-preview-download-row');
        var doneMain = createEl('div');
        var doneName = createEl('div', 'spx-preview-download-name');
        var doneTrack = createEl('div', 'spx-preview-download-track');
        var doneProgress = createEl('span', 'spx-preview-download-progress');
        var doneMeta = createEl('div', 'spx-preview-download-meta');
        doneName.appendChild(createEl('b', '', '已完成 ' + counts.done + ' 张'));
        doneName.appendChild(createEl('em', '', '可打包'));
        doneProgress.style.width = '100%';
        doneTrack.appendChild(doneProgress);
        doneMeta.appendChild(createEl('span', '', '完成项默认合并，避免列表过长'));
        doneMeta.appendChild(createEl('span', '', '100%'));
        doneMain.appendChild(doneName);
        doneMain.appendChild(doneTrack);
        doneMain.appendChild(doneMeta);
        doneRow.appendChild(doneMain);
        doneRow.appendChild(createPreviewDownloadBadge('完成', 'spx-ok'));
        downloadQueue.appendChild(doneRow);
      }

      if (counts.failed && counts.done) {
        var report = createEl('div', 'spx-preview-download-report');
        var reportTitle = createEl('strong');
        reportTitle.appendChild(createEl('span', '', 'ZIP 打包'));
        reportTitle.appendChild(createEl('span', '', '可只打包已完成图片'));
        report.appendChild(reportTitle);
        report.appendChild(createEl('span', '', '失败图片和原始链接会写入 download-report.txt。'));
        downloadQueue.appendChild(report);
      }
    }

    function renderPreviewDownload() {
      if (!previewDownloadState || !previewDownloadState.entries.length) {
        downloadPanel.hidden = true;
        return;
      }
      var counts = getPreviewDownloadCounts();
      var percent = getPreviewDownloadProgressPercent();
      downloadPanel.hidden = false;
      downloadAllButton.disabled = previewDownloadState.running || previewDownloadState.packing;
      if (previewDownloadState.error) {
        downloadTitle.textContent = 'ZIP 打包失败：' + previewDownloadState.error;
      } else if (previewDownloadState.packed) {
        downloadTitle.textContent = counts.failed ? ('已打包 ' + counts.done + ' 张 · ' + counts.failed + ' 张失败已记录') : ('已打包 ' + counts.done + ' 张图片');
      } else {
        downloadTitle.textContent = getPreviewDownloadStatusSummary(counts);
      }
      downloadPercent.textContent = percent + '%';
      downloadProgress.style.width = percent + '%';
      downloadBadges.textContent = '';
      if (counts.done) downloadBadges.appendChild(createPreviewDownloadBadge(counts.done + ' 完成', 'spx-ok'));
      if (counts.active) downloadBadges.appendChild(createPreviewDownloadBadge(counts.active + ' 下载中', ''));
      if (counts.queued) downloadBadges.appendChild(createPreviewDownloadBadge(counts.queued + ' 等待', ''));
      if (counts.failed) downloadBadges.appendChild(createPreviewDownloadBadge(counts.failed + ' 失败', 'spx-fail'));
      if (counts.done && counts.failed && !counts.active && !counts.queued) downloadBadges.appendChild(createPreviewDownloadBadge('可打包', 'spx-zip'));
      packDownloadedButton.hidden = !counts.done;
      packDownloadedButton.disabled = previewDownloadState.packing;
      retryFailedButton.disabled = previewDownloadState.running || previewDownloadState.packing || !counts.failed;
      cancelDownloadButton.hidden = !previewDownloadState.running && !previewDownloadState.packing;
      cancelDownloadButton.disabled = previewDownloadState.packing;
      downloadDetailText.textContent = '下载详情：' + counts.active + ' 张下载中，' + counts.failed + ' 张失败，' + counts.done + ' 张已完成';
      renderPreviewDownloadQueue();
    }

    function formatPreviewDownloadError(error) {
      if (!error) return '下载失败';
      if (error.name === 'AbortError') return '已取消';
      var message = String(error.message || error || '下载失败');
      if (/跨域下载权限|GM_xmlhttpRequest|@connect/i.test(message)) return message.slice(0, 80);
      if (/Failed to fetch|NetworkError|Load failed|fetch/i.test(message)) return '网络或跨域限制';
      return message.slice(0, 80);
    }

    function readPreviewImageResponseBlob(response, entry) {
      var type = response && response.headers ? (response.headers.get('content-type') || '') : '';
      var total = Number(response && response.headers ? response.headers.get('content-length') : 0) || 0;
      entry.total = total;
      if (!response || !response.body || typeof response.body.getReader !== 'function') {
        return response.blob().then(function usePreviewResponseBlob(blob) {
          entry.progress = 100;
          entry.loaded = blob.size || total || 0;
          return { blob: blob, contentType: type || blob.type || '' };
        });
      }
      var reader = response.body.getReader();
      var chunks = [];
      var loaded = 0;
      function readNextChunk() {
        return reader.read().then(function handlePreviewChunk(result) {
          if (result.done) {
            entry.progress = 100;
            entry.loaded = loaded;
            return { blob: new Blob(chunks, { type: type || 'application/octet-stream' }), contentType: type };
          }
          var chunk = result.value;
          if (chunk) {
            chunks.push(chunk);
            loaded += chunk.length || chunk.byteLength || 0;
            entry.loaded = loaded;
            var nextProgress = total ? Math.floor((loaded / total) * 100) : Math.min(95, (Number(entry.progress) || 0) + 6);
            if (nextProgress !== entry.progress) {
              entry.progress = Math.max(1, Math.min(99, nextProgress));
              renderPreviewDownload();
            }
          }
          return readNextChunk();
        });
      }
      return readNextChunk();
    }

    function requestPrivilegedPreviewDownloadBlob(entry) {
      var requestApi = getPrivilegedRequestApi();
      if (!requestApi) return Promise.reject(new Error('缺少跨域下载权限，请更新脚本授权后重试'));
      return new Promise(function runPrivilegedPreviewRequest(resolve, reject) {
        var requestHandle = null;
        var controller = {
          abort: function abortPrivilegedPreviewRequest() {
            if (requestHandle && typeof requestHandle.abort === 'function') requestHandle.abort();
          },
        };
        if (previewDownloadState) previewDownloadState.controllers.push(controller);
        function cleanup() {
          if (!previewDownloadState) return;
          previewDownloadState.controllers = previewDownloadState.controllers.filter(function keepController(item) {
            return item !== controller;
          });
        }
        try {
          requestHandle = requestApi({
            method: 'GET',
            url: entry.src,
            responseType: 'blob',
            timeout: 45000,
            headers: {
              Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
            onprogress: function handlePrivilegedPreviewProgress(event) {
              var loaded = Number(event && event.loaded) || 0;
              var total = Number(event && event.total) || 0;
              if (loaded) entry.loaded = loaded;
              if (total) entry.total = total;
              if (loaded && total) entry.progress = Math.max(1, Math.min(99, Math.floor((loaded / total) * 100)));
              else entry.progress = Math.min(95, (Number(entry.progress) || 0) + 4);
              renderPreviewDownload();
            },
            onload: function handlePrivilegedPreviewLoaded(response) {
              cleanup();
              var status = Number(response && response.status) || 0;
              if (status && (status < 200 || status >= 300)) {
                reject(new Error('HTTP ' + status));
                return;
              }
              var result = getPrivilegedResponseBlob(response);
              if (!result || !result.blob || !result.blob.size) {
                reject(new Error('跨域下载内容为空'));
                return;
              }
              entry.progress = 100;
              entry.loaded = result.blob.size;
              entry.total = result.blob.size;
              resolve(result);
            },
            onerror: function handlePrivilegedPreviewError(error) {
              cleanup();
              reject(new Error((error && error.error) || '跨域下载请求失败'));
            },
            ontimeout: function handlePrivilegedPreviewTimeout() {
              cleanup();
              reject(new Error('跨域下载超时'));
            },
            onabort: function handlePrivilegedPreviewAbort() {
              cleanup();
              var error = new Error('已取消');
              error.name = 'AbortError';
              reject(error);
            },
          });
          if (requestHandle && typeof requestHandle.then === 'function') {
            requestHandle.then(function handlePrivilegedPromiseResponse(response) {
              var loaded = getPrivilegedResponseBlob(response);
              cleanup();
              if (!loaded || !loaded.blob || !loaded.blob.size) reject(new Error('跨域下载内容为空'));
              else resolve(loaded);
            }, function handlePrivilegedPromiseError(error) {
              cleanup();
              reject(error || new Error('跨域下载请求失败'));
            });
          }
        } catch (error) {
          cleanup();
          reject(error);
        }
      });
    }

    function fetchPreviewDownloadBlob(entry) {
      var fetchImpl = typeof window !== 'undefined' && typeof window.fetch === 'function' ? window.fetch.bind(window) : null;
      if (shouldUsePrivilegedPreviewDownload(entry.src, location.href)) return requestPrivilegedPreviewDownloadBlob(entry);
      if (!fetchImpl) return Promise.reject(new Error('当前浏览器不支持 fetch'));
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var options = { credentials: 'same-origin', cache: 'force-cache' };
      if (controller) {
        options.signal = controller.signal;
        previewDownloadState.controllers.push(controller);
      }
      return fetchImpl(entry.src, options).then(function inspectPreviewDownloadResponse(response) {
        if (!response || !response.ok) throw new Error('HTTP ' + (response ? response.status : 0));
        return readPreviewImageResponseBlob(response, entry);
      }).catch(function fallbackPreviewDownloadWithPrivilege(error) {
        if (!shouldUsePrivilegedPreviewDownload(entry.src, location.href)) throw error;
        return requestPrivilegedPreviewDownloadBlob(entry);
      }).finally(function removePreviewDownloadController() {
        if (!controller || !previewDownloadState) return;
        previewDownloadState.controllers = previewDownloadState.controllers.filter(function keepController(item) {
          return item !== controller;
        });
      });
    }

    function delayPreviewDownloadRetry(ms) {
      return new Promise(function waitPreviewDownload(resolve) {
        window.setTimeout(resolve, ms);
      });
    }

    function runPreviewDownloadEntry(entry) {
      function attemptPreviewDownload() {
        if (!previewDownloadState || previewDownloadState.cancelled) {
          entry.status = 'cancelled';
          entry.error = '已取消';
          return Promise.resolve();
        }
        entry.attempts += 1;
        entry.status = entry.attempts > 1 ? 'retrying' : 'downloading';
        entry.progress = 0;
        entry.error = '';
        renderPreviewDownload();
        return fetchPreviewDownloadBlob(entry).then(function markPreviewDownloadDone(result) {
          entry.status = 'done';
          entry.blob = result.blob;
          entry.contentType = result.contentType || (result.blob && result.blob.type) || '';
          entry.fileName = formatPreviewImageDownloadFileName(entry.item, entry.index, entry.contentType);
          entry.progress = 100;
          entry.error = '';
          renderPreviewDownload();
        }).catch(function handlePreviewDownloadFailure(error) {
          entry.error = formatPreviewDownloadError(error);
          if (previewDownloadState && previewDownloadState.cancelled) {
            entry.status = 'cancelled';
            renderPreviewDownload();
            return;
          }
          if (entry.attempts < PREVIEW_DOWNLOAD_MAX_RETRIES) {
            entry.status = 'retrying';
            renderPreviewDownload();
            return delayPreviewDownloadRetry(Math.min(1500, 220 * entry.attempts)).then(attemptPreviewDownload);
          }
          entry.status = 'failed';
          entry.progress = 0;
          renderPreviewDownload();
        });
      }
      return attemptPreviewDownload();
    }

    function runPreviewDownloadQueue(entries) {
      var queue = (entries || []).slice();
      var active = 0;
      return new Promise(function resolvePreviewDownloadQueue(resolve) {
        function pumpPreviewDownloadQueue() {
          if (!previewDownloadState || previewDownloadState.cancelled) {
            if (!active) resolve();
            return;
          }
          while (active < PREVIEW_DOWNLOAD_CONCURRENCY && queue.length) {
            active += 1;
            runPreviewDownloadEntry(queue.shift()).then(function finishOnePreviewDownload() {
              active -= 1;
              pumpPreviewDownloadQueue();
            });
          }
          if (!active && !queue.length) resolve();
        }
        pumpPreviewDownloadQueue();
      });
    }

    function createPreviewDownloadEntries(images) {
      return (images || []).map(function createPreviewDownloadEntry(item, index) {
        return {
          index: index,
          item: item,
          src: getPreviewImageSource(item),
          status: 'queued',
          progress: 0,
          attempts: 0,
          loaded: 0,
          total: 0,
          error: '',
          blob: null,
          fileName: formatPreviewImageDownloadFileName(item, index, ''),
        };
      }).filter(function keepPreviewDownloadEntry(entry) {
        return !!entry.src;
      });
    }

    function getPreviewDownloadedZipFiles() {
      if (!previewDownloadState) return [];
      var files = previewDownloadState.entries.filter(function keepDonePreviewDownload(entry) {
        return entry.status === 'done' && entry.blob;
      }).map(function mapDonePreviewDownload(entry) {
        return { name: entry.fileName || formatPreviewImageDownloadFileName(entry.item, entry.index, entry.contentType), blob: entry.blob };
      });
      var hasFailed = previewDownloadState.entries.some(function hasFailedPreviewDownload(entry) {
        return entry.status === 'failed';
      });
      if (hasFailed) {
        files.push({ name: 'download-report.txt', blob: new Blob([formatPreviewDownloadReport(previewDownloadState.entries)], { type: 'text/plain;charset=utf-8' }) });
      }
      return files;
    }

    function packPreviewDownloadedImages() {
      if (!previewDownloadState || previewDownloadState.packing) return;
      var files = getPreviewDownloadedZipFiles();
      if (!files.length) {
        downloadTitle.textContent = '没有已下载图片可打包';
        return;
      }
      previewDownloadState.packing = true;
      previewDownloadState.error = '';
      renderPreviewDownload();
      createPreviewZipBlob(files).then(function downloadPreviewZip(blob) {
        downloadBlobFile(formatPreviewImageArchiveFileName(), blob);
        previewDownloadState.packed = true;
        previewDownloadState.packing = false;
        renderPreviewDownload();
      }).catch(function handlePreviewZipFailure(error) {
        previewDownloadState.packing = false;
        previewDownloadState.error = formatPreviewDownloadError(error);
        downloadTitle.textContent = 'ZIP 打包失败：' + previewDownloadState.error;
        renderPreviewDownload();
      });
    }

    function finishPreviewDownloadQueue() {
      if (!previewDownloadState) return;
      previewDownloadState.running = false;
      previewDownloadState.controllers = [];
      renderPreviewDownload();
      var counts = getPreviewDownloadCounts();
      if (counts.done && !counts.failed && !counts.cancelled) packPreviewDownloadedImages();
    }

    function startPreviewDownload(entries) {
      var downloadEntries = (entries || []).filter(function keepEntryForPreviewDownload(entry) {
        return entry && entry.src && entry.status !== 'done';
      });
      if (!downloadEntries.length) {
        renderPreviewDownload();
        return;
      }
      previewDownloadState.running = true;
      previewDownloadState.cancelled = false;
      previewDownloadState.packing = false;
      previewDownloadState.packed = false;
      previewDownloadState.error = '';
      renderPreviewDownload();
      runPreviewDownloadQueue(downloadEntries).then(finishPreviewDownloadQueue);
    }

    function startPreviewDownloadAll() {
      if (previewDownloadState && previewDownloadState.running) return;
      ensurePreviewImages(false);
      previewDownloadState = {
        entries: createPreviewDownloadEntries(visiblePreviewImages),
        running: false,
        cancelled: false,
        packing: false,
        packed: false,
        error: '',
        controllers: [],
      };
      if (!previewDownloadState.entries.length) {
        renderPreviewDownload();
        setPreviewButtonText(downloadAllButton, '无可下载图片');
        return;
      }
      startPreviewDownload(previewDownloadState.entries);
    }

    function cancelPreviewDownload() {
      if (!previewDownloadState) return;
      previewDownloadState.cancelled = true;
      previewDownloadState.running = false;
      previewDownloadState.controllers.forEach(function abortPreviewDownload(controller) {
        try { controller.abort(); } catch (error) {}
      });
      previewDownloadState.entries.forEach(function markQueuedPreviewDownloadCancelled(entry) {
        if (entry.status === 'queued' || entry.status === 'downloading' || entry.status === 'retrying') {
          entry.status = 'cancelled';
          entry.error = '已取消';
        }
      });
      renderPreviewDownload();
    }

    function retryFailedPreviewDownloads(resetAll) {
      if (!previewDownloadState || previewDownloadState.running || previewDownloadState.packing) return;
      var failedEntries = previewDownloadState.entries.filter(function keepFailedPreviewDownload(entry) {
        return entry.status === 'failed' && (resetAll || entry.attempts < PREVIEW_DOWNLOAD_MAX_RETRIES);
      });
      failedEntries.forEach(function resetFailedPreviewDownload(entry) {
        entry.status = 'queued';
        entry.progress = 0;
        entry.loaded = 0;
        entry.total = 0;
        entry.error = '';
        if (resetAll) entry.attempts = 0;
      });
      startPreviewDownload(failedEntries);
    }

    function syncPreviewLayoutButtons() {
      var isDrawer = panel.classList.contains('spx-preview-drawer');
      var isMasonry = panel.classList.contains('spx-preview-masonry');
      drawerButton.textContent = isDrawer ? '回正文' : '侧栏';
      drawerButton.setAttribute('aria-pressed', isDrawer ? 'true' : 'false');
      masonryButton.setAttribute('aria-pressed', isMasonry ? 'true' : 'false');
      collapseDrawerButton.hidden = !isDrawer;
    }

    function syncPreviewHeader() {
      var scanned = Array.isArray(previewImages);
      var allImages = previewImages || [];
      var largeCount = scanned ? allImages.filter(isLargePreviewImage).length : 0;
      var renderState = getPreviewGalleryRenderState(visiblePreviewImages.length, renderedPreviewLimit);
      summary.textContent = scanned
        ? formatPreviewGallerySummary(allImages.length, visiblePreviewImages.length, renderState.rendered, showLargeOnly)
        : '展开后加载当前页图片';
      drawerTab.textContent = scanned && allImages.length ? ('预览图 ' + allImages.length) : '预览图';
      largeOnlyButton.hidden = !scanned || !allImages.length || largeCount === allImages.length;
      largeOnlyButton.setAttribute('aria-pressed', showLargeOnly ? 'true' : 'false');
      downloadAllButton.disabled = (previewDownloadState && previewDownloadState.running) || !scanned || !visiblePreviewImages.length;
      copyAllButton.disabled = !scanned || !visiblePreviewImages.length;
      copyFloorButton.disabled = !scanned || !visiblePreviewImages.length;
      copyMarkdownButton.disabled = !scanned || !visiblePreviewImages.length;
      loadMoreButton.hidden = !scanned || !renderState.hasMore;
      loadMoreButton.textContent = '加载更多图片（' + renderState.rendered + ' / ' + renderState.total + '）';
      syncPreviewLayoutButtons();
    }

    function renderPreviewGrid() {
      scanPreviewImages();
      visiblePreviewImages = getVisiblePreviewImages();
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
        link.dataset.spxPreviewIndex = String(index);

        var thumb = createEl('img');
        thumb.loading = 'lazy';
        thumb.decoding = 'async';
        thumb.alt = '预览图 ' + (index + 1);
        preparePreviewImageReveal(thumb);
        thumb.src = item.src;
        if (thumb.complete && thumb.naturalWidth) markPreviewImageLoaded(thumb);

        var hoverImage = createEl('img', 'spx-preview-hover-image');
        hoverImage.loading = 'lazy';
        hoverImage.decoding = 'async';
        preparePreviewImageReveal(hoverImage);
        hoverImage.dataset.src = item.src;
        hoverImage.alt = '预览图 ' + (index + 1) + ' 放大预览';

        var label = createEl('span', '', getPreviewImageMetaText(item, index));
        link.appendChild(thumb);
        link.appendChild(hoverImage);
        link.appendChild(label);
        grid.appendChild(link);
      });
    }

    function ensurePreviewImages(render) {
      var images = scanPreviewImages();
      if (render) renderPreviewGrid();
      else {
        visiblePreviewImages = getVisiblePreviewImages();
        syncPreviewHeader();
      }
      return images;
    }

    function loadDelegatedPreviewHoverImage(target) {
      var link = target && target.closest ? target.closest('.spx-preview-item') : null;
      if (!link || !grid.contains(link)) return;
      var hoverImage = qs('.spx-preview-hover-image', link);
      if (hoverImage && !hoverImage.src) {
        hoverImage.src = hoverImage.dataset.src || link.href;
        if (hoverImage.complete && hoverImage.naturalWidth) markPreviewImageLoaded(hoverImage);
      }
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

    downloadAllButton.addEventListener('click', startPreviewDownloadAll);
    copyAllButton.addEventListener('click', function copyAllPreviewLinks() {
      ensurePreviewImages(false);
      copyPreviewText(copyAllButton, formatPreviewImageLinks(visiblePreviewImages), visiblePreviewImages.length);
    });
    copyFloorButton.addEventListener('click', function copyPreviewLinksByFloor() {
      ensurePreviewImages(false);
      copyPreviewText(copyFloorButton, formatPreviewImageLinksByFloor(visiblePreviewImages), visiblePreviewImages.length);
    });
    copyMarkdownButton.addEventListener('click', function copyPreviewMarkdownLinks() {
      ensurePreviewImages(false);
      copyPreviewText(copyMarkdownButton, formatPreviewImageMarkdownLinks(visiblePreviewImages), visiblePreviewImages.length);
    });
    packDownloadedButton.addEventListener('click', packPreviewDownloadedImages);
    retryFailedButton.addEventListener('click', function retryAllFailedPreviewDownloads() {
      retryFailedPreviewDownloads(true);
    });
    cancelDownloadButton.addEventListener('click', cancelPreviewDownload);
    downloadQueue.addEventListener('click', function handlePreviewDownloadQueueClick(event) {
      var button = event.target && event.target.closest ? event.target.closest('[data-spx-preview-download-retry]') : null;
      if (!button || !downloadQueue.contains(button) || !previewDownloadState) return;
      var index = Number(button.dataset.spxPreviewDownloadRetry);
      var entry = previewDownloadState.entries[index];
      if (!entry || entry.status !== 'failed') return;
      entry.status = 'queued';
      entry.progress = 0;
      entry.loaded = 0;
      entry.total = 0;
      entry.error = '';
      startPreviewDownload([entry]);
    });

    largeOnlyButton.addEventListener('click', function toggleLargeOnly() {
      ensurePreviewImages(false);
      showLargeOnly = !showLargeOnly;
      renderedPreviewLimit = PREVIEW_GALLERY_BATCH_SIZE;
      renderPreviewGrid();
    });
    masonryButton.addEventListener('click', function togglePreviewMasonry() {
      panel.classList.toggle('spx-preview-masonry');
      syncPreviewLayoutButtons();
    });
    drawerButton.addEventListener('click', function togglePreviewDrawer() {
      var nextDrawer = !panel.classList.contains('spx-preview-drawer');
      panel.classList.toggle('spx-preview-drawer', nextDrawer);
      panel.classList.remove('spx-preview-collapsed');
      syncPreviewLayoutButtons();
    });
    collapseDrawerButton.addEventListener('click', function collapsePreviewDrawer() {
      panel.classList.add('spx-preview-collapsed');
    });
    drawerTab.addEventListener('click', function expandPreviewDrawer() {
      panel.classList.remove('spx-preview-collapsed');
      ensurePreviewImages(true);
    });
    loadMoreButton.addEventListener('click', loadNextPreviewBatch);
    panel.addEventListener('scroll', handlePreviewPanelScroll);
    grid.addEventListener('click', function handlePreviewGridClick(event) {
      var link = event.target && event.target.closest ? event.target.closest('.spx-preview-item') : null;
      if (!link || !grid.contains(link)) return;
      if (event.button > 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      openPreviewLightbox(visiblePreviewImages, Number(link.dataset.spxPreviewIndex) || 0);
    });
    grid.addEventListener('mouseover', function handlePreviewGridHover(event) {
      loadDelegatedPreviewHoverImage(event.target);
    });
    grid.addEventListener('focusin', function handlePreviewGridFocus(event) {
      loadDelegatedPreviewHoverImage(event.target);
    });

    actions.appendChild(downloadAllButton);
    actions.appendChild(copyAllButton);
    actions.appendChild(copyFloorButton);
    actions.appendChild(copyMarkdownButton);
    actions.appendChild(largeOnlyButton);
    actions.appendChild(masonryButton);
    actions.appendChild(drawerButton);
    actions.appendChild(collapseDrawerButton);
    header.appendChild(title);
    header.appendChild(summary);
    header.appendChild(actions);
    panel.appendChild(header);
    panel.appendChild(downloadPanel);
    panel.appendChild(grid);
    panel.appendChild(loadMoreButton);
    panel.appendChild(drawerTab);
    panel.spxCleanup = function cleanupPreviewPanel() {
      cancelIdlePreviewScan();
      cancelPreviewDownload();
    };
    syncPreviewHeader();

    mountPreviewPanel(firstPost, content, panel);
    scheduleIdlePreviewScan();
  }

  function restorePreviewGallery() {
    closePreviewLightbox();
    var panel = qs('#spx-preview-panel');
    if (panel) {
      if (typeof panel.spxCleanup === 'function') panel.spxCleanup();
      panel.remove();
    }
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
    var selectors = [
      'textarea[name="atc_content"]',
      'textarea[name="content"]',
      'textarea#atc_content',
      'textarea[id*="content"]',
      'textarea',
    ];
    for (var index = 0; index < selectors.length; index += 1) {
      var editor = qsa(selectors[index], scope).filter(isQuickReplyEditorCandidate)[0];
      if (editor) return editor;
    }
    return null;
  }

  function isQuickReplyEditorCandidate(editor) {
    if (!editor) return false;
    if (editor.disabled || editor.readOnly) return false;
    if (
      editor.closest &&
      editor.closest('#spx-settings,#spx-toolbox,#spx-watch-center,#spx-history-center,#spx-auto-buy-center,#spx-resource-center,#spx-read-resource-rail,#spx-preview-lightbox,#spx-quick-reply')
    ) {
      return false;
    }
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

  function getQuickReplyFormValue(request, name) {
    var body = request && request.options && request.options.body;
    if (!body || typeof body.get !== 'function') return '';
    try {
      var value = body.get(name);
      return value == null ? '' : String(value).trim();
    } catch (error) {
      return '';
    }
  }

  function buildQuickReplyLastPageUrl(pageUrl, tid) {
    var id = String(tid || '').trim();
    if (!id) return '';
    var parsed = new URL(String(pageUrl || ''), 'https://south-plus.org/');
    return parsed.origin + '/read.php?tid=' + encodeURIComponent(id) + '&page=e#a';
  }

  function resolveQuickReplyRefreshUrl(pageUrl, request, submitResponse) {
    var baseUrl = pageUrl || (typeof location !== 'undefined' ? location.href : 'https://south-plus.org/');
    var responseUrl = '';

    try {
      responseUrl = submitResponse && submitResponse.url
        ? new URL(String(submitResponse.url), baseUrl).href
        : '';
    } catch (error) {
      responseUrl = '';
    }

    if (responseUrl && detectPageType(responseUrl) === 'read') return responseUrl;

    var tid =
      getQuickReplyFormValue(request, 'tid') ||
      parseThreadId(responseUrl) ||
      parseThreadId(baseUrl);
    return tid ? buildQuickReplyLastPageUrl(responseUrl || baseUrl, tid) : baseUrl;
  }

  function shouldUseQuickReplySubmitHtml(html, submitResponse) {
    var text = String(html || '');
    if (!text) return false;
    var responseUrl = '';
    try {
      responseUrl = submitResponse && submitResponse.url ? String(submitResponse.url) : '';
    } catch (error) {
      responseUrl = '';
    }
    if (responseUrl && detectPageType(responseUrl) === 'read') return true;
    return /(?:\bjs-post\b|\btpc_content\b|id=["']read_tpc["'])/i.test(text);
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
    var refreshUrl = '';

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
            refreshUrl = typeof options.resolveRefreshUrl === 'function'
              ? options.resolveRefreshUrl(response)
              : resolveQuickReplyRefreshUrl(options.pageUrl, options.request, response);
            if (typeof response.text !== 'function') return false;
            return readScriptResponseText(response, { mode: 'action', label: '快捷回复' })
              .then(function applySubmitHtml(html) {
                if (!shouldUseQuickReplySubmitHtml(html, response)) return false;
                return options.applyHtml(html, refreshUrl || options.pageUrl) !== false;
              });
          })
          .then(function reloadThreadWhenSubmitHtmlUnavailable(appliedSubmitHtml) {
            if (appliedSubmitHtml) return true;
            return options.fetch(refreshUrl || options.pageUrl, {
              credentials: 'include',
              cache: 'no-store',
            });
          })
          .then(function checkReloadResponse(response) {
            if (response === true) return true;
            if (!response || response.ok !== true) throw new Error('重新加载帖子失败');
            return readScriptResponseText(response, { mode: 'action', label: '快捷回复刷新' });
          })
          .then(function applyReloadedHtml(html) {
            if (html === true) return true;
            if (options.applyHtml(html, refreshUrl || options.pageUrl) === false) throw new Error('无法更新帖子内容');
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

  function setQuickReplyPanelError(panel, error) {
    if (!panel) return;
    var status = qs('.spx-quick-reply-status', panel);
    if (!status) return;
    status.classList.add('spx-error');
    status.textContent = error && error.spxRateLimited
      ? '站点提示操作频繁，内容已保留，请稍后重试。'
      : '提交失败，内容已保留，请重试。';
  }

  function submitQuickReplyAjax(editor, form, submitter, settings, state, panel) {
    if (!editor || !form) return false;
    var fetchImpl = typeof window !== 'undefined' && typeof window.fetch === 'function'
      ? function queueQuickReplyFetch(url, options) {
        return requestWithPolicy(url, options, {
          mode: 'action',
          label: '快捷回复',
          networkFriendly: isNetworkFriendlyMode(settings),
        });
      }
      : null;
    var FormDataCtor = typeof FormData === 'function' ? FormData : null;
    var request = createQuickReplyRequest(
      form,
      submitter,
      location.href,
      FormDataCtor
    );

    var pageType = detectPageType(location.href);
    if (!request || !fetchImpl || (pageType !== 'read' && pageType !== 'post')) {
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
      applyHtml: function applyHtml(html, refreshUrl) {
        var currentUrl = location.href;
        var shouldReplaceUrl =
          refreshUrl &&
          detectPageType(refreshUrl) === 'read' &&
          refreshUrl !== currentUrl &&
          typeof window !== 'undefined' &&
          window.history &&
          typeof window.history.replaceState === 'function';

        if (shouldReplaceUrl) {
          window.history.replaceState(window.history.state, document.title, refreshUrl);
        }

        if (replaceReadPageContent(html, settings, state)) return true;

        if (shouldReplaceUrl) {
          window.history.replaceState(window.history.state, document.title, currentUrl);
        }
        return false;
      },
      onError: function onError(error) {
        setQuickReplyPanelError(panel, error);
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

  function ensureQuickReplyControlId(control, prefix) {
    if (!control) return '';
    if (!control.id) {
      control.id = prefix + '-' + Math.random().toString(36).slice(2, 9);
    }
    return control.id;
  }

  function getQuickReplyAttachmentInput(form) {
    if (!form) return null;
    return qsa('input[type="file"]', form).filter(function usableAttachmentInput(input) {
      return input && !input.disabled;
    })[0] || null;
  }

  function getQuickReplyAttachmentDescriptionInput(form, attachmentInput) {
    if (!form || !attachmentInput) return null;
    var row = attachmentInput.closest && attachmentInput.closest('tr,div,p,section');
    var rowInputs = row ? qsa('input[type="text"],input:not([type])', row).filter(function usableDescInput(input) {
      return input && input !== attachmentInput && !input.disabled && !input.readOnly;
    }) : [];
    if (rowInputs.length) return rowInputs[0];
    return qsa('input[type="text"],input:not([type])', form).filter(function likelyDescInput(input) {
      var name = String(input.name || input.id || input.className || '').toLowerCase();
      return !input.disabled && !input.readOnly && /(?:desc|describe|intro|atc)/.test(name);
    })[0] || null;
  }

  function getQuickReplyAttachmentFiles(input) {
    if (!input || !input.files) return [];
    return Array.prototype.slice.call(input.files).filter(function keepImageAttachment(file) {
      return file && (!file.type || /^image\//i.test(file.type));
    });
  }

  function formatQuickReplyFileSize(size) {
    var value = Number(size);
    if (!isFinite(value) || value <= 0) return '未知大小';
    if (value < 1024 * 1024) return Math.max(1, Math.round(value / 1024)) + ' KB';
    return (value / 1024 / 1024).toFixed(1) + ' MB';
  }

  function formatQuickReplyAttachmentSummary(files) {
    var count = (files || []).length;
    return count
      ? '已选择 ' + count + ' 张图片；正式提交会随原站回复表单一起发送。'
      : '沿用原站附件上传；正式提交时随原站回复表单一起发送。';
  }

  function openFloatingQuickReplyContext(label, text) {
    var panel = qs('#spx-quick-reply');
    if (!panel || typeof panel.spxOpenWithContext !== 'function') return false;
    panel.spxOpenWithContext(label, text);
    return true;
  }

  function createQuickReplyPanel(settings, editor, state) {
    var replies = parseQuickReplyList((settings && settings.quickReplies || []).join('\n'));
    if (!editor || !replies.length) return null;

    var form = editor.closest && editor.closest('form');
    var attachmentInput = getQuickReplyAttachmentInput(form);
    var attachmentDesc = getQuickReplyAttachmentDescriptionInput(form, attachmentInput);
    var attachmentId = ensureQuickReplyControlId(attachmentInput, 'spx-quick-reply-attachment');

    if (attachmentInput && !attachmentInput.getAttribute('accept')) {
      attachmentInput.setAttribute('accept', 'image/*');
    }

    var panel = createEl('div', 'spx-quick-reply');
    panel.id = 'spx-quick-reply';
    panel.classList.add('spx-quick-reply-collapsed');
    panel.setAttribute('aria-label', '浮动回复框');

    var launcher = createEl('button', 'spx-quick-reply-launcher', '继续回复');
    launcher.type = 'button';
    launcher.id = 'spx-quick-reply-launcher';

    var selectionMenu = createEl('div', 'spx-quick-reply-selection');
    selectionMenu.id = 'spx-quick-reply-selection';
    selectionMenu.setAttribute('aria-label', '选中文字操作');
    var selectionQuote = createEl('button', '', '引用所选');
    selectionQuote.type = 'button';
    var selectionCancel = createEl('button', '', '取消');
    selectionCancel.type = 'button';
    selectionMenu.append(selectionQuote, selectionCancel);

    var header = createEl('div', 'spx-quick-reply-header');
    var title = createEl('div');
    title.appendChild(createEl('strong', '', '快速回复'));
    var status = createEl('span', 'spx-quick-reply-status', '草稿已保存 · Ctrl+Enter 发送');
    title.appendChild(status);
    var headerActions = createEl('div', 'spx-quick-reply-actions');
    var collapse = createEl('button', 'spx-quick-reply-icon', '最小化');
    collapse.type = 'button';
    collapse.title = '最小化回复框';
    headerActions.appendChild(collapse);
    header.append(title, headerActions);

    var context = createEl('div', 'spx-quick-reply-context');
    var contextText = createEl('span', '', '');
    var clearContext = createEl('button', '', '×');
    clearContext.type = 'button';
    clearContext.title = '清除引用';
    context.append(contextText, clearContext);

    var body = createEl('div', 'spx-quick-reply-body');
    var list = createEl('div', 'spx-quick-reply-list');

    replies.slice(0, 8).forEach(function appendReply(reply, index) {
      var button = createEl('button', 'spx-quick-reply-chip' + (index < 2 ? ' spx-hot' : ''), reply);
      button.type = 'button';
      button.title = '填入回复：' + reply;
      button.addEventListener('click', function useQuickReply() {
        insertMirrorText(reply);
      });
      list.appendChild(button);
    });

    var emotes = createEl('div', 'spx-quick-reply-emotes');
    var emoteHead = createEl('div', 'spx-quick-reply-emote-head');
    emoteHead.append(createEl('span', '', '原站表情'), createEl('span', '', '点击插入表情码'));
    var emoteGrid = createEl('div', 'spx-quick-reply-emote-grid');
    QUICK_REPLY_EMOTES.forEach(function appendEmote(emote) {
      var button = createEl('button', 'spx-quick-reply-emote');
      button.type = 'button';
      button.title = emote.fileName;
      button.dataset.spxEmote = emote.code;
      var img = createEl('img');
      img.src = emote.src;
      img.alt = emote.fileName;
      img.referrerPolicy = 'no-referrer';
      button.appendChild(img);
      emoteGrid.appendChild(button);
    });
    emotes.append(emoteHead, emoteGrid);

    var tools = createEl('div', 'spx-quick-reply-tools');
    tools.append(createEl('span', 'spx-quick-reply-note', '最近常用优先 · 支持楼层引用和选中文字引用'));
    var counter = createEl('span', 'spx-quick-reply-counter', '0 字');
    tools.appendChild(counter);

    var mirror = createEl('textarea', 'spx-quick-reply-editor');
    mirror.placeholder = '输入回复内容。点击楼层“回复”会自动带上下文。';
    mirror.value = String(editor.value || '');

    var attach = createEl('div', 'spx-quick-reply-attach');
    var desc = createEl('input', 'spx-quick-reply-desc');
    desc.type = 'text';
    desc.placeholder = '图片描述，可留空';
    desc.value = attachmentDesc ? String(attachmentDesc.value || '') : '';
    if (!attachmentDesc) desc.disabled = true;
    var picker = attachmentInput
      ? createEl('label', 'spx-quick-reply-picker', '选择图片')
      : createEl('span', 'spx-quick-reply-picker', '无附件入口');
    if (attachmentInput) picker.setAttribute('for', attachmentId);
    var help = createEl('div', 'spx-quick-reply-help', formatQuickReplyAttachmentSummary(getQuickReplyAttachmentFiles(attachmentInput)));
    var attachmentList = createEl('div', 'spx-quick-reply-attachments');
    attach.append(desc, picker, help, attachmentList);

    var footer = createEl('div', 'spx-quick-reply-footer');
    footer.appendChild(createEl('div', 'spx-quick-reply-hint', '失败时保留草稿，成功后局部刷新新楼层。'));
    var submitActions = createEl('div', 'spx-quick-reply-submit-actions');
    var saveDraft = createEl('button', 'spx-quick-reply-action', '保存草稿');
    saveDraft.type = 'button';
    var send = createEl('button', 'spx-quick-reply-action spx-primary', '发送回复');
    send.type = 'button';
    submitActions.append(saveDraft, send);
    footer.appendChild(submitActions);

    body.append(list, emotes, tools, mirror, attach, footer);
    panel.append(header, context, body);

    var draftTimer = null;
    var activeContext = '';
    var previewUrls = [];

    function syncEditor() {
      editor.value = mirror.value;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      editor.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function updateCounter() {
      counter.textContent = mirror.value.length + ' 字';
    }

    function markDraftSaved() {
      status.classList.remove('spx-error');
      status.textContent = '草稿已保存 · Ctrl+Enter 发送';
    }

    function scheduleDraftSave() {
      syncEditor();
      status.classList.remove('spx-error');
      status.textContent = '正在保存草稿...';
      window.clearTimeout(draftTimer);
      draftTimer = window.setTimeout(markDraftSaved, 420);
    }

    function openReply() {
      panel.classList.remove('spx-quick-reply-collapsed');
      launcher.classList.remove('spx-visible');
      if (typeof mirror.focus === 'function') mirror.focus();
    }

    function collapseReply() {
      panel.classList.add('spx-quick-reply-collapsed');
      launcher.classList.add('spx-visible');
    }

    function setContext(label) {
      activeContext = String(label || '').trim();
      contextText.textContent = activeContext;
      context.classList.toggle('spx-visible', !!activeContext);
    }

    function insertMirrorText(text) {
      var value = mirror.value;
      var start = typeof mirror.selectionStart === 'number' ? mirror.selectionStart : value.length;
      var end = typeof mirror.selectionEnd === 'number' ? mirror.selectionEnd : value.length;
      var prefix = value && !/\n$/.test(value.slice(0, start)) ? '\n' : '';
      mirror.value = value.slice(0, start) + prefix + text + value.slice(end);
      var cursor = start + prefix.length + String(text || '').length;
      if (typeof mirror.setSelectionRange === 'function') mirror.setSelectionRange(cursor, cursor);
      updateCounter();
      scheduleDraftSave();
      openReply();
    }

    function revokePreviewUrls() {
      previewUrls.forEach(function revoke(url) {
        try { URL.revokeObjectURL(url); } catch (error) {}
      });
      previewUrls = [];
    }

    function renderAttachments() {
      var files = getQuickReplyAttachmentFiles(attachmentInput);
      attachmentList.innerHTML = '';
      attachmentList.classList.toggle('spx-visible', !!files.length);
      help.textContent = formatQuickReplyAttachmentSummary(files);
      revokePreviewUrls();
      files.forEach(function appendAttachment(file, index) {
        var row = createEl('div', 'spx-quick-reply-attachment');
        var thumb = createEl('img', 'spx-quick-reply-thumb');
        try {
          thumb.src = URL.createObjectURL(file);
          previewUrls.push(thumb.src);
        } catch (error) {}
        thumb.alt = file.name || '图片附件';
        var meta = createEl('div');
        meta.append(
          createEl('div', 'spx-quick-reply-attachment-name', file.name || '图片附件'),
          createEl('div', 'spx-quick-reply-attachment-size', formatQuickReplyFileSize(file.size))
        );
        var remove = createEl('button', 'spx-quick-reply-remove', '×');
        remove.type = 'button';
        remove.title = '移除图片';
        remove.dataset.spxRemoveAttachment = String(index);
        row.append(thumb, meta, remove);
        attachmentList.appendChild(row);
      });
    }

    function removeAttachment(index) {
      if (!attachmentInput || !attachmentInput.files || typeof DataTransfer !== 'function') {
        status.textContent = '当前浏览器不支持单张移除，请重新选择图片';
        return;
      }
      var dt = new DataTransfer();
      getQuickReplyAttachmentFiles(attachmentInput).forEach(function keepFile(file, fileIndex) {
        if (fileIndex !== index) dt.items.add(file);
      });
      attachmentInput.files = dt.files;
      renderAttachments();
      scheduleDraftSave();
    }

    function selectedText() {
      return String(window.getSelection && window.getSelection().toString() || '').trim();
    }

    function sendReply() {
      syncEditor();
      if (attachmentDesc) {
        attachmentDesc.value = desc.value;
        attachmentDesc.dispatchEvent(new Event('input', { bubbles: true }));
        attachmentDesc.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (!mirror.value.trim() && !getQuickReplyAttachmentFiles(attachmentInput).length) {
        status.classList.add('spx-error');
        status.textContent = '请输入回复内容或选择图片';
        mirror.focus();
        return;
      }
      window.clearTimeout(draftTimer);
      var result = submitQuickReply(editor, settings, state);
      if (result && typeof result.then === 'function') {
        result.then(function markResult(ok) {
          if (ok) {
            status.classList.remove('spx-error');
            status.textContent = getQuickReplyAttachmentFiles(attachmentInput).length
              ? '提交成功 · 已带图片刷新帖子'
              : '提交成功 · 已刷新帖子';
          }
        });
        return;
      }
      if (result) status.textContent = '已交给原站提交';
    }

    panel.spxOpenWithContext = function spxOpenWithContext(label, text) {
      setContext(label);
      if (text) insertMirrorText(text);
      else openReply();
    };
    function showSelectionMenu() {
      var text = selectedText();
      selectionMenu.classList.toggle('spx-visible', text.length > 2 && !panel.contains(document.activeElement));
    }

    panel.spxCleanup = function spxCleanupQuickReply() {
      revokePreviewUrls();
      window.clearTimeout(draftTimer);
      document.removeEventListener('selectionchange', showSelectionMenu);
      if (launcher.parentNode) launcher.remove();
      if (selectionMenu.parentNode) selectionMenu.remove();
    };
    panel.spxLauncher = launcher;
    panel.spxSelectionMenu = selectionMenu;

    collapse.addEventListener('click', collapseReply);
    launcher.addEventListener('click', openReply);
    clearContext.addEventListener('click', function clearQuickReplyContext() {
      activeContext = '';
      context.classList.remove('spx-visible');
    });
    mirror.addEventListener('input', function handleMirrorInput() {
      updateCounter();
      scheduleDraftSave();
    });
    mirror.addEventListener('keydown', function handleMirrorShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        sendReply();
      }
    });
    desc.addEventListener('input', function handleDescInput() {
      if (attachmentDesc) attachmentDesc.value = desc.value;
      scheduleDraftSave();
    });
    if (attachmentInput) {
      attachmentInput.addEventListener('change', function handleAttachmentInputChange() {
        renderAttachments();
        scheduleDraftSave();
        openReply();
      });
    }
    saveDraft.addEventListener('click', function saveQuickReplyDraft() {
      scheduleDraftSave();
      markDraftSaved();
    });
    send.addEventListener('click', sendReply);
    panel.addEventListener('click', function handleQuickReplyPanelClick(event) {
      var target = event.target;
      if (target.closest('[data-spx-emote]')) {
        insertMirrorText(target.closest('[data-spx-emote]').dataset.spxEmote || '');
        return;
      }
      if (target.closest('[data-spx-remove-attachment]')) {
        removeAttachment(Number(target.closest('[data-spx-remove-attachment]').dataset.spxRemoveAttachment));
      }
    });
    selectionQuote.addEventListener('click', function quoteSelectedText() {
      var text = selectedText();
      if (!text) return;
      setContext('引用所选文字');
      insertMirrorText('[quote]' + text.slice(0, 160) + '[/quote]\n');
      selectionMenu.classList.remove('spx-visible');
    });
    selectionCancel.addEventListener('click', function cancelSelectedQuote() {
      selectionMenu.classList.remove('spx-visible');
    });
    document.addEventListener('selectionchange', showSelectionMenu);

    updateCounter();
    renderAttachments();
    return panel;
  }

  function enhanceQuickReply(settings, state) {
    if (detectPageType(location.href) !== 'read' && detectPageType(location.href) !== 'post') return;
    var oldPanel = qs('#spx-quick-reply');
    if (oldPanel && typeof oldPanel.spxCleanup === 'function') oldPanel.spxCleanup();
    if (oldPanel) oldPanel.remove();
    var oldLauncher = qs('#spx-quick-reply-launcher');
    if (oldLauncher) oldLauncher.remove();
    var oldSelection = qs('#spx-quick-reply-selection');
    if (oldSelection) oldSelection.remove();

    var editor = getQuickReplyEditor(document);
    var panel = createQuickReplyPanel(settings, editor, state);
    bindQuickReplyFormSubmit(editor, settings, state, panel);
    if (!panel || !document.body) return;
    document.body.appendChild(panel);
    if (panel.spxLauncher) document.body.appendChild(panel.spxLauncher);
    if (panel.spxSelectionMenu) document.body.appendChild(panel.spxSelectionMenu);
  }

  function createSettingsPanel(settings, state) {
    var panel = qs('#spx-settings');
    if (panel) return panel;

    var settingLabels = {
      cleanMode: '清爽模式',
      readerMode: '阅读排版优化',
      immersiveRead: '帖子页沉浸全屏',
      nightMode: '夜间模式',
      unifiedPreviewGallery: '预览图集中显示',
      forumDashboard: '论坛仪表盘',
      compactRead: '阅读页紧凑',
      foldQuotes: '折叠长引用',
      hideUserProfile: '隐藏头像资料',
      networkFriendly: '网络友好模式',
      autoTaskClaim: '自动领取任务',
      autoBuyPost: '自动购买低价帖子',
      smartModuleNavSort: '导航智能排序',
      unreadOnly: '列表只看未读',
      onlyOriginalAuthor: '阅读页只看楼主',
    };
    var settingKeys = getSettingsPanelKeys(location.href, document);
    function renderSettingControl(key) {
      return '<label><input type="checkbox" data-key="' + key + '"> ' + settingLabels[key] + '</label>';
    }
    function renderSettingsSection(title, keys, helpText) {
      var controls = (keys || []).filter(function keepSettingKey(key) {
        return settingKeys.indexOf(key) !== -1;
      }).map(renderSettingControl);
      if (!controls.length) return [];
      return [
        '<section class="spx-settings-section">',
        '<h4>' + title + '</h4>',
        helpText ? '<div class="spx-help">' + helpText + '</div>' : '',
        '<div class="spx-settings-grid">',
      ].concat(controls, [
        '</div>',
        '</section>',
      ]);
    }
    var readingControls = renderSettingsSection(
      '阅读体验',
      ['readerMode', 'immersiveRead', 'nightMode', 'compactRead', 'foldQuotes', 'hideUserProfile', 'onlyOriginalAuthor', 'unifiedPreviewGallery'],
      '控制正文排版、沉浸阅读、夜间模式、头像资料和图集显示。'
    );
    var listControls = renderSettingsSection(
      '列表增强',
      ['cleanMode', 'unreadOnly', 'forumDashboard'],
      '控制列表页、首页仪表盘和通用页面的低频内容、未读筛选。'
    );
    var networkControls = renderSettingsSection(
      '网络请求',
      ['networkFriendly'],
      '限制脚本后台请求频率，缓存悬停预览和导航刷新，遇到 504 或操作频繁提示时自动冷却。'
    );
    var taskControls = renderSettingsSection(
      '社区任务',
      ['autoTaskClaim'],
      '保守模式：任意页面都会检查日常是否今日已完成；未完成会自动申请并领取奖励，周常仍按 7 天冷却。'
    );
    var autoBuyControls = settingKeys.indexOf('autoBuyPost') !== -1 ? [
      '<section class="spx-settings-section">',
      '<h4>自动购买</h4>',
      renderSettingControl('autoBuyPost'),
      '<label class="spx-number-setting"><span>价格上限</span><span><input type="number" min="0" step="1" data-number="autoBuyMaxSp"> SP</span></label>',
      '<div class="spx-help">仅当帖子价格严格小于该值、账户 SP 足够且页面存在购买按钮时自动购买；默认关闭。</div>',
      '</section>',
    ] : [];
    var navigationControls = [
      '<section class="spx-settings-section">',
      '<h4>导航中心</h4>',
      '<div class="spx-help">控制左侧导航中心的块区域密度和排序；智能排序会结合当前页、置顶、最近使用和入口数量前置常用入口。</div>',
      renderSettingControl('smartModuleNavSort'),
      '<label class="spx-choice-setting"><span>导航密度</span><select data-choice="moduleNavDensity">',
      '<option value="compact">紧凑</option>',
      '<option value="standard">标准</option>',
      '<option value="comfortable">舒适</option>',
      '</select></label>',
      '</section>',
    ];
    var presetDefinitions = getSettingsPresetDefinitions();
    var presetControls = [
      '<section class="spx-settings-section spx-settings-presets">',
      '<h4>配置预设</h4>',
      '<div class="spx-help">按使用场景批量切换本地设置，不覆盖收藏、稍后看、资源和阅读进度。</div>',
      '<div class="spx-preset-tabs">',
    ].concat(Object.keys(presetDefinitions).map(function renderPresetButton(key) {
      var preset = presetDefinitions[key];
      return '<button type="button" data-action="apply-settings-preset" data-preset="' + key + '" title="' + preset.description + '">' + preset.label + '</button>';
    }), [
      '</div>',
      '</section>',
    ]);

    panel = createEl('div', 'spx-settings');
    panel.id = 'spx-settings';
    panel.hidden = true;
    panel.innerHTML = [
      '<div class="spx-settings-header">',
      '<h3>South Plus 增强设置</h3>',
      '<p class="spx-settings-subtitle">按场景分组管理阅读、列表、购买和本地数据。</p>',
      '</div>',
      '<div class="spx-settings-body">',
    ].concat(presetControls, readingControls, listControls, networkControls, taskControls, navigationControls, autoBuyControls, [
      '<section class="spx-settings-section">',
      '<h4>本地屏蔽</h4>',
      '<div class="spx-help">标题和作者关键词每行一个，保存后立即应用到当前页面。</div>',
      '<div>标题屏蔽关键词</div>',
      '<textarea data-list="titleKeywords"></textarea>',
      '<div>作者屏蔽关键词</div>',
      '<textarea data-list="authorKeywords"></textarea>',
      '</section>',
      '<section class="spx-settings-section">',
      '<h4>快捷回复</h4>',
      '<div class="spx-help">帖子详情页或回复页会显示为快捷按钮；快捷语句和帖子页原生提交按钮都会无刷新展示新回复。</div>',
      '<textarea data-list="quickReplies"></textarea>',
      '</section>',
      '<section class="spx-settings-section">',
      '<h4>备份恢复</h4>',
      '<div class="spx-row">',
      '<button data-action="export-backup">导出备份</button>',
      '<button data-action="import-backup">导入备份</button>',
      '</div>',
      '</section>',
      '<section class="spx-settings-section">',
      '<h4>数据管理</h4>',
      '<div class="spx-help">数据健康和体积只读取本地 localStorage；清空类操作不可自动恢复，请先导出备份。</div>',
      '<div class="spx-row">',
      '<button data-action="show-data-health">数据健康</button>',
      '<button data-action="show-storage-usage">本地体积</button>',
      '<button class="spx-danger" data-action="clear-read">清空已读</button>',
      '<button class="spx-danger" data-action="clear-progress">清空进度</button>',
      settingKeys.indexOf('autoBuyPost') !== -1 ? '<button class="spx-danger" data-action="clear-auto-buy">清空自动购买记录</button>' : '',
      '</div>',
      '<div class="spx-data-health" data-role="data-health" hidden></div>',
      '</section>',
      '</div>',
      '<div class="spx-settings-footer">',
      '<button data-action="close">关闭</button>',
      '<button class="spx-primary" data-action="save">保存</button>',
      '</div>',
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
      qsa('select[data-choice]', panel).forEach(function syncChoice(select) {
        select.value = settings[select.dataset.choice] || '';
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
      qsa('select[data-choice]', panel).forEach(function readChoice(select) {
        if (select.dataset.choice === 'moduleNavDensity') {
          settings.moduleNavDensity = normalizeModuleNavDensity(select.value);
        }
      });
      delete document.documentElement.dataset.spxAutoBuyStatus;
      var autoBuyStatus = qs('#spx-auto-buy-status');
      if (autoBuyStatus) autoBuyStatus.remove();
      Object.assign(settings, normalizeSettings(settings));
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
        taskClaims: loadTaskClaimRecords(),
        resources: state && state.resources,
        navigation: loadNavigationPool(),
        navigationPins: loadNavigationPins(),
        navigationUsage: loadNavigationUsage(),
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
      confirmBatchAction({
        title: '清理本地数据',
        message: '将清理重复稍后看、重复 / 过期阅读进度和异常记录。',
        confirmText: '清理数据',
        impacts: [{ label: '待清理项目', value: cleanup.before.cleanupCount, note: '按健康检查结果处理' }],
      }, '将清理重复稍后看、重复/过期阅读进度和异常记录，确认继续？').then(function cleanupAfterConfirm(ok) {
        if (!ok) return;
        var done = applyBackupPayload(cleanup.payload, settings, state);
        renderDataHealthPanel(done ? '已清理 ' + cleanup.before.cleanupCount + ' 项数据。' : '清理失败。');
        setTemporaryButtonText(button, done ? '已清理' : '清理失败');
      });
    }

    panel.addEventListener('click', function handleSettingsClick(event) {
      var action = event.target && event.target.dataset && event.target.dataset.action;
      if (!action) return;
      if (action === 'save') {
        saveForm();
        setSettingsPanelHidden(panel, true, SETTINGS_BUTTON_SELECTOR);
      }
      if (action === 'close') setSettingsPanelHidden(panel, true, SETTINGS_BUTTON_SELECTOR);
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
      if (action === 'apply-settings-preset') {
        var presetKey = event.target.dataset.preset;
        Object.assign(settings, applySettingsPreset(settings, presetKey));
        saveSettings(settings);
        syncForm();
        enhanceAll(settings, state);
        setTemporaryButtonText(event.target, '已应用');
      }
      if (action === 'clear-read') {
        var readCount = Object.keys((state && state.read) || {}).length;
        confirmBatchAction({
          title: '清空已读记录',
          message: '将清空本地已读主题标记。',
          confirmText: '清空已读',
          impacts: [{ label: '已读主题', value: readCount, note: '影响列表未读筛选' }],
        }, '清空全部已读记录？').then(function clearReadAfterConfirm(ok) {
          if (!ok) return;
          state.read = {};
          saveMap(READ_KEY, state.read);
          enhanceAll(settings, state);
          setTemporaryButtonText(event.target, '已清空已读');
        });
      }
      if (action === 'clear-progress') {
        var progressEntries = getHistoryCenterEntries(state.progress);
        confirmBatchAction({
          title: '清空阅读进度',
          message: '将清空全部阅读进度、楼层位置和最近浏览。',
          confirmText: '清空进度',
          impacts: [{ label: '阅读记录', value: progressEntries.length, note: '影响继续阅读' }],
          items: progressEntries.map(function mapProgressConfirmItem(entry) {
            return { title: entry.title, meta: entry.progressText || entry.url };
          }),
        }, '清空全部阅读进度？').then(function clearProgressAfterConfirm(ok) {
          if (!ok) return;
          state.progress = {};
          saveReadProgress(state.progress);
          clearReadProgressRestoreRequest(parseThreadId(location.href));
          refreshWatchCenter();
          refreshHistoryCenter();
          refreshReadThreadSummaryCard();
          setTemporaryButtonText(event.target, '已清空阅读进度');
        });
      }
      if (action === 'clear-auto-buy') {
        var autoBuyEntries = getAutoBuyCenterEntries(loadAutoBuyAttempts());
        confirmBatchAction({
          title: '清空自动购买记录',
          message: '将清空全部自动购买执行记录。',
          confirmText: '清空购买记录',
          impacts: [{ label: '购买记录', value: autoBuyEntries.length, note: '可能影响重复购买拦截' }],
          items: autoBuyEntries.map(function mapSettingsAutoBuyConfirmItem(entry) {
            return { title: entry.key, meta: entry.statusLabel };
          }),
        }, '清空全部自动购买记录？').then(function clearAutoBuySettingsAfterConfirm(ok) {
          if (!ok) return;
          saveAutoBuyAttempts({});
          delete document.documentElement.dataset.spxAutoBuyStatus;
          var autoBuyStatus = qs('#spx-auto-buy-status');
          if (autoBuyStatus) autoBuyStatus.remove();
          refreshAutoBuyCenter();
          refreshReadThreadSummaryCard();
          setTemporaryButtonText(event.target, '已清空购买记录');
        });
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
      { show: true, group: '阅读模式', key: 'nightMode', text: '夜', label: '夜间模式', title: '切换夜间模式', description: '切换深色影院式阅读和图集界面' },
      { show: shouldShowToolbarAction('adBlock', url, root), group: '阅读模式', key: 'adBlock', text: '广', label: '隐藏广告', title: '切换隐藏广告', description: '隐藏广告链接、图片和容器' },
      { show: shouldShowToolbarAction('homeDashboard', url, root), group: '阅读模式', key: 'homeDashboard', text: '模', label: '首页模块', title: '切换首页模块全屏', description: '以网格方式整理首页板块' },
      { show: shouldShowToolbarAction('homeDashboard', url, root), group: '阅读模式', key: 'forumDashboard', text: '盘', label: '论坛仪表盘', title: '切换首页论坛仪表盘', description: '展示浏览、收藏、资源和本地积压摘要' },
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
        text: '合',
        label: '我的内容',
        title: '打开我的内容中心',
        description: '汇总收藏、稍后看、阅读进度、资源、购买和任务概览',
        panelId: 'spx-content-center',
        createPanel: createMyContentCenterPanel,
      },
      {
        show: true,
        group: '我的中心',
        text: '存',
        label: '稍后看',
        title: '打开稍后看中心',
        description: '管理保存的主题和续读入口',
        panelId: 'spx-watch-center',
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
        createPanel: createResourceCenterPanel,
      },
    ];
  }

  function getWorkbenchNavigationCount(panelId, state) {
    var workbenchState = getWorkbenchState(state);
    if (panelId === 'spx-content-center') return '总览';
    if (panelId === 'spx-watch-center') return Object.keys(workbenchState.watch || {}).length;
    if (panelId === 'spx-history-center') return Object.keys(workbenchState.progress || {}).length;
    if (panelId === 'spx-auto-buy-center') return getAutoBuyCenterEntries(loadAutoBuyAttempts()).length;
    if (panelId === 'spx-resource-center') return Object.keys(workbenchState.resources || {}).length;
    return '';
  }

  function getWorkbenchNavigationConfigs(settings, state) {
    return getToolbarCenterConfigs().map(function mapWorkbenchNavigation(config) {
      return {
        section: '我的工作台',
        label: config.label,
        title: config.title || config.label,
        className: 'spx-module-nav-workbench',
        alwaysShow: true,
        navigationOnly: false,
        panelId: config.panelId,
        countText: getWorkbenchNavigationCount(config.panelId, state),
        onClick: function openWorkbenchNavigationItem() {
          openWorkbenchPanel(config.panelId, settings || loadSettings(), state);
        },
      };
    });
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
      .filter(function keepVisibleToolboxAction(config) {
        return config && config.show !== false;
      });
  }

  function getToolboxPriority(config, url) {
    var type = detectPageType(url);
    var key = config.key || config.panelId || config.kind || config.label || '';
    var readPriority = {
      readerMode: 0,
      nightMode: 1,
      immersiveRead: 2,
      onlyOriginalAuthor: 3,
      unifiedPreviewGallery: 4,
      'spx-resource-center': 4,
      'spx-history-center': 5,
    };
    var forumPriority = {
      unreadOnly: 0,
      'spx-watch-center': 1,
      nightMode: 2,
      cleanMode: 3,
      readerMode: 4,
      latest: 5,
    };
    var map = type === 'read' ? readPriority : (type === 'forum' ? forumPriority : null);
    return map && map[key] !== undefined ? map[key] : 50;
  }

  function getToolboxGroups(url, root) {
    var order = ['页面导航', '阅读模式'];
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
      return {
        title: group,
        items: groups[group].slice().sort(function sortToolboxItems(a, b) {
          return getToolboxPriority(a, url) - getToolboxPriority(b, url);
        }),
      };
    });
  }

  function setPopupPanelHidden(panel, hidden, buttonSelector) {
    if (!panel) return;
    panel.hidden = !!hidden;
    if (buttonSelector) {
      qsa(buttonSelector).forEach(function togglePopupButton(button) {
        button.classList.toggle('spx-active', !panel.hidden);
        button.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
      });
    }
  }

  function setToolboxHidden(panel, hidden, buttonSelector) {
    setPopupPanelHidden(panel, hidden, buttonSelector);
  }

  function setSettingsPanelHidden(panel, hidden, buttonSelector) {
    setPopupPanelHidden(panel, hidden, buttonSelector);
  }

  function isToolboxActionActive(config, settings) {
    if (!config) return false;
    if (config.key) return !!(settings && settings[config.key]);
    if (config.panelId) {
      var panel = qs('#' + config.panelId);
      return !!(panel && !panel.hidden);
    }
    if (config.kind === 'settings') {
      var settingsPanel = qs('#spx-settings');
      return !!(settingsPanel && !settingsPanel.hidden);
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
    node.classList.toggle('spx-active', isToolboxActionActive(config, settings));
    appendToolboxActionContent(node, config);

    if (config.href) return node;

    node.addEventListener('click', function handleToolboxAction() {
      if (config.kind === 'settings') {
        var settingsPanel = createSettingsPanel(settings, state);
        if (settingsPanel.spxSync) settingsPanel.spxSync();
        setSettingsPanelHidden(settingsPanel, !settingsPanel.hidden, SETTINGS_BUTTON_SELECTOR);
        setToolboxHidden(toolbox, true, TOOLBOX_BUTTON_SELECTOR);
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
        if (config.panelId && openWorkbenchPanel(config.panelId, settings, state)) {
          setToolboxHidden(toolbox, true, TOOLBOX_BUTTON_SELECTOR);
          return;
        }
        var centerPanel = config.createPanel(settings, state);
        if (centerPanel.spxRender) centerPanel.spxRender();
        setCenterPanelHidden(centerPanel, !centerPanel.hidden);
        setToolboxHidden(toolbox, true, TOOLBOX_BUTTON_SELECTOR);
        return;
      }
      if (typeof config.onClick === 'function') {
        config.onClick();
        setToolboxHidden(toolbox, true, TOOLBOX_BUTTON_SELECTOR);
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
      var closeButton = createEl('button', 'spx-toolbox-close', '×');
      closeButton.type = 'button';
      closeButton.title = '关闭工具箱';
      closeButton.addEventListener('click', function closeToolbox() {
        setToolboxHidden(panel, true, TOOLBOX_BUTTON_SELECTOR);
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
    document.body.appendChild(panel);
    return panel;
  }

  function collectCurrentPageCommandItems(root) {
    var doc = root || document;
    var seen = {};
    var items = [];
    qsa('a[href]', doc).forEach(function collectPageCommandLink(link) {
      var href = link.href || link.getAttribute('href') || '';
      var text = compactText(link.textContent || link.title || '');
      if (!href || !text || /^javascript:/i.test(href)) return;
      var isThread = /read\.php\?tid[=-]?\d+|read\.php\?tid-\d+/i.test(href);
      var isForum = /thread\.php\?fid[=-]?\d+|thread\.php\?fid-\d+/i.test(href);
      if (!isThread && !isForum) return;
      if (/^(上一页|下一页|首页|尾页|收藏|回复|引用|编辑|删除)$/.test(text)) return;
      var key = href.replace(/#.*$/, '') + '|' + text;
      if (seen[key]) return;
      seen[key] = true;
      items.push({
        title: text.slice(0, 80),
        href: href,
        category: 'navigate',
        icon: isThread ? '帖' : '版',
        source: isThread ? '当前页面主题' : '当前页面版块',
        description: isThread ? '跳转到当前页面中的主题' : '跳转到当前页面中的版块入口',
        keywords: compactText((link.closest && link.closest('tr') && link.closest('tr').textContent) || ''),
      });
    });
    return items.slice(0, 40);
  }

  function getCommandPaletteData(settings, state) {
    return {
      toolboxConfigs: getToolboxActionConfigs(location.href, document),
      centerConfigs: getToolbarCenterConfigs(),
      settingsConfigs: [getToolbarSettingsConfig()],
      navigationConfigs: getAllModuleNavigationConfigs(settings, state),
      pageItems: collectCurrentPageCommandItems(document),
      watch: state && state.watch,
      progress: state && state.progress,
      resources: state && state.resources,
      settings: settings,
    };
  }

  function getStateMapSize(map) {
    return Object.keys(map || {}).length;
  }

  function getCommandPaletteCacheKey(settings, state) {
    var optionKeys = [
      'cleanMode',
      'readerMode',
      'immersiveRead',
      'nightMode',
      'unifiedPreviewGallery',
      'forumDashboard',
      'networkFriendly',
      'unreadOnly',
      'onlyOriginalAuthor',
      'moduleNavDensity',
    ];
    var optionText = optionKeys.map(function mapCommandOption(key) {
      return key + ':' + String(settings && settings[key]);
    }).join('|');
    return [
      location.href,
      enhanceCycle,
      getStateMapSize(state && state.watch),
      getStateMapSize(state && state.progress),
      getStateMapSize(state && state.resources),
      optionText,
    ].join('||');
  }

  function getCommandPaletteEntries(panel, settings, state) {
    var cacheKey = getCommandPaletteCacheKey(settings, state);
    if (!panel.spxAllEntries || panel.spxEntriesCacheKey !== cacheKey) {
      panel.spxAllEntries = collectCommandPaletteEntries(getCommandPaletteData(settings, state));
      panel.spxEntriesCacheKey = cacheKey;
    }
    return panel.spxAllEntries || [];
  }

  function invalidateCommandPaletteCache() {
    var panel = qs('#spx-command-palette-overlay');
    if (!panel) return;
    panel.spxAllEntries = null;
    panel.spxEntriesCacheKey = '';
  }

  function setCommandPaletteHidden(panel, hidden) {
    if (!panel) return;
    panel.hidden = !!hidden;
    if (panel.hidden && panel.spxSearchTimer) {
      window.clearTimeout(panel.spxSearchTimer);
      panel.spxSearchTimer = null;
    }
    qsa(COMMAND_PALETTE_BUTTON_SELECTOR).forEach(function toggleCommandButton(button) {
      button.classList.toggle('spx-active', !panel.hidden);
      button.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
    });
    if (!panel.hidden) {
      panel.spxRender();
      window.setTimeout(function focusCommandSearch() {
        var input = qs('.spx-command-search', panel);
        if (input && typeof input.focus === 'function') input.focus();
      }, 0);
    }
  }

  function getCommandCenterPanelConfig(panelId) {
    return getToolbarCenterConfigs().filter(function matchCenterConfig(config) {
      return config.panelId === panelId;
    })[0] || null;
  }

  function openCommandCenterPanel(panelId, settings, state) {
    var config = getCommandCenterPanelConfig(panelId);
    if (!config || !config.createPanel) return false;
    if (openWorkbenchPanel(panelId, settings, state)) return true;
    var centerPanel = config.createPanel(settings, state);
    if (centerPanel.spxRender) centerPanel.spxRender();
    setCenterPanelHidden(centerPanel, false);
    return true;
  }

  function openCommandUrl(href) {
    var value = String(href || '');
    if (!value) return false;
    if (/^(?:magnet|ed2k):/i.test(value)) {
      location.href = value;
      return true;
    }
    try {
      var url = new URL(value, location.href);
      if (url.origin === location.origin) {
        location.href = url.href;
      } else if (typeof window.open === 'function') {
        window.open(url.href, '_blank', 'noopener');
      } else {
        location.href = url.href;
      }
      return true;
    } catch (error) {
      location.href = value;
      return true;
    }
  }

  function closeCommandRelatedPanels() {
    var toolbox = qs('#spx-toolbox');
    if (toolbox) setToolboxHidden(toolbox, true, TOOLBOX_BUTTON_SELECTOR);
    var settingsPanel = qs('#spx-settings');
    if (settingsPanel) setSettingsPanelHidden(settingsPanel, true, SETTINGS_BUTTON_SELECTOR);
  }

  function executeCommandPaletteEntry(entry, settings, state, panel) {
    if (!entry) return false;
    var config = entry.payload || null;
    setCommandPaletteHidden(panel, true);
    if (config && config.href) return openCommandUrl(config.href);
    if (config && config.kind === 'settings') {
      closeCommandRelatedPanels();
      var settingsPanel = createSettingsPanel(settings, state);
      if (settingsPanel.spxSync) settingsPanel.spxSync();
      setSettingsPanelHidden(settingsPanel, false, SETTINGS_BUTTON_SELECTOR);
      return true;
    }
    if (config && config.key) {
      settings[config.key] = !settings[config.key];
      saveSettings(settings);
      enhanceAll(settings, state);
      return true;
    }
    if (config && config.createPanel && config.panelId) {
      closeCommandRelatedPanels();
      return openCommandCenterPanel(config.panelId, settings, state);
    }
    if (config && typeof config.onClick === 'function') {
      config.onClick();
      return true;
    }
    if (entry.action === 'open-settings') {
      var panelNode = createSettingsPanel(settings, state);
      if (panelNode.spxSync) panelNode.spxSync();
      setSettingsPanelHidden(panelNode, false, SETTINGS_BUTTON_SELECTOR);
      return true;
    }
    if (entry.action === 'open-panel' && entry.panelId) {
      return openCommandCenterPanel(entry.panelId, settings, state);
    }
    if (entry.action === 'open-watch-entry') {
      var watchEntry = getWatchCenterEntries(state.watch, state.progress).filter(function matchWatchEntry(item) {
        return item.id === entry.recordId;
      })[0];
      if (watchEntry) {
        openProgressEntry(state, watchEntry.id, watchEntry.progressUrl || watchEntry.url, 'next');
        return true;
      }
    }
    if (entry.action === 'open-history-entry') {
      var historyEntry = getHistoryCenterEntries(state.progress).filter(function matchHistoryEntry(item) {
        return item.id === entry.recordId;
      })[0];
      if (historyEntry) {
        openProgressEntry(state, historyEntry.id, historyEntry.url, 'next');
        return true;
      }
    }
    if (entry.href) return openCommandUrl(entry.href);
    return false;
  }

  function isCommandPaletteSearchInput(target) {
    return !!(target && target.classList && target.classList.contains('spx-command-search'));
  }

  function rerenderCommandPaletteAfterSearch(panel, target) {
    if (!panel) return;
    panel.spxState.query = target ? target.value : panel.spxState.query;
    panel.spxState.activeIndex = 0;
    panel.spxRender();
    var nextInput = qs('.spx-command-search', panel);
    if (nextInput) {
      nextInput.focus();
      if (typeof nextInput.setSelectionRange === 'function') {
        nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
      }
    }
  }

  function renderCommandPaletteDetail(panel, entry) {
    var detail = qs('.spx-command-detail', panel);
    if (!detail) return;
    detail.textContent = '';
    detail.appendChild(createEl('h3', '', entry ? entry.title : '没有匹配命令'));
    detail.appendChild(createEl('p', '', entry ? entry.description : '换一个关键词或分类继续搜索。'));
    var card = createEl('div', 'spx-command-detail-card');
    [
      ['来源', entry ? getCommandPaletteSourceLabel(entry) : '-'],
      ['目标', entry ? (entry.target || entry.href || entry.panelId || entry.key || '-') : '-'],
      ['风险', entry ? (entry.risk || '低') : '-'],
    ].forEach(function appendDetailRow(item) {
      var isTarget = item[0] === '目标';
      var row = createEl('div', 'spx-command-detail-row' + (isTarget ? ' spx-command-detail-target' : ''));
      row.appendChild(createEl('span', '', item[0]));
      if (isTarget && entry && entry.href && /^https?:/i.test(entry.href)) {
        var link = createEl('a', '', item[1]);
        link.href = entry.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = entry.href;
        row.appendChild(link);
      } else {
        row.appendChild(createEl('strong', '', item[1]));
      }
      card.appendChild(row);
    });
    detail.appendChild(card);
  }

  function renderCommandPalettePanel(panel, settings, state) {
    var panelState = panel.spxState || { query: '', filter: 'all', activeIndex: 0 };
    panel.spxState = panelState;
    var allEntries = getCommandPaletteEntries(panel, settings, state);
    var visibleEntries = filterCommandPaletteEntries(allEntries, panelState);
    panelState.activeIndex = Math.min(Math.max(0, Number(panelState.activeIndex) || 0), Math.max(0, visibleEntries.length - 1));
    panel.spxEntries = visibleEntries;
    panel.textContent = '';

    var wrap = createEl('div', 'spx-command-wrap');
    var palette = createEl('section', 'spx-command-palette');
    palette.setAttribute('aria-label', '全局命令面板');
    var head = createEl('div', 'spx-command-head');
    var title = createEl('div', 'spx-command-title');
    var titleCopy = createEl('div');
    titleCopy.appendChild(createEl('strong', '', '全局命令'));
    titleCopy.appendChild(createEl('span', '', '本地数据优先 · Ctrl+K'));
    var closeButton = createEl('button', 'spx-command-close', '×');
    closeButton.type = 'button';
    closeButton.title = '关闭命令面板';
    closeButton.dataset.action = 'close-command-palette';
    title.append(titleCopy, closeButton);
    head.appendChild(title);

    var searchWrap = createEl('div', 'spx-command-search-wrap');
    var search = createEl('input', 'spx-command-search');
    search.type = 'search';
    search.placeholder = '搜索导航、收藏、资源、设置或页面动作';
    search.value = panelState.query || '';
    search.setAttribute('aria-label', '搜索命令');
    searchWrap.appendChild(search);
    searchWrap.appendChild(createEl('span', 'spx-command-search-mark', '/'));
    head.appendChild(searchWrap);

    var tabs = createEl('div', 'spx-command-tabs');
    [
      ['all', '全部'],
      ['navigate', '导航'],
      ['center', '我的中心'],
      ['resource', '资源'],
      ['setting', '设置'],
      ['action', '页面动作'],
    ].forEach(function appendCommandTab(item) {
      var tab = createEl('button', 'spx-command-tab' + (normalizeCommandPaletteFilter(panelState.filter) === item[0] ? ' spx-active' : ''), item[1]);
      tab.type = 'button';
      tab.dataset.filter = item[0];
      tabs.appendChild(tab);
    });
    head.appendChild(tabs);
    palette.appendChild(head);

    var list = createEl('div', 'spx-command-list');
    if (!visibleEntries.length) {
      list.appendChild(createEl('div', 'spx-command-empty', '没有匹配的命令'));
    } else {
      visibleEntries.slice(0, 80).forEach(function appendCommandEntry(entry, index) {
        var item = createEl('button', 'spx-command-item' + (index === panelState.activeIndex ? ' spx-active' : ''));
        item.type = 'button';
        item.dataset.commandId = entry.id;
        item.appendChild(createEl('span', 'spx-command-icon', entry.icon || '令'));
        var main = createEl('span', 'spx-command-main');
        main.appendChild(createEl('strong', '', entry.title));
        main.appendChild(createEl('span', '', entry.description || getCommandPaletteSourceLabel(entry)));
        item.appendChild(main);
        var tail = createEl('span', 'spx-command-tail');
        tail.appendChild(createEl('span', 'spx-command-pill' + (entry.category === 'resource' ? ' spx-ok' : entry.category === 'center' ? ' spx-warn' : ''), getCommandPaletteCategoryLabel(entry.category)));
        if (index === panelState.activeIndex) tail.appendChild(createEl('span', 'spx-command-kbd', 'Enter'));
        item.appendChild(tail);
        list.appendChild(item);
      });
    }
    palette.appendChild(list);
    var foot = createEl('div', 'spx-command-foot');
    foot.appendChild(createEl('span', '', formatCommandPaletteResultSummary(visibleEntries, allEntries, panelState)));
    var keys = createEl('span', 'spx-command-keys');
    ['↑ ↓', 'Enter', 'Esc'].forEach(function appendKeyLabel(label) {
      keys.appendChild(createEl('span', 'spx-command-kbd', label));
    });
    foot.appendChild(keys);
    palette.appendChild(foot);
    wrap.appendChild(palette);

    var detail = createEl('aside', 'spx-command-detail');
    wrap.appendChild(detail);
    panel.appendChild(wrap);
    renderCommandPaletteDetail(panel, visibleEntries[panelState.activeIndex] || null);
  }

  function createCommandPalettePanel(settings, state) {
    var panel = qs('#spx-command-palette-overlay');
    if (panel) return panel;
    panel = createEl('div', 'spx-command-overlay');
    panel.id = 'spx-command-palette-overlay';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '全局命令面板');
    panel.spxState = { query: '', filter: 'all', activeIndex: 0 };
    panel.spxComposing = false;
    panel.spxAllEntries = null;
    panel.spxEntriesCacheKey = '';
    panel.spxSearchTimer = null;
    panel.spxRender = function renderCommandPanel() {
      renderCommandPalettePanel(panel, settings, state);
    };
    panel.addEventListener('compositionstart', function handleCommandCompositionStart(event) {
      if (!isCommandPaletteSearchInput(event.target)) return;
      panel.spxComposing = true;
    });
    panel.addEventListener('compositionend', function handleCommandCompositionEnd(event) {
      if (!isCommandPaletteSearchInput(event.target)) return;
      panel.spxComposing = false;
      rerenderCommandPaletteAfterSearch(panel, event.target);
    });
    panel.addEventListener('input', function handleCommandInput(event) {
      var target = event.target;
      if (!isCommandPaletteSearchInput(target)) return;
      panel.spxState.query = target.value;
      if (panel.spxComposing || event.isComposing) return;
      if (panel.spxSearchTimer) window.clearTimeout(panel.spxSearchTimer);
      panel.spxSearchTimer = window.setTimeout(function renderDebouncedCommandSearch() {
        panel.spxSearchTimer = null;
        rerenderCommandPaletteAfterSearch(panel, target);
      }, 80);
    });
    panel.addEventListener('click', function handleCommandClick(event) {
      if (event.target === panel) {
        setCommandPaletteHidden(panel, true);
        return;
      }
      var close = event.target && event.target.closest && event.target.closest('[data-action="close-command-palette"]');
      if (close) {
        setCommandPaletteHidden(panel, true);
        return;
      }
      var tab = event.target && event.target.closest && event.target.closest('.spx-command-tab');
      if (tab) {
        panel.spxState.filter = normalizeCommandPaletteFilter(tab.dataset.filter);
        panel.spxState.activeIndex = 0;
        panel.spxRender();
        var input = qs('.spx-command-search', panel);
        if (input) input.focus();
        return;
      }
      var item = event.target && event.target.closest && event.target.closest('.spx-command-item');
      if (item) {
        var entries = panel.spxEntries || [];
        var entry = entries.filter(function matchCommand(itemEntry) { return itemEntry.id === item.dataset.commandId; })[0];
        executeCommandPaletteEntry(entry, settings, state, panel);
      }
    });
    panel.addEventListener('keydown', function handleCommandKeys(event) {
      if (panel.spxComposing || event.isComposing || event.keyCode === 229) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setCommandPaletteHidden(panel, true);
        return;
      }
      var entries = panel.spxEntries || [];
      if (!entries.length) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        panel.spxState.activeIndex = Math.min(entries.length - 1, (panel.spxState.activeIndex || 0) + 1);
        panel.spxRender();
        var downInput = qs('.spx-command-search', panel);
        if (downInput) downInput.focus();
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        panel.spxState.activeIndex = Math.max(0, (panel.spxState.activeIndex || 0) - 1);
        panel.spxRender();
        var upInput = qs('.spx-command-search', panel);
        if (upInput) upInput.focus();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        executeCommandPaletteEntry(entries[panel.spxState.activeIndex || 0], settings, state, panel);
      }
    });
    document.body.appendChild(panel);
    return panel;
  }

  function bindCommandPaletteKeyboard(settings, state) {
    if (document.documentElement.dataset.spxCommandPaletteKeyboardReady === '1') return;
    document.documentElement.dataset.spxCommandPaletteKeyboardReady = '1';
    document.addEventListener('keydown', function handleCommandPaletteShortcut(event) {
      if (!event || (!event.ctrlKey && !event.metaKey) || event.shiftKey || event.altKey) return;
      if (String(event.key || '').toLowerCase() !== 'k') return;
      event.preventDefault();
      var panel = createCommandPalettePanel(settings, state);
      setCommandPaletteHidden(panel, !panel.hidden);
    }, true);
  }

  function createToolbar(settings, state) {
    if (qs('#spx-toolbar')) return;
    var toolbar = createEl('div', 'spx-toolbar');
    toolbar.id = 'spx-toolbar';
    var toolbox = null;
    var commandPalette = null;

    function getToolbox() {
      toolbox = toolbox || createToolboxPanel(settings, state);
      return toolbox;
    }

    function getCommandPalette() {
      commandPalette = commandPalette || createCommandPalettePanel(settings, state);
      return commandPalette;
    }

    function closeToolboxIfLoaded() {
      if (toolbox) setToolboxHidden(toolbox, true, TOOLBOX_BUTTON_SELECTOR);
    }

    function closeCommandPaletteIfLoaded() {
      if (commandPalette) setCommandPaletteHidden(commandPalette, true);
    }

    toolbar.appendChild(toolbarButton('顶部', '回到顶部', function top() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
    toolbar.appendChild(toolbarButton('底部', '滚到底部', function bottom() {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }));
    var toolboxButton = toolbarButton('工具', '打开工具箱', function toggleToolbox() {
      var currentToolbox = getToolbox();
      if (currentToolbox.spxRender) currentToolbox.spxRender();
      var nextToolboxHidden = !currentToolbox.hidden;
      setToolboxHidden(currentToolbox, nextToolboxHidden, TOOLBOX_BUTTON_SELECTOR);
      if (!nextToolboxHidden) {
        var settingsPanel = qs('#spx-settings');
        if (settingsPanel) setSettingsPanelHidden(settingsPanel, true, SETTINGS_BUTTON_SELECTOR);
        closeCommandPaletteIfLoaded();
      }
    });
    toolboxButton.dataset.spxToolboxButton = '1';
    toolboxButton.setAttribute('aria-haspopup', 'dialog');
    toolboxButton.setAttribute('aria-controls', 'spx-toolbox');
    toolboxButton.setAttribute('aria-expanded', 'false');
    toolbar.appendChild(toolboxButton);

    var commandButton = toolbarButton('命令', '打开全局命令面板（Ctrl+K）', function toggleCommandPalette() {
      var currentCommandPalette = getCommandPalette();
      var nextHidden = !currentCommandPalette.hidden;
      setCommandPaletteHidden(currentCommandPalette, nextHidden);
      if (!nextHidden) {
        closeToolboxIfLoaded();
        var settingsPanel = qs('#spx-settings');
        if (settingsPanel) setSettingsPanelHidden(settingsPanel, true, SETTINGS_BUTTON_SELECTOR);
      }
    });
    commandButton.dataset.spxCommandPaletteButton = '1';
    commandButton.setAttribute('aria-haspopup', 'dialog');
    commandButton.setAttribute('aria-controls', 'spx-command-palette-overlay');
    commandButton.setAttribute('aria-expanded', 'false');
    toolbar.appendChild(commandButton);

    var settingsButton = toolbarButton('设置', '打开设置', function openSettings() {
      var panel = createSettingsPanel(settings, state);
      if (panel.spxSync) panel.spxSync();
      closeToolboxIfLoaded();
      closeCommandPaletteIfLoaded();
      setSettingsPanelHidden(panel, !panel.hidden, SETTINGS_BUTTON_SELECTOR);
    });
    settingsButton.dataset.spxSettingsButton = '1';
    settingsButton.setAttribute('aria-haspopup', 'dialog');
    settingsButton.setAttribute('aria-controls', 'spx-settings');
    settingsButton.setAttribute('aria-expanded', 'false');
    toolbar.appendChild(settingsButton);
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

  function getCurrentForumDashboardPayload(settings, state) {
    return {
      settings: settings,
      read: state && state.read,
      watch: state && state.watch,
      progress: state && state.progress,
      resources: state && state.resources,
      autoBuyAttempts: loadAutoBuyAttempts(),
      favoriteSeen: loadMap(FAVORITE_NAV_SEEN_KEY),
      requestState: scriptRequestState,
    };
  }

  function formatForumDashboardDigest(report) {
    var data = report || collectForumDashboardReport({});
    var stats = data.stats || {};
    var lines = [
      'South Plus +++ 论坛仪表盘',
      '今日浏览：' + (stats.todayViewed || 0),
      '收藏新增：' + (stats.favoriteAdded || 0),
      '未读收藏：' + (stats.unreadFavorites || 0),
      '资源新增：' + (stats.resourceAdded || 0),
      '稍后看积压：' + (stats.watchBacklog || 0),
      '请求状态：' + (stats.requestStatus || '正常'),
      '',
      '值得回看：',
    ];
    (data.worthReviewing || []).forEach(function appendWorthTopic(topic, index) {
      lines.push((index + 1) + '. ' + topic.title + ' - ' + (topic.reason || topic.meta || '本地记录'));
    });
    return lines.join('\n');
  }

  function createForumDashboardStat(label, value, note, className) {
    var card = createEl('article', 'spx-forum-dashboard-stat' + (className ? ' ' + className : ''));
    card.appendChild(createEl('span', 'spx-forum-dashboard-stat-label', label));
    card.appendChild(createEl('strong', '', String(value == null ? 0 : value)));
    card.appendChild(createEl('small', '', note || ''));
    return card;
  }

  function createForumDashboardChip(text, className) {
    return createEl('span', 'spx-forum-dashboard-chip' + (className ? ' ' + className : ''), text);
  }

  function createForumDashboardTopicRow(topic) {
    var row = createEl('article', 'spx-forum-dashboard-topic');
    var body = createEl('div', 'spx-forum-dashboard-topic-main');
    var title = createEl(topic.url ? 'a' : 'span', 'spx-forum-dashboard-topic-title', topic.title || '未命名主题');
    if (topic.url) title.href = topic.url;
    body.appendChild(title);
    body.appendChild(createEl('div', 'spx-forum-dashboard-topic-meta', topic.reason || topic.meta || '本地记录'));
    row.appendChild(body);
    row.appendChild(createEl('div', 'spx-forum-dashboard-score', String(Math.max(0, Math.round(topic.score || 0)))));
    var chips = createEl('div', 'spx-forum-dashboard-chips');
    if (topic.resourceCount) chips.appendChild(createForumDashboardChip('资源 ' + topic.resourceCount, 'spx-green'));
    if (topic.hasWatch) chips.appendChild(createForumDashboardChip('稍后', 'spx-violet'));
    if (topic.hasSiteFavorite) chips.appendChild(createForumDashboardChip('收藏', 'spx-amber'));
    if (topic.progressPercent) chips.appendChild(createForumDashboardChip(topic.progressPercent + '%', ''));
    row.appendChild(chips);
    return row;
  }

  function createForumDashboardRankRows(items, emptyText) {
    var list = createEl('div', 'spx-forum-dashboard-ranks');
    var source = (items || []).filter(function keepRankItem(item) { return item && item.count > 0; }).slice(0, 4);
    var max = source.reduce(function maxRankValue(value, item) { return Math.max(value, Number(item.count) || 0); }, 1);
    if (!source.length) {
      list.appendChild(createEl('div', 'spx-forum-dashboard-empty', emptyText || '暂无数据'));
      return list;
    }
    source.forEach(function appendRank(item) {
      var row = createEl('div', 'spx-forum-dashboard-rank');
      row.appendChild(createEl('span', '', item.label));
      var bar = createEl('b', '');
      var fill = createEl('i', '');
      fill.style.width = Math.max(8, Math.round((Number(item.count) || 0) / max * 100)) + '%';
      bar.appendChild(fill);
      row.appendChild(bar);
      row.appendChild(createEl('strong', '', String(item.count)));
      list.appendChild(row);
    });
    return list;
  }

  function createForumDashboardResourceRow(entry) {
    var row = createEl('article', 'spx-forum-dashboard-resource');
    var body = createEl('div');
    var title = createEl(entry.sourceUrl ? 'a' : 'span', 'spx-forum-dashboard-resource-title', entry.sourceTitle || entry.label || '未命名资源');
    if (entry.sourceUrl) title.href = entry.sourceUrl;
    body.appendChild(title);
    body.appendChild(createEl('div', 'spx-forum-dashboard-topic-meta', [entry.label, entry.provider, entry.statusLabel].filter(Boolean).join(' · ') || '资源记录'));
    row.appendChild(body);
    row.appendChild(createForumDashboardChip(entry.type === 'cloud' ? '网盘' : entry.label, 'spx-green'));
    return row;
  }

  function createForumDashboardActivityRow(item) {
    var row = createEl('article', 'spx-forum-dashboard-activity spx-' + (item.type || 'progress'));
    row.appendChild(createEl('span', 'spx-forum-dashboard-activity-mark'));
    var body = createEl('div');
    body.appendChild(createEl('div', 'spx-forum-dashboard-topic-title', item.title || '本地动态'));
    body.appendChild(createEl('div', 'spx-forum-dashboard-topic-meta', item.meta || ''));
    row.appendChild(body);
    row.appendChild(createEl('time', '', item.time || ''));
    return row;
  }

  function renderForumDashboardPanel(panel, settings, state) {
    if (!panel) return;
    var report = collectForumDashboardReport(getCurrentForumDashboardPayload(settings, state));
    panel.textContent = '';
    var header = createEl('div', 'spx-forum-dashboard-head');
    var title = createEl('div');
    title.appendChild(createEl('h2', '', '论坛仪表盘'));
    title.appendChild(createEl('p', '', '浏览、收藏、资源和本地积压的首页总览。'));
    header.appendChild(title);
    var actions = createEl('div', 'spx-forum-dashboard-actions');
    [['refresh-dashboard', '刷新摘要'], ['open-watch-backlog', '只看未读'], ['copy-dashboard-digest', '复制日报']].forEach(function appendAction(item) {
      var button = createEl('button', item[0] === 'refresh-dashboard' ? 'spx-primary' : '', item[1]);
      button.type = 'button';
      button.dataset.action = item[0];
      actions.appendChild(button);
    });
    header.appendChild(actions);
    panel.appendChild(header);

    var stats = createEl('div', 'spx-forum-dashboard-stats');
    stats.appendChild(createForumDashboardStat('今日浏览', report.stats.todayViewed, '本地已读 / 阅读进度', 'spx-blue'));
    stats.appendChild(createForumDashboardStat('收藏新增', report.stats.favoriteAdded, '站内收藏 + 稍后看', 'spx-amber'));
    stats.appendChild(createForumDashboardStat('未读收藏', report.stats.unreadFavorites, '未完成的收藏主题', 'spx-rose'));
    stats.appendChild(createForumDashboardStat('资源新增', report.stats.resourceAdded, '今日保存资源', 'spx-green'));
    stats.appendChild(createForumDashboardStat('稍后看积压', report.stats.watchBacklog, '未读完稍后看', 'spx-violet'));
    stats.appendChild(createForumDashboardStat('请求状态', report.stats.requestStatus, report.request.detail, report.request.status === '正常' ? 'spx-green' : 'spx-amber'));
    panel.appendChild(stats);

    var grid = createEl('div', 'spx-forum-dashboard-grid');
    var left = createEl('div', 'spx-forum-dashboard-stack');
    var topicsPanel = createEl('section', 'spx-forum-dashboard-card spx-forum-dashboard-wide');
    topicsPanel.appendChild(createEl('h3', '', '值得回看的主题'));
    var topicList = createEl('div', 'spx-forum-dashboard-topic-list');
    if (report.worthReviewing.length) {
      report.worthReviewing.slice(0, 3).forEach(function appendTopic(topic) {
        topicList.appendChild(createForumDashboardTopicRow(topic));
      });
    } else {
      topicList.appendChild(createEl('div', 'spx-forum-dashboard-empty', '暂无需要回看的主题。'));
    }
    topicsPanel.appendChild(topicList);
    left.appendChild(topicsPanel);

    var split = createEl('div', 'spx-forum-dashboard-split');
    var tagPanel = createEl('section', 'spx-forum-dashboard-card');
    tagPanel.appendChild(createEl('h3', '', '高频标签'));
    tagPanel.appendChild(createForumDashboardRankRows(report.tagStats, '暂无标签统计'));
    split.appendChild(tagPanel);
    var backlogPanel = createEl('section', 'spx-forum-dashboard-card');
    backlogPanel.appendChild(createEl('h3', '', '本地积压'));
    backlogPanel.appendChild(createForumDashboardRankRows(report.backlogStats, '暂无积压'));
    split.appendChild(backlogPanel);
    left.appendChild(split);
    grid.appendChild(left);

    var right = createEl('div', 'spx-forum-dashboard-stack');
    var activityPanel = createEl('section', 'spx-forum-dashboard-card');
    activityPanel.appendChild(createEl('h3', '', '最近动态'));
    var activityList = createEl('div', 'spx-forum-dashboard-activity-list');
    if (report.activities.length) {
      report.activities.forEach(function appendActivity(item) {
        activityList.appendChild(createForumDashboardActivityRow(item));
      });
    } else {
      activityList.appendChild(createEl('div', 'spx-forum-dashboard-empty', '暂无本地动态。'));
    }
    activityPanel.appendChild(activityList);
    right.appendChild(activityPanel);

    var resourcePanel = createEl('section', 'spx-forum-dashboard-card');
    resourcePanel.appendChild(createEl('h3', '', '资源速览'));
    var resourceList = createEl('div', 'spx-forum-dashboard-resource-list');
    if (report.resources.length) {
      report.resources.slice(0, 3).forEach(function appendResource(entry) {
        resourceList.appendChild(createForumDashboardResourceRow(entry));
      });
    } else {
      resourceList.appendChild(createEl('div', 'spx-forum-dashboard-empty', '资源工作台暂无记录。'));
    }
    resourcePanel.appendChild(resourceList);
    right.appendChild(resourcePanel);
    grid.appendChild(right);
    panel.appendChild(grid);

    panel.spxDashboardReport = report;
  }

  function createForumDashboardPanel(settings, state) {
    var panel = createEl('section', 'spx-forum-dashboard-panel spx-home-module');
    panel.id = 'spx-forum-dashboard-panel';
    panel.dataset.spxLarge = '1';
    renderForumDashboardPanel(panel, settings, state);
    panel.addEventListener('click', function handleDashboardClick(event) {
      var target = event.target;
      var action = target && target.dataset && target.dataset.action;
      if (!action) return;
      if (action === 'refresh-dashboard') {
        renderForumDashboardPanel(panel, settings, state);
        setTemporaryText(target, '已刷新', '刷新摘要');
      }
      if (action === 'open-watch-backlog') {
        var watchPanel = createWatchCenterPanel(settings, state);
        setCenterPanelHidden(watchPanel, false);
      }
      if (action === 'copy-dashboard-digest') {
        copyTextToClipboard(formatForumDashboardDigest(panel.spxDashboardReport)).then(
          function showCopySuccess() { setTemporaryText(target, '已复制', '复制日报'); },
          function showCopyFailure() { setTemporaryText(target, '复制失败', '复制日报'); }
        );
      }
    });
    return panel;
  }

  function enhanceHome(settings, state) {
    if (detectPageType(location.href) !== 'home') return;
    enhanceHomeDashboard(settings, state);
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

  function enhanceHomeDashboard(settings, state) {
    restoreHomeDashboard();
    if (!shouldUseHomeDashboard(settings, location.href)) return;

    var modules = qsa('#content .t[id^="t_"]');
    if (!modules.length) return;

    var grid = createEl('div');
    grid.id = 'spx-home-grid';
    modules[0].parentNode.insertBefore(grid, modules[0]);

    if (settings.forumDashboard !== false) {
      var dashboard = createForumDashboardPanel(settings, state);
      grid.appendChild(dashboard);
      queueModuleNavigationConfigs([{
        section: '站点导航',
        label: '论坛仪表盘',
        href: getHomeNavigationBaseUrl(location.origin) + '#spx-forum-dashboard-panel',
        title: '论坛仪表盘',
        target: dashboard,
        active: true,
        alwaysShow: true,
        navigationOnly: true,
      }]);
    }

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
    createHomeModuleNavigation(modules);
  }

  function restoreHomeDashboard() {
    restoreModuleNavigation();
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

  function unwrapTaskLayoutStacks(host) {
    qsa('.spx-task-side-stack,.spx-task-main-stack', host).forEach(function unwrapStack(stack) {
      while (stack.firstChild) {
        stack.parentNode.insertBefore(stack.firstChild, stack);
      }
      stack.remove();
    });
  }

  function isTaskBreadcrumbBlock(node) {
    if (!node || !node.classList) return false;
    return node.classList.contains('bdbA') || node.classList.contains('spx-task-breadcrumb-block') || !!qs('#breadcrumbs', node);
  }

  function markTaskBreadcrumbBlocks(host) {
    qsa('.spx-task-breadcrumb-block', host).forEach(function clearTaskBreadcrumbBlock(node) {
      node.classList.remove('spx-task-breadcrumb-block');
    });
    Array.prototype.slice.call(host.children || []).forEach(function markDirectTaskBreadcrumb(child) {
      if (isTaskBreadcrumbBlock(child)) child.classList.add('spx-task-breadcrumb-block');
    });
    qsa('#breadcrumbs', host).forEach(function markNestedTaskBreadcrumb(breadcrumbs) {
      var block = getTaskLayoutDirectChild(host, breadcrumbs);
      if (block && block !== host && block.classList) block.classList.add('spx-task-breadcrumb-block');
    });
  }

  function isTaskMainBlock(node) {
    var text = String((node && node.textContent) || '');
    if (!text.trim()) return false;
    if (/(任务时效|上次领取|奖励\s*[:：])/.test(text)) return true;
    if (/\bfr\b/.test(String(node.className || '')) && !/社区论坛任务功能简介|版权/.test(text)) return true;
    return false;
  }

  function isTaskSideBlock(node) {
    var text = String((node && node.textContent) || '');
    if (!text.trim()) return false;
    if (/社区论坛任务功能简介|操作|版权|作者\s*[:：]|网站\s*[:：]/.test(text)) return true;
    return /\bfl\b/.test(String(node.className || ''));
  }

  function getTaskLayoutDirectChild(host, node) {
    var current = node;
    while (current && current.parentNode && current.parentNode !== host) {
      current = current.parentNode;
    }
    return current && current.parentNode === host ? current : node;
  }

  function hasTaskLayoutBlockClass(node) {
    return !!(node && /\b(?:fl|fr|t|t3|t5)\b/.test(String(node.className || '')));
  }

  function getTaskLayoutCandidateNodes(host) {
    var nodes = [];
    function appendNode(node) {
      if (!node || node === host || nodes.indexOf(node) !== -1) return;
      if (isTaskBreadcrumbBlock(node)) return;
      nodes.push(node);
    }
    Array.prototype.slice.call(host.children || []).forEach(appendNode);
    qsa('.fl,.fr,.t,.t3,.t5', host).forEach(appendNode);
    var matched = nodes.filter(function keepTaskLayoutBlock(node) {
      if (!isTaskMainBlock(node) && !isTaskSideBlock(node)) return false;
      if (
        node.parentNode === host &&
        !hasTaskLayoutBlockClass(node) &&
        qsa('.fl,.fr,.t,.t3,.t5', node).some(function hasInnerTaskBlock(inner) {
          return isTaskMainBlock(inner) || isTaskSideBlock(inner);
        })
      ) {
        return false;
      }
      return true;
    });
    return matched.filter(function keepInnermostTaskBlock(node) {
      return !matched.some(function hasSelectedDescendant(other) {
        return other !== node && node.contains(other);
      });
    });
  }

  function sortTaskLayoutNodes(nodes) {
    return nodes.slice().sort(function compareDomOrder(a, b) {
      if (a === b) return 0;
      if (!a.compareDocumentPosition) return 0;
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }

  function enhanceTaskPageLayout(settings) {
    if (!shouldUseTaskPage(location.href)) return;
    var host = qs('.spx-module-body') || qs('#main');
    if (!host) return;
    unwrapTaskLayoutStacks(host);
    markTaskBreadcrumbBlocks(host);

    qsa('.spx-task-side-block,.spx-task-main-block', host).forEach(function resetTaskBlockClass(node) {
      node.classList.remove('spx-task-side-block', 'spx-task-main-block');
    });

    var sideItems = [];
    var mainItems = [];
    sortTaskLayoutNodes(getTaskLayoutCandidateNodes(host)).forEach(function collectTaskLayoutItem(node) {
      var isMain = isTaskMainBlock(node);
      var isSide = isTaskSideBlock(node);
      if (isMain && (!isSide || /(任务时效|上次领取|奖励\s*[:：])/.test(String(node.textContent || '')))) {
        mainItems.push(node);
        return;
      }
      if (isSide) {
        sideItems.push(node);
      }
    });
    syncTaskClaimRecordsFromCurrentPage();
    if (!mainItems.length) {
      host.classList.remove('spx-task-layout-body');
      return;
    }

    host.classList.add('spx-task-layout-body');
    var anchorItem = sortTaskLayoutNodes(sideItems.concat(mainItems))[0] || null;
    var anchor = anchorItem ? getTaskLayoutDirectChild(host, anchorItem) : null;
    var sideStack = createEl('div', 'spx-task-side-stack');
    var mainStack = createEl('div', 'spx-task-main-stack');
    host.insertBefore(sideStack, anchor);
    host.insertBefore(mainStack, anchor);
    sideItems.forEach(function moveSideItem(item) {
      item.classList.add('spx-task-side-block');
      sideStack.appendChild(item);
    });
    mainItems.forEach(function moveMainItem(item) {
      item.classList.add('spx-task-main-block');
      mainStack.appendChild(item);
    });
    maybeRunAutoTaskClaim(settings, mainStack);
    ensureTaskClaimInlineSection(mainStack);
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
    var pageType = detectPageType(location.href);
    enhanceCycle += 1;
    invalidateCommandPaletteCache();
    setBodyClasses(settings);
    pendingModuleNavigationConfigs = [];
    restoreModuleNavigation();
    if (shouldUseSiteShell(location.href)) applySiteShellLayout(document);
    enhanceSiteNavigation(document);
    enhanceFavoriteNavigation(settings, state, document);
    standardizeExistingInfobox();
    if (pageType === 'profile') enhanceAccountNavigation(document);
    if (pageType === 'profile') restoreProfileInfobox(settings);
    enhanceAdBlock(settings);
    if (pageType === 'home') enhanceHome(settings, state);
    if (pageType === 'forum') enhanceThreadList(settings, state);
    if (pageType === 'read') enhanceReadPage(settings, state);
    if (pageType === 'read' || pageType === 'post') enhanceQuickReply(settings, state);
    if (shouldUseModuleNavigation(settings, location.href, document)) createGlobalModuleNavigation(settings, state);
    if (pageType === 'task') enhanceTaskPageLayout(settings);
    maybeRunAutoTaskClaim(settings, null);
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
      threadUpdates: loadThreadUpdates(),
      resources: loadResourceLibrary(),
    };
    injectStyles();
    setBodyClasses(settings);
    createToolbar(settings, state);
    bindCommandPaletteKeyboard(settings, state);
    if (shouldUseForumKeyboardPaging(location.href)) bindForumKeyboardPaging();
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
    normalizeThreadUpdateRecord: normalizeThreadUpdateRecord,
    parseThreadReplyCount: parseThreadReplyCount,
    parseThreadReadReplyCountFromDocument: parseThreadReadReplyCountFromDocument,
    shouldCheckThreadUpdate: shouldCheckThreadUpdate,
    updateThreadReplyState: updateThreadReplyState,
    applyThreadUpdateEntries: applyThreadUpdateEntries,
    getThreadUpdateStatusForEntry: getThreadUpdateStatusForEntry,
    buildThreadLatestReadUrl: buildThreadLatestReadUrl,
    decorateFavoriteNavEntryWithUpdate: decorateFavoriteNavEntryWithUpdate,
    decorateFavoriteNavEntriesWithUpdates: decorateFavoriteNavEntriesWithUpdates,
    getFavoriteNavUpdateSummary: getFavoriteNavUpdateSummary,
    getFavoriteNavUnreadUrl: getFavoriteNavUnreadUrl,
    extractThreadReplyCountFromRow: extractThreadReplyCountFromRow,
    mergeReadProgressRecord: mergeReadProgressRecord,
    pruneReadProgress: pruneReadProgress,
    getWatchCenterEntries: getWatchCenterEntries,
    getHistoryCenterEntries: getHistoryCenterEntries,
    getAutoBuyCenterEntries: getAutoBuyCenterEntries,
    collectForumDashboardReport: collectForumDashboardReport,
    getForumDashboardTopicScore: getForumDashboardTopicScore,
    formatForumDashboardDigest: formatForumDashboardDigest,
    filterWatchCenterEntries: filterWatchCenterEntries,
    filterHistoryCenterEntries: filterHistoryCenterEntries,
    filterAutoBuyCenterEntries: filterAutoBuyCenterEntries,
    normalizeCommandPaletteFilter: normalizeCommandPaletteFilter,
    getCommandPaletteCategoryLabel: getCommandPaletteCategoryLabel,
    collectCommandPaletteEntries: collectCommandPaletteEntries,
    filterCommandPaletteEntries: filterCommandPaletteEntries,
    formatCommandPaletteResultSummary: formatCommandPaletteResultSummary,
    matchesBlockRules: matchesBlockRules,
    parseForumFilterQuery: parseForumFilterQuery,
    matchesForumFilter: matchesForumFilter,
    extractPreviewImageUrls: extractPreviewImageUrls,
    isLargePreviewImage: isLargePreviewImage,
    formatPreviewImageLinks: formatPreviewImageLinks,
    getPreviewImageMetaText: getPreviewImageMetaText,
    formatPreviewImageMarkdownLinks: formatPreviewImageMarkdownLinks,
    formatPreviewImageLinksByFloor: formatPreviewImageLinksByFloor,
    getPreviewGalleryRenderState: getPreviewGalleryRenderState,
    formatPreviewGallerySummary: formatPreviewGallerySummary,
    formatPreviewImageArchiveFileName: formatPreviewImageArchiveFileName,
    sanitizePreviewDownloadName: sanitizePreviewDownloadName,
    getPreviewImageDownloadExtension: getPreviewImageDownloadExtension,
    formatPreviewImageDownloadFileName: formatPreviewImageDownloadFileName,
    getPreviewDownloadStatusSummary: getPreviewDownloadStatusSummary,
    formatPreviewDownloadReport: formatPreviewDownloadReport,
    getZipCrc32: getZipCrc32,
    createPreviewZipBlob: createPreviewZipBlob,
    getHeaderValue: getHeaderValue,
    isCrossOriginUrl: isCrossOriginUrl,
    shouldUsePrivilegedPreviewDownload: shouldUsePrivilegedPreviewDownload,
    getPrivilegedResponseBlob: getPrivilegedResponseBlob,
    normalizeResourceUrl: normalizeResourceUrl,
    classifyResourceLink: classifyResourceLink,
    getCloudProviderLabel: getCloudProviderLabel,
    getResourceDisplayLabel: getResourceDisplayLabel,
    getResourceBadgeDefinition: getResourceBadgeDefinition,
    getResourceBadgeFromResourceItem: getResourceBadgeFromResourceItem,
    inferResourceBadgesFromText: inferResourceBadgesFromText,
    getThreadResourceBadgeIndex: getThreadResourceBadgeIndex,
    getThreadResourceBadges: getThreadResourceBadges,
    getResourceBadgeTypes: getResourceBadgeTypes,
    getResourceRailTypeKey: getResourceRailTypeKey,
    getResourceRailTypeLabel: getResourceRailTypeLabel,
    getResourceRailEntries: getResourceRailEntries,
    filterResourceRailEntries: filterResourceRailEntries,
    formatResourceRailSummary: formatResourceRailSummary,
    formatResourceRailSummaryText: formatResourceRailSummaryText,
    formatResourceRailCodes: formatResourceRailCodes,
    getAvailableResourceRailFilterTypes: getAvailableResourceRailFilterTypes,
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
    getSettingsPresetDefinitions: getSettingsPresetDefinitions,
    applySettingsPreset: applySettingsPreset,
    normalizeBatchConfirmItems: normalizeBatchConfirmItems,
    showBatchConfirmDialog: showBatchConfirmDialog,
    confirmBatchAction: confirmBatchAction,
    pruneResourceLibrary: pruneResourceLibrary,
    saveResourceLinksToLibrary: saveResourceLinksToLibrary,
    getResourceCenterEntries: getResourceCenterEntries,
    groupResourceCenterEntries: groupResourceCenterEntries,
    filterResourceCenterEntries: filterResourceCenterEntries,
    getSelectedResourceKeys: getSelectedResourceKeys,
    setResourceSelection: setResourceSelection,
    getResourceEntriesByKeys: getResourceEntriesByKeys,
    normalizeNavigationUsageMap: normalizeNavigationUsageMap,
    getModuleNavigationUsageKey: getModuleNavigationUsageKey,
    getModuleNavigationSmartScore: getModuleNavigationSmartScore,
    sortModuleNavigationTree: sortModuleNavigationTree,
    markThreadsRead: markThreadsRead,
    findThreadIdsByAuthor: findThreadIdsByAuthor,
    hasThreadRowHiddenClass: hasThreadRowHiddenClass,
    isVisibleThreadRow: isVisibleThreadRow,
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
    shouldRetryAutoBuyAttempt: shouldRetryAutoBuyAttempt,
    formatAutoBuyAttemptMessage: formatAutoBuyAttemptMessage,
    findAutoBuyTargets: findAutoBuyTargets,
    getAutoBuyDoneAttemptForThread: getAutoBuyDoneAttemptForThread,
    formatAutoBuyNavSuccessDetail: formatAutoBuyNavSuccessDetail,
    normalizeAutoBuyResponseText: normalizeAutoBuyResponseText,
    isAutoBuyPurchaseResponseSuccessful: isAutoBuyPurchaseResponseSuccessful,
    getAutoBuyPurchaseResponseFailureReason: getAutoBuyPurchaseResponseFailureReason,
    isAutoBuyResidualTargetAcceptable: isAutoBuyResidualTargetAcceptable,
    getAutoBuyResidualButtonNote: getAutoBuyResidualButtonNote,
    createAutoBuyQueueSummary: createAutoBuyQueueSummary,
    formatAutoBuyQueueSummary: formatAutoBuyQueueSummary,
    extractTaskAutoClaimUrl: extractTaskAutoClaimUrl,
    getTaskHomePageUrl: getTaskHomePageUrl,
    getTaskInProgressPageUrl: getTaskInProgressPageUrl,
    getTaskAutoClaimCooldownMs: getTaskAutoClaimCooldownMs,
    getLatestTaskClaimCompletedAt: getLatestTaskClaimCompletedAt,
    isTaskClaimCompletedToday: isTaskClaimCompletedToday,
    getTaskAutoClaimGate: getTaskAutoClaimGate,
    getTaskAutoClaimActionType: getTaskAutoClaimActionType,
    isTaskAutoClaimCandidate: isTaskAutoClaimCandidate,
    getTaskAutoClaimTargets: getTaskAutoClaimTargets,
    getTaskAutoClaimTargetsFromHtml: getTaskAutoClaimTargetsFromHtml,
    getTaskAutoClaimResponseResult: getTaskAutoClaimResponseResult,
    maybeRunAutoTaskClaim: maybeRunAutoTaskClaim,
    parseTaskClaimCompletedAt: parseTaskClaimCompletedAt,
    parseTaskClaimRecordsFromRows: parseTaskClaimRecordsFromRows,
    parseTaskClaimRecordsFromText: parseTaskClaimRecordsFromText,
    pruneTaskClaimRecords: pruneTaskClaimRecords,
    getTaskClaimCenterEntries: getTaskClaimCenterEntries,
    filterTaskClaimCenterEntries: filterTaskClaimCenterEntries,
    shouldSyncTaskClaimRecordsFromUrl: shouldSyncTaskClaimRecordsFromUrl,
    isAdUrl: isAdUrl,
    parseTodayCount: parseTodayCount,
    shouldUseSiteShell: shouldUseSiteShell,
    shouldUseForumDashboard: shouldUseForumDashboard,
    shouldUseForumKeyboardPaging: shouldUseForumKeyboardPaging,
    shouldUseSearchPage: shouldUseSearchPage,
    shouldUseProfilePage: shouldUseProfilePage,
    shouldRestoreProfileInfobox: shouldRestoreProfileInfobox,
    getProfileInfoboxSourceUrl: getProfileInfoboxSourceUrl,
    shouldUseTaskPage: shouldUseTaskPage,
    shouldUseReaderMode: shouldUseReaderMode,
    shouldUseImmersiveRead: shouldUseImmersiveRead,
    shouldUseHomeDashboard: shouldUseHomeDashboard,
    shouldUseModuleNavigation: shouldUseModuleNavigation,
    getCommonForumNavigationItems: getCommonForumNavigationItems,
    getCanonicalForumNavigationLabel: getCanonicalForumNavigationLabel,
    getCurrentForumId: getCurrentForumId,
    isForumGalleryModeUrl: isForumGalleryModeUrl,
    isForumGalleryModeLink: isForumGalleryModeLink,
    getForumPostLinkConfig: getForumPostLinkConfig,
    getForumListModeUrl: getForumListModeUrl,
    getForumGalleryModeUrl: getForumGalleryModeUrl,
    normalizeModuleNavDensity: normalizeModuleNavDensity,
    getModuleNavigationDensityConfig: getModuleNavigationDensityConfig,
    getModuleNavigationGroupKey: getModuleNavigationGroupKey,
    normalizeNavigationPinMap: normalizeNavigationPinMap,
    getModuleNavigationConfigPinKey: getModuleNavigationConfigPinKey,
    withPinnedModuleNavigationConfigs: withPinnedModuleNavigationConfigs,
    getFavoriteNavUrl: getFavoriteNavUrl,
    extractSiteVerifyHashFromText: extractSiteVerifyHashFromText,
    getSiteVerifyHash: getSiteVerifyHash,
    getThreadFavoriteUrl: getThreadFavoriteUrl,
    getThreadFavoriteResultText: getThreadFavoriteResultText,
    isNewThreadFavoriteResult: isNewThreadFavoriteResult,
    getSiteFavoriteDeleteResultText: getSiteFavoriteDeleteResultText,
    buildFavoriteDeleteRequest: buildFavoriteDeleteRequest,
    normalizeFavoriteDeleteFields: normalizeFavoriteDeleteFields,
    getFavoriteNavDeleteKey: getFavoriteNavDeleteKey,
    getSelectedSiteFavoriteEntries: getSelectedSiteFavoriteEntries,
    createFavoriteNavEntryFromThreadInfo: createFavoriteNavEntryFromThreadInfo,
    createReadPageFavoriteInfo: createReadPageFavoriteInfo,
    formatFavoriteNavCount: formatFavoriteNavCount,
    normalizeFavoriteNavCountCacheEntry: normalizeFavoriteNavCountCacheEntry,
    shouldRefreshFavoriteNavCountCache: shouldRefreshFavoriteNavCountCache,
    inferFavoriteNavTags: inferFavoriteNavTags,
    parseFavoriteSavedAt: parseFavoriteSavedAt,
    applyFavoriteNavSeenTimes: applyFavoriteNavSeenTimes,
    getFavoriteNavEntrySearchText: getFavoriteNavEntrySearchText,
    filterFavoriteNavEntries: filterFavoriteNavEntries,
    sortFavoriteNavEntries: sortFavoriteNavEntries,
    parseFavoriteReplyCount: parseFavoriteReplyCount,
    getFavoriteNavWatchEntries: getFavoriteNavWatchEntries,
    normalizeNavigationCollapseState: normalizeNavigationCollapseState,
    isModuleNavigationGroupCollapsed: isModuleNavigationGroupCollapsed,
    isModuleNavigationConfigActive: isModuleNavigationConfigActive,
    shouldShowToolbarFeature: shouldShowToolbarFeature,
    hasPreviewGalleryImages: hasPreviewGalleryImages,
    shouldShowToolbarAction: shouldShowToolbarAction,
    getSettingsPanelKeys: getSettingsPanelKeys,
    isNetworkFriendlyMode: isNetworkFriendlyMode,
    getScriptRequestPolicyConfig: getScriptRequestPolicyConfig,
    isScriptRateLimitStatus: isScriptRateLimitStatus,
    isScriptRateLimitHtml: isScriptRateLimitHtml,
    getScriptRequestDelay: getScriptRequestDelay,
    getNavigationRefreshKey: getNavigationRefreshKey,
    getThreadPreviewMetaText: getThreadPreviewMetaText,
    getThreadPreviewImageUrls: getThreadPreviewImageUrls,
    getThreadPreviewImageSummary: getThreadPreviewImageSummary,
    getThreadPreviewStatusChips: getThreadPreviewStatusChips,
    getThreadPreviewHoverDelay: getThreadPreviewHoverDelay,
    createQuickReplyRequest: createQuickReplyRequest,
    getQuickReplyAttachmentFiles: getQuickReplyAttachmentFiles,
    formatQuickReplyAttachmentSummary: formatQuickReplyAttachmentSummary,
    formatQuickReplyFileSize: formatQuickReplyFileSize,
    getQuickReplyEmotes: function getQuickReplyEmotes() { return QUICK_REPLY_EMOTES.slice(); },
    isQuickReplySubmitter: isQuickReplySubmitter,
    getQuickReplySubmitter: getQuickReplySubmitter,
    isQuickReplyEditorCandidate: isQuickReplyEditorCandidate,
    performQuickReplySubmit: performQuickReplySubmit,
    resolveQuickReplyRefreshUrl: resolveQuickReplyRefreshUrl,
    shouldUseQuickReplySubmitHtml: shouldUseQuickReplySubmitHtml,
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

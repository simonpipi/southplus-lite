#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

const enhancer = require('../southplus_enhancer.user.js');

const FEATURE_SURFACE = {
  core: [
    'init', 'getDefaultSettings', 'parseThreadId', 'parseLineList', 'parseQuickReplyList', 'parseTagList',
    'detectPageType', 'buildPageUrl', 'parseTodayCount', 'isAdUrl',
  ],
  settingsAndPolicy: [
    'getSettingsPresetDefinitions', 'applySettingsPreset', 'normalizeBatchConfirmItems', 'showBatchConfirmDialog',
    'confirmBatchAction', 'shouldShowToolbarFeature', 'shouldShowToolbarAction', 'getSettingsPanelKeys',
    'isNetworkFriendlyMode', 'getScriptRequestPolicyConfig', 'isScriptRateLimitStatus', 'isScriptRateLimitHtml',
    'getScriptRequestDelay', 'getNavigationRefreshKey',
  ],
  backupHealthStorage: [
    'createBackupPayload', 'normalizeBackupPayload', 'formatBackupFileName', 'collectDataHealthReport',
    'cleanupDataHealthPayload', 'formatDataHealthSummary', 'formatDataHealthWarnings', 'collectStorageUsageReport',
    'formatStorageBytes', 'formatStorageUsageSummary', 'formatStorageUsageWarnings', 'formatStorageUsageLimit',
    'getStorageUsageLevel', 'formatStorageUsageEntry', 'formatBackupImportPreview',
  ],
  readWatchHistory: [
    'formatReadProgress', 'getReadProgressRestoreTarget', 'mergeReadProgressRecord', 'pruneReadProgress',
    'getWatchCenterEntries', 'getHistoryCenterEntries', 'filterWatchCenterEntries', 'filterHistoryCenterEntries',
    'applyReadPostLayout', 'isEmptyReadSeparatorNode', 'getPostToolsHost', 'syncHiddenPostShell',
  ],
  forumListDashboard: [
    'collectForumDashboardReport', 'getForumDashboardTopicScore', 'formatForumDashboardDigest', 'matchesBlockRules',
    'parseForumFilterQuery', 'matchesForumFilter', 'markThreadsRead', 'findThreadIdsByAuthor',
    'hasThreadRowHiddenClass', 'isVisibleThreadRow', 'isStickyCell', 'hideStickyThreads', 'hideForumAnnouncementPanels',
    'shouldUseForumDashboard', 'shouldUseForumKeyboardPaging', 'getCurrentForumId', 'isForumGalleryModeUrl',
    'isForumGalleryModeLink', 'getForumPostLinkConfig', 'getForumListModeUrl', 'getForumGalleryModeUrl',
    'setHomeModuleCollapsed',
  ],
  navigationAndShell: [
    'shouldUseSiteShell', 'shouldUseSearchPage', 'shouldUseProfilePage', 'shouldRestoreProfileInfobox',
    'getProfileInfoboxSourceUrl', 'shouldUseTaskPage', 'shouldUseReaderMode', 'shouldUseImmersiveRead',
    'shouldUseHomeDashboard', 'shouldUseModuleNavigation', 'getCommonForumNavigationItems',
    'getCanonicalForumNavigationLabel', 'normalizeModuleNavDensity', 'getModuleNavigationDensityConfig',
    'getModuleNavigationGroupKey', 'normalizeNavigationPinMap', 'getModuleNavigationConfigPinKey',
    'withPinnedModuleNavigationConfigs', 'normalizeNavigationUsageMap', 'getModuleNavigationUsageKey',
    'getModuleNavigationSmartScore', 'sortModuleNavigationTree', 'normalizeNavigationCollapseState',
    'isModuleNavigationGroupCollapsed', 'isModuleNavigationConfigActive', 'getInjectedStyleText',
    'applySiteShellLayout', 'enhanceSiteNavigation',
  ],
  commandAndCenters: [
    'getAutoBuyCenterEntries', 'filterAutoBuyCenterEntries', 'normalizeCommandPaletteFilter',
    'getCommandPaletteCategoryLabel', 'collectCommandPaletteEntries', 'filterCommandPaletteEntries',
    'formatCommandPaletteResultSummary', 'getResourceCenterEntries', 'groupResourceCenterEntries',
    'filterResourceCenterEntries', 'getSelectedResourceKeys', 'setResourceSelection', 'getResourceEntriesByKeys',
  ],
  previewGallery: [
    'extractPreviewImageUrls', 'isLargePreviewImage', 'formatPreviewImageLinks', 'getPreviewImageMetaText',
    'formatPreviewImageMarkdownLinks', 'formatPreviewImageLinksByFloor', 'getPreviewGalleryRenderState',
    'formatPreviewGallerySummary', 'formatPreviewImageArchiveFileName', 'sanitizePreviewDownloadName',
    'getPreviewImageDownloadExtension', 'formatPreviewImageDownloadFileName', 'getPreviewDownloadStatusSummary',
    'formatPreviewDownloadReport', 'getZipCrc32', 'createPreviewZipBlob', 'getHeaderValue', 'isCrossOriginUrl',
    'shouldUsePrivilegedPreviewDownload', 'getPrivilegedResponseBlob', 'isPreviewImageCandidate',
    'clampPreviewZoom', 'getPreviewLightboxKeyAction', 'hasPreviewGalleryImages', 'getThreadPreviewMetaText',
    'getThreadPreviewImageUrls', 'getThreadPreviewImageSummary', 'getThreadPreviewStatusChips',
    'getThreadPreviewHoverDelay',
  ],
  resources: [
    'normalizeResourceUrl', 'classifyResourceLink', 'getCloudProviderLabel', 'getResourceDisplayLabel',
    'getResourceBadgeDefinition', 'getResourceBadgeFromResourceItem', 'inferResourceBadgesFromText',
    'getThreadResourceBadgeIndex', 'getThreadResourceBadges', 'getResourceBadgeTypes', 'getResourceRailTypeKey',
    'getResourceRailTypeLabel', 'getResourceRailEntries', 'filterResourceRailEntries', 'formatResourceRailSummary',
    'formatResourceRailSummaryText', 'formatResourceRailCodes', 'getAvailableResourceRailFilterTypes',
    'extractResourceLinksFromText', 'filterResourceLinks', 'formatResourceLinks', 'getJumpResourceLinks',
    'getResourceDownloadQueueEntries', 'formatResourceDownloadList', 'formatResourceMarkdownList',
    'formatResourceDownloadFileName', 'formatResourceJumpSummary', 'normalizeResourceTags', 'formatResourceTags',
    'pruneResourceLibrary', 'saveResourceLinksToLibrary',
  ],
  autoBuyAndTasks: [
    'parsePostPrice', 'parseUserSpBalance', 'shouldAutoBuyPost', 'extractBuyTopicUrl', 'getAutoBuyAttemptKey',
    'isAutoBuyAttemptBlocked', 'shouldRetryAutoBuyAttempt', 'formatAutoBuyAttemptMessage', 'findAutoBuyTargets',
    'getAutoBuyDoneAttemptForThread', 'formatAutoBuyNavSuccessDetail', 'normalizeAutoBuyResponseText', 'isAutoBuyPurchaseResponseSuccessful',
    'getAutoBuyPurchaseResponseFailureReason', 'isAutoBuyResidualTargetAcceptable', 'getAutoBuyResidualButtonNote',
    'createAutoBuyQueueSummary', 'formatAutoBuyQueueSummary', 'extractTaskAutoClaimUrl', 'getTaskHomePageUrl', 'getTaskInProgressPageUrl',
    'getTaskAutoClaimCooldownMs', 'getLatestTaskClaimCompletedAt', 'isTaskClaimCompletedToday',
    'getTaskAutoClaimGate', 'getTaskAutoClaimActionType', 'isTaskAutoClaimCandidate', 'getTaskAutoClaimTargets',
    'getTaskAutoClaimTargetsFromHtml', 'getTaskAutoClaimResponseResult', 'maybeRunAutoTaskClaim',
    'parseTaskClaimCompletedAt', 'parseTaskClaimRecordsFromRows', 'parseTaskClaimRecordsFromText',
    'pruneTaskClaimRecords', 'getTaskClaimCenterEntries', 'filterTaskClaimCenterEntries',
    'shouldSyncTaskClaimRecordsFromUrl',
  ],
  favorites: [
    'getFavoriteNavUrl', 'extractSiteVerifyHashFromText', 'getSiteVerifyHash', 'getThreadFavoriteUrl',
    'getThreadFavoriteResultText', 'isNewThreadFavoriteResult', 'getSiteFavoriteDeleteResultText',
    'buildFavoriteDeleteRequest', 'normalizeFavoriteDeleteFields', 'getFavoriteNavDeleteKey',
    'getSelectedSiteFavoriteEntries', 'createFavoriteNavEntryFromThreadInfo', 'createReadPageFavoriteInfo',
    'formatFavoriteNavCount', 'normalizeFavoriteNavCountCacheEntry', 'shouldRefreshFavoriteNavCountCache',
    'inferFavoriteNavTags', 'parseFavoriteSavedAt', 'applyFavoriteNavSeenTimes', 'getFavoriteNavEntrySearchText',
    'filterFavoriteNavEntries', 'sortFavoriteNavEntries', 'parseFavoriteReplyCount', 'getFavoriteNavWatchEntries',
    'normalizeThreadUpdateRecord', 'parseThreadReplyCount', 'parseThreadReadReplyCountFromDocument',
    'shouldCheckThreadUpdate', 'updateThreadReplyState', 'applyThreadUpdateEntries', 'getThreadUpdateStatusForEntry',
    'buildThreadLatestReadUrl', 'decorateFavoriteNavEntryWithUpdate', 'decorateFavoriteNavEntriesWithUpdates',
    'getFavoriteNavUpdateSummary', 'getFavoriteNavUnreadUrl', 'extractThreadReplyCountFromRow',
  ],
  quickReply: [
    'createQuickReplyRequest', 'getQuickReplyAttachmentFiles', 'formatQuickReplyAttachmentSummary',
    'formatQuickReplyFileSize', 'getQuickReplyEmotes', 'isQuickReplySubmitter', 'getQuickReplySubmitter',
    'isQuickReplyEditorCandidate', 'performQuickReplySubmit', 'resolveQuickReplyRefreshUrl',
    'shouldUseQuickReplySubmitHtml',
  ],
};

function unique(values) {
  return Array.from(new Set(values));
}

function assertFeatureSurfaceIsFullyClassified() {
  const exported = Object.keys(enhancer).sort();
  const classified = Object.values(FEATURE_SURFACE).flat().sort();
  const duplicates = classified.filter((name, index) => classified.indexOf(name) !== index);
  const missing = exported.filter((name) => !classified.includes(name));
  const unknown = classified.filter((name) => !exported.includes(name));

  assert.deepEqual(unique(duplicates), [], 'FEATURE_SURFACE must not classify an export twice');
  assert.deepEqual(missing, [], 'Every exported helper must be assigned to a feature suite');
  assert.deepEqual(unknown, [], 'FEATURE_SURFACE contains helpers that are no longer exported');
  classified.forEach((name) => assert.equal(typeof enhancer[name], 'function', name + ' should remain callable'));
}

function runSuite(name, fn) {
  fn();
  return name;
}

function fakeClassList(initial) {
  const names = new Set(initial || []);
  return {
    add: (...items) => items.forEach((item) => names.add(item)),
    remove: (...items) => items.forEach((item) => names.delete(item)),
    contains: (item) => names.has(item),
    toggle: (item, force) => {
      if (force === undefined ? !names.has(item) : !!force) names.add(item);
      else names.delete(item);
      return names.has(item);
    },
    toArray: () => Array.from(names).sort(),
  };
}

function emptyRoot() {
  return {
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

function suiteCore() {
  assert.equal(enhancer.parseThreadId('https://south-plus.org/read.php?tid-2915937.html'), '2915937');
  assert.deepEqual(enhancer.parseLineList(' AI \nAI\n 资源 '), ['AI', '资源']);
  assert.deepEqual(enhancer.parseQuickReplyList('感谢分享\n\n支持一下'), ['感谢分享', '支持一下']);
  assert.deepEqual(enhancer.parseTagList('资源\n图片\nAI\n资源'), ['资源', '图片', 'AI']);
  assert.equal(enhancer.detectPageType('https://south-plus.org/thread.php?fid-9.html'), 'forum');
  assert.equal(enhancer.detectPageType('https://south-plus.org/read.php?tid-1.html'), 'read');
  assert.equal(enhancer.buildPageUrl('https://south-plus.org/thread.php?fid-9-page-2.html', 3), 'https://south-plus.org/thread.php?fid-9-page-3.html');
  assert.equal(enhancer.parseTodayCount('茶馆 (42)'), 42);
  assert.equal(enhancer.isAdUrl('https://adservice.google.com/banner'), true);
}

function suiteSettingsAndPolicy() {
  const defaults = enhancer.getDefaultSettings();
  assert.equal(defaults.networkFriendly, true);
  assert.equal(enhancer.getSettingsPresetDefinitions().resource.label, '资源');
  assert.equal(enhancer.applySettingsPreset(defaults, 'light').forumDashboard, false);
  assert.deepEqual(enhancer.normalizeBatchConfirmItems(['a', { title: 'b', meta: 'm' }]), [{ title: 'a', meta: '' }, { title: 'b', meta: 'm' }]);
  assert.equal(enhancer.shouldShowToolbarFeature('top'), true);
  assert.equal(enhancer.shouldShowToolbarAction('next', 'https://south-plus.org/thread.php?fid-9.html'), true);
  assert.ok(enhancer.getSettingsPanelKeys('https://south-plus.org/read.php?tid-1.html', emptyRoot()).includes('readerMode'));
  assert.equal(enhancer.isNetworkFriendlyMode({ networkFriendly: false }), false);
  assert.equal(enhancer.getScriptRequestPolicyConfig({ mode: 'action' }).priority, 30);
  assert.equal(enhancer.isScriptRateLimitStatus(520), true);
  assert.equal(enhancer.isScriptRateLimitHtml('<title>520 Web server is returning an unknown error</title>'), true);
  assert.equal(enhancer.getScriptRequestDelay({ mode: 'preview', networkFriendly: false }, { lastStartedAt: 1000 }, 1000), 500);
  assert.match(enhancer.getNavigationRefreshKey(['https://south-plus.org/thread.php?fid-9.html']), /thread/);
}

function suiteBackupHealthStorage() {
  const now = 1787747505000;
  const payload = {
    settings: { cleanMode: false, quickReplies: ['感谢分享'] },
    read: { 1: now },
    watch: { 1: { title: '重复', url: '/read.php?tid-1.html', savedAt: now }, 2: { title: '重复', url: '/read.php?tid-1.html', savedAt: now - 1 } },
    progress: { 1: { title: '进度', url: '/read.php?tid-1.html', updatedAt: now, progress: 0.5 } },
    threadUpdates: { 1: { id: '1', knownReplies: 12, readReplies: 10, updatedAt: now } },
    autoBuyAttempts: { '1': { title: '购买', status: 'done', updatedAt: now } },
    taskClaims: { 'daily|1': { taskName: '日常', completedAt: now, rewardSp: 2 } },
    resources: { 'cloud|https://pan.baidu.com/s/abc': { url: 'https://pan.baidu.com/s/abc', type: 'cloud', savedAt: now, status: 'todo' } },
    navigation: { nav: { label: '茶馆', href: '/thread.php?fid-9.html', savedAt: now } },
    navigationPins: { pin: true },
    navigationUsage: { nav: { usedAt: now, hitCount: 2 } },
  };
  const backup = enhancer.createBackupPayload(payload, now);
  assert.equal(backup.app, 'spEnhancer');
  assert.equal(backup.data.threadUpdates['1'].unreadReplies, 2);
  assert.equal(enhancer.normalizeBackupPayload(JSON.stringify(backup)).data.resources['cloud|https://pan.baidu.com/s/abc'].status, 'todo');
  assert.match(enhancer.formatBackupFileName(now), /^southplus-plus-backup-/);
  const health = enhancer.collectDataHealthReport(payload, now);
  assert.equal(health.counts.resources, 1);
  assert.match(enhancer.formatDataHealthSummary(health), /资源 1/);
  assert.match(enhancer.formatDataHealthWarnings(health), /重复稍后看 1/);
  assert.equal(enhancer.cleanupDataHealthPayload(payload, health).after.cleanupCount, 0);
  const storage = enhancer.collectStorageUsageReport(payload);
  assert.equal(storage.entries.length, 11);
  assert.equal(enhancer.formatStorageBytes(1536), '1.5 KB');
  assert.match(enhancer.formatStorageUsageSummary(storage), /本地存储约/);
  assert.match(enhancer.formatStorageUsageEntry(storage.entries.find((entry) => entry.key.includes(':resources:'))), /^资源库：/);
  assert.equal(enhancer.getStorageUsageLevel(storage.entries[0]), 'ok');
  assert.match(enhancer.formatBackupImportPreview(backup), /即将导入 South Plus \+\+\+ 本地备份/);
}

function suiteReadWatchHistory() {
  const progress = {
    1: { title: '旧', url: '/read.php?tid-1.html', updatedAt: 1000, progress: 0.5, page: 1 },
    2: { title: '新', url: '/read.php?tid-2.html', updatedAt: 2000, progress: 1, page: 2 },
  };
  assert.equal(enhancer.formatReadProgress(progress[2]), '第 2 页 · 100%');
  assert.equal(enhancer.getReadProgressRestoreTarget({ floorHash: '#read_tpc', floorTop: 300 }, 'last').top, 300);
  assert.equal(enhancer.mergeReadProgressRecord(progress[1], { updatedAt: 900, progress: 0.2 }).progress, 0.5);
  assert.deepEqual(Object.keys(enhancer.pruneReadProgress(progress, 1)), ['2']);
  const watch = { 2: { title: '新', url: '/read.php?tid-2.html', savedAt: 3000, tags: ['资源'] } };
  const watchEntries = enhancer.getWatchCenterEntries(watch, progress);
  assert.equal(watchEntries[0].id, '2');
  assert.equal(enhancer.filterWatchCenterEntries(watchEntries, { tag: '资源' }).length, 1);
  assert.equal(enhancer.getHistoryCenterEntries(progress)[0].id, '2');
  assert.equal(enhancer.filterHistoryCenterEntries(enhancer.getHistoryCenterEntries(progress), { query: '旧' })[0].id, '1');
  assert.equal(enhancer.isEmptyReadSeparatorNode({ textContent: '---', querySelector: () => null }), false);
}

function suiteForumListDashboard() {
  const now = new Date(2026, 7, 26, 10, 0, 0).getTime();
  const data = {
    read: { 1001: now },
    watch: { 1001: { title: 'AI 图片资源整理楼', url: '/read.php?tid-1001.html', savedAt: now, tags: ['AI'] } },
    progress: { 1001: { title: 'AI 图片资源整理楼', url: '/read.php?tid-1001.html', updatedAt: now, progress: 0.6 } },
    resources: { r1: { sourceTitle: 'AI 图片资源整理楼', sourceUrl: '/read.php?tid-1001.html', savedAt: now, type: 'cloud', status: 'todo' } },
    favoriteSeen: { 1001: now },
    request: { nextCheckAt: now + 30000, reason: 'cooldown' },
  };
  const report = enhancer.collectForumDashboardReport(data, now);
  assert.equal(report.stats.todayViewed, 1);
  assert.equal(report.worthReviewing[0].id, '1001');
  assert.ok(enhancer.getForumDashboardTopicScore(report.worthReviewing[0], now) > 0);
  assert.match(enhancer.formatForumDashboardDigest(report), /值得回看/);
  assert.equal(enhancer.matchesBlockRules({ title: 'AI 图片', author: 'bob' }, { titleKeywords: ['AI'] }), true);
  const query = enhancer.parseForumFilterQuery('作者:bob AI !广告');
  assert.equal(enhancer.matchesForumFilter({ title: 'AI 图片', author: 'bob', resourceBadges: [] }, query), true);
  assert.equal(enhancer.getCurrentForumId('https://south-plus.org/thread.php?fid-9.html'), '9');
  assert.equal(enhancer.isForumGalleryModeUrl('https://south-plus.org/thread_new.php?fid-9.html'), true);
  assert.equal(enhancer.getForumListModeUrl('https://south-plus.org/thread_new.php?fid-9.html'), 'https://south-plus.org/thread.php?fid-9.html');
  assert.equal(enhancer.getForumGalleryModeUrl('https://south-plus.org/thread.php?fid-9.html'), 'https://south-plus.org/thread_new.php?fid-9-page-1.html');
}

function suiteNavigationAndShell() {
  assert.equal(enhancer.shouldUseSiteShell('https://south-plus.org/read.php?tid-1.html'), true);
  assert.equal(enhancer.shouldUseSearchPage('https://south-plus.org/search.php'), true);
  assert.equal(enhancer.shouldUseProfilePage('https://south-plus.org/u.php?action-favor.html'), true);
  assert.equal(enhancer.shouldUseTaskPage('https://south-plus.org/plugin.php?H_name-tasks.html'), true);
  assert.equal(enhancer.shouldUseReaderMode({ readerMode: true }, 'https://south-plus.org/read.php?tid-1.html'), true);
  assert.equal(enhancer.shouldUseImmersiveRead({ immersiveRead: true }, 'https://south-plus.org/read.php?tid-1.html'), true);
  assert.equal(enhancer.shouldUseHomeDashboard({ homeDashboard: true }, 'https://south-plus.org/index.php'), true);
  assert.equal(enhancer.shouldUseModuleNavigation({ homeDashboard: true }, 'https://south-plus.org/index.php'), true);
  assert.equal(enhancer.getCommonForumNavigationItems('https://south-plus.org').find((item) => item.label === '茶馆').href, 'https://south-plus.org/thread.php?fid-9.html');
  assert.equal(enhancer.getCanonicalForumNavigationLabel('GALGAME汉化区', 'https://south-plus.org/thread.php?fid-128.html'), '同人音声');
  assert.equal(enhancer.normalizeModuleNavDensity('bad'), 'comfortable');
  assert.equal(enhancer.getModuleNavigationDensityConfig('compact').width, 220);
  assert.equal(enhancer.getModuleNavigationGroupKey(' 站点导航 '), '站点导航');
  assert.deepEqual(enhancer.normalizeNavigationPinMap({ a: true, b: false }), { a: true });
  const config = { section: '站点导航', label: '茶馆', href: 'https://south-plus.org/thread.php?fid-9.html' };
  assert.equal(enhancer.getModuleNavigationConfigPinKey(config), '站点导航|茶馆|https://south-plus.org/thread.php?fid-9.html');
  assert.equal(enhancer.withPinnedModuleNavigationConfigs([config])[0].section, '站点导航');
  assert.deepEqual(enhancer.normalizeNavigationUsageMap({ a: { usedAt: '2', clickedAt: 3, hitCount: '4' } }), { a: { usedAt: 2, clickedAt: 3, hitCount: 4 } });
  assert.equal(enhancer.getModuleNavigationUsageKey(config), '站点导航|茶馆|https://south-plus.org/thread.php?fid-9.html');
  assert.ok(enhancer.getModuleNavigationSmartScore(Object.assign({ active: true }, config), {}, 1000) > enhancer.getModuleNavigationSmartScore(config, {}, 1000));
  const groups = [{ label: '站点导航', nodes: [{ label: '低频', config: { label: '低频', section: '站点导航', href: '/low', order: 1 }, children: [] }, { label: '茶馆', config: config, children: [] }] }];
  assert.equal(enhancer.sortModuleNavigationTree(groups, { smartModuleNavSort: true }, { [enhancer.getModuleNavigationUsageKey(config)]: { usedAt: 999, hitCount: 2 } }, 1000)[0].nodes[0].label, '茶馆');
  assert.deepEqual(enhancer.normalizeNavigationCollapseState({ a: true, b: false }), { a: true });
  assert.equal(enhancer.isModuleNavigationGroupCollapsed({ a: true }, 'a'), true);
  assert.equal(enhancer.isModuleNavigationConfigActive({ href: 'https://south-plus.org/thread.php?fid-9.html' }, 'https://south-plus.org/thread.php?fid-9.html'), true);
  assert.match(enhancer.getInjectedStyleText(), /spx-toolbar/);
}

function suiteCommandAndCenters() {
  const attempts = { a: { title: '付费帖', url: '/read.php?tid-1.html', status: 'done', updatedAt: 2000, price: 5 } };
  const autoEntries = enhancer.getAutoBuyCenterEntries(attempts);
  assert.equal(autoEntries[0].status, 'done');
  assert.equal(enhancer.filterAutoBuyCenterEntries(autoEntries, { status: 'done' }).length, 1);
  assert.equal(enhancer.normalizeCommandPaletteFilter('bad'), 'all');
  assert.equal(enhancer.getCommandPaletteCategoryLabel('resource'), '资源');
  const commands = enhancer.collectCommandPaletteEntries({
    toolboxConfigs: [{ label: '顶部', detail: '回到顶部', icon: '顶', action: () => {} }],
    centerConfigs: [{ label: '资源工作台', detail: '资源', panelId: 'spx-resource-center' }],
    settingsConfigs: [{ label: '夜间模式', key: 'nightMode' }],
    resources: { r: { url: 'https://pan.baidu.com/s/abc', type: 'cloud', savedAt: 1 } },
  });
  assert.ok(commands.length >= 4);
  assert.equal(enhancer.filterCommandPaletteEntries(commands, { filter: 'resource' }).some((entry) => /百度网盘|资源/.test(entry.title)), true);
  assert.match(enhancer.formatCommandPaletteResultSummary(commands.slice(0, 2), commands, { filter: 'all' }), /项/);
  const resources = { r: { url: 'https://pan.baidu.com/s/abc', type: 'cloud', savedAt: 1, status: 'todo', tags: ['网盘'], sourceTitle: '网盘' } };
  const entries = enhancer.getResourceCenterEntries(resources);
  assert.equal(entries[0].type, 'cloud');
  assert.equal(enhancer.groupResourceCenterEntries(entries, 'type')[0].label, '网盘');
  assert.equal(enhancer.filterResourceCenterEntries(entries, { status: 'todo', query: 'baidu' }).length, 1);
  const panelState = { selectedResources: {} };
  enhancer.setResourceSelection(entries, panelState, true);
  assert.deepEqual(enhancer.getSelectedResourceKeys(entries, panelState), [entries[0].key]);
  assert.equal(enhancer.getResourceEntriesByKeys(entries, [entries[0].key])[0].key, entries[0].key);
}

function suitePreviewGallery() {
  const images = [{ src: '/a.jpg', naturalWidth: 800, naturalHeight: 600 }, { dataset: { spxPreviewLazySrc: 'https://img.example.com/b.png' } }];
  assert.deepEqual(enhancer.extractPreviewImageUrls(images, 'https://south-plus.org/read.php?tid-1.html'), ['https://south-plus.org/a.jpg']);
  assert.equal(enhancer.isLargePreviewImage(images[0]), true);
  assert.match(enhancer.formatPreviewImageLinks([{ src: 'https://img.example.com/a.jpg' }]), /https:\/\/img/);
  assert.equal(enhancer.getPreviewImageMetaText({ floorLabel: '楼主', author: 'alice' }, 0), '图 1 · 楼主 · alice');
  assert.match(enhancer.formatPreviewImageMarkdownLinks([{ src: 'https://img.example.com/a.jpg', floorLabel: '楼主' }]), /!\[图 1 · 楼主\]/);
  assert.match(enhancer.formatPreviewImageLinksByFloor([{ src: 'https://img.example.com/a.jpg', floorLabel: '楼主' }]), /楼主/);
  assert.equal(enhancer.getPreviewGalleryRenderState(2, 1).hasMore, true);
  assert.match(enhancer.formatPreviewGallerySummary(2, 2, 1), /1 \/ 当前页 2/);
  assert.equal(enhancer.formatPreviewImageArchiveFileName(new Date('2026-08-13T14:09:00').getTime()), 'southplus-images-20260813-1409.zip');
  assert.equal(enhancer.sanitizePreviewDownloadName('楼主 / alice:*?'), '楼主-alice');
  assert.equal(enhancer.getPreviewImageDownloadExtension('https://img.example.com/a.webp?x=1', ''), '.webp');
  assert.equal(enhancer.formatPreviewImageDownloadFileName({ floorLabel: '楼主', author: 'alice', url: 'https://img.example.com/a.jpg' }, 2), '003-楼主-alice.jpg');
  assert.match(enhancer.getPreviewDownloadStatusSummary({ total: 2, done: 1, failed: 1 }), /1 \/ 2/);
  assert.match(enhancer.formatPreviewDownloadReport([{ ok: true, fileName: 'a.jpg' }, { ok: false, url: 'b', error: 'fail' }]), /失败图片/);
  assert.equal(enhancer.getZipCrc32(new Uint8Array([97, 98, 99])).toString(16), '352441c2');
  assert.equal(enhancer.getHeaderValue('Content-Type: image/gif\r\nContent-Length: 10', 'content-type'), 'image/gif');
  assert.equal(enhancer.isCrossOriginUrl('https://image.acg.lol/a.gif', 'https://south-plus.org/read.php?tid-1.html'), true);
  assert.equal(enhancer.shouldUsePrivilegedPreviewDownload('https://image.acg.lol/a.gif', 'https://south-plus.org/read.php?tid-1.html', true), true);
  assert.equal(enhancer.shouldUsePrivilegedPreviewDownload('https://south-plus.org/a.gif', 'https://south-plus.org/read.php?tid-1.html', true), false);
  assert.equal(enhancer.isPreviewImageCandidate({ src: 'https://img.example.com/a.jpg', width: 640, height: 360 }), true);
  assert.equal(enhancer.clampPreviewZoom(8), 4);
  assert.equal(enhancer.getPreviewLightboxKeyAction({ key: 'ArrowRight' }), 'next');
  const previewRoot = {
    querySelectorAll: () => [{ querySelector: () => ({ querySelectorAll: () => [{ src: 'https://img.example.com/a.jpg', naturalWidth: 640, naturalHeight: 360 }] }) }],
  };
  assert.equal(enhancer.hasPreviewGalleryImages(previewRoot), true);
  assert.equal(enhancer.getThreadPreviewMetaText({ author: 'alice', replies: 8 }), '作者：alice · 悬停预览');
  assert.deepEqual(enhancer.getThreadPreviewImageUrls({ images: ['https://south-plus.org/a.jpg'] }), ['https://south-plus.org/a.jpg']);
  assert.equal(enhancer.getThreadPreviewImageSummary({ images: ['a', 'b'] }), '共 2 张预览图');
  assert.ok(enhancer.getThreadPreviewStatusChips({ read: true, watch: true }).length >= 2);
  assert.equal(enhancer.getThreadPreviewHoverDelay({ networkFriendly: false }), 260);
}

function suiteResources() {
  assert.equal(enhancer.normalizeResourceUrl('pan.baidu.com/s/abc?pwd=1234'), 'https://pan.baidu.com/s/abc?pwd=1234');
  assert.equal(enhancer.classifyResourceLink('magnet:?xt=urn:btih:ABC123'), 'magnet');
  assert.equal(enhancer.getCloudProviderLabel('https://pan.quark.cn/s/abc'), '夸克网盘');
  const link = { url: 'https://pan.baidu.com/s/abc?pwd=1234', type: 'cloud', accessCode: '1234', floorLabel: '楼主', author: 'alice', sourceUrl: 'https://south-plus.org/read.php?tid-1.html' };
  assert.match(enhancer.getResourceDisplayLabel(link), /百度网盘/);
  assert.equal(enhancer.getResourceBadgeDefinition('baidu').label, '百度');
  assert.equal(enhancer.getResourceBadgeFromResourceItem(link).type, 'baidu');
  assert.ok(enhancer.inferResourceBadgesFromText('百度网盘 magnet:?xt=urn:btih:ABC').length >= 2);
  assert.equal(enhancer.getThreadResourceBadgeIndex({ r: link })['1'][0].type, 'baidu');
  assert.ok(enhancer.getThreadResourceBadges({ title: '百度网盘', id: '1' }, {}).some((badge) => badge.type === 'baidu'));
  assert.deepEqual(enhancer.getResourceBadgeTypes([{ type: 'baidu' }, { type: 'cloud' }]), ['baidu', 'cloud']);
  assert.equal(enhancer.getResourceRailTypeKey(link), 'baidu');
  assert.equal(enhancer.getResourceRailTypeLabel('baidu'), '百度');
  const rail = enhancer.getResourceRailEntries([link], {});
  assert.equal(rail[0].statusLabel, '待保存');
  assert.equal(enhancer.filterResourceRailEntries(rail, 'baidu').length, 1);
  assert.equal(enhancer.formatResourceRailSummary(rail).total, 1);
  assert.match(enhancer.formatResourceRailSummaryText(rail), /1 条/);
  assert.match(enhancer.formatResourceRailCodes(rail), /提取码 1234/);
  assert.deepEqual(enhancer.getAvailableResourceRailFilterTypes(rail), ['baidu']);
  const links = enhancer.extractResourceLinksFromText('magnet:?xt=urn:btih:ABCDEF1234567890 pan.baidu.com/s/abc?pwd=1234', 'https://south-plus.org/read.php?tid-1.html');
  assert.ok(links.length >= 2);
  assert.equal(enhancer.filterResourceLinks(links, { category: 'cloud' }).length, 1);
  assert.match(enhancer.formatResourceLinks(links), /magnet/);
  assert.equal(enhancer.getJumpResourceLinks(links).some((item) => item.type === 'cloud'), true);
  assert.equal(enhancer.getResourceDownloadQueueEntries(rail).length, 1);
  assert.match(enhancer.formatResourceDownloadList(rail), /百度网盘/);
  assert.match(enhancer.formatResourceMarkdownList(rail), /\*\*百度网盘\*\*/);
  assert.match(enhancer.formatResourceDownloadFileName(Date.UTC(2026, 7, 26, 12, 0, 0)), /^southplus-resources-/);
  assert.match(enhancer.formatResourceJumpSummary(rail), /百度/);
  assert.deepEqual(enhancer.normalizeResourceTags([' AI ', '', 'AI', '网盘']), ['AI', '网盘']);
  assert.equal(enhancer.formatResourceTags(['AI', '网盘']), 'AI / 网盘');
  const saved = enhancer.saveResourceLinksToLibrary(links, {}, { sourceTitle: '资源帖', sourceUrl: '/read.php?tid-1.html' });
  assert.ok(saved.saved >= 2);
  assert.ok(Object.keys(enhancer.pruneResourceLibrary(saved.resources)).length >= 2);
}

function suiteAutoBuyAndTasks() {
  assert.equal(enhancer.parsePostPrice('本帖售价：5 SP币'), 5);
  assert.equal(enhancer.parseUserSpBalance('当前拥有 30 SP币'), 30);
  assert.equal(enhancer.shouldAutoBuyPost({ autoBuyPost: true, autoBuyMaxSp: 10 }, 5, 20, null), true);
  assert.equal(enhancer.extractBuyTopicUrl("onclick=\"ajaxurl('job.php?action=buytopic&tid=1')\"", 'https://south-plus.org/read.php?tid-1.html'), 'https://south-plus.org/job.php?action=buytopic&tid=1');
  assert.equal(enhancer.getAutoBuyAttemptKey('https://south-plus.org/read.php?tid-1.html', 'https://south-plus.org/'), '1:tpc');
  assert.equal(enhancer.isAutoBuyAttemptBlocked({ status: 'done', updatedAt: 1000 }, 2000), true);
  assert.equal(enhancer.isAutoBuyAttemptBlocked({ status: 'buying', updatedAt: 1000 }, 1000 + 2 * 60 * 1000), false);
  assert.match(enhancer.formatAutoBuyAttemptMessage({ status: 'failed', error: '余额不足' }), /自动购买失败/);
  assert.equal(enhancer.getAutoBuyDoneAttemptForThread({ '1:tpc': { status: 'done', updatedAt: 1 } }, '1').key, '1:tpc');
  assert.match(enhancer.formatAutoBuyNavSuccessDetail({ price: 5, balance: 20 }), /5/);
  assert.equal(enhancer.isAutoBuyPurchaseResponseSuccessful('购买成功'), true);
  assert.equal(enhancer.getAutoBuyPurchaseResponseFailureReason('错误：余额不足'), '错误：余额不足');
  assert.equal(enhancer.findAutoBuyTargets({ querySelectorAll: () => [{ getAttribute: () => "location.href='job.php?action=buytopic&tid=1&pid=2'", closest: () => ({ textContent: '此帖售价 0 SP币' }) }] }, 'https://south-plus.org/read.php?tid-1.html').length, 1);
  assert.equal(enhancer.getAutoBuyResidualButtonNote({ target: { price: 0 } }, { price: 0 }, [], ''), '原站仍保留 0 SP 购买按钮');
  assert.equal(enhancer.shouldRetryAutoBuyAttempt({ status: 'failed', message: '购买后仍存在购买按钮' }), true);
  assert.equal(enhancer.formatAutoBuyQueueSummary({ done: 2, skipped: 0, failed: 1 }), '自动购买已完成，成功 2 个，失败 1 个。');
  assert.equal(enhancer.extractTaskAutoClaimUrl("startjob('15')", 'https://south-plus.org/plugin.php?H_name-tasks.html', 'start'), 'https://south-plus.org/plugin.php?H_name=tasks&action=ajax&actions=job&cid=15');
  assert.equal(enhancer.getTaskHomePageUrl(), 'https://south-plus.org/plugin.php?H_name-tasks.html');
  assert.equal(enhancer.getTaskInProgressPageUrl(), 'https://south-plus.org/plugin.php?H_name-tasks-actions-newtasks.html.html');
  assert.equal(enhancer.getTaskAutoClaimCooldownMs('weekly'), 7 * 24 * 60 * 60 * 1000);
  const completedAt = new Date(2026, 7, 26, 8, 0, 0).getTime();
  const records = {
    'daily|1': { taskName: '日常', completedAt, rewardSp: 2 },
    'weekly|1': { taskName: '周常', completedAt, rewardSp: 7 },
  };
  assert.equal(enhancer.getLatestTaskClaimCompletedAt(records, 'daily'), completedAt);
  assert.equal(enhancer.isTaskClaimCompletedToday(records, 'daily', completedAt + 60 * 60 * 1000), true);
  assert.equal(enhancer.getTaskAutoClaimGate(records, {}, completedAt + 60 * 60 * 1000).canRun, false);
  assert.deepEqual(enhancer.getTaskAutoClaimGate({ 'daily|1': records['daily|1'] }, {}, completedAt + 60 * 60 * 1000).dueTaskKeys, ['weekly']);
  assert.equal(enhancer.getTaskAutoClaimActionType('按这申请此任务', '', '日常'), 'start');
  assert.equal(enhancer.isTaskAutoClaimCandidate('领取此奖励', '', '日常 奖励 : SP币 2 G'), true);
  const html = '<a onclick="startjob(15)">按这申请此任务</a><a onclick="startjob(16)" title="领取此奖励">领取此奖励</a>';
  const taskControls = [
    {
      textContent: '按这申请此任务',
      value: '',
      title: '',
      getAttribute: (name) => (name === 'onclick' ? "startjob('15')" : ''),
      closest: (selector) => (selector.indexOf('spx-task-side') !== -1 ? null : { textContent: '日常 奖励 : SP币 2 G' }),
    },
    {
      textContent: '领取此奖励',
      value: '',
      title: '',
      getAttribute: (name) => (name === 'onclick' ? "startjob('16')" : ''),
      closest: (selector) => (selector.indexOf('spx-task-side') !== -1 ? null : { textContent: '周常 奖励 : SP币 7 G 已完成 100 %' }),
    },
  ];
  const originalDOMParser = global.DOMParser;
  global.DOMParser = function DOMParser() {
    this.parseFromString = () => ({
      querySelectorAll: (selector) => (
        selector === 'a[href],a[onclick],button,input[type="button"],input[type="submit"],input[type="image"],[role="button"][onclick]'
          ? taskControls
          : []
      ),
    });
  };
  try {
    assert.ok(enhancer.getTaskAutoClaimTargetsFromHtml(html, 'https://south-plus.org/plugin.php?H_name-tasks.html').length >= 2);
  } finally {
    if (originalDOMParser === undefined) delete global.DOMParser;
    else global.DOMParser = originalDOMParser;
  }
  assert.equal(enhancer.getTaskAutoClaimResponseResult('<ajax><![CDATA[success\t任务完成]]></ajax>').status, 'success');
  assert.equal(enhancer.parseTaskClaimCompletedAt('完成时间 2026-08-17 PM:08:50:19'), new Date(2026, 7, 17, 20, 50, 19).getTime());
  assert.equal(enhancer.parseTaskClaimRecordsFromRows(['日常 奖励 : SP币 2 G 完成时间 2026-08-17 AM:08:50:19'])[0].taskName, '日常');
  assert.equal(enhancer.parseTaskClaimRecordsFromText('日常 奖励 : SP币 2 G 完成时间 2026-08-17 AM:08:50:19')[0].rewardSp, 2);
  assert.equal(Object.keys(enhancer.pruneTaskClaimRecords(records)).length, 2);
  assert.equal(enhancer.getTaskClaimCenterEntries(records)[0].taskKey, 'daily');
  assert.equal(enhancer.filterTaskClaimCenterEntries(enhancer.getTaskClaimCenterEntries(records), { filter: 'daily' }).length, 1);
  assert.equal(enhancer.shouldSyncTaskClaimRecordsFromUrl('https://south-plus.org/plugin.php?H_name-tasks-actions-endtasks.html.html'), true);
}

function suiteFavorites() {
  assert.equal(enhancer.getFavoriteNavUrl('42', 'https://south-plus.org'), 'https://south-plus.org/u.php?action-favor-uid-42.html');
  assert.equal(enhancer.extractSiteVerifyHashFromText("var verifyhash = '77492139';"), '77492139');
  assert.equal(enhancer.getSiteVerifyHash({ querySelectorAll: () => [{ textContent: "verifyhash = '77492139'" }] }), '77492139');
  assert.equal(enhancer.getThreadFavoriteUrl('td_3373', 'https://south-plus.org', '77492139', 1785990000000), 'https://south-plus.org/pw_ajax.php?action=favor&tid=3373&nowtime=1785990000000&verify=77492139');
  assert.equal(enhancer.getThreadFavoriteResultText('帖子收藏成功!'), '已收藏');
  assert.equal(enhancer.isNewThreadFavoriteResult('帖子收藏成功!'), true);
  assert.equal(enhancer.getSiteFavoriteDeleteResultText('收藏删除成功'), '已删除');
  assert.equal(enhancer.buildFavoriteDeleteRequest('/u.php?action=favor&job=del', 'GET', [{ name: 'selid[]', value: '3373' }], 'https://south-plus.org/u.php?action-favor.html').url, 'https://south-plus.org/u.php?action=favor&job=del&selid%5B%5D=3373');
  assert.deepEqual(enhancer.normalizeFavoriteDeleteFields([{ name: 'verify', value: 'v' }, { name: 'job', value: 'change' }]), [{ name: 'verify', value: 'v' }, { name: 'job', value: 'clear' }]);
  const entry = { source: 'site', id: '3373', url: 'https://south-plus.org/read.php?tid-3373.html', index: 2, deleteRequest: { url: 'https://south-plus.org/u.php?action=favor&job=del' } };
  assert.equal(enhancer.getFavoriteNavDeleteKey(entry), 'site|3373|https://south-plus.org/read.php?tid-3373.html|2');
  assert.equal(enhancer.getSelectedSiteFavoriteEntries([entry], { [enhancer.getFavoriteNavDeleteKey(entry)]: true })[0].id, '3373');
  assert.equal(enhancer.createFavoriteNavEntryFromThreadInfo({ id: '1', title: 'AI 图片资源', author: 'alice', titleLink: { href: '/read.php?tid-1.html' } }, 1000).tags.includes('AI'), true);
  assert.equal(enhancer.createReadPageFavoriteInfo('1', ' 标题 ', ' bob ', 'https://south-plus.org/read.php?tid-1.html#tpc').title, '标题');
  assert.equal(enhancer.formatFavoriteNavCount(1200), '999+');
  assert.equal(enhancer.normalizeFavoriteNavCountCacheEntry({ count: 12, updatedAt: 1000 }, 2000).fresh, true);
  assert.equal(enhancer.shouldRefreshFavoriteNavCountCache({ count: 12, updatedAt: 1000 }, 1000 + 3 * 60 * 1000), true);
  assert.deepEqual(enhancer.inferFavoriteNavTags('AI 图片资源合集', ''), ['资源', '图片', 'AI']);
  assert.equal(enhancer.parseFavoriteSavedAt('收藏时间 2026-08-06 08:12', new Date(2026, 7, 6, 9, 0).getTime()), new Date(2026, 7, 6, 8, 12).getTime());
  assert.equal(enhancer.applyFavoriteNavSeenTimes([{ source: 'site', id: '1', savedAt: 0 }], {}, 2000).map['1'], 2000);
  const entries = [{ id: '1', title: 'AI', url: 'https://south-plus.org/read.php?tid-1.html', author: 'alice', tags: ['AI'], tagText: 'AI', savedAt: 1, progressAt: 2, replies: 1, read: false }];
  assert.match(enhancer.getFavoriteNavEntrySearchText(entries[0]), /alice/);
  assert.equal(enhancer.filterFavoriteNavEntries(entries, { query: 'AI' }).length, 1);
  assert.equal(enhancer.sortFavoriteNavEntries(entries, 'reply')[0].title, 'AI');
  assert.equal(enhancer.parseFavoriteReplyCount('回复 128'), 128);
  assert.equal(enhancer.getFavoriteNavWatchEntries({ 1: { title: '稍后看', url: '/read.php?tid-1.html', savedAt: 1 } }, {}).length, 1);
  assert.equal(enhancer.parseThreadReplyCount('回帖 42'), 42);
  const firstUpdate = enhancer.updateThreadReplyState({}, { id: '1', title: 'AI', url: 'https://south-plus.org/read.php?tid-1.html', replies: 128 }, { source: 'favorite-page' }, 1000);
  assert.equal(firstUpdate.record.hasNewReplies, false);
  const nextUpdate = enhancer.updateThreadReplyState(firstUpdate.map, { id: '1', replies: 133 }, { source: 'forum-list' }, 2000);
  assert.equal(nextUpdate.record.unreadReplies, 5);
  const decorated = enhancer.decorateFavoriteNavEntryWithUpdate(entries[0], nextUpdate.map);
  assert.equal(decorated.updateText, '新 +5');
  assert.equal(enhancer.filterFavoriteNavEntries([decorated], { filter: 'updated' }).length, 1);
  assert.equal(enhancer.getFavoriteNavUpdateSummary([decorated], nextUpdate.map).count, 1);
  assert.equal(enhancer.buildThreadLatestReadUrl('1', 'https://south-plus.org/read.php?tid-1.html'), 'https://south-plus.org/read.php?tid=1&page=e#a');
  assert.equal(enhancer.getFavoriteNavUnreadUrl(decorated), 'https://south-plus.org/read.php?tid-1-page-5.html');
  assert.equal(enhancer.updateThreadReplyState(nextUpdate.map, { id: '1', replies: 133 }, { markRead: true }, 3000).record.hasNewReplies, false);
  assert.equal(enhancer.shouldCheckThreadUpdate({ id: '1', read: false }, { id: '1', lastCheckedAt: 1000 }, 1000 + 20 * 60 * 1000, false), true);
}

function suiteQuickReply() {
  const imageFile = { name: 'a.png', type: 'image/png', size: 2048 };
  const textFile = { name: 'a.txt', type: 'text/plain', size: 12 };
  assert.deepEqual(enhancer.getQuickReplyAttachmentFiles({ files: [imageFile, textFile] }), [imageFile]);
  assert.equal(enhancer.formatQuickReplyAttachmentSummary([imageFile]), '已选择 1 张图片；正式提交会随原站回复表单一起发送。');
  assert.equal(enhancer.formatQuickReplyFileSize(2.5 * 1024 * 1024), '2.5 MB');
  const quickReplyEmotes = enhancer.getQuickReplyEmotes();
  assert.equal(quickReplyEmotes.length, 38);
  assert.equal(quickReplyEmotes[0].code, '[s:638]');
  assert.equal(quickReplyEmotes[3].code, '[s:746]');
  assert.equal(new Set(quickReplyEmotes.map((emote) => emote.code)).size, quickReplyEmotes.length);
  assert.equal(enhancer.isQuickReplySubmitter({ tagName: 'BUTTON', type: 'submit', name: '', value: '' }), true);
  assert.equal(enhancer.getQuickReplySubmitter({ querySelector: () => ({ tagName: 'INPUT', type: 'submit', name: 'Submit', value: '提交' }) }).value, '提交');
  assert.equal(enhancer.isQuickReplyEditorCandidate({ disabled: false, readOnly: false, closest: () => null }), true);
  assert.equal(enhancer.resolveQuickReplyRefreshUrl('https://south-plus.org/post.php?action=reply&tid=123', '<a href="read.php?tid=123&page=e#a">返回</a>'), 'https://south-plus.org/read.php?tid=123&page=e#a');
  assert.equal(enhancer.shouldUseQuickReplySubmitHtml('<table class="js-post"></table>', { ok: true }), true);
}

const completed = [
  runSuite('exported feature surface', assertFeatureSurfaceIsFullyClassified),
  runSuite('core parsing and routing', suiteCore),
  runSuite('settings and request policy', suiteSettingsAndPolicy),
  runSuite('backup, data health, and storage', suiteBackupHealthStorage),
  runSuite('read progress, watch, and history', suiteReadWatchHistory),
  runSuite('forum list and dashboard', suiteForumListDashboard),
  runSuite('navigation and page shell', suiteNavigationAndShell),
  runSuite('command palette and local centers', suiteCommandAndCenters),
  runSuite('preview gallery and hover preview', suitePreviewGallery),
  runSuite('resource detection and library', suiteResources),
  runSuite('auto-buy and task automation', suiteAutoBuyAndTasks),
  runSuite('favorites and favorite navigation', suiteFavorites),
  runSuite('quick reply', suiteQuickReply),
];

console.log('all feature suites passed: ' + completed.join(', '));

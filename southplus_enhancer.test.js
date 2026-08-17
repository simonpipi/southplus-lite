const assert = require('node:assert/strict');
const fs = require('node:fs');
const enhancer = require('./southplus_enhancer.user.js');

const source = fs.readFileSync('./southplus_enhancer.user.js', 'utf8');
assert.match(source, /@version\s+0\.5\.0/);
const defaultSettings = enhancer.getDefaultSettings();
assert.equal(defaultSettings.networkFriendly, true);
assert.equal(defaultSettings.forumDashboard, true);
assert.equal(defaultSettings.moduleNavDensity, 'comfortable');
assert.equal(enhancer.getSettingsPresetDefinitions().resource.label, '资源');
const lightPreset = enhancer.applySettingsPreset({ forumDashboard: true, unifiedPreviewGallery: true, titleKeywords: ['foo'] }, 'light');
assert.equal(lightPreset.forumDashboard, false);
assert.equal(lightPreset.unifiedPreviewGallery, false);
assert.deepEqual(lightPreset.titleKeywords, ['foo']);
assert.deepEqual(enhancer.normalizeBatchConfirmItems(['a', { title: 'b', meta: 'm' }]), [{ title: 'a', meta: '' }, { title: 'b', meta: 'm' }]);
assert.match(source, /spx-quick-reply-launcher/);
assert.match(source, /spx-quick-reply-attach/);
assert.match(source, /panel\.classList\.add\('spx-quick-reply-collapsed'\)/);
assert.match(source, /quickReply\.type = 'button'/);
assert.match(source, /a\[onclick\*="postreply"\]/);
assert.match(source, /bottom:78px/);
assert.match(source, /请输入回复内容或选择图片/);
assert.equal(enhancer.getQuickReplyEmotes().length, 38);
assert.equal(enhancer.getQuickReplyEmotes()[0].code, '[s:1]');
assert.equal(enhancer.getQuickReplyEmotes()[0].src, 'https://south-plus.org/images/post/smile/smallface/face001.jpg');
assert.equal(enhancer.formatQuickReplyAttachmentSummary([]), '沿用原站附件上传；正式提交时随原站回复表单一起发送。');
assert.equal(enhancer.formatQuickReplyAttachmentSummary([{ name: 'a.png' }]), '已选择 1 张图片；正式提交会随原站回复表单一起发送。');
assert.equal(enhancer.formatQuickReplyFileSize(2048), '2 KB');
assert.equal(enhancer.formatQuickReplyFileSize(2.5 * 1024 * 1024), '2.5 MB');
const imageFile = { name: 'a.png', type: 'image/png' };
const textFile = { name: 'a.txt', type: 'text/plain' };
assert.deepEqual(enhancer.getQuickReplyAttachmentFiles({ files: [imageFile, textFile] }), [imageFile]);
assert.equal(enhancer.normalizeModuleNavDensity('compact'), 'compact');
assert.equal(enhancer.normalizeModuleNavDensity('standard'), 'standard');
assert.equal(enhancer.normalizeModuleNavDensity('bad-value'), 'comfortable');
assert.equal(enhancer.getModuleNavigationDensityConfig('standard').width, 240);
assert.equal(enhancer.getModuleNavigationDensityConfig('comfortable').itemHeight, 44);
assert.deepEqual(enhancer.normalizeNavigationPinMap({ alpha: true, beta: false, '': true }), { alpha: true });
assert.equal(
  enhancer.getModuleNavigationConfigPinKey({
    section: '站点导航',
    label: '茶馆',
    href: 'https://south-plus.org/thread.php?fid-9.html',
  }),
  '站点导航|茶馆|https://south-plus.org/thread.php?fid-9.html'
);
assert.equal(enhancer.getFavoriteNavUrl('42', 'https://south-plus.org'), 'https://south-plus.org/u.php?action-favor-uid-42.html');
assert.equal(enhancer.getFavoriteNavUrl('uid-42', 'https://south-plus.org/'), 'https://south-plus.org/u.php?action-favor-uid-42.html');
assert.equal(enhancer.extractSiteVerifyHashFromText("var imgpath = 'images';var verifyhash = '77492139';"), '77492139');
assert.equal(enhancer.getSiteVerifyHash({
  querySelectorAll: function querySelectorAll(selector) {
    return selector === 'script' ? [{ textContent: "var verifyhash = '77492139';" }] : [];
  },
}), '77492139');
assert.equal(
  enhancer.getThreadFavoriteUrl('td_3373', 'https://south-plus.org', '77492139', 1785990000000),
  'https://south-plus.org/pw_ajax.php?action=favor&tid=3373&nowtime=1785990000000&verify=77492139'
);
assert.equal(
  enhancer.getThreadFavoriteUrl('3373', 'https://south-plus.org', '77492139', 1785990000000),
  'https://south-plus.org/pw_ajax.php?action=favor&tid=3373&nowtime=1785990000000&verify=77492139'
);
assert.equal(enhancer.getThreadFavoriteResultText('success\t收藏成功'), '已收藏');
assert.equal(enhancer.getThreadFavoriteResultText('<?xml version="1.0"?><ajax><![CDATA[帖子收藏成功!]]></ajax>'), '已收藏');
assert.equal(enhancer.getThreadFavoriteResultText('您已经收藏过该主题'), '已收藏');
assert.equal(enhancer.getThreadFavoriteResultText('请先登录后再收藏'), '收藏失败');
assert.equal(enhancer.getThreadFavoriteResultText('非法请求，请返回重试!'), '收藏失败');
assert.equal(enhancer.isNewThreadFavoriteResult('帖子收藏成功!'), true);
assert.equal(enhancer.isNewThreadFavoriteResult('您已经收藏过该主题'), false);
assert.equal(enhancer.getSiteFavoriteDeleteResultText('收藏删除成功'), '已删除');
assert.equal(enhancer.getSiteFavoriteDeleteResultText('非法请求，请返回重试!'), '删除失败');
assert.deepEqual(
  enhancer.buildFavoriteDeleteRequest(
    '/u.php?action=favor&job=del',
    'POST',
    [{ name: 'selid[]', value: '3373' }, { name: 'step', value: '2' }],
    'https://south-plus.org/u.php?action-favor-uid-42.html'
  ),
  {
    url: 'https://south-plus.org/u.php?action=favor&job=del',
    method: 'POST',
    body: 'selid%5B%5D=3373&step=2',
    contentType: 'application/x-www-form-urlencoded;charset=UTF-8',
  }
);
assert.deepEqual(
  enhancer.normalizeFavoriteDeleteFields([
    { name: 'verify', value: '77492139' },
    { name: 'selid[]', value: '2930554' },
    { name: 'job', value: 'change' },
    { name: 'type', value: '0' }
  ]),
  [
    { name: 'verify', value: '77492139' },
    { name: 'selid[]', value: '2930554' },
    { name: 'job', value: 'clear' }
  ]
);
assert.deepEqual(
  enhancer.buildFavoriteDeleteRequest(
    '/u.php?action=favor&',
    'POST',
    enhancer.normalizeFavoriteDeleteFields([
      { name: 'verify', value: '77492139' },
      { name: 'selid[]', value: '2930554' },
      { name: 'job', value: 'change' },
      { name: 'type', value: '0' }
    ]),
    'https://south-plus.org/u.php?action-favor-uid-947000.html'
  ),
  {
    url: 'https://south-plus.org/u.php?action=favor&',
    method: 'POST',
    body: 'verify=77492139&selid%5B%5D=2930554&job=clear',
    contentType: 'application/x-www-form-urlencoded;charset=UTF-8',
  }
);
assert.deepEqual(
  enhancer.buildFavoriteDeleteRequest(
    '/u.php?action=favor&job=del',
    'GET',
    [{ name: 'selid[]', value: '3373' }],
    'https://south-plus.org/u.php?action-favor-uid-42.html'
  ),
  {
    url: 'https://south-plus.org/u.php?action=favor&job=del&selid%5B%5D=3373',
    method: 'GET',
    body: '',
  }
);
assert.equal(
  enhancer.getFavoriteNavDeleteKey({ source: 'site', id: '3373', url: 'https://south-plus.org/read.php?tid-3373.html', index: 2 }),
  'site|3373|https://south-plus.org/read.php?tid-3373.html|2'
);
assert.deepEqual(
  enhancer.getSelectedSiteFavoriteEntries(
    [
      { source: 'site', id: '3373', url: 'https://south-plus.org/read.php?tid-3373.html', index: 2, deleteRequest: { url: 'https://south-plus.org/u.php?action=favor&job=del' } },
      { source: 'site', id: '3374', url: 'https://south-plus.org/read.php?tid-3374.html', index: 3, deleteRequest: { url: 'https://south-plus.org/u.php?action=favor&job=del' } },
    ],
    { 'site|3374|https://south-plus.org/read.php?tid-3374.html|3': true }
  ).map((entry) => entry.id),
  ['3374']
);
assert.deepEqual(
  enhancer.createFavoriteNavEntryFromThreadInfo({
    id: '3373',
    title: 'AI 图片资源合集',
    author: 'alice',
    titleLink: { href: 'https://south-plus.org/read.php?tid-3373.html' },
  }, 1785990000000),
  {
    source: 'site',
    id: '3373',
    title: 'AI 图片资源合集',
    url: 'https://south-plus.org/read.php?tid-3373.html',
    author: 'alice',
    meta: 'AI 图片资源合集 alice',
    savedAt: 1785990000000,
    savedAtLabel: '收藏',
    progressAt: 0,
    replies: 0,
    read: false,
    tags: ['资源', '图片', 'AI'],
    tagText: '资源 / 图片 / AI',
    index: 0,
  }
);
assert.deepEqual(
  enhancer.createReadPageFavoriteInfo('3373', ' 阅读页标题 ', ' alice ', 'https://south-plus.org/read.php?tid-3373.html#tpc'),
  {
    id: '3373',
    title: '阅读页标题',
    author: 'alice',
    url: 'https://south-plus.org/read.php?tid-3373.html',
  }
);
assert.equal(enhancer.formatFavoriteNavCount(1200), '999+');
assert.equal(enhancer.formatFavoriteNavCount(9, true), '...');
const freshFavoriteCountCache = enhancer.normalizeFavoriteNavCountCacheEntry({ count: 12, updatedAt: 1000 }, 1000 + 60 * 1000);
assert.equal(freshFavoriteCountCache.count, 12);
assert.equal(freshFavoriteCountCache.fresh, true);
assert.equal(enhancer.shouldRefreshFavoriteNavCountCache({ count: 12, updatedAt: 1000 }, 1000 + 60 * 1000), false);
assert.equal(enhancer.shouldRefreshFavoriteNavCountCache({ count: 12, updatedAt: 1000 }, 1000 + 3 * 60 * 1000), true);
assert.equal(enhancer.shouldRefreshFavoriteNavCountCache({ nextRefreshAt: 5000 }, 4000), false);
assert.deepEqual(enhancer.inferFavoriteNavTags('AI 图片资源合集', ''), ['资源', '图片', 'AI']);
assert.equal(
  enhancer.parseFavoriteSavedAt('收藏时间 2026-08-06 08:12', new Date(2026, 7, 6, 9, 0).getTime()),
  new Date(2026, 7, 6, 8, 12).getTime()
);
assert.equal(
  enhancer.parseFavoriteSavedAt('08-05 21:34', new Date(2026, 7, 6, 9, 0).getTime()),
  new Date(2026, 7, 5, 21, 34).getTime()
);
const seenResult = enhancer.applyFavoriteNavSeenTimes(
  [{ source: 'site', id: '2929020', title: '收藏帖', savedAt: 0 }],
  {},
  new Date(2026, 7, 6, 8, 20).getTime()
);
assert.equal(seenResult.changed, true);
assert.equal(seenResult.map['2929020'], new Date(2026, 7, 6, 8, 20).getTime());
const favoriteEntries = [
  { title: 'AI 交流', author: 'alice', tags: ['AI'], tagText: 'AI', savedAt: 10, progressAt: 2, replies: 1, read: false },
  { title: '网盘资源', author: 'bob', tags: ['资源'], tagText: '资源', savedAt: 20, progressAt: 1, replies: 8, read: true },
  { title: '图片预览', author: 'carol', tags: ['图片'], tagText: '图片', savedAt: 5, progressAt: 9, replies: 3, read: false },
];
assert.deepEqual(enhancer.filterFavoriteNavEntries(favoriteEntries, { filter: 'resource' }).map((entry) => entry.title), ['网盘资源']);
assert.deepEqual(enhancer.filterFavoriteNavEntries(favoriteEntries, { query: 'carol' }).map((entry) => entry.title), ['图片预览']);
assert.deepEqual(enhancer.sortFavoriteNavEntries(favoriteEntries, 'reply').map((entry) => entry.title), ['网盘资源', '图片预览', 'AI 交流']);
assert.equal(enhancer.parseFavoriteReplyCount('作者 bob 回复 128 最后发表'), 128);
const dashboardNow = new Date(2026, 7, 9, 12, 0).getTime();
const dashboardReport = enhancer.collectForumDashboardReport({
  read: {
    1002: dashboardNow - 30 * 60 * 1000,
    old: dashboardNow - 3 * 24 * 60 * 60 * 1000,
  },
  watch: {
    1001: {
      title: 'AI 图片资源整理楼',
      url: 'https://south-plus.org/read.php?tid-1001.html',
      savedAt: dashboardNow - 60 * 60 * 1000,
      tags: ['AI'],
    },
    1002: {
      title: '已读完的稍后看',
      url: 'https://south-plus.org/read.php?tid-1002.html',
      savedAt: dashboardNow - 40 * 24 * 60 * 60 * 1000,
    },
  },
  progress: {
    1001: {
      title: 'AI 图片资源整理楼',
      url: 'https://south-plus.org/read.php?tid-1001.html',
      progress: 0.42,
      updatedAt: dashboardNow - 20 * 60 * 1000,
      nextFloorLabel: '第 36 楼',
    },
    1002: {
      title: '已读完的稍后看',
      url: 'https://south-plus.org/read.php?tid-1002.html',
      progress: 1,
      updatedAt: dashboardNow - 30 * 60 * 1000,
    },
  },
  resources: {
    'cloud|https://pan.baidu.com/s/abc': {
      url: 'https://pan.baidu.com/s/abc',
      type: 'cloud',
      sourceTitle: 'AI 图片资源整理楼',
      sourceUrl: 'https://south-plus.org/read.php?tid-1001.html',
      status: 'todo',
      updatedAt: dashboardNow - 10 * 60 * 1000,
    },
  },
  favoriteSeen: {
    1001: dashboardNow - 60 * 60 * 1000,
    1003: dashboardNow - 2 * 60 * 60 * 1000,
  },
  autoBuyAttempts: {
    failed: { status: 'failed', updatedAt: dashboardNow - 2 * 60 * 60 * 1000 },
  },
  requestState: {
    queueCount: 2,
    cooldownUntil: dashboardNow + 5000,
  },
}, dashboardNow);
assert.equal(dashboardReport.stats.todayViewed, 2);
assert.equal(dashboardReport.stats.favoriteAdded, 3);
assert.equal(dashboardReport.stats.resourceAdded, 1);
assert.equal(dashboardReport.stats.watchBacklog, 1);
assert.equal(dashboardReport.request.status, '冷却中');
assert.equal(dashboardReport.worthReviewing[0].id, '1001');
assert.equal(dashboardReport.worthReviewing[0].resourceCount, 1);
assert.equal(dashboardReport.worthReviewing[0].hasSiteFavorite, true);
assert.match(enhancer.formatForumDashboardDigest(dashboardReport), /值得回看：\n1\. AI 图片资源整理楼/);
const relativeResourceDashboard = enhancer.collectForumDashboardReport({
  resources: {
    'cloud|https://pan.baidu.com/s/relative': {
      url: 'https://pan.baidu.com/s/relative',
      type: 'cloud',
      sourceTitle: '相对来源资源帖',
      sourceUrl: '/read.php?tid-2001.html',
      updatedAt: dashboardNow - 5 * 60 * 1000,
    },
  },
}, dashboardNow);
assert.equal(relativeResourceDashboard.stats.resourceAdded, 1);
assert.equal(relativeResourceDashboard.resources[0].sourceUrl, '/read.php?tid-2001.html');
const commandEntries = enhancer.collectCommandPaletteEntries({
  toolboxConfigs: [
    { show: true, group: '我的中心', text: '源', label: '资源工作台', description: '管理资源', panelId: 'spx-resource-center' },
    { show: true, group: '阅读模式', key: 'nightMode', text: '夜', label: '夜间模式', description: '切换夜间模式' },
  ],
  navigationConfigs: [
    { section: '子栏目', label: 'AI交流', href: 'https://south-plus.org/thread.php?fid-208.html' },
  ],
  watch: {
    1001: { title: 'AI 图片资源整理楼', url: 'https://south-plus.org/read.php?tid-1001.html', savedAt: dashboardNow },
  },
  progress: {
    1001: { title: 'AI 图片资源整理楼', url: 'https://south-plus.org/read.php?tid-1001.html', updatedAt: dashboardNow, progress: 0.5 },
  },
  resources: {
    'cloud|https://pan.baidu.com/s/abc': {
      url: 'https://pan.baidu.com/s/abc',
      type: 'cloud',
      sourceTitle: 'AI 图片资源整理楼',
      status: 'todo',
      updatedAt: dashboardNow,
    },
  },
});
assert.equal(enhancer.normalizeCommandPaletteFilter('bad'), 'all');
assert.equal(enhancer.getCommandPaletteCategoryLabel('resource'), '资源');
assert.ok(commandEntries.some((entry) => entry.title === '资源工作台' && entry.category === 'center'));
assert.ok(commandEntries.some((entry) => entry.title === '夜间模式' && entry.category === 'setting'));
assert.deepEqual(
  enhancer.filterCommandPaletteEntries(commandEntries, { query: '百度', filter: 'resource' }).map((entry) => entry.category),
  ['resource']
);
assert.match(enhancer.formatCommandPaletteResultSummary(commandEntries.slice(0, 2), commandEntries, { filter: 'resource' }), /资源 · 2 \/ \d+ 项/);
assert.match(source, /South Plus 工具箱/);
assert.match(source, /spx-toolbox-action/);
assert.match(source, /spx-command-overlay/);
assert.match(source, /Ctrl\+K/);
assert.match(source, /COMMAND_PALETTE_BUTTON_SELECTOR/);
assert.match(source, /handleCommandCompositionStart/);
assert.match(source, /handleCommandCompositionEnd/);
assert.match(source, /rerenderCommandPaletteAfterSearch/);
assert.match(source, /panel\.spxComposing \|\| event\.isComposing \|\| event\.keyCode === 229/);
assert.match(source, /spx-command-detail-target/);
assert.match(source, /overflow-wrap:anywhere/);
assert.match(source, /bindCommandPaletteKeyboard\(settings, state\)/);
assert.match(source, /var toolbox = null;/);
assert.match(source, /var commandPalette = null;/);
assert.match(source, /getCommandPaletteEntries\(panel, settings, state\)/);
assert.match(source, /panel\.spxSearchTimer = window\.setTimeout/);
assert.match(source, /var pageType = detectPageType\(location\.href\)/);
assert.doesNotMatch(source, /createSettingsPanel\(settings, state\);\n\s+bindCommandPaletteKeyboard/);
assert.match(source, /--spx-page-max:1480px/);
assert.match(source, /--spx-reader-line:clamp\(760px,62vw,960px\)/);
assert.match(source, /getInjectedPreviewParityStyleRules/);
assert.match(source, /min\(1480px, calc\(100vw - 40px\)\)/);
assert.match(source, /setImportantStyle\(node, 'height', '38px'\)/);
assert.match(source, /nightMode: false/);
assert.match(source, /spx-theme-clean/);
assert.match(source, /spx-theme-night/);
assert.match(source, /:root\.spx-theme-night/);
assert.match(source, /夜间模式/);
assert.match(source, /spx-module-nav/);
assert.match(source, /spx-module-nav-ready/);
assert.match(source, /spx-module-nav-host/);
assert.match(source, /spx-module-body/);
assert.match(source, /spx-module-nav-label/);
assert.match(source, /spx-module-nav-section/);
assert.match(source, /NAVIGATION_COLLAPSE_KEY = APP \+ ':navigationCollapse:v1'/);
assert.match(source, /spx-module-nav-section\[aria-expanded="true"\]:before/);
assert.match(source, /spx-module-nav-group\.spx-module-nav-collapsed>\.spx-module-nav-node\{display:none!important;\}/);
assert.match(source, /appendModuleNavigationSection\(groupNode, group\.label, collapseState\)/);
assert.match(source, /--spx-module-width:260px/);
assert.match(source, /--spx-module-item-height:44px/);
assert.match(source, /max-height:calc\(100vh - var\(--spx-module-max-offset\)\)!important/);
assert.match(source, /setProperty\('--spx-module-item-height', navDensity\.itemHeight \+ 'px'\)/);
assert.match(source, /data-choice="moduleNavDensity"/);
assert.match(source, /networkFriendly: true/);
assert.match(source, /select\[data-choice\]/);
assert.match(source, /spx-module-nav-search/);
assert.match(source, /filterModuleNavigation/);
assert.match(source, /spx-module-nav-pin/);
assert.match(source, /NAVIGATION_PIN_KEY = APP \+ ':navigationPins:v1'/);
assert.match(source, /NAVIGATION_REFRESH_KEY = APP \+ ':navigationRefresh:v1'/);
assert.match(source, /网络友好模式/);
assert.match(source, /requestWithPolicy/);
assert.match(source, /normalizeNavigationPinMap/);
assert.match(source, /section: '置顶导航'/);
assert.match(source, /withPinnedModuleNavigationConfigs/);
assert.match(source, /minmax\(196px,var\(--spx-module-width\)\)/);
assert.match(source, /spx-module-nav-group/);
assert.match(source, /spx-module-nav-node/);
assert.match(source, /spx-module-nav-children/);
assert.match(source, /spx-module-nav-parent-title/);
assert.match(source, /spx-module-nav-level-3/);
assert.match(source, /buildModuleNavigationTree/);
assert.match(source, /dedupeModuleNavigationTree/);
assert.match(source, /parentMap/);
assert.match(source, /parentLabel/);
assert.match(source, /pendingModuleNavigationConfigs/);
assert.match(source, /NAVIGATION_KEY/);
assert.match(source, /NAVIGATION_KEY = APP \+ ':navigation:v1'/);
assert.match(source, /NAVIGATION_POOL_LIMIT = 160/);
assert.match(source, /mountModuleNavigation\('导航中心', getAllModuleNavigationConfigs\(\)\)/);
assert.match(source, /section: '站点导航'/);
assert.match(source, /section: '子栏目'/);
assert.match(source, /appendConfig\('当前位置'/);
assert.match(source, /appendConfig\('主题导航'/);
assert.match(source, /navigationOnly: true/);
assert.match(source, /getForumNavigationScopeNodes/);
assert.match(source, /getForumNavigationParentLabel/);
assert.match(source, /isGlobalSiteNavigationTarget/);
assert.match(source, /shouldKeepNavigationLabel/);
assert.match(source, /isForumGalleryModeUrl/);
assert.match(source, /thread_new\.php/);
assert.match(source, /allowForumViewSwitch: true/);
assert.match(source, /transient: true/);
assert.match(source, /section: '版块导航'/);
assert.match(source, /spx-forum-gallery-link/);
assert.match(source, /createEl\('a', 'spx-forum-gallery-link'/);
assert.match(source, /function enhanceForumGallery/);
assert.match(source, /spx-forum-gallery-page/);
assert.match(source, /spx-gallery-card-tools/);
assert.match(source, /ensureForumGalleryCardTools/);
assert.match(source, /introTail\.insertAdjacentElement\('afterend', tools\)/);
assert.match(source, /watchForumGalleryStream/);
assert.match(source, /scheduleForumGalleryToolRepair/);
assert.match(source, /clearForumGalleryResourceBadges/);
assert.match(source, /section-text>span\{float:none!important/);
assert.match(source, /section-title\{[^}]*height:auto!important/);
assert.match(source, /section-intro\{[^}]*position:static!important/);
assert.match(source, /列表模式/);
assert.match(source, /getForumListModeUrl/);
assert.match(source, /getForumGalleryModeUrl/);
assert.match(source, /collectForumViewNavigationConfigs\(scopeNodes\.concat\(listRoot \? \[listRoot\] : \[\]\), currentFid\)/);
assert.match(source, /getCurrentForumViewNavigationConfigs/);
assert.match(source, /collectForumViewNavigationConfigs\(\[document\], getCurrentForumId\(location\.href\)\)/);
assert.match(source, /getReadPageNavigationConfigs/);
assert.match(source, /getPersistentModuleNavigationConfigs/);
assert.match(source, /rememberModuleNavigationConfigs/);
assert.match(source, /scheduleNavigationPoolRefresh/);
assert.match(source, /collectRemoteNavigationConfigsFromHtml/);
assert.match(source, /getAllModuleNavigationConfigs/);
assert.match(source, /normalizeNavigationLabel/);
assert.match(source, /上一主题/);
assert.match(source, /下一主题/);
assert.doesNotMatch(source, /section: '页面操作'/);
assert.doesNotMatch(source, /section: '阅读开关'/);
assert.doesNotMatch(source, /section: '本页筛选'/);
assert.doesNotMatch(source, /section: config\.kind === 'settings' \? '脚本设置' : '我的中心'/);
assert.doesNotMatch(source, /createGlobalNavigationAction/);
assert.match(source, /茶馆/);
assert.match(source, /询问&求物/);
assert.match(source, /免空资源区/);
assert.match(source, /GALGAME汉化区/);
assert.match(source, /AI交流/);
assert.match(source, /最新帖子/);
assert.match(source, /spx-nav-brand/);
assert.match(source, /South Plus \+\+\+/);
assert.match(source, /spx-favorite-nav/);
assert.match(source, /spx-favorite-nav-panel/);
assert.match(source, /我的收藏/);
assert.match(source, /FAVORITE_NAV_BATCH_SIZE = 50/);
assert.match(source, /FAVORITE_NAV_SEEN_KEY = APP \+ ':favoriteNavSeen:v1'/);
assert.match(source, /width:min\(720px,calc\(100vw - 72px\)\)/);
assert.match(source, /parseFavoriteNavEntriesFromDocument/);
assert.match(source, /enhanceFavoriteNavigation\(settings, state, document\)/);
assert.match(source, /spx-favorite-item-title\{[^}]*font-size:14px!important/);
assert.match(source, /spx-favorite-meta\{[^}]*font-size:13px!important/);
assert.match(source, /spx-favorite-nav-panel a\.spx-favorite-item-title/);
assert.match(source, /opacity:1!important;filter:none!important/);
assert.match(source, /#mainNav \.spx-favorite-nav-panel a\.spx-favorite-item-title/);
assert.match(source, /color:#182230!important/);
assert.match(source, /pw_ajax\.php\?action=favor&tid=/);
assert.match(source, /getSiteVerifyHash\(document\)/);
assert.match(source, /&nowtime=/);
assert.match(source, /&verify=/);
assert.match(source, /收藏到站内收藏夹/);
assert.match(source, /syncFavoriteNavAfterSiteFavorite/);
assert.match(source, /updateFavoriteNavTrigger\(wrapper, panelState, state\)/);
assert.match(source, /bumpFavoriteNavTriggerCount\(wrapper, panelState, state\)/);
assert.match(source, /createSiteFavoriteDeleteRequest\(row, pageUrl\)/);
assert.match(source, /delete-selected-favorite-site/);
assert.match(source, /toggle-visible-favorite-site/);
assert.match(source, /spx-favorite-group-actions/);
assert.match(source, /删除所选/);
assert.match(source, /全选本页/);
assert.match(source, /删除收藏/);
assert.match(source, /job', value: 'clear'/);
assert.doesNotMatch(source, /delete-visible-favorite-site/);
assert.doesNotMatch(source, /删除本次显示/);
assert.match(source, /FAVORITE_NAV_COUNT_CACHE_TTL = 2 \* 60 \* 1000/);
assert.match(source, /spx-favorite-nav-count', formatFavoriteNavCount\(Object\.keys\(\(state && state\.watch\) \|\| \{\}\)\.length, false\)/);
assert.match(source, /正在读取站内收藏数量/);
assert.match(source, /显示短期缓存/);
assert.match(source, /shouldRefreshFavoriteNavCountCache\(countCacheSource\)/);
assert.match(source, /var totalCount = siteCount \+ watchCount/);
assert.match(source, /我的收藏已读取/);
assert.match(source, /站内 ' \+ siteCount \+ '，稍后看 ' \+ watchCount/);
assert.match(source, /loadFavoriteNavSiteEntries\(panel, settings, state, wrapper\);/);
assert.match(source, /仅显示本地稍后看 ' \+ watchCount/);
assert.match(source, /bindNativeReadFavoriteSync\(settings, state, tid, originalAuthor\)/);
assert.match(source, /a\[onclick\*="action=favor"\]\[onclick\*="tid"\]/);
assert.match(source, /isNewThreadFavoriteResult\(guideText\)/);
assert.match(source, /spx-preview-popover-actions[\s\S]*收藏/);
assert.match(source, /spx-preview-chip-row/);
assert.match(source, /getThreadPreviewStatusChips/);
assert.match(source, /spx-read-summary-card/);
assert.match(source, /spx-read-summary-card\{[^}]*width:100%;max-width:100%;min-width:0;overflow:hidden/);
assert.match(source, /spx-read-summary-metrics\{[^}]*repeat\(auto-fit,minmax\(168px,1fr\)\)/);
assert.match(source, /createReadThreadSummaryCard\(settings, state, posts, tid, originalAuthor\)/);
assert.match(source, /showBatchConfirmDialog/);
assert.match(source, /confirmBatchAction/);
assert.match(source, /data-action="apply-settings-preset"/);
assert.match(source, /spx-content-center/);
assert.deepEqual(
  enhancer.getThreadPreviewStatusChips(
    { id: 'td_42', title: '百度资源', titleLink: { href: 'https://south-plus.org/read.php?tid-42.html' } },
    { resourceBadges: [{ type: 'baidu', label: '百度', source: 'preview', guessed: false }] },
    { watch: { 42: { title: '百度资源' } }, resources: {} }
  ).map(function mapPreviewChip(chip) { return chip.label; }),
  ['未收藏', '已稍后', '百度']
);
assert.doesNotMatch(source, /createEl\('button', '', '本页屏人'\)/);
assert.match(source, /spx-home-dashboard \.spx-home-module\{[^}]*width:100%!important;max-width:100%!important;min-width:0!important/);
assert.match(source, /spx-home-dashboard \.spx-home-module tr\.tr2\{grid-template-columns:minmax\(360px,620px\) 96px minmax\(180px,260px\)!important;justify-content:start!important;\}/);
assert.match(source, /spx-home-dashboard \.spx-home-module tr\.tr2>td:last-child,\.spx-home-dashboard \.spx-home-module tr\.tr3>td:last-child\{display:none!important;\}/);
assert.match(source, /spx-home-dashboard \.spx-home-module tr\.tr3>td,\.spx-home-dashboard \.spx-home-module tr\.tr3>th/);
assert.match(source, /spx-module-nav-host \.t\.spx-thread-list-table table[^}]*display:block!important/);
assert.match(source, /setThreadRowHiddenClass\(row, 'spx-thread-row-hidden', isDecorativeThreadRow\)/);
assert.match(source, /spx-module-nav-host \.t\.spx-thread-list-table tr\.tr3>td[^}]*padding:0!important/);
assert.match(source, /spx-module-nav-host \.t\.spx-thread-list-table tr\.tr3>td:first-child:not\(\[id\^="td_"\]\)/);
assert.match(source, /spx-forum-section-title/);
assert.match(source, /spx-forum-prelude-hidden/);
assert.match(source, /spx-thread-row-hidden/);
assert.match(source, /spx-thread-list-table tr:not\(\.tr2\):not\(\.tr3\)/);
assert.match(source, /spx-thread-list-table tr\.tr3:not\(:hover\) \.spx-thread-tools/);
assert.doesNotMatch(source, /function createHomeQuickLinks/);
assert.doesNotMatch(source, /label: '已关注'[\s\S]*?alwaysShow: true/);
assert.doesNotMatch(source, /资源关键词/);
assert.match(source, /#mainNav[^}]*height:38px!important/);
assert.match(source, /spx-toolbar\{right:16px!important;bottom:18px!important;display:flex!important;flex-direction:row!important/);
assert.match(source, /spx-toolbox-action[^}]*min-height:42px!important/);
assert.match(source, /spx-theme-night\.spx-home-dashboard #notice/);
assert.match(source, /spx-theme-night\.spx-home-dashboard \.spx-home-module[^}]*background:#181d1a!important/);
assert.match(source, /spx-theme-night\.spx-forum-dashboard \.spx-module-nav-host \.t[^}]*background:#181d1a!important/);
assert.match(source, /spx-theme-night\.spx-forum-dashboard #content \.t\.spx-thread-list-table tr\.tr3>td/);
assert.match(source, /@media\(max-width:900px\).*spx-module-nav\{position:static!important;display:flex!important;flex-direction:row!important/);
assert.match(source, /spx-thread-list-table/);
assert.doesNotMatch(source, /\.spx-forum-dashboard #content \.t tr\.tr3\{display:grid/);
assert.match(source, /\.spx-immersive-read \.tpc_content\{box-sizing:border-box!important;max-width:var\(--spx-reader-line\)!important/);
assert.match(source, /\.spx-post-body-split \.tpc_content[^}]*max-width:var\(--spx-reader-line\)!important/);
assert.match(source, /spx-settings-section/);
assert.match(source, /spx-settings-footer/);
assert.match(source, /spx-action-primary/);
assert.match(source, /#spx-resource-center\{width:min\(720px,calc\(100vw - 96px\)\)/);
assert.match(source, /bottom:calc\(58px \+ env\(safe-area-inset-bottom,0px\)\)!important/);
assert.match(source, /data-spx-settings-button/);
assert.match(source, /setSettingsPanelHidden\(settingsPanel, !settingsPanel.hidden, SETTINGS_BUTTON_SELECTOR\)/);
assert.match(source, /var currentToolbox = getToolbox\(\)/);
assert.match(source, /var nextToolboxHidden = !currentToolbox.hidden/);
assert.match(source, /\.spx-reader \.tpc_content\{[^}]*font-size:16px!important;line-height:1\.78!important/);
assert.match(source, /\.spx-reader \.tpc_content #read_tpc,\.spx-reader \.tpc_content>\.f14\{font-size:16px!important;line-height:1\.78!important;\}/);
assert.match(source, /\.spx-reader \.tpc_content br\{line-height:1\.75!important;\}/);
assert.match(source, /\.spx-compact-read:not\(\.spx-reader\) \.tpc_content\{font-size:15px;line-height:1\.7/);
assert.match(source, /immersiveFontSize: 16/);
assert.match(source, /settings\.immersiveFontSize = 16/);
assert.match(source, /\.spx-immersive-read \.tpc_content\{[^}]*font-size:16px!important;line-height:1\.78!important/);
assert.match(source, /\.spx-immersive-read \.tpc_content #read_tpc,\.spx-immersive-read \.tpc_content>\.f14\{font-size:16px!important;line-height:1\.78!important;\}/);
assert.match(source, /setProperty\('--spx-immersive-font-size', '16px'\)/);
assert.match(source, /隐藏广告/);
assert.match(source, /首页模块全屏/);
assert.match(source, /spx-storage-usage/);
assert.match(source, /show-storage-usage/);
assert.match(source, /本地数据体积/);
assert.match(source, /本地体积/);
assert.match(source, /\.spx-settings \.spx-row\{display:flex;flex-wrap:wrap/);
assert.match(source, /加载更多图片/);
assert.match(source, /spx-preview-load-more/);
assert.match(source, /spx-preview-drawer/);
assert.match(source, /spx-preview-panel spx-preview-drawer spx-preview-collapsed/);
assert.match(source, /spx-preview-masonry/);
assert.match(source, /spx-preview-lightbox-strip/);
assert.match(source, /requestIdleCallback/);
assert.match(source, /function scanPreviewImages\(\)/);
assert.match(source, /link\.dataset\.spxPreviewIndex = String\(index\)/);
assert.match(source, /grid\.addEventListener\('click', function handlePreviewGridClick/);
assert.match(source, /grid\.addEventListener\('mouseover', function handlePreviewGridHover/);
assert.match(source, /strip\.addEventListener\('click', function handleLightboxThumbClick/);
assert.match(source, /panel\.spxCleanup = function cleanupPreviewPanel/);
assert.match(source, /cancelIdlePreviewScan\(\);\n\s+cancelPreviewDownload\(\);/);
assert.match(source, /function preparePreviewImageReveal\(image\)/);
assert.match(source, /data-spx-preview-ready="0"/);
assert.match(source, /markPreviewImageLoaded\(thumb\)/);
assert.match(source, /markPreviewImageLoaded\(image\);\n\s+applyImageSize\(\);/);
assert.match(source, /THREAD_PREVIEW_HOVER_DELAY = 520/);
assert.match(source, /function getThreadPreviewHoverDelay\(settings\)/);
assert.match(source, /cached \? Math\.min\(120, getThreadPreviewHoverDelay\(settings\)\) : getThreadPreviewHoverDelay\(settings\)/);
assert.match(source, /image\.dataset\.spxPreviewLazySrc = url/);
assert.match(source, /function scheduleThreadPreviewPanelImages\(panel\)/);
assert.match(source, /loadThreadPreviewPanelImages\(panel, THREAD_PREVIEW_IMAGE_BATCH_SIZE\)/);
assert.match(source, /var previewAbortController = null/);
assert.match(source, /requestOptions\.signal = requestController\.signal/);
assert.match(source, /previewAbortController\.abort\(\)/);
assert.match(source, /error && error\.name === 'AbortError'/);
assert.match(source, /spx-preview-header\{[^}]*position:sticky!important;top:0!important;z-index:3!important;[^}]*background:inherit!important/);
assert.match(source, /spx-preview-collapsed \.spx-preview-header,\.spx-preview-panel\.spx-preview-drawer\.spx-preview-collapsed \.spx-preview-download/);
assert.match(source, /按楼层复制/);
assert.match(source, /复制Markdown/);
assert.match(source, /资源工作台/);
assert.doesNotMatch(source, /资源中心/);
assert.match(source, /select-visible-resources/);
assert.match(source, /spx-watch-controls\{display:flex;align-items:center;flex-wrap:wrap/);
assert.match(source, /compositionstart/);
assert.match(source, /compositionend/);
assert.match(source, /event\.isComposing/);
assert.match(source, /THREAD_ROW_HIDDEN_CLASSES/);
assert.match(source, /setThreadRowHiddenClass\(item\.row, 'spx-filter-hidden', textHidden\)/);
assert.match(source, /setThreadRowHiddenClass\(item\.row, 'spx-resource-filter-hidden', resourceHidden\)/);
assert.equal(enhancer.matchesForumFilter({ title: '普通标题', author: 'bob', resourceBadges: [{ type: 'quark', label: '夸克' }] }, '夸克'), true);
assert.match(source, /setThreadRowHiddenClass\(info\.row, 'spx-hidden-rule', matchesBlockRules\(info, settings\)\)/);
assert.match(source, /spx-thread-list-table tr\.spx-filter-hidden/);
assert.match(source, /shouldUseModuleNavigation\(settings, location\.href, document\)/);
assert.match(source, /getSearchPageNavigationConfigs/);
assert.match(source, /getProfilePageNavigationConfigs/);
assert.match(source, /isModuleNavigationConfigActive\(item, location\.href\)/);
assert.match(source, /spx-search-page #main\.spx-module-nav-host/);
assert.match(source, /spx-profile-page #main\.spx-module-nav-host/);
assert.match(source, /spx-module-nav-ready\.spx-search-page \.spx-module-body>\.bdbA/);
assert.match(source, /spx-module-nav-ready\.spx-profile-page \.spx-module-body>\.bdbA/);
assert.match(source, /spx-module-nav-ready\.spx-profile-page \.spx-module-body>#spx-account-tabs/);
assert.match(source, /spx-module-nav-ready\.spx-reader \.spx-module-body>\.bdbA/);
assert.match(source, /spx-module-nav-ready\.spx-reader \.spx-module-body #breadcrumbs/);
assert.match(source, /spx-module-nav-ready\.spx-reader \.spx-module-body table\.js-post/);
assert.match(source, /spx-module-nav-ready\.spx-reader \.spx-module-body \.spx-post-tools/);
assert.match(source, /spx-search-page \.spx-module-body input\[type="search"\]/);
assert.match(source, /input\.spx-module-nav-search\{[^}]*min-width:0!important;max-width:100%!important/);
assert.match(source, /className: 'spx-module-nav-search-page'/);
assert.doesNotMatch(source, /className: 'spx-module-nav-search'/);
assert.match(source, /spx-module-nav-ready\.spx-search-page \.spx-module-body form\{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important/);
assert.match(source, /spx-module-nav-ready\.spx-search-page \.spx-module-body form>\.t,[^{}]*form \.t\{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;margin-left:0!important;margin-right:0!important/);
assert.match(source, /spx-module-nav-ready\.spx-search-page \.spx-module-body table,[^{}]*\{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;table-layout:fixed!important/);
assert.doesNotMatch(source, /spx-clean #infobox/);
assert.doesNotMatch(source, /spx-immersive-read #[^{}']*infobox[^{}']*\{display:none!important/);
assert.match(source, /spx-module-nav-ready\.spx-home-dashboard \.spx-module-body #spx-home-grid/);
assert.match(source, /spx-module-nav-ready\.spx-home-dashboard \.spx-module-body \.spx-home-module/);
assert.match(source, /spx-task-page #main\{display:block!important;width:calc\(100vw - 40px\)!important/);
assert.doesNotMatch(source, /spx-task-page #main\{display:grid!important;grid-template-columns:minmax\(0,1fr\) minmax\(280px,360px\)!important/);
assert.match(source, /spx-task-page #main>\.t,\.spx-task-page #main>\.t3,\.spx-task-page #main>\.t5/);
assert.match(source, /getTaskPageNavigationConfigs/);
assert.match(source, /spx-module-nav-task/);
assert.match(source, /spx-module-nav-ready\.spx-task-page #main\.spx-module-nav-host/);
assert.match(source, /spx-module-nav-ready\.spx-task-page #main\.spx-module-nav-host>\.spx-module-body/);
assert.match(source, /spx-module-nav-ready\.spx-task-page #main\.spx-module-nav-host>\.spx-module-body[^}]*display:block!important/);
assert.match(source, /spx-module-nav-ready\.spx-task-page \.spx-module-body>\.t,\.spx-module-nav-ready\.spx-task-page \.spx-module-body>\.t3/);
assert.match(source, /function enhanceTaskPageLayout/);
assert.match(source, /任务时效\|上次领取\|奖励\\s\*\[:：\]/);
assert.match(source, /spx-task-side-stack/);
assert.match(source, /spx-task-main-stack/);
assert.match(source, /spx-task-side-stack:empty/);
assert.match(source, /getTaskLayoutCandidateNodes/);
assert.match(source, /qsa\('\.fl,\.fr,\.t,\.t3,\.t5', host\)/);
assert.match(source, /getTaskLayoutDirectChild\(host, anchorItem\)/);
assert.match(source, /node\.contains\(other\)/);
assert.match(source, /spx-task-main-stack table/);
assert.match(source, /spx-module-body\.spx-task-layout-body[^}]*display:grid!important;grid-template-columns:minmax\(240px,320px\) minmax\(0,1fr\)!important/);
assert.match(source, /我的主题/);
assert.match(source, /我的回复/);
assert.match(source, /个人首页/);
assert.match(source, /收藏/);
assert.match(source, /好友/);
assert.match(source, /商品/);
assert.match(source, /消息/);
assert.match(source, /设置/);
assert.match(source, /setImportantStyle\(post, 'width', '100%'\)/);
assert.doesNotMatch(source, /setImportantStyle\(post, 'width', 'min\(1680px, calc\(100vw - 64px\)\)'\)/);
assert.match(source, /spx-theme-night \.spx-preview-popover \.spx-preview-text/);
assert.match(source, /spx-preview-popover-actions/);
assert.match(source, /THREAD_PREVIEW_FAILURE_TTL = 3 \* 60 \* 1000/);
assert.match(source, /THREAD_PREVIEW_IMAGE_LIMIT = 6/);
const emptyRoot = { querySelector: function querySelector() { return null; }, querySelectorAll: function querySelectorAll() { return []; } };
const threadListRoot = {
  querySelectorAll: function querySelectorAll(selector) {
    if (selector !== 'td[id^="td_"]') return [];
    return [{
      id: 'td_123',
      querySelector: function querySelector(innerSelector) {
        return innerSelector === 'a[id^="a_ajax_"]' ? {} : null;
      },
    }];
  },
};
const galleryRoot = {
  querySelector: function querySelector() { return null; },
  querySelectorAll: function querySelectorAll(selector) {
    if (selector === '#wall .stream li a[href*="read.php?tid"]') {
      return [{
        href: 'https://south-plus.org/read.php?tid-2936811.html',
        getAttribute: function getAttribute() { return './read.php?tid-2936811.html'; },
      }];
    }
    return [];
  },
};
assert.equal(enhancer.shouldUseForumDashboard('https://south-plus.org/thread.php?fid-9.html', emptyRoot), false);
assert.equal(enhancer.shouldUseForumDashboard('https://south-plus.org/thread.php?fid-9.html', threadListRoot), true);
assert.equal(enhancer.shouldUseForumDashboard('https://south-plus.org/thread_new.php?fid-9-page-1.html', galleryRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/search.php', emptyRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/search2.php?orderway-postdate-asc-desc-newatc-1.html', emptyRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/u.php?action-topic-uid-1.html', emptyRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/u.php?action-post-uid-1.html', emptyRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/u.php?uid-1.html', emptyRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/u.php?action-show-uid-1.html', emptyRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/u.php?action-favor-uid-1.html', emptyRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/u.php?action-friend-uid-1.html', emptyRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/u.php?action-trade-uid-1.html', emptyRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/message.php', emptyRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/profile.php', emptyRoot), true);
assert.equal(enhancer.getModuleNavigationGroupKey(' 子栏目 '), '子栏目');
assert.deepEqual(enhancer.normalizeNavigationCollapseState({ ' 子栏目 ': true, '站点导航': false, '': true }), { '子栏目': true });
assert.equal(enhancer.isModuleNavigationGroupCollapsed({ '子栏目': true }, ' 子栏目 '), true);
assert.equal(enhancer.isModuleNavigationGroupCollapsed({ '子栏目': true }, '站点导航'), false);
assert.equal(enhancer.shouldUseTaskPage('https://south-plus.org/hack.php?H_name=tasks'), true);
assert.equal(enhancer.shouldUseTaskPage('https://south-plus.org/hack.php?H_name-tasks.html'), true);
assert.equal(enhancer.shouldUseTaskPage('https://south-plus.org/plugin.php?H_name-tasks.html'), true);
assert.equal(enhancer.shouldUseTaskPage('https://south-plus.org/plugin.php?H_name=tasks'), true);
assert.equal(enhancer.shouldUseTaskPage('https://south-plus.org/hack.php?H_name=bank'), false);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/hack.php?H_name=tasks', emptyRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/plugin.php?H_name-tasks.html', emptyRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/index.php', emptyRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/thread.php?fid-9.html', threadListRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/thread.php?fid-9.html', emptyRoot), false);
assert.equal(enhancer.detectPageType('https://south-plus.org/thread_new.php?fid-9-page-1.html'), 'forum');
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/thread_new.php?fid-9-page-1.html', threadListRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/thread_new.php?fid-9-page-1.html', galleryRoot), true);
assert.equal(enhancer.shouldUseModuleNavigation(defaultSettings, 'https://south-plus.org/read.php?tid=1', emptyRoot), true);
assert.equal(enhancer.getCurrentForumId('https://south-plus.org/thread.php?fid-9-page-2.html'), '9');
assert.equal(enhancer.getCurrentForumId('https://south-plus.org/thread_new.php?fid-9-page-1.html'), '9');
assert.equal(enhancer.isForumGalleryModeUrl('https://south-plus.org/thread_new.php?fid-9-page-1.html'), true);
assert.equal(enhancer.isForumGalleryModeUrl('https://south-plus.org/thread.php?fid-9.html'), false);
assert.equal(enhancer.buildPageUrl('https://south-plus.org/thread_new.php?fid-9-page-1.html', 2), 'https://south-plus.org/thread_new.php?fid-9-page-2.html');
assert.equal(enhancer.buildPageUrl('https://south-plus.org/thread.php?fid-9-page-2.html', 1), 'https://south-plus.org/thread.php?fid-9.html');
assert.equal(enhancer.getForumListModeUrl('https://south-plus.org/thread_new.php?fid-9-page-2.html'), 'https://south-plus.org/thread.php?fid-9-page-2.html');
assert.equal(enhancer.getForumGalleryModeUrl('https://south-plus.org/thread.php?fid-9-page-2.html'), 'https://south-plus.org/thread_new.php?fid-9-page-2.html');
assert.equal(
  enhancer.isForumGalleryModeLink({ textContent: '[点击进入图墙模式]', getAttribute: function getAttribute() { return 'thread_new.php?fid-9-page-1.html'; } }, '9'),
  true
);
assert.equal(
  enhancer.isForumGalleryModeLink({ textContent: '[点击进入图墙模式]', getAttribute: function getAttribute() { return 'thread_new.php?fid-48-page-1.html'; } }, '9'),
  false
);
assert.equal(
  enhancer.isForumGalleryModeLink({ textContent: 'Soulplus', getAttribute: function getAttribute() { return '/thread.php?fid-9-skinco-colorImagination.html'; } }, '9'),
  false
);
assert.equal(
  enhancer.isModuleNavigationConfigActive(
    { href: 'https://south-plus.org/thread.php?fid-9.html' },
    'https://south-plus.org/thread.php?fid-9-page-2.html'
  ),
  true
);
assert.equal(
  enhancer.isModuleNavigationConfigActive(
    { href: 'https://south-plus.org/thread.php?fid-13.html' },
    'https://south-plus.org/thread.php?fid-9-page-2.html'
  ),
  false
);
assert.equal(
  enhancer.isModuleNavigationConfigActive(
    { href: 'https://south-plus.org/thread_new.php?fid-9-page-1.html' },
    'https://south-plus.org/thread.php?fid-9.html'
  ),
  false
);
assert.equal(
  enhancer.isModuleNavigationConfigActive(
    { href: 'https://south-plus.org/thread_new.php?fid-9-page-1.html' },
    'https://south-plus.org/thread_new.php?fid-9-page-2.html'
  ),
  true
);
assert.equal(
  enhancer.isModuleNavigationConfigActive(
    { href: 'https://south-plus.org/index.php#spx-module-target-home-1' },
    'https://south-plus.org/index.php'
  ),
  false
);
assert.equal(
  enhancer.isModuleNavigationConfigActive(
    { href: 'https://south-plus.org/index.php#spx-module-target-home-1' },
    'https://south-plus.org/index.php#spx-module-target-home-1'
  ),
  true
);
function makeClassList(names) {
  return {
    contains: function contains(name) {
      return names.indexOf(name) !== -1;
    },
  };
}
assert.equal(enhancer.hasThreadRowHiddenClass({ classList: makeClassList(['spx-filter-hidden']) }), true);
assert.equal(enhancer.isVisibleThreadRow({ offsetParent: {}, classList: makeClassList(['spx-hidden-rule']) }), false);
assert.equal(enhancer.isVisibleThreadRow({ offsetParent: {}, classList: makeClassList([]) }), true);
assert.equal(enhancer.isVisibleThreadRow({ offsetParent: null, classList: makeClassList([]) }), false);
assert.equal(enhancer.getSettingsPanelKeys('https://south-plus.org/index.php').includes('adBlock'), false);
assert.equal(enhancer.getSettingsPanelKeys('https://south-plus.org/index.php').includes('homeDashboard'), false);
assert.ok(enhancer.getSettingsPanelKeys('https://south-plus.org/index.php').includes('nightMode'));
assert.ok(enhancer.getSettingsPanelKeys('https://south-plus.org/index.php').includes('networkFriendly'));
assert.ok(enhancer.getSettingsPanelKeys('https://south-plus.org/thread.php?fid-9.html').includes('autoBuyPost'));
assert.ok(enhancer.getSettingsPanelKeys('https://south-plus.org/read.php?tid=1', emptyRoot).includes('autoBuyPost'));
assert.match(source, /data-number="autoBuyMaxSp"/);

assert.equal(enhancer.isNetworkFriendlyMode({ networkFriendly: false }), false);
assert.equal(enhancer.isNetworkFriendlyMode({ networkFriendly: true }), true);
assert.equal(enhancer.getScriptRequestPolicyConfig({ mode: 'background' }).minDelay, 1500);
assert.equal(enhancer.getScriptRequestPolicyConfig({ mode: 'action' }).priority, 30);
assert.equal(enhancer.getScriptRequestPolicyConfig({ mode: 'preview', networkFriendly: false }).minDelay, 500);
assert.equal(enhancer.isScriptRateLimitStatus(520), true);
assert.equal(enhancer.isScriptRateLimitStatus(504), true);
assert.equal(enhancer.isScriptRateLimitStatus(200), false);
assert.equal(enhancer.isScriptRateLimitHtml('<title>520 Web server is returning an unknown error</title>'), true);
assert.equal(enhancer.isScriptRateLimitHtml('<html>1秒内操作频繁</html>'), true);
assert.equal(enhancer.isScriptRateLimitHtml('<main>正常帖子</main>'), false);
assert.equal(
  enhancer.getScriptRequestDelay({ mode: 'preview', minDelay: 1200 }, { lastStartedAt: 1000, cooldownUntil: 0 }, 1500),
  700
);
assert.equal(
  enhancer.getScriptRequestDelay({ mode: 'background', minDelay: 1000 }, { lastStartedAt: 0, cooldownUntil: 3000 }, 2000),
  1000
);
assert.equal(
  enhancer.getNavigationRefreshKey(['https://south-plus.org/thread.php?fid-9.html#top', 'https://south-plus.org/index.php']),
  'https://south-plus.org/thread.php?fid-9.html|https://south-plus.org/index.php'
);
assert.equal(
  enhancer.getThreadPreviewMetaText({ author: 'alice' }, { cached: true }),
  '作者：alice · 已缓存'
);
assert.equal(
  enhancer.getThreadPreviewMetaText({}, { status: '加载失败' }),
  '加载失败'
);
assert.deepEqual(
  enhancer.getThreadPreviewImageUrls({ images: ['1', '2', '3', '4', '5', '6', '7'] }),
  ['1', '2', '3', '4', '5', '6']
);
assert.equal(enhancer.getThreadPreviewImageSummary({ images: [] }), '没有可预览图片');
assert.equal(enhancer.getThreadPreviewImageSummary({ images: ['1', '2'] }), '共 2 张预览图');
assert.equal(
  enhancer.getThreadPreviewImageSummary({ images: ['1', '2', '3', '4', '5', '6', '7', '8'] }),
  '已显示前 6 张，打开帖子查看其余 2 张'
);
assert.equal(enhancer.getThreadPreviewHoverDelay({ networkFriendly: true }), 520);
assert.equal(enhancer.getThreadPreviewHoverDelay({ networkFriendly: false }), 260);

assert.equal(enhancer.parsePostPrice('本帖售价：5 SP币'), 5);
assert.equal(enhancer.parsePostPrice('购买需要 12.5 SP'), 12.5);
assert.equal(enhancer.parsePostPrice('此帖售价 1 SP币,已有 306 人购买'), 1);
assert.equal(enhancer.parsePostPrice('普通帖子内容'), null);

assert.equal(enhancer.parseUserSpBalance('当前拥有 30 SP币'), 30);
assert.equal(enhancer.parseUserSpBalance('SP余额：8.5'), 8.5);
assert.equal(enhancer.parseUserSpBalance('SP币: 34'), 34);
assert.equal(enhancer.parseUserSpBalance('本帖售价：5 SP币'), null);

assert.deepEqual(
  enhancer.getResourceBadgeTypes(enhancer.inferResourceBadgesFromText('[合集] 百度 / 夸克双盘 解压码')),
  ['baidu', 'quark', 'archive']
);
assert.deepEqual(
  enhancer.getResourceBadgeTypes(enhancer.inferResourceBadgesFromText('PikPak 分流 另附镜像外链')),
  ['pikpak', 'external']
);
assert.equal(
  enhancer.getResourceBadgeFromResourceItem({ type: 'cloud', provider: '百度网盘', url: 'https://pan.baidu.com/s/abc' }).type,
  'baidu'
);
const badgeIndex = enhancer.getThreadResourceBadgeIndex({
  baidu: {
    url: 'https://pan.baidu.com/s/abc',
    type: 'cloud',
    provider: '百度网盘',
    sourceUrl: 'https://south-plus.org/read.php?tid=2904409',
    sourceTitle: '百度资源',
  },
  magnet: {
    url: 'magnet:?xt=urn:btih:abcdef',
    type: 'magnet',
    sourceUrl: 'https://south-plus.org/read.php?tid-2904409.html',
    sourceTitle: '磁力资源',
  },
});
assert.deepEqual(
  enhancer.getResourceBadgeTypes(enhancer.getThreadResourceBadges({ id: '2904409', title: '夸克备份' }, badgeIndex)),
  ['baidu', 'quark', 'magnet']
);
assert.match(source, /spx-resource-badge-guess/);
assert.match(source, /setThreadRowHiddenClass\(item\.row, 'spx-resource-filter-hidden', resourceHidden\)/);
assert.match(source, /function createReadResourceRail\(posts, state\)/);
assert.match(source, /spx-read-resource-rail/);
assert.match(source, /spx-read-resource-launcher/);
assert.match(source, /function setRailAction\(button, action, key, status\)/);
assert.match(source, /rail\.spxVisibleEntries = visibleEntries/);
assert.match(source, /rail\.addEventListener\('click', handleReadResourceRailClick\)/);
assert.match(source, /setRailAction\(copyAllButton, 'copy-all'\)/);
assert.doesNotMatch(source, /jumpButton\.addEventListener\('click', function jumpToEntryFloor/);
assert.match(source, /copyReadResourceRailCodes/);
assert.match(source, /bottom:calc\(104px \+ env\(safe-area-inset-bottom,0px\)\)/);
assert.match(source, /createReadResourceRail\(posts, state\)/);
assert.match(source, /#spx-resource-center,#spx-read-resource-rail/);

assert.equal(enhancer.clampPreviewZoom(0.1), 0.5);
assert.equal(enhancer.clampPreviewZoom(1.75), 1.75);
assert.equal(enhancer.clampPreviewZoom(8), 4);

assert.equal(enhancer.getPreviewLightboxKeyAction({ key: 'Escape' }), 'close');
assert.equal(enhancer.getPreviewLightboxKeyAction({ key: 'ArrowLeft' }), 'previous');
assert.equal(enhancer.getPreviewLightboxKeyAction({ key: 'ArrowRight' }), 'next');
assert.equal(enhancer.getPreviewLightboxKeyAction({ key: '+' }), 'zoomIn');
assert.equal(enhancer.getPreviewLightboxKeyAction({ key: '=' }), 'zoomIn');
assert.equal(enhancer.getPreviewLightboxKeyAction({ key: '-' }), 'zoomOut');
assert.equal(enhancer.getPreviewLightboxKeyAction({ key: '0' }), 'zoomReset');
assert.equal(enhancer.getPreviewLightboxKeyAction({ key: 'ArrowRight', ctrlKey: true }), '');
assert.equal(enhancer.getPreviewLightboxKeyAction({ key: 'Enter' }), '');

assert.equal(enhancer.isLargePreviewImage({ src: 'big.jpg', naturalWidth: 640, naturalHeight: 360 }), true);
assert.equal(enhancer.isLargePreviewImage({ src: 'tall.jpg', naturalWidth: 360, naturalHeight: 720 }), true);
assert.equal(enhancer.isLargePreviewImage({ src: 'small.jpg', width: 320, height: 240 }), false);
assert.equal(enhancer.isLargePreviewImage({ src: 'unknown.jpg' }), true);
assert.equal(
  enhancer.formatPreviewImageLinks([
    { src: 'https://south-plus.org/a.jpg' },
    { src: 'https://south-plus.org/a.jpg' },
    { node: { src: 'https://south-plus.org/b.jpg' } },
    { src: '' },
  ]),
  'https://south-plus.org/a.jpg\nhttps://south-plus.org/b.jpg'
);
assert.equal(
  enhancer.getPreviewImageMetaText({ floorLabel: 'B2F', author: 'alice' }, 1),
  '图 2 · B2F · alice'
);
assert.equal(
  enhancer.formatPreviewImageMarkdownLinks([
    { src: 'https://south-plus.org/a.jpg', floorLabel: '楼主', author: 'bob' },
    { src: 'https://south-plus.org/a.jpg', floorLabel: '楼主', author: 'bob' },
    { src: 'https://south-plus.org/b.jpg', floorLabel: 'B2F', author: 'alice' },
  ]),
  '- ![图 1 · 楼主 · bob](https://south-plus.org/a.jpg)\n- ![图 3 · B2F · alice](https://south-plus.org/b.jpg)'
);
assert.equal(
  enhancer.formatPreviewImageLinksByFloor([
    { src: 'https://south-plus.org/a.jpg', floorLabel: '楼主', author: 'bob' },
    { src: 'https://south-plus.org/b.jpg', floorLabel: 'B2F', author: 'alice' },
    { src: 'https://south-plus.org/c.jpg', floorLabel: 'B2F', author: 'alice' },
  ]),
  '[楼主 · bob]\n#1 https://south-plus.org/a.jpg\n\n[B2F · alice]\n#2 https://south-plus.org/b.jpg\n#3 https://south-plus.org/c.jpg'
);
assert.deepEqual(
  enhancer.getPreviewGalleryRenderState(100, 36, 36),
  { total: 100, rendered: 36, hasMore: true, nextLimit: 72 }
);
assert.deepEqual(
  enhancer.getPreviewGalleryRenderState(40, 72, 36),
  { total: 40, rendered: 40, hasMore: false, nextLimit: 40 }
);
assert.equal(
  enhancer.formatPreviewGallerySummary(100, 100, 36, false),
  '已显示 36 / 当前页 100 张，点击进入灯箱'
);
assert.equal(
  enhancer.formatPreviewGallerySummary(100, 50, 36, true),
  '大图已显示 36 / 50（当前页 100 张），点击进入灯箱'
);
assert.equal(enhancer.formatPreviewImageArchiveFileName(new Date('2026-08-13T14:09:00').getTime()), 'southplus-images-20260813-1409.zip');
assert.equal(enhancer.getPreviewImageDownloadExtension('https://img.example.com/a.webp?x=1', ''), '.webp');
assert.equal(enhancer.getPreviewImageDownloadExtension('https://img.example.com/a', 'image/png'), '.png');
assert.equal(enhancer.sanitizePreviewDownloadName('楼主 / alice:*?'), '楼主-alice');
assert.equal(
  enhancer.formatPreviewImageDownloadFileName({ src: 'https://img.example.com/a.jpeg', floorLabel: '楼主', author: 'alice' }, 0, ''),
  '001-楼主-alice.jpg'
);
assert.equal(
  enhancer.getPreviewDownloadStatusSummary({ total: 12, done: 10, failed: 2, active: 0, queued: 0 }),
  '已完成 10 / 12 · 2 张失败可跳过'
);
assert.match(
  enhancer.formatPreviewDownloadReport([{ index: 1, src: 'https://img.example.com/fail.jpg', status: 'failed', attempts: 6, error: '网络或跨域限制', item: { floorLabel: 'B2F', author: 'bob' } }]),
  /失败图片：1 张[\s\S]*重试：6 \/ 6[\s\S]*网络或跨域限制/
);
assert.equal(enhancer.getZipCrc32(new Uint8Array([97, 98, 99])).toString(16), '352441c2');
assert.match(source, /PREVIEW_DOWNLOAD_MAX_RETRIES = 6/);
assert.match(source, /spx-preview-download/);
assert.match(source, /下载全部/);
assert.match(source, /打包已完成/);
assert.match(source, /download-report\.txt/);

assert.equal(enhancer.normalizeResourceUrl('pan.baidu.com/s/abc?pwd=1234'), 'https://pan.baidu.com/s/abc?pwd=1234');
assert.equal(enhancer.normalizeResourceUrl('pan.quark.cn/s/abc'), 'https://pan.quark.cn/s/abc');
assert.equal(
  enhancer.normalizeResourceUrl(
    '/link.php?url=https%3A%2F%2Fpan.baidu.com%2Fs%2Fabc%3Fpwd%3D1234',
    'https://south-plus.org/read.php?tid=99'
  ),
  'https://pan.baidu.com/s/abc?pwd=1234'
);
assert.equal(enhancer.classifyResourceLink('magnet:?xt=urn:btih:ABC123'), 'magnet');
assert.equal(enhancer.classifyResourceLink('ed2k://|file|demo.zip|12345|ABCDEF|/'), 'ed2k');
assert.equal(enhancer.classifyResourceLink('https://example.com/file.torrent'), 'torrent');
assert.equal(enhancer.classifyResourceLink('https://example.com/file.rar'), 'archive');
assert.equal(enhancer.classifyResourceLink('https://pan.baidu.com/s/abc?pwd=1234'), 'cloud');
assert.equal(enhancer.classifyResourceLink('https://img.example.com/a.jpg'), 'image');
assert.equal(enhancer.classifyResourceLink('https://south-plus.org/read.php?tid=1'), 'external');
assert.equal(enhancer.getCloudProviderLabel('https://pan.baidu.com/s/abc'), '百度网盘');
assert.equal(enhancer.getCloudProviderLabel('https://pan.quark.cn/s/abc'), '夸克网盘');

const resourceLinks = enhancer.extractResourceLinksFromText(
  '磁力 magnet:?xt=urn:btih:ABC123 网盘 pan.baidu.com/s/abc?pwd=1234 图片 https://img.example.com/a.jpg 详情 https://south-plus.org/read.php?tid=1',
  'https://south-plus.org/read.php?tid=99',
  { floorLabel: 'B2F', author: 'alice', postIndex: 2 }
);
assert.deepEqual(
  resourceLinks.map(function mapResource(item) {
    return [item.type, item.url, item.floorLabel, item.author, item.postIndex];
  }),
  [
    ['magnet', 'magnet:?xt=urn:btih:ABC123', 'B2F', 'alice', 2],
    ['cloud', 'https://pan.baidu.com/s/abc?pwd=1234', 'B2F', 'alice', 2],
    ['image', 'https://img.example.com/a.jpg', 'B2F', 'alice', 2],
    ['external', 'https://south-plus.org/read.php?tid=1', 'B2F', 'alice', 2],
  ]
);
assert.deepEqual(
  enhancer.filterResourceLinks(resourceLinks, { scope: 'floor', postIndex: 2, category: 'cloud' }).map(function mapResource(item) {
    return item.url;
  }),
  ['https://pan.baidu.com/s/abc?pwd=1234']
);
assert.equal(
  enhancer.formatResourceLinks(enhancer.filterResourceLinks(resourceLinks, { category: 'magnet' })),
  '[磁力] B2F alice magnet:?xt=urn:btih:ABC123'
);

const jumpedResources = enhancer.extractResourceLinksFromText(
  '购买后跳转 https://south-plus.org/link.php?url=https%3A%2F%2Fpan.baidu.com%2Fs%2Fabc%3Fpwd%3D1234 种子 https://files.example.com/a.torrent 夸克 pan.quark.cn/s/qwer 图片 https://img.example.com/a.jpg',
  'https://south-plus.org/read.php?tid=99',
  { floorLabel: 'B1F', author: 'bob', postIndex: 1 }
);
assert.deepEqual(
  jumpedResources.map(function mapJumpResource(item) {
    return [item.type, item.label, item.url, item.accessCode];
  }),
  [
    ['cloud', '百度网盘', 'https://pan.baidu.com/s/abc?pwd=1234', '1234'],
    ['torrent', '种子', 'https://files.example.com/a.torrent', ''],
    ['cloud', '夸克网盘', 'https://pan.quark.cn/s/qwer', ''],
    ['image', '图片', 'https://img.example.com/a.jpg', ''],
  ]
);
assert.deepEqual(
  enhancer.getJumpResourceLinks(jumpedResources).map(function mapJumpOnly(item) {
    return [item.type, item.label];
  }),
  [
    ['cloud', '百度网盘'],
    ['torrent', '种子'],
    ['cloud', '夸克网盘'],
  ]
);
assert.equal(
  enhancer.formatResourceJumpSummary(jumpedResources),
  '百度网盘 1 / 种子 1 / 夸克网盘 1'
);
assert.equal(
  enhancer.formatResourceLinks(enhancer.filterResourceLinks(jumpedResources, { category: 'cloud' })),
  '[百度网盘] B1F bob https://pan.baidu.com/s/abc?pwd=1234 提取码 1234\n[夸克网盘] B1F bob https://pan.quark.cn/s/qwer'
);

assert.equal(
  enhancer.normalizeResourceUrl(
    '/go.php?redirect_url=https%3A%2F%2Ffiles.example.com%2Fpack.zip',
    'https://south-plus.org/read.php?tid=99'
  ),
  'https://files.example.com/pack.zip'
);
const extendedResources = enhancer.extractResourceLinksFromText(
  '电驴 ed2k://|file|demo.zip|12345|ABCDEF|/ 压缩包 https://files.example.com/archive.7z?download=1 跳转 https://south-plus.org/go.php?redirect_url=https%3A%2F%2Ffiles.example.com%2Fpack.rar 百度 https://pan.baidu.com/s/efgh 提取密码是 ab12',
  'https://south-plus.org/read.php?tid=99',
  { floorLabel: 'B3F', author: 'carol', postIndex: 3 }
);
assert.deepEqual(
  extendedResources.map(function mapExtendedResource(item) {
    return [item.type, item.label, item.url, item.accessCode];
  }),
  [
    ['ed2k', '电驴', 'ed2k://|file|demo.zip|12345|ABCDEF|/', ''],
    ['archive', '压缩包', 'https://files.example.com/archive.7z?download=1', ''],
    ['archive', '压缩包', 'https://files.example.com/pack.rar', ''],
    ['cloud', '百度网盘', 'https://pan.baidu.com/s/efgh', 'ab12'],
  ]
);
assert.equal(
  enhancer.formatResourceJumpSummary(extendedResources),
  '电驴 1 / 压缩包 2 / 百度网盘 1'
);

const savedResourceLibrary = enhancer.saveResourceLinksToLibrary(
  jumpedResources,
  {
    legacyKey: {
      url: 'https://pan.baidu.com/s/abc?pwd=1234',
      type: 'cloud',
      accessCode: '1234',
      status: 'todo',
      sourceTitle: '旧来源',
      note: '旧备注',
      tags: ['旧标签'],
      savedAt: 100,
      updatedAt: 100,
    },
  },
  { sourceTitle: '资源帖', sourceUrl: 'https://south-plus.org/read.php?tid=99', note: '自动保存', tags: ['合集'] },
  5000
);
assert.equal(savedResourceLibrary.saved, 3);
const resourceCenterEntries = enhancer.getResourceCenterEntries(savedResourceLibrary.resources);
assert.deepEqual(
  resourceCenterEntries.map(function mapResourceCenter(entry) {
    return [entry.type, entry.provider, entry.status, entry.accessCode, entry.sourceTitle, entry.note, entry.tagText];
  }),
  [
    ['cloud', '百度网盘', 'todo', '1234', '资源帖', '自动保存', '旧标签 / 合集'],
    ['torrent', '种子', 'saved', '', '资源帖', '自动保存', '合集'],
    ['cloud', '夸克网盘', 'saved', '', '资源帖', '自动保存', '合集'],
  ]
);
const readResourceRailEntries = enhancer.getResourceRailEntries(jumpedResources, savedResourceLibrary.resources);
assert.deepEqual(
  readResourceRailEntries.map(function mapReadResourceRail(entry) {
    return [entry.type, entry.typeLabel, entry.saved, entry.status, entry.statusLabel, entry.floorLabel, entry.accessCode];
  }),
  [
    ['baidu', '百度', true, 'todo', '待下载', 'B1F', '1234'],
    ['torrent', '种子', true, 'saved', '已保存', 'B1F', ''],
    ['quark', '夸克', true, 'saved', '已保存', 'B1F', ''],
  ]
);
assert.deepEqual(
  enhancer.filterResourceRailEntries(readResourceRailEntries, 'quark').map(function mapRailFilter(entry) {
    return entry.url;
  }),
  ['https://pan.quark.cn/s/qwer']
);
assert.deepEqual(enhancer.getAvailableResourceRailFilterTypes(readResourceRailEntries), ['baidu', 'quark', 'torrent']);
assert.deepEqual(enhancer.formatResourceRailSummary(readResourceRailEntries), {
  total: 3,
  floors: 1,
  codes: 1,
  todo: 1,
  saved: 3,
});
assert.equal(enhancer.formatResourceRailSummaryText(readResourceRailEntries), '3 条 · 1 个楼层 · 1 个口令 · 待处理 1');
assert.equal(
  enhancer.formatResourceRailCodes(readResourceRailEntries),
  '[百度] B1F bob https://pan.baidu.com/s/abc?pwd=1234 提取码 1234'
);
assert.deepEqual(enhancer.normalizeResourceTags(' 合集，待下载\n合集 '), ['合集', '待下载']);
assert.deepEqual(
  enhancer.filterResourceCenterEntries(resourceCenterEntries, { query: '1234', filter: 'todo', provider: '百度网盘' }).map(function mapResource(entry) {
    return entry.url;
  }),
  ['https://pan.baidu.com/s/abc?pwd=1234']
);
assert.deepEqual(
  enhancer.filterResourceCenterEntries(resourceCenterEntries, { tag: '合集' }).map(function mapResource(entry) {
    return entry.url;
  }),
  [
    'https://pan.baidu.com/s/abc?pwd=1234',
    'https://files.example.com/a.torrent',
    'https://pan.quark.cn/s/qwer',
  ]
);
const resourceGroups = enhancer.groupResourceCenterEntries(resourceCenterEntries);
assert.deepEqual(
  resourceGroups.map(function mapResourceGroup(group) {
    return [group.label, group.entries.length, group.sourceUrl];
  }),
  [['资源帖', 3, 'https://south-plus.org/read.php?tid=99']]
);
const downloadQueueEntries = enhancer.getResourceDownloadQueueEntries(resourceCenterEntries);
assert.deepEqual(
  downloadQueueEntries.map(function mapDownloadQueue(entry) {
    return [entry.type, entry.url, entry.status];
  }),
  [
    ['cloud', 'https://pan.baidu.com/s/abc?pwd=1234', 'todo'],
  ]
);
assert.equal(
  enhancer.formatResourceDownloadList(downloadQueueEntries),
  [
    '#1 [百度网盘] https://pan.baidu.com/s/abc?pwd=1234',
    '提取码：1234',
    '来源：资源帖 · B1F · bob',
    '来源链接：https://south-plus.org/read.php?tid=99',
    '备注：自动保存',
    '标签：旧标签 / 合集',
    '状态：待下载',
  ].join('\n')
);
assert.equal(
  enhancer.formatResourceMarkdownList(downloadQueueEntries),
  [
    '1. **百度网盘**：https://pan.baidu.com/s/abc?pwd=1234',
    '   - 提取码：1234',
    '   - 来源：资源帖 · B1F · bob',
    '   - 来源链接：https://south-plus.org/read.php?tid=99',
    '   - 备注：自动保存',
    '   - 标签：旧标签 / 合集',
    '   - 状态：待下载',
  ].join('\n')
);
const selectionState = {};
enhancer.setResourceSelection(resourceCenterEntries.slice(0, 2), selectionState, true);
assert.deepEqual(
  enhancer.getSelectedResourceKeys(resourceCenterEntries, selectionState),
  ['cloud|https://pan.baidu.com/s/abc?pwd=1234', 'torrent|https://files.example.com/a.torrent']
);
assert.deepEqual(
  enhancer.getResourceEntriesByKeys(resourceCenterEntries, ['torrent|https://files.example.com/a.torrent']).map(function mapSelectedResource(entry) {
    return entry.url;
  }),
  ['https://files.example.com/a.torrent']
);
enhancer.setResourceSelection(resourceCenterEntries.slice(0, 1), selectionState, false);
assert.deepEqual(
  enhancer.getSelectedResourceKeys(resourceCenterEntries, selectionState),
  ['torrent|https://files.example.com/a.torrent']
);
assert.deepEqual(
  Object.keys(enhancer.pruneResourceLibrary({
    broken: {},
    oldKey: { url: 'pan.baidu.com/s/legacy?pwd=9999', type: 'cloud', savedAt: 300, updatedAt: 300 },
  })),
  ['cloud|https://pan.baidu.com/s/legacy?pwd=9999']
);

assert.equal(
  enhancer.extractBuyTopicUrl(
    "location.href='job.php?action=buytopic&tid=2904409&pid=tpc&verify=77492139'",
    'https://south-plus.org/read.php?tid=2904409'
  ),
  'https://south-plus.org/job.php?action=buytopic&tid=2904409&pid=tpc&verify=77492139'
);

assert.equal(
  enhancer.getAutoBuyAttemptKey(
    'https://south-plus.org/job.php?action=buytopic&tid=2904409&pid=tpc&verify=77492139',
    'https://south-plus.org/read.php?tid=2904409'
  ),
  '2904409:tpc'
);
assert.equal(
  enhancer.getAutoBuyAttemptKey(
    'https://south-plus.org/job.php?action=buytopic&pid=12345&verify=77492139',
    'https://south-plus.org/read.php?tid=2904409'
  ),
  '2904409:12345'
);
assert.equal(enhancer.getAutoBuyAttemptKey('bad-url', 'https://south-plus.org/'), '');

assert.equal(
  enhancer.isAutoBuyAttemptBlocked({ status: 'checking', updatedAt: 1000 }, 2000),
  true
);
assert.equal(
  enhancer.isAutoBuyAttemptBlocked({ status: 'checking', updatedAt: 1000 }, 1000 + 11 * 60 * 1000),
  false
);
assert.equal(
  enhancer.isAutoBuyAttemptBlocked({ status: 'buying', updatedAt: 1000 }, 1000 + 60 * 60 * 1000),
  true
);
assert.equal(enhancer.isAutoBuyAttemptBlocked({ status: 'done', updatedAt: 1000 }, 999999), true);
assert.equal(enhancer.isAutoBuyAttemptBlocked({ status: 'failed', updatedAt: 1000 }, 999999), true);
assert.equal(enhancer.isAutoBuyAttemptBlocked({ status: 'skipped', updatedAt: 1000 }, 999999), false);
assert.match(
  enhancer.formatAutoBuyAttemptMessage({
    status: 'failed',
    message: '购买请求失败',
    updatedAt: 1000,
  }),
  /自动购买未重复执行.*购买请求失败/
);

assert.equal(
  enhancer.shouldAutoBuyPost({ autoBuyPost: true, autoBuyMaxSp: 10 }, 5, 20),
  true
);
assert.equal(
  enhancer.shouldAutoBuyPost({ autoBuyPost: true, autoBuyMaxSp: 5 }, 0, 33),
  true
);
assert.equal(
  enhancer.shouldAutoBuyPost({ autoBuyPost: true, autoBuyMaxSp: 5 }, 5, 20),
  false
);
assert.equal(
  enhancer.shouldAutoBuyPost({ autoBuyPost: true, autoBuyMaxSp: 10 }, 5, 4),
  false
);
assert.equal(
  enhancer.shouldAutoBuyPost({ autoBuyPost: false, autoBuyMaxSp: 10 }, 5, 20),
  false
);

assert.equal(enhancer.formatReadProgress(null), '');
assert.equal(enhancer.formatReadProgress({ updatedAt: 1000, progress: 0.426, page: 1 }), '43%');
assert.equal(enhancer.formatReadProgress({ updatedAt: 1000, progress: 2, page: 3 }), '第 3 页 · 100%');
assert.deepEqual(enhancer.parseTagList(' 待看，资源\\n待看 #精品、长帖 '), ['待看', '资源', '精品', '长帖']);
assert.deepEqual(
  enhancer.getReadProgressRestoreTarget(
    {
      scrollY: 1200,
      floorLabel: 'B12F',
      floorHash: '#floor-12',
      floorTop: 1100,
      nextFloorLabel: 'B13F',
      nextFloorHash: '#floor-13',
      nextFloorTop: 1380,
    },
    'next'
  ),
  { mode: 'next', hash: '#floor-13', top: 1380, label: 'B13F' }
);
assert.deepEqual(
  enhancer.getReadProgressRestoreTarget(
    {
      scrollY: 1200,
      floorLabel: 'B12F',
      floorHash: '#floor-12',
      floorTop: 1100,
      nextFloorLabel: 'B13F',
      nextFloorHash: '#floor-13',
      nextFloorTop: 1380,
    },
    'last'
  ),
  { mode: 'last', hash: '#floor-12', top: 1100, label: 'B12F' }
);
assert.deepEqual(
  enhancer.getReadProgressRestoreTarget({ scrollY: 900 }, 'next'),
  { mode: 'next', hash: '', top: 900, label: '' }
);
assert.deepEqual(
  enhancer.mergeReadProgressRecord(
    { updatedAt: 2000, progress: 1, page: 1, scrollY: 5000 },
    { updatedAt: 3000, progress: 0.8, page: 1, scrollY: 2000 }
  ),
  { updatedAt: 2000, progress: 1, page: 1, scrollY: 5000 }
);
assert.deepEqual(
  enhancer.mergeReadProgressRecord(
    { updatedAt: 2000, progress: 0.995, page: 1, scrollY: 5000 },
    { updatedAt: 3000, progress: 0.8, page: 1, scrollY: 2000 }
  ),
  { updatedAt: 2000, progress: 0.995, page: 1, scrollY: 5000 }
);
assert.deepEqual(
  enhancer.mergeReadProgressRecord(
    { updatedAt: 2000, progress: 0.9, page: 1, scrollY: 4000 },
    { updatedAt: 3000, progress: 0.8, page: 1, scrollY: 2000 }
  ),
  { updatedAt: 3000, progress: 0.8, page: 1, scrollY: 2000 }
);
assert.deepEqual(
  enhancer.mergeReadProgressRecord(
    { updatedAt: 2000, progress: 0.4, page: 1, scrollY: 4000, tags: ['待看', '资源'] },
    { updatedAt: 3000, progress: 0.6, page: 1, scrollY: 5000 }
  ),
  { updatedAt: 3000, progress: 0.6, page: 1, scrollY: 5000, tags: ['待看', '资源'] }
);
assert.deepEqual(
  Object.keys(enhancer.pruneReadProgress({
    1: { updatedAt: 100 },
    2: { updatedAt: 300 },
    3: { updatedAt: 200 },
    broken: {},
  }, 2)),
  ['2', '3']
);

const watchEntries = enhancer.getWatchCenterEntries(
  {
    1: { title: '旧帖', url: 'https://south-plus.org/read.php?tid=1', savedAt: 100, tags: ['待看'] },
    2: { title: '新帖', url: 'https://south-plus.org/read.php?tid=2', savedAt: 300, tags: ['资源'] },
  },
  {
    1: {
      title: '旧帖更新标题',
      url: 'https://south-plus.org/read.php?tid-1-page-2.html',
      page: 2,
      progress: 0.5,
      floorLabel: 'B18F',
      nextFloorLabel: 'B19F',
      tags: ['长帖'],
      updatedAt: 400,
    },
  }
);
assert.deepEqual(
  watchEntries.map(function mapEntry(entry) {
    return [entry.id, entry.title, entry.progressText, entry.progressUrl, entry.floorLabel, entry.nextFloorLabel, entry.tagText];
  }),
  [
    ['2', '新帖', '', 'https://south-plus.org/read.php?tid=2', '', '', '资源'],
    ['1', '旧帖更新标题', '第 2 页 · 50%', 'https://south-plus.org/read.php?tid-1-page-2.html', 'B18F', 'B19F', '待看 / 长帖'],
  ]
);

assert.deepEqual(
  enhancer.filterWatchCenterEntries(watchEntries, { query: 'b19f', filter: 'all' }).map(function mapEntry(entry) {
    return entry.id;
  }),
  ['1']
);
assert.deepEqual(
  enhancer.filterWatchCenterEntries(watchEntries, { filter: 'progress' }).map(function mapEntry(entry) {
    return entry.id;
  }),
  ['1']
);
assert.deepEqual(
  enhancer.filterWatchCenterEntries(watchEntries, { tag: '资源' }).map(function mapEntry(entry) {
    return entry.id;
  }),
  ['2']
);

const historyEntries = enhancer.getHistoryCenterEntries({
  1: {
    title: '旧历史',
    url: 'https://south-plus.org/read.php?tid=1',
    progress: 0.25,
    floorLabel: 'B5F',
    nextFloorLabel: 'B6F',
    tags: ['待处理'],
    updatedAt: 100,
  },
  2: { title: '新历史', url: 'https://south-plus.org/read.php?tid=2', progress: 1, floorLabel: 'B9F', nextFloorLabel: 'B9F', tags: ['已完成'], updatedAt: 300 },
  broken: { title: '坏记录' },
});
assert.deepEqual(
  historyEntries.map(function mapHistory(entry) {
    return [entry.id, entry.title, entry.progressText, entry.floorLabel, entry.nextFloorLabel, entry.tagText];
  }),
  [
    ['2', '新历史', '100%', 'B9F', 'B9F', '已完成'],
    ['1', '旧历史', '25%', 'B5F', 'B6F', '待处理'],
  ]
);
assert.deepEqual(
  enhancer.filterHistoryCenterEntries(historyEntries, { filter: 'todo' }).map(function mapHistory(entry) {
    return entry.id;
  }),
  ['1']
);
assert.deepEqual(
  enhancer.filterHistoryCenterEntries(historyEntries, { query: 'b9f', filter: 'all' }).map(function mapHistory(entry) {
    return entry.id;
  }),
  ['2']
);
assert.deepEqual(
  enhancer.filterHistoryCenterEntries(historyEntries, { tag: '待处理' }).map(function mapHistory(entry) {
    return entry.id;
  }),
  ['1']
);

const backup = enhancer.createBackupPayload({
  settings: {
    cleanMode: false,
    titleKeywords: ['广告', '广告'],
    authorKeywords: '张三\n张三',
    quickReplies: ['感谢', '感谢'],
    autoBuyMaxSp: '8',
  },
  read: { 1: 100, broken: undefined },
  watch: { 2: { title: '备份帖', tags: ['资源'] } },
  progress: { 3: { title: '进度帖', progress: 0.5, updatedAt: 200 }, bad: { title: '坏进度' } },
  autoBuyAttempts: { '3:tpc': { status: 'done', updatedAt: 300 }, broken: { message: '坏记录' } },
  resources: {
    'cloud|https://pan.baidu.com/s/backup?pwd=8888': {
      url: 'https://pan.baidu.com/s/backup?pwd=8888',
      type: 'cloud',
      accessCode: '8888',
      savedAt: 400,
      updatedAt: 400,
    },
    bad: {},
  },
}, 1720000000000);
assert.equal(backup.app, 'spEnhancer');
assert.equal(backup.version, 1);
assert.equal(backup.exportedAt, 1720000000000);
assert.equal(backup.data.settings.cleanMode, false);
assert.equal(backup.data.settings.autoBuyMaxSp, 8);
assert.deepEqual(backup.data.settings.titleKeywords, ['广告']);
assert.deepEqual(backup.data.settings.authorKeywords, ['张三']);
assert.deepEqual(backup.data.settings.quickReplies, ['感谢']);
assert.deepEqual(backup.data.read, { 1: 100 });
assert.deepEqual(backup.data.watch['2'].tags, ['资源']);
assert.deepEqual(Object.keys(backup.data.progress), ['3']);
assert.deepEqual(Object.keys(backup.data.autoBuyAttempts), ['3:tpc']);
assert.deepEqual(Object.keys(backup.data.resources), ['cloud|https://pan.baidu.com/s/backup?pwd=8888']);
assert.equal(backup.data.resources['cloud|https://pan.baidu.com/s/backup?pwd=8888'].accessCode, '8888');

const normalizedBackup = enhancer.normalizeBackupPayload(JSON.stringify({
  exportedAt: 1720000000000,
  settings: { cleanMode: 0, titleKeywords: '资源\n精品', quickReplies: '支持\n支持' },
  read: { 4: 400 },
  watch: { 5: { title: '旧格式帖' } },
  progress: { 6: { title: '旧格式进度', updatedAt: 600 } },
  autoBuy: { '6:tpc': { status: 'failed', updatedAt: 700 } },
}));
assert.equal(normalizedBackup.data.settings.cleanMode, false);
assert.deepEqual(normalizedBackup.data.settings.titleKeywords, ['资源', '精品']);
assert.deepEqual(normalizedBackup.data.settings.quickReplies, ['支持']);
assert.deepEqual(Object.keys(normalizedBackup.data.autoBuyAttempts), ['6:tpc']);
assert.equal(enhancer.normalizeBackupPayload('{bad json'), null);
assert.equal(
  enhancer.formatBackupFileName(new Date(2026, 0, 2, 3, 4).getTime()),
  'southplus-plus-backup-20260102-0304.json'
);

const healthNow = new Date(2026, 6, 23).getTime();
const healthData = {
  settings: {
    titleKeywords: '广告\n广告',
    authorKeywords: '张三',
    quickReplies: '感谢\n支持',
  },
  read: { 1: 100 },
  watch: {
    oldWatch: { title: '重复稍后', url: 'https://south-plus.org/read.php?tid=10#old', savedAt: 100 },
    newWatch: { title: '重复稍后', url: 'https://south-plus.org/read.php?tid=10#new', savedAt: 300 },
  },
  progress: {
    stale: { title: '过期进度', url: 'https://south-plus.org/read.php?tid=11', updatedAt: healthNow - 181 * 24 * 60 * 60 * 1000 },
    fresh: { title: '重复进度', url: 'https://south-plus.org/read.php?tid=12#fresh', updatedAt: healthNow - 1000 },
    duplicate: { title: '重复进度', url: 'https://south-plus.org/read.php?tid=12#dup', updatedAt: healthNow - 2000 },
    broken: { title: '坏进度' },
  },
  autoBuyAttempts: {
    good: { status: 'done', updatedAt: 300 },
    bad: { message: '坏记录' },
  },
  resources: {
    goodResource: { url: 'pan.baidu.com/s/health?pwd=9999', type: 'cloud', updatedAt: 300 },
    badResource: {},
  },
  navigation: {
    comic: { section: '子栏目', label: '漫区特设', href: 'https://south-plus.org/index.php#spx-module-target-home-1', updatedAt: 300 },
  },
};
const healthReport = enhancer.collectDataHealthReport(healthData, healthNow);
assert.equal(healthReport.counts.titleKeywords, 1);
assert.equal(healthReport.counts.watch, 2);
assert.equal(healthReport.counts.progress, 4);
assert.deepEqual(healthReport.duplicateWatchKeys, ['oldWatch']);
assert.deepEqual(healthReport.duplicateProgressKeys, ['duplicate']);
assert.deepEqual(healthReport.staleProgressKeys, ['stale']);
assert.deepEqual(healthReport.invalidProgressKeys, ['broken']);
assert.deepEqual(healthReport.invalidAutoBuyKeys, ['bad']);
assert.deepEqual(healthReport.invalidResourceKeys, ['badResource']);
assert.match(enhancer.formatDataHealthSummary(healthReport), /稍后看 2/);
assert.match(enhancer.formatDataHealthSummary(healthReport), /资源 1/);
assert.match(enhancer.formatDataHealthWarnings(healthReport), /重复稍后看 1/);
assert.match(enhancer.formatDataHealthWarnings(healthReport), /异常资源 1/);

const cleanedHealth = enhancer.cleanupDataHealthPayload(healthData, healthNow);
assert.deepEqual(Object.keys(cleanedHealth.payload.data.watch), ['newWatch']);
assert.deepEqual(Object.keys(cleanedHealth.payload.data.progress), ['fresh']);
assert.deepEqual(Object.keys(cleanedHealth.payload.data.autoBuyAttempts), ['good']);
assert.deepEqual(Object.keys(cleanedHealth.payload.data.resources), ['cloud|https://pan.baidu.com/s/health?pwd=9999']);
assert.equal(cleanedHealth.after.cleanupCount, 0);
assert.match(enhancer.formatBackupImportPreview(cleanedHealth.payload), /即将导入 South Plus \+\+\+ 本地备份/);

assert.equal(enhancer.formatStorageBytes(1536), '1.5 KB');
const storageReport = enhancer.collectStorageUsageReport(healthData);
assert.equal(storageReport.entries.length, 8);
const resourceUsage = storageReport.entries.find(function findResourceUsage(entry) {
  return entry.label === '资源库';
});
const navigationUsage = storageReport.entries.find(function findNavigationUsage(entry) {
  return entry.label === '导航池';
});
const navigationPinUsage = storageReport.entries.find(function findNavigationPinUsage(entry) {
  return entry.label === '导航置顶';
});
assert.equal(resourceUsage.count, 1);
assert.equal(navigationUsage.count, 1);
assert.equal(navigationPinUsage.count, 0);
assert.match(enhancer.formatStorageUsageSummary(storageReport), /本地存储约 .* · 8 项 · 最大：/);
assert.match(enhancer.formatStorageUsageEntry(resourceUsage), /^资源库：.* \/ 1 条 \/ 上限 500$/);
assert.equal(enhancer.formatStorageUsageLimit(resourceUsage), '1 / 500 条（0%）');
assert.equal(enhancer.getStorageUsageLevel(resourceUsage), 'ok');
assert.equal(enhancer.formatStorageUsageWarnings(storageReport), '当前体积正常，暂无额外清理建议');

const crowdedProgress = {};
for (let index = 0; index < 160; index += 1) {
  crowdedProgress[index] = { title: '进度 ' + index, updatedAt: healthNow + index };
}
const crowdedStorageReport = enhancer.collectStorageUsageReport({ progress: crowdedProgress });
assert.match(enhancer.formatStorageUsageWarnings(crowdedStorageReport), /阅读进度接近 200 条上限/);
assert.equal(enhancer.getStorageUsageLevel(crowdedStorageReport.entries.find(function findProgressUsage(entry) {
  return entry.label === '阅读进度';
})), 'warning');

const autoBuyEntries = enhancer.getAutoBuyCenterEntries({
  '1:tpc': { status: 'failed', message: '失败原因', price: 5, updatedAt: 100 },
  '2:tpc': { status: 'done', message: '已完成', balance: 20, updatedAt: 300 },
  broken: {},
});
assert.deepEqual(
  autoBuyEntries.map(function mapAttempt(entry) {
    return [entry.key, entry.statusLabel, entry.message, entry.price, entry.balance];
  }),
  [
    ['2:tpc', '已完成', '已完成', null, 20],
    ['1:tpc', '失败', '失败原因', 5, null],
  ]
);
assert.deepEqual(
  enhancer.filterAutoBuyCenterEntries(autoBuyEntries, { filter: 'done' }).map(function mapAttempt(entry) {
    return entry.key;
  }),
  ['2:tpc']
);
assert.deepEqual(
  enhancer.filterAutoBuyCenterEntries(autoBuyEntries, { query: '失败原因', filter: 'all' }).map(function mapAttempt(entry) {
    return entry.key;
  }),
  ['1:tpc']
);

class FakeFormData {
  constructor(form) {
    this.values = Object.assign({}, form.fields || {});
  }

  has(name) {
    return Object.prototype.hasOwnProperty.call(this.values, name);
  }

  append(name, value) {
    this.values[name] = value;
  }

  get(name) {
    return this.values[name];
  }
}

const quickReplyRequest = enhancer.createQuickReplyRequest(
  {
    action: '/post.php?action=reply',
    method: 'post',
    fields: {
      atc_content: '感谢分享',
      verify: 'abc123',
    },
  },
  { name: 'Submit', value: '提交' },
  'https://south-plus.org/read.php?tid=123',
  FakeFormData
);

assert.equal(quickReplyRequest.url, 'https://south-plus.org/post.php?action=reply');
assert.equal(quickReplyRequest.options.method, 'POST');
assert.equal(quickReplyRequest.options.credentials, 'include');
assert.equal(quickReplyRequest.options.body.get('atc_content'), '感谢分享');
assert.equal(quickReplyRequest.options.body.get('verify'), 'abc123');
assert.equal(quickReplyRequest.options.body.get('Submit'), '提交');

const shadowedActionRequest = enhancer.createQuickReplyRequest(
  {
    action: {
      toString() {
        return '[object HTMLInputElement]';
      },
    },
    method: 'post',
    getAttribute(name) {
      return name === 'action' ? 'post.php?' : null;
    },
    fields: {
      action: 'reply',
      atc_content: '感谢分享',
      verify: 'abc123',
    },
  },
  { name: 'Submit', value: '提交' },
  'https://south-plus.org/read.php?tid=123',
  FakeFormData
);

assert.equal(shadowedActionRequest.url, 'https://south-plus.org/post.php?');

const tidFallbackRequest = enhancer.createQuickReplyRequest(
  {
    action: 'post.php?',
    method: 'post',
    fields: {
      action: 'reply',
      fid: '9',
      tid: '456',
      atc_content: '感谢分享',
    },
  },
  { name: 'Submit', value: '提交' },
  'https://south-plus.org/post.php?action=reply&tid=456',
  FakeFormData
);

assert.equal(
  enhancer.resolveQuickReplyRefreshUrl(
    'https://south-plus.org/post.php?action=reply&tid=456',
    tidFallbackRequest,
    { ok: true, url: 'https://south-plus.org/post.php?' }
  ),
  'https://south-plus.org/read.php?tid=456&page=e#a'
);
assert.equal(
  enhancer.resolveQuickReplyRefreshUrl(
    'https://south-plus.org/read.php?tid=123',
    tidFallbackRequest,
    { ok: true, url: 'https://south-plus.org/read.php?tid=123&page=e#a' }
  ),
  'https://south-plus.org/read.php?tid=123&page=e#a'
);
assert.equal(
  enhancer.shouldUseQuickReplySubmitHtml('<table class="js-post"><td class="tpc_content">new reply</td></table>', { url: 'https://south-plus.org/post.php?' }),
  true
);
assert.equal(
  enhancer.shouldUseQuickReplySubmitHtml('<main id="main">发帖成功</main>', { url: 'https://south-plus.org/post.php?' }),
  false
);

function createFakeSubmitter(tagName, type, name, value) {
  return {
    tagName,
    name,
    value,
    getAttribute(attribute) {
      return attribute === 'type' ? type : null;
    },
  };
}

const nativeSubmitInput = createFakeSubmitter('INPUT', 'submit', 'Submit', '提交');
const defaultSubmitButton = createFakeSubmitter('BUTTON', null, 'Submit', '提交');
const resetButton = createFakeSubmitter('BUTTON', 'reset', 'reset', '重置');
assert.equal(enhancer.isQuickReplySubmitter(nativeSubmitInput), true);
assert.equal(enhancer.isQuickReplySubmitter(defaultSubmitButton), true);
assert.equal(enhancer.isQuickReplySubmitter(resetButton), false);
assert.strictEqual(
  enhancer.getQuickReplySubmitter({
    querySelector(selector) {
      return selector === 'button:not([type])' ? defaultSubmitButton : null;
    },
  }),
  defaultSubmitButton
);
assert.strictEqual(
  enhancer.getQuickReplySubmitter({
    spxQuickReplySubmitter: defaultSubmitButton,
    querySelector() {
      return nativeSubmitInput;
    },
  }),
  defaultSubmitButton
);
assert.strictEqual(
  enhancer.getQuickReplySubmitter({
    querySelector() {
      return nativeSubmitInput;
    },
  }, defaultSubmitButton),
  defaultSubmitButton
);
assert.equal(enhancer.isQuickReplyEditorCandidate({ disabled: false, readOnly: false, closest: function noWidgetOwner() { return null; } }), true);
assert.equal(enhancer.isQuickReplyEditorCandidate({ disabled: true, readOnly: false, closest: function noWidgetOwner() { return null; } }), false);
assert.equal(enhancer.isQuickReplyEditorCandidate({
  disabled: false,
  readOnly: false,
  closest: function widgetOwner(selector) {
    return selector.indexOf('#spx-settings') !== -1 ? { id: 'spx-settings' } : null;
  },
}), false);

async function testQuickReplySubmissionFlow() {
  const pageUrl = 'https://south-plus.org/read.php?tid=123';
  const request = {
    url: 'https://south-plus.org/post.php?action=reply',
    options: { method: 'POST' },
  };
  const successCalls = [];
  const successPendingCalls = [];
  let successPending = false;
  let appliedHtml = '';
  let appliedRefreshUrl = '';

  const success = await enhancer.performQuickReplySubmit({
    request,
    pageUrl,
    fetch: async function fetchStub(url, options) {
      successCalls.push({ url, options });
      return {
        ok: true,
        text: async function textStub() {
          return '<table class="js-post"><td class="tpc_content">new reply</td></table>';
        },
      };
    },
    isPending: function isPending() {
      return successPending;
    },
    setPending: function setPending(value) {
      successPendingCalls.push(value);
      successPending = value;
    },
    applyHtml: function applyHtml(html, refreshUrl) {
      appliedHtml = html;
      appliedRefreshUrl = refreshUrl;
      return true;
    },
  });

  assert.equal(success, true);
  assert.equal(successCalls[0].url, request.url);
  assert.strictEqual(successCalls[0].options, request.options);
  assert.equal(successCalls.length, 1);
  assert.equal(appliedHtml, '<table class="js-post"><td class="tpc_content">new reply</td></table>');
  assert.equal(appliedRefreshUrl, 'https://south-plus.org/read.php?tid=123&page=e#a');
  assert.deepEqual(successPendingCalls, [true, false]);
  assert.equal(successPending, false);

  const duplicateFetchCalls = [];
  const duplicatePendingCalls = [];
  let duplicatePending = true;
  const duplicate = await enhancer.performQuickReplySubmit({
    request,
    pageUrl,
    fetch: async function unexpectedFetch(url, options) {
      duplicateFetchCalls.push({ url, options });
      throw new Error('重复提交不应发送请求');
    },
    isPending: function isPending() {
      return duplicatePending;
    },
    setPending: function setPending(value) {
      duplicatePendingCalls.push(value);
      duplicatePending = value;
    },
    applyHtml: function applyHtml() {
      return true;
    },
  });
  assert.equal(duplicate, false);
  assert.deepEqual(duplicateFetchCalls, []);
  assert.deepEqual(duplicatePendingCalls, []);
  assert.equal(duplicatePending, true);

  const pendingCheckError = new Error('pending check failed');
  let pendingCheckReportedError = null;
  let pendingCheckFetchCount = 0;
  const pendingCheckFailure = await enhancer.performQuickReplySubmit({
    request,
    pageUrl,
    fetch: async function unexpectedFetch() {
      pendingCheckFetchCount += 1;
      return { ok: true };
    },
    isPending: function failedPendingCheck() {
      throw pendingCheckError;
    },
    setPending: function setPending() {},
    applyHtml: function applyHtml() {
      return true;
    },
    onError: function onError(error) {
      pendingCheckReportedError = error;
    },
  });

  assert.equal(pendingCheckFailure, false);
  assert.strictEqual(pendingCheckReportedError, pendingCheckError);
  assert.equal(pendingCheckFetchCount, 0);

  const pendingStartError = new Error('pending start failed');
  const pendingStartCalls = [];
  let pendingStartState = false;
  let pendingStartReportedError = null;
  let pendingStartFetchCount = 0;
  const pendingStartFailure = await enhancer.performQuickReplySubmit({
    request,
    pageUrl,
    fetch: async function unexpectedFetch() {
      pendingStartFetchCount += 1;
      return { ok: true };
    },
    isPending: function isPending() {
      return pendingStartState;
    },
    setPending: function setPending(value) {
      pendingStartCalls.push(value);
      pendingStartState = value;
      if (value) throw pendingStartError;
    },
    applyHtml: function applyHtml() {
      return true;
    },
    onError: function onError(error) {
      pendingStartReportedError = error;
    },
  });

  assert.equal(pendingStartFailure, false);
  assert.strictEqual(pendingStartReportedError, pendingStartError);
  assert.equal(pendingStartFetchCount, 0);
  assert.deepEqual(pendingStartCalls, [true, false]);
  assert.equal(pendingStartState, false);

  const throwingOnErrorFailure = new Error('fetch failed before onError');
  const throwingOnErrorPendingCalls = [];
  let throwingOnErrorPending = false;
  let throwingOnErrorCallCount = 0;
  let throwingOnErrorReceivedError = null;
  const throwingOnErrorResult = await enhancer.performQuickReplySubmit({
    request,
    pageUrl,
    fetch: async function failedFetch() {
      throw throwingOnErrorFailure;
    },
    isPending: function isPending() {
      return throwingOnErrorPending;
    },
    setPending: function setPending(value) {
      throwingOnErrorPendingCalls.push(value);
      throwingOnErrorPending = value;
    },
    applyHtml: function applyHtml() {
      return true;
    },
    onError: function throwingOnError(error) {
      throwingOnErrorCallCount += 1;
      throwingOnErrorReceivedError = error;
      throw new Error('onError failed');
    },
  });

  assert.equal(throwingOnErrorResult, false);
  assert.equal(throwingOnErrorCallCount, 1);
  assert.strictEqual(throwingOnErrorReceivedError, throwingOnErrorFailure);
  assert.deepEqual(throwingOnErrorPendingCalls, [true, false]);
  assert.equal(throwingOnErrorPending, false);

  const networkFailurePendingCalls = [];
  let networkFailurePending = false;
  let networkFailureError = null;
  const failed = await enhancer.performQuickReplySubmit({
    request,
    pageUrl,
    fetch: async function failedFetch() {
      throw new Error('network failed');
    },
    isPending: function isPending() {
      return networkFailurePending;
    },
    setPending: function setPending(value) {
      networkFailurePendingCalls.push(value);
      networkFailurePending = value;
    },
    applyHtml: function applyHtml() {
      return true;
    },
    onError: function onError(error) {
      networkFailureError = error;
    },
  });

  assert.equal(failed, false);
  assert.equal(networkFailureError.message, 'network failed');
  assert.deepEqual(networkFailurePendingCalls, [true, false]);
  assert.equal(networkFailurePending, false);

  const httpFailurePendingCalls = [];
  let httpFailurePending = false;
  let httpFailureError = null;
  let httpFailureApplyCount = 0;
  const httpFailure = await enhancer.performQuickReplySubmit({
    request,
    pageUrl,
    fetch: async function failedHttpFetch() {
      return { ok: false };
    },
    isPending: function isPending() {
      return httpFailurePending;
    },
    setPending: function setPending(value) {
      httpFailurePendingCalls.push(value);
      httpFailurePending = value;
    },
    applyHtml: function applyHtml() {
      httpFailureApplyCount += 1;
      return true;
    },
    onError: function onError(error) {
      httpFailureError = error;
    },
  });

  assert.equal(httpFailure, false);
  assert.equal(httpFailureError.message, '快捷回复提交失败');
  assert.equal(httpFailureApplyCount, 0);
  assert.deepEqual(httpFailurePendingCalls, [true, false]);
  assert.equal(httpFailurePending, false);

  const refreshFailurePendingCalls = [];
  let refreshFailurePending = false;
  let refreshFailureError = null;
  let refreshFailureApplyCount = 0;
  let refreshFailureFetchCount = 0;
  const refreshFailure = await enhancer.performQuickReplySubmit({
    request,
    pageUrl,
    fetch: async function failedRefreshFetch() {
      refreshFailureFetchCount += 1;
      return { ok: refreshFailureFetchCount === 1 };
    },
    isPending: function isPending() {
      return refreshFailurePending;
    },
    setPending: function setPending(value) {
      refreshFailurePendingCalls.push(value);
      refreshFailurePending = value;
    },
    applyHtml: function applyHtml() {
      refreshFailureApplyCount += 1;
      return true;
    },
    onError: function onError(error) {
      refreshFailureError = error;
    },
  });

  assert.equal(refreshFailure, false);
  assert.equal(refreshFailureFetchCount, 2);
  assert.equal(refreshFailureError.message, '重新加载帖子失败');
  assert.equal(refreshFailureApplyCount, 0);
  assert.deepEqual(refreshFailurePendingCalls, [true, false]);
  assert.equal(refreshFailurePending, false);

  const applyFailurePendingCalls = [];
  let applyFailurePending = false;
  let applyFailureError = null;
  let applyFailureCount = 0;
  const applyFailure = await enhancer.performQuickReplySubmit({
    request,
    pageUrl,
    fetch: async function successfulFetch() {
      return {
        ok: true,
        text: async function textStub() {
          return '<main id="main">new reply</main>';
        },
      };
    },
    isPending: function isPending() {
      return applyFailurePending;
    },
    setPending: function setPending(value) {
      applyFailurePendingCalls.push(value);
      applyFailurePending = value;
    },
    applyHtml: function applyHtml() {
      applyFailureCount += 1;
      return false;
    },
    onError: function onError(error) {
      applyFailureError = error;
    },
  });

  assert.equal(applyFailure, false);
  assert.equal(applyFailureError.message, '无法更新帖子内容');
  assert.equal(applyFailureCount, 1);
  assert.deepEqual(applyFailurePendingCalls, [true, false]);
  assert.equal(applyFailurePending, false);

  const rateLimitPendingCalls = [];
  let rateLimitPending = false;
  let rateLimitError = null;
  let rateLimitApplyCount = 0;
  const rateLimitResult = await enhancer.performQuickReplySubmit({
    request,
    pageUrl,
    fetch: async function rateLimitedFetch() {
      return {
        ok: true,
        text: async function textStub() {
          return '<html><body>1秒内操作频繁，请稍后再试</body></html>';
        },
      };
    },
    isPending: function isPending() {
      return rateLimitPending;
    },
    setPending: function setPending(value) {
      rateLimitPendingCalls.push(value);
      rateLimitPending = value;
    },
    applyHtml: function applyHtml() {
      rateLimitApplyCount += 1;
      return true;
    },
    onError: function onError(error) {
      rateLimitError = error;
    },
  });

  assert.equal(rateLimitResult, false);
  assert.equal(rateLimitError.spxRateLimited, true);
  assert.equal(rateLimitApplyCount, 0);
  assert.deepEqual(rateLimitPendingCalls, [true, false]);
  assert.equal(rateLimitPending, false);
}

testQuickReplySubmissionFlow()
  .then(function reportSuccess() {
    console.log('southplus_enhancer tests passed');
  })
  .catch(function reportFailure(error) {
    console.error(error);
    process.exitCode = 1;
  });

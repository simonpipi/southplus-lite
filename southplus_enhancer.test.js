const assert = require('node:assert/strict');
const fs = require('node:fs');
const enhancer = require('./southplus_enhancer.user.js');

const source = fs.readFileSync('./southplus_enhancer.user.js', 'utf8');
assert.match(source, /@version\s+0\.2\.0/);
assert.match(source, /South Plus 工具箱/);
assert.match(source, /spx-toolbox-action/);
assert.match(source, /隐藏广告/);
assert.match(source, /首页模块全屏/);
assert.match(source, /本地存储体积/);
assert.match(source, /spx-storage-usage/);
assert.match(source, /加载更多图片/);
assert.match(source, /spx-preview-load-more/);
assert.match(source, /资源工作台/);
assert.doesNotMatch(source, /资源中心/);
assert.match(source, /select-visible-resources/);
const emptyRoot = { querySelector: function querySelector() { return null; }, querySelectorAll: function querySelectorAll() { return []; } };
assert.equal(enhancer.getSettingsPanelKeys('https://south-plus.org/index.php').includes('adBlock'), false);
assert.equal(enhancer.getSettingsPanelKeys('https://south-plus.org/index.php').includes('homeDashboard'), false);
assert.ok(enhancer.getSettingsPanelKeys('https://south-plus.org/thread.php?fid-9.html').includes('autoBuyPost'));
assert.ok(enhancer.getSettingsPanelKeys('https://south-plus.org/read.php?tid=1', emptyRoot).includes('autoBuyPost'));
assert.match(source, /data-number="autoBuyMaxSp"/);

assert.equal(enhancer.parsePostPrice('本帖售价：5 SP币'), 5);
assert.equal(enhancer.parsePostPrice('购买需要 12.5 SP'), 12.5);
assert.equal(enhancer.parsePostPrice('此帖售价 1 SP币,已有 306 人购买'), 1);
assert.equal(enhancer.parsePostPrice('普通帖子内容'), null);

assert.equal(enhancer.parseUserSpBalance('当前拥有 30 SP币'), 30);
assert.equal(enhancer.parseUserSpBalance('SP余额：8.5'), 8.5);
assert.equal(enhancer.parseUserSpBalance('SP币: 34'), 34);
assert.equal(enhancer.parseUserSpBalance('本帖售价：5 SP币'), null);

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
assert.equal(storageReport.entries.length, 6);
const resourceUsage = storageReport.entries.find(function findResourceUsage(entry) {
  return entry.label === '资源库';
});
assert.equal(resourceUsage.count, 1);
assert.match(enhancer.formatStorageUsageSummary(storageReport), /本地存储约 .* · 6 项 · 最大：/);
assert.match(enhancer.formatStorageUsageEntry(resourceUsage), /^资源库：.* \/ 1 条 \/ 上限 500$/);
assert.equal(enhancer.formatStorageUsageWarnings(storageReport), '当前体积正常，暂无额外清理建议');

const crowdedProgress = {};
for (let index = 0; index < 160; index += 1) {
  crowdedProgress[index] = { title: '进度 ' + index, updatedAt: healthNow + index };
}
const crowdedStorageReport = enhancer.collectStorageUsageReport({ progress: crowdedProgress });
assert.match(enhancer.formatStorageUsageWarnings(crowdedStorageReport), /阅读进度接近 200 条上限/);

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

  const success = await enhancer.performQuickReplySubmit({
    request,
    pageUrl,
    fetch: async function fetchStub(url, options) {
      successCalls.push({ url, options });
      return {
        ok: true,
        text: async function textStub() {
          return '<main id="main">new reply</main>';
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
    applyHtml: function applyHtml(html) {
      appliedHtml = html;
      return true;
    },
  });

  assert.equal(success, true);
  assert.equal(successCalls[0].url, request.url);
  assert.strictEqual(successCalls[0].options, request.options);
  assert.deepEqual(successCalls[1], {
    url: pageUrl,
    options: {
      credentials: 'include',
      cache: 'no-store',
    },
  });
  assert.equal(successCalls[1].options.body, undefined);
  assert.equal(appliedHtml, '<main id="main">new reply</main>');
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
}

testQuickReplySubmissionFlow()
  .then(function reportSuccess() {
    console.log('southplus_enhancer tests passed');
  })
  .catch(function reportFailure(error) {
    console.error(error);
    process.exitCode = 1;
  });

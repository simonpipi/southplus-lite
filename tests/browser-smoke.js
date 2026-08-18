#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const JXA_SOURCE = String(function jxaSource() {/*
const app = Application.currentApplication();
app.includeStandardAdditions = true;

const chrome = Application('Google Chrome');
const SITE_ORIGIN = 'https://south-plus.org';
const FORUM_URL = SITE_ORIGIN + '/thread.php?fid-9.html';

function nowIso() {
  return new Date().toISOString();
}

function compactText(value, limit) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return limit ? text.slice(0, limit) : text;
}

function safeString(value) {
  try {
    return String(value == null ? '' : value);
  } catch (error) {
    return '';
  }
}

function executeJson(tab, javascript, label) {
  let raw = '';
  try {
    raw = safeString(tab.execute({ javascript }));
    return JSON.parse(raw);
  } catch (error) {
    return {
      ok: false,
      error: 'EXECUTE_JSON_FAILED',
      label: label || '',
      message: safeString(error && (error.message || error)),
      raw: raw.slice(0, 800),
    };
  }
}

function waitFor(tab, conditionJavascript, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      if (safeString(tab.execute({ javascript: conditionJavascript })) === 'true') return true;
    } catch (error) {}
    delay(0.25);
  }
  return false;
}

function listTabs() {
  const rows = [];
  const windows = chrome.windows();
  for (let wi = 0; wi < windows.length; wi += 1) {
    const tabs = windows[wi].tabs();
    for (let ti = 0; ti < tabs.length; ti += 1) {
      rows.push({
        window: windows[wi],
        tab: tabs[ti],
        windowIndex: wi,
        tabIndex: ti,
        title: safeString(tabs[ti].title()),
        url: safeString(tabs[ti].url()),
      });
    }
  }
  return rows;
}

function findAnchorTab() {
  const tabs = listTabs();
  return tabs.filter(function isSouthPlusTab(item) {
    return /https?:\/\/[^/]*south-plus\./.test(item.url) || /https?:\/\/[^/]*(?:white|blue|north|level|soul|snow|spring|summer)-plus\./.test(item.url);
  })[0] || tabs[0] || null;
}

function findForumTab() {
  const tabs = listTabs();
  return tabs.filter(function isForumTab(item) {
    return /south-plus\.org\/thread\.php\?fid-9/.test(item.url);
  })[0] || null;
}

function activateTab(target) {
  if (!target || !target.window) return;
  try {
    target.window.activeTabIndex = target.tabIndex + 1;
    chrome.activate();
  } catch (error) {}
}

function openTemporaryTab(win, url, createdTabs) {
  const tab = chrome.Tab({ url });
  win.tabs.push(tab);
  const index = win.tabs().length - 1;
  win.activeTabIndex = index + 1;
  createdTabs.push(tab);
  waitFor(tab, 'document.readyState === "complete"', 15000);
  return tab;
}

function closeTemporaryTabs(createdTabs) {
  for (let index = createdTabs.length - 1; index >= 0; index -= 1) {
    try {
      createdTabs[index].close();
    } catch (error) {}
  }
}

function captureEnhancerStorage(tab) {
  return executeJson(tab, `(function(){
    const items = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.indexOf('spEnhancer:') === 0) items[key] = localStorage.getItem(key);
    }
    return JSON.stringify({ ok: true, items });
  })()`, 'capture storage');
}

function restoreEnhancerStorage(tab, snapshot) {
  const items = snapshot && snapshot.items ? snapshot.items : {};
  return executeJson(tab, `(function(){
    const items = JSON.parse(${JSON.stringify(JSON.stringify(items))});
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.indexOf('spEnhancer:') === 0) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
    Object.keys(items).forEach((key) => localStorage.setItem(key, items[key]));
    return JSON.stringify({ ok: true, restored: Object.keys(items).length, removed: keys.length });
  })()`, 'restore storage');
}

function buildPageScript(kind) {
  return `(function(){
    const out = { kind: ${JSON.stringify(kind)}, url: location.href, title: document.title, assertions: [], failures: [], warnings: [] };
    const q = (s, r=document) => r.querySelector(s);
    const qa = (s, r=document) => Array.from(r.querySelectorAll(s));
    const text = (el, limit) => {
      const value = (el && el.textContent || '').replace(/\\s+/g, ' ').trim();
      return limit ? value.slice(0, limit) : value;
    };
    const pass = (name, ok, detail) => {
      out.assertions.push({ name, ok: !!ok, detail: detail || '' });
      if (!ok) out.failures.push({ name, detail: detail || '' });
    };
    const warn = (name, detail) => out.warnings.push({ name, detail: detail || '' });

    out.viewport = { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth };
    out.counts = {
      toolbar: q('#spx-toolbar') ? 1 : 0,
      nav: q('#spx-module-nav') ? 1 : 0,
      navNodes: qa('.spx-module-nav-node').length,
      navActive: qa('.spx-module-nav-item.spx-active').length,
      dashboard: q('#spx-forum-dashboard-panel') ? 1 : 0,
      homeModules: qa('.spx-home-module,[data-spx-home-ready="1"]').length,
      searchForms: qa('form').length,
      taskSide: qa('.spx-task-side-block,.spx-task-side-stack').length,
      taskMain: qa('.spx-task-main-block,.spx-task-main-stack').length,
      profileTabs: qa('#spx-account-tabs a,.spx-account-tabs a,a[href*="action-topic"],a[href*="action-post"],a[href*="action-favor"]').length,
    };

    pass('工具栏存在', !!q('#spx-toolbar'), text(q('#spx-toolbar'), 120));
    pass('页面无横向溢出', document.documentElement.scrollWidth <= innerWidth + 2, 'scrollWidth=' + document.documentElement.scrollWidth + ', width=' + innerWidth);

    if (out.kind === 'home') {
      pass('首页导航中心存在', !!q('#spx-module-nav') && qa('.spx-module-nav-node').length > 0, JSON.stringify(out.counts));
      pass('首页论坛仪表盘存在', !!q('#spx-forum-dashboard-panel'), text(q('#spx-forum-dashboard-panel'), 220));
      pass('首页模块增强存在', qa('.spx-home-module').length > 0, JSON.stringify(out.counts));
    }

    if (out.kind === 'search') {
      pass('搜索页导航中心存在', !!q('#spx-module-nav') && qa('.spx-module-nav-node').length > 0, JSON.stringify(out.counts));
      pass('搜索页表单存在且未溢出', qa('form').length > 0 && document.documentElement.scrollWidth <= innerWidth + 2, JSON.stringify(out.counts));
    }

    if (out.kind === 'task') {
      const blocked = /Cloudflare|520|Just a moment|操作频繁|系统繁忙/i.test(document.title + ' ' + text(document.body, 500));
      if (blocked) warn('任务页可能被站点拦截', document.title + ' ' + text(document.body, 180));
      pass('任务页导航中心存在', !!q('#spx-module-nav') && qa('.spx-module-nav-node').length > 0, JSON.stringify(out.counts));
      pass('任务页侧栏与主栏布局存在', qa('.spx-task-side-block,.spx-task-side-stack').length > 0 && qa('.spx-task-main-block,.spx-task-main-stack').length > 0, JSON.stringify(out.counts));
    }

    if (out.kind === 'profile') {
      pass('个人页导航中心存在', !!q('#spx-module-nav') && qa('.spx-module-nav-node').length > 0, JSON.stringify(out.counts));
      pass('个人页账号导航或原站内容存在', out.counts.profileTabs > 0, JSON.stringify(out.counts));
    }

    return JSON.stringify(out);
  })()`;
}

function runSimplePage(win, url, kind, createdTabs) {
  const tab = openTemporaryTab(win, url, createdTabs);
  const toolbarReady = waitFor(tab, '!!document.querySelector("#spx-toolbar")', 12000);
  delay(0.5);
  const result = executeJson(tab, buildPageScript(kind), kind + ' page');
  result.toolbarReady = toolbarReady;
  return result;
}

function runForumSmoke(tab) {
  const ready = waitFor(tab, 'document.readyState === "complete" && !!document.querySelector("#spx-toolbar")', 12000);
  delay(0.4);
  const result = executeJson(tab, `(function(){
    const out = { kind: 'forum', url: location.href, title: document.title, assertions: [], failures: [], warnings: [] };
    const q = (s, r=document) => r.querySelector(s);
    const qa = (s, r=document) => Array.from(r.querySelectorAll(s));
    const text = (el, limit) => {
      const value = (el && el.textContent || '').replace(/\\s+/g, ' ').trim();
      return limit ? value.slice(0, limit) : value;
    };
    const visible = (el) => !!(el && !el.hidden && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
    const pass = (name, ok, detail) => {
      out.assertions.push({ name, ok: !!ok, detail: detail || '' });
      if (!ok) out.failures.push({ name, detail: detail || '' });
    };
    const warn = (name, detail) => out.warnings.push({ name, detail: detail || '' });

    out.viewport = { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth };
    const titleCells = qa('td[id^="td_"]').filter((td) => /^td_\\d+/.test(td.id) && q('a[id^="a_ajax_"]', td));
    const toolCells = titleCells.filter((td) => q('.spx-thread-tools', td));
    out.counts = {
      titleCells: titleCells.length,
      toolCells: toolCells.length,
      resourceBadges: qa('.spx-resource-badge').length,
      navNodes: qa('.spx-module-nav-node').length,
    };

    pass('工具栏存在', !!q('#spx-toolbar'), text(q('#spx-toolbar'), 120));
    pass('页面无横向溢出', document.documentElement.scrollWidth <= innerWidth + 2, 'scrollWidth=' + document.documentElement.scrollWidth + ', width=' + innerWidth);
    pass('论坛列表工具条存在', !!q('#spx-forum-tools'), text(q('#spx-forum-tools'), 160));
    pass('帖子行增强工具完整', titleCells.length > 0 && toolCells.length === titleCells.length, 'thread cells=' + titleCells.length + ', tools=' + toolCells.length);
    pass('行内工具包含核心动作', ['稍后','屏题','隐藏','收藏'].every((label) => text(q('.spx-thread-tools')).includes(label)), text(q('.spx-thread-tools'), 120));

    const filterInput = q('#spx-forum-tools input[type="search"]');
    if (filterInput && titleCells.length) {
      filterInput.value = '__spx_no_match_filter__';
      filterInput.dispatchEvent(new Event('input', { bubbles: true }));
      const hiddenAfterFilter = qa('tr.spx-filter-hidden').length;
      pass('列表临时过滤可隐藏主题', hiddenAfterFilter > 0, 'hidden=' + hiddenAfterFilter);
      filterInput.value = '';
      filterInput.dispatchEvent(new Event('input', { bubbles: true }));
      pass('列表过滤可清空恢复', qa('tr.spx-filter-hidden').length === 0, 'hidden=' + qa('tr.spx-filter-hidden').length);
    } else {
      pass('列表临时过滤可执行', false, 'filter input or thread rows missing');
    }

    const nav = q('#spx-module-nav');
    pass('导航中心存在', !!nav && qa('.spx-module-nav-node', nav || document).length > 0, text(nav, 180));
    pass('导航中心当前页高亮', qa('.spx-module-nav-item.spx-active', nav || document).length > 0, 'active=' + qa('.spx-module-nav-item.spx-active', nav || document).length);
    const firstGroupButton = q('.spx-module-nav-section[aria-expanded]', nav || document);
    if (firstGroupButton) {
      const beforeExpanded = firstGroupButton.getAttribute('aria-expanded');
      firstGroupButton.click();
      const collapsedExpanded = firstGroupButton.getAttribute('aria-expanded');
      firstGroupButton.click();
      const restoredExpanded = firstGroupButton.getAttribute('aria-expanded');
      pass('导航分组可折叠并恢复', beforeExpanded !== collapsedExpanded && restoredExpanded === beforeExpanded, beforeExpanded + ' -> ' + collapsedExpanded + ' -> ' + restoredExpanded);
    } else {
      pass('导航分组可折叠并恢复', false, 'no aria-expanded group button');
    }

    const toolboxButton = q('[data-spx-toolbox-button="1"]');
    if (toolboxButton) toolboxButton.click();
    const toolbox = q('#spx-toolbox');
    pass('工具箱可打开', !!toolbox && visible(toolbox), text(toolbox, 240));
    pass('工具箱仅保留页面导航和阅读模式分组', ['页面导航','阅读模式'].every((label) => text(toolbox).includes(label)) && !['我的中心','设置'].some((label) => text(toolbox).includes(label)), text(toolbox, 240));

    const settingsButton = q('[data-spx-settings-button="1"]');
    if (settingsButton) settingsButton.click();
    const settingsPanel = q('#spx-settings');
    pass('设置面板可打开且互斥隐藏工具箱', !!settingsPanel && visible(settingsPanel) && (!toolbox || toolbox.hidden === true), text(settingsPanel, 260));
    pass('设置面板包含关键设置', ['夜间模式','网络友好模式','自动购买低价帖子','数据健康','本地体积'].every((label) => text(settingsPanel).includes(label)), text(settingsPanel, 320));

    const commandButton = q('[data-spx-command-palette-button="1"]');
    if (commandButton) commandButton.click();
    const command = q('#spx-command-palette-overlay');
    pass('命令面板可打开且互斥隐藏设置', !!command && visible(command) && (!settingsPanel || settingsPanel.hidden === true), text(command, 260));
    pass('命令面板有分类和结果', ['全部','导航','我的中心','资源','设置','页面动作'].every((label) => qa('.spx-command-tab', command || document).some((tab) => text(tab) === label)) && qa('.spx-command-item', command || document).length > 0, text(command, 260));

    if (command) command.hidden = true;
    if (settingsPanel) settingsPanel.hidden = true;
    if (toolbox) toolbox.hidden = true;
    return JSON.stringify(out);
  })()`, 'forum smoke');
  result.ready = ready;
  return result;
}

function getReadTargetFromForum(tab) {
  return executeJson(tab, `(function(){
    const cells = Array.from(document.querySelectorAll('td[id^="td_"]')).filter((td) => /^td_\\d+/.test(td.id) && td.querySelector('a[id^="a_ajax_"]'));
    const isNormalThread = (td) => {
      const text = (td.textContent || '').replace(/\\s+/g, ' ').trim();
      return !/新人报道|版规|指南|长期招人|公告|规则|判罚|入门指南/i.test(text);
    };
    const normalCells = cells.filter(isNormalThread);
    const preferred = normalCells.find((td) => td.querySelector('.spx-resource-badge')) || normalCells[0] || cells[0];
    const link = preferred && preferred.querySelector('a[id^="a_ajax_"]');
    return JSON.stringify({
      ok: !!link,
      href: link ? link.href : '',
      title: link ? link.textContent.trim() : '',
      badges: preferred ? Array.from(preferred.querySelectorAll('.spx-resource-badge')).map((badge) => badge.textContent.trim()) : []
    });
  })()`, 'read target');
}

function runReadSmoke(win, forumTab, createdTabs) {
  const target = getReadTargetFromForum(forumTab);
  if (!target.ok || !target.href) {
    return { kind: 'read', assertions: [], failures: [{ name: '无法从论坛列表选择阅读页', detail: JSON.stringify(target) }], warnings: [] };
  }
  const tab = openTemporaryTab(win, target.href, createdTabs);
  const toolbarReady = waitFor(tab, '!!document.querySelector("#spx-toolbar")', 12000);
  delay(0.6);
  const result = executeJson(tab, `(function(){
    const out = { kind: 'read', source: ${JSON.stringify(target)}, url: location.href, title: document.title, assertions: [], failures: [], warnings: [] };
    const q = (s, r=document) => r.querySelector(s);
    const qa = (s, r=document) => Array.from(r.querySelectorAll(s));
    const text = (el, limit) => {
      const value = (el && el.textContent || '').replace(/\\s+/g, ' ').trim();
      return limit ? value.slice(0, limit) : value;
    };
    const visible = (el) => !!(el && !el.hidden && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
    const pass = (name, ok, detail) => {
      out.assertions.push({ name, ok: !!ok, detail: detail || '' });
      if (!ok) out.failures.push({ name, detail: detail || '' });
    };
    const warn = (name, detail) => out.warnings.push({ name, detail: detail || '' });

    out.viewport = { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth };
    const posts = qa('table.js-post');
    out.counts = { posts: posts.length, postTools: qa('.spx-post-tools').length, resourceRail: q('#spx-read-resource-rail') ? 1 : 0, previewPanel: q('#spx-preview-panel') ? 1 : 0 };
    pass('阅读页帖子加载', posts.length > 0, 'posts=' + posts.length);
    pass('阅读页工具栏存在', !!q('#spx-toolbar'), text(q('#spx-toolbar'), 120));
    pass('阅读页导航中心存在', !!q('#spx-module-nav') && qa('.spx-module-nav-node').length > 0, text(q('#spx-module-nav'), 200));
    pass('每个楼层有楼层工具', posts.length > 0 && qa('.spx-post-tools').length === posts.length, 'posts=' + posts.length + ', tools=' + qa('.spx-post-tools').length);
    pass('楼层工具包含核心动作', ['回复','屏蔽此人','复制链接','资源'].every((label) => text(q('.spx-post-tools')).includes(label)), text(q('.spx-post-tools'), 120));
    pass('正文未横向溢出视口', document.documentElement.scrollWidth <= innerWidth + 2, 'scrollWidth=' + document.documentElement.scrollWidth + ', width=' + innerWidth);

    const firstContent = q('table.js-post .tpc_content');
    if (firstContent) {
      const marker = document.createElement('p');
      marker.id = 'spx-automation-resource-fixture';
      marker.textContent = '自动化资源夹具 magnet:?xt=urn:btih:ABCDEF1234567890 pan.baidu.com/s/abc?pwd=1234 https://files.example.com/demo.torrent';
      firstContent.appendChild(marker);
    }
    const resourceButton = qa('.spx-post-tools button').find((button) => text(button) === '资源');
    if (resourceButton) resourceButton.click();
    const resourcePanel = q('#spx-resource-panel');
    pass('资源面板可打开', !!resourcePanel && visible(resourcePanel), text(resourcePanel, 320));
    pass('资源面板识别夹具资源', !!resourcePanel && ['磁力','百度网盘','种子'].every((label) => text(resourcePanel).includes(label)), text(resourcePanel, 360));

    const replyButton = qa('.spx-post-tools button').find((button) => text(button) === '回复');
    if (replyButton) replyButton.click();
    const quick = q('#spx-quick-reply');
    const editor = q('.spx-quick-reply-editor', quick || document);
    pass('快速回复可由楼层回复打开', !!quick && !quick.classList.contains('spx-quick-reply-collapsed'), text(quick, 260));
    pass('快速回复表情和常用语加载', qa('.spx-quick-reply-emote', quick || document).length >= 30 && qa('.spx-quick-reply-chip', quick || document).length >= 6, 'emotes=' + qa('.spx-quick-reply-emote', quick || document).length + ', chips=' + qa('.spx-quick-reply-chip', quick || document).length);
    pass('快速回复带楼层上下文', !!editor && /回 .* 的帖子/.test(editor.value), editor ? editor.value.slice(0, 100) : '');
    const minimize = q('.spx-quick-reply-icon', quick || document);
    if (minimize) minimize.click();
    pass('快速回复可最小化并显示继续入口', !!quick && quick.classList.contains('spx-quick-reply-collapsed') && q('#spx-quick-reply-launcher') && q('#spx-quick-reply-launcher').classList.contains('spx-visible'), 'collapsed=' + (!!quick && quick.classList.contains('spx-quick-reply-collapsed')));

    const toolboxButton = q('[data-spx-toolbox-button="1"]');
    if (toolboxButton) toolboxButton.click();
    const toolbox = q('#spx-toolbox');
    pass('阅读页工具箱包含阅读专属功能', !!toolbox && visible(toolbox) && ['只看楼主','阅读排版','夜间模式'].every((label) => text(toolbox).includes(label)) && !['资源工作台','最近浏览','我的中心','设置'].some((label) => text(toolbox).includes(label)), text(toolbox, 360));
    if (!q('#spx-preview-panel') && !text(toolbox).includes('预览图集')) warn('预览图集未形成实页断言', '当前测试帖可能没有候选图片');
    if (!q('#spx-read-resource-rail') && !q('#spx-read-resource-launcher')) warn('固定资源栏未形成实页断言', '当前帖子初始化时没有可识别资源，资源面板已用夹具验证');

    if (toolbox) toolbox.hidden = true;
    if (resourcePanel) resourcePanel.remove();
    const fixture = q('#spx-automation-resource-fixture');
    if (fixture) fixture.remove();
    return JSON.stringify(out);
  })()`, 'read smoke');
  result.toolbarReady = toolbarReady;
  return result;
}

function runHoverPreviewSmoke(tab) {
  const quickStart = executeJson(tab, `(function(){
    const old = document.querySelector('#spx-preview-popover');
    if (old) old.remove();
    const link = Array.from(document.querySelectorAll('td[id^="td_"] a[id^="a_ajax_"]')).filter((item) => item.href)[0];
    if (!link) return JSON.stringify({ ok: false, error: 'NO_THREAD_LINK' });
    link.dataset.spxSmokeHoverCancel = '1';
    link.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false, clientX: 720, clientY: 320, view: window }));
    window.setTimeout(() => link.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false, view: window })), 80);
    return JSON.stringify({ ok: true, title: link.textContent.trim(), href: link.href });
  })()`, 'hover quick start');
  delay(1.4);
  const quickResult = executeJson(tab, `(function(){
    const panel = document.querySelector('#spx-preview-popover');
    const out = { ok: true, panelExists: !!panel, panelText: panel ? panel.textContent.replace(/\\s+/g, ' ').trim().slice(0, 260) : '' };
    if (panel) panel.remove();
    document.querySelectorAll('[data-spx-smoke-hover-cancel]').forEach((node) => delete node.dataset.spxSmokeHoverCancel);
    return JSON.stringify(out);
  })()`, 'hover quick result');

  const fullStart = executeJson(tab, `(function(){
    const old = document.querySelector('#spx-preview-popover');
    if (old) old.remove();
    const isNormalThread = (link) => {
      const rowText = (link.closest('tr') && link.closest('tr').textContent || link.textContent || '').replace(/\\s+/g, ' ').trim();
      return !/新人报道|版规|指南|长期招人|公告|规则|判罚|入门指南/i.test(rowText);
    };
    const links = Array.from(document.querySelectorAll('td[id^="td_"] a[id^="a_ajax_"]')).filter((item) => item.href);
    const link = links.find(isNormalThread) || links[2] || links[0];
    if (!link) return JSON.stringify({ ok: false, error: 'NO_THREAD_LINK' });
    link.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false, clientX: 700, clientY: 300, view: window }));
    return JSON.stringify({ ok: true, title: link.textContent.trim(), href: link.href });
  })()`, 'hover full start');
  delay(6.0);
  const fullResult = executeJson(tab, `(function(){
    const panel = document.querySelector('#spx-preview-popover');
    const out = {
      ok: true,
      panelExists: !!panel,
      panelText: panel ? panel.textContent.replace(/\\s+/g, ' ').trim().slice(0, 600) : '',
      imageCount: panel ? panel.querySelectorAll('img').length : 0,
      lazyImageCount: panel ? panel.querySelectorAll('img[data-spx-preview-lazy-src]').length : 0
    };
    if (panel) panel.remove();
    return JSON.stringify(out);
  })()`, 'hover full result');

  const out = { kind: 'hoverPreview', assertions: [], failures: [], warnings: [], quickStart, quickResult, fullStart, fullResult };
  function pass(name, ok, detail) {
    out.assertions.push({ name, ok: !!ok, detail: detail || '' });
    if (!ok) out.failures.push({ name, detail: detail || '' });
  }
  function warn(name, detail) {
    out.warnings.push({ name, detail: detail || '' });
  }
  pass('快速扫过不会弹出预览', quickStart.ok !== false && quickResult.panelExists === false, JSON.stringify({ quickStart, quickResult }));
  if (fullResult.panelExists && !/加载中/.test(fullResult.panelText)) {
    pass('正常悬停可生成预览弹层', true, fullResult.panelText.slice(0, 240));
  } else {
    warn('正常悬停预览未形成强断言', JSON.stringify({ fullStart, fullResult }).slice(0, 500));
  }
  return out;
}

function run() {
  const report = {
    ok: true,
    startedAt: nowIso(),
    environment: {
      runner: 'tests/browser-smoke.js',
      browser: 'Google Chrome via AppleScript/JXA',
      siteOrigin: SITE_ORIGIN,
    },
    scenarios: [],
    storage: {},
  };

  if (!chrome.running()) {
    report.ok = false;
    report.error = 'Google Chrome 未运行，请先打开已安装 South Plus +++ 的 Chrome。';
    report.finishedAt = nowIso();
    return report;
  }

  const anchor = findAnchorTab();
  if (!anchor) {
    report.ok = false;
    report.error = '未找到可用 Chrome 窗口。';
    report.finishedAt = nowIso();
    return report;
  }

  const createdTabs = [];
  let forumTarget = findForumTab();
  let storageSnapshot = null;
  try {
    const win = anchor.window;
    if (!forumTarget) {
      const forumTab = openTemporaryTab(win, FORUM_URL, createdTabs);
      forumTarget = { window: win, tab: forumTab, windowIndex: anchor.windowIndex, tabIndex: win.tabs().length - 1, title: safeString(forumTab.title()), url: safeString(forumTab.url()) };
    }
    activateTab(forumTarget);
    waitFor(forumTarget.tab, 'document.readyState === "complete"', 15000);
    storageSnapshot = captureEnhancerStorage(forumTarget.tab);
    report.storage.capturedKeys = storageSnapshot && storageSnapshot.items ? Object.keys(storageSnapshot.items).length : 0;

    report.scenarios.push(runForumSmoke(forumTarget.tab));
    report.scenarios.push(runReadSmoke(win, forumTarget.tab, createdTabs));
    report.scenarios.push(runHoverPreviewSmoke(forumTarget.tab));
    report.scenarios.push(runSimplePage(win, SITE_ORIGIN + '/index.php', 'home', createdTabs));
    report.scenarios.push(runSimplePage(win, SITE_ORIGIN + '/search.php', 'search', createdTabs));
    report.scenarios.push(runSimplePage(win, SITE_ORIGIN + '/hack.php?H_name=tasks', 'task', createdTabs));
    report.scenarios.push(runSimplePage(win, SITE_ORIGIN + '/u.php?action-favor.html', 'profile', createdTabs));

    report.storage.restore = restoreEnhancerStorage(forumTarget.tab, storageSnapshot);
  } catch (error) {
    report.ok = false;
    report.error = safeString(error && (error.stack || error.message || error));
  } finally {
    if (storageSnapshot && forumTarget && forumTarget.tab && !report.storage.restore) {
      try {
        report.storage.restore = restoreEnhancerStorage(forumTarget.tab, storageSnapshot);
      } catch (error) {
        report.storage.restore = { ok: false, error: safeString(error && (error.message || error)) };
      }
    }
    closeTemporaryTabs(createdTabs);
    try {
      activateTab(anchor);
    } catch (error) {}
  }

  let assertionCount = 0;
  let failureCount = 0;
  let warningCount = 0;
  report.scenarios.forEach(function collectScenarioStats(scenario) {
    assertionCount += (scenario.assertions || []).length;
    failureCount += (scenario.failures || []).length;
    warningCount += (scenario.warnings || []).length;
  });
  report.summary = { scenarios: report.scenarios.length, assertions: assertionCount, failures: failureCount, warnings: warningCount };
  report.ok = report.ok && failureCount === 0;
  report.finishedAt = nowIso();
  return report;
}

(function stringifySmokeReport() {
  let output;
  try {
    output = JSON.stringify(run(), null, 2);
  } catch (error) {
    output = JSON.stringify({
      ok: false,
      startedAt: nowIso(),
      finishedAt: nowIso(),
      error: safeString(error && (error.stack || error.message || error)),
      scenarios: [],
      summary: { scenarios: 0, assertions: 0, failures: 1, warnings: 0 },
    }, null, 2);
  }
  console.log(output);
  return 'SPX_BROWSER_SMOKE_DONE';
})()
*/}).replace(/^function\s+jxaSource\s*\(\)\s*\{\/\*/, '').replace(/\*\/\}$/, '');

function parseArgs(argv) {
  return {
    json: argv.includes('--json'),
  };
}

function runJxa() {
  const child = spawnSync('osascript', ['-l', 'JavaScript'], {
    input: JXA_SOURCE,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });

  if (child.error) {
    throw child.error;
  }

  const report = parseReportOutput(child.stderr) || parseReportOutput(child.stdout);
  if (report) return report;

  if (child.status !== 0) {
    const detail = (child.stderr || child.stdout || '').trim();
    throw new Error(detail || 'osascript exited with status ' + child.status);
  }

  const output = String(child.stdout || '').trim();
  if (!output) throw new Error('osascript did not return a report');
  return JSON.parse(output);
}

function parseReportOutput(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch (error) {
    return null;
  }
}

function scenarioStatus(scenario) {
  const failures = (scenario.failures || []).length;
  if (failures) return 'FAIL';
  if ((scenario.warnings || []).length) return 'WARN';
  return 'PASS';
}

function formatScenarioName(kind) {
  return {
    forum: '论坛列表页',
    hoverPreview: '悬停预览',
    read: '阅读页',
    home: '首页',
    search: '搜索页',
    task: '任务页',
    profile: '个人收藏页',
  }[kind] || kind || '未知场景';
}

function formatMarkdown(report) {
  const lines = [];
  const summary = report.summary || { scenarios: 0, assertions: 0, failures: 0, warnings: 0 };
  lines.push('# South Plus +++ 浏览器冒烟测试报告');
  lines.push('');
  lines.push('- 结果：' + (report.ok ? '通过' : '失败'));
  lines.push('- 开始时间：' + (report.startedAt || '-'));
  lines.push('- 结束时间：' + (report.finishedAt || '-'));
  lines.push('- 场景数：' + summary.scenarios);
  lines.push('- 断言数：' + summary.assertions);
  lines.push('- 失败数：' + summary.failures);
  lines.push('- 警告数：' + summary.warnings);

  if (report.error) {
    lines.push('');
    lines.push('## 运行错误');
    lines.push('');
    lines.push('```text');
    lines.push(report.error);
    lines.push('```');
  }

  lines.push('');
  lines.push('## 场景明细');
  (report.scenarios || []).forEach((scenario) => {
    lines.push('');
    lines.push('### [' + scenarioStatus(scenario) + '] ' + formatScenarioName(scenario.kind));
    if (scenario.url) lines.push('- URL：' + scenario.url);
    if (scenario.title) lines.push('- 标题：' + scenario.title);
    if (scenario.viewport) lines.push('- 视口：' + scenario.viewport.width + 'x' + scenario.viewport.height + '，scrollWidth=' + scenario.viewport.scrollWidth);
    if (scenario.counts) lines.push('- 计数：`' + JSON.stringify(scenario.counts) + '`');
    (scenario.assertions || []).forEach((assertion) => {
      lines.push('- ' + (assertion.ok ? '[PASS] ' : '[FAIL] ') + assertion.name + (assertion.detail ? '：' + assertion.detail : ''));
    });
    (scenario.warnings || []).forEach((warning) => {
      lines.push('- [WARN] ' + warning.name + (warning.detail ? '：' + warning.detail : ''));
    });
  });

  lines.push('');
  lines.push('## 说明');
  lines.push('- 脚本连接当前 macOS Google Chrome，通过已登录 SouthPlus 标签页或临时测试标签执行检查。');
  lines.push('- 测试结束会恢复 `spEnhancer:*` localStorage 快照，并关闭脚本打开的临时标签页。');
  lines.push('- 不会提交回复、购买帖子、删除收藏或执行真实下载；这些仍属于人工授权测试范围。');
  lines.push('- 若 Chrome 拒绝脚本执行，请在 Chrome 菜单启用 `View > Developer > Allow JavaScript from Apple Events`。');
  return lines.join('\n');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  let report;
  try {
    report = runJxa();
  } catch (error) {
    report = {
      ok: false,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      error: error && (error.stack || error.message) || String(error),
      scenarios: [],
      summary: { scenarios: 0, assertions: 0, failures: 1, warnings: 0 },
    };
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatMarkdown(report));
  }

  if (!report.ok) process.exitCode = 1;
}

main();

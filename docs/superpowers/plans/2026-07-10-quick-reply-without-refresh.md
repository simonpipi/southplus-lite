# 快捷回复无刷新提交 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 点击快捷回复后通过原回复表单提交内容，并局部更新当前帖子页面，不触发整页刷新。

**Architecture:** 在现有单文件用户脚本中增加两个可独立测试的边界：一个负责从原表单构建请求，另一个负责串联“提交回复 -> 重新读取当前帖子 -> 应用 HTML”。页面层仅负责编辑器写入、按钮锁定、错误提示和调用现有 `replaceReadPageContent`，无法使用 `fetch` 时回退原生提交。

**Tech Stack:** 原生 JavaScript、Tampermonkey/Violentmonkey 用户脚本 API、浏览器 `fetch`/`FormData`/`DOMParser`、Node.js `assert`

---

### Task 1: 为请求构建和异步提交编排增加失败测试

**Files:**
- Modify: `southplus_enhancer.test.js`
- Test: `southplus_enhancer.test.js`

- [ ] **Step 1: 在现有同步断言后增加可观测的表单数据替身**

在 `console.log('southplus_enhancer tests passed');` 前加入：

```javascript
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
```

- [ ] **Step 2: 编写请求构建失败测试**

继续加入：

```javascript
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
```

- [ ] **Step 3: 编写成功刷新、重复提交和失败恢复测试**

将文件末尾的成功日志改为异步测试入口：

```javascript
async function testQuickReplySubmissionFlow() {
  const request = {
    url: 'https://south-plus.org/post.php?action=reply',
    options: { method: 'POST' },
  };
  const calls = [];
  let pending = false;
  let appliedHtml = '';

  const success = await enhancer.performQuickReplySubmit({
    request,
    pageUrl: 'https://south-plus.org/read.php?tid=123',
    fetch: async function fetchStub(url) {
      calls.push(url);
      return {
        ok: true,
        text: async function textStub() {
          return '<main id="main">new reply</main>';
        },
      };
    },
    isPending: function isPending() {
      return pending;
    },
    setPending: function setPending(value) {
      pending = value;
    },
    applyHtml: function applyHtml(html) {
      appliedHtml = html;
      return true;
    },
  });

  assert.equal(success, true);
  assert.deepEqual(calls, [
    'https://south-plus.org/post.php?action=reply',
    'https://south-plus.org/read.php?tid=123',
  ]);
  assert.equal(appliedHtml, '<main id="main">new reply</main>');
  assert.equal(pending, false);

  pending = true;
  const duplicate = await enhancer.performQuickReplySubmit({
    request,
    pageUrl: 'https://south-plus.org/read.php?tid=123',
    fetch: async function unexpectedFetch() {
      throw new Error('重复提交不应发送请求');
    },
    isPending: function isPending() {
      return pending;
    },
    setPending: function setPending(value) {
      pending = value;
    },
    applyHtml: function applyHtml() {
      return true;
    },
  });
  assert.equal(duplicate, false);
  assert.equal(pending, true);

  pending = false;
  let capturedError = null;
  const failed = await enhancer.performQuickReplySubmit({
    request,
    pageUrl: 'https://south-plus.org/read.php?tid=123',
    fetch: async function failedFetch() {
      throw new Error('network failed');
    },
    isPending: function isPending() {
      return pending;
    },
    setPending: function setPending(value) {
      pending = value;
    },
    applyHtml: function applyHtml() {
      return true;
    },
    onError: function onError(error) {
      capturedError = error;
    },
  });

  assert.equal(failed, false);
  assert.equal(capturedError.message, 'network failed');
  assert.equal(pending, false);
}

testQuickReplySubmissionFlow()
  .then(function reportSuccess() {
    console.log('southplus_enhancer tests passed');
  })
  .catch(function reportFailure(error) {
    console.error(error);
    process.exitCode = 1;
  });
```

- [ ] **Step 4: 运行测试并确认因缺少新 API 而失败**

Run: `node southplus_enhancer.test.js`

Expected: FAIL，错误包含 `enhancer.createQuickReplyRequest is not a function`。

### Task 2: 实现可测试的请求构建与提交编排

**Files:**
- Modify: `southplus_enhancer.user.js:1896-1930`
- Modify: `southplus_enhancer.user.js:2480-2520`
- Test: `southplus_enhancer.test.js`

- [ ] **Step 1: 在快捷回复函数区域增加请求构建函数**

在 `insertTextIntoEditor` 后加入：

```javascript
function createQuickReplyRequest(form, submitter, pageUrl, FormDataCtor) {
  if (!form || typeof FormDataCtor !== 'function') return null;
  var method = String(form.method || 'post').toUpperCase();
  if (method !== 'POST') return null;

  var formData = new FormDataCtor(form);
  if (
    submitter &&
    submitter.name &&
    typeof formData.append === 'function' &&
    (!formData.has || !formData.has(submitter.name))
  ) {
    formData.append(submitter.name, submitter.value || '');
  }

  return {
    url: new URL(form.action || pageUrl, pageUrl).href,
    options: {
      method: method,
      body: formData,
      credentials: 'include',
      redirect: 'follow',
      cache: 'no-store',
    },
  };
}
```

- [ ] **Step 2: 增加异步编排函数**

紧接请求构建函数加入：

```javascript
function performQuickReplySubmit(options) {
  var config = options || {};
  if (
    !config.request ||
    typeof config.fetch !== 'function' ||
    typeof config.applyHtml !== 'function'
  ) {
    return Promise.resolve(false);
  }
  if (config.isPending && config.isPending()) return Promise.resolve(false);
  if (config.setPending) config.setPending(true);

  return config.fetch(config.request.url, config.request.options)
    .then(function verifySubmitResponse(response) {
      if (!response || !response.ok) throw new Error('快捷回复提交失败');
      return config.fetch(config.pageUrl, {
        credentials: 'include',
        cache: 'no-store',
      });
    })
    .then(function verifyRefreshResponse(response) {
      if (!response || !response.ok) throw new Error('重新加载帖子失败');
      return response.text();
    })
    .then(function applyRefreshedPage(html) {
      if (!config.applyHtml(html)) throw new Error('无法更新帖子内容');
      return true;
    })
    .catch(function handleQuickReplyError(error) {
      if (config.onError) config.onError(error);
      return false;
    })
    .finally(function clearQuickReplyPending() {
      if (config.setPending) config.setPending(false);
    });
}
```

- [ ] **Step 3: 导出两个测试 API**

在返回对象中加入：

```javascript
createQuickReplyRequest: createQuickReplyRequest,
performQuickReplySubmit: performQuickReplySubmit,
```

- [ ] **Step 4: 运行测试并确认纯流程通过**

Run: `node southplus_enhancer.test.js`

Expected: PASS，输出 `southplus_enhancer tests passed`。

- [ ] **Step 5: 提交纯流程与测试**

```bash
git add southplus_enhancer.user.js southplus_enhancer.test.js
git commit -m "test: 覆盖快捷回复无刷新流程"
```

### Task 3: 将快捷回复按钮接入无刷新流程

**Files:**
- Modify: `southplus_enhancer.user.js:704-710`
- Modify: `southplus_enhancer.user.js:1896-1978`
- Modify: `southplus_enhancer.user.js:2450-2465`
- Test: `southplus_enhancer.test.js`

- [ ] **Step 1: 保留原生提交作为兼容回退**

将现有 `submitQuickReply` 重命名为 `submitQuickReplyNative`，函数体保持原样。

- [ ] **Step 2: 增加面板状态控制**

在原生提交函数后加入：

```javascript
function setQuickReplyPending(panel, pending) {
  if (!panel) return;
  panel.dataset.spxQuickReplyPending = pending ? '1' : '';
  qsa('button', panel).forEach(function toggleQuickReplyButton(button) {
    button.disabled = !!pending;
  });

  var status = qs('.spx-quick-reply-status', panel);
  if (pending && status) {
    status.classList.remove('spx-error');
    status.textContent = '正在提交并更新帖子…';
  }
}

function setQuickReplyError(panel) {
  if (!panel) return;
  var status = qs('.spx-quick-reply-status', panel);
  if (!status) return;
  status.classList.add('spx-error');
  status.textContent = '提交失败，内容已保留，请重试。';
}
```

- [ ] **Step 3: 实现页面层提交函数**

加入：

```javascript
function submitQuickReply(editor, settings, state) {
  if (!editor) return false;
  var form = editor.closest && editor.closest('form');
  var submitter = form && (
    qs('input[type="submit"]', form) ||
    qs('button[type="submit"]', form) ||
    qs('input[name="submit"]', form) ||
    qs('button[name="submit"]', form)
  );
  var panel = qs('#spx-quick-reply');
  var fetchImpl = typeof window !== 'undefined' && window.fetch
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
    return submitQuickReplyNative(editor);
  }

  return performQuickReplySubmit({
    request: request,
    pageUrl: location.href,
    fetch: fetchImpl,
    isPending: function isPending() {
      return !!(panel && panel.dataset.spxQuickReplyPending === '1');
    },
    setPending: function setPending(pending) {
      setQuickReplyPending(panel, pending);
    },
    applyHtml: function applyHtml(html) {
      return replaceReadPageContent(html, settings, state);
    },
    onError: function onError() {
      setQuickReplyError(panel);
    },
  });
}
```

- [ ] **Step 4: 将设置和状态传入按钮回调**

修改签名与调用：

```javascript
function createQuickReplyPanel(settings, editor, state) {
```

```javascript
header.appendChild(createEl(
  'span',
  'spx-quick-reply-status',
  '点击语句后自动提交，无刷新展示'
));
```

```javascript
button.addEventListener('click', function useQuickReply() {
  if (insertTextIntoEditor(editor, reply)) {
    submitQuickReply(editor, settings, state);
  }
});
```

```javascript
function enhanceQuickReply(settings, state) {
```

```javascript
var panel = createQuickReplyPanel(settings, editor, state);
```

```javascript
enhanceQuickReply(settings, state);
```

- [ ] **Step 5: 增加提交中和错误状态样式**

在快捷回复 CSS 后加入：

```javascript
'.spx-quick-reply button:disabled{cursor:wait;opacity:.55;}',
'.spx-quick-reply-status.spx-error{color:#b91c1c;font-weight:600;}',
```

- [ ] **Step 6: 修正设置说明并更新版本号**

将用户脚本版本从 `0.0.3` 更新为 `0.0.4`，并把设置帮助文本修改为：

```html
<div class="spx-help">帖子详情页或回复页会显示为快捷按钮；点击后自动提交，帖子页会无刷新展示新回复。</div>
```

- [ ] **Step 7: 运行测试与语法检查**

Run: `node southplus_enhancer.test.js`

Expected: PASS，输出 `southplus_enhancer tests passed`。

Run: `node --check southplus_enhancer.user.js`

Expected: 退出码为 `0`，无语法错误输出。

- [ ] **Step 8: 提交页面集成**

```bash
git add southplus_enhancer.user.js
git commit -m "feat: 快捷回复后无刷新展示"
```

### Task 4: 更新文档并完成回归检查

**Files:**
- Modify: `README.md:59-65`
- Modify: `docs/superpowers/plans/2026-07-10-quick-reply-without-refresh.md`
- Test: `southplus_enhancer.test.js`

- [ ] **Step 1: 更新功能说明**

将 README 的快捷回复说明改为：

```markdown
- 快捷回复：在帖子页或回复页展示常用回复按钮。
- 自定义回复语句：可在设置面板中编辑快捷回复列表，每行一条。
- 无刷新提交：点击快捷回复后自动提交，并在帖子页局部加载服务端最新内容。
```

- [ ] **Step 2: 执行完整验证**

Run: `node southplus_enhancer.test.js`

Expected: PASS，输出 `southplus_enhancer tests passed`。

Run: `node --check southplus_enhancer.user.js`

Expected: 退出码为 `0`。

Run: `git diff --check`

Expected: 退出码为 `0`，无空白错误。

Run: `git status --short`

Expected: 仅显示本次 README 和计划跟踪改动，或工作区为空。

- [ ] **Step 3: 提交文档和计划完成状态**

```bash
git add README.md docs/superpowers/plans/2026-07-10-quick-reply-without-refresh.md
git commit -m "docs: 更新快捷回复行为说明"
```

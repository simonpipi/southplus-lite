const assert = require('node:assert/strict');
const enhancer = require('./southplus_enhancer.user.js');

assert.equal(enhancer.parsePostPrice('本帖售价：5 SP币'), 5);
assert.equal(enhancer.parsePostPrice('购买需要 12.5 SP'), 12.5);
assert.equal(enhancer.parsePostPrice('此帖售价 1 SP币,已有 306 人购买'), 1);
assert.equal(enhancer.parsePostPrice('普通帖子内容'), null);

assert.equal(enhancer.parseUserSpBalance('当前拥有 30 SP币'), 30);
assert.equal(enhancer.parseUserSpBalance('SP余额：8.5'), 8.5);
assert.equal(enhancer.parseUserSpBalance('SP币: 34'), 34);
assert.equal(enhancer.parseUserSpBalance('本帖售价：5 SP币'), null);

assert.equal(
  enhancer.extractBuyTopicUrl(
    "location.href='job.php?action=buytopic&tid=2904409&pid=tpc&verify=77492139'",
    'https://south-plus.org/read.php?tid=2904409'
  ),
  'https://south-plus.org/job.php?action=buytopic&tid=2904409&pid=tpc&verify=77492139'
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

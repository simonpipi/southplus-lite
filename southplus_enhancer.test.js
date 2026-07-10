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

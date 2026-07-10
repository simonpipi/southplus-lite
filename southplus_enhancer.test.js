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

console.log('southplus_enhancer tests passed');

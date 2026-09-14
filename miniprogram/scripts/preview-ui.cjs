// Static visual approximation of native templates. No app data or runtime API access.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const root = path.join(__dirname, '../miniprogram');
const output = path.join(__dirname, '../design-preview');
const escape = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const expression = (value, data) => vm.runInNewContext(value.replace(/^{{|}}$/g, ''), data, { timeout: 50 });
const interpolate = (value, data) => value.replace(/{{([\s\S]*?)}}/g, (_, code) => escape(expression(code, data)));
function parse(source) {
  const root = { children: [] }; const stack = [root];
  const tokens = source.match(/<\/?[a-zA-Z][\w:-]*(?:"[^"]*"|'[^']*'|[^'">])*\/?>|[^<]+|</g) || [];
  for (const token of tokens) {
    if (token.startsWith('</')) { stack.pop(); continue; }
    if (!/^<[a-zA-Z]/.test(token)) { stack[stack.length - 1].children.push({ text: token }); continue; }
    const tag = token.match(/^<([\w:-]+)/)[1]; const attrs = {};
    for (const match of token.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[match[1]] = match[2];
    const node = { tag, attrs, children: [] }; stack[stack.length - 1].children.push(node);
    if (!token.endsWith('/>')) stack.push(node);
  }
  return root.children;
}
function render(nodes, data) {
  let branch = false; let result = '';
  for (const node of nodes) {
    if (node.text !== undefined) { result += interpolate(node.text, data); continue; }
    const attrs = node.attrs;
    if ('wx:if' in attrs) { branch = !!expression(attrs['wx:if'], data); if (!branch) continue; }
    else if ('wx:elif' in attrs) { if (branch) continue; branch = !!expression(attrs['wx:elif'], data); if (!branch) continue; }
    else if ('wx:else' in attrs || node.elseBranch) { if (branch) continue; branch = true; }
    if (attrs['wx:for']) {
      const list = expression(attrs['wx:for'], data); const child = { ...node, attrs: { ...attrs } }; delete child.attrs['wx:for'];
      result += list.map((item, index) => render([child], { ...data, item, index })).join(''); continue;
    }
    if (node.tag === 'block') { result += render(node.children, data); continue; }
    const tag = ({ view: 'div', text: 'span', picker: 'div', slider: 'input' })[node.tag] || node.tag;
    let properties = '';
    for (const [name, value] of Object.entries(attrs)) {
      if (name.startsWith('wx:') || /^(bind|catch|hover|range|block-color|activeColor|backgroundColor)/.test(name)) continue;
      if (name === 'disabled' && !expression(value, data)) continue;
      properties += ' ' + name + '="' + interpolate(value, data) + '"';
    }
    if (node.tag === 'slider') properties += ' type="range"';
    result += '<' + tag + properties + '>' + (tag === 'input' ? '' : render(node.children, data) + '</' + tag + '>');
  }
  return result;
}
const triggers = ['压力', '饭后', '饮酒', '社交递烟', '无聊', '习惯性想抽', '情绪不好', '其他'].map((label, i) => ({ label, value: String(i), selected: i === 1 }));
const pages = {
  index: { ready: true, showTrend: false, error: '', summary: { profile: { quitStatus: 'not_started' }, activeId: '', statusText: '准备好再出发', todayCount: 3, survivedCount: 3, savings: '—', checkedIn: false, hasTrend: false } },
  onboarding: { ready: true, step: 0, error: '', saving: false, form: { cigarettesPerDay: 10, smokingYears: 5, minutesToFirstCigarette: 30, quitAttempts: 2, motivation: '想陪家人走得更远', quitStatus: 'reducing', quitDate: '2026-09-20', cigarettePackPrice: 30, cigarettesPerPack: 20 }, options: triggers, statuses: [{ label: '正在减量' }], statusIndex: 0 },
  'craving-start': { ready: true, score: 7, trigger: '1', triggers, showContext: false, saving: false, error: '' },
  intervention: { event: { safety: false, stepIndex: 0, steps: [1, 2] }, title: '把注意力带回眼前', message: '依次找出你看到的 3 样东西，把注意力带回眼前。先给自己一点空间。', clock: '0:48', remaining: 48, last: false, error: '' },
  result: { ready: true, before: 7, score: 5, outcome: 'not_smoked', feedback: '', showFeedback: false, completed: false, saving: false, error: '', outcomes: [{ value: 'not_smoked', label: '这次没有抽' }, { value: 'smoked', label: '这次抽了' }, { value: 'unknown', label: '还不确定' }] },
};
pages['onboarding-triggers'] = { ...pages.onboarding, step: 1 };
pages['onboarding-plan'] = { ...pages.onboarding, step: 2 };
pages['result-completed'] = { ...pages.result, completed: true };
pages['result-feedback'] = { ...pages.result, showFeedback: true, feedback: '喝水和慢慢呼吸有帮助' };
pages['craving-context'] = { ...pages['craving-start'], showContext: true, context: '刚结束会议' };
pages['intervention-wave'] = { ...pages.intervention, title: '先观察这一阵烟瘾', message: '先不决定抽不抽，只观察这股烟瘾像浪一样起落。不需要立刻做出回应。', clock: '1:20', remaining: 80 };
pages['intervention-last'] = { ...pages.intervention, event: { safety: false, stepIndex: 1, steps: [1, 2] }, title: '把决定放到稍后', message: '把香烟和打火机放到够不到的位置。选一件两分钟能完成的小事，做完再看烟瘾是否还在。', clock: '0:00', remaining: 0, last: true };
pages['intervention-safety'] = { ...pages.intervention, event: { safety: true }, title: '请先处理身体不适', message: '请停止普通戒烟练习，立即联系当地急救或尽快就医；不要独自等待症状过去。' };
const templates = { 'onboarding-triggers': 'onboarding', 'onboarding-plan': 'onboarding', 'result-completed': 'result', 'result-feedback': 'result', 'craving-context': 'craving-start' };
pages['home-new'] = { ...pages.index, summary: { ...pages.index.summary, profile: null } };
pages['home-trend'] = { ...pages.index, showTrend: true, summary: { ...pages.index.summary, hasTrend: true, trend: [4, 6, 0, 5, 3, 2, 3].map((value, i) => ({ date: String(i), value, height: Math.max(3, value * 8), label: i === 6 ? '今天' : '9/' + (8 + i), current: i === 6 })) } };
pages['home-quit'] = { ...pages.index, summary: { ...pages.index.summary, profile: { quitStatus: 'quit' }, statusText: '正在坚持戒烟', days: 15, savings: '225.00', checkedIn: true, activeId: 'preview' } };
for (const variant of ['home-new', 'home-trend', 'home-quit']) templates[variant] = 'index';
for (const variant of ['intervention-wave', 'intervention-last', 'intervention-safety']) templates[variant] = 'intervention';
fs.mkdirSync(output, { recursive: true });
for (const [page, data] of Object.entries(pages)) {
  const template = templates[page] || page;
  // Normalize WXML boolean else attribute to make the tiny parser deterministic.
  const source = fs.readFileSync(path.join(root, 'pages', template, 'index.wxml'), 'utf8').replace(/wx:else(?=[\s>])/g, 'wx:else="true"');
  const css = (fs.readFileSync(path.join(root, 'app.wxss'), 'utf8') + fs.readFileSync(path.join(root, 'pages', template, 'index.wxss'), 'utf8')).replace(/(?<![.\w-])page\b/g, 'body').replace(/\bview\b/g, 'div').replace(/\btext(?=\s*\{)/g, 'span').replace(/\bslider\b/g, 'input[type=range]');
  const html = '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>原生 UI 排版预览</title><style>body{margin:0}button,input,textarea{font:inherit}button{border:0;cursor:pointer}input[type=range]{width:100%;accent-color:#246b50}.native-nav{text-align:center;font-size:15px;font-weight:600;padding:18px 0 8px;color:#294333}.preview-note{font-size:11px;text-align:center;padding:20px;color:#64756b}' + css + '</style><body><div class="native-nav">戒烟伙伴</div>' + render(parse(source), data) + '<div class="preview-note">浏览器排版近似预览 · 示例数据 · 非微信运行截图<br>' + Object.keys(pages).map(p => '<a href="/' + p + '.html">' + p + '</a>').join(' · ') + '</div></body></html>';
  fs.writeFileSync(path.join(output, page + '.html'), html);
}
if (process.argv.includes('--serve')) http.createServer((req, res) => {
  const name = path.basename((req.url || '/index.html').split('?')[0]);
  const file = path.join(output, Object.hasOwn(pages, name.replace('.html', '')) ? name : 'index.html');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(fs.readFileSync(file));
}).listen(3100, '127.0.0.1', () => console.log('UI preview: http://127.0.0.1:3100/index.html'));

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '../miniprogram');
function environment() {
  const memory = new Map(); const cache = new Map(); const navigations = [];
  let now = Date.parse('2026-09-14T06:00:00Z'); let failWrites = false;
  const copy = v => JSON.parse(JSON.stringify(v));
  const wx = {
    getStorageSync: key => memory.has(key) ? copy(memory.get(key)) : '',
    setStorageSync: (key, value) => { if (failWrites) throw new Error('Storage full'); memory.set(key, copy(value)); },
    removeStorageSync: key => memory.delete(key),
    reLaunch: args => navigations.push(args.url), navigateTo: args => navigations.push(args.url),
    redirectTo: args => navigations.push(args.url), pageScrollTo: () => {},
  };
  function load(file, page = false) {
    const filename = path.resolve(root, file);
    if (!page && cache.has(filename)) return cache.get(filename);
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const module = { exports: {} }; let instance;
    vm.runInNewContext(compiled, {
      module, exports: module.exports, wx, Date: class extends Date { static now() { return now; } },
      setInterval: () => 1, clearInterval: () => {},
      require: name => load(path.relative(root, path.resolve(path.dirname(filename), name + '.ts'))),
      Page: definition => { instance = definition; instance.data = copy(definition.data || {}); instance.setData = changes => Object.assign(instance.data, changes); },
    }, { filename });
    cache.set(filename, module.exports); return page ? instance : module.exports;
  }
  const coach = load('services/coach.ts');
  const profile = () => ({ ...coach.initialProfile, motivation: '测试档案', triggers: ['stress'] });
  return { coach, profile, memory, wx, navigations, page: name => load('pages/' + name + '/index.ts', true), advance: milliseconds => { now += milliseconds; }, failWrites: () => { failWrites = true; } };
}
test('fresh install has no invented profile, events or statistics', () => {
  const { coach } = environment(); const summary = coach.dashboard();
  assert.equal(summary.profile, null); assert.equal(summary.todayCount, 0); assert.equal(summary.survivedCount, 0); assert.equal(summary.hasTrend, false); assert.equal(summary.savings, '—');
});
test('draft resumes, successful save clears draft and validates bounds', () => {
  const { coach, profile, memory } = environment(); const value = profile();
  value.motivation = '保存草稿测试'; coach.saveDraft(value); assert.equal(coach.getDraft().motivation, value.motivation);
  assert.throws(() => coach.saveProfile({ ...value, cigarettesPerDay: -1 }));
  assert.throws(() => coach.saveProfile({ ...value, triggers: [] }));
  assert.throws(() => coach.saveProfile({ ...value, quitStatus: 'quit', quitDate: '2026-09-15' }));
  assert.throws(() => coach.saveProfile({ ...value, quitDate: '2026-02-30' }));
  coach.saveProfile(value); assert.equal(memory.get(coach.STORAGE_KEY).draft, null);
});
test('only one active event and duplicate next-step requests preserve the deadline', () => {
  const e = environment(); e.coach.saveProfile(e.profile());
  const a = e.coach.createEvent(8, 'stress', ''); const b = e.coach.createEvent(8, 'stress', '');
  assert.equal(a.id, b.id); e.advance(30000);
  const next = e.coach.nextStep(a.id, 0); e.advance(5000);
  assert.equal(e.coach.nextStep(a.id, 0).deadline, next.deadline);
  assert.equal(e.coach.dashboard().todayCount, 1);
});
test('all trigger presets fit within five minutes and unsafe contexts stop ordinary exercises', () => {
  for (const trigger of environment().coach.triggers) {
    const e = environment(); e.coach.saveProfile(e.profile()); const event = e.coach.createEvent(5, trigger.value, '');
    assert.equal(event.steps.length, 2); assert.ok(event.steps.reduce((sum, s) => sum + s.seconds, 0) <= 300);
  }
  for (const context of ['胸痛', '不想活']) {
    const e = environment(); e.coach.saveProfile(e.profile()); const event = e.coach.createEvent(5, 'other', context);
    assert.equal(event.safety, true); assert.equal(event.steps.length, 1); assert.equal(event.steps[0].seconds, 0);
  }
});
test('zero score is a real observation and duplicate results do not change counts', () => {
  const e = environment(); e.coach.saveProfile(e.profile()); const event = e.coach.createEvent(0, 'other', '');
  e.coach.saveResult(event.id, 0, 'not_smoked', ''); e.coach.saveResult(event.id, 10, 'smoked', 'retry');
  const summary = e.coach.dashboard(); assert.equal(summary.survivedCount, 1); assert.equal(summary.hasTrend, true);
  assert.equal(summary.trend[6].value, '0.0'); assert.equal(summary.activeId, '');
  assert.throws(() => e.coach.nextStep(event.id, 0));
});
test('smoked and unknown outcomes do not count as survived', () => {
  const e = environment(); e.coach.saveProfile(e.profile());
  for (const outcome of ['smoked', 'unknown']) { const event = e.coach.createEvent(7, 'habit', ''); e.coach.saveResult(event.id, 8, outcome, ''); }
  assert.equal(e.coach.dashboard().survivedCount, 0);
});
test('same-day logs update and date boundaries use Shanghai calendar days', () => {
  const e = environment(); e.coach.saveProfile(e.profile()); const date = e.coach.today();
  e.coach.saveDailyLog(date, 2, ''); e.coach.saveDailyLog(date, 0, 'updated');
  assert.equal(e.memory.get(e.coach.STORAGE_KEY).logs.length, 1); assert.equal(e.coach.getDailyLog(date).cigarettesSmoked, 0);
  assert.equal(e.coach.today(Date.parse('2026-09-14T16:00:00Z')), '2026-09-15');
  e.advance(86400000); assert.throws(() => e.coach.saveDailyLog(date, 2, ''));
});
test('savings only uses a started quit plan with known pack price', () => {
  const e = environment(); e.coach.saveProfile({ ...e.profile(), quitStatus: 'quit', quitDate: '2026-09-10', cigarettePackPrice: 30 });
  assert.equal(e.coach.dashboard().days, 4); assert.equal(e.coach.dashboard().savings, '60.00');
  e.coach.saveProfile({ ...e.profile(), quitDate: '2026-09-10', cigarettePackPrice: 30 }); assert.equal(e.coach.dashboard().savings, '—');
});
test('write failures surface without mutating saved data; deletion is namespace-scoped', () => {
  const e = environment(); e.coach.saveProfile(e.profile()); e.memory.set('unrelated', { retained: true });
  e.failWrites(); assert.throws(() => e.coach.createEvent(7, 'stress', '')); assert.equal(e.coach.dashboard().todayCount, 0);
  e.coach.deleteData(); assert.equal(e.coach.getProfile(), null); assert.equal(e.memory.has('unrelated'), true);
});
test('unsupported stored format is not silently overwritten', () => {
  const e = environment(); e.memory.set(e.coach.STORAGE_KEY, { version: 99 });
  assert.throws(() => e.coach.getProfile()); assert.throws(() => e.coach.saveProfile(e.profile())); assert.equal(e.memory.get(e.coach.STORAGE_KEY).version, 99);
});
test('intervention lifecycle resumes elapsed time without creating or advancing steps', () => {
  const e = environment(); e.coach.saveProfile(e.profile()); const event = e.coach.createEvent(7, 'stress', '');
  const page = e.page('intervention'); page.onLoad({ id: event.id }); page.onShow(); assert.equal(page.data.remaining, 60);
  page.onHide(); assert.equal(page.timer, 0); e.advance(30000); page.onShow(); assert.equal(page.data.remaining, 30);
  e.advance(45000); page.tick(); assert.equal(page.data.remaining, 0); assert.equal(page.data.event.stepIndex, 0); assert.equal(page.timer, 0);
});
test('result page does not preselect an improved score and reports a saved result', () => {
  const e = environment(); e.coach.saveProfile(e.profile()); const event = e.coach.createEvent(7, 'stress', '');
  const page = e.page('result'); page.onLoad({ id: event.id }); assert.equal(page.data.score, 7); assert.equal(page.data.outcome, '');
  page.save(); assert.equal(page.data.completed, false); assert.ok(page.data.error);
  page.outcome({ currentTarget: { dataset: { value: 'unknown' } } }); page.save(); assert.equal(page.data.completed, true);
});
test('onboarding moves through all steps and homepage reads the saved plan', () => {
  const e = environment(); const page = e.page('onboarding'); page.onLoad(); page.next(); assert.equal(page.data.step, 1);
  page.next(); assert.equal(page.data.step, 1); assert.ok(page.data.error);
  page.trigger({ currentTarget: { dataset: { value: 'stress' } } });
  page.input({ currentTarget: { dataset: { field: 'motivation' } }, detail: { value: '功能测试' } });
  page.next(); page.save(); assert.equal(e.coach.getProfile().motivation, '功能测试');
  const home = e.page('index'); home.onShow(); assert.equal(home.data.ready, true); assert.equal(home.data.summary.todayCount, 0);
});
test('daily check-in refuses an empty count, then stores zero and clears stale success on edit', () => {
  const e = environment(); e.coach.saveProfile(e.profile()); const page = e.page('daily-checkin'); page.onLoad(); page.save(); assert.equal(page.data.saved, false);
  page.count({ detail: { value: '0' } }); page.save(); assert.equal(page.data.saved, true);
  page.notes({ detail: { value: 'test' } }); assert.equal(page.data.saved, false);
  e.advance(86400000); page.onShow(); assert.equal(page.data.ready, false);
});
test('all registered pages exist and WXML handlers resolve to page methods', () => {
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  for (const route of app.pages) {
    const e = environment(); const page = e.page(route.split('/')[1]);
    for (const extension of ['ts', 'wxml', 'wxss', 'json']) assert.ok(fs.existsSync(path.join(root, route + '.' + extension)), route + '.' + extension);
    const wxml = fs.readFileSync(path.join(root, route + '.wxml'), 'utf8');
    for (const match of wxml.matchAll(/(?:bind|catch)\w+="(\w+)"/g)) assert.equal(typeof page[match[1]], 'function', route + ': ' + match[1]);
  }
});

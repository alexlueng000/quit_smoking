// Local experience only; no network requests or generated AI responses.
export const STORAGE_KEY = 'quit-coach:local:v1';
export const triggers = [
  { value: 'stress', label: '压力' }, { value: 'after_meal', label: '饭后' },
  { value: 'alcohol', label: '饮酒' }, { value: 'social', label: '社交递烟' },
  { value: 'boredom', label: '无聊' }, { value: 'habit', label: '习惯性想抽' },
  { value: 'negative_mood', label: '情绪不好' }, { value: 'other', label: '其他' },
];
export interface Profile {
  cigarettesPerDay: number; smokingYears: number; minutesToFirstCigarette: number;
  quitAttempts: number; motivation: string; quitStatus: string; quitDate: string;
  cigarettePackPrice: number | null; cigarettesPerPack: number; triggers: string[];
}
export interface Step { title: string; message: string; seconds: number }
export interface Craving {
  id: string; beforeScore: number; triggerType: string; contextText: string;
  startedAt: number; stepIndex: number; deadline: number; steps: Step[];
  status: 'active' | 'completed'; afterScore: number | null; outcome: string;
  feedback: string; completedAt: number | null; safety: boolean;
}
interface DailyLog { date: string; cigarettesSmoked: number; notes: string }
interface State { version: 1; profile: Profile | null; draft: Profile | null; events: Craving[]; logs: DailyLog[] }
export const initialProfile: Profile = { cigarettesPerDay: 10, smokingYears: 1, minutesToFirstCigarette: 60, quitAttempts: 0, motivation: '', quitStatus: 'not_started', quitDate: '', cigarettePackPrice: null, cigarettesPerPack: 20, triggers: [] };
function read(): State {
  const raw = wx.getStorageSync(STORAGE_KEY) as State | '';
  if (!raw) return { version: 1, profile: null, draft: null, events: [], logs: [] };
  if (raw.version !== 1 || !Array.isArray(raw.events) || !Array.isArray(raw.logs)) throw new Error('本地记录无法读取，请先不要继续填写。可在数据与隐私中清除本地记录后重新开始。');
  return raw;
}
function write(state: State) { wx.setStorageSync(STORAGE_KEY, state); }
export function errorText(error: unknown): string { return error instanceof Error ? error.message : '本地记录读写失败，请检查设备存储空间后重试。'; }
export function today(now = Date.now()): string { return new Date(now + 8 * 3600000).toISOString().slice(0, 10); }
function integer(value: number, max: number) { return Number.isInteger(value) && value >= 0 && value <= max; }
export function profileError(profile: Profile, step = 2): string {
  if (!integer(profile.cigarettesPerDay, 200) || !integer(profile.smokingYears, 100) || !integer(profile.minutesToFirstCigarette, 1440) || !integer(profile.quitAttempts, 100)) return '请填写有效的吸烟情况，数量需为范围内的整数。';
  if (step >= 1 && (profile.triggers.length < 1 || profile.triggers.length > 3 || profile.triggers.some(t => !triggers.some(o => o.value === t)))) return '请选择 1–3 个常见场景。';
  if (step >= 1 && (!profile.motivation.trim() || profile.motivation.length > 300)) return '请写下你的戒烟原因（最多 300 字）。';
  if (step >= 2) {
    if (!['not_started', 'reducing', 'quit'].includes(profile.quitStatus)) return '请选择当前状态。';
    if (!integer(profile.cigarettesPerPack, 200) || profile.cigarettesPerPack < 1) return '每包支数应为 1–200 的整数。';
    if (profile.cigarettePackPrice !== null && (!Number.isFinite(profile.cigarettePackPrice) || profile.cigarettePackPrice < 0 || profile.cigarettePackPrice > 100000)) return '请填写有效的每包价格。';
    if (profile.quitDate && (!/^\d{4}-\d{2}-\d{2}$/.test(profile.quitDate) || !Number.isFinite(Date.parse(profile.quitDate)) || new Date(profile.quitDate).toISOString().slice(0, 10) !== profile.quitDate)) return '请选择有效日期。';
    if (profile.quitStatus === 'quit' && (!profile.quitDate || profile.quitDate > today())) return '已经戒烟时，请选择今天或之前的戒烟日期。';
  }
  return '';
}
export function getProfile() { return read().profile; }
export function getDraft() { const s = read(); return s.draft || s.profile || { ...initialProfile, triggers: [] }; }
export function saveDraft(profile: Profile) { const s = read(); s.draft = profile; write(s); }
export function saveProfile(profile: Profile) { const error = profileError(profile); if (error) throw new Error(error); const s = read(); s.profile = { ...profile, motivation: profile.motivation.trim() }; s.draft = null; write(s); }
export function activeEvent() { return read().events.find(e => e.status === 'active') || null; }
export function getEvent(id: string) { const event = read().events.find(e => e.id === id); if (!event) throw new Error('这条记录不存在，可能已被删除。请返回首页。'); return event; }
// Presets adapted from src/lib/ai/fallbacks.ts and safety.ts.
function plan(score: number, trigger: string, context: string): { steps: Step[]; safety: boolean } {
  if (/自杀|不想活|伤害自己|suicide|kill myself|hurt myself/i.test(context)) return { safety: true, steps: [{ title: '先获得身边的支持', message: '这听起来需要立即支持。请联系当地急救或危机热线，并让可信任的人现在陪着你。', seconds: 0 }] };
  if (/胸痛|呼吸困难|喘不过气|晕厥|意识不清|咳血|chest pain|trouble breathing|cannot breathe|can't breathe|fainting|coughing blood/i.test(context)) return { safety: true, steps: [{ title: '请先处理身体不适', message: '请停止普通戒烟练习，立即联系当地急救或尽快就医；不要独自等待症状过去。', seconds: 0 }] };
  const finish = { title: '把决定放到稍后', message: '把香烟和打火机放到够不到的位置。选一件两分钟能完成的小事，做完再看烟瘾是否还在。', seconds: 120 };
  if (score >= 8) return { safety: false, steps: [{ title: '先观察这一阵烟瘾', message: '先不决定抽不抽，只观察这股烟瘾像浪一样起落。不需要立刻做出回应。', seconds: 90 }, finish] };
  if (trigger === 'stress' || trigger === 'negative_mood') return { safety: false, steps: [{ title: '把注意力带回眼前', message: '依次找出你看到的 3 样东西，把注意力带回眼前。先给自己一点空间。', seconds: 60 }, finish] };
  if (trigger === 'social' || trigger === 'alcohol') return { safety: false, steps: [{ title: '提前准备一句回应', message: '先练一句：谢谢，我最近不抽。然后离开递烟的位置，拿一杯水。', seconds: 30 }, finish] };
  if (trigger === 'after_meal' || trigger === 'habit') return { safety: false, steps: [{ title: '换一个熟悉的动作', message: '现在起身漱口或喝水，让饭后的固定动作换一下。离开常抽烟的位置。', seconds: 60 }, finish] };
  return { safety: false, steps: [{ title: '给手和嘴找件小事', message: '给手和嘴换个动作：喝水、整理桌面或走一小圈。选现在方便的一件就好。', seconds: 60 }, finish] };
}
export function createEvent(score: number, trigger: string, context: string) {
  if (!integer(score, 10) || !triggers.some(o => o.value === trigger) || context.length > 300) throw new Error('请检查评分、触发场景和补充说明。');
  const s = read(); if (!s.profile) throw new Error('请先完成戒烟档案。');
  const active = s.events.find(e => e.status === 'active'); if (active) return active;
  const now = Date.now(); const selected = plan(score, trigger, context);
  const event: Craving = { id: `${now}-${Math.random().toString(36).slice(2, 10)}`, beforeScore: score, triggerType: trigger, contextText: context.trim(), startedAt: now, stepIndex: 0, deadline: now + selected.steps[0].seconds * 1000, steps: selected.steps, status: 'active', afterScore: null, outcome: '', feedback: '', completedAt: null, safety: selected.safety };
  s.events.push(event); write(s); return event;
}
export function nextStep(id: string, expectedIndex: number) {
  const s = read(); const event = s.events.find(e => e.id === id);
  if (!event || event.status !== 'active') throw new Error('本次支持已结束，请返回首页。');
  if (event.stepIndex !== expectedIndex || event.stepIndex >= event.steps.length - 1) return event;
  event.stepIndex += 1; event.deadline = Date.now() + event.steps[event.stepIndex].seconds * 1000; write(s); return event;
}
export function saveResult(id: string, score: number, outcome: string, feedback: string) {
  if (!integer(score, 10) || !['not_smoked', 'smoked', 'unknown'].includes(outcome) || feedback.length > 300) throw new Error('请选择实际结果，并检查评分与反馈。');
  const s = read(); const event = s.events.find(e => e.id === id); if (!event) throw new Error('这条记录不存在。');
  if (event.status === 'completed') return event;
  event.status = 'completed'; event.afterScore = score; event.outcome = outcome; event.feedback = feedback.trim(); event.completedAt = Date.now(); write(s); return event;
}
export function getDailyLog(date: string) { return read().logs.find(log => log.date === date) || null; }
export function saveDailyLog(date: string, count: number, notes: string) {
  if (!integer(count, 200) || notes.length > 500 || date !== today()) throw new Error('请检查吸烟数量（0–200），跨天后请重新打开今日记录。');
  const s = read(); if (!s.profile) throw new Error('请先完成戒烟档案。'); s.logs = s.logs.filter(log => log.date !== date); s.logs.push({ date, cigarettesSmoked: count, notes: notes.trim() }); write(s);
}
export function deleteData() { wx.removeStorageSync(STORAGE_KEY); }
export function dashboard(now = Date.now()) {
  const s = read(); const date = today(now); const profile = s.profile;
  const days = profile && profile.quitStatus === 'quit' && profile.quitDate ? Math.max(0, Math.floor((Date.parse(date) - Date.parse(profile.quitDate)) / 86400000)) : 0;
  const savings = profile && profile.quitStatus === 'quit' && profile.cigarettePackPrice !== null ? (days * profile.cigarettesPerDay * profile.cigarettePackPrice / profile.cigarettesPerPack).toFixed(2) : '—';
  const trend = Array.from({ length: 7 }, (_, index) => {
    const day = today(now - (6 - index) * 86400000); const events = s.events.filter(e => today(e.startedAt) === day);
    const average = events.length ? events.reduce((sum, e) => sum + e.beforeScore, 0) / events.length : null;
    return { date: day, label: index === 6 ? '今天' : `${Number(day.slice(5, 7))}/${Number(day.slice(8))}`, value: average === null ? '—' : average.toFixed(1), height: average === null ? 3 : Math.max(3, average * 8), current: index === 6 };
  });
  const active = s.events.find(e => e.status === 'active');
  return { profile, days, savings, todayCount: s.events.filter(e => today(e.startedAt) === date).length, survivedCount: s.events.filter(e => e.status === 'completed' && e.outcome === 'not_smoked').length, activeId: active ? active.id : '', hasTrend: trend.some(day => day.value !== '—'), trend, checkedIn: s.logs.some(log => log.date === date), statusText: profile ? ({ not_started: '准备好再出发', reducing: '正在慢慢减量', quit: '已经离烟' } as Record<string, string>)[profile.quitStatus] : '从了解自己开始' };
}

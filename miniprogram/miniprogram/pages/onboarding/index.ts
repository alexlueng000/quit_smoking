import { getDraft, saveDraft, saveProfile, profileError, errorText, initialProfile, triggers, Profile } from '../../services/coach';
import { home, InputEvent } from '../../utils/ui';
const statuses = [{ value: 'not_started', label: '还没开始戒' }, { value: 'reducing', label: '正在减量' }, { value: 'quit', label: '已经戒了' }];
Page({
  data: { step: 0, form: { ...initialProfile } as Profile, options: triggers.map(t => ({ ...t, selected: false })), statuses, statusIndex: 0, error: '', ready: false, saving: false },
  onLoad() { this.load(); },
  load() { try { const form = getDraft(); this.setData({ form, ready: true, error: '', statusIndex: Math.max(0, statuses.findIndex(s => s.value === form.quitStatus)), options: triggers.map(t => ({ ...t, selected: form.triggers.includes(t.value) })) }); } catch (e) { this.setData({ error: errorText(e) }); } },
  persist(form: Profile) { this.setData({ form, error: '' }); try { saveDraft(form); } catch (e) { this.setData({ error: errorText(e) }); } },
  input(e: InputEvent) {
    const key = e.currentTarget.dataset.field as keyof Profile;
    const raw = e.detail.value;
    const value = ['motivation', 'quitDate'].includes(key) ? raw : raw === '' ? (key === 'cigarettePackPrice' ? null : -1) : Number(raw);
    this.persist({ ...this.data.form, [key]: value });
  },
  trigger(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset.value as string;
    const selected = this.data.form.triggers;
    if (!selected.includes(value) && selected.length >= 3) { this.setData({ error: '最多选择 3 个常见场景。' }); return; }
    const next = selected.includes(value) ? selected.filter(t => t !== value) : [...selected, value];
    this.persist({ ...this.data.form, triggers: next });
    this.setData({ options: triggers.map(t => ({ ...t, selected: next.includes(t.value) })) });
  },
  status(e: InputEvent) { const statusIndex = Number(e.detail.value); this.setData({ statusIndex }); this.persist({ ...this.data.form, quitStatus: statuses[statusIndex].value }); },
  clearDate() { this.persist({ ...this.data.form, quitDate: '' }); },
  next() { const error = profileError(this.data.form, this.data.step); if (error) { this.setData({ error }); return; } this.setData({ step: this.data.step + 1, error: '' }); wx.pageScrollTo({ scrollTop: 0, duration: 0 }); },
  back() { this.setData({ step: this.data.step - 1, error: '' }); wx.pageScrollTo({ scrollTop: 0, duration: 0 }); },
  save() { if (this.data.saving) return; this.setData({ saving: true, error: '' }); try { saveProfile(this.data.form); home(); } catch (e) { this.setData({ error: errorText(e) }); } finally { this.setData({ saving: false }); } },
  home,
});

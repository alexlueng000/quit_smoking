import { getEvent, saveResult, errorText } from '../../services/coach';
import { home, InputEvent, SliderEvent } from '../../utils/ui';
Page({
  data: { id: '', before: 0, score: 0, outcome: '', feedback: '', showFeedback: false, completed: false, ready: false, saving: false, error: '', outcomes: [{ value: 'not_smoked', label: '这次没有抽' }, { value: 'smoked', label: '这次抽了' }, { value: 'unknown', label: '还不确定' }] },
  onLoad(options: Record<string, string | undefined>) { this.setData({ id: options.id || '' }); this.load(); },
  load() { try { const e = getEvent(this.data.id); this.setData({ before: e.beforeScore, score: e.afterScore === null ? e.beforeScore : e.afterScore, outcome: e.outcome, feedback: e.feedback, completed: e.status === 'completed', ready: true, error: '' }); } catch (e) { this.setData({ error: errorText(e), ready: false }); } },
  score(e: SliderEvent) { this.setData({ score: e.detail.value }); },
  outcome(e: WechatMiniprogram.TouchEvent) { this.setData({ outcome: e.currentTarget.dataset.value }); },
  feedback(e: InputEvent) { this.setData({ feedback: e.detail.value }); },
  toggleFeedback() { this.setData({ showFeedback: !this.data.showFeedback }); },
  save() { if (this.data.saving || this.data.completed) return; this.setData({ saving: true, error: '' }); try { saveResult(this.data.id, this.data.score, this.data.outcome, this.data.feedback); this.setData({ completed: true }); wx.pageScrollTo({ scrollTop: 0, duration: 0 }); } catch (e) { this.setData({ error: errorText(e) }); } finally { this.setData({ saving: false }); } },
  home,
});

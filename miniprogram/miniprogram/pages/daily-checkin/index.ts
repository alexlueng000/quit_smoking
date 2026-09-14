import { today, getDailyLog, saveDailyLog, getProfile, errorText } from '../../services/coach';
import { home, InputEvent } from '../../utils/ui';
Page({
  data: { date: '', count: '', notes: '', saved: false, ready: false, saving: false, error: '' },
  onLoad() { this.load(); },
  onShow() { if (this.data.date && this.data.date !== today()) { this.setData({ error: '已经是新的一天，请重新读取今日记录后填写。', ready: false }); } },
  load() { try { if (!getProfile()) { home(); return; } const date = today(); const log = getDailyLog(date); this.setData({ date, count: log ? String(log.cigarettesSmoked) : '', notes: log ? log.notes : '', saved: !!log, ready: true, error: '' }); } catch (e) { this.setData({ ready: false, error: errorText(e) }); } },
  count(e: InputEvent) { this.setData({ count: e.detail.value, saved: false }); },
  notes(e: InputEvent) { this.setData({ notes: e.detail.value, saved: false }); },
  save() { if (this.data.saving) return; if (!this.data.count.trim()) { this.setData({ error: '请填写今天的吸烟数量，没有抽请填 0。' }); return; } this.setData({ saving: true, error: '' }); try { saveDailyLog(this.data.date, Number(this.data.count), this.data.notes); this.setData({ saved: true }); } catch (e) { this.setData({ error: errorText(e) }); } finally { this.setData({ saving: false }); } },
  home,
});

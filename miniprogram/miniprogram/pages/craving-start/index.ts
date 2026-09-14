import { triggers, createEvent, getProfile, activeEvent, errorText } from '../../services/coach';
import { open, home, InputEvent, SliderEvent } from '../../utils/ui';
Page({
  data: { score: 7, trigger: '', context: '', showContext: false, triggers, error: '', saving: false, ready: false },
  onLoad() { try { if (!getProfile()) { home(); return; } const active = activeEvent(); if (active) { wx.redirectTo({ url: '/pages/intervention/index?id=' + encodeURIComponent(active.id) }); return; } this.setData({ ready: true }); } catch (e) { this.setData({ error: errorText(e) }); } },
  score(e: SliderEvent) { this.setData({ score: e.detail.value }); },
  trigger(e: WechatMiniprogram.TouchEvent) { this.setData({ trigger: e.currentTarget.dataset.value, error: '' }); },
  context(e: InputEvent) { this.setData({ context: e.detail.value }); },
  toggle() { this.setData({ showContext: !this.data.showContext }); },
  start() { if (this.data.saving) return; this.setData({ saving: true, error: '' }); try { const event = createEvent(this.data.score, this.data.trigger, this.data.context); open('intervention', event.id); } catch (e) { this.setData({ error: errorText(e) }); } finally { this.setData({ saving: false }); } },
  home,
});

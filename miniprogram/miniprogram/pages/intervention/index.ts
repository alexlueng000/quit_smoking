import { getEvent, nextStep, errorText, Craving } from '../../services/coach';
import { home } from '../../utils/ui';
Page({
  data: { id: '', event: null as Craving | null, title: '', message: '', clock: '', remaining: 0, last: false, error: '' },
  timer: 0,
  onLoad(options: Record<string, string | undefined>) { this.setData({ id: options.id || '' }); },
  onShow() { this.restore(); },
  onHide() { this.stop(); },
  onUnload() { this.stop(); },
  stop() { if (this.timer) { clearInterval(this.timer); this.timer = 0; } },
  restore() {
    this.stop();
    try { const event = getEvent(this.data.id); if (event.status === 'completed') { wx.redirectTo({ url: '/pages/result/index?id=' + encodeURIComponent(event.id) }); return; }
      const step = event.steps[event.stepIndex];
      this.setData({ event, title: step.title, message: step.message, last: event.stepIndex === event.steps.length - 1, error: '' }); this.tick();
      if (!event.safety && this.data.remaining > 0) this.timer = setInterval(() => this.tick(), 1000);
    } catch (e) { this.setData({ error: errorText(e), event: null }); }
  },
  tick() { const event = this.data.event; if (!event) return; const remaining = Math.max(0, Math.ceil((event.deadline - Date.now()) / 1000)); this.setData({ remaining, clock: Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2, '0') }); if (remaining === 0) this.stop(); },
  next() { try { if (!this.data.event) return; nextStep(this.data.id, this.data.event.stepIndex); this.restore(); } catch (e) { this.setData({ error: errorText(e) }); } },
  finish() { this.stop(); wx.redirectTo({ url: '/pages/result/index?id=' + encodeURIComponent(this.data.id) }); },
  home,
});

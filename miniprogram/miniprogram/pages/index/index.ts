import { dashboard, errorText } from '../../services/coach';
import { open } from '../../utils/ui';
Page({
  data: { showTrend: false, ready: false, error: '', summary: null as ReturnType<typeof dashboard> | null },
  onShow() { this.refresh(); },
  refresh() { try { this.setData({ summary: dashboard(), ready: true, error: '' }); } catch (error) { this.setData({ error: errorText(error), ready: false }); } },
  start() { if (!this.data.summary?.profile) { open('onboarding'); return; } open(this.data.summary.activeId ? 'intervention' : 'craving-start', this.data.summary.activeId); },
  plan() { open('onboarding'); },
  checkin() { open(this.data.summary?.profile ? 'daily-checkin' : 'onboarding'); },
  toggleTrend() { this.setData({ showTrend: !this.data.showTrend }); },
  settings() { open('settings'); },
});

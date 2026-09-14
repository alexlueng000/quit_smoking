import { deleteData, errorText } from '../../services/coach';
import { home, open } from '../../utils/ui';
Page({
  data: { error: '', deleting: false },
  privacy() { open('privacy'); },
  plan() { open('onboarding'); },
  remove() {
    if (this.data.deleting) return;
    wx.showModal({ title: '删除此设备的全部记录？', content: '将删除本地档案、填写草稿、烟瘾事件和每日记录，无法恢复。不会删除网页或其他设备的数据。', confirmText: '删除记录', confirmColor: '#872d24', success: (result) => {
      if (!result.confirm) return;
      this.setData({ deleting: true, error: '' });
      try { deleteData(); home(); } catch (e) { this.setData({ error: errorText(e) }); } finally { this.setData({ deleting: false }); }
    } });
  },
  home,
});

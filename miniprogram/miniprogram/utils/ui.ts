export type InputEvent = WechatMiniprogram.CustomEvent<{ value: string }>;
export type SliderEvent = WechatMiniprogram.CustomEvent<{ value: number }>;
export function home() { wx.reLaunch({ url: '/pages/index/index' }); }
export function open(page: string, id = '') { wx.navigateTo({ url: `/pages/${page}/index${id ? '?id=' + encodeURIComponent(id) : ''}` }); }

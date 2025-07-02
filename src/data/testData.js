// 测试用小数据集 - 只包含5个项目
export const testData = [
  {
    "id": 1,
    "url": "https://res.labubuwallpaper.xyz/image/upload/labubu/cute-rainbow-labubu-wallpaper---heart-gesture-edition.jpg",
    "title": "Cute Rainbow Labubu Wallpaper - Heart Gesture Edition",
    "category": "4k",
    "resolution": "4K",
    "source": "xyz",
    "type": "image",
    "format": "jpg",
    "tags": ["彩虹", "爱心", "可爱"]
  },
  {
    "id": 2,
    "url": "https://res.labubuwallpaper.xyz/image/upload/labubu/adorable-labubu-wallpaper---cozy-reading-nook-scene.jpg",
    "title": "Adorable Labubu Wallpaper - Cozy Reading Nook Scene",
    "category": "fantasy",
    "resolution": "4K",
    "source": "xyz",
    "type": "image",
    "format": "jpg",
    "tags": ["阅读", "温馨", "奇幻"]
  },
  {
    "id": 3,
    "url": "https://res.labubuwallpaper.xyz/image/upload/labubu/charming-labubu-wallpaper---magical-forest-adventure.jpg",
    "title": "Charming Labubu Wallpaper - Magical Forest Adventure",
    "category": "fantasy",
    "resolution": "4K",
    "source": "xyz",
    "type": "image",
    "format": "jpg",
    "tags": ["森林", "冒险", "魔法"]
  }
];

export const stats = {
  total: testData.length,
  images: testData.filter(item => item.type === 'image').length,
  videos: testData.filter(item => item.type === 'video').length
};

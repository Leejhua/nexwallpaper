import { useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * 标签翻译Hook - 提供统一的标签翻译功能
 */
export const useTagTranslation = () => {
  const { t, currentLanguage } = useLanguage();

  // 翻译单个标签
  const translateTag = useCallback((tag) => {
    if (!tag || typeof tag !== 'string') return tag;

    try {
      // 尝试获取翻译
      const translationKey = `tagTranslations.${tag}`;
      const translation = t(translationKey);
      
      // 如果翻译存在且不等于key本身，使用翻译
      if (translation && translation !== translationKey) {
        return translation;
      }
      
      // 否则返回原标签
      return tag;
    } catch (error) {
      console.error('Tag translation error:', error);
      return tag;
    }
  }, [t]);

  // 反向翻译：从翻译后的标签找到原始标签
  const reverseTranslateTag = useCallback((translatedTag) => {
    if (!translatedTag || typeof translatedTag !== 'string') return translatedTag;

    try {
      // 获取当前语言的所有标签翻译
      const tagTranslations = t('tagTranslations');
      
      if (tagTranslations && typeof tagTranslations === 'object') {
        // 查找翻译值对应的原始键
        for (const [originalTag, translation] of Object.entries(tagTranslations)) {
          if (translation === translatedTag) {
            return originalTag;
          }
        }
      }
      
      // 如果没找到对应的原始标签，返回输入值
      return translatedTag;
    } catch (error) {
      console.error('Reverse tag translation error:', error);
      return translatedTag;
    }
  }, [t]);

  // 获取标签的所有可能匹配项（原始标签和翻译）
  const getTagVariants = useCallback((tag) => {
    const variants = new Set();
    
    // 添加原始标签
    variants.add(tag);
    
    // 添加翻译后的标签
    const translated = translateTag(tag);
    if (translated !== tag) {
      variants.add(translated);
    }
    
    // 添加反向翻译的标签
    const reversed = reverseTranslateTag(tag);
    if (reversed !== tag) {
      variants.add(reversed);
    }
    
    return Array.from(variants);
  }, [translateTag, reverseTranslateTag]);

  // 翻译标签数组
  const translateTags = useCallback((tags) => {
    if (!Array.isArray(tags)) return [];
    
    return tags.map(tag => translateTag(tag));
  }, [translateTag]);

  // 获取翻译后的标签显示文本（带#前缀）
  const getTagDisplayText = useCallback((tag) => {
    const translatedTag = translateTag(tag);
    return `#${translatedTag}`;
  }, [translateTag]);

  return {
    translateTag,
    reverseTranslateTag,
    getTagVariants,
    translateTags, 
    getTagDisplayText,
    currentLanguage
  };
}; 
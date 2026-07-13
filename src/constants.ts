export const UNIT_EXP3 = ['十', '百', '千'] as const
export const UNIT_EXP4 = [
  '万', '億', '兆', '京', '垓', '𥝱', '穣', '溝', '澗',
  '正', '載', '極', '恒河沙', '阿僧祇', '那由他', '不可思議', '無量大数',
] as const

export const KAN_DIGITS = '〇一二三四五六七八九'

// Ruby 版の tr 用ペア文字列と同一。コードポイント単位で位置対応している。
export const NUM_ALT_CHARS =
  `${KAN_DIGITS}０１２３４５６７８９零壱壹弌弐貳貮参參弎肆伍陸漆質柒捌玖拾什陌佰阡仟萬秭`
export const NUM_NORMALIZED_CHARS =
  '01234567890123456789011122233345677789十十百百千千万𥝱'

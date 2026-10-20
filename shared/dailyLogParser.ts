import type { DailyTodoItem } from './types';

/**
 * Parse a free-form daily standup into a title and checklist items.
 *
 *   JulNow - Dashboard              <- first line = title / module
 *   - update export button          <- each following line = one item
 *   - line chart analytics - 80%    <- trailing "- 80%" or "(80%)" = progress tag
 *   - [x] fix login bug             <- "[x]" or "100%" = already done
 */
export const parseRawLogContent = (rawText: string): { title: string; items: DailyTodoItem[] } => {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { title: 'Daily Update', items: [] };
  }

  const title = lines[0].replace(/^[-*•#\s]+/, '').trim() || 'Daily Update';
  const seed = Date.now().toString(36);

  const items: DailyTodoItem[] = lines.slice(1).map((line, idx) => {
    const pctMatch = line.match(/[-–—]\s*(\d{1,3}%)\s*$/) || line.match(/\((\d{1,3}%)\)\s*$/);
    const progressTag = pctMatch ? pctMatch[1] : undefined;

    // Strip bullet markers ("-", "*", "•", "1.") from the start of the line.
    let text = line.replace(/^(?:[-*•]|\d+[.)])\s*/, '').trim();
    if (progressTag) {
      text = text.replace(/[-–—]\s*\d{1,3}%\s*$/, '').replace(/\(\d{1,3}%\)\s*$/, '').trim();
    }

    const done = /\[[xX]\]/.test(text) || progressTag === '100%';
    text = text.replace(/\[[xX\s]\]/g, '').trim();

    return {
      id: `item_${seed}_${idx}`,
      text,
      done,
      ...(progressTag ? { progressTag } : {}),
    };
  });

  return { title, items };
};

import re

with open('/Users/yoksha/.gemini/antigravity/brain/85d361c2-58ae-4048-880b-2ab7ff0b5434/implementation_plan.md', 'r') as f:
    text = f.read()

text = text.replace('## 🔲 CHECKPOINT 21 — Accessibility CHECKPOINT 20 — Accessibility & Polish Polish', '## 🔲 CHECKPOINT 21 — Accessibility & Polish')
text = text.replace('## 🔲 CHECKPOINT 22 — Performance CHECKPOINT 21 — Performance & Production Build Production Build', '## 🔲 CHECKPOINT 22 — Performance & Production Build')
text = text.replace('## 🔲 CHECKPOINT 23 — Final QA CHECKPOINT 22 — Final QA & Launch Launch', '## 🔲 CHECKPOINT 23 — Final QA & Launch')

with open('/Users/yoksha/.gemini/antigravity/brain/85d361c2-58ae-4048-880b-2ab7ff0b5434/implementation_plan.md', 'w') as f:
    f.write(text)

# FinQuest Arabic voice guide

## Voice

Modern Saudi conversational Arabic: friendly, calm, intelligent, and direct. Use light spoken phrasing where it reduces distance—`خلّنا نشوف`, `وش يتغير؟`, `عندك مساحة`—without forcing slang into every line.

## Register by surface

- **Education and motivation:** conversational, short, active.
- **Financial definitions and assumptions:** plain modern Arabic, precise and literal.
- **Privacy, AI, and disclaimers:** formal enough to remove ambiguity; no jokes or marketing language.
- **Controls:** name the result of the action (`ابدأ المهمة`, `شوف أثر القرار`, `ابدأ من جديد`).

## Rules

- Prefer neutral forms so a personal profile is not accidentally treated as Sara or addressed with the wrong gender.
- Say `في النموذج`, `محسوب`, `تقديري`, or `تعليمي` around future figures.
- Never say an outcome is guaranteed, verified, approved, safe, or “best” for the person.
- Distinguish installment from the monthly reserve for the final payment.
- Call quest completion `بتأكيدك الذاتي` or `معلّم داخل النموذج`.
- Call OpenRouter output an `شرح AI مبني على الحسابات`; never imply AI generated the figures.
- Write `ر.س` consistently and isolate financial numerals left-to-right in UI code.

## Typography

Alexandria carries display moments; IBM Plex Sans Arabic carries body, controls, and labels. Shared line-height tokens in `src/styles/base.css` protect Arabic marks and keep headings, descriptions, metadata, and controls from touching.

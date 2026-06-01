# NMT App — CLAUDE.md

## Що це

Веб-платформа для проведення пробних НМТ (Національний мультипредметний тест) в умовах класу. Викладач керує сесіями в реальному часі, студенти проходять тест у браузері з anti-cheat захистом.

## Стек

| Шар | Технологія |
|---|---|
| UI | React 19 + TypeScript + Vite 7 |
| Стилі | Tailwind CSS 3 |
| Роутинг | React Router DOM 7 |
| BaaS | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Формули | react-markdown + remark-math + rehype-katex (KaTeX) |
| PDF | react-pdf |
| Деплой | Vercel |

## Структура

```
src/
├── lib/supabase.ts          # Singleton Supabase клієнт
├── lib/utils.ts             # cn() — clsx + tailwind-merge
├── types/database.types.ts  # Типи БД (Subject, Test, Question, TestSession…)
├── components/
│   ├── AuthProvider.tsx     # Context: session, user, isAdmin
│   ├── ProtectedRoute.tsx   # Route guard (auth + role)
│   ├── Layout.tsx           # Шапка + Outlet
│   └── QuestionRenderer.tsx # Рендер питань за типом (single_choice, matching…)
└── pages/
    ├── StudentLobbyPage.tsx    # Список активних сесій
    ├── StudentSessionPage.tsx  # Основна сторінка іспиту (таймер, anti-cheat, PDF)
    └── admin/
        ├── AdminSessionsPage.tsx  # Live Control Room (start/pause/finish)
        └── AdminStatsPage.tsx     # Аналітика + CSV-експорт
```

**Корінь репозиторію:**
- `schema_v*.sql` — ручні міграції БД (v4–v34, застосовуються вручну через Supabase SQL Editor)
- `transform_json.mjs` / `transform_history.mjs` — одноразові скрипти імпорту питань
- `scripts/` — допоміжні скрипти імпорту предметів

## Команди

```bash
npm run dev      # Dev-сервер (Vite)
npm run build    # tsc -b && vite build
npm run lint     # ESLint
npm run preview  # Прев'ю prod-білду
```

Тестів немає. Перевірка — вручну через браузер.

## Змінні середовища

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Дивись `.env.example`.

## Важливі правила

**БД і міграції**
- Нова зміна схеми — новий файл `schema_vXX_назва.sql`. Не правь існуючі файли.
- Бізнес-логіка оцінювання — виключно в PostgreSQL RPC (`finalize_exam_v7`). Не переносити у JS.
- Функція `finalize_exam_v7` — критична. Зміни тільки через новий `CREATE OR REPLACE FUNCTION`.

**Код**
- Немає окремого API-шару: `supabase.from(...)` викликається напряму в компонентах. Не вводь проміжний шар без узгодження.
- `StudentSessionPage.tsx` — великий (~960 рядків). При додаванні нового функціоналу виноси в окремий компонент або хук.
- `QuestionRenderer.tsx` — чіпай тільки якщо додаєш новий тип питання. Існуючі гілки стабільні.
- Збережи `React.memo` на `QuestionDisplay` і `QuestionRenderer` — це свідоме рішення проти ре-рендерів при кожному тику таймера.

**Anti-cheat**
- Логіка в `StudentSessionPage.tsx`: fullscreen, visibilitychange, blur, resize, localStorage trap.
- При будь-яких змінах в цій частині — тестуй на мобільному (iPad) і десктопі окремо.
- `log_cheat_attempt` і `localStorage trap` — не видаляти і не обходити.

**Типізація**
- Типи БД у `src/types/database.types.ts` — підтримуй вручну (немає автогенерації).
- `@ts-ignore` на join-результатах Supabase — прийнятно, але не розширюй без потреби.

**Залежності**
- Не оновлюй і не додавай пакети без узгодження. `react-pdf` і `pdfjs` — версійно чутливі.

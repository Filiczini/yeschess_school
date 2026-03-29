import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'YesChess <noreply@yeschess.school>'
const SITE = process.env.FRONTEND_URL ?? 'http://localhost:5173'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date) {
  return date.toLocaleString('uk-UA', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'UTC',
  })
}

function wrap(content: string) {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a3a5c 0%, #0f2540 100%); padding: 32px 32px 28px; text-align: center; }
    .logo { display: inline-flex; align-items: center; gap: 10px; color: #ffffff; text-decoration: none; }
    .logo-icon { width: 36px; height: 36px; background: #ffffff; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .logo-text { font-size: 18px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
    .body { padding: 32px; }
    h1 { margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #0f172a; }
    p { margin: 0 0 16px; font-size: 15px; color: #475569; line-height: 1.6; }
    .btn { display: inline-block; padding: 13px 28px; background: #1a3a5c; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0 20px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin: 16px 0; }
    .card-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #94a3b8; }
    .card-value { color: #0f172a; font-weight: 500; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .footer { padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
    .footer a { color: #64748b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          ♔
        </div>
        <span class="logo-text">YesChess</span>
      </div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>YesChess School &nbsp;·&nbsp; <a href="${SITE}">${SITE.replace('https://', '').replace('http://', '')}</a></p>
    </div>
  </div>
</body>
</html>`
}

// ── Email senders ─────────────────────────────────────────────────────────────

export async function sendWelcome(to: string, name: string) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Ласкаво просимо до YesChess! ♟️',
    html: wrap(`
      <h1>Привіт, ${name}! 👋</h1>
      <p>Раді вітати тебе в <strong>YesChess School</strong> — онлайн-школі шахів.</p>
      <p>Твій акаунт створено. Найближчим часом адміністратор призначить тобі тренера — ти отримаєш повідомлення на цей email.</p>
      <p>Поки що можеш заповнити свій профіль: вкажи рівень, рейтинг і нікнейми на chess.com / lichess.</p>
      <a href="${SITE}/student/profile/edit" class="btn">Заповнити профіль</a>
      <p style="margin:0; font-size:14px; color:#94a3b8;">Є питання? Просто відповідай на цей лист.</p>
    `),
  })
}

export async function sendCoachAssigned(
  to: string,
  studentName: string,
  coachName: string,
  coachEmail: string,
) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Тобі призначено тренера — YesChess',
    html: wrap(`
      <h1>Тренера призначено! 🎉</h1>
      <p>Привіт, <strong>${studentName}</strong>!</p>
      <p>Адміністратор призначив тобі тренера. Тепер ти можеш записатись на перше заняття.</p>
      <div class="card">
        <div class="card-row">
          <span class="card-label">Тренер</span>
          <span class="card-value">${coachName}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Email</span>
          <span class="card-value">${coachEmail}</span>
        </div>
      </div>
      <a href="${SITE}/student/booking" class="btn">Записатись на заняття</a>
    `),
  })
}

export async function sendBookingConfirmed(
  to: string,
  studentName: string,
  coachName: string,
  scheduledAt: Date,
  durationMin: number,
) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Заняття підтверджено — YesChess',
    html: wrap(`
      <h1>Заняття підтверджено ✅</h1>
      <p>Привіт, <strong>${studentName}</strong>!</p>
      <p>Твій тренер підтвердив заняття. Чекаємо тебе!</p>
      <div class="card">
        <div class="card-row">
          <span class="card-label">Тренер</span>
          <span class="card-value">${coachName}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Дата та час</span>
          <span class="card-value">${formatDate(scheduledAt)}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Тривалість</span>
          <span class="card-value">${durationMin} хв</span>
        </div>
        <div class="card-row">
          <span class="card-label">Статус</span>
          <span class="badge badge-green">Підтверджено</span>
        </div>
      </div>
      <a href="${SITE}/student/booking" class="btn">Мої заняття</a>
    `),
  })
}

export async function sendBookingCancelled(
  to: string,
  studentName: string,
  coachName: string,
  scheduledAt: Date,
  cancelReason?: string | null,
) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Заняття скасовано — YesChess',
    html: wrap(`
      <h1>Заняття скасовано</h1>
      <p>Привіт, <strong>${studentName}</strong>!</p>
      <p>На жаль, заняття було скасовано.</p>
      <div class="card">
        <div class="card-row">
          <span class="card-label">Тренер</span>
          <span class="card-value">${coachName}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Дата та час</span>
          <span class="card-value">${formatDate(scheduledAt)}</span>
        </div>
        ${cancelReason ? `
        <div class="card-row">
          <span class="card-label">Причина</span>
          <span class="card-value">${cancelReason}</span>
        </div>` : ''}
        <div class="card-row">
          <span class="card-label">Статус</span>
          <span class="badge badge-red">Скасовано</span>
        </div>
      </div>
      <p>Ти можеш записатись на інший зручний час.</p>
      <a href="${SITE}/student/booking" class="btn">Обрати інший час</a>
    `),
  })
}

export async function sendPasswordReset(to: string, resetUrl: string) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Відновлення паролю — YesChess',
    html: wrap(`
      <h1>Відновлення паролю 🔑</h1>
      <p>Ти (або хтось інший) запросив скидання паролю для цього акаунту.</p>
      <p>Натисни кнопку нижче щоб встановити новий пароль. Посилання дійсне <strong>1 годину</strong>.</p>
      <a href="${resetUrl}" class="btn">Встановити новий пароль</a>
      <p style="margin:0; font-size:13px; color:#94a3b8;">Якщо ти не запитував скидання — просто ігноруй цей лист.</p>
    `),
  })
}

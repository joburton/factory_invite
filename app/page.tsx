'use client';

import { ChangeEvent, FormEvent, ReactNode, useRef, useState } from 'react';
import { Check, Clipboard, ImagePlus, X } from 'lucide-react';
import { copyEmailToClipboard } from './clipboard';

type Status = { kind: 'idle' | 'success' | 'error'; message: string };

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c] || c);
const MAP_URL = 'https://www.google.com/maps/d/viewer?mid=1KJ7yiixl3qmhYIotcKsEc05bFZg0sNA';
const DEFAULT_MESSAGE = `I'd love to welcome you to SABIN. Let me know if you'd like to arrange a visit.\n\nA sample morning: 10 a.m. breakfast; 10:15 showroom chat; 10:30 factory tour; 11 a.m. workshop: make your own felt souvenir\n\nMake a little time for Chicago, too. Explore our picks for architecture, sights, and dinner: [Explore Chicago](${MAP_URL})`;

const safeUrl = (value: string) => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
function messageHtml(value: string) {
  const pattern = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>]+)/g;
  let result = '', last = 0;
  for (const match of value.matchAll(pattern)) {
    result += escapeHtml(value.slice(last, match.index)).replace(/\n/g, '<br>');
    const raw = match[2] || match[3];
    const url = safeUrl(raw);
    result += url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:#161612;text-decoration:underline;overflow-wrap:anywhere;">${escapeHtml(match[1] || raw)}</a>` : escapeHtml(match[0]);
    last = match.index! + match[0].length;
  }
  return result + escapeHtml(value.slice(last)).replace(/\n/g, '<br>');
}
type Visit = { date: string; hotel: string; address: string; website: string; maps: string };
const whenText = (date: string) => date ? new Intl.DateTimeFormat('en-US', {month:'long', day:'numeric', year:'numeric', timeZone:'UTC'}).format(new Date(date + 'T12:00:00Z')) : 'Contact your host to coordinate';
const hotelMap = (visit: Visit) => safeUrl(visit.maps) || (visit.address.trim() ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([visit.hotel, visit.address].filter(Boolean).join(', '))}` : '');


async function fileDataUrl(path: string) {
  const response = await fetch(path);
  if (!response.ok) throw new Error('Asset unavailable');
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function emailImages() {
  const response = await fetch('email-images.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Email image settings unavailable');
  const config = await response.json();
  const resolve = (url: unknown, fallback: string) => {
    if (!url) return fileDataUrl(fallback);
    if (typeof url !== 'string' || !safeUrl(url) || new URL(url).protocol !== 'https:') {
      throw new Error('Email images need public HTTPS addresses');
    }
    return Promise.resolve(url);
  };
  return Promise.all([
    resolve(config.sabinLogoUrl, 'sabin-logo-email.png'),
    resolve(config.factoryPhotoUrl, 'factory-sewing.jpg'),
  ]);
}


function buildEmail(name: string, company: string, email: string, message: string, logo: string, sabinLogo: string, factoryPhoto: string, visit: Visit) {
  const esc = escapeHtml;
  const table = 'border-collapse:collapse;border-spacing:0;mso-table-lspace:0pt;mso-table-rspace:0pt;table-layout:fixed;';
  const cell = 'padding:20px 16px;border-bottom:1px solid #171714;';
  const normal = 'font:12px/17px Helvetica,Arial,sans-serif;color:#161612;';
  const contactWidth = 468;
  const fit = (text: string, base: number) => Math.min(base, Math.floor(contactWidth / Math.max(1, text.length * 0.85) * 10) / 10);
  const maps = hotelMap(visit), website = safeUrl(visit.website);
  const hotel = visit.hotel.trim() || visit.address.trim() || maps || website ? `<td class="sabin-hotel" width="33.333%" valign="top" style="padding:16px;border-left:1px solid #171714;${normal}overflow-wrap:anywhere;"><strong>Where you’re staying</strong>${visit.hotel.trim() ? `<br>${esc(visit.hotel.trim())}` : ''}${visit.address.trim() ? `<br>${esc(visit.address.trim())}` : ''}${maps || website ? '<br>' : ''}${maps ? `<a target="_blank" rel="noopener noreferrer" style="color:#161612;text-decoration:underline" href="${esc(maps)}">Google Maps</a>` : ''}${maps && website ? ' · ' : ''}${website ? `<a target="_blank" rel="noopener noreferrer" style="color:#161612;text-decoration:underline" href="${esc(website)}">Hotel website</a>` : ''}</td>` : '';
  const contactLine = (value: string, base: number, bold = false, href = '') => {
    const size = fit(value, base);
    const style = `display:block;margin:0;white-space:nowrap;overflow:hidden;--contact-size:${size}px;--contact-units:${Math.max(1,value.length * 0.85)};font:${bold ? 'bold ' : ''}${size}px/20px Helvetica,Arial,sans-serif;color:#161612;text-decoration:none;`;
    return href ? `<a class="sabin-contact-line" href="${esc(href)}" style="${style}">${esc(value)}</a>` : `<div class="sabin-contact-line" style="${style}">${esc(value)}</div>`;
  };
  return `<table class="sabin-invite" role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;${table}background:#fbfaf7;border:1px solid #171714;color:#161612;font-family:Helvetica,Arial,sans-serif;">
  <tr><td style="padding:18px 16px;border-bottom:1px solid #171714;font-size:0;line-height:0;"><img src="${sabinLogo}" height="24" alt="Sabin" style="display:block;height:24px;width:auto;max-width:100%;border:0;"></td></tr>
  <tr><td style="padding:0;border-bottom:1px solid #171714;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;${table}"><tr><td width="50%" class="sabin-title" style="padding:20px 16px;font:normal 30px/31px Helvetica,Arial,sans-serif;letter-spacing:-1.2px;border-right:1px solid #171714;">COME SEE HOW<br>IT’S MADE</td><td width="50%" style="padding:20px 16px;${normal}">You’re invited! Join us and experience the processes and people that make acoustics and lighting happen.</td></tr></table></td></tr>
  <tr><td style="padding:0;border-bottom:1px solid #171714;font-size:0;line-height:0;"><img src="${factoryPhoto}" width="600" alt="Sewing felt at the Sabin factory" style="display:block;width:100%;max-width:600px;height:auto;border:0;margin:0;"></td></tr>
  <tr><td style="padding:0;border-bottom:1px solid #171714;"><table class="sabin-visit-details" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;${table}"><tr><td width="${hotel ? '33.333%' : '50%'}" valign="top" style="padding:16px;border-right:1px solid #171714;${normal}"><strong>Where</strong><br>4777 W Cortland<br>60633 Chicago, IL</td><td width="${hotel ? '33.333%' : '50%'}" valign="top" style="padding:16px;${normal}"><strong>When</strong><br>${esc(whenText(visit.date))}</td>${hotel}</tr></table></td></tr>
  <tr><td style="${cell}font:italic 13px/20px Georgia,'Times New Roman',serif;overflow-wrap:anywhere;word-wrap:break-word;">${messageHtml(message)}</td></tr>
  <tr><td style="padding:16px;"><table class="sabin-contact" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;${table}"><tr><td width="84" style="width:84px;padding:0;vertical-align:middle;">${logo ? `<img src="${logo}" width="84" alt="${esc(company)} logo" style="display:block;max-width:84px;max-height:60px;width:auto;height:auto;">` : '<div style="border:1px dotted #aaa9a2;padding:20px 4px;text-align:center;font:10px Helvetica,Arial,sans-serif;">Your Logo</div>'}</td><td class="sabin-contact-details" style="padding:0 0 0 12px;vertical-align:middle;overflow:hidden;">${contactLine(name.trim() || 'Your Name',15,true)}${contactLine(company.trim() || 'Agency',12)}${contactLine(email.trim() || 'RSVP Contact',12,false,'mailto:'+email.trim())}</td></tr></table></td></tr>
  </table>`.replace(/>\s+</g, '><');
}

export default function Home() {
  const [name, setName] = useState('Jane Smith');
  const [company, setCompany] = useState('Smith Contract');
  const [email, setEmail] = useState('jane@smithcontract.com');
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [logo, setLogo] = useState('');
  const [logoName, setLogoName] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle', message: 'Preview updates automatically.' });
  const fileRef = useRef<HTMLInputElement>(null);
  const [dateMode, setDateMode] = useState('tbd');
  const [date, setDate] = useState('');
  const [hotel, setHotel] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [maps, setMaps] = useState('');
  const visit = { date: dateMode === 'specific' ? date : '', hotel, address, website, maps };
  const preview = buildEmail(name, company, email, message, logo, 'sabin-logo.svg', 'factory-sewing.jpg', visit);

  const validate = () => {
    if (!name.trim() || !company.trim() || !email.trim()) {
      setStatus({ kind: 'error', message: 'Complete your name, agency, and RSVP contact.' }); return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus({ kind: 'error', message: 'Enter a valid RSVP email.' }); return false;
    }
    if (dateMode === 'specific' && !date) { setStatus({kind:'error',message:'Choose a visit date or select TBD.'}); return false; }
    if ([website, maps].some(url => url.trim() && !safeUrl(url.trim()))) { setStatus({kind:'error',message:'Use a complete http:// or https:// hotel link.'}); return false; }
    return true;
  };

  const onLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 3_000_000) {
      setStatus({ kind: 'error', message: 'Choose a PNG, JPG, WebP, or SVG under 3 MB.' }); event.target.value = ''; return;
    }
    const reader = new FileReader();
    reader.onload = () => { setLogo(String(reader.result)); setLogoName(file.name); setStatus({ kind: 'idle', message: 'Logo added and scaled automatically.' }); };
    reader.onerror = () => setStatus({ kind: 'error', message: 'That logo could not be read. Try another image.' });
    reader.readAsDataURL(file);
  };

  const copyInvitation = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    const plain = `COME SEE HOW IT'S MADE\n\nYou’re invited! Join us and experience the processes and people that make acoustics and lighting happen.\n\n4777 W Cortland\n60633 Chicago, IL\n\nWhen: ${whenText(visit.date)}\n\n${message}\n\n${[hotel, address, hotelMap(visit), safeUrl(website)].filter(Boolean).join("\n")}\n\n${name}\n${company}\n${email}`;
    try {
      setStatus({ kind: 'idle', message: 'Preparing your invitation…' });
      const payload = emailImages().then(([sabinLogo, factoryPhoto]) =>
        buildEmail(name, company, email, message, logo, sabinLogo, factoryPhoto, visit));
      await copyEmailToClipboard(payload, plain);
      setStatus({ kind: 'success', message: 'Invitation copied. Open a new email and paste.' });
    } catch { setStatus({ kind: 'error', message: 'Copy was blocked. Allow clipboard access and try again.' }); }
  };

  const clearLogo = () => { setLogo(''); setLogoName(''); if (fileRef.current) fileRef.current.value = ''; };

  return <main className="min-h-screen bg-[#efefed] p-4 text-[#0b0b09] sm:p-7 lg:p-10">
    <div className="mx-auto grid max-w-[1600px] border border-[#171714] bg-[#f1f1ee] lg:grid-cols-[460px_minmax(0,1fr)]">
      <aside className="border-b border-[#171714] lg:border-b-0 lg:border-r">
        <h1 className="border-b border-[#171714] px-5 py-7 text-[30px] font-normal leading-[31px] tracking-[-1.2px] sm:px-6">FOR AGENTS</h1>
        <div className="border-b border-[#171714] px-5 py-5 text-[13px] font-normal leading-5 text-[#7b7b7a] sm:px-6">Personalize your factory visit invitation.<br />Add your details, then copy invite and paste in your email.</div>
        <form onSubmit={copyInvitation}>
          <FormRow label="Your Name"><input value={name} onChange={e => setName(e.target.value)} maxLength={80} /></FormRow>
          <FormRow label="Agency"><input value={company} onChange={e => setCompany(e.target.value)} maxLength={100} /></FormRow>
          <FormRow label="RSVP Contact"><input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={120} /></FormRow>
          <div className="grid min-h-[76px] grid-cols-[45%_55%] border-b border-[#171714]">
            <div className="flex flex-col justify-center px-5 font-sans text-[13px]"><span>Logo</span><span className="mt-1 text-[13px] leading-5 text-[#7b7b7a]">PNG, JPG, WebP, or SVG · max 3 MB</span></div>
            <div className="flex items-center border-l border-[#171714] px-3"><input ref={fileRef} className="sr-only" id="logo-upload" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onLogo} />{logo ? <div className="flex w-full items-center gap-2"><img src={logo} alt="Uploaded logo" className="h-9 w-12 object-contain" /><span className="min-w-0 flex-1 truncate text-[11px]">{logoName}</span><button type="button" onClick={clearLogo} aria-label="Remove logo" className="p-1"><X size={15} /></button></div> : <label htmlFor="logo-upload" className="flex cursor-pointer items-center gap-2 text-[13px]"><ImagePlus size={16} />Choose logo</label>}</div>
          </div>
          <FormRow label="Visit date"><select aria-label="Visit date" value={dateMode} onChange={e => setDateMode(e.target.value)}><option value="tbd">TBD</option><option value="specific">Specific date</option></select></FormRow>
          {dateMode === 'specific' && <FormRow label="Date"><input type="date" required value={date} onChange={e => setDate(e.target.value)} /></FormRow>}
          <FormRow label="Hotel name"><input value={hotel} onChange={e => setHotel(e.target.value)} placeholder="Optional" maxLength={120} /></FormRow>
          <FormRow label="Hotel address"><input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, city, ZIP" maxLength={240} /></FormRow>
          <FormRow label="Hotel website"><input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" /></FormRow>
          <FormRow label="Google Maps link"><input type="url" value={maps} onChange={e => setMaps(e.target.value)} placeholder="Created from address" /></FormRow>
          <FormRow label="Personal message" tall><textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={2000} /></FormRow>
          <p className="border-b border-[#171714] px-5 py-3 text-[13px] leading-5 text-[#7b7b7a]">Copy your invitation, then paste it into your email.</p>
          <button type="submit" className="flex min-h-[58px] w-full items-center justify-center gap-3 border-b border-[#171714] bg-[#f05b24] px-5 text-[22px] text-white transition hover:bg-[#da4d19] focus:outline-none focus-visible:outline focus-visible:outline-offset-[-1px] focus-visible:outline-[#171714]"><Clipboard size={20} />Copy Invitation</button>
          <div aria-live="polite" className={`flex min-h-[54px] items-start gap-2 px-5 py-4 text-[13px] leading-5 ${status.kind === 'success' ? 'bg-[#e8f2e9] text-[#28733d]' : 'text-[#7b7b7a]'}`}>{status.kind === 'success' && <Check size={14} className="shrink-0" />}{status.message}</div>
        </form>
      </aside>

      <section aria-label="Invitation preview" className="invitation-preview min-w-0 p-3 sm:p-8 xl:p-14">
        <div className="mx-auto max-w-[600px] shadow-[8px_10px_16px_rgba(0,0,0,0.12)]" dangerouslySetInnerHTML={{__html:preview}} />
      </section>
    </div>
  </main>;
}

function FormRow({ label, tall = false, children }: { label: string; tall?: boolean; children: ReactNode }) {
  return <label className={`grid grid-cols-[45%_55%] border-b border-[#171714] ${tall ? 'min-h-[200px]' : 'min-h-[58px]'}`}><span className="flex items-center px-5 font-sans text-[13px]">{label}</span><span className="min-w-0 border-l border-[#171714] [&_select]:w-full [&_select]:h-full [&_select]:bg-transparent [&_select]:px-3 [&_select]:text-[13px] [&_input]:min-w-0 [&_input]:h-full [&_input]:w-full [&_input]:bg-transparent [&_input]:px-3 [&_input]:text-[13px] [&_input]:outline-none [&_input]:focus:bg-white [&_textarea]:h-full [&_textarea]:w-full [&_textarea]:resize-none [&_textarea]:bg-transparent [&_textarea]:px-3 [&_textarea]:py-3 [&_textarea]:font-sans [&_textarea]:text-[13px] [&_textarea]:leading-[1.35] [&_textarea]:outline-none [&_textarea]:focus:bg-white">{children}</span></label>;
}

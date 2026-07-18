import React from 'react';
import { Article } from '../types';
import NewsletterForm from './NewsletterForm';

const SocialSidebar: React.FC<{ articles?: Article[]; onArticleClick?: (article: Article) => void }> = ({ articles = [], onArticleClick }) => {
  const socialLinks = [
    {
      name: 'Telegram',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.74-3.33 3.7-1.53 4.47-1.8 4.97-1.8.11 0 .35.03.5.15.13.11.17.25.18.35a.8.8 0 01-.01.21z"/></svg>,
      count: '17.5k',
      color: 'bg-gradient-to-br from-[#2AABEE] via-[#24A1DE] to-[#0d8ecf]',
      glow: 'hover:shadow-[0_12px_28px_-6px_rgba(36,161,222,0.55)]',
      url: 'https://t.me/tuttoxandroid'
    },
    {
      name: 'Whatsapp',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.408.002 12.04c0 2.12.554 4.189 1.602 6.06L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.635 0 12.046-5.411 12.048-12.042 0-3.217-1.253-6.241-3.529-8.517z"/></svg>,
      count: '4k',
      color: 'bg-gradient-to-br from-[#34e07b] via-[#25D366] to-[#128C7E]',
      glow: 'hover:shadow-[0_12px_28px_-6px_rgba(37,211,102,0.5)]',
      url: 'https://whatsapp.com/channel/0029Va7xizpJ3jv7HZbVVH3a'
    },
    {
      name: 'Facebook',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
      count: '12.5k',
      color: 'bg-gradient-to-br from-[#4b9bff] via-[#1877F2] to-[#0b5fcc]',
      glow: 'hover:shadow-[0_12px_28px_-6px_rgba(24,119,242,0.5)]',
      url: 'https://www.facebook.com/tuttoxandroidcom'
    },
    {
      name: 'Instagram',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
      count: '14.7k',
      color: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
      glow: 'hover:shadow-[0_12px_28px_-6px_rgba(220,39,67,0.5)]',
      url: 'https://www.instagram.com/offerte_italy/'
    },
    {
      name: 'TikTok',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.3-.85.51-1.44 1.43-1.58 2.41-.05.4-.04.81.04 1.21.16 1.07.94 2.01 1.93 2.41.62.27 1.3.4 1.97.35 1.05-.03 2.07-.49 2.72-1.33.45-.58.69-1.3.71-2.02.01-4.48-.01-8.96-.01-13.44z"/></svg>,
      count: '120k',
      color: 'bg-gradient-to-br from-[#25F4EE] via-[#000000] to-[#FE2C55]',
      glow: 'hover:shadow-[0_12px_28px_-6px_rgba(254,44,85,0.45)]',
      url: 'https://tiktok.com/@tuttoxandroid'
    },
    {
      name: 'YouTube',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
      count: '1.7k',
      color: 'bg-gradient-to-br from-[#ff4d4d] via-[#FF0000] to-[#b80000]',
      glow: 'hover:shadow-[0_12px_28px_-6px_rgba(255,0,0,0.5)]',
      url: 'https://www.youtube.com/@AndroitechBlogspotIt'
    }
  ];

  const suggested = (articles || []).slice(0, 10);

  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-[2rem] shadow-lg border border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#e31b23] rounded-full blur-[50px] opacity-25 pointer-events-none" />
        <div className="relative z-10">
          <NewsletterForm
            source="home_sidebar"
            variant="dark"
            title="Newsletter"
            subtitle="News, guide e offerte tech. Zero spam."
            buttonLabel="Iscriviti gratis"
          />
        </div>
      </div>

    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
      <h3 className="font-condensed text-3xl font-black uppercase italic mb-6 tracking-tight text-gray-900 border-b-4 border-[#e31b23] pb-1 w-fit">Seguici</h3>
      <div className="grid grid-cols-2 gap-3">
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${social.name} — ${social.count}`}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl text-white shadow-md transition-all duration-300 transform hover:scale-110 hover:-translate-y-0.5 active:scale-95 ${social.color} ${social.glow} group relative overflow-hidden`}
          >
            {/* Shine sweep (stile moderno come IG) */}
            <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-[socialShine_0.85s_ease]" />
            </span>
            <span className="pointer-events-none absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white/15 blur-xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10 mb-2 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">
              {social.icon}
            </div>
            <p className="relative z-10 text-[10px] font-black uppercase tracking-widest drop-shadow-sm">{social.count}</p>
          </a>
        ))}
      </div>

      {suggested.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-condensed text-xl font-black uppercase tracking-tight mb-3 text-gray-900 border-b-2 border-[#e31b23] pb-1 w-fit">LEGGI ANCHE</h3>
          <div className="space-y-1">
            {suggested.map((art) => (
              <div
                key={art.id}
                onClick={() => onArticleClick && onArticleClick(art)}
                className="group relative flex h-20 overflow-hidden rounded-xl border border-gray-100 bg-white cursor-pointer"
              >
                <div className="relative w-[22%] flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-out group-hover:w-full">
                  {art.imageUrl ? (
                    <img
                      src={art.imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />
                </div>

                <div className="flex-1 min-w-0 px-2.5 py-1.5 flex flex-col justify-center transition-opacity duration-150 group-hover:opacity-0">
                  <span className="text-[10px] font-extrabold text-[#e31b23] tracking-wide leading-none mb-0.5">{art.category}</span>
                  <div className="text-sm font-semibold leading-tight text-gray-900 line-clamp-2 pr-1">
                    {art.title}
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="w-[58%] h-full bg-gradient-to-l from-black/92 via-black/78 to-transparent p-3 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-white/80 tracking-wide mb-0.5">{art.category}</span>
                    <div className="text-white text-[13px] font-semibold leading-snug line-clamp-3">
                      {art.title}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-gray-400 font-medium">Altri articoli ti aspettano →</div>
        </div>
      )}
    </div>
    </div>
  );
};

export default SocialSidebar;

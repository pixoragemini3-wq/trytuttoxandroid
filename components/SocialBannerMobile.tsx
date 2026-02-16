
import React from 'react';

interface SocialBannerMobileProps {
  isFixed?: boolean;
}

const SocialBannerMobile: React.FC<SocialBannerMobileProps> = ({ isFixed = false }) => {
  const platforms = [
    { name: 'Telegram', url: 'https://t.me/tuttoxandroid', icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.36-.49.99-.75 3.88-1.69 6.46-2.8 7.74-3.33 3.7-1.53 4.47-1.8 4.97-1.8.11 0 .35.03.5.15.13.11.17.25.18.35a.8.8 0 01-.01.21z"/> },
    { name: 'WhatsApp', url: 'https://whatsapp.com/channel/tuttoxandroid', icon: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.408.002 12.04c0 2.12.554 4.189 1.602 6.06L0 24l6.117-1.605a11.803 11.803 0 005.925 1.586h.005c6.635 0 12.046-5.411 12.048-12.042 0-3.217-1.253-6.241-3.529-8.517z"/> },
    { name: 'Facebook', url: 'https://facebook.com/tuttoxandroid', icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/> }
  ];

  const baseClasses = "lg:hidden w-full overflow-hidden py-2 px-4 bg-yellow-400 shadow-sm";
  const positionClasses = isFixed 
    ? "fixed bottom-0 left-0 z-40 border-t border-yellow-500 animate-in slide-in-from-bottom duration-300" 
    : "relative border-b border-gray-100 mb-4 mt-4";

  return (
    <div className={`${baseClasses} ${positionClasses}`}>
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] font-black uppercase text-black tracking-[0.2em] mr-4 drop-shadow-sm">SEGUICI ORA:</span>
        <div className="flex flex-1 justify-around items-center">
          {platforms.map(p => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener" className="text-black hover:scale-125 transition-all active:scale-90 p-1">
              <svg className="w-6 h-6 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">{p.icon}</svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialBannerMobile;

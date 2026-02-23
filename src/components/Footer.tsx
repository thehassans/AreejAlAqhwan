'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { FaInstagram, FaFacebookF, FaXTwitter, FaTiktok, FaSnapchat, FaWhatsapp } from 'react-icons/fa6';
import { useLanguageStore } from '@/store/languageStore';
import { translations } from '@/i18n/translations';

interface SocialLinks {
  instagram?: string; instagramEnabled?: boolean;
  facebook?: string; facebookEnabled?: boolean;
  twitter?: string; twitterEnabled?: boolean;
  tiktok?: string; tiktokEnabled?: boolean;
  snapchat?: string; snapchatEnabled?: boolean;
  phone?: string; email?: string; address?: string;
}

const socialIcons = [
  { key: 'instagram', icon: FaInstagram, baseUrl: 'https://instagram.com/', color: 'hover:bg-pink-500/20' },
  { key: 'facebook', icon: FaFacebookF, baseUrl: 'https://facebook.com/', color: 'hover:bg-blue-500/20' },
  { key: 'twitter', icon: FaXTwitter, baseUrl: 'https://x.com/', color: 'hover:bg-gray-400/20' },
  { key: 'tiktok', icon: FaTiktok, baseUrl: 'https://tiktok.com/@', color: 'hover:bg-pink-400/20' },
  { key: 'snapchat', icon: FaSnapchat, baseUrl: 'https://snapchat.com/add/', color: 'hover:bg-yellow-400/20' },
];

export default function Footer() {
  const { locale } = useLanguageStore();
  const t = translations[locale].footer;
  const [settings, setSettings] = useState<SocialLinks>({});

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {});
  }, []);

  const whatsappLink = settings.phone
    ? `https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}`
    : '#';

  return (
    <footer className="bg-gradient-to-b from-[#2C3E35] to-[#1a2920] text-white hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full ring-2 ring-white/10 overflow-hidden flex-shrink-0 relative">
                <Image src="/logo.png" alt="Logo" fill className="object-cover" unoptimized />
              </div>
              <span className="text-xl font-bold tracking-tight">{t.brand}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">{t.brandDesc}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-5">{t.quickLinks}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {translations[locale].nav.home}
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {translations[locale].nav.products}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-5">{t.contact}</h3>
            <div className="space-y-3 text-gray-400 text-sm">
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <FiMail size={14} className="text-[#5B7B6D]" /> {settings.email}
                </a>
              )}
              {settings.phone && (
                <a href={`tel:${settings.phone}`} className="flex items-center gap-2.5 hover:text-white transition-colors" dir="ltr">
                  <FiPhone size={14} className="text-[#5B7B6D]" /> {settings.phone}
                </a>
              )}
              {settings.address && (
                <p className="flex items-center gap-2.5">
                  <FiMapPin size={14} className="text-[#5B7B6D] flex-shrink-0" /> {settings.address}
                </p>
              )}
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2 mt-5">
              {socialIcons.map(({ key, icon: Icon, baseUrl, color }) => {
                const enabled = settings[`${key}Enabled` as keyof SocialLinks];
                const handle = settings[key as keyof SocialLinks] as string;
                if (!enabled || !handle) return null;
                const url = handle.startsWith('http') ? handle : `${baseUrl}${handle}`;
                return (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                    className={`p-2.5 bg-white/5 rounded-full transition-all duration-200 ${color}`}
                    aria-label={key}>
                    <Icon size={16} />
                  </a>
                );
              })}
              {settings.phone && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                  className="p-2.5 bg-white/5 rounded-full transition-all duration-200 hover:bg-green-500/20"
                  aria-label="WhatsApp">
                  <FaWhatsapp size={16} />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-8 text-center text-gray-500 text-xs">
          <p>© {new Date().getFullYear()} {t.brand}. {t.rights}.</p>
        </div>
      </div>
    </footer>
  );
}

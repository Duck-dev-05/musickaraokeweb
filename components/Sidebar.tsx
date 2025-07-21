'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MusicalNoteIcon,
  MicrophoneIcon,
  QueueListIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Songs',
      href: '/songs',
      icon: MusicalNoteIcon,
    },
    {
      name: 'Playlists',
      href: '/playlists',
      icon: QueueListIcon,
    },
    {
      name: 'Karaoke',
      href: '/karaoke',
      icon: MicrophoneIcon,
    },
    {
      name: 'Recently Played',
      href: '/recent',
      icon: ClockIcon,
    },
  ];

  return (
    <div className="w-64 bg-dark-secondary h-full py-6">
      <div className="px-4">
        <Link href="/" className="flex items-center gap-2 mb-8 px-2">
          <MusicalNoteIcon className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Music App</span>
        </Link>

        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-dark font-medium' 
                    : 'text-gray-400 hover:text-light hover:bg-dark-hover'
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 
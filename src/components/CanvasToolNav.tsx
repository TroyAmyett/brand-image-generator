'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Package, PenTool, User, Droplets, Wand2, Scissors, Layers } from 'lucide-react';

interface CanvasTool {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
}

const canvasTools: CanvasTool[] = [
  {
    id: 'image-generator',
    name: 'Image Generator',
    href: '/',
    icon: <Sparkles size={16} />,
  },
  {
    id: 'icon-generator',
    name: 'Icon Generator',
    href: '/icons',
    icon: <Package size={16} />,
  },
  {
    id: 'logo-generator',
    name: 'Logo Generator',
    href: '/logos',
    icon: <PenTool size={16} />,
  },
  {
    id: 'character-creator',
    name: 'Characters',
    href: '/characters',
    icon: <User size={16} />,
  },
  {
    id: 'restyle-character',
    name: 'Restyle',
    href: '/restyle',
    icon: <Wand2 size={16} />,
  },
  {
    id: 'image-tools',
    name: 'Image Tools',
    href: '/image-tools',
    icon: <Scissors size={16} />,
  },
  {
    id: 'watermark-maker',
    name: 'Watermarks',
    href: '/watermarks',
    icon: <Droplets size={16} />,
  },
  {
    id: 'showcase',
    name: 'Showcase',
    href: '/showcase',
    icon: <Layers size={16} />,
  },
];

export function CanvasToolNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {canvasTools.map((tool) => {
        const active = isActive(tool.href);

        return (
          <Link
            key={tool.id}
            href={tool.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
              background: active ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
              color: active ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)',
              border: active ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid transparent',
            }}
          >
            {tool.icon}
            <span>{tool.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default CanvasToolNav;

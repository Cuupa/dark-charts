import { motion } from 'framer-motion';
import { Megaphone, Link as LinkIcon } from '@phosphor-icons/react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PromotionalSlotProps {
  type?: 'Band of the Day' | 'DJ of the Day' | string;
  name?: string;
  imageUrl?: string;
  link?: string;
}

export function PromotionalSlot({ type = 'Band of the Day', name = 'Promoted Artist', imageUrl, link }: PromotionalSlotProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden border border-accent bg-accent/5 p-6 group"
    >
      <div className="absolute top-2 right-2">
        <div className="bg-background/80 backdrop-blur-sm border border-accent/50 px-2 py-1 rounded text-[10px] font-ui uppercase tracking-widest text-accent flex items-center gap-1.5">
          <Megaphone weight="duotone" className="w-3 h-3" />
          {t('spotlight.adLabel')}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {imageUrl ? (
          <div className="w-24 h-24 rounded-none border-2 border-accent relative overflow-hidden flex-shrink-0 bg-background/50">
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" width={96} height={96} loading="lazy" />
            <div className="absolute inset-0 bg-accent/20 group-hover:bg-transparent transition-colors duration-500" />
          </div>
        ) : (
          <div className="w-24 h-24 border-2 border-accent/50 bg-background flex items-center justify-center flex-shrink-0">
            <Megaphone weight="duotone" className="w-8 h-8 text-accent/50" />
          </div>
        )}

        <div>
          <h3 className="font-ui text-xs uppercase tracking-[0.2em] text-accent mb-1">{type}</h3>
          <h2 className="display-font text-3xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{name}</h2>
          <p className="font-ui text-sm text-muted-foreground max-w-md mb-2">
            {t('spotlight.description')}
          </p>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-ui text-xs uppercase tracking-wider text-accent hover:text-accent/80 transition-colors"
            >
              <LinkIcon weight="bold" className="w-3 h-3" />
              {t('spotlight.visitProfile')}
            </a>
          )}
        </div>
      </div>

      {/* Brutalist accents */}
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-accent/30 pointer-events-none" />
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent/30 pointer-events-none" />
    </motion.div>
  );
}
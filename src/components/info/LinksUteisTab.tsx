import { useInfoData } from '@/hooks/useInfoData';
import { Card } from '@/components/ui/card';
import { ExternalLink, HelpCircle, Table, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap: Record<string, React.ElementType> = {
  ExternalLink,
  HelpCircle,
  Table,
  Link: LinkIcon,
};

export default function LinksUteisTab() {
  const { getActiveLinks } = useInfoData();
  const links = getActiveLinks();

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <LinkIcon className="h-10 w-10" />
        <p className="text-sm">Nenhum link cadastrado.</p>
        <p className="text-xs">Gerencie links em Configurações → Dados do Sistema.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-ds-sm">
      {links.map((link, i) => {
        const Icon = iconMap[link.icon] || ExternalLink;
        return (
          <motion.div
            key={link.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              <Card className="cursor-pointer overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="aspect-[4/3] flex items-center justify-center bg-muted/50 group-hover:bg-muted/80 transition-colors">
                  <Icon className="h-10 w-10 text-primary/70" />
                </div>
                <div className="p-3 text-center">
                  <p className="text-sm font-medium truncate">{link.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{link.url}</p>
                </div>
              </Card>
            </a>
          </motion.div>
        );
      })}
    </div>
  );
}

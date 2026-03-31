import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useInfoData, InfoBank, InfoDocument, InfoLink } from '@/hooks/useInfoData';
import { Plus, Landmark, FileText, Link as LinkIcon, Pencil, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InfoDataSection() {
  const { toast } = useToast();
  const {
    getBanks, addBank, updateBank, toggleBank,
    getDocuments, addDocument, updateDocument, toggleDocument,
    getLinks, addLink, updateLink, deleteLink, getActiveBanks,
  } = useInfoData();

  const banks = getBanks();
  const documents = getDocuments();
  const links = getLinks();
  const activeBanks = getActiveBanks();

  // === Bank form ===
  const [newBankName, setNewBankName] = useState('');
  const [newBankImage, setNewBankImage] = useState('');
  const [editingBank, setEditingBank] = useState<string | null>(null);
  const [editBankName, setEditBankName] = useState('');
  const [editBankImage, setEditBankImage] = useState('');

  const handleAddBank = () => {
    const name = newBankName.trim();
    if (!name) return;
    if (banks.some(b => b.name.toLowerCase() === name.toLowerCase())) {
      toast({ title: 'Banco já existe', variant: 'destructive' });
      return;
    }
    addBank(name, newBankImage.trim());
    setNewBankName('');
    setNewBankImage('');
    toast({ title: 'Banco adicionado' });
  };

  const handleSaveBank = (id: string) => {
    updateBank(id, { name: editBankName, imageUrl: editBankImage });
    setEditingBank(null);
    toast({ title: 'Banco atualizado' });
  };

  // === Document form ===
  const [newDocName, setNewDocName] = useState('');
  const [newDocBanks, setNewDocBanks] = useState<string[]>([]);
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [editDocName, setEditDocName] = useState('');
  const [editDocBanks, setEditDocBanks] = useState<string[]>([]);

  const handleAddDoc = () => {
    const name = newDocName.trim();
    if (!name) return;
    addDocument(name, newDocBanks);
    setNewDocName('');
    setNewDocBanks([]);
    toast({ title: 'Documento adicionado' });
  };

  const handleSaveDoc = (id: string) => {
    updateDocument(id, { name: editDocName, bankIds: editDocBanks });
    setEditingDoc(null);
    toast({ title: 'Documento atualizado' });
  };

  const toggleBankInList = (bankId: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(bankId) ? list.filter(id => id !== bankId) : [...list, bankId]);
  };

  // === Link form ===
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const handleAddLink = () => {
    const name = newLinkName.trim();
    const url = newLinkUrl.trim();
    if (!name || !url) return;
    addLink(name, url, 'ExternalLink');
    setNewLinkName('');
    setNewLinkUrl('');
    toast({ title: 'Link adicionado' });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Informações Úteis</h3>
        <p className="text-sm text-muted-foreground">Gerencie bancos, documentação e links que aparecem na página Informações Úteis.</p>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {/* BANKS */}
        <AccordionItem value="info-banks" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Bancos (Credenciamento)</span>
              <Badge variant="secondary" className="text-xs">
                {banks.filter(b => b.active).length}/{banks.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Nome do banco" value={newBankName} onChange={e => setNewBankName(e.target.value)} className="h-9" />
                <Input placeholder="URL da imagem (opcional)" value={newBankImage} onChange={e => setNewBankImage(e.target.value)} className="h-9" />
                <Button size="sm" onClick={handleAddBank} className="h-9 gap-1.5 shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
              <div className="space-y-1">
                {banks.map(bank => (
                  <div key={bank.id} className={cn('flex items-center justify-between rounded-md px-3 py-2 transition-colors', bank.active ? 'bg-muted/50' : 'bg-muted/20 opacity-60')}>
                    {editingBank === bank.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <Input value={editBankName} onChange={e => setEditBankName(e.target.value)} className="h-7 text-sm" />
                        <Input value={editBankImage} onChange={e => setEditBankImage(e.target.value)} placeholder="URL imagem" className="h-7 text-sm" />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleSaveBank(bank.id)}><Save className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingBank(null)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm', !bank.active && 'line-through text-muted-foreground')}>{bank.name}</span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditingBank(bank.id); setEditBankName(bank.name); setEditBankImage(bank.imageUrl); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{bank.active ? 'Ativo' : 'Inativo'}</span>
                      <Switch checked={bank.active} onCheckedChange={() => { toggleBank(bank.id); toast({ title: bank.active ? 'Banco inativado' : 'Banco ativado' }); }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* DOCUMENTS */}
        <AccordionItem value="info-docs" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Documentação</span>
              <Badge variant="secondary" className="text-xs">
                {documents.filter(d => d.active).length}/{documents.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Nome do documento" value={newDocName} onChange={e => setNewDocName(e.target.value)} className="h-9" />
                  <Button size="sm" onClick={handleAddDoc} className="h-9 gap-1.5 shrink-0">
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </Button>
                </div>
                {newDocName.trim() && (
                  <div className="flex flex-wrap gap-2 p-2 rounded-md bg-muted/30">
                    <span className="text-xs text-muted-foreground w-full mb-1">Vincular a bancos:</span>
                    {activeBanks.map(bank => (
                      <label key={bank.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Checkbox checked={newDocBanks.includes(bank.id)} onCheckedChange={() => toggleBankInList(bank.id, newDocBanks, setNewDocBanks)} />
                        {bank.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                {documents.map(doc => (
                  <div key={doc.id} className={cn('rounded-md px-3 py-2 transition-colors', doc.active ? 'bg-muted/50' : 'bg-muted/20 opacity-60')}>
                    {editingDoc === doc.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input value={editDocName} onChange={e => setEditDocName(e.target.value)} className="h-7 text-sm" />
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleSaveDoc(doc.id)}><Save className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingDoc(null)}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activeBanks.map(bank => (
                            <label key={bank.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                              <Checkbox checked={editDocBanks.includes(bank.id)} onCheckedChange={() => toggleBankInList(bank.id, editDocBanks, setEditDocBanks)} />
                              {bank.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-sm', !doc.active && 'line-through text-muted-foreground')}>{doc.name}</span>
                          {doc.bankIds.length > 0 && <Badge variant="outline" className="text-[10px]">{doc.bankIds.length} bancos</Badge>}
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { setEditingDoc(doc.id); setEditDocName(doc.name); setEditDocBanks([...doc.bankIds]); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{doc.active ? 'Ativo' : 'Inativo'}</span>
                          <Switch checked={doc.active} onCheckedChange={() => { toggleDocument(doc.id); toast({ title: doc.active ? 'Documento inativado' : 'Documento ativado' }); }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* LINKS */}
        <AccordionItem value="info-links" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Links Úteis</span>
              <Badge variant="secondary" className="text-xs">
                {links.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input placeholder="Nome" value={newLinkName} onChange={e => setNewLinkName(e.target.value)} className="h-9" />
                <Input placeholder="URL" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} className="h-9" />
                <Button size="sm" onClick={handleAddLink} className="h-9 gap-1.5 shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
              <div className="space-y-1">
                {links.map(link => (
                  <div key={link.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{link.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{link.url}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive" onClick={() => { deleteLink(link.id); toast({ title: 'Link excluído' }); }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

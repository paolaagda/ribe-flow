import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/usePermission';
import { useStores } from '@/hooks/useStores';
import { usePartners } from '@/hooks/usePartners';
import { Store } from '@/data/mock-data';
import { Plus, Edit, Trash2, Search, Store as StoreIcon, MapPin, Phone, Building2 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const emptyForm = {
  name: '',
  address: '',
  phone: '',
  contact: '',
  partnerId: '',
};

export default function StoresTab() {
  const { toast } = useToast();
  const { canWrite } = usePermission();
  const { stores, setStores } = useStores();
  const { partners } = usePartners();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  // Partners that already have a store assigned (excluding current editing store's partner)
  const assignedPartnerIds = stores
    .filter(s => s.id !== editingStore?.id)
    .map(s => s.partnerId);

  const availablePartners = partners.filter(p => !assignedPartnerIds.includes(p.id));

  const filtered = search
    ? stores.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.address.toLowerCase().includes(search.toLowerCase()) ||
        partners.find(p => p.id === s.partnerId)?.name.toLowerCase().includes(search.toLowerCase())
      )
    : stores;

  const openCreate = () => {
    setEditingStore(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      address: store.address,
      phone: store.phone,
      contact: store.contact,
      partnerId: store.partnerId,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingStore) {
      setStores(prev =>
        prev.map(s => s.id === editingStore.id ? { ...s, ...formData } : s)
      );
      toast({ title: 'Loja atualizada!' });
    } else {
      const newStore: Store = {
        id: `s${Date.now()}`,
        ...formData,
      };
      setStores(prev => [...prev, newStore]);
      toast({ title: 'Loja criada!' });
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setStores(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Loja excluída!' });
    setDeletingStoreId(null);
  };

  const isFormValid = formData.name && formData.address && formData.partnerId;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Gerencie as lojas (centros de custo) vinculadas aos parceiros.</p>
          {canWrite('stores.create') && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Nova loja
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, endereço ou parceiro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <StoreIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma loja encontrada</p>
            {canWrite('stores.create') && (
              <Button className="mt-4" onClick={openCreate}>Cadastrar primeira loja</Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(store => {
              const partner = partners.find(p => p.id === store.partnerId);
              return (
                <Card key={store.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate">{store.name}</h3>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <StoreIcon className="h-3 w-3 shrink-0" /> Centro de custo
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" /> {store.address}
                      </p>
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3 shrink-0" /> {store.phone} — {store.contact}
                      </p>
                    </div>

                    {partner && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground">
                          Parceiro: <span className="font-medium text-foreground">{partner.name}</span>
                        </p>
                      </div>
                    )}

                    <div className="flex gap-1">
                      {canWrite('stores.edit') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(store)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      )}
                      {canWrite('stores.delete') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingStoreId(store.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStore ? 'Editar Loja' : 'Nova Loja (Centro de Custo)'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              {/* ── Identificação da Loja ── */}
              <fieldset className="space-y-3 border border-border/50 rounded-lg p-4">
                <legend className="text-xs font-semibold text-muted-foreground px-2">Identificação</legend>
                <div className="space-y-2">
                  <Label>Nome da loja <span className="text-destructive">*</span></Label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Filial Centro" />
                  {!formData.name && formData.address && <p className="text-[10px] text-destructive">Nome é obrigatório</p>}
                </div>
              </fieldset>

              {/* ── Localização e Contato ── */}
              <fieldset className="space-y-3 border border-border/50 rounded-lg p-4">
                <legend className="text-xs font-semibold text-muted-foreground px-2">Localização e Contato</legend>
                <div className="space-y-2">
                  <Label>Endereço <span className="text-destructive">*</span></Label>
                  <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Rua, número — Cidade, UF" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 0000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Contato</Label>
                    <Input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} placeholder="Nome do contato" />
                  </div>
                </div>
              </fieldset>

              {/* ── Vínculo com Parceiro ── */}
              <fieldset className="space-y-3 border border-border/50 rounded-lg p-4">
                <legend className="text-xs font-semibold text-muted-foreground px-2">Parceiro Vinculado</legend>
                <div className="space-y-2">
                  <Label>Parceiro <span className="text-destructive">*</span></Label>
                  <Select value={formData.partnerId} onValueChange={v => setFormData({ ...formData, partnerId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o parceiro" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePartners.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} — {p.cnpj}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Relação 1:1 — cada loja pertence a um único parceiro.</p>
                </div>
              </fieldset>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!isFormValid}>
                {editingStore ? 'Salvar' : 'Cadastrar loja'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingStoreId} onOpenChange={() => setDeletingStoreId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir loja</AlertDialogTitle>
              <AlertDialogDescription>Deseja excluir esta loja? Essa ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletingStoreId && handleDelete(deletingStoreId)}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}

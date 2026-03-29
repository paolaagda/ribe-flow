import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/usePermission';
import { usePartners } from '@/hooks/usePartners';
import { useStores } from '@/hooks/useStores';
import { mockUsers, Partner, Store, STORE_STRUCTURES, getUserById } from '@/data/mock-data';
import { Plus, Edit, Trash2, Search, Building2, MapPin, Phone, Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const potentialColors: Record<string, string> = {
  alto: 'bg-success/10 text-success border-success/20',
  médio: 'bg-warning/10 text-warning border-warning/20',
  baixo: 'bg-destructive/10 text-destructive border-destructive/20',
};

const emptyForm = {
  name: '',
  razaoSocial: '',
  cnpj: '',
  address: '',
  phone: '',
  contact: '',
  structures: [] as string[],
  responsibleUserId: '',
  potential: '' as 'alto' | 'médio' | 'baixo' | '',
  storeId: '',
};

const CSV_HEADERS = ['Nome da Loja', 'Razão Social', 'CNPJ', 'Endereço', 'Telefone', 'Contato', 'Estruturas (separar por ;)', 'Potencial (alto/médio/baixo)', 'Email Comercial Responsável'];

interface ImportRow {
  name: string;
  razaoSocial: string;
  cnpj: string;
  address: string;
  phone: string;
  contact: string;
  structures: string[];
  potential: 'alto' | 'médio' | 'baixo';
  responsibleEmail: string;
  responsibleUserId: string;
  valid: boolean;
  errors: string[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export default function PartnersTab() {
  const { toast } = useToast();
  const { canWrite } = usePermission();
  const { partners, setPartners } = usePartners();
  const { stores } = useStores();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deletingPartnerId, setDeletingPartnerId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importStep, setImportStep] = useState<'upload' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const commercials = mockUsers.filter(u => u.role === 'comercial');

  // Available stores not yet linked to a partner (excluding current editing partner)
  const assignedStoreIds = partners
    .filter(p => p.id !== editingPartner?.id)
    .map(p => {
      const store = stores.find(s => s.partnerId === p.id);
      return store?.id;
    })
    .filter(Boolean);

  const availableStores = stores.filter(s => !assignedStoreIds.includes(s.id));

  const filtered = search
    ? partners.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.cnpj.includes(search) ||
        p.razaoSocial.toLowerCase().includes(search.toLowerCase())
      )
    : partners;

  const openCreate = () => {
    setEditingPartner(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: Partner) => {
    setEditingPartner(p);
    const linkedStore = stores.find(s => s.partnerId === p.id);
    setFormData({
      name: p.name,
      razaoSocial: p.razaoSocial,
      cnpj: p.cnpj,
      address: p.address,
      phone: p.phone,
      contact: p.contact,
      structures: [...p.structures],
      responsibleUserId: p.responsibleUserId,
      potential: p.potential,
      storeId: linkedStore?.id || '',
    });
    setShowForm(true);
  };

  const toggleStructure = (structure: string) => {
    setFormData(prev => ({
      ...prev,
      structures: prev.structures.includes(structure)
        ? prev.structures.filter(s => s !== structure)
        : [...prev.structures, structure],
    }));
  };

  const handleSave = () => {
    if (editingPartner) {
      setPartners(prev =>
        prev.map(p =>
          p.id === editingPartner.id
            ? { ...p, ...formData, potential: formData.potential as 'alto' | 'médio' | 'baixo' }
            : p
        )
      );
      toast({ title: 'Parceiro atualizado!' });
    } else {
      const newPartner: Partner = {
        id: `p${Date.now()}`,
        name: formData.name,
        razaoSocial: formData.razaoSocial,
        cnpj: formData.cnpj,
        address: formData.address,
        lat: 0,
        lng: 0,
        structures: formData.structures,
        potential: formData.potential as 'alto' | 'médio' | 'baixo',
        phone: formData.phone,
        contact: formData.contact,
        responsibleUserId: formData.responsibleUserId,
      };
      setPartners(prev => [...prev, newPartner]);
      toast({ title: 'Parceiro criado!' });
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setPartners(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Parceiro excluído!' });
    setDeletingPartnerId(null);
  };

  // ── Export template CSV ──
  const handleExportTemplate = () => {
    const bom = '\uFEFF';
    const exampleRow = [
      'Exemplo Loja',
      'Exemplo Ltda',
      '00.000.000/0001-00',
      'Rua Exemplo, 100 — Cidade, UF',
      '(00) 0000-0000',
      'Nome do Contato',
      'Help;Loja balcão',
      'alto',
      commercials[0]?.email || 'comercial@empresa.com',
    ].join(',');

    const csv = bom + CSV_HEADERS.join(',') + '\n' + exampleRow + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_parceiros.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Planilha modelo exportada!' });
  };

  // ── Import CSV ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());

      if (lines.length < 2) {
        toast({ title: 'Arquivo vazio ou sem dados', variant: 'destructive' });
        return;
      }

      // Skip header
      const dataLines = lines.slice(1);
      const parsed: ImportRow[] = dataLines.map(line => {
        const cols = parseCSVLine(line);
        const errors: string[] = [];

        const name = cols[0] || '';
        const razaoSocial = cols[1] || '';
        const cnpj = cols[2] || '';
        const address = cols[3] || '';
        const phone = cols[4] || '';
        const contact = cols[5] || '';
        const structuresRaw = cols[6] || '';
        const potentialRaw = (cols[7] || '').toLowerCase().trim();
        const responsibleEmail = (cols[8] || '').trim();

        if (!name) errors.push('Nome obrigatório');
        if (!razaoSocial) errors.push('Razão social obrigatória');
        if (!cnpj) errors.push('CNPJ obrigatório');
        if (!address) errors.push('Endereço obrigatório');

        // Check duplicate CNPJ
        if (cnpj && partners.some(p => p.cnpj === cnpj)) {
          errors.push('CNPJ já cadastrado');
        }

        const potential = (['alto', 'médio', 'medio', 'baixo'].includes(potentialRaw)
          ? (potentialRaw === 'medio' ? 'médio' : potentialRaw)
          : '') as 'alto' | 'médio' | 'baixo';
        if (!potential) errors.push('Potencial inválido');

        const structures = structuresRaw
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        const foundUser = mockUsers.find(u => u.email.toLowerCase() === responsibleEmail.toLowerCase() && u.role === 'comercial');
        if (!foundUser && responsibleEmail) errors.push('Comercial não encontrado');
        if (!responsibleEmail) errors.push('Email do comercial obrigatório');

        return {
          name,
          razaoSocial,
          cnpj,
          address,
          phone,
          contact,
          structures,
          potential: potential || 'baixo',
          responsibleEmail,
          responsibleUserId: foundUser?.id || '',
          valid: errors.length === 0,
          errors,
        };
      });

      setImportRows(parsed);
      setImportStep('preview');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    const validRows = importRows.filter(r => r.valid);
    if (validRows.length === 0) {
      toast({ title: 'Nenhum registro válido para importar', variant: 'destructive' });
      return;
    }

    const newPartners: Partner[] = validRows.map((row, idx) => ({
      id: `p${Date.now()}_${idx}`,
      name: row.name,
      razaoSocial: row.razaoSocial,
      cnpj: row.cnpj,
      address: row.address,
      lat: 0,
      lng: 0,
      structures: row.structures,
      potential: row.potential,
      phone: row.phone,
      contact: row.contact,
      responsibleUserId: row.responsibleUserId,
    }));

    setPartners(prev => [...prev, ...newPartners]);
    toast({ title: `${validRows.length} parceiro(s) importado(s) com sucesso!` });
    setShowImportDialog(false);
    setImportRows([]);
    setImportStep('upload');
  };

  const isFormValid = formData.name && formData.razaoSocial && formData.cnpj && formData.address && formData.responsibleUserId && formData.potential;

  const validCount = importRows.filter(r => r.valid).length;
  const invalidCount = importRows.filter(r => !r.valid).length;

  return (
    <>
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">Gerencie os parceiros cadastrados no sistema.</p>
        <div className="flex items-center gap-2">
          {canWrite('partners.bulkImport') && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleExportTemplate}>
                    <Download className="h-4 w-4 mr-1" /> Modelo
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Baixar planilha modelo para preenchimento</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => { setShowImportDialog(true); setImportStep('upload'); setImportRows([]); }}>
                    <Upload className="h-4 w-4 mr-1" /> Importar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Importar parceiros em lote via CSV</TooltipContent>
              </Tooltip>
            </>
          )}
          {canWrite('partners.create') && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Novo parceiro
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, razão social ou CNPJ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum parceiro encontrado</p>
          {canWrite('partners.create') && (
            <Button className="mt-4" onClick={openCreate}>Cadastrar primeiro parceiro</Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(partner => {
            const responsible = getUserById(partner.responsibleUserId);
            return (
              <Card key={partner.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">{partner.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{partner.razaoSocial}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] shrink-0', potentialColors[partner.potential])}>
                      {partner.potential}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="truncate">CNPJ: {partner.cnpj}</p>
                    <p className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 shrink-0" /> {partner.address}
                    </p>
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3 shrink-0" /> {partner.phone} — {partner.contact}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {partner.structures.map(s => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>

                  {responsible && (
                    <p className="text-[10px] text-muted-foreground">
                      Comercial: <span className="font-medium text-foreground">{responsible.name}</span>
                    </p>
                  )}

                  <div className="flex gap-1">
                      {canWrite('partners.edit') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(partner)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      )}
                      {canWrite('partners.delete') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingPartnerId(partner.id)}>
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

      {/* Partner Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPartner ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* ── Identificação ── */}
            <fieldset className="space-y-3 border border-border/50 rounded-lg p-4">
              <legend className="text-xs font-semibold text-muted-foreground px-2">Identificação</legend>
              <div className="space-y-2">
                <Label>Nome do parceiro <span className="text-destructive">*</span></Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Crédito Fácil" />
                {!formData.name && formData.razaoSocial && <p className="text-[10px] text-destructive">Nome é obrigatório</p>}
              </div>
              <div className="space-y-2">
                <Label>Razão social <span className="text-destructive">*</span></Label>
                <Input value={formData.razaoSocial} onChange={e => setFormData({ ...formData, razaoSocial: e.target.value })} placeholder="Ex: Crédito Fácil Ltda" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CNPJ <span className="text-destructive">*</span></Label>
                  <Input value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(00) 0000-0000" />
                </div>
              </div>
            </fieldset>

            {/* ── Localização e Contato ── */}
            <fieldset className="space-y-3 border border-border/50 rounded-lg p-4">
              <legend className="text-xs font-semibold text-muted-foreground px-2">Localização e Contato</legend>
              <div className="space-y-2">
                <Label>Endereço <span className="text-destructive">*</span></Label>
                <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Rua, número — Cidade, UF" />
              </div>
              <div className="space-y-2">
                <Label>Contato</Label>
                <Input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} placeholder="Nome do contato principal" />
              </div>
            </fieldset>

            {/* ── Estrutura e Classificação ── */}
            <fieldset className="space-y-3 border border-border/50 rounded-lg p-4">
              <legend className="text-xs font-semibold text-muted-foreground px-2">Estrutura e Classificação</legend>
              <div className="space-y-2">
                <Label>Estrutura da loja</Label>
                <div className="flex flex-wrap gap-3">
                  {STORE_STRUCTURES.map(s => (
                    <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={formData.structures.includes(s)} onCheckedChange={() => toggleStructure(s)} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Comercial responsável <span className="text-destructive">*</span></Label>
                  <Select value={formData.responsibleUserId} onValueChange={v => setFormData({ ...formData, responsibleUserId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {commercials.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Score de potencial <span className="text-destructive">*</span></Label>
                  <Select value={formData.potential} onValueChange={v => setFormData({ ...formData, potential: v as 'alto' | 'médio' | 'baixo' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="médio">Médio</SelectItem>
                      <SelectItem value="baixo">Baixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>

            {/* ── Vínculo com Loja ── */}
            <fieldset className="space-y-3 border border-border/50 rounded-lg p-4">
              <legend className="text-xs font-semibold text-muted-foreground px-2">Centro de Custo (Loja)</legend>
              <div className="space-y-2">
                <Label>Loja vinculada</Label>
                <Select value={formData.storeId} onValueChange={v => setFormData({ ...formData, storeId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStores.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
              {editingPartner ? 'Salvar' : 'Cadastrar parceiro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => { setShowImportDialog(open); if (!open) { setImportRows([]); setImportStep('upload'); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Importar Parceiros em Lote
            </DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo CSV com os dados dos parceiros. Baixe o modelo primeiro para garantir o formato correto.
            </DialogDescription>
          </DialogHeader>

          {importStep === 'upload' && (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-10 text-center w-full">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">Arraste ou selecione o arquivo CSV</p>
                <p className="text-xs text-muted-foreground mb-4">Formato aceito: .csv (UTF-8)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={handleExportTemplate}>
                    <Download className="h-4 w-4 mr-1" /> Baixar modelo
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" /> Selecionar arquivo
                  </Button>
                </div>
              </div>
            </div>
          )}

          {importStep === 'preview' && (
            <div className="flex flex-col gap-4 flex-1 overflow-hidden">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">{validCount} válido(s)</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-1.5 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">{invalidCount} com erro(s)</span>
                  </div>
                )}
                <span className="text-muted-foreground">Total: {importRows.length} registro(s)</span>
              </div>

              <ScrollArea className="flex-1 max-h-[400px] rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs w-8">#</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">CNPJ</TableHead>
                      <TableHead className="text-xs">Potencial</TableHead>
                      <TableHead className="text-xs">Comercial</TableHead>
                      <TableHead className="text-xs">Erros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importRows.map((row, idx) => (
                      <TableRow key={idx} className={cn(!row.valid && 'bg-destructive/5')}>
                        <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          {row.valid
                            ? <CheckCircle2 className="h-4 w-4 text-success" />
                            : <AlertTriangle className="h-4 w-4 text-destructive" />
                          }
                        </TableCell>
                        <TableCell className="text-xs font-medium">{row.name || '—'}</TableCell>
                        <TableCell className="text-xs">{row.cnpj || '—'}</TableCell>
                        <TableCell>
                          {row.potential && (
                            <Badge variant="outline" className={cn('text-[10px]', potentialColors[row.potential])}>
                              {row.potential}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{row.responsibleEmail || '—'}</TableCell>
                        <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                          {row.errors.join(', ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <DialogFooter className="flex-shrink-0">
                <Button variant="outline" onClick={() => { setImportStep('upload'); setImportRows([]); }}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button onClick={handleConfirmImport} disabled={validCount === 0}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Importar {validCount} parceiro(s)
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingPartnerId} onOpenChange={() => setDeletingPartnerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir parceiro</AlertDialogTitle>
            <AlertDialogDescription>Deseja excluir este parceiro? Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletingPartnerId && handleDelete(deletingPartnerId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </>
  );
}

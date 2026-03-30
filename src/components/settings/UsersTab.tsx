import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useUserAvatars } from '@/hooks/useUserAvatars';
import { User, UserRole, AppProfile, CompanyCargo, cargoLabels, cargoColors, profileLabels, profileColors, allCargos } from '@/data/mock-data';
import { useUsersData } from '@/hooks/useUsersData';
import { PermissionLevel, defaultPermissions, groupedPermissions } from '@/data/permissions';
import { usePermission } from '@/hooks/usePermission';
import { Team, initialTeams } from '@/data/teams';
import { Edit, Lock, Trash2, RefreshCw, Search, Shield, Eye, EyeOff, Pencil, Save, Plus, Users2, ChevronRight, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

const allProfiles: AppProfile[] = ['gestor', 'nao_gestor'];

export default function UsersTab() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const { users, setUsers } = useUsersData();
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' as UserRole, profile: 'nao_gestor' as AppProfile, bio: '' });
  const [permissions, setPermissions] = useLocalStorage<Record<AppProfile, Record<string, PermissionLevel>>>(
    'ribercred_permissions_v3',
    defaultPermissions
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [teams, setTeams] = useLocalStorage<Team[]>('ribercred_teams', initialTeams);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({ name: '', managerId: '', directorId: '', ascomIds: [] as string[], commercialIds: [] as string[] });
  const { getAvatar, setAvatar } = useUserAvatars();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetUserId, setUploadTargetUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role: 'comercial' as UserRole, profile: 'nao_gestor' as AppProfile, bio: '' });

  const isGestor = profile === 'gestor';
  const { canRead, canWrite } = usePermission();
  const grouped = groupedPermissions();

  const filtered = search
    ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : users;

  const handleEdit = (user: User) => {
    setEditUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role, profile: user.profile, bio: user.bio });
  };

  const handleSave = () => {
    if (!editUser) return;
    setUsers(users.map(u => u.id === editUser.id ? { ...u, ...editForm } : u));
    setEditUser(null);
    toast({ title: 'Usuário atualizado!' });
  };

  const handleToggleBlock = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, active: !u.active } : u));
    toast({ title: 'Status alterado!' });
  };

  const handleDelete = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    toast({ title: 'Usuário removido!' });
    setDeletingUserId(null);
  };

  const handleDeleteTeam = (teamId: string) => {
    setTeams(prev => prev.filter(t => t.id !== teamId));
    toast({ title: 'Equipe removida!' });
    setDeletingTeamId(null);
  };

  const handleResetPassword = (name: string) => {
    toast({ title: `Senha de ${name} resetada (simulado)` });
  };

  const handlePermissionChange = (appProfile: AppProfile, key: string, level: PermissionLevel) => {
    setPermissions(prev => ({
      ...prev,
      [appProfile]: { ...prev[appProfile], [key]: level },
    }));
    setHasChanges(true);
  };

  const handleSavePermissions = () => {
    setHasChanges(false);
    toast({ title: 'Permissões salvas com sucesso!' });
  };

  const handleResetPermissions = (appProfile: AppProfile) => {
    setPermissions(prev => ({
      ...prev,
      [appProfile]: { ...defaultPermissions[appProfile] },
    }));
    setHasChanges(true);
    toast({ title: `Permissões de ${profileLabels[appProfile]} restauradas ao padrão` });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetUserId) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(uploadTargetUserId, reader.result as string);
      toast({ title: 'Foto atualizada!' });
      setUploadTargetUserId(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerPhotoUpload = (userId: string) => {
    setUploadTargetUserId(userId);
    fileInputRef.current?.click();
  };

  const handleCreateUser = () => {
    if (!newUserForm.name || !newUserForm.email) return;
    const newUser: User = {
      id: `u${Date.now()}`,
      name: newUserForm.name,
      email: newUserForm.email,
      role: newUserForm.role,
      profile: newUserForm.profile,
      bio: newUserForm.bio || 'Novo colaborador',
      active: true,
    };
    setUsers(prev => [...prev, newUser]);
    setShowNewUser(false);
    setNewUserForm({ name: '', email: '', role: 'comercial', profile: 'nao_gestor', bio: '' });
    toast({ title: 'Colaborador criado com sucesso!' });
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />
      <Tabs defaultValue="equipe">
        <TabsList className="w-full justify-center">
          <TabsTrigger value="equipe">Colaboradores</TabsTrigger>
          {canRead('teams.view') && <TabsTrigger value="equipes">Equipes</TabsTrigger>}
          {isGestor && <TabsTrigger value="permissoes">Permissões</TabsTrigger>}
        </TabsList>

        {/* Tab Equipe */}
        <TabsContent value="equipe" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            {isGestor && canWrite('users.edit') && (
              <Button size="sm" onClick={() => setShowNewUser(true)}>
                <Plus className="h-4 w-4 mr-1" /> Novo
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(user => (
              <Card key={user.id} className={cn('transition-shadow hover:shadow-md cursor-pointer', !user.active && 'opacity-60')} onClick={() => navigate(`/colaborador/${user.id}`)}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="relative group">
                      <Avatar className="h-10 w-10">
                        {getAvatar(user.id) && <AvatarImage src={getAvatar(user.id)} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {isGestor && (
                        <button
                          onClick={() => triggerPhotoUpload(user.id)}
                          className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm"
                        >
                          <Camera className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        {!user.active && <Badge variant="outline" className="text-[10px] text-destructive">Bloqueado</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge className={cn('text-[10px] capitalize', cargoColors[user.role])} variant="secondary">
                      {cargoLabels[user.role]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{user.bio}</p>
                  {isGestor && (
                    <>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {canWrite('users.edit') && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(user)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Editar</p></TooltipContent>
                          </Tooltip>
                        )}
                        {canWrite('users.resetPassword') && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleResetPassword(user.name)}>
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Resetar senha</p></TooltipContent>
                          </Tooltip>
                        )}
                        {canWrite('users.block') && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleBlock(user.id)}>
                                <Lock className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{user.active ? 'Bloquear' : 'Desbloquear'}</p></TooltipContent>
                          </Tooltip>
                        )}
                        {canWrite('users.delete') && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingUserId(user.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Excluir</p></TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </>
                  )}
                  {!isGestor && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Acesso restrito ao gestor</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab Permissões */}
        {isGestor && (
          <TabsContent value="permissoes" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Configure o nível de acesso de cada perfil em cada funcionalidade do sistema.</p>
              <Button onClick={handleSavePermissions} disabled={!hasChanges} size="sm">
                <Save className="h-4 w-4 mr-1" /> Salvar permissões
              </Button>
            </div>

            <Accordion type="single" collapsible defaultValue="gestor" className="space-y-2">
              {allProfiles.map(r => (
                <AccordionItem key={r} value={r} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge className={cn('text-xs capitalize', profileColors[r])} variant="secondary">
                        {profileLabels[r]}
                      </Badge>
                      <span className="text-sm font-medium">{profileLabels[r]}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleResetPermissions(r)}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Restaurar padrão
                        </Button>
                      </div>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-[160px] text-xs">Módulo</TableHead>
                              <TableHead className="text-xs">Permissão</TableHead>
                              <TableHead className="w-[200px] text-xs text-right">Nível de acesso</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(grouped).map(([module, items]) =>
                              items.map((item, idx) => (
                                <TableRow key={item.key}>
                                  {idx === 0 && (
                                    <TableCell rowSpan={items.length} className="text-xs font-semibold align-top border-r bg-muted/30">
                                      {module}
                                    </TableCell>
                                  )}
                                  <TableCell className="text-xs py-2">{item.action}</TableCell>
                                  <TableCell className="py-2">
                                    <Select
                                      value={permissions[r]?.[item.key] || 'none'}
                                      onValueChange={(v) => handlePermissionChange(r, item.key, v as PermissionLevel)}
                                    >
                                      <SelectTrigger className="h-8 w-[48px] ml-auto flex items-center justify-center">
                                        {(() => {
                                          const level = permissions[r]?.[item.key] || 'none';
                                          const icons: Record<PermissionLevel, React.ReactNode> = {
                                            none: <EyeOff className="h-3.5 w-3.5 text-destructive" />,
                                            read: <Eye className="h-3.5 w-3.5 text-warning" />,
                                            write: <Pencil className="h-3.5 w-3.5 text-success" />,
                                          };
                                          return <span>{icons[level]}</span>;
                                        })()}
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          <div className="flex items-center gap-2">
                                            <EyeOff className="h-3.5 w-3.5 text-destructive" />
                                            <span>Sem acesso</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="read">
                                          <div className="flex items-center gap-2">
                                            <Eye className="h-3.5 w-3.5 text-warning" />
                                            <span>Somente leitura</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="write">
                                          <div className="flex items-center gap-2">
                                            <Pencil className="h-3.5 w-3.5 text-success" />
                                            <span>Leitura e edição</span>
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        )}

        {/* Tab Equipes */}
        {canRead('teams.view') && (
          <TabsContent value="equipes" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Organize comerciais em equipes com hierarquia.</p>
              {canWrite('teams.create') && (
                <Button size="sm" onClick={() => {
                  setEditingTeam(null);
                  setTeamForm({ name: '', managerId: '', directorId: '', ascomIds: [], commercialIds: [] });
                  setShowTeamForm(true);
                }}>
                  <Plus className="h-4 w-4 mr-1" /> Criar equipe
                </Button>
              )}
            </div>

            {teams.length === 0 ? (
              <Card className="p-12 text-center">
                <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma equipe cadastrada</p>
                {canWrite('teams.create') && (
                  <Button className="mt-4" onClick={() => {
                    setTeamForm({ name: '', managerId: '', directorId: '', ascomIds: [], commercialIds: [] });
                    setShowTeamForm(true);
                  }}>Criar equipe</Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map(team => {
                  const manager = users.find(u => u.id === team.managerId);
                  const director = team.directorId ? users.find(u => u.id === team.directorId) : null;
                  const ascoms = users.filter(u => team.ascomIds.includes(u.id));
                  const comms = users.filter(u => team.commercialIds.includes(u.id));
                  return (
                    <Card key={team.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{team.name}</h3>
                          <div className="flex gap-1">
                            {canWrite('teams.edit') && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                                setEditingTeam(team);
                                setTeamForm({ name: team.name, managerId: team.managerId, directorId: team.directorId || '', ascomIds: [...team.ascomIds], commercialIds: [...team.commercialIds] });
                                setShowTeamForm(true);
                              }}>
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            {canWrite('teams.delete') && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setDeletingTeamId(team.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {director && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold">
                                  {director.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{director.name}</p>
                                <p className="text-[10px] text-muted-foreground">Diretor</p>
                              </div>
                            </div>
                          )}

                          {manager && (
                            <div className="flex items-center gap-2 pl-4">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-info/10 text-info text-xs font-bold">
                                  {manager.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{manager.name}</p>
                                <p className="text-[10px] text-muted-foreground">Gerente</p>
                              </div>
                            </div>
                          )}

                          {ascoms.length > 0 && (
                            <>
                              <div className="flex items-center gap-2 pl-8 text-muted-foreground">
                                <ChevronRight className="h-3 w-3" />
                                <span className="text-[10px] font-medium uppercase tracking-wider">ASCOM</span>
                              </div>
                              {ascoms.map(a => (
                                <div key={a.id} className="flex items-center gap-2 pl-12">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="bg-warning/10 text-warning text-[10px] font-bold">
                                      {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <p className="text-sm">{a.name}</p>
                                </div>
                              ))}
                            </>
                          )}

                          <div className="flex items-center gap-2 pl-8 text-muted-foreground">
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-[10px] font-medium uppercase tracking-wider">Comerciais</span>
                          </div>
                          {comms.map(c => (
                            <div key={c.id} className="flex items-center gap-2 pl-12">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-success/10 text-success text-[10px] font-bold">
                                  {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <p className="text-sm">{c.name}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Team Form Dialog */}
      <Dialog open={showTeamForm} onOpenChange={setShowTeamForm}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Editar Equipe' : 'Nova Equipe'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da equipe</Label>
              <Input value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} placeholder="Ex: Equipe Sul" />
            </div>
            <div className="space-y-2">
              <Label>Diretor</Label>
              <Select value={teamForm.directorId} onValueChange={v => setTeamForm({ ...teamForm, directorId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o diretor (opcional)" /></SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.role === 'diretor').map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gerente</Label>
              <Select value={teamForm.managerId} onValueChange={v => setTeamForm({ ...teamForm, managerId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o gerente" /></SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.role === 'gerente').map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ASCOM(s)</Label>
              <div className="space-y-1">
                {users.filter(u => u.role === 'ascom').map(u => (
                  <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={teamForm.ascomIds.includes(u.id)}
                      onCheckedChange={() => setTeamForm({
                        ...teamForm,
                        ascomIds: teamForm.ascomIds.includes(u.id) ? teamForm.ascomIds.filter(id => id !== u.id) : [...teamForm.ascomIds, u.id],
                      })}
                    />
                    {u.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comerciais</Label>
              <div className="space-y-1">
                {users.filter(u => u.role === 'comercial' && u.active).map(u => {
                  const inOtherTeam = teams.some(t => t.id !== editingTeam?.id && (t.commercialIds.includes(u.id)));
                  return (
                    <label key={u.id} className={cn('flex items-center gap-2 text-sm cursor-pointer', inOtherTeam && 'opacity-50')}>
                      <Checkbox
                        disabled={inOtherTeam}
                        checked={teamForm.commercialIds.includes(u.id)}
                        onCheckedChange={() => setTeamForm({
                          ...teamForm,
                          commercialIds: teamForm.commercialIds.includes(u.id) ? teamForm.commercialIds.filter(id => id !== u.id) : [...teamForm.commercialIds, u.id],
                        })}
                      />
                      {u.name} {inOtherTeam && <span className="text-[10px] text-muted-foreground">(em outra equipe)</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeamForm(false)}>Cancelar</Button>
            <Button
              disabled={!teamForm.name || !teamForm.managerId || teamForm.commercialIds.length === 0}
              onClick={() => {
                if (editingTeam) {
                  setTeams(prev => prev.map(t => t.id === editingTeam.id ? { ...t, ...teamForm, directorId: teamForm.directorId || undefined } : t));
                  toast({ title: 'Equipe atualizada!' });
                } else {
                  setTeams(prev => [...prev, { id: `team${Date.now()}`, ...teamForm, directorId: teamForm.directorId || undefined }]);
                  toast({ title: 'Equipe criada!' });
                }
                setShowTeamForm(false);
              }}
            >
              {editingTeam ? 'Salvar' : 'Criar equipe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar usuário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Cargo (empresa)</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm({...editForm, role: v as UserRole})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allCargos.map(c => (
                    <SelectItem key={c} value={c}>{cargoLabels[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Perfil do App</Label>
              <Select value={editForm.profile} onValueChange={v => setEditForm({...editForm, profile: v as AppProfile})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="nao_gestor">Não Gestor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete user */}
      <AlertDialog open={!!deletingUserId} onOpenChange={() => setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir colaborador</AlertDialogTitle>
            <AlertDialogDescription>Deseja excluir este colaborador? Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletingUserId && handleDelete(deletingUserId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete team */}
      <AlertDialog open={!!deletingTeamId} onOpenChange={() => setDeletingTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir equipe</AlertDialogTitle>
            <AlertDialogDescription>Deseja excluir esta equipe? Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletingTeamId && handleDeleteTeam(deletingTeamId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

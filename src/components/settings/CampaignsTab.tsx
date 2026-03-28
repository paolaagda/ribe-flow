import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePermission } from '@/hooks/usePermission';
import { mockUsers, getUserById } from '@/data/mock-data';
import {
  Campaign, CampaignParticipant, GamificationConfig, defaultGamification,
  initialCampaigns, getCampaignStatus, campaignStatusColors,
  getCompletedVisitsForUser, getCompletedProspectionsForUser,
} from '@/data/campaigns';
import { Plus, Edit, Trash2, Trophy, Gamepad2 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CampaignFormData {
  name: string;
  startDate: string;
  endDate: string;
  selectedUsers: string[];
  goals: Record<string, { visitGoal: number; prospectionGoal: number }>;
  gamification: GamificationConfig;
}

function GamificationSection({ gamification, onChange }: { gamification: GamificationConfig; onChange: (g: GamificationConfig) => void }) {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2">
        <Gamepad2 className="h-4 w-4 text-primary" />
        <Label className="text-sm font-semibold">Gamificação</Label>
      </div>
      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Pontuação por atividade</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Visita concluída</Label>
            <Input
              type="number"
              step="0.5"
              className="h-8"
              value={gamification.pointsPerVisit}
              onChange={e => onChange({ ...gamification, pointsPerVisit: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Prospecção concluída</Label>
            <Input
              type="number"
              step="0.5"
              className="h-8"
              value={gamification.pointsPerProspection}
              onChange={e => onChange({ ...gamification, pointsPerProspection: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cancelamento</Label>
            <Input
              type="number"
              step="0.5"
              className="h-8"
              value={gamification.pointsPerCancellation}
              onChange={e => onChange({ ...gamification, pointsPerCancellation: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Conquistas</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/20">
            <p className="text-xs font-semibold">Visitas</p>
            <div className="space-y-1">
              <Label className="text-xs">Meta (quantidade)</Label>
              <Input
                type="number"
                className="h-8"
                value={gamification.achievements.visitMilestone}
                onChange={e => onChange({
                  ...gamification,
                  achievements: { ...gamification.achievements, visitMilestone: Number(e.target.value) },
                })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pontos recompensa</Label>
              <Input
                type="number"
                className="h-8"
                value={gamification.achievements.visitReward}
                onChange={e => onChange({
                  ...gamification,
                  achievements: { ...gamification.achievements, visitReward: Number(e.target.value) },
                })}
              />
            </div>
          </div>
          <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/20">
            <p className="text-xs font-semibold">Prospecções</p>
            <div className="space-y-1">
              <Label className="text-xs">Meta (quantidade)</Label>
              <Input
                type="number"
                className="h-8"
                value={gamification.achievements.prospectionMilestone}
                onChange={e => onChange({
                  ...gamification,
                  achievements: { ...gamification.achievements, prospectionMilestone: Number(e.target.value) },
                })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pontos recompensa</Label>
              <Input
                type="number"
                className="h-8"
                value={gamification.achievements.prospectionReward}
                onChange={e => onChange({
                  ...gamification,
                  achievements: { ...gamification.achievements, prospectionReward: Number(e.target.value) },
                })}
              />
            </div>
          </div>
        </div>

        <p className="text-xs font-medium text-muted-foreground mt-3">Conquistas adicionais</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Pts 1ª visita</Label>
            <Input
              type="number"
              className="h-8"
              value={gamification.achievements.firstVisitReward}
              onChange={e => onChange({
                ...gamification,
                achievements: { ...gamification.achievements, firstVisitReward: Number(e.target.value) },
              })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Pts 1ª prospecção</Label>
            <Input
              type="number"
              className="h-8"
              value={gamification.achievements.firstProspectionReward}
              onChange={e => onChange({
                ...gamification,
                achievements: { ...gamification.achievements, firstProspectionReward: Number(e.target.value) },
              })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Pts 100% meta geral</Label>
            <Input
              type="number"
              className="h-8"
              value={gamification.achievements.fullGoalReward}
              onChange={e => onChange({
                ...gamification,
                achievements: { ...gamification.achievements, fullGoalReward: Number(e.target.value) },
              })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="space-y-1">
            <Label className="text-xs">Pts 100% visitas</Label>
            <Input
              type="number"
              className="h-8"
              value={gamification.achievements.fullVisitGoalReward}
              onChange={e => onChange({
                ...gamification,
                achievements: { ...gamification.achievements, fullVisitGoalReward: Number(e.target.value) },
              })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Pts 100% prospecções</Label>
            <Input
              type="number"
              className="h-8"
              value={gamification.achievements.fullProspectionGoalReward}
              onChange={e => onChange({
                ...gamification,
                achievements: { ...gamification.achievements, fullProspectionGoalReward: Number(e.target.value) },
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CampaignsTab() {
  const { toast } = useToast();
  const { canWrite } = usePermission();
  const [campaigns, setCampaigns] = useLocalStorage<Campaign[]>('ribercred_campaigns', initialCampaigns);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    startDate: '',
    endDate: '',
    selectedUsers: [],
    goals: {},
    gamification: { ...defaultGamification },
  });

  const commercials = mockUsers.filter(u => u.role === 'comercial');

  const openCreate = () => {
    setEditingCampaign(null);
    setFormData({ name: '', startDate: '', endDate: '', selectedUsers: [], goals: {}, gamification: { ...defaultGamification } });
    setShowForm(true);
  };

  const openEdit = (c: Campaign) => {
    setEditingCampaign(c);
    const goals: Record<string, { visitGoal: number; prospectionGoal: number }> = {};
    c.participants.forEach(p => { goals[p.userId] = { visitGoal: p.visitGoal, prospectionGoal: p.prospectionGoal }; });
    setFormData({
      name: c.name,
      startDate: c.startDate,
      endDate: c.endDate,
      selectedUsers: c.participants.map(p => p.userId),
      goals,
      gamification: c.gamification ? { ...c.gamification, achievements: { ...c.gamification.achievements } } : { ...defaultGamification },
    });
    setShowForm(true);
  };

  const toggleUser = (userId: string) => {
    const selected = formData.selectedUsers.includes(userId)
      ? formData.selectedUsers.filter(id => id !== userId)
      : [...formData.selectedUsers, userId];
    const goals = { ...formData.goals };
    if (!goals[userId]) goals[userId] = { visitGoal: 15, prospectionGoal: 8 };
    setFormData({ ...formData, selectedUsers: selected, goals });
  };

  const handleSave = () => {
    const participants: CampaignParticipant[] = formData.selectedUsers.map(uid => ({
      userId: uid,
      visitGoal: formData.goals[uid]?.visitGoal || 15,
      prospectionGoal: formData.goals[uid]?.prospectionGoal || 8,
    }));
    if (editingCampaign) {
      setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? {
        ...c,
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        participants,
        gamification: formData.gamification,
      } : c));
      toast({ title: 'Campanha atualizada!' });
    } else {
      const newCampaign: Campaign = {
        id: `camp${Date.now()}`,
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        participants,
        gamification: formData.gamification,
      };
      setCampaigns(prev => [...prev, newCampaign]);
      toast({ title: 'Campanha criada!' });
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Campanha excluída!' });
    setDeletingCampaignId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Gerencie as campanhas de metas da equipe.</p>
        {canWrite('campaigns.create') && (
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Nova campanha</Button>
        )}
      </div>

      {campaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma campanha criada</p>
          {canWrite('campaigns.create') && (
            <Button className="mt-4" onClick={openCreate}>Criar primeira campanha</Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(camp => {
            const status = getCampaignStatus(camp);
            const totalGoal = camp.participants.reduce((s, p) => s + p.visitGoal + p.prospectionGoal, 0);
            const totalDone = camp.participants.reduce((s, p) => {
              return s + getCompletedVisitsForUser(p.userId, camp.startDate, camp.endDate) + getCompletedProspectionsForUser(p.userId, camp.startDate, camp.endDate);
            }, 0);
            const progress = totalGoal > 0 ? Math.min(100, Math.round((totalDone / totalGoal) * 100)) : 0;

            return (
              <Card key={camp.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{camp.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{camp.startDate} — {camp.endDate}</p>
                    </div>
                    <Badge className={cn('text-[10px]', campaignStatusColors[status])} variant="outline">{status}</Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    {camp.participants.slice(0, 4).map(p => {
                      const u = getUserById(p.userId);
                      return (
                        <Avatar key={p.userId} className="h-7 w-7 border-2 border-card -ml-1 first:ml-0">
                          <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                            {u?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                    {camp.participants.length > 4 && (
                      <span className="text-xs text-muted-foreground ml-1">+{camp.participants.length - 4}</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso geral</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  {camp.gamification && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Gamepad2 className="h-3 w-3" />
                      <span>V:{camp.gamification.pointsPerVisit}pt</span>
                      <span>P:{camp.gamification.pointsPerProspection}pt</span>
                      <span>C:{camp.gamification.pointsPerCancellation}pt</span>
                    </div>
                  )}

                  <div className="flex gap-1">
                    <>
                      {canWrite('campaigns.edit') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(camp)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      )}
                      {canWrite('campaigns.delete') && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingCampaignId(camp.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da campanha</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Campanha Q1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data início</Label>
                <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Data fim</Label>
                <Input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comerciais participantes</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {commercials.map(u => {
                  const selected = formData.selectedUsers.includes(u.id);
                  return (
                    <div key={u.id} className="space-y-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={selected} onCheckedChange={() => toggleUser(u.id)} />
                        {u.name}
                      </label>
                      {selected && (
                        <div className="grid grid-cols-2 gap-2 pl-6">
                          <div className="space-y-1">
                            <Label className="text-xs">Meta visitas</Label>
                            <Input
                              type="number"
                              className="h-8"
                              value={formData.goals[u.id]?.visitGoal || 15}
                              onChange={e => setFormData({
                                ...formData,
                                goals: { ...formData.goals, [u.id]: { ...formData.goals[u.id], visitGoal: Number(e.target.value) } },
                              })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Meta prospecções</Label>
                            <Input
                              type="number"
                              className="h-8"
                              value={formData.goals[u.id]?.prospectionGoal || 8}
                              onChange={e => setFormData({
                                ...formData,
                                goals: { ...formData.goals, [u.id]: { ...formData.goals[u.id], prospectionGoal: Number(e.target.value) } },
                              })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gamification section */}
            <GamificationSection
              gamification={formData.gamification}
              onChange={g => setFormData({ ...formData, gamification: g })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.startDate || !formData.endDate || formData.selectedUsers.length === 0}>
              {editingCampaign ? 'Salvar' : 'Criar campanha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCampaignId} onOpenChange={() => setDeletingCampaignId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha</AlertDialogTitle>
            <AlertDialogDescription>Deseja excluir esta campanha? Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletingCampaignId && handleDelete(deletingCampaignId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

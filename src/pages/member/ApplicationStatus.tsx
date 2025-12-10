import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ApplicationStatus() {
  const q = useQuery();
  const id = q.get('id');
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    try {
      const apps = JSON.parse(localStorage.getItem('applications') || '[]');
      const found = apps.find((a: any) => a.id === id);
      setApp(found || null);
    } catch (e) {
      setApp(null);
    }
  }, [id]);

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardContent>
            <h3 className="text-lg font-semibold">No application specified</h3>
            <p className="text-sm text-muted-foreground">Please open this page with an application id (e.g. ?id=APP-2025-001).</p>
            <div className="mt-3">
              <Button onClick={() => navigate('/member/dashboard')}>Go to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = app?.stages?.length || 0;
  const completed = app?.stages ? app.stages.filter((s: any) => s.status === 'Approved').length : 0;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const steps = app?.stages ?? [
    { id: 1, title: 'Block Admin Review', status: 'Pending' },
    { id: 2, title: 'District Admin Review', status: 'Pending' },
    { id: 3, title: 'State Admin Review', status: 'Pending' },
    { id: 4, title: 'Ready for Payment', status: 'Pending' },
  ];

  const sanitize = (v: any) => (v ?? '').toString().replace(/\\n|\n/g, ' ').trim();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-100 to-blue-200">
      <div className="w-full max-w-md">
        <Card className="rounded-lg shadow-xl">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold">Application Status</h2>
              <p className="text-sm text-muted-foreground mt-1">Track your membership approval progress</p>
            </div>

            <div className="bg-white rounded p-4 border mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>Application ID:</div>
                <div className="font-semibold text-black">{app?.id}</div>
                <div>Submitted:</div>
                <div>{app ? new Date(app.submittedAt).toLocaleString() : '-'}</div>
                <div>Status:</div>
                <div className="font-semibold text-amber-500">{sanitize(app?.status) || 'Unknown'}</div>
              </div>

              {total > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">Overall Progress</div>
                    <div className="text-xs text-muted-foreground">{completed} of {total} stages completed</div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {steps.slice(0, 4).map((s: any, i: number) => (
                      <div key={s.id ?? i} className="text-xxs text-muted-foreground">{s.title}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-4">
              {steps.map((s: any, idx: number) => {
                const status = s.status;
                const isCompleted = status === 'Approved';
                const isActive = status === 'Under Review' || status === 'In progress' || app?.stage === s.id;
                const badgeClass = isCompleted
                  ? 'bg-green-600 text-white'
                  : isActive
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-200 text-gray-600';
                const badgeLabel = isCompleted ? 'Approved' : isActive ? 'In progress' : 'Pending';
                return (
                  <div key={s.key ?? s.id ?? idx} className={`p-3 rounded border ${isCompleted ? 'bg-green-50' : isActive ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                    <div className="flex items-start gap-3 justify-between">
                      <div>
                        <div className="text-sm font-semibold">{s.title}</div>
                        <div className="text-xs text-muted-foreground">{s.reviewer ?? ''} {s.reviewDate ? ` — Review date: ${new Date(s.reviewDate).toLocaleDateString()}` : ''}</div>
                        {s.notes && <div className="mt-2 text-xs bg-white border rounded p-2 text-muted-foreground">{s.notes}</div>}
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>{badgeLabel}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!(completed === total && total > 0) && (
              <div className="bg-blue-50 border rounded p-3 mb-4">
                <div className="font-semibold text-sm">Waiting for Approval</div>
                <div className="text-xs text-muted-foreground mt-1">Your application is currently under review. You will be notified once this stage is complete.</div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button className="bg-blue-600 text-white" onClick={() => navigate(-1)}>Back</Button>
              {app && completed === total && (
                <Button className="bg-blue-600 text-white" onClick={() => navigate(`/member/payment?id=${encodeURIComponent(app?.id)}`)}>Register for Payment</Button>
              )}
              <Button variant="outline" onClick={() => {
                if (!app) return;
                const blob = new Blob([JSON.stringify(app, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${app.id || 'application'}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}>Download Application Copy</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

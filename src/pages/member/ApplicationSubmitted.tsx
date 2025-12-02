import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ApplicationSubmitted() {
  const query = useQuery();
  const navigate = useNavigate();
  const id = query.get('id');
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

  const downloadJson = () => {
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
  };

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardContent>
            <CardTitle>No application specified</CardTitle>
            <p className="text-sm text-muted-foreground">No application id was provided. Go to your dashboard to submit an application.</p>
            <div className="mt-4">
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-100 to-blue-200">
      <div className="w-full max-w-md">
        <Card className="rounded-lg shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-sm text-muted-foreground mb-4">Your membership application has been successfully submitted and is now under review. You will receive updates on your application status.</p>

              <div className="w-full bg-white rounded p-4 mb-4 border">
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                  <div>Application ID:</div>
                  <div className="font-semibold text-sm text-black">{app?.id}</div>
                  <div>Submitted:</div>
                  <div className="text-sm">{app ? new Date(app.submittedAt).toLocaleString() : '-'}</div>
                  <div>Status:</div>
                  <div className="text-sm text-amber-500 font-semibold">{app?.status || 'Under Review'}</div>
                </div>

                {total > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <div>{completed} of {total} stages completed</div>
                      <div>{pct}%</div>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-muted-foreground items-center">
                      {app.stages.map((s: any) => (
                        <div key={s.key} className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${s.status === 'Approved' ? 'bg-green-500' : s.status === 'Under Review' ? 'bg-yellow-400' : 'bg-gray-300'}`} />
                          <div className="mt-1 text-center">{s.title.split(' ')[0]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full space-y-3 mb-4">
                {app?.stages?.map((s: any) => (
                  <div key={s.key} className={`p-3 rounded border ${s.status === 'Approved' ? 'bg-green-50' : s.status === 'Under Review' ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{s.title}</div>
                        <div className="text-xs text-muted-foreground">{s.reviewer}{s.reviewDate ? ` — Review date: ${new Date(s.reviewDate).toLocaleDateString()}` : ''}</div>
                        {s.notes && <div className="mt-2 text-xs bg-white border rounded p-2 text-muted-foreground">{s.notes}</div>}
                      </div>
                      <div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${s.status === 'Approved' ? 'bg-green-600 text-white' : s.status === 'Under Review' ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-600'}`}>{s.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-full bg-yellow-50 border rounded p-3 mb-4">
                <div className="font-semibold text-sm">Important Notice</div>
                <div className="text-xs text-muted-foreground mt-1">Please keep your application ID safe. You may need it for future reference and status inquiries.</div>
              </div>

              <div className="w-full flex flex-col gap-3">
                <Button className="bg-blue-600 text-white" onClick={() => navigate(`/member/application-status?id=${encodeURIComponent(app?.id)}`)}>View Application Status</Button>
                <Button variant="outline" onClick={downloadJson}>Download Application Copy</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

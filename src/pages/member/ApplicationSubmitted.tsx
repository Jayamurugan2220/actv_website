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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-100 to-blue-200">
      <div className="w-full max-w-3xl">
        <Card className="rounded-lg shadow-xl">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#064E3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-sm md:text-base text-muted-foreground mb-4">Your membership application has been successfully submitted and is now under review. You will receive updates on your application status.</p>

              <div className="w-full bg-white rounded p-3 sm:p-4 mb-4 border">
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
                  <div>Application ID:</div>
                  <div className="font-semibold text-sm sm:text-base text-black break-all">{app?.id}</div>
                  <div>Submitted:</div>
                  <div className="text-xs sm:text-sm">{app ? new Date(app.submittedAt).toLocaleString() : '-'}</div>
                  <div>Status:</div>
                  <div className="text-xs sm:text-sm text-amber-500 font-semibold">{app?.status || 'Under Review'}</div>
                </div></div>

              <div className="w-full bg-yellow-50 border rounded p-3 mb-4">
                <div className="font-semibold text-sm">Important Notice</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Please keep your application ID safe. You may need it for future reference and status inquiries.</div>
              </div>

              <div className="w-full flex flex-col md:flex-row gap-3">
                <Button className="bg-blue-600 text-white w-full" onClick={() => navigate(`/member/application-status?id=${encodeURIComponent(app?.id)}`)}>View Application Status</Button>
                <Button className="w-full" variant="outline" onClick={downloadJson}>Download Application Copy</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


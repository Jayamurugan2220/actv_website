import React from 'react';
import Sidebar from '@/components/Sidebar';
import MobileMenu from '@/components/MobileMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden md:block w-16 lg:w-56">
        <Sidebar />
      </div>
      <MobileMenu isOpen={false} onClose={() => {}} />
      <div className="flex-1 p-6 bg-background">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Register for Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">This is a placeholder for the payment registration flow. Implement payment integration as needed.</p>
              <div className="flex gap-2">
                <Button className="bg-blue-600 text-white">Proceed to Payment</Button>
                <Button variant="outline">Back to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

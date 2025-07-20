
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SmsSetupPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState({
    sid: '',
    token: '',
    phone: '',
  });
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    // Load saved config from local storage
    const savedConfig = localStorage.getItem('twilioConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    // Set the webhook URL based on the window's origin
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/sms`);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setConfig((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('twilioConfig', JSON.stringify(config));
    toast({
      title: 'Configuration Saved',
      description: 'Your Twilio settings have been saved locally.',
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: 'Copied to Clipboard',
      description: 'The webhook URL has been copied.',
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>SMS Service Setup</CardTitle>
          <CardDescription>
            Configure your Twilio account to enable the SMS features of this
            application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sid">Account SID</Label>
            <Input
              id="sid"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={config.sid}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="token">Auth Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="********************************"
              value={config.token}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Twilio Phone Number</Label>
            <Input
              id="phone"
              placeholder="+1234567890"
              value={config.phone}
              onChange={handleInputChange}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave}>Save Configuration</Button>
        </CardFooter>
      </Card>

      <Alert className="mt-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Final Step: Configure Your Webhook</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            To receive incoming messages, you must set the following URL in your
            Twilio Phone Number settings under "A MESSAGE COMES IN":
          </p>
          <div className="relative">
            <Input type="text" value={webhookUrl} readOnly className="pr-10 bg-muted" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={copyToClipboard}
              disabled={!webhookUrl}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
           <p className="mt-2 text-xs text-muted-foreground">
            This needs to be done on the Twilio website after you deploy your application to a public URL.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}

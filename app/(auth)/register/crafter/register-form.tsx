'use client';

import { useState, useTransition, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { registerCrafterByPhone } from '@/lib/actions/invite.actions';
import { useUploadThing } from '@/lib/uploadthing';
import Image from 'next/image';

interface CrafterRegisterFormProps {
  inviteCode: string;
  name: string;
  mobile: string;
}

export default function CrafterRegisterForm({ inviteCode, name, mobile }: CrafterRegisterFormProps) {
  const [crafterName, setCrafterName] = useState(name);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing('crafterWorkSample');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 3 - uploadedImages.length;
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    setError('');
    try {
      const res = await startUpload(toUpload);
      if (res) {
        const urls = res.map((f) => f.ufsUrl);
        setUploadedImages((prev) => [...prev, ...urls].slice(0, 3));
        toast.success(`${urls.length} photo${urls.length > 1 ? 's' : ''} uploaded!`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRegister = () => {
    setError('');

    if (!crafterName.trim() || crafterName.trim().length < 2) {
      setError('Please enter your name');
      return;
    }
    if (!location.trim()) {
      setError('Please enter your location / suburb');
      return;
    }
    if (!description.trim()) {
      setError('Please tell us about your craft');
      return;
    }
    if (uploadedImages.length === 0) {
      setError('Please upload at least one photo of your work');
      return;
    }

    startTransition(async () => {
      const result = await registerCrafterByPhone({
        inviteCode,
        name: crafterName.trim(),
        mobile,
        location: location.trim(),
        description: description.trim(),
        workSamples: uploadedImages,
      });
      if (result.success) {
        setDone(true);
      } else {
        setError(result.error || 'Registration failed');
      }
    });
  };

  if (done) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="text-4xl">🎉</div>
        <p className="text-lg font-medium">Thank you for applying!</p>
        <p className="text-sm text-muted-foreground">
          We&apos;ve received your details and will review your work samples.
          We&apos;ll be in touch via SMS to let you know the outcome.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="crafterName">Your Name</Label>
        <Input
          id="crafterName"
          type="text"
          value={crafterName}
          onChange={(e) => setCrafterName(e.target.value)}
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <Label htmlFor="location">Location / Suburb</Label>
        <Input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Khayelitsha, Cape Town"
        />
      </div>

      <div>
        <Label htmlFor="description">What do you make / your craft?</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell us about what you create..."
          rows={3}
        />
      </div>

      <div>
        <Label>Photos of your recent work</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Upload up to 3 photos showing your best work
        </p>

        {uploadedImages.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {uploadedImages.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border">
                <Image src={url} alt={`Work sample ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setUploadedImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-0 right-0 bg-black/60 text-white text-xs px-1 rounded-bl"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {uploadedImages.length < 3 && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="work-photos"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? 'Uploading...' : `Choose Photo${uploadedImages.length > 0 ? 's' : ''}`}
            </Button>
          </div>
        )}
      </div>

      <Button onClick={handleRegister} disabled={isPending || uploading} className="w-full" size="lg">
        {uploading ? 'Waiting for upload...' : isPending ? 'Submitting...' : 'Submit Application'}
      </Button>

      {error && <p className="text-center text-destructive text-sm">{error}</p>}
    </div>
  );
}

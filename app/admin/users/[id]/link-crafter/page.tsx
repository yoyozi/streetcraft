'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { linkUserToCrafter } from '@/lib/actions/user.actions';
import { getAllCrafters } from '@/lib/actions/crafter.actions';
import { Crafter } from '@/types';
import { ArrowLeft, User, Link2 } from 'lucide-react';
import Link from 'next/link';

export default function LinkCrafterPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [crafters, setCrafters] = useState<Crafter[]>([]);
  const [selectedCrafterId, setSelectedCrafterId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [userData, setUserData] = useState<{id: string; name: string; email: string; role: string} | null>(null);

  useEffect(() => {
    loadCrafters();
    loadUserData();
  }, [userId, loadCrafters, loadUserData]);

  const loadCrafters = useCallback(async () => {
    try {
      const result = await getAllCrafters({ isActive: true });
      if (result.success && result.data) {
        setCrafters(result.data);
      }
    } catch {
      toast.error('Failed to load crafters');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserData = useCallback(async () => {
    // Mock user data - in real implementation, you'd fetch this
    setUserData({
      id: userId,
      name: 'craftUser',
      email: 'crafter@streetcraft.com',
      role: 'craft'
    });
  }, [userId]);

  const handleLinkCrafter = async () => {
    if (!selectedCrafterId) {
      toast.error('Please select a crafter');
      return;
    }

    setLinking(true);
    try {
      const result = await linkUserToCrafter(userId, selectedCrafterId);
      
      if (result.success) {
        toast.success(result.message);
        router.push('/admin/users');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to link crafter');
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Link Crafter</h1>
          <p className="text-muted-foreground">
            Connect a craft user to their crafter profile
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Craft User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userData ? (
              <>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-lg">{userData.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-lg">{userData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <div className="mt-1">
                    <Badge variant="outline">Crafter</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">User ID</label>
                  <p className="text-sm text-muted-foreground font-mono">{userData.id}</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Loading user information...</p>
            )}
          </CardContent>
        </Card>

        {/* Linking Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Link to Crafter Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Crafter Profile
              </label>
              <Select value={selectedCrafterId} onValueChange={setSelectedCrafterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a crafter profile" />
                </SelectTrigger>
                <SelectContent>
                  {crafters.map((crafter) => (
                    <SelectItem key={crafter.id} value={crafter.id}>
                      <div>
                        <div className="font-medium">{crafter.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {crafter.location} • {crafter.mobile}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCrafterId && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Selected Crafter:</h4>
                {crafters.find(c => c.id === selectedCrafterId) && (
                  <div className="text-sm text-blue-800">
                    <p><strong>Name:</strong> {crafters.find(c => c.id === selectedCrafterId)?.name}</p>
                    <p><strong>Location:</strong> {crafters.find(c => c.id === selectedCrafterId)?.location}</p>
                    <p><strong>Mobile:</strong> {crafters.find(c => c.id === selectedCrafterId)?.mobile}</p>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleLinkCrafter}
              disabled={!selectedCrafterId || linking}
              className="w-full"
              size="lg"
            >
              {linking ? 'Linking...' : 'Link User to Crafter'}
            </Button>

            <div className="text-xs text-muted-foreground">
              <p>• This action links the craft user&apos;s login to the selected crafter profile</p>
              <p>• The user will then see their crafter information in their dashboard</p>
              <p>• Only admin users can perform this action</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

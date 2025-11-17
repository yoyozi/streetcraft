'use client';

import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { linkUserToCrafter } from '@/lib/actions/user.actions';
import { getAllUsers } from '@/lib/actions/user.actions';
import { getAllCrafters } from '@/lib/actions/crafter.actions';

interface CrafterAllocationDropdownProps {
  crafterId: string;
  currentLinkedUser?: { id: string; name: string; email: string } | null;
}

export default function CrafterAllocationDropdown({ 
  crafterId, 
  currentLinkedUser 
}: CrafterAllocationDropdownProps) {
  const [craftUsers, setCraftUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);

  const loadCraftUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Get all craft users
      const usersResult = await getAllUsers({ query: '', page: 1 });
      // Get all crafters to see which users are already allocated
      const craftersResult = await getAllCrafters();
      
      if (usersResult && usersResult.data && craftersResult.success) {
        // Get IDs of all already allocated users
        const allocatedUserIds = craftersResult.data
          .filter(crafter => crafter.linkedUser)
          .map(crafter => crafter.linkedUser!.id);
        
        // Filter only craft role users who are not allocated (except current user)
        const filteredUsers = usersResult.data
          .filter(user => 
            user.role === 'craft' && 
            (!allocatedUserIds.includes(user.id) || (currentLinkedUser && user.id === currentLinkedUser.id))
          )
          .map(user => ({
            id: user.id,
            name: user.name,
            email: user.email
          }));
        setCraftUsers(filteredUsers);
      }
    } catch {
      toast.error('Failed to load craft users');
    } finally {
      setLoading(false);
    }
  }, [currentLinkedUser]);

  useEffect(() => {
    loadCraftUsers();
  }, [loadCraftUsers]);

  const handleLinkUser = async () => {
    const userIdToLink = selectedUserId || (currentLinkedUser ? currentLinkedUser.id : '');
    
    // Handle unlink
    if (userIdToLink === 'unlink') {
      setLinking(true);
      try {
        const result = await linkUserToCrafter('', crafterId); // Empty string to unlink
        if (result.success) {
          toast.success('User unlinked successfully');
          window.location.reload();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error('Failed to unlink user');
      } finally {
        setLinking(false);
      }
      return;
    }
    
    if (!userIdToLink) {
      toast.error('Please select a craft user');
      return;
    }

    setLinking(true);
    try {
      const result = await linkUserToCrafter(userIdToLink, crafterId);
      
      if (result.success) {
        toast.success(result.message);
        // Refresh the page to show updated allocation
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to link user to crafter');
    } finally {
      setLinking(false);
    }
  };

  // Show all craft users (including current linked user)
  const availableUsers = craftUsers;

  // If no users are available and no current user, show message
  if (!loading && craftUsers.length === 0 && !currentLinkedUser) {
    return (
      <div className="text-sm text-muted-foreground">
        No craft users to allocate
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select 
          value={currentLinkedUser ? currentLinkedUser.id : selectedUserId} 
          onValueChange={setSelectedUserId}
          disabled={loading || linking || availableUsers.length === 0}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select craft user...">
              {loading ? "Loading..." : currentLinkedUser ? currentLinkedUser.name : availableUsers.length === 0 ? "No available users" : "Select craft user..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {currentLinkedUser && (
              <SelectItem value="unlink">
                <div className="text-destructive font-medium">Unlink User</div>
              </SelectItem>
            )}
            {availableUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleLinkUser}
          disabled={(!selectedUserId && !currentLinkedUser) || loading || linking || availableUsers.length === 0}
          size="sm"
        >
          {linking ? 'Linking...' : currentLinkedUser ? 'Update' : 'Link'}
        </Button>
      </div>
    </div>
  );
}

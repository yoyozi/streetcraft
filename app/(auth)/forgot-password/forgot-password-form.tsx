'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { forgotPassword } from "@/lib/actions/user.actions";
import { toast } from "sonner";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await forgotPassword({ email });
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <Label htmlFor='email'>Email or Mobile Number</Label>
          <Input 
            id='email' 
            type='text' 
            required 
            autoCapitalize="none"
            placeholder="email@example.com or 0821234567"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Button disabled={isLoading} className='w-full' variant='default'>
            { isLoading ? 'Sending...' : 'Send Reset Link' }
          </Button>
        </div>
      </div>
    </form>
  );
}

export default ForgotPasswordForm;
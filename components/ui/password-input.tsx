'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PasswordInputProps {
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  autoComplete?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PasswordInput = ({ 
  id, 
  name, 
  placeholder = "Password", 
  className = "input-field",
  required = false,
  autoComplete = "current-password",
  value,
  onChange
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-gray-500" />
        ) : (
          <Eye className="h-4 w-4 text-gray-500" />
        )}
      </Button>
    </div>
  );
};

// FormField compatible version
interface PasswordInputFormFieldProps {
  field: any;
  placeholder?: string;
  className?: string;
}

export const PasswordInputFormField = ({ field, placeholder = "Password", className = "input-field" }: PasswordInputFormFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        {...field}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className={className}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-gray-500" />
        ) : (
          <Eye className="h-4 w-4 text-gray-500" />
        )}
      </Button>
    </div>
  );
};

export default PasswordInput;
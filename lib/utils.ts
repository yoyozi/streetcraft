import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ZodError } from "zod";
import type { ActionResponse } from '@/types/index'
import qs from 'query-string';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Converts a MongoDB object to a Javascript object
// the <T> is a Typescript generic and is a placeholder for any type that the 
// function might accept when called. The value T is infered on input and the 
// : T is saying to make the T type output the same as input.
export function convertToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
};

// Format number with decimal places, takes in num a type number and returns a string
export function formatNumberWithDecimal(num: number): string {
  // Round to 2 decimal places and convert to fixed string
  return num.toFixed(2);
};


export function formatError(error: unknown): ActionResponse {
  // ---- Zod validation errors ----
  if (error instanceof ZodError) {
    console.error("Zod validation error:", error.issues);
    return {
      success: false,
      message: error.issues.map((i) => i.message).join(", "),
    };
  }

  // ---- MongoDB errors ----
  if (error && typeof error === 'object' && 'name' in error) {
    const mongoError = error as { name: string; code?: number; keyValue?: any };
    console.error("MongoDB error:", mongoError.name, mongoError.code);
    
    if (mongoError.name === 'MongoServerError' && mongoError.code === 11000) {
      // Duplicate key error
      const field = Object.keys(mongoError.keyValue || {})[0];
      return {
        success: false,
        message: `A record with this ${field} already exists.`,
      };
    }
    
    if (mongoError.name === 'ValidationError') {
      return {
        success: false,
        message: `Validation error: ${mongoError.name}`,
      };
    }
    
    return {
      success: false,
      message: `Database error: ${mongoError.name}`,
    };
  }

  // ---- Fallback ----
  console.error("Unexpected error:", error);
  return { success: false, message: "An unexpected error occurred" };
};


// Round munbers to 2 decimal places
export function round2(value: number | string) {
  if (typeof value === 'number'){
    // we *100 then round then /100 and use EPSILON to ensure number is properly rounded
    return Math.round((value + Number.EPSILON) * 100) / 100;
  } else if (typeof value === 'string') {
    // Diff with string is we just wrap it into a number first
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100; 
  } else {
    throw new Error('Value is not a number or a string')
  }
};

// Deterministic currency formatter to avoid Intl locale differences between SSR/CSR
// Formats as: 'R 1234.56' (no thousands separator to keep it simple and stable)
export function formatCurrency(amount: number | string | null) {
  if (amount === null || amount === undefined) return 'R 0.00';

  let num: number;
  if (typeof amount === 'number') {
    num = amount;
  } else if (typeof amount === 'string') {
    num = Number(amount);
  } else {
    return 'R 0.00';
  }

  if (Number.isNaN(num)) return 'R 0.00';
  return `R ${formatNumberWithDecimal(num)}`;
}

//  Format Numbers
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');
export function formatNumber(number: number) {
  return NUMBER_FORMATTER.format(number);
};

// Shorten the UUID - take the id and use the last 6 characters
export function formatId(id: string) {
  return `..${id.substring(id.length - 6)}`;
};

// Format date and time
export const formatDateTime = (dateInput: Date | string | null) => {
  // Guard against null/undefined
  if (!dateInput) {
    return { dateTime: '', dateOnly: '', timeOnly: '' };
  }

  const date = new Date(dateInput);

  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // abbreviated month name (e.g., 'Oct')
    day: 'numeric', // numeric day of the month (e.g., '25')
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
    timeZone: 'UTC', // fix timezone to ensure SSR/CSR consistency
  };
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // numeric year (e.g., '2023')
    day: 'numeric', // numeric day of the month (e.g., '25')
    timeZone: 'UTC',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
    timeZone: 'UTC',
  };
  const formattedDateTime: string = date.toLocaleString(
    'en-ZA',
    dateTimeOptions
  );
  const formattedDate: string = date.toLocaleString(
    'en-ZA',
    dateOptions
  );
  const formattedTime: string = date.toLocaleString(
    'en-ZA',
    timeOptions
  );
  return {
    dateTime: formattedDateTime,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
}; 


// Form Pagination Links
export function formUrlQuery({
  params,
  key,
  value,
}: {
  params: string;
  key: string;
  value: string | null;
}) {
  const query = qs.parse(params);

  query[key] = value;

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query,
    },
    { skipNull: true }
  );
}
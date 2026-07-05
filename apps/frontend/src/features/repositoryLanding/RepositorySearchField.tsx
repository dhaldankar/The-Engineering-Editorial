import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

export interface RepositorySearchFieldProps {
  onDebouncedChange: (query: string) => void;
  debounceMs?: number;
}

/**
 * A search input that emits its value to the parent only after the value
 * has settled for `debounceMs`. Filtering itself is the parent's
 * responsibility — this component owns only the input and debounce timing.
 */
export function RepositorySearchField({ onDebouncedChange, debounceMs = 300 }: RepositorySearchFieldProps) {
  const [rawValue, setRawValue] = useState('');
  const debouncedValue = useDebouncedValue(rawValue, debounceMs);

  useEffect(() => {
    onDebouncedChange(debouncedValue);
    // onDebouncedChange is expected to be stable enough for this effect's purpose;
    // including it would risk re-firing on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return (
    <TextField
      type="search"
      placeholder="Search repositories..."
      size="small"
      value={rawValue}
      onChange={(event) => setRawValue(event.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );
}

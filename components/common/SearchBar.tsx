import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/button';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'Поиск по названию или описанию...',
  className = ''
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={`${styles.searchBar} ${className}`}>
      <div className={styles.searchWrapper}>
        <div className={styles.searchIconWrapper}>
          <Search className={styles.searchIcon} />
        </div>
        <Input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={styles.searchInput}
        />
        {localValue && (
          <div className={styles.clearButtonWrapper}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className={styles.clearButton}
              aria-label="Очистить поиск"
            >
              <X className={styles.clearIcon} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

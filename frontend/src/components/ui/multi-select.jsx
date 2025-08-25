import { useState, useEffect, useRef } from 'react';
import { Search, X, Check, ChevronDown } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { cn } from '../../lib/utils';

export function MultiSelect({
  options = [],
  selectedValues = new Set(),
  onSelectionChange,
  placeholder = "Pilih opsi...",
  searchPlaceholder = "Cari...",
  maxHeight = "max-h-60",
  className = "",
  disabled = false,
  getOptionValue = (option) => option.id,
  getOptionLabel = (option) => option.name,
  getOptionDescription = (option) => option.description,
  getOptionBadge = (option) => null,
  showSelectAll = true,
  showClearAll = true,
  chipVariant = "default"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (getOptionDescription && getOptionDescription(option)?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle option selection
  const handleSelectOption = (option) => {
    const value = getOptionValue(option);
    const newSelected = new Set(selectedValues);
    
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    
    onSelectionChange(newSelected);
    setSearchTerm('');
  };

  // Handle select all
  const handleSelectAll = () => {
    const allValues = new Set(options.map(getOptionValue));
    onSelectionChange(allValues);
  };

  // Handle clear all
  const handleClearAll = () => {
    onSelectionChange(new Set());
  };

  // Handle remove individual option
  const handleRemoveOption = (value) => {
    const newSelected = new Set(selectedValues);
    newSelected.delete(value);
    onSelectionChange(newSelected);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCount = selectedValues.size;
  const isAllSelected = selectedCount === options.length && options.length > 0;

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Selected Values Chips */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {Array.from(selectedValues).map(value => {
            const option = options.find(opt => getOptionValue(opt) === value);
            if (!option) return null;
            
            return (
              <div key={value} className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-sm",
                chipVariant === "default" && "bg-primary/10 text-primary",
                chipVariant === "secondary" && "bg-secondary/10 text-secondary-foreground",
                chipVariant === "outline" && "bg-background border border-input text-foreground"
              )}>
                <span>{getOptionLabel(option)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-current/20"
                  onClick={() => handleRemoveOption(value)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropdown Trigger */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between",
            selectedCount > 0 && "border-primary/50 bg-primary/5"
          )}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className={selectedCount === 0 ? "text-muted-foreground" : ""}>
            {selectedCount === 0 
              ? placeholder 
              : selectedCount === 1 
                ? getOptionLabel(options.find(opt => getOptionValue(opt) === Array.from(selectedValues)[0]))
                : `${selectedCount} item dipilih`
            }
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 overflow-hidden",
          maxHeight
        )}>
          {/* Search Input */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Actions */}
          {(showSelectAll || showClearAll) && (
            <div className="flex gap-2 p-2 border-b bg-muted/30">
              {showSelectAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs h-7"
                  disabled={isAllSelected}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Pilih Semua
                </Button>
              )}
              {showClearAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs h-7"
                  disabled={selectedCount === 0}
                >
                  <X className="h-3 w-3 mr-1" />
                  Hapus Semua
                </Button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                {searchTerm ? 'Tidak ada opsi yang ditemukan' : 'Tidak ada opsi tersedia'}
              </div>
            ) : (
              filteredOptions.map(option => {
                const value = getOptionValue(option);
                const isSelected = selectedValues.has(value);
                const badge = getOptionBadge ? getOptionBadge(option) : null;
                
                return (
                  <div
                    key={value}
                    className={cn(
                      "p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors",
                      isSelected && "bg-primary/10"
                    )}
                    onClick={() => handleSelectOption(option)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {getOptionLabel(option)}
                        </div>
                        {getOptionDescription && (
                          <div className="text-sm text-muted-foreground truncate">
                            {getOptionDescription(option)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {badge && (
                          <Badge variant="outline" className="text-xs">
                            {badge}
                          </Badge>
                        )}
                        {isSelected && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

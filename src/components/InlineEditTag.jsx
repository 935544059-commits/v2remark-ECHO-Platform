import { useState, useRef, useEffect } from 'react';

export default function InlineEditTag({
  variable,
  value,
  options,
  hasParentDependency,
  parentValue,
  isDisabled,
  onValueChange,
  onCancel,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleClick = (e) => {
    e.stopPropagation();
    
    if (isDisabled) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }

    if (variable.uiType === 'input') {
      setIsEditing(true);
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  const handleBlur = () => {
    if (variable.uiType === 'input') {
      if (editValue.trim()) {
        onValueChange(variable.name, editValue.trim());
      } else {
        onValueChange(variable.name, '');
      }
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (editValue.trim()) {
        onValueChange(variable.name, editValue.trim());
      } else {
        onValueChange(variable.name, '');
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      setIsEditing(false);
      onCancel?.();
    }
  };

  const handleSelectChange = (selectedValue) => {
    onValueChange(variable.name, selectedValue);
    setShowDropdown(false);
  };

  const lb = '{{';
  const rb = '}}';
  const displayValue = value || lb + variable.name + rb;
  
  const tagStyle = isDisabled
    ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
    : value
      ? 'bg-blue-600 text-white'
      : 'bg-blue-50 text-blue-600 border border-blue-200';

  if (variable.uiType === 'input' && isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="px-2 py-1 text-sm font-medium bg-white border-b-2 border-blue-500 outline-none min-w-[80px] max-w-[200px]"
        placeholder={'输入' + variable.name}
      />
    );
  }

  return (
    <div className="relative inline-block">
      <span
        onClick={handleClick}
        className={'px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-all min-w-[100px] text-center ' + tagStyle + (isDisabled ? '' : ' hover:opacity-90')}
      >
        {displayValue}
        {!isDisabled && (
          <span className="ml-1 text-xs opacity-70">
            {variable.uiType === 'input' ? '✎' : '▼'}
          </span>
        )}
      </span>

      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-20 whitespace-nowrap">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {'请先选择上级[' + variable.dependsOn + ']'}
          </div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
        </div>
      )}

      {showDropdown && !isDisabled && variable.uiType === 'select' && (
        <div className="absolute top-full left-0 mt-1 min-w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 z-20">
          <div className="p-1">
            <button
              onClick={() => handleSelectChange('')}
              className={'w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded transition-colors ' + (!value ? 'bg-blue-50 text-blue-600' : 'text-gray-600')}
            >
              {lb}{variable.name}{rb}
            </button>
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectChange(option)}
                className={'w-full px-3 py-2 text-left text-sm hover:bg-gray-50 rounded transition-colors ' + (value === option ? 'bg-blue-50 text-blue-600' : 'text-gray-600')}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
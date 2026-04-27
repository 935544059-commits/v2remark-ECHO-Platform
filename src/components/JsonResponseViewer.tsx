import { useState } from 'react';

function JsonResponseViewer({ data, onSelectPath }) {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (path) => {
    setExpanded(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleNodeClick = (path, value) => {
    if (onSelectPath) {
      onSelectPath(path, value);
    }
  };

  const renderValue = (value, path = '') => {
    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }
    if (value === undefined) {
      return <span className="text-gray-500">undefined</span>;
    }
    if (typeof value === 'object') {
      const isArray = Array.isArray(value);
      const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
      const isExpanded = expanded[path];

      return (
        <div className="pl-4 border-l border-gray-200">
          <button
            className="text-blue-600 hover:underline text-xs"
            onClick={() => toggleExpand(path)}
          >
            {isArray ? `Array(${value.length})` : `Object`} {isExpanded ? '▼' : '▶'}
          </button>
          {isExpanded && (
            <div className="mt-2 space-y-2">
              {entries.map(([key, val]) => {
                const newPath = path ? `${path}.${key}` : key.toString();
                return (
                  <div key={key} className="flex items-start gap-2">
                    <span className="text-gray-500 font-mono text-sm">{key}:</span>
                    <div className="flex-1" onClick={() => handleNodeClick(newPath, val)}>
                      {renderValue(val, newPath)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    } else if (typeof value === 'string') {
      return <span className="text-green-600 font-mono text-sm">"{value}"</span>;
    } else if (typeof value === 'number') {
      return <span className="text-blue-600 font-mono text-sm">{value}</span>;
    } else if (typeof value === 'boolean') {
      return <span className="text-purple-600 font-mono text-sm">{value.toString()}</span>;
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[400px]">
      {renderValue(data)}
    </div>
  );
}

export default JsonResponseViewer;
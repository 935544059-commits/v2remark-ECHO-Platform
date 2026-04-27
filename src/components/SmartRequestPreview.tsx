import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

function SmartRequestPreview({ contentType, bodyTemplate, inputMappings, title }) {
  const [previewMode, setPreviewMode] = useState('json');

  useEffect(() => {
    if (contentType === 'multipart/form-data') {
      setPreviewMode('multipart');
    } else if (contentType.includes('application/json')) {
      setPreviewMode('json');
    }
  }, [contentType]);

  const renderJsonPreview = () => {
    try {
      const parsed = JSON.parse(bodyTemplate);
      const formatted = JSON.stringify(parsed, null, 2);
      // 高亮变量
      const highlighted = formatted.replace(/\{\{([^}]+)\}\}/g, '<span class="text-blue-600 font-medium">\{\{$1\}\}</span>');
      return (
        <pre className="font-mono text-sm bg-gray-50 p-4 rounded-lg overflow-auto max-h-[400px]">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      );
    } catch (error) {
      return (
        <div className="font-mono text-sm bg-gray-50 p-4 rounded-lg overflow-auto max-h-[400px] text-red-500">
          JSON 格式错误
        </div>
      );
    }
  };

  const renderMultipartPreview = () => {
    // 模拟生成 multipart/form-data 预览
    const formDataFields = [];
    
    // 遍历输入映射，生成表单字段
    inputMappings.forEach((mapping) => {
      if (mapping.key && mapping.type !== 'Object') {
        formDataFields.push({
          key: mapping.key,
          value: mapping.valueType === 'variable' ? `{{${mapping.value}}}` : mapping.value,
          type: mapping.type === 'File' ? 'Binary' : 'Text'
        });
      }
    });

    return (
      <div className="bg-gray-50 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Key
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value/Type
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {formDataFields.map((field, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {field.key}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>{field.value}</span>
                    {field.type === 'Binary' && (
                      <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                        Binary
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{title}</span>    
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`px-2 py-1 text-xs rounded-md ${previewMode === 'json' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setPreviewMode('json')}
          >
            JSON
          </button>
          <button
            className={`px-2 py-1 text-xs rounded-md ${previewMode === 'multipart' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setPreviewMode('multipart')}
          >
            Form Data
          </button>
        </div>
      </div>
      {previewMode === 'json' ? renderJsonPreview() : renderMultipartPreview()}
    </div>
  );
}

export default SmartRequestPreview;
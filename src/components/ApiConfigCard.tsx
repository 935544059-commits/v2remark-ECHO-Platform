import { useState, useEffect } from 'react';
import { Card, Modal, Button, Input, Select } from 'antd';
import { Plus, Trash2, Eye } from 'lucide-react';
import InputParamsConfig from './InputParamsConfig';
import SmartRequestPreview from './SmartRequestPreview';
import JsonResponseViewer from './JsonResponseViewer';

function ApiConfigCard({ 
  title, 
  config, 
  setConfig, 
  isStep1 = false, 
  extractedVariables = [], 
  setExtractedVariables = () => {},
  onTestSuccess = () => {},
  templateConfig 
}) {
  const [isTested, setIsTested] = useState(false);
  const [testResponse, setTestResponse] = useState(null);
  const [showJsonPathModal, setShowJsonPathModal] = useState(false);
  const [selectedPath, setSelectedPath] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [newVariableName, setNewVariableName] = useState('');

  // 初始化配置
  useEffect(() => {
    if (templateConfig) {
      setConfig({
        ...config,
        apiUrl: templateConfig.apiUrl || '',
        method: templateConfig.method || 'POST',
        headers: templateConfig.headers || [{ key: '', value: '' }],
        contentType: templateConfig.contentType || 'application/json',
        outputVariables: templateConfig.outputVariables || [{ jsonPath: '', variableName: '' }],
        bodyTemplate: templateConfig.bodyTemplate || '{}'
      });
      if (isStep1 && templateConfig.outputVariables) {
        setExtractedVariables(templateConfig.outputVariables.map(v => v.variableName));
      }
    }
  }, [templateConfig, setConfig, isStep1, setExtractedVariables]);

  const handleAddHeader = () => {
    setConfig({
      ...config,
      headers: [...config.headers, { key: '', value: '' }]
    });
  };

  const handleRemoveHeader = (index) => {
    setConfig({
      ...config,
      headers: config.headers.filter((_, i) => i !== index)
    });
  };

  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...config.headers];
    newHeaders[index][field] = value;
    setConfig({
      ...config,
      headers: newHeaders
    });
  };

  const handleAddOutputVariable = () => {
    setConfig({
      ...config,
      outputVariables: [...config.outputVariables, { jsonPath: '', variableName: '' }]
    });
  };

  const handleRemoveOutputVariable = (index) => {
    const variableName = config.outputVariables[index].variableName;
    setConfig({
      ...config,
      outputVariables: config.outputVariables.filter((_, i) => i !== index)
    });
    // 更新提取的变量列表
    setExtractedVariables(prev => prev.filter(v => v !== variableName));
  };

  const handleOutputVariableChange = (index, field, value) => {
    const newVariables = [...config.outputVariables];
    const oldVariableName = newVariables[index].variableName;
    newVariables[index][field] = value;
    setConfig({
      ...config,
      outputVariables: newVariables
    });
    // 如果修改的是变量名，更新提取的变量列表
    if (field === 'variableName' && isStep1) {
      setExtractedVariables(prev => {
        const newList = prev.filter(v => v !== oldVariableName);
        if (value) {
          newList.push(value);
        }
        return newList;
      });
    }
  };

  const handleTest = () => {
    // 模拟测试结果
    const mockResponse = isStep1 ? {
      data: {
        id: 'file_123456',
        url: 'https://example.com/uploads/file_123456.jpg',
        metadata: {
          size: 1024000,
          type: 'image/jpeg',
          name: 'example.jpg'
        }
      },
      status: 'success',
      message: 'File uploaded successfully'
    } : {
      data: {
        answer: '这是一个测试回答',
        title: '测试标题',
        images: []
      },
      status: 'success',
      message: 'Request successful'
    };
    setTestResponse(mockResponse);
    setIsTested(true);
    onTestSuccess(true);
  };

  const handleJsonPathSelect = (path, value) => {
    setSelectedPath(`$.${path}`);
    setSelectedValue(value);
    setNewVariableName('V_' + path.toUpperCase().replace(/[\[\]\.]+/g, '_'));
    setShowJsonPathModal(true);
  };

  const handleAddVariableFromJsonPath = () => {
    if (selectedPath && newVariableName) {
      setConfig({
        ...config,
        outputVariables: [...config.outputVariables, { jsonPath: selectedPath, variableName: newVariableName }]
      });
      if (isStep1) {
        setExtractedVariables(prev => [...prev, newVariableName]);
      }
      setShowJsonPathModal(false);
    }
  };

  return (
    <Card title={title} variant={false}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API 地址</label>
            <input 
              type="text" 
              className="w-full input-light" 
              placeholder={`请输入${isStep1 ? '文件上传' : '主'}接口 API 地址`}
              value={config.apiUrl}
              onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <select 
              className="w-full input-light"
              value={config.method}
              onChange={(e) => setConfig({ ...config, method: e.target.value })}
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content-Type</label>
          <select 
            className="w-full input-light"
            value={config.contentType}
            onChange={(e) => setConfig({ ...config, contentType: e.target.value })}
          >
            <option value="application/json">application/json</option>
            <option value="multipart/form-data">multipart/form-data</option>
            <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Header 配置</label>
          <div className="space-y-2">
            {config.headers.map((header, index) => (
              <div key={index} className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 input-light" 
                  placeholder="Key"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                />
                <input 
                  type="text" 
                  className="flex-1 input-light" 
                  placeholder="Value"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                />
                <button 
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  onClick={() => handleRemoveHeader(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button 
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              onClick={handleAddHeader}
            >
              <Plus className="w-4 h-4" />
              添加 Header
            </button>
          </div>
        </div>
        
        {isStep1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">文件上传 Key</label>
            <input 
              type="text" 
              className="w-full input-light" 
              placeholder="例: file (第三方文件字段名)"
              value={config.fileKey || 'file'}
              onChange={(e) => setConfig({ ...config, fileKey: e.target.value })}
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">变量提取 (Output Variables)</label>
          <div className="space-y-2">
            {config.outputVariables.map((variable, index) => (
              <div key={index} className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 input-light" 
                  placeholder="JSONPath，如 $.data.id"
                  value={variable.jsonPath}
                  onChange={(e) => handleOutputVariableChange(index, 'jsonPath', e.target.value)}
                />
                <input 
                  type="text" 
                  className="flex-1 input-light" 
                  placeholder={`自定义变量名，如 ${isStep1 ? 'V_FILE_ID' : 'V_ANSWER'}`}
                  value={variable.variableName}
                  onChange={(e) => handleOutputVariableChange(index, 'variableName', e.target.value)}
                />
                <button 
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  onClick={() => handleRemoveOutputVariable(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button 
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              onClick={handleAddOutputVariable}
            >
              <Plus className="w-4 h-4" />
              添加变量提取
            </button>
          </div>
        </div>
        
        {/* 入参动态构建 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">入参动态构建</h3>
          <InputParamsConfig 
            extractedVariables={extractedVariables} 
            isStep1={isStep1}
            templateConfig={templateConfig?.inputMappings}
          />
        </div>
        
        {/* 智能请求体预览 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">请求体预览</h3>
          <SmartRequestPreview 
            contentType={config.contentType}
            bodyTemplate={config.bodyTemplate}
            inputMappings={config.inputMappings || []}
            title={`${isStep1 ? '文件上传' : '主'}请求预览`}
          />
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={handleTest}
            className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            测试接口
          </button>
        </div>
        
        {isTested && testResponse && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">测试响应</h4>
            <p className="text-xs text-gray-500 mb-2">点击 JSON 节点以自动生成 JSONPath</p>
            <JsonResponseViewer 
              data={testResponse} 
              onSelectPath={handleJsonPathSelect}
            />
          </div>
        )}
      </div>

      {/* JSONPath 选择模态框 */}
      <Modal
        title="提取变量"
        open={showJsonPathModal}
        onCancel={() => setShowJsonPathModal(false)}
        onOk={handleAddVariableFromJsonPath}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">JSONPath</label>
            <input 
              type="text" 
              className="w-full input-light" 
              value={selectedPath}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">变量名</label>
            <input 
              type="text" 
              className="w-full input-light" 
              value={newVariableName}
              onChange={(e) => setNewVariableName(e.target.value)}
              placeholder={`如 ${isStep1 ? 'V_FILE_ID' : 'V_ANSWER'}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">示例值</label>
            <input 
              type="text" 
              className="w-full input-light" 
              value={selectedValue}
              readOnly
            />
          </div>
        </div>
      </Modal>
    </Card>
  );
}

export default ApiConfigCard;